const { ipcMain } = require('electron');
const { logger } = require('../../services/Logger');
const log = logger.child('MacroFeature');

class MacroFeature {
    constructor(macroService, macroStore) {
        this.macroService = macroService;
        this.macroStore = macroStore;
        this.registerIpcHandlers();
    }

    registerIpcHandlers() {
        log.info('Registrando handlers IPC para MacroFeature...');

        // Save Presets (Persist to Store)
        ipcMain.handle('save-macro-presets', async (event, presets) => {
            try {
                this.macroStore.savePresets(presets);
                return { success: true };
            } catch (error) {
                log.error('Erro ao salvar presets:', error);
                return { success: false, error: error.message };
            }
        });

        // Get Presets
        ipcMain.handle('get-macro-presets', async () => {
            return this.macroStore.getPresets();
        });

        // Register Active Macro (Runtime)
        ipcMain.handle('register-macro', async (event, { triggerKey, commands, loop }) => {
            return this.macroService.registerMacro(triggerKey, commands, loop);
        });

        // Unregister Macro (Runtime)
        ipcMain.handle('unregister-macro', async (event, triggerKey) => {
            return this.macroService.unregisterMacro(triggerKey);
        });

        // Background Combo Controls
        ipcMain.handle('macro-start-background', async (event, { commands, loop }) => {
            return this.macroService.startBackgroundCombo(commands, loop);
        });

        ipcMain.handle('macro-stop-background', async (event, { jobId } = {}) => {
            return this.macroService.stopBackgroundCombo(jobId);
        });
    }
}

module.exports = MacroFeature;
