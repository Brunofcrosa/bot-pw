import { globalShortcut } from 'electron';
import { exec } from 'child_process';

const GLOBAL_HOTKEY_CYCLE = 'Control+Shift+T';

const VK_MAP = {
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73, 'F5': 0x74, 'F6': 0x75,
    'F7': 0x76, 'F8': 0x77, 'enter': 0x0D
};

export class HotkeyService {
    constructor(windowService) {
        this.windowService = windowService;

        this.global_cycle_hotkey_handle = null;
        this.global_toggle_hotkey_handle = null;
        this.global_macro_hotkey_handle = null;

        this.macro_keys_to_send = [];
        this.focus_on_macro_enabled = true;
        this.background_macro_enabled = false;
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
                console.log(`[HotkeyService] Atalho ${hotkeyType} [${hotkeyString}] registrado.`);
            } else {
                console.error(`[HotkeyService] Falha ao registrar atalho ${hotkeyType} [${hotkeyString}].`);
            }
        }
        
        if (hotkeyType === 'cycle') this.global_cycle_hotkey_handle = newHandle;
        else if (hotkeyType === 'toggle') this.global_toggle_hotkey_handle = newHandle;
        else if (hotkeyType === 'macro') this.global_macro_hotkey_handle = newHandle;

        return newHandle;
    }
    
    setupInitialHotkeys() {
        this.setCycleHotkey(GLOBAL_HOTKEY_CYCLE);
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
            if (error) console.error(`[HotkeyService] Falha ao enviar macro para ${hwnd}: ${error.message}`);
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
        console.log('[HotkeyService] Todos os atalhos globais foram removidos.');
    }
}