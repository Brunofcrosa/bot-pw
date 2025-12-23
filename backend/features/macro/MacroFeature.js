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
        ipcMain.handle('unregister-macro', (event, triggerKeyName) => {
            return this.macroService.unregisterMacro(triggerKeyName);
        });

        // Handler to get initial state
        ipcMain.handle('macro-get-active', () => {
            // We need to return the list.
            // Converting iterator to array for transport.
            // activeJobMap is private/internal, so we should probable add a getter method in MacroService 
            // or just use Array.from(this.macroService.activeJobMap.keys()) if accessible.
            // Since activeJobMap is a property on the instance:
            return Array.from(this.macroService.activeJobMap.keys());
        });

        // Forward updates to frontend
        this.macroService.on('active-macros-update', (activeMacros) => {
            this.sendToAllWindows('macro-status-update', activeMacros);
        });

        // Background Combo Controls
        ipcMain.handle('macro-start-background', async (event, { commands, loop }) => {
            return this.macroService.startBackgroundCombo(commands, loop);
        });

        ipcMain.handle('macro-stop-background', async (event, { jobId } = {}) => {
            return this.macroService.stopBackgroundCombo(jobId);
        });
    }

    sendToAllWindows(channel, ...args) {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach(win => {
            if (win.webContents) {
                win.webContents.send(channel, ...args);
            }
        });
    }
}

module.exports = MacroFeature;
