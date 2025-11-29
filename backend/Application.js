// backend/Application.js
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');

// Serviços
const { PersistenceService } = require('./services/PersistenceService');
const { ProcessManager } = require('./services/ProcessManager');
const { WindowService } = require('./services/WindowService');
const { HotkeyService } = require('./services/HotkeyService');
const MacroService = require('./services/MacroService');
const KeyListenerService = require('./services/KeyListenerService'); // <--- Serviço Novo

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html');
const EXECUTABLES_PATH = path.join(__dirname, '..', 'executaveis'); // Pasta onde fica o key-listener.exe

class Application {
    constructor() {
        this.mainWindow = null;

        // 1. Serviços de Infraestrutura
        // Gerencia dados JSON (contas, servidores)
        this.persistenceService = new PersistenceService(path.join(__dirname, 'data'));
        
        // Gerencia processos do jogo (abrir/fechar)
        this.processManager = new ProcessManager(EXECUTABLES_PATH);
        
        // Gerencia janelas do Windows (encontrar, focar, enviar teclas)
        this.windowService = new WindowService(this.processManager);
        
        // 2. Serviço de Escuta de Teclas (Executável Externo)
        // Inicia o processo 'key-listener.exe' para capturar hooks de teclado
        this.keyListenerService = new KeyListenerService(EXECUTABLES_PATH);

        // 3. Serviços de Lógica (Injeção de Dependência)
        // Atalhos globais do Electron (ex: Ctrl+Shift+T)
        this.hotkeyService = new HotkeyService(this.windowService);
        
        // O MacroService agora recebe o KeyListenerService para ouvir teclas sem depender do Electron
        this.macroService = new MacroService(this.windowService, this.keyListenerService);
    }

    init() {
        // Bloqueio de instância única
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
        
        // Inicia o Key Listener (spawna o .exe em background)
        this.keyListenerService.start();

        this.registerIpcHandlers();
        this.hotkeyService.setupInitialHotkeys();
        
        console.log('[Application] Sistema pronto e inicializado.');
    }

    onWillQuit() {
        console.log('[Application] Encerrando...');
        this.keyListenerService.stop(); // Mata o processo do listener para não ficar orfão
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
            show: false // Evita flash branco na inicialização
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
        // 1. Persistência
        ipcMain.handle('load-servers', () => this.persistenceService.loadServers());
        ipcMain.handle('save-servers', (e, s) => this.persistenceService.saveServers(s));
        ipcMain.handle('load-accounts', (e, s) => this.persistenceService.loadAccounts(s));
        ipcMain.handle('save-accounts', (e, s, acc) => this.persistenceService.saveAccounts(s, acc));
        ipcMain.handle('delete-accounts-file', (e, s) => this.persistenceService.deleteAccountsFile(s));

        // 2. Processos e Janelas
        ipcMain.handle('open-element', (e, args) => this.processManager.launchGame(args, this.getWebContents()));
        ipcMain.handle('close-element', (e, pid) => this.processManager.killGameByPid(pid));
        ipcMain.handle('find-pw-windows', () => this.windowService.findPerfectWorldWindows());

        // 3. Macros (Integração com KeyListener)
        ipcMain.handle('register-macro', async (event, { pid, triggerKey, sequence }) => {
            // O MacroService agora gerencia isso internamente via eventos do KeyListener
            return this.macroService.registerMacro(pid, triggerKey, sequence);
        });

        // 4. Configurações Globais
        ipcMain.handle('set-cycle-hotkey', (e, h) => this.hotkeyService.setCycleHotkey(h));
        
        // 5. Utilitários
        ipcMain.handle('get-app-version', () => app.getVersion());
        ipcMain.handle('select-exe-file', async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                title: 'Selecionar Executável (ElementClient.exe)',
                properties: ['openFile'],
                filters: [{ name: 'Executáveis', extensions: ['exe'] }]
            });
            return (canceled || filePaths.length === 0) ? null : filePaths[0];
        });
    }
}

module.exports = { Application };