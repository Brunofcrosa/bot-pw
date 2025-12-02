import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Serviços Core (Usando ESM)
import { PersistenceService } from './services/PersistenceService.js';
import { ProcessManager } from './services/ProcessManager.js';
import { WindowService } from './services/WindowService.js';
import { HotkeyService } from './services/HotkeyService.js';

// Utilitários e Features
import { setMainWindow, setDirName } from './utils/shared-variables/shared-variables.js';

// Importa as features para registrar os listeners IPC
import './features/backup/backup.js';
import './features/settings/settings.js';
import './features/party/open-parties-window/open-parties-window.js';
import './features/party/open-minimized-party/open-minimized-party.js'; 
import './features/auto-forja/auto-forja.js';
import './features/tools-bar/tools-bar.js';
import './features/storage/storage.js';

// Configuração do __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html'); 

export class Application {
    constructor() {
        this.mainWindow = null;

        // Inicializa serviços
        this.persistenceService = new PersistenceService(path.join(__dirname, 'data'));
        this.processManager = new ProcessManager(path.join(__dirname, '..', 'executaveis'));
        this.windowService = new WindowService(this.processManager);
        this.hotkeyService = new HotkeyService(this.windowService);
        
        // Define o diretório base para as features antigas
        setDirName(__dirname);
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
            width: 1200,
            height: 800,
            frame: false, 
            backgroundColor: '#1e1e2d',
            webPreferences: {
                preload: PRELOAD_SCRIPT,
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        // Carrega o HTML
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.loadFile(HTML_FILE); 
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.loadFile(HTML_FILE);
        }

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            setMainWindow(null);
        });

        // Linka a janela com as features antigas
        setMainWindow(this.mainWindow);
    }

    getWebContents() {
        return this.mainWindow?.webContents;
    }

    registerIpcHandlers() {
        // --- Handlers da Nova Arquitetura ---
        
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

        // Launcher
        ipcMain.handle('open-element', (e, args) => {
            console.log(`[IPC] Recebido 'open-element' para: ${args.login}`);
            return this.processManager.launchGame(args, this.getWebContents());
        });
        ipcMain.handle('close-element', (e, pid) => {
            console.log(`[IPC] Recebido 'close-element' para PID: ${pid}`);
            return this.processManager.killGameByPid(pid);
        });

        // Utils
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
        
        ipcMain.on('minimize-main-window', () => this.mainWindow?.minimize());
        ipcMain.on('close-main-window', () => this.mainWindow?.close());
    }
}