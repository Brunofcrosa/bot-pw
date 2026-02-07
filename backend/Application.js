const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// const { PersistenceService } = require('./services/PersistenceService'); // REPLACED BY STORES
const { ProcessManager } = require('./services/ProcessManager');
const { WindowService } = require('./services/WindowService');
const { HotkeyService } = require('./services/HotkeyService');
const KeyListenerService = require('./services/KeyListenerService');
const { BackupService } = require('./services/BackupService');
const { SettingsService } = require('./services/SettingsService');
const { AutoForgeService } = require('./services/AutoForgeService');
const { ClickListenerService } = require('./services/ClickListenerService');
const { TitleChangerService } = require('./services/TitleChangerService');
const { logger } = require('./services/Logger');

// New Stores
const ServerStore = require('./stores/ServerStore');
const AccountStore = require('./stores/AccountStore');
const GroupStore = require('./stores/GroupStore');
const MacroStore = require('./stores/MacroStore');

// Features
const MacroFeature = require('./features/macro/MacroFeature');
const AutoForgeFeature = require('./features/auto-forge/AutoForgeFeature');
const BackupFeature = require('./features/backup/BackupFeature');
const HotkeyFeature = require('./features/hotkey/HotkeyFeature');

const MacroService = require('./services/MacroService');


const log = logger.child('Application');

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html');
const EXECUTABLES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'executaveis')
    : path.join(__dirname, '..', 'executaveis');

class Application {
    constructor() {
        this.mainWindow = null;

        // Stores (Replacement for PersistenceService)
        this.serverStore = new ServerStore();
        this.accountStore = new AccountStore();
        this.groupStore = new GroupStore();

        this.titleChangerService = new TitleChangerService(EXECUTABLES_PATH);

        this.processManager = new ProcessManager(EXECUTABLES_PATH, this.titleChangerService);

        this.windowService = new WindowService(this.processManager);

        this.keyListenerService = new KeyListenerService(EXECUTABLES_PATH);

        this.hotkeyService = new HotkeyService(this.windowService);


        this.backupService = new BackupService(path.join(__dirname, 'data'));
        this.backupFeature = new BackupFeature(this.backupService);

        this.settingsService = new SettingsService(path.join(__dirname, 'data'));

        this.hotkeyFeature = new HotkeyFeature(this.hotkeyService, this.settingsService);

        this.macroService = new MacroService(this.windowService, this.keyListenerService, () => this.processManager.getRunningInstances());
        this.macroStore = new MacroStore(this.settingsService);
        this.macroFeature = new MacroFeature(this.macroService, this.macroStore);


        this.autoForgeService = new AutoForgeService(EXECUTABLES_PATH);
        this.autoForgeFeature = new AutoForgeFeature(this.autoForgeService);

        this.clickListenerService = new ClickListenerService(EXECUTABLES_PATH, this.windowService);

        this.activeComboIntervals = new Map(); // Track active auto-repeat combos
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
        this.setupServices();

        // this.keyListenerService.start();

        // [New] Focus Hotkey Listener via C# Hook (Bypasses Admin Restrictions)
        // this.keyListenerService.on('key-event', (event) => {
        //     // DEBUG LOG
        //     log.info(`[Application] Key Event: ${JSON.stringify(event)}`);
        //
        //     // Event format: { key: "F1", state: "DOWN" }
        //     if (event.state === 'DOWN') {
        //         this.hotkeyService.handleRawKey(event.key);
        //     }
        // });

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

        // Aplicar hotkeys de contas (Focus)
        if (settings.hotkeys?.accounts) {
            for (const [accountId, hotkey] of Object.entries(settings.hotkeys.accounts)) {
                this.hotkeyService.setAccountFocusHotkey(accountId, hotkey);
            }
        }
    }

    // Wire up Resolver to find PID for AccountId
    setupServices() {
        this.hotkeyService.setPidResolver((accountId) => {
            // ProcessManager has `activeGamePids` which is Map<accountId, pid>
            // But wait, ProcessManager doesn't expose it directly maybe?
            // Let's check ProcessManager.
            // If activeGamePids is public or has getter.
            // Actually `runningInstances` in frontend comes from `getRunningInstances`.
            // `getRunningInstances` returns list.
            // We need to sync.

            // Accessing private map if possible or add helper.
            // Assuming ProcessManager has capability.
            return this.processManager.getPidForAccount(accountId);
        });
    }

