import { BrowserWindow, ipcMain } from 'electron';
import {
    setPartiesWindow,
    getWindows,
    dirname,
    setRunningProccessBatch,
    getWebsocketMirror,
    getRunningProccessBatch,
    getRunningFocusByPidProccess,
    setRunningFocusByPidProccess,
    getRunningBackgroundProccessBatch,
    setRunningBackgroundProccessBatch
} from '../../../utils/shared-variables/shared-variables.js';
import path from 'path';
import { startBackgroundFocusBatchScript, startFocusBatchScript } from '../../../services/focus/focus-initialization/focus-initialization.service.js';

function openPartiesWindow(preloadPath, partiesWindowPath, tutorialActivated) {
    let { partiesWindow, minimizedPartyWindow } = getWindows();
    if (partiesWindow) {
        if (minimizedPartyWindow) {
            minimizedPartyWindow.show();
        } else {
            partiesWindow.show();
        }
    } else {
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
            // Em produção, os recursos geralmente estão no resourcesPath ou na raiz
            const loadingPath = path.join(process.resourcesPath, 'loading-without-angular.html');
            // Fallback se não estiver no resourcesPath
            loadingWindow.loadFile(loadingPath, {
                query: { lang: 'en' }
            }).catch(() => {
                 loadingWindow.loadFile(path.join(dirname, 'loading-without-angular.html'), { query: { lang: 'en' } });
            });
        }
        loadingWindow.once('ready-to-show', () => {
            loadingWindow.show();
        });

        partiesWindow = new BrowserWindow({
            modal: false,
            width: 930,
            height: 600,
            title: 'Modo Grupo',
            autoHideMenuBar: true,
            frame: false,
            show: false,
            maximizable: false,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                preload: preloadPath,
                contextIsolation: true,
            },
        });

        partiesWindow.removeMenu();

        if (process.env.NODE_ENV === 'development') {
            partiesWindow.loadURL(`http://localhost:4200/#/party?tutorialActivated=${tutorialActivated}`);
            partiesWindow.webContents.openDevTools();
        } else {
            partiesWindow.loadFile(
                partiesWindowPath,
                { hash: `/party?tutorialActivated=${tutorialActivated}` }
            );
        }

        partiesWindow.webContents.once('did-finish-load', () => {
            setTimeout(() => {
                startFocusBatchScript();
                startBackgroundFocusBatchScript();
                loadingWindow.close();
                partiesWindow.show();
            }, 2000)
        });

        setPartiesWindow(partiesWindow);
        partiesWindow.on('close', function (event) {
            const runningFocusBatchProcess = getRunningProccessBatch();
            const runningFocusByPidProcess = getRunningFocusByPidProccess();
            const runningBackgorundFocusBatchProcess = getRunningBackgroundProccessBatch();
            
            setPartiesWindow(null);
            
            if (runningFocusBatchProcess) {
                runningFocusBatchProcess.kill();
                setRunningProccessBatch(null);
            }
            if (runningBackgorundFocusBatchProcess) {
                runningBackgorundFocusBatchProcess.kill();
                setRunningBackgroundProccessBatch(null);
            }
        });
    }
}

ipcMain.on('open-parties-window', (event, tutorialActivated) => {
    const __dirname = dirname;
    openPartiesWindow(path.join(__dirname, 'preload.js'), path.join(__dirname, 'dist/pw-helper/browser/index.html'), tutorialActivated);
});

ipcMain.on('close-party-window', () => {
    const { partiesWindow } = getWindows();
    if (partiesWindow) partiesWindow.close();
});
ipcMain.on('minimize-party-window', () => {
    const { partiesWindow } = getWindows();
    if (partiesWindow) partiesWindow.minimize();
});

export default {};