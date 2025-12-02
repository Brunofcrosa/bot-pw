import { ipcMain } from 'electron';
import { addPlayingAccounts, removePlayingAccounts } from '../../../services/game-session/game-session.service.js';
import * as playingAccountsStore from '../../../utils/store/playing-accounts.store.js'

ipcMain.on('remove-playing-accounts', (event, id) => removePlayingAccounts(id));
ipcMain.on('add-playing-accounts', (event, account) => addPlayingAccounts(account));
ipcMain.handle('get-playing-accounts', () => {
    return { code: 200, response: playingAccountsStore.get(), success: true };
});

export default {}