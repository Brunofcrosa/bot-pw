const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');

const { PersistenceService } = require('./services/PersistenceService');
const { ProcessManager } = require('./services/ProcessManager');
const { WindowService } = require('./services/WindowService');
const { HotkeyService } = require('./services/HotkeyService');

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html');

class Application {
    constructor() {
        this.mainWindow = null;

        this.persistenceService = new PersistenceService(path.join(__dirname, 'data'));
        this.processManager = new ProcessManager(path.join(__dirname, '..', 'executaveis'));
        this.windowService = new WindowService(this.processManager);
        this.hotkeyService = new HotkeyService(this.windowService);
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
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('will-quit', () => this.onWillQuit());
        app.whenReady().then(() => this.onReady());
    }

    onReady() {
        this.createWindow();

        // Inicia serviços
        try {
            this.processManager.startFocusHelpers();
            console.log('[Main] Scripts C# de foco inicializados.');
        } catch (e) {
            console.error('[Main] Falha ao inicializar scripts C# auxiliares:', e);
        }
        
        this.hotkeyService.setupInitialHotkeys();
        this.registerIpcHandlers();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }

    onWillQuit() {
        this.hotkeyService.unregisterAll();
        this.processManager.killAll();
        console.log('[Main] Aplicação encerrada.');
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: PRELOAD_SCRIPT,
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        this.mainWindow.loadFile(HTML_FILE);
        this.mainWindow.webContents.openDevTools();

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    getWebContents() {
        return this.mainWindow?.webContents;
    }

    registerIpcHandlers() {
        // Persistência
        ipcMain.handle('load-servers', () => this.persistenceService.loadServers());
        ipcMain.handle('save-servers', (e, servers) => this.persistenceService.saveServers(servers));
        ipcMain.handle('load-accounts', (e, serverName) => this.persistenceService.loadAccounts(serverName));
        ipcMain.handle('save-accounts', (e, serverName, accounts) => this.persistenceService.saveAccounts(serverName, accounts));
        ipcMain.handle('delete-accounts-file', (e, serverId) => this.persistenceService.deleteAccountsFile(serverId));

        // Foco e Janela
        ipcMain.handle('find-pw-windows', () => this.windowService.findPerfectWorldWindows());
        ipcMain.handle('focus-window', (e, hwnd) => this.windowService.focusHwnd(hwnd));
        ipcMain.handle('cycle-windows', () => this.windowService.cycleWindows());
        ipcMain.handle('focus-window-by-pid', (e, pid) => this.windowService.focusWindowByPid(pid));

        // Macro
        ipcMain.handle('send-background-macro', (e, hwnd, keys) => this.hotkeyService.sendBackgroundMacro(hwnd, keys));
        ipcMain.handle('set-cycle-hotkey', (e, hotkey) => this.hotkeyService.setCycleHotkey(hotkey));
        ipcMain.handle('set-toggle-hotkey', (e, hotkey) => this.hotkeyService.setToggleHotkey(hotkey));
        ipcMain.handle('set-macro-hotkey', (e, hotkey) => this.hotkeyService.setMacroHotkey(hotkey));
        ipcMain.handle('set-macro-keys', (e, keys) => this.hotkeyService.setMacroKeys(keys));
        ipcMain.handle('set-focus-on-macro', (e, state) => this.hotkeyService.setFocusOnMacro(state));
        ipcMain.handle('set-background-macro', (e, state) => this.hotkeyService.setBackgroundMacro(state));

        ipcMain.handle('open-element', (e, args) => {
            console.log(`[IPC] Recebido 'open-element' para: ${args.login}`);
            return this.processManager.launchGame(args, this.getWebContents());
        });
        ipcMain.handle('close-element', (e, pid) => {
            console.log(`[IPC] Recebido 'close-element' para PID: ${pid}`);
            return this.processManager.killGameByPid(pid);
        });

        ipcMain.handle('get-app-version', () => app.getVersion());
        ipcMain.handle('open-external-link', (e, url) => shell.openExternal(url));
        ipcMain.handle('select-exe-file', async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                title: 'Selecionar Executável (ElementClient)',
                properties: ['openFile'],
                filters: [{ name: 'Executáveis', extensions: ['exe'] }]
            });
            return (canceled || filePaths.length === 0) ? null : filePaths[0];
        });
    }
}

module.exports = { Application };