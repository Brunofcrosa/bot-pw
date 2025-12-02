import { BrowserWindow, ipcMain } from "electron";
import { dirname, getListenKeyEvent, getRunningAutoForjaProccess, getWindows, setAutoForjaPlayWindow, setAutoForjaWindow, setListenKeyEvent, setRunningAutoForjaProccess } from "../../utils/shared-variables/shared-variables.js";
import path from "path";
import { play, startScript, stop } from "../../services/auto-forja/auto-forja.service.js";
import * as autoForjaStore from '../../utils/store/auto-forja.store.js'; // Verifique se essa pasta 'utils/store' existe!
import startListenKeyEvents from "../../services/listen-key-events/listen-key-events.service.js";

function openAutoForjaWindow() {
    const window = new BrowserWindow({
        width: 400,
        height: 623,
        frame: false,
        resizable: false,
        autoHideMenuBar: true,
        maximizable: false,
        alwaysOnTop: true,
        title: 'PW Helper - Auto Forja',
        icon: path.join(dirname, 'pw-helper-icon.ico'),
        webPreferences: {
            preload: path.join(dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    setAutoForjaWindow(window);

    if (process.env.NODE_ENV === 'development') {
        window.loadURL('http://localhost:4200/#/auto-forja');
        window.webContents.openDevTools();
    } else {
        window.loadFile(path.join(dirname, 'dist/pw-helper/browser/index.html'), { hash: `/auto-forja` });
    }
}

function playAutoForjaWindow() {
    const window = new BrowserWindow({
        width: 400,
        height: 80,
        frame: false,
        resizable: false,
        autoHideMenuBar: true,
        maximizable: false,
        alwaysOnTop: true,
        title: 'Auto Forja',
        icon: path.join(dirname, 'pw-helper-icon.ico'),
        webPreferences: {
            preload: path.join(dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    setAutoForjaPlayWindow(window);
    startScript();

    let gkl = getListenKeyEvent();
    if (!gkl) {
        gkl = startListenKeyEvents();
        setListenKeyEvent(gkl);
    }

    if (process.env.NODE_ENV === 'development') {
        window.loadURL('http://localhost:4200/#/auto-forja/play');
        window.webContents.openDevTools();
    } else {
        window.loadFile(path.join(dirname, 'dist/pw-helper/browser/index.html'), { hash: `/auto-forja/play` });
    }

    window.on('close', () => {
        gkl.kill();
        setListenKeyEvent(null);
    });
}

ipcMain.on('open-auto-forja', () => {
    const { autoForjaWindow } = getWindows();
    if (autoForjaWindow) {
        autoForjaWindow.focus();
    } else {
        openAutoForjaWindow();
    }
});

ipcMain.on('close-auto-forja', () => {
    const { autoForjaWindow } = getWindows();
    if (autoForjaWindow) {
        autoForjaWindow.close();
        setAutoForjaWindow(null);
    }
});

ipcMain.on('start-auto-forja', (event, config) => {
    play(config)
});

ipcMain.on('stop-auto-forja', (event, config) => {
    stop(config)
});

ipcMain.on('open-player-auto-forja', (event, data) => {
    const { autoForjaWindow } = getWindows();
    autoForjaStore.set(data);
    playAutoForjaWindow();
    if (autoForjaWindow) {
        autoForjaWindow.hide();
    }
});

ipcMain.on('close-player-auto-forja', () => {
    const { autoForjaPlayWindow, autoForjaWindow } = getWindows();
    const script = getRunningAutoForjaProccess();
    if (autoForjaPlayWindow) {
        autoForjaPlayWindow.close();
        setAutoForjaPlayWindow(null);
    }
    if (script) {
        script.kill();
        setRunningAutoForjaProccess(null);
    }
    if (autoForjaWindow) {
        autoForjaWindow.show();
    }
});

ipcMain.handle('get-auto-forja-configs', () => {
    const data = autoForjaStore.get();
    return { code: 200, response: data, success: true };
});

export default {};