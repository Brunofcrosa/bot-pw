import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import {
    dirname,
    getWindows,
    setToolsBarWindow,
    setListenKeyEvent,
    getListenKeyEvent,
    setAlwaysOnTopTimerToolsBar,
    getAlwaysOnTopTimerToolsBar
} from '../../utils/shared-variables/shared-variables.js';
import * as settingsHandler from '../../utils/store/settings.store.js'; // Verifique se existe 'utils/store'
import startListenKeyEvents from '../../services/listen-key-events/listen-key-events.service.js';

function openToolBar() {
    const { toolsBarWindow, mainWindow } = getWindows();
    if (toolsBarWindow) return;

    const settings = settingsHandler.get();
    const showWindowName = settings?.toolsBar?.showWindowName ?? false;
    // dirname é gerenciado globalmente agora
    const __dirname = dirname; 

    const toolbarWindow = new BrowserWindow({
        width: 400,
        height: showWindowName ? 80 : 50,
        title: `Barra de ferramentas`,
        autoHideMenuBar: true,
        minimizable: false,
        fullscreenable: false,
        maximizable: false,
        skipTaskbar: true,
        minHeight: showWindowName ? 80 : 50,
        minWidth: 300,
        maxWidth: 800,
        maxHeight: showWindowName ? 80 : 50,
        frame: false,
        icon: path.join(__dirname, 'pw-helper-icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
        alwaysOnTop: true,
        transparent: true,
        backgroundColor: '#00000000',
        roundedCorners: true,
    });

    let gkl = getListenKeyEvent();
    if (!gkl) {
        gkl = startListenKeyEvents();
        setListenKeyEvent(gkl);
    }

    if (process.env.NODE_ENV === 'development') {
        toolbarWindow.loadURL(`http://localhost:4200/#/tools-bar`);
        toolbarWindow.webContents.openDevTools();
    } else {
        toolbarWindow.loadFile(
            path.join(__dirname, 'dist/pw-helper/browser/index.html'),
            { hash: `/tools-bar` }
        );
    }
    mainWindow.webContents.send('toolbar-openned');
    setToolsBarWindow(toolbarWindow);

    const interval = setInterval(() => {
        if (toolbarWindow.isVisible() && !toolbarWindow.isMinimized()) {
            toolbarWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    }, 5000);
    setAlwaysOnTopTimerToolsBar(interval);

    toolbarWindow.on('close', () => {
        const { minimizedPartyWindow } = getWindows();
        if (!minimizedPartyWindow) {
            gkl.kill();
            setListenKeyEvent(null);
        }

        const timer = getAlwaysOnTopTimerToolsBar();
        clearInterval(timer);
        setAlwaysOnTopTimerToolsBar(null);
    });
}

function setHorizontalToolbar(event) {
    const { toolsBarWindow } = getWindows();
    if (!toolsBarWindow) return;

    const settings = settingsHandler.get();
    const showWindowName = settings?.toolsBar?.showWindowName ?? false;

    toolsBarWindow.setMinimumSize(300, showWindowName ? 70 : 50);
    toolsBarWindow.setMaximumSize(800, showWindowName ? 70 : 50);
    toolsBarWindow.setSize(400, showWindowName ? 70 : 50);
}

function setVerticalToolbar(event) {
    const { toolsBarWindow } = getWindows();
    if (!toolsBarWindow) return;

    const settings = settingsHandler.get();
    const showWindowName = settings?.toolsBar?.showWindowName ?? false;

    toolsBarWindow.setMinimumSize(showWindowName ? 70 : 50, 300);
    toolsBarWindow.setMaximumSize(showWindowName ? 70 : 50, 800);
    toolsBarWindow.setSize(showWindowName ? 70 : 50, 400);
}

function showWindowNameToolbar(state) {
    const { toolsBarWindow } = getWindows();
    if (!toolsBarWindow) return;
    if (state === 'horizontal') {
        toolsBarWindow.setMinimumSize(300, 70);
        toolsBarWindow.setMaximumSize(800, 70);
        toolsBarWindow.setSize(toolsBarWindow.getSize()[0], 70);
    } else {
        toolsBarWindow.setMinimumSize(70, 300);
        toolsBarWindow.setMaximumSize(70, 800);
        toolsBarWindow.setSize(70, toolsBarWindow.getSize()[1]);
    }
}

function hideWindowNameToolbar(state) {
    const { toolsBarWindow } = getWindows();
    if (!toolsBarWindow) return;
    if (state === 'horizontal') {
        toolsBarWindow.setMinimumSize(300, 50);
        toolsBarWindow.setMaximumSize(800, 50);
        toolsBarWindow.setSize(toolsBarWindow.getSize()[0], 50);
    } else {
        toolsBarWindow.setMinimumSize(50, 300);
        toolsBarWindow.setMaximumSize(50, 800);
        toolsBarWindow.setSize(50, toolsBarWindow.getSize()[1]);
    }
}

function closeToolsBar(event) {
    const { toolsBarWindow, mainWindow } = getWindows();
    if (toolsBarWindow) {
        toolsBarWindow.close();
        setToolsBarWindow(null);
    }
    if (mainWindow) {
        mainWindow.webContents.send('toolbar-closed');
    }
};

ipcMain.on('close-toolbar', () => closeToolsBar())
ipcMain.on('open-toolbar', (event) => {
    openToolBar()
});
ipcMain.on('horizontal-toolbar', (event) => { setHorizontalToolbar() });
ipcMain.on('vertical-toolbar', (event) => { setVerticalToolbar() });
ipcMain.on('show-window-name-toolbar', (event, state) => { showWindowNameToolbar(state) });
ipcMain.on('hide-window-name-toolbar', (event, state) => { hideWindowNameToolbar(state) });

export default {}