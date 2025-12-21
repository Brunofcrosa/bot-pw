const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const { PersistenceService } = require('./services/PersistenceService');
const { ProcessManager } = require('./services/ProcessManager');
const { WindowService } = require('./services/WindowService');
const { HotkeyService } = require('./services/HotkeyService');
const MacroService = require('./services/MacroService');
const KeyListenerService = require('./services/KeyListenerService');
const { BackupService } = require('./services/BackupService');
const { SettingsService } = require('./services/SettingsService');
const { AutoForgeService } = require('./services/AutoForgeService');
const { ClickListenerService } = require('./services/ClickListenerService');
const { TitleChangerService } = require('./services/TitleChangerService');
const { logger } = require('./services/Logger');

const log = logger.child('Application');

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html');
const EXECUTABLES_PATH = path.join(__dirname, '..', 'executaveis');

class Application {
    constructor() {
        this.mainWindow = null;

        this.persistenceService = new PersistenceService(path.join(__dirname, 'data'));

        this.titleChangerService = new TitleChangerService(EXECUTABLES_PATH);

        this.processManager = new ProcessManager(EXECUTABLES_PATH, this.titleChangerService);

        this.windowService = new WindowService(this.processManager);

        this.keyListenerService = new KeyListenerService(EXECUTABLES_PATH);

        this.hotkeyService = new HotkeyService(this.windowService);

        this.macroService = new MacroService(this.windowService, this.keyListenerService);

        this.backupService = new BackupService(path.join(__dirname, 'data'));

        this.settingsService = new SettingsService(path.join(__dirname, 'data'));

        this.autoForgeService = new AutoForgeService(EXECUTABLES_PATH);

        this.clickListenerService = new ClickListenerService(EXECUTABLES_PATH, this.windowService);
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
        this.applyStoredSettings();

        this.processManager.startFocusHelpers();

        // Backup automático na inicialização
        if (this.settingsService.getSetting('general.autoBackup')) {
            this.backupService.createAutoBackup().then(filePath => {
                log.info(`Backup automático criado: ${filePath}`);
            }).catch(err => {
                log.error(`Falha no backup automático: ${err.message}`);
            });
        }

        log.info('Sistema pronto e inicializado.');
    }

    applyStoredSettings() {
        const settings = this.settingsService.getSettings();
        if (!settings) return;

        // Aplicar hotkeys salvas
        if (settings.hotkeys?.cycle) {
            this.hotkeyService.setCycleHotkey(settings.hotkeys.cycle);
        }
        if (settings.hotkeys?.toggle) {
            this.hotkeyService.setToggleHotkey(settings.hotkeys.toggle);
        }
        if (settings.hotkeys?.macro) {
            this.hotkeyService.setMacroHotkey(settings.hotkeys.macro);
        }

        // Aplicar configurações de macro
        if (settings.macro?.keys && settings.macro.keys.length > 0) {
            this.hotkeyService.setMacroKeys(settings.macro.keys);
        }
        if (settings.macro?.focusOnMacro !== undefined) {
            this.hotkeyService.setFocusOnMacro(settings.macro.focusOnMacro);
        }
        if (settings.macro?.backgroundMacro !== undefined) {
            this.hotkeyService.setBackgroundMacro(settings.macro.backgroundMacro);
        }
    }

