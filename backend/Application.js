const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');

const { PersistenceService } = require('./services/PersistenceService');
const { ProcessManager } = require('./services/ProcessManager');
const { WindowService } = require('./services/WindowService');
const { HotkeyService } = require('./services/HotkeyService');
const MacroService = require('./services/MacroService');
const KeyListenerService = require('./services/KeyListenerService');

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html');
const EXECUTABLES_PATH = path.join(__dirname, '..', 'executaveis');

class Application {
    constructor() {
        this.mainWindow = null;

        this.persistenceService = new PersistenceService(path.join(__dirname, 'data'));

        this.processManager = new ProcessManager(EXECUTABLES_PATH);

        this.windowService = new WindowService(this.processManager);

        this.keyListenerService = new KeyListenerService(EXECUTABLES_PATH);

        this.hotkeyService = new HotkeyService(this.windowService);

        this.macroService = new MacroService(this.windowService, this.keyListenerService);
    }

    init() {
        if (!app.requestSingleInstanceLock()) {
            app.quit();
            return;
        }

        app.on('second-instance', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                this.mainWindow.focus();
            }
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') app.quit();
        });

        app.on('will-quit', () => this.onWillQuit());

        app.whenReady().then(() => this.onReady());
    }

    onReady() {
        this.createWindow();

        this.keyListenerService.start();

        this.registerIpcHandlers();
        this.hotkeyService.setupInitialHotkeys();

        console.log('[Application] Sistema pronto e inicializado.');
    }

    onWillQuit() {
        console.log('[Application] Encerrando...');
        this.keyListenerService.stop();
        this.hotkeyService.unregisterAll();
        this.processManager.killAll();
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 720,
            minWidth: 800,
            minHeight: 600,
            backgroundColor: '#1e1e24',
            webPreferences: {
                preload: PRELOAD_SCRIPT,
                contextIsolation: true,
                nodeIntegration: false,
            },
            autoHideMenuBar: true,
            show: false
        });

        this.mainWindow.loadFile(HTML_FILE);

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });
    }

    getWebContents() {
        return this.mainWindow?.webContents;
    }

    registerIpcHandlers() {
        ipcMain.handle('load-servers', () => this.persistenceService.loadServers());
        ipcMain.handle('save-servers', (e, s) => this.persistenceService.saveServers(s));
        ipcMain.handle('load-accounts', (e, s) => this.persistenceService.loadAccounts(s));
        ipcMain.handle('save-accounts', (e, s, acc) => this.persistenceService.saveAccounts(s, acc));
        ipcMain.handle('delete-accounts-file', (e, s) => this.persistenceService.deleteAccountsFile(s));

        ipcMain.handle('open-element', (e, args) => this.processManager.launchGame(args, this.getWebContents()));
        ipcMain.handle('close-element', (e, pid) => this.processManager.killGameByPid(pid));
        ipcMain.handle('find-pw-windows', () => this.windowService.findPerfectWorldWindows());
        ipcMain.handle('focus-window', (e, pid) => this.windowService.focusWindowByPid(pid));

        ipcMain.handle('register-macro', async (event, { pid, triggerKey, sequence }) => {
            return this.macroService.registerMacro(pid, triggerKey, sequence);
        });

        ipcMain.handle('set-cycle-hotkey', (e, h) => this.hotkeyService.setCycleHotkey(h));

        ipcMain.handle('load-groups', (e, s) => this.persistenceService.loadGroups(s));
        ipcMain.handle('save-groups', (e, s, groups) => this.persistenceService.saveGroups(s, groups));

        ipcMain.handle('get-app-version', () => app.getVersion());
        ipcMain.handle('select-exe-file', async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                title: 'Selecionar Executável (ElementClient.exe)',
                properties: ['openFile'],
                filters: [{ name: 'Executáveis', extensions: ['exe'] }]
            });
            return (canceled || filePaths.length === 0) ? null : filePaths[0];
        });

        ipcMain.handle('open-group-overlay', (e, groupId) => this.createOverlayWindow(groupId));
    }

    createOverlayWindow(groupId) {
        if (this.overlayWindow) {
            this.overlayWindow.close();
            this.overlayWindow = null;
        }

        this.overlayWindow = new BrowserWindow({
            width: 600,
            height: 200,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            webPreferences: {
                preload: PRELOAD_SCRIPT,
                contextIsolation: true,
                nodeIntegration: false,
            }
        });

        // Carrega a mesma página mas com parâmetro para indicar modo overlay
        this.overlayWindow.loadURL(`file://${HTML_FILE}?overlay=true&groupId=${groupId}`);

        this.overlayWindow.on('closed', () => {
            this.overlayWindow = null;
        });
    }
}

module.exports = { Application };