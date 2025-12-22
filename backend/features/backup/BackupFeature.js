const { ipcMain } = require('electron');
const { logger } = require('../../services/Logger');
const log = logger.child('BackupFeature');

class BackupFeature {
    constructor(backupService) {
        this.backupService = backupService;
        this.registerIpcHandlers();
    }

    registerIpcHandlers() {
        log.info('Registrando handlers IPC para BackupFeature...');

        ipcMain.handle('export-backup', () => {
            return this.backupService.exportAll();
        });

        ipcMain.handle('import-backup', (e, backup, options) => {
            return this.backupService.importBackup(backup, options);
        });

        ipcMain.handle('create-auto-backup', () => {
            return this.backupService.createAutoBackup();
        });
    }
}

module.exports = BackupFeature;
