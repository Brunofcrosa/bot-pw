const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('./Logger');

const log = logger.child('ProcessManager');

class ProcessManager {
    constructor(executablesPath, titleChangerService) {
        this.executablesPath = executablesPath;
        this.titleChangerService = titleChangerService;
        this.runningProcesses = new Map(); // Map<accountId, ChildProcess>
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
                if (webContents) {
                    webContents.send('element-closed', { success: true, accountId: args.id });
                }
            });

            return { success: true, pid: child.pid, accountId: args.id };

        } catch (error) {
            log.error('Falha ao executar launchGame:', error);
            return { success: false, error: error.message };
        }
    }

    killGameByPid(pid) {
        try {
            process.kill(pid);
            log.info(`Processo ${pid} finalizado.`);

            for (const [id, child] of this.runningProcesses.entries()) {
                if (child.pid === pid) {
                    this.runningProcesses.delete(id);
                }
            }
            return { success: true, closedPid: pid };
        } catch (error) {
            if (error.code !== 'ESRCH') {
                log.error(`Falha ao finalizar processo ${pid}: ${error.message}`);
            }
            return { success: false, error: error.message };
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
        log.info('Processos auxiliares e de jogo encerrados.');
    }

    killAll() {
        this.cleanup();
    }
}

module.exports = { ProcessManager };