    onWillQuit() {
        log.info('Encerrando...');
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
        // Persistence handlers - agora async para aguardar locks
        ipcMain.handle('load-servers', () => this.persistenceService.loadServers());
        ipcMain.handle('save-servers', async (_event, servers) => await this.persistenceService.saveServers(servers));
        ipcMain.handle('load-accounts', (_event, s) => this.persistenceService.loadAccounts(s));
        ipcMain.handle('save-accounts', async (_event, s, acc) => await this.persistenceService.saveAccounts(s, acc));
        ipcMain.handle('delete-accounts-file', (e, s) => this.persistenceService.deleteAccountsFile(s));

        ipcMain.handle('open-element', (e, args) => this.processManager.launchGame(args, this.getWebContents()));
        ipcMain.handle('close-element', (e, pid) => this.processManager.killGameByPid(pid));
        ipcMain.handle('get-running-instances', () => this.processManager.getRunningInstances());
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

        ipcMain.handle('open-group-overlay', (_event, groupId, serverId) => {
            this.createOverlayWindow(groupId, serverId);
            return { success: true };
        });

        // BackupService handlers
        ipcMain.handle('export-backup', () => this.backupService.exportAll());
        ipcMain.handle('import-backup', (e, backup, options) => this.backupService.importBackup(backup, options));
        ipcMain.handle('create-auto-backup', () => this.backupService.createAutoBackup());

        // HotkeyService handlers
        ipcMain.handle('set-toggle-hotkey', (e, h) => {
            const result = this.hotkeyService.setToggleHotkey(h);
            if (result) this.settingsService.setSetting('hotkeys.toggle', h);
            return result;
        });
        ipcMain.handle('set-macro-hotkey', (e, h) => {
            const result = this.hotkeyService.setMacroHotkey(h);
            if (result) this.settingsService.setSetting('hotkeys.macro', h);
            return result;
        });
        ipcMain.handle('set-macro-keys', (e, keys) => {
            const result = this.hotkeyService.setMacroKeys(keys);
            if (result) this.settingsService.setSetting('macro.keys', keys);
            return result;
        });
        ipcMain.handle('set-focus-on-macro', (e, state) => {
            const result = this.hotkeyService.setFocusOnMacro(state);
            if (result) this.settingsService.setSetting('macro.focusOnMacro', state);
            return result;
        });
        ipcMain.handle('set-background-macro', (e, state) => {
            const result = this.hotkeyService.setBackgroundMacro(state);
            if (result) this.settingsService.setSetting('macro.backgroundMacro', state);
            return result;
        });

        // WindowService handlers
        ipcMain.handle('focus-hwnd', (e, hwnd) => this.windowService.focusHwnd(hwnd));

        // MacroService handlers
        ipcMain.handle('unregister-all-macros', () => this.macroService.unregisterAll());
        ipcMain.handle('list-macros', () => this.macroService.listMacros());

        // SettingsService handlers
        ipcMain.handle('load-settings', () => this.settingsService.loadSettings());
        ipcMain.handle('save-settings', (e, settings) => this.settingsService.saveSettings(settings));

        // Auto Forge handlers
        ipcMain.handle('start-auto-forge', (e, config) => this.autoForgeService.start(config, this.getWebContents()));
        ipcMain.handle('stop-auto-forge', () => this.autoForgeService.stop());

        // Click Listener handlers
        ipcMain.handle('capture-coordinates', (e, pid) => this.clickListenerService.getCoordinates(pid));

        // Abertura automática de grupo
        ipcMain.handle('open-group-accounts', async (e, { serverName, groupId, delayMs = 2000 }) => {
            const groups = this.persistenceService.loadGroups(serverName);
            const group = groups.find(g => g.id === groupId);
            if (!group) return { success: false, error: 'Grupo não encontrado' };

            const accounts = this.persistenceService.loadAccounts(serverName);
            const groupAccounts = accounts.filter(a => group.accountIds.includes(a.id));

            if (groupAccounts.length === 0) {
                return { success: false, error: 'Nenhuma conta encontrada no grupo' };
            }

            return this.processManager.launchGroup(groupAccounts, delayMs, this.getWebContents());
        });
    }

    createOverlayWindow(groupId, serverId = '') {
        if (this.overlayWindow) {
            this.overlayWindow.close();
            this.overlayWindow = null;
        }

        this.overlayWindow = new BrowserWindow({
            width: 300,
            height: 150,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: true,
            webPreferences: {
                preload: PRELOAD_SCRIPT,
                contextIsolation: true,
                nodeIntegration: false,
            }
        });

        // Carrega a mesma página mas com parâmetro para indicar modo overlay
        this.overlayWindow.loadURL(`file://${HTML_FILE}?overlay=true&groupId=${encodeURIComponent(groupId)}&serverId=${encodeURIComponent(serverId)}`);

        this.overlayWindow.on('closed', () => {
            this.overlayWindow = null;
        });
    }
}

module.exports = { Application };