const { VK_MAP } = require('../constants');

// Mapeamento de Key Name -> VK Code (gerado a partir do VK_MAP)
const KEY_TO_VK = Object.fromEntries(
    Object.entries(VK_MAP).map(([key, vk]) => [key, vk])
);
const { logger } = require('./Logger');

const log = logger.child('MacroService');


const EventEmitter = require('events');

class MacroService extends EventEmitter {
    constructor(windowService, keyListenerService, processProvider) {
        super();
        this.windowService = windowService;
        this.keyListenerService = keyListenerService;
        this.processProvider = processProvider || (() => []);
        // Map<TriggerVk, Array<{pid, actionKey, delay}>>
        this.macros = new Map();
        this.activeJobMap = new Map(); // triggerVk -> { jobId, batchCommands, loop }

        this.initListener();

        // Listen to WindowService events for Node-side looping
        this.windowService.on('job-done', (jobId) => {
            this.handleJobDone(jobId);
        });
    }

    initListener() {
        this.keyListenerService.on('key-event', (event) => {
            if (event.state === 'down') {
                this.checkAndExecute(event.vk);
            }
        });
    }

    handleJobDone(finishedJobId) {
        // Find if this job corresponds to an active looping macro
        for (const [triggerVk, activeJob] of this.activeJobMap.entries()) {
            if (activeJob.jobId === finishedJobId) {
                // It matches. Check if we should loop.
                if (activeJob.loop) {
                    // Re-trigger
                    log.info(`[MACRO] Looping macro ${triggerVk}...`);
                    const newJobId = `macro_${triggerVk}_${Date.now()}`;

                    // Update the map with the new Job ID
                    this.activeJobMap.set(triggerVk, {
                        ...activeJob,
                        jobId: newJobId
                    });

                    // Send again (loop=false because we handle repetition here)
                    this.windowService.sendBatchSequence(newJobId, activeJob.batchCommands, false);
                } else {
                    // Not looping, just cleanup
                    this.activeJobMap.delete(triggerVk);
                }
                this.emitActiveMacrosUpdate(); // Notify change
                break;
            }
        }
    }

    emitActiveMacrosUpdate() {
        const activeMacros = Array.from(this.activeJobMap.keys());
        this.emit('active-macros-update', activeMacros);
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
            // STOP active loop if exists
            if (this.activeJobMap.has(triggerVk)) {
                const { jobId } = this.activeJobMap.get(triggerVk);
                this.windowService.cancelBatchSequence(jobId);
                this.activeJobMap.delete(triggerVk);
                this.emitActiveMacrosUpdate();
                log.info(`[MACRO] Loop cancelado para ${triggerKeyName} (Job: ${jobId})`);
            }

            this.macros.delete(triggerVk);
            log.info(`Macro Global removido para tecla ${triggerKeyName}`);
            return { success: true };
        }
        return { success: false, error: 'Macro não encontrado para esta tecla' };
    }

    async checkAndExecute(pressedVk) {
        // If already running (and potentially looping), do we want to stack start?
        // Usually pressing the trigger again might mean "Restart" or "Stop"?
        // For now, let's assume pressing trigger starts a NEW sequence.
        // If one is already running, maybe we should stop it first to avoid overlap?
        if (this.activeJobMap.has(pressedVk)) {
            const { jobId, loop } = this.activeJobMap.get(pressedVk);
            this.windowService.cancelBatchSequence(jobId);
            this.activeJobMap.delete(pressedVk);
            this.emitActiveMacrosUpdate(); // Notify change
            log.info(`[MACRO] Interrompido macro ${pressedVk} (Job: ${jobId})`);

            // Se era um loop, o usuário provavelmente queria parar (Toggle OFF).
            // Se não era loop, permitimos reiniciar (spamming).
            if (loop) {
                return;
            }
        }

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

                // Register in active map with ORIGINAL commands for looping
                this.activeJobMap.set(pressedVk, {
                    jobId,
                    batchCommands, // Original batch for loops
                    loop
                });
                this.emitActiveMacrosUpdate(); // Notify change

                // OPTIMIZATION: Fast Start
                // If the C# executor sleeps *before* key press, the first command causes input lag.
                // We create a specific batch for the first run where the first delay is 0.
                const firstRunBatch = batchCommands.map((cmd, index) => {
                    if (index === 0) {
                        return { ...cmd, delay: 0 };
                    }
                    return cmd;
                });

                // Send to EXE (Loop=false because Node handles repetition)
                this.windowService.sendBatchSequence(jobId, firstRunBatch, false);
            }
        }
    }

    executeMacroByKey(keyName) {
        const vk = KEY_TO_VK[keyName.toUpperCase()];
        if (vk) {
            this.checkAndExecute(vk);
            return { success: true };
        }
        return { success: false, error: 'Tecla inválida' };
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
