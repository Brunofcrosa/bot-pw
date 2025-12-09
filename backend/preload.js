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
    // WindowService
    'focus-hwnd',
    // MacroService
    'unregister-all-macros',
    'list-macros',
    // SettingsService
    'load-settings',
    'save-settings',
    // Grupos
    'open-group-accounts'
];

const ALLOWED_RECEIVE_CHANNELS = [
    'element-opened',
    'element-closed'
];

contextBridge.exposeInMainWorld('electronAPI', {
    invoke: (channel, ...args) => {
        if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
        console.error(`[Preload] Canal IPC não permitido: ${channel}`);
        return Promise.reject(new Error(`Canal IPC não permitido: ${channel}`));
    },

    send: (channel, ...args) => {
        if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
            ipcRenderer.send(channel, ...args);
        } else {
            console.error(`[Preload] Canal IPC send não permitido: ${channel}`);
        }
    },

    on: (channel, func) => {
        if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        } else {
            console.error(`[Preload] Canal IPC on não permitido: ${channel}`);
        }
    }
});
