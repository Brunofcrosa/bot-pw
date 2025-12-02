import { BrowserWindow } from "electron";
import path from 'path';
import { removePlayingAccounts } from "../../../shared/services/game-session/game-session.service.js";
import { addCrashWindow } from "../../../shared/utils/shared-variables/shared-variables.js";

export function openCrashWindow(id, dirname) {
    const crashWindow = new BrowserWindow({
        modal: false,
        width: 300,
        height: 150,
        title: `Alerta de reportbug!`,
        autoHideMenuBar: true,
        resizable: false,
        skipTaskbar: true,
        frame: false,
        icon: path.join(dirname, 'pw-helper-icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    addCrashWindow(crashWindow);

    if (process.env.NODE_ENV === 'development') {
        crashWindow.loadURL(`http://localhost:4200/#/crash-window?accountId=${id}&windowId=${crashWindow.id}`);
    } else {
        crashWindow.loadFile(
            path.join(dirname, 'dist/pw-helper/browser/index.html'),
            { hash: `/crash-window?accountId=${id}&windowId=${crashWindow.id}` }
        );
    }

    crashWindow.on('ready-to-show', () => {
        crashWindow.show();
        crashWindow.focus();
        crashWindow.setAlwaysOnTop(true);
        crashWindow.flashFrame(true)
    });

    crashWindow.on('close', (event) => {
        removePlayingAccounts(id)
    })
}

export default {}