import { ipcMain } from "electron";
import * as accountStorage from '../../services/storage/account.storage.js';
import * as serverStorage from '../../services/storage/servers.storage.js';
import * as settingsStorage from '../../services/storage/settings.storage.js';
import * as accountsGroupStorage from '../../services/storage/account-groups.storage.js';
import * as partiesStorage from '../../services/storage/parties.storage.js';
import * as autoForjaStorage from '../../services/storage/auto-forja.storage.js';

ipcMain.handle('write-accounts-storage', (event, data) => accountStorage.set(data));
ipcMain.handle('get-accounts-storage', (event) => accountStorage.get());
ipcMain.handle('write-servers-storage', (event, data) => serverStorage.set(data));
ipcMain.handle('get-servers-storage', (event) => serverStorage.get());
ipcMain.handle('get-settings', () => settingsStorage.get());
ipcMain.handle('set-settings', (event, data) => settingsStorage.set(data));
ipcMain.handle('get-account-group-storage', (event) => accountsGroupStorage.get());
ipcMain.handle('set-account-group-storage', (event, data) => accountsGroupStorage.set(data));
ipcMain.handle('get-parties-storage', (event) => partiesStorage.get());
ipcMain.handle('set-parties-storage', (event, data) => partiesStorage.set(data));
ipcMain.handle('write-autoforja-storage', (event, data) => autoForjaStorage.set(data));
ipcMain.handle('get-autoforja-storage', (event) => autoForjaStorage.get());

export default {}