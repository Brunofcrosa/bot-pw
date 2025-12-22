const { ipcMain } = require('electron');
const { logger } = require('../../services/Logger');
const log = logger.child('AutoForgeFeature');

class AutoForgeFeature {
    constructor(autoForgeService) {
        this.autoForgeService = autoForgeService;
        this.registerIpcHandlers();
    }

    registerIpcHandlers() {
        log.info('Registrando handlers IPC para AutoForgeFeature...');

        ipcMain.on('start-auto-forge', (event, config) => {
            // WebContents can be retrieved from event.sender
            this.autoForgeService.start(config, event.sender);
        });

        ipcMain.on('stop-auto-forge', () => {
            this.autoForgeService.stop();
        });

        ipcMain.handle('is-auto-forge-running', () => {
            return this.autoForgeService.isRunning();
        });

        // Add other IPCs from original Application.js or help/features if needed
    }
}

module.exports = AutoForgeFeature;
