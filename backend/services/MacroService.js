const { VK_MAP } = require('../constants');

// Mapeamento de Key Name -> VK Code (gerado a partir do VK_MAP)
const KEY_TO_VK = Object.fromEntries(
    Object.entries(VK_MAP).map(([key, vk]) => [key, vk])
);
const { logger } = require('./Logger');

const log = logger.child('MacroService');


class MacroService {
    constructor(windowService, keyListenerService, processProvider) {
        this.windowService = windowService;
        this.keyListenerService = keyListenerService;
        this.processProvider = processProvider || (() => []);
        // Map<TriggerVk, Array<{pid, actionKey, delay}>>
        this.macros = new Map();

        this.initListener();
    }

    initListener() {
        this.keyListenerService.on('key-event', (event) => {
            if (event.state === 'down') {
                this.checkAndExecute(event.vk);
            }
        });
    }

    registerMacro(triggerKeyName, commands, loop = false) {
        const triggerVk = KEY_TO_VK[triggerKeyName.toUpperCase()];

        if (!triggerVk) {
            log.error(`Tecla desconhecida: ${triggerKeyName}`);
            return { success: false, error: 'Tecla de gatilho inválida' };
        }

        if (!Array.isArray(commands) || commands.length === 0) {
            return { success: false, error: 'Lista de comandos vazia' };
        }

        this.macros.set(triggerVk, { commands, loop });
        log.info(`Macro Global registrado: ${triggerKeyName}(${triggerVk}) -> ${commands.length} comandos, Loop: ${loop}`);

        return { success: true };
    }

    unregisterMacro(triggerKeyName) {
        const triggerVk = KEY_TO_VK[triggerKeyName.toUpperCase()];
        if (this.macros.has(triggerVk)) {
            // If it was valid and had a loop running, we might want to stop it?
            // Current implementation of 'stop' is via stopBackgroundCombo logic but 
            // unregistering just removes the hook response.
            // If loop is handled by background process, we should probably send a stop signal too
            // just in case it's currently running.

            // Generate the jobId used in checkAndExecute to try and stop it?
            // The jobId relies on timestamp, so we can't guess it here easily without storing it.
            // But since 'unregister' means "I don't want to use this key anymore", 
            // clearing the macro from map is enough to stop future executions.
            // If a background loop is running, we might need a way to kill it.
            // For now, let's just delete from map. 
            // The User can use "Stop All" or we can implement tracking of running jobIds per key later if needed.

            this.macros.delete(triggerVk);
            log.info(`Macro Global removido para tecla ${triggerKeyName}`);
            return { success: true };
        }
        return { success: false, error: 'Macro não encontrado para esta tecla' };
    }

    async checkAndExecute(pressedVk) {
        // log.info(`Key pressed: ${pressedVk}`); // Debug raw key
        if (this.macros.has(pressedVk)) {
            const { commands, loop } = this.macros.get(pressedVk);
            log.info(`[MACRO] Executando macro global (${pressedVk}): ${commands.length} comandos`);

            const currentProcesses = this.processProvider();

            // Convert to batch commands for the EXE
            const batchCommands = [];

            for (const cmd of commands) {
                try {
                    const { accountId, actionKey, delay } = cmd;

                    // Dynamic PID Resolution
                    let targetPid = cmd.pid; // Fallback to static PID if no accountId
                    if (accountId) {
                        const process = currentProcesses.find(p => p.accountId === accountId);
                        if (process) {
                            targetPid = process.pid;
                        } else {
                            log.warn(`Conta ${accountId} não encontrada nos processos ativos. Ignorando comando.`);
                            continue;
                        }
                    }

                    if (targetPid && actionKey) {
                        // Resolve HWND if possible
                        let targetHwnd = 0;
                        if (this.windowService.getHwndFromPid) {
                            const h = await this.windowService.getHwndFromPid(targetPid);
                            if (h) targetHwnd = h;
                        }

                        const vk = KEY_TO_VK[actionKey.toUpperCase()];
                        if (vk) {
                            batchCommands.push({
                                pid: targetPid,
                                hwnd: targetHwnd,
                                vk: vk,
                                key: actionKey,
                                actionKey: actionKey,
                                delay: delay || 50
                            });
                        }
                    }
                } catch (err) {
                    log.error(`Erro ao preparar comando do macro: ${err.message}`);
                }
            }

            if (batchCommands.length > 0) {

                const jobId = `macro_${pressedVk}_${Date.now()}`;

                // Send to EXE
                this.windowService.sendBatchSequence(jobId, batchCommands, loop);
            }
        }
    }

    listMacros() {
        const list = [];
        for (const [triggerVk, commands] of this.macros.entries()) {
            list.push({
                triggerVk,
                commands
            });
        }
        return list;
    }

    unregisterAll() {
        this.macros.clear();
        log.info('Todas as macros foram removidas.');
        return { success: true };
    }

    async startBackgroundCombo(commands, loop = false) {
        log.info(`[MACRO] Iniciando combo em segundo plano (Loop: ${loop})`);

        // Resolve PIDs for all commands first
        const currentProcesses = this.processProvider();
        const batchCommands = [];

        for (const cmd of commands) {
            let pid = cmd.pid;

            if (cmd.accountId) {
                const process = currentProcesses.find(p => p.accountId === cmd.accountId);
                if (process) {
                    pid = process.pid;
                }
            }

            if (pid) {
                batchCommands.push({
                    pid,
                    actionKey: cmd.actionKey,
                    delay: cmd.delay || 100 // Default delay
                });
            }
        }

        if (batchCommands.length === 0) {
            return { success: false, error: 'Nenhum processo válido encontrado para o combo.' };
        }

        const jobId = Date.now().toString(); // Simple ID generation
        this.windowService.sendBatchSequence(jobId, batchCommands, loop);

        return { success: true, jobId };
    }

    stopBackgroundCombo(jobId) {
        if (jobId) {
            this.windowService.cancelBatchSequence(jobId);
        } else {
            this.windowService.stopAllBackground();
        }
        return { success: true };
    }
}

module.exports = MacroService;
