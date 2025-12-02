import { BrowserWindow, ipcMain } from 'electron';
import * as partyHandle from '../../../utils/store/party.store.js'; // Corrigido
import path from 'path';
import fs from 'fs';
import startListenKeyEvents from '../../../services/listen-key-events/listen-key-events.service.js'; // Corrigido
import {
    getWindows,
    setListenKeyEvent,
    setMinimizedPartiesWindow,
    getListenKeyEvent,
    setAlwaysOnTopTimerMinimizedPartyWindow,
    getAlwaysOnTopTimerMinimizedPartyWindow,
    dirname
} from '../../../utils/shared-variables/shared-variables.js'; // Corrigido
import * as applicationStorage from '../../../services/storage/application.storage.js'; // Corrigido
import CONFIGS from '../../../services/storage/storage.config.js'; // Corrigido

function openMinimizedPartyWindowHandler(parties, dirname) {
    let { partiesWindow, minimizedPartyWindow } = getWindows();
    if (minimizedPartyWindow) {
        minimizedPartyWindow.show()
    } else {
        if (partiesWindow) {
            partiesWindow.hide();
        }

        partyHandle.set(parties);
        minimizedPartyWindow = openMinimizedPartyWindow(path.join(dirname, 'preload.js'), path.join(dirname, 'dist/pw-helper/browser/index.html'), parties);
        setMinimizedPartiesWindow(minimizedPartyWindow);
        let gkl = getListenKeyEvent();
        if (!gkl) {
            gkl = startListenKeyEvents();
            setListenKeyEvent(gkl);
        }

        minimizedPartyWindow.on('close', async function (event) {
            let { toolsBarWindow } = getWindows();
            let timer = getAlwaysOnTopTimerMinimizedPartyWindow();
            clearInterval(timer);
            setAlwaysOnTopTimerMinimizedPartyWindow(null);
            await savePositionAndSize(minimizedPartyWindow);
            if (!toolsBarWindow) {
                const keyListener = getListenKeyEvent();
                if (keyListener) keyListener.kill();
                setListenKeyEvent(null);
            }
            if (partiesWindow) {
                partiesWindow.show();
            }
            minimizedPartyWindow = null;
            setMinimizedPartiesWindow(null)
            partyHandle.remove();
        });
    }
}

function savePositionAndSize(minimizedPartyWindow) {
    return new Promise((resolve) => {
        if (!minimizedPartyWindow) return resolve();
        const bounds = minimizedPartyWindow.getBounds();
        const position = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
        };
        let folderPath = path.join(CONFIGS.filePath, CONFIGS.folderName, CONFIGS.applicationName);

        if (!fs.existsSync(path.dirname(folderPath))) {
            fs.mkdirSync(path.dirname(folderPath), { recursive: true });
        }

        let data = {};
        if (fs.existsSync(folderPath)) {
            try {
                const rawData = fs.readFileSync(folderPath, 'utf-8');
                data = JSON.parse(rawData);
            } catch (e) {
                data = {};
            }
        }

        const newData = { ...data, ...position };
        fs.writeFileSync(folderPath, JSON.stringify(newData), 'utf-8');
        resolve();
    })
}

function openMinimizedPartyWindow(preloadPath, minimizedPartyWindowPath, parties) {
    let name;
    if (parties.length > 1) {
        name = parties.map(party => party.name).join(', ')
    } else {
        name = parties[0].name
    }
    let folderPath = path.join(CONFIGS.filePath, CONFIGS.folderName, CONFIGS.applicationName);
    let data = null;
    if (fs.existsSync(folderPath)) {
        const rawData = fs.readFileSync(folderPath);
        data = JSON.parse(rawData);
    }
    const minHeight = 266 + (40 * (parties.length - 1));
    let minimizedPartyWindow = new BrowserWindow({
        modal: false,
        width: data?.width ?? 290,
        height: (data?.height ?? 450) < minHeight ? minHeight : data?.height ?? 450,
        x: data?.x,
        y: data?.y,
        title: name,
        autoHideMenuBar: true,
        resizable: true,
        maximizable: false,
        minWidth: 220,
        minHeight,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            preload: preloadPath,
            contextIsolation: true,
        },
        alwaysOnTop: true,
    });

    minimizedPartyWindow.removeMenu();

    const interval = setInterval(() => {
        if (minimizedPartyWindow && minimizedPartyWindow.isVisible() && !minimizedPartyWindow.isMinimized()) {
            minimizedPartyWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    }, 5000);
    setAlwaysOnTopTimerMinimizedPartyWindow(interval);

    if (process.env.NODE_ENV === 'development') {
        minimizedPartyWindow.loadURL(`http://localhost:4200/#/party/minimized/123`);
        minimizedPartyWindow.webContents.openDevTools();
    } else {
        minimizedPartyWindow.loadFile(
            minimizedPartyWindowPath,
            { hash: `/party/minimized/123` }
        );
    }

    minimizedPartyWindow.once('ready-to-show', () => {
        minimizedPartyWindow.show();
    });
    return minimizedPartyWindow
}

ipcMain.on('open-minimized-party-window', (event, parties) => {
    const __dirname = dirname;
    openMinimizedPartyWindowHandler(parties, __dirname);
});

ipcMain.handle('get-minimized-party', (event, party) => {
    const parties = partyHandle.get();
    if (parties) {
        return { code: 200, response: parties, success: true };
    } else {
        return { code: 404, response: null, success: false };
    }
});
ipcMain.on('close-minimized-party', () => {
    const { minimizedPartyWindow } = getWindows();
    if (minimizedPartyWindow) minimizedPartyWindow.close();
});
ipcMain.on('minimize-party', () => {
    const { minimizedPartyWindow } = getWindows();
    if (minimizedPartyWindow) minimizedPartyWindow.minimize();
});

ipcMain.on('play-by-minimized-party', (event, id) => {
    const { mainWindow } = getWindows();
    if (mainWindow) mainWindow.webContents.send('play-by-minimized-party', { id });
});

export default {};