const { contextBridge, ipcRenderer } = require('electron');

// Lista de canais IPC permitidos para maior segurança
const ALLOWED_INVOKE_CHANNELS = [
    'load-servers',
    'save-servers',
    'load-accounts',
    'save-accounts',
    'delete-accounts-file',
    'open-element',
    'close-element',
    'get-running-instances',
    'find-pw-windows',
    'focus-window',
    'register-macro',
    'set-cycle-hotkey',
    'load-groups',
    'save-groups',
    'get-app-version',
    'select-exe-file',
    'open-group-overlay',

    // BackupService
    'export-backup',
    'import-backup',
    'create-auto-backup',
    // HotkeyService
    'set-toggle-hotkey',
    'set-macro-hotkey',
    'set-macro-keys',
    'set-focus-on-macro',
    'set-background-macro',
    'send-combo-to-all',
    'send-background-keys',
    'start-auto-combo',
    'stop-auto-combo',
    'stop-all-auto-combos',
    // WindowService
    'focus-hwnd',
    // MacroService
    'unregister-all-macros',
    'list-macros',
    'execute-macro',
    // SettingsService
    'load-settings',
    'save-settings',
    // Grupos
    'open-group-accounts',
    // Auto Forge & Utils
    'start-auto-forge',
    'stop-auto-forge',
    'capture-coordinates'
];

const ALLOWED_RECEIVE_CHANNELS = [
    'element-opened',
    'element-closed',
    'auto-forge-event',
    'auto-forge-stop',
    'macro-status-update'
];

contextBridge.exposeInMainWorld('electronAPI', {
    invoke: (channel, ...args) => {
        if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
        return Promise.reject(new Error(`Canal IPC não permitido: ${channel}`));
    },

    send: (channel, ...args) => {
        if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
            ipcRenderer.send(channel, ...args);
        }
    },

    on: (channel, func) => {
        if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
            const subscription = (event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }
    }
});