    onWillQuit() {
        log.info('Encerrando...');
        this.keyListenerService.stop();
        this.hotkeyService.unregisterAll();
        this.processManager.killAll();
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 450,
            height: 700,
            minWidth: 380,
            minHeight: 500,
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
            // Restore previous session if valid
            this.processManager.restoreSession(this.mainWindow.webContents);
        });
    }

    getWebContents() {
        return this.mainWindow?.webContents;
    }

    registerIpcHandlers() {
        // Persistence handlers - agora async para aguardar locks
        ipcMain.handle('load-servers', () => this.serverStore.getServers());
        ipcMain.handle('save-servers', async (_event, servers) => this.serverStore.saveServers(servers));
        ipcMain.handle('load-accounts', (_event, s) => this.accountStore.getAccounts(s));
        ipcMain.handle('save-accounts', async (_event, s, acc) => this.accountStore.saveAccounts(s, acc));
        ipcMain.handle('delete-accounts-file', (e, s) => this.accountStore.deleteStore(s));

        ipcMain.handle('export-accounts', async (e, accounts) => {
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Exportar Contas',
                defaultPath: 'contas.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (canceled || !filePath) return { success: false };

            try {
                // Ensure sensitive data might be stripped if needed, but for now export all relevant fields
                // Maybe exclude internal fields if any? User probably wants to export passwords too for backup.
                require('fs').writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf-8');
                return { success: true, filePath };
            } catch (error) {
                log.error(`Erro ao exportar contas: ${error.message}`);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('import-accounts', async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                title: 'Importar Contas',
                properties: ['openFile'],
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (canceled || filePaths.length === 0) return { success: false };

            try {
                const data = require('fs').readFileSync(filePaths[0], 'utf-8');
                const imported = JSON.parse(data);
                if (!Array.isArray(imported)) {
                    return { success: false, error: 'Arquivo inválido: formato deve ser uma lista de contas.' };
                }
                return { success: true, accounts: imported };
            } catch (error) {
                log.error(`Erro ao importar contas: ${error.message}`);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('open-element', (e, args) => this.processManager.launchGame(args, this.getWebContents()));
        ipcMain.handle('close-element', (e, pid) => this.processManager.killGameByPid(pid));
        ipcMain.handle('get-running-instances', () => this.processManager.getRunningInstances());
        ipcMain.handle('find-pw-windows', () => this.windowService.findPerfectWorldWindows());
        ipcMain.handle('focus-window', (e, pid) => this.windowService.focusWindowByPid(pid));


        // Macro handlers moved to MacroFeature


        // ipcMain.handle('set-cycle-hotkey', (e, h) => this.hotkeyService.setCycleHotkey(h)); // Moved to HotkeyFeature

        ipcMain.handle('load-groups', (e, s) => this.groupStore.getGroups(s));
        ipcMain.handle('save-groups', (e, s, groups) => this.groupStore.saveGroups(s, groups));

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

        ipcMain.handle('resize-overlay', (_event, { width, height }) => {
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                this.overlayWindow.setContentSize(width, height);
            }
            return { success: true };
        });

        // BackupService handlers moved to BackupFeature

        // HotkeyService handlers moved to HotkeyFeature

        ipcMain.handle('start-auto-combo', async (e, { accountId, pid, keys, delayMs }) => {
            try {
                if (!accountId || !pid || !keys || keys.length === 0 || !delayMs) {
                    return { success: false, error: 'accountId, pid, keys e delayMs são obrigatórios' };
                }

                // Cancela combo existente se houver
                if (this.activeComboIntervals.has(accountId)) {
                    this.windowService.cancelBatchSequence(accountId);
                    this.activeComboIntervals.delete(accountId);
                }

                // Envia comando via ProcessManager (que delega para WindowService)
                const result = await this.processManager.startBackgroundCombo(accountId, pid, keys, delayMs, this.windowService);

                if (result.success) {
                    this.activeComboIntervals.set(accountId, true); // Marca como ativo
                    log.info(`Auto-combo em segundo plano iniciado para conta ${accountId} (PID: ${pid})`);
                    return { success: true, accountId };
                } else {
                    return result;
                }
            } catch (error) {
                log.error('Erro ao iniciar auto-combo:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('stop-auto-combo', async (e, { accountId }) => {
            try {
                if (!accountId) {
                    return { success: false, error: 'accountId é obrigatório' };
                }

                if (this.activeComboIntervals.has(accountId)) {
                    this.windowService.cancelBatchSequence(accountId);
                    this.activeComboIntervals.delete(accountId);
                    log.info(`Auto-combo parado para conta ${accountId}`);
                    return { success: true, accountId };
                }

                return { success: false, error: 'Nenhum auto-combo ativo para esta conta' };
            } catch (error) {
                log.error('Erro ao parar auto-combo:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('stop-all-auto-combos', async () => {
            try {
                for (const accountId of this.activeComboIntervals.keys()) {
                    this.windowService.cancelBatchSequence(accountId);
                }
                const count = this.activeComboIntervals.size;
                this.activeComboIntervals.clear();
                log.info(`Todos os ${count} auto-combos foram parados`);
                return { success: true, count };
            } catch (error) {
                log.error('Erro ao parar todos auto-combos:', error);
                return { success: false, error: error.message };
            }
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
            const groups = this.groupStore.getGroups(serverName);
            const group = groups.find(g => g.id === groupId);
            if (!group) return { success: false, error: 'Grupo não encontrado' };

            const accounts = this.accountStore.getAccounts(serverName);
            const groupAccounts = accounts.filter(a => group.accountIds.includes(a.id));

            if (groupAccounts.length === 0) {
                return { success: false, error: 'Nenhuma conta encontrada no grupo' };
            }

            return this.processManager.launchGroup(groupAccounts, delayMs, this.getWebContents());
        });

        ipcMain.handle('stop-group-accounts', async (e, { serverName, groupId }) => {
            const groups = this.groupStore.getGroups(serverName);
            const group = groups.find(g => g.id === groupId);
            if (!group) return { success: false, error: 'Grupo não encontrado' };

            const accounts = this.accountStore.getAccounts(serverName);
            const groupAccounts = accounts.filter(a => group.accountIds.includes(a.id));

            return this.processManager.stopGroup(groupAccounts);
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