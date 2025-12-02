import { app, ipcMain } from 'electron';
import * as store from '../../services/storage/settings.storage.js';
import { getWindows } from '../../utils/shared-variables/shared-variables.js';

async function getDefaultLanguage() {
    const settings = store.get();
    if (settings.response.language) {
        return { success: true, code: 200, response: settings.response.language }
    };
    return { success: true, code: 200, response: 'pt-br' };
}

async function setLanguage(language) {
    console.log('languages changed to:', language);
    const { mainWindow, partiesWindow, minimizedPartyWindow, crashWindows } = getWindows();
    if (mainWindow) {
        mainWindow.webContents.send('on-change-language', language);
    }
    if (partiesWindow) {
        partiesWindow.webContents.send('on-change-language', language);
    }
    if (minimizedPartyWindow) {
        minimizedPartyWindow.webContents.send('on-change-language', language);
    }
    if (crashWindows && crashWindows.length) {
        crashWindows.forEach(crashWindow => {
            crashWindow.webContents.send('on-change-language', language);
        });
    }
}

ipcMain.on('set-language', (event, language) => {
    setLanguage(language);
});
ipcMain.handle('get-default-language', () => getDefaultLanguage());

export default {};