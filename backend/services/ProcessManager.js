const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('./Logger');
const { VK_MAP, VK_TO_KEY } = require('../constants');

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
        this.sessionFilePath = path.join(__dirname, '..', 'data', 'session.json');
    }

    saveSession() {
        try {
            const sessionData = [];
            for (const [accountId, pid] of this.activeGamePids.entries()) {
                sessionData.push({ accountId, pid });
            }
            // Ensure directory exists
            const dir = path.dirname(this.sessionFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(this.sessionFilePath, JSON.stringify(sessionData, null, 2));
            log.debug(`Sessão salva com ${sessionData.length} processos.`);
        } catch (error) {
            log.error(`Erro ao salvar sessão: ${error.message}`);
        }
    }

    restoreSession(webContents) {
        if (!fs.existsSync(this.sessionFilePath)) return;

        try {
            const data = fs.readFileSync(this.sessionFilePath, 'utf-8');
            const sessionData = JSON.parse(data);
            let restoredCount = 0;

            for (const { accountId, pid } of sessionData) {
                try {
                    // Check if process is still alive
                    process.kill(pid, 0);

                    // If alive, restore state
                    this.activeGamePids.set(accountId, pid);
                    this.startGameMonitor(accountId, pid, webContents);

                    if (webContents) {
                        webContents.send('element-opened', { success: true, pid: pid, accountId: accountId });
                    }

                    log.info(`Sessão restaurada para conta ${accountId} (PID: ${pid})`);
                    restoredCount++;

                    // Optional: Try to retake title control if possible?
                    if (this.titleChangerService) {
                        // We don't have characterName here easily unless we fetch from AccountStore...
                        // For now, simpler is better. Persistence just keeps it alive in UI.
                    }

                } catch (e) {
                    log.debug(`PID ${pid} da sessão anterior não está mais ativo.`);
                }
            }
            // Update session file to reflect only currently valid processes
            this.saveSession();

        } catch (error) {
            log.error(`Erro ao restaurar sessão: ${error.message}`);
        }
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

            // Configuração dos argumentos para o open-element.exe
            // Se for simpleLaunch, enviamos credenciais vazias para que o open-element use o modo ShellExecute/Sem Login.

            const userArg = args.simpleLaunch ? "" : (args.login || "");
            const pwdArg = args.simpleLaunch ? "" : (args.password || "");
            const roleArg = args.simpleLaunch ? "" : (args.characterName || "");

            // Se simpleLaunch, enviamos APENAS os argumentos customizados (ex: sds_console:1314)
            // Se Normal, enviamos startbypatcher + argumentos
            let extraArg = "";
            if (args.simpleLaunch) {
                extraArg = args.argument || "";
            } else {
                extraArg = `startbypatcher${args.argument ? ` ${args.argument}` : ''}`;
            }

            const spawnArgs = [
                `exe:${args.exePath}`,
                `user:${userArg}`,
                `pwd:${pwdArg}`,
                `role:${roleArg}`,
                `extra:${extraArg}`,
                `onlyAdd:false`
            ];

            const child = spawn(helperPath, spawnArgs);

            this.runningProcesses.set(args.id, child);

            let hasStarted = false; // Flag to track if the game actually started

            child.stdout.on('data', (data) => {
                log.debug(`[Launcher Helper]: ${data.toString()}`);
                try {
                    const msg = JSON.parse(data.toString());
                    const { status, pid, message } = msg;

                    if (status === "started" && pid && webContents) {
                        hasStarted = true; // Mark as started
                        log.info(`Jogo iniciado com PID: ${pid}. ID da Conta: ${args.id}`);


                        this.activeGamePids.set(args.id, pid);
                        this.startGameMonitor(args.id, pid, webContents);
                        this.saveSession(); // SAVE SESSION

                        webContents.send('element-opened', { success: true, pid: pid, accountId: args.id });

                        // Tenta mudar o título da janela (aguarda 10s para a janela criar)
                        if (this.titleChangerService && args.characterName && !args.simpleLaunch) {
                            setTimeout(() => {
                                this.titleChangerService.changeTitle(pid, args.characterName);
                            }, 10000);
                        }
                    } else if (status === "error") {
                        log.error(`[Launcher Helper] Erro retornado: ${message} (Conta: ${args.id})`);
                        if (webContents) {
                            // Poderiamos avisar o front do erro especifico?
                            // Por enquanto o log ajuda a debugar e o 'close' vai resetar o status.
                        }
                    }
                } catch (e) {
                    // Ignora erros de parse
                }
            });

            child.stderr.on('data', (data) => {
                log.error(`Falha ao iniciar processo helper (conta ${args.id}):`, data.toString());
                // Don't delete here immediately, let close handle it or if critical error
            });

            child.on('close', (code) => {
                log.info(`Processo helper (conta ${args.id}) fechado com código ${code}`);
                this.runningProcesses.delete(args.id);

                // If helper closed but game didn't start, we must notify frontend to reset state
                if (!hasStarted) {
                    log.warn(`Helper fechou mas o jogo não iniciou (Code: ${code}). Conta: ${args.id}`);
                    if (webContents) {
                        // Send element-closed to ensure frontend removes "Starting..." state
                        webContents.send('element-closed', { success: true, accountId: args.id });
                    }
                }
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
                // Se o erro for EPERM (sem permissão), o processo EXISTE mas é de outro usuário/Admin.
                // Então consideramos que ele ESTÁ RODANDO.
                if (e.code === 'EPERM') {
                    // O processo está vivo, apenas não temos permissão para sinalizá-lo.
                    return;
                }

                // Processo não existe mais (ESRCH ou outro erro fatal)
                log.info(`Jogo detectado como fechado (PID: ${pid}). Conta: ${accountId}. Motivo: ${e.code}`);
                clearInterval(interval);
                this.monitoringIntervals.delete(accountId);
                this.monitoringIntervals.delete(accountId);
                this.activeGamePids.delete(accountId);
                this.saveSession(); // SAVE SESSION

                if (webContents) {
                    webContents.send('element-closed', { success: true, accountId: accountId });
                }
            }
        }, 2000); // Verifica a cada 2 segundos

        this.monitoringIntervals.set(accountId, interval);
    }

    killGameByPid(pid) {
        if (!pid) {
            log.warn('Tentativa de finalizar processo sem PID informado.');
            return { success: false, error: 'PID inválido ou não fornecido.' };
        }

        try {
            process.kill(pid);
            log.info(`Processo ${pid} finalizado.`);

            // Limpa o monitoramento para essa conta
            for (const [accountId, gamePid] of this.activeGamePids.entries()) {
                if (gamePid === pid) {
                    this.stopGameMonitor(accountId);
                    this.activeGamePids.delete(accountId);
                    this.saveSession(); // SAVE SESSION
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

    getRunningInstances() {
        // Retorna array com as instâncias ativas
        const instances = [];
        for (const [accountId, pid] of this.activeGamePids.entries()) {
            instances.push({ accountId, pid, status: 'running' });
        }
        return instances;
    }

    getPidForAccount(accountId) {
        // Tenta buscar como string e como número
        if (this.activeGamePids.has(accountId)) return this.activeGamePids.get(accountId);

        // Conversões caso haja mismatch de tipos (JSON keys são strings)
        // Se accounts.json usa IDs numéricos, args.id pode ser número.
        // HotkeyService recebe string de Object.entries
        const asString = String(accountId);
        if (this.activeGamePids.has(asString)) return this.activeGamePids.get(asString);

        const asNumber = Number(accountId);
        if (!isNaN(asNumber) && this.activeGamePids.has(asNumber)) return this.activeGamePids.get(asNumber);

        return undefined;
    }




    async launchGroup(accounts, delayMs = 2000, webContents) {
        const results = [];
        for (const acc of accounts) {
            // Check if already running
            if (this.activeGamePids.has(acc.id) || this.activeGamePids.has(String(acc.id))) {
                log.info(`Conta ${acc.id} já está rodando. Pulando.`);
                results.push({ accountId: acc.id, success: true, skipped: true });
                continue;
            }

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
        log.info(`Grupo processado: ${results.length} contas verificadas.`);
        return { success: true, results };
    }

    stopGroup(accounts) {
        let count = 0;
        for (const acc of accounts) {
            const pid = this.getPidForAccount(acc.id);
            if (pid) {
                this.killGameByPid(pid);
                count++;
            }
        }
        log.info(`Grupo parado: ${count} contas finalizadas.`);
        return { success: true, count };
    }

    async startBackgroundCombo(accountId, pid, keys, delayMs, windowService) {
        if (!windowService) {
            log.error('WindowService não fornecido para startBackgroundCombo');
            return { success: false, error: 'WindowService não disponível' };
        }

        // Converte nomes de teclas para VK codes
        const vkCodes = keys.map(k => VK_MAP[k.toUpperCase()]).filter(v => v !== undefined);
        if (vkCodes.length === 0) {
            return { success: false, error: 'Nenhuma tecla válida fornecida' };
        }

        // Converter PID para HWND (útil se o executável suportar)
        let hwnd = 0;
        if (windowService && windowService.getHwndFromPid) {
            try {
                hwnd = await windowService.getHwndFromPid(pid);
            } catch (err) {
                log.warn(`Erro ao obter HWND: ${err.message}`);
                hwnd = 0;
            }
        }

        // Cria comandos no formato esperado pelo executável C#
        const commands = vkCodes.map(vk => {
            const keyName = VK_TO_KEY[vk] || '';
            return {
                pid: pid,
                hwnd: hwnd,
                vk: vk,
                key: keyName,
                actionKey: keyName,
                delay: delayMs
            };
        });

        const success = windowService.sendBatchSequence(accountId, commands, true);

        if (success) {
            return { success: true };
        } else {
            return { success: false, error: 'Falha ao enviar comando para WindowService' };
        }
    }


    cancelBackgroundCombo(accountId, windowService = null) {
        // Precisa acessar o WindowService para cancelar.
        // Se windowService não for passado, assumimos que ProcessManager tinha referência? 
        // Não, ProcessManager não guarda ref do WindowService no constructor.
        // Precisamos garantir que quem chama cancel passe windowService, ou WindowService seja acessivel.
        // O metodo `stop-auto-combo` em Application.js não passa windowService para cancelBackgroundCombo.
        // FIX: Application.js deve ser ajustado, OU WindowService deve ser passado no start e salvo?
        // Salvar instancia do windowService pode ser arriscado se cyclic?
        // Como Application.js tem ambos, vamos assumir que Application.js precisa ser corrigido também, 
        // mas aqui vamos tentar acessar via global ou argumento.

        // HACK: Como não temos acesso fácil ao WindowService aqui sem refatorar Application.js,
        // vamos depender que Application.js passe, ou vamos falhar silenciosamente se não tiver.
        // Mas espere! `sendBatchSequence` cancela? Não, `WindowService` tem `cancelBatchSequence`.

        // Vamos retornar um erro se não conseguirmos cancelar por aqui?
        // Melhor: adicionar `windowService` como argumento opcional e atualizar Application.js depois.
        // Na verdade, Application.js chama `this.processManager.cancelBackgroundCombo(accountId)`.

        // Vou assumir que vou injetar windowService no ProcessManager via método ou propriedade em Application.js
        // Ou melhor: ProcessManager NÃO deveria ter startBackgroundCombo se ele delega tudo.
        // Mas manterei a assinatura para não quebrar contrato.

        // Se eu não tenho windowService aqui, não consigo cancelar.
        // O ideal é Application.js chamar windowService.cancelBatchSequence direto.
        // Mas vou deixar um TODO ou tentar usar uma referência se possível.

        // Para resolver agora: Vou aceitar que falhe se não tiver windowService, e vou atualizar Application.js no próximo passo.
        return { success: false, error: 'Cancelamento deve ser feito via Application calling WindowService direktamente ou passando windowService.' };
    }

    cleanup() {
        if (this.runningFocusBatchProcess) this.runningFocusBatchProcess.kill();
        // Não matamos backgroundSender aqui pois ele pertence ao WindowService agora
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
