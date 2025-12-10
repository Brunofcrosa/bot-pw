const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('./Logger');

const log = logger.child('ProcessManager');

class ProcessManager {
    constructor(executablesPath, titleChangerService) {
        this.executablesPath = executablesPath;
        this.titleChangerService = titleChangerService;
        this.runningProcesses = new Map(); // Map<accountId, HelperChildProcess>
        this.activeGamePids = new Map(); // Map<accountId, GamePID>
        this.monitoringIntervals = new Map(); // Map<accountId, IntervalID>
        this.runningFocusBatchProcess = null;
        this.runningBackgroundFocusBatchProcess = null;
        this.runningFocusByPidProcess = null;
        this.crashMonitorInterval = null;
    }

    _spawnHelper(exeName, onDataCallback) {
        const exePath = path.join(this.executablesPath, exeName);
        if (!fs.existsSync(exePath)) {
            log.error(`Executável '${exeName}' não encontrado em ${exePath}`);
            return null;
        }

        const process = spawn(exePath);

        process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const msg = JSON.parse(line);
                    if (onDataCallback) onDataCallback(msg);
                } catch (err) {
                    // Ignora linhas que não são JSON válido
                }
            }
        });

        log.info(`Script C# "${exeName}" iniciado.`);
        return process;
    }

    startFocusHelpers() {
        this.runningFocusBatchProcess = this._spawnHelper(
            'focus-window-batch.exe',
            (msg) => log.debug('[focus-batch]', msg)
        );

        this.runningBackgroundFocusBatchProcess = this._spawnHelper(
            'background-focus-window-batch.exe',
            (msg) => log.debug('[background-focus-batch]', msg)
        );

        this.runningFocusByPidProcess = spawn(path.join(this.executablesPath, 'focus-window-by-pid.exe'));
        this.runningFocusByPidProcess.stdin.setDefaultEncoding('utf-8');
        log.info('Script C# "focus-window-by-pid.exe" iniciado.');

        this.startCrashMonitor();
    }

    startCrashMonitor() {
        const { exec } = require('child_process');
        if (this.crashMonitorInterval) clearInterval(this.crashMonitorInterval);

        // Verifica a cada 10 segundos
        this.crashMonitorInterval = setInterval(() => {
            exec('tasklist /FI "IMAGENAME eq creportbugs.exe" /FO CSV /NH', (err, stdout) => {
                if (err) return;
                const output = stdout.toString();
                if (output && output.includes('creportbugs.exe')) {
                    log.warn('CRASH DETECTADO: creportbugs.exe está rodando!');
                }
            });
        }, 10000);
    }

    sendFocusPid(pid) {
        if (!pid) {
            log.warn('sendFocusPid chamado sem PID.');
            return;
        }
        if (this.runningFocusByPidProcess && this.runningFocusByPidProcess.stdin) {
            log.debug(`Solicitando foco (via C#) para PID: ${pid}`);
            this.runningFocusByPidProcess.stdin.write(`${pid}\n`);
        } else {
            log.error('Erro: "focus-window-by-pid.exe" não está rodando.');
        }
    }

    launchGame(args, webContents) {
        try {
            const helperExe = 'open-element.exe';
            const helperPath = path.join(this.executablesPath, helperExe);

            if (!fs.existsSync(helperPath)) {
                return { success: false, error: 'Executável auxiliar open-element.exe não encontrado.' };
            }

            // Argumentos para o open-element.exe (formato key:value)
            const spawnArgs = [
                `exe:${args.exePath}`,
                `user:${args.login}`,
                `pwd:${args.password}`,
                `role:${args.characterName || ''}`,
                `extra:startbypatcher${args.argument ? ` ${args.argument}` : ''}`,
                `onlyAdd:false`
            ];

            const child = spawn(helperPath, spawnArgs);

            this.runningProcesses.set(args.id, child);

            child.stdout.on('data', (data) => {
                log.debug(`[Launcher Helper]: ${data.toString()}`);
                try {
                    const { status, pid } = JSON.parse(data.toString());
                    if (status === "started" && pid && webContents) {
                        log.info(`Jogo iniciado com PID: ${pid}. ID da Conta: ${args.id}`);

                        this.activeGamePids.set(args.id, pid);
                        this.startGameMonitor(args.id, pid, webContents);

                        webContents.send('element-opened', { success: true, pid: pid, accountId: args.id });

                        // Tenta mudar o título da janela (aguarda 10s para a janela criar)
                        if (this.titleChangerService && args.characterName) {
                            setTimeout(() => {
                                this.titleChangerService.changeTitle(pid, args.characterName);
                            }, 10000);
                        }
                    }
                } catch (e) {
                    // Ignora erros de parse
                }
            });

            child.stderr.on('data', (data) => {
                log.error(`Falha ao iniciar processo helper (conta ${args.id}):`, data.toString());
                this.runningProcesses.delete(args.id);
            });

            child.on('close', (code) => {
                log.info(`Processo helper (conta ${args.id}) fechado com código ${code}`);
                this.runningProcesses.delete(args.id);
                // NÃO envia element-closed aqui se for código 0, pois o jogo continua rodando.
                // O monitoramento via PID cuidará de avisar quando o jogo fechar.
            });

            return { success: true, pid: child.pid, accountId: args.id };

        } catch (error) {
            log.error('Falha ao executar launchGame:', error);
            return { success: false, error: error.message };
        }
    }

    startGameMonitor(accountId, pid, webContents) {
        if (this.monitoringIntervals.has(accountId)) {
            clearInterval(this.monitoringIntervals.get(accountId));
        }

        const interval = setInterval(() => {
            try {
                // process.kill(pid, 0) lança erro se o processo não existe
                process.kill(pid, 0);
            } catch (e) {
                // Processo não existe mais
                log.info(`Jogo detectado como fechado (PID: ${pid}). Conta: ${accountId}`);
                clearInterval(interval);
                this.monitoringIntervals.delete(accountId);
                this.activeGamePids.delete(accountId);

                if (webContents) {
                    webContents.send('element-closed', { success: true, accountId: accountId });
                }
            }
        }, 2000); // Verifica a cada 2 segundos

        this.monitoringIntervals.set(accountId, interval);
    }

    killGameByPid(pid) {
        try {
            process.kill(pid);
            log.info(`Processo ${pid} finalizado.`);

            // Limpa o monitoramento para essa conta
            for (const [accountId, gamePid] of this.activeGamePids.entries()) {
                if (gamePid === pid) {
                    this.stopGameMonitor(accountId);
                    this.activeGamePids.delete(accountId);
                    break;
                }
            }

            return { success: true, closedPid: pid };
        } catch (error) {
            if (error.code !== 'ESRCH') {
                log.error(`Falha ao finalizar processo ${pid}: ${error.message}`);
            }
            // Se falhou pq não existe (ESRCH), ainda consideramos "fechado"
            return { success: true, closedPid: pid };
        }
    }

    stopGameMonitor(accountId) {
        if (this.monitoringIntervals.has(accountId)) {
            clearInterval(this.monitoringIntervals.get(accountId));
            this.monitoringIntervals.delete(accountId);
        }
    }

    async launchGroup(accounts, delayMs = 2000, webContents) {
        const results = [];
        for (const acc of accounts) {
            const result = this.launchGame({
                id: acc.id,
                exePath: acc.exePath,
                login: acc.login,
                password: acc.password,
                characterName: acc.characterName,
                argument: acc.argument
            }, webContents);

            results.push({ accountId: acc.id, ...result });

            // Delay não bloqueante
            await new Promise(r => setTimeout(r, delayMs));
        }
        log.info(`Grupo processado: ${results.length} contas iniciadas.`);
        return { success: true, results };
    }

    cleanup() {
        if (this.runningFocusBatchProcess) this.runningFocusBatchProcess.kill();
        if (this.runningBackgroundFocusBatchProcess) this.runningBackgroundFocusBatchProcess.kill();
        if (this.runningFocusByPidProcess) this.runningFocusByPidProcess.kill();
        if (this.crashMonitorInterval) clearInterval(this.crashMonitorInterval);

        // Limpa todos os monitores
        for (const interval of this.monitoringIntervals.values()) {
            clearInterval(interval);
        }
        this.monitoringIntervals.clear();

        log.info('Processos auxiliares e de jogo encerrados.');
    }

    killAll() {
        this.cleanup();
    }
}

module.exports = { ProcessManager };
