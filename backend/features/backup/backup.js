import { ipcMain } from "electron";
import * as backupService from '../../services/backup/backup.service.js';

ipcMain.handle('backup', (_, data) => backupService.backup(data));
ipcMain.handle('get-backups-list', (_, data) => backupService.listBackups(data));
ipcMain.handle('restore', (_, backupText, options, backupPath) => backupService.restore(backupText, options, backupPath));
ipcMain.handle('get-backup-default-path', () => backupService.getBackupDefaultPath());

export default {};