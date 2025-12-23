const { globalShortcut } = require('electron');
const { exec } = require('child_process');
const { VK_MAP, DEFAULT_CYCLE_HOTKEY } = require('../constants');
const { logger } = require('./Logger');

const log = logger.child('HotkeyService');


class HotkeyService {
    constructor(windowService) {
        this.windowService = windowService;

        this.global_cycle_hotkey_handle = null;
        this.global_toggle_hotkey_handle = null;
        this.global_macro_hotkey_handle = null;

        this.macro_keys_to_send = [];
        this.focus_on_macro_enabled = true;
        this.background_macro_enabled = false;

        // Map<AccountId, HotkeyHandle>
        this.account_focus_handles = new Map();
    }

    registerGlobalHotkey(hotkeyString, callback, hotkeyType) {
        let handle;
        if (hotkeyType === 'cycle') handle = this.global_cycle_hotkey_handle;
        else if (hotkeyType === 'toggle') handle = this.global_toggle_hotkey_handle;
        else if (hotkeyType === 'macro') handle = this.global_macro_hotkey_handle;
        else return null;

        if (handle) {
            globalShortcut.unregister(handle);
        }

        let newHandle = null;
        if (hotkeyString) {
            const isRegistered = globalShortcut.register(hotkeyString, callback);
            if (isRegistered) {
                newHandle = hotkeyString;
                log.info(`Atalho ${hotkeyType} [${hotkeyString}] registrado.`);
            } else {
                log.error(`Falha ao registrar atalho ${hotkeyType} [${hotkeyString}].`);
            }
        }

        if (hotkeyType === 'cycle') this.global_cycle_hotkey_handle = newHandle;
        else if (hotkeyType === 'toggle') this.global_toggle_hotkey_handle = newHandle;
        else if (hotkeyType === 'macro') this.global_macro_hotkey_handle = newHandle;

        return newHandle;
    }

    setAccountFocusHotkey(accountId, hotkeyString) {
        // Remove existing for this account
        if (this.account_focus_handles.has(accountId)) {
            const oldHandle = this.account_focus_handles.get(accountId);
            if (oldHandle) globalShortcut.unregister(oldHandle);
            this.account_focus_handles.delete(accountId);
        }

        if (!hotkeyString) return true; // Just clearing

        const callback = async () => {
            log.info(`[Hotkey] Callback disparado para tecla: ${hotkeyString}`);
            if (this.pidResolver) {
                const pid = this.pidResolver(accountId);
                log.debug(`[Hotkey] Acionado para conta ${accountId}. PID: ${pid}`);

                if (pid) {
                    this.windowService.focusWindowByPid(pid);
                }
            }
        };

        const isRegistered = globalShortcut.register(hotkeyString, callback);
        if (isRegistered) {
            this.account_focus_handles.set(accountId, hotkeyString);
            log.info(`Atalho de foco [${hotkeyString}] registrado para conta ${accountId}.`);
            return true;
        } else {
            log.error(`Falha ao registrar atalho de foco [${hotkeyString}] para ${accountId}.`);
            return false;
        }
    }

    setPidResolver(resolverFn) {
        this.pidResolver = resolverFn;
    }

    // [New] Handle raw key events from KeyListenerService
    handleRawKey(rawKey) {
        if (!rawKey) return;

        // Check Focus Hotkeys
        for (const [accountId, hotkey] of this.account_focus_handles.entries()) {
            if (hotkey && hotkey.toUpperCase() === rawKey.toUpperCase()) {
                log.info(`[Hotkey] KeyListener detectou tecla ${rawKey} para conta ${accountId}`);

                if (this.pidResolver) {
                    const pid = this.pidResolver(accountId);
                    if (pid) {
                        this.windowService.focusWindowByPid(pid);
                    } else {
                        log.warn(`[Hotkey] PID não encontrado para conta ${accountId} (via KeyListener)`);
                    }
                }
                return; // Triggered one, return.
            }
        }
    }

    setupInitialHotkeys() {
        this.setCycleHotkey(DEFAULT_CYCLE_HOTKEY);
    }

    setCycleHotkey(hotkeyString) {
        return this.registerGlobalHotkey(hotkeyString, () => this.windowService.cycleWindows(), 'cycle');
    }

    setToggleHotkey(hotkeyString) {
        return this.registerGlobalHotkey(hotkeyString, () => this.windowService.toggleLastWindows(), 'toggle');
    }

    setMacroHotkey(hotkeyString) {
        return this.registerGlobalHotkey(hotkeyString, () => this.sendMacroToWindows(), 'macro');
    }

    setMacroKeys(keys) {
        this.macro_keys_to_send = keys;
        return true;
    }

    setFocusOnMacro(state) {
        this.focus_on_macro_enabled = state;
        return true;
    }

    setBackgroundMacro(state) {
        this.background_macro_enabled = state;
        return true;
    }

    sendBackgroundMacro(hwnd, keys) {
        if (process.platform !== 'win32' || !hwnd || !keys.length) return;

        const keyCodes = keys.map(k => VK_MAP[k]).filter(v => v !== undefined);
        if (keyCodes.length === 0) return;

        const messageScript = keyCodes.map(vkCode => {
            return `
                [Win32.User32]::PostMessage([IntPtr]::new(${hwnd}), 0x0100, ${vkCode}, 0); 
                Start-Sleep -Milliseconds 50; 
                [Win32.User32]::PostMessage([IntPtr]::new(${hwnd}), 0x0101, ${vkCode}, 0); 
                Start-Sleep -Milliseconds 50;
            `;
        }).join('');

        const powershellCommand = `powershell -ExecutionPolicy Bypass -Command "Add-Type -TypeDefinition '[DllImport(\\"user32.dll\\")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);' -Name 'User32' -Namespace 'Win32'; ${messageScript}"`;

        exec(powershellCommand, (error) => {
            if (error) log.error(`Falha ao enviar macro para ${hwnd}: ${error.message}`);
        });
        return true;
    }

    async sendMacroToWindows() {
        if (this.macro_keys_to_send.length === 0) return;

        const windows = await this.windowService.findPerfectWorldWindows();
        if (windows.length === 0) return;

        if (this.background_macro_enabled) {
            windows.forEach(win => {
                this.sendBackgroundMacro(win.hwnd, this.macro_keys_to_send);
            });
        } else {
            const currentHwnd = await this.windowService.getCurrentForegroundWindow();

            for (const win of windows) {
                if (this.focus_on_macro_enabled) {
                    this.windowService.focusWindow(win.hwnd);
                    await new Promise(r => setTimeout(r, 100));
                }
            }

            if (this.focus_on_macro_enabled && currentHwnd) {
                this.windowService.focusWindow(currentHwnd);
            }
        }
    }

    unregisterAll() {
        globalShortcut.unregisterAll();
        log.info('Todos os atalhos globais foram removidos.');
    }
}

module.exports = { HotkeyService };
