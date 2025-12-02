import { BrowserWindow, Menu, Tray, app, ipcMain } from "electron";
import path from 'path';
import { dirname, setMainWindow, getWindows } from "../../utils/shared-variables/shared-variables.js"; // Corrigido
import * as store from "../../utils/store/store-wrapper.store.js"; // Corrigido
import * as settingsStore from "../../utils/store/settings.store.js"; // Corrigido
import { preventReload } from "../../services/prevent-reload/prevent-reload.service.js"; // Corrigido
import { saveHwid } from "../auth/hwid.js"; // Verifique se auth existe ou remova se não usar

let isQuitting = false;
let tray;

export function start() {
    // sendEvent('app_started');

    const __dirname = dirname;

    let loadingWindow = new BrowserWindow({
        width: 300,
        height: 200,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false
    });
    if (process.env.NODE_ENV === 'development') {
        loadingWindow.loadFile('loading-without-angular.html', {
            query: { lang: 'en' }
        });
        loadingWindow.webContents.openDevTools();
    } else {
        // Fallback robusto para produção
        const loadingPath = path.join(process.resourcesPath, 'loading-without-angular.html');
        loadingWindow.loadFile(loadingPath, {
            query: { lang: 'en' }
        }).catch(() => {
             loadingWindow.loadFile(path.join(__dirname, 'loading-without-angular.html'), { query: { lang: 'en' } });
        });
    }
    
    // saveHwid(); // Descomente se tiver a feature auth configurada

    const mainWindow = new BrowserWindow({
        width: 992,
        height: 600,
        frame: false,
        resizable: false,
        autoHideMenuBar: true,
        maximizable: false,
        show: false,
        title: 'PW Helper',
        icon: path.join(__dirname, 'pw-helper-icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            if (!loadingWindow.isDestroyed()) loadingWindow.close();
            mainWindow.show();
        }, 1000)
    });

    setMainWindow(mainWindow);
    store.clearAll();
    mainWindow.removeMenu();
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
        mainWindow.loadURL('http://localhost:4200'); 
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/pw-helper/browser/index.html'));
    }

    mainWindow.on('close', function (event) {
        const { partiesWindow, minimizedPartyWindow } = getWindows();
        const settings = settingsStore.get();
        if (settings?.background && !isQuitting) { // Check de segurança para settings
            event.preventDefault();
            buildTray(mainWindow)
            mainWindow.hide();
            return;
        }
        if (partiesWindow) {
            partiesWindow.close();
        }
        if (minimizedPartyWindow) {
            minimizedPartyWindow.close();
        }
    });
    mainWindow.webContents.on('before-input-event', preventReload);
}

function buildTray(mainWindow) {
    const __dirname = dirname;
    const iconPath = process.env.NODE_ENV === 'development' ? path.join(__dirname, 'pw-helper-icon.ico') : path.join(process.resourcesPath, 'pw-helper-icon.ico');

    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Mostrar App', click: () => {
                mainWindow.show();
                tray.destroy();
            }
        },
        {
            label: 'Sair', click: () => {
                const { partiesWindow, minimizedPartyWindow } = getWindows();
                if (partiesWindow) {
                    partiesWindow.close();
                }
                if (minimizedPartyWindow) {
                    minimizedPartyWindow.close();
                }
                tray.destroy();
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('PW Helper');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show();
            tray.destroy();
        }
    });
}

export function startAppInstance(createWindowFunc) {
    app.setAppUserModelId('com.pw.helper');

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', (event, argv, workingDirectory) => {
            const { mainWindow } = getWindows();
            if (!mainWindow) {
                return;
            }
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
                if(tray && !tray.isDestroyed()) tray.destroy();
            }
        });
    }
    app.on('ready', createWindowFunc);
}


ipcMain.on('minimize-main-window', () => {
    const { mainWindow } = getWindows();
    if(mainWindow) mainWindow.minimize();
});
ipcMain.on('close-main-window', () => {
    const { mainWindow } = getWindows();
    if(mainWindow) mainWindow.close();
});

export default {}