const { exec } = require('child_process');

const TARGET_PROCESS_NAME = 'ElementClient_64.exe';

const VK_MAP = {
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73,
    'F5': 0x74, 'F6': 0x75, 'F7': 0x76, 'F8': 0x77,
    'F9': 0x78, 'F10': 0x79, 'F11': 0x7A, 'F12': 0x7B,
    '0': 0x30, '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34,
    '5': 0x35, '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39
};

class WindowService {
    constructor(processManager) {
        this.processManager = processManager;
        this.window_handles_for_cycle = [];
        this.last_window_handles = [];
        this.current_window_index = 0;
    }

    findPerfectWorldWindows() {
        if (process.platform !== 'win32') return Promise.resolve([]);

        const baseName = TARGET_PROCESS_NAME.endsWith('.exe') 
            ? TARGET_PROCESS_NAME.slice(0, -4) 
            : TARGET_PROCESS_NAME;

        const command = `powershell -Command "@(Get-Process -Name '${baseName}' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Id, MainWindowHandle, MainWindowTitle) | ConvertTo-Json -Compress"`;

        return new Promise((resolve) => {
            exec(command, (error, stdout) => {
                if (error) return resolve([]);

                try {
                    const stdoutTrimmed = stdout.trim();
                    if (!stdoutTrimmed) return resolve([]);
                    
                    let json = JSON.parse(stdoutTrimmed);
                    if (!Array.isArray(json)) json = [json];

                    const windows = json
                        .filter(p => p.MainWindowHandle && p.MainWindowHandle !== 0)
                        .map(p => ({
                            pid: p.Id,
                            title: p.MainWindowTitle || `${baseName} (PID ${p.Id})`,
                            hwnd: parseInt(p.MainWindowHandle)
                        }));
                    
                    resolve(windows);
                } catch (e) {
                    console.error('[WindowService] Erro ao analisar JSON:', e);
                    resolve([]);
                }
            });
        });
    }

    getCurrentForegroundWindow() {
        return new Promise(resolve => {
            const command = 'powershell -Command "[System.Runtime.InteropServices.Marshal]::GetLastWin32Error(); Add-Type -TypeDefinition \\"[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();\\" -Name \\"User32Funcs\\" -Namespace \\"Win32\\"; [Win32.User32Funcs]::GetForegroundWindow()"';
            
            exec(command, (error, stdout) => {
                if (error) return resolve(null);
                resolve(parseInt(stdout.trim()));
            });
        });
    }

    focusWindow(hwnd) {
        if (process.platform !== 'win32' || !hwnd) return;

        const powershellScript = `
            Add-Type -TypeDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);' -Name 'User32Funcs' -Namespace 'Win32';
            $HWND = [System.IntPtr]::new(${hwnd});
            $HWND_TOPMOST = [System.IntPtr]::new(-1); $SW_RESTORE = 9; $SWP_NOMOVE = 0x0002; $SWP_NOSIZE = 0x0001; $SWP_SHOWWINDOW = 0x0040;
            [Win32.User32Funcs]::ShowWindow($HWND, $SW_RESTORE);
            $success = [Win32.User32Funcs]::SetForegroundWindow($HWND);
            [Win32.User32Funcs]::SetWindowPos($HWND, $HWND_TOPMOST, 0, 0, 0, 0, ($SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW));
            if (!($success)) { $wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate(${hwnd}); }
        `.replace(/\s+/g, ' ').trim();

        exec(`powershell -ExecutionPolicy Bypass -Command "${powershellScript}"`, (error) => {
            if (error) console.error(`[WindowService] Falha ao focar janela ${hwnd}: ${error.message}`);
        });
    }

    focusHwnd(hwnd) {
        this.focusWindow(hwnd);
        this._updateLastWindow(hwnd);
        return true;
    }

    focusWindowByPid(pid) {
        if (!pid) {
            console.error('[WindowService] Tentativa de focar janela sem PID.');
            return false;
        }
        this.processManager.sendFocusPid(pid);
        return true;
    }

    async cycleWindows() {
        const windows = await this.findPerfectWorldWindows();
        
        if (windows.length === 0) {
            this.window_handles_for_cycle = [];
            this.current_window_index = 0;
            return;
        }

        this.window_handles_for_cycle = windows.map(w => w.hwnd);

        if (this.window_handles_for_cycle.length > 0) {
            const nextHwnd = this.window_handles_for_cycle[this.current_window_index];
            this.focusWindow(nextHwnd);
            this._updateLastWindow(nextHwnd);
            this.current_window_index = (this.current_window_index + 1) % this.window_handles_for_cycle.length;
        }
    }

    toggleLastWindows() {
        if (this.last_window_handles.length < 2) return;
        
        const nextHwnd = this.last_window_handles[1];
        this.focusWindow(nextHwnd);
        this._updateLastWindow(nextHwnd);
    }

    async sendKeySequence(pid, keys, interval = 200) {
        const windows = await this.findPerfectWorldWindows();
        const target = windows.find(w => w.pid === parseInt(pid));

        if (!target) {
            console.error(`[WindowService] Janela com PID ${pid} não encontrada.`);
            return false;
        }

        const vkCodes = keys.map(k => VK_MAP[k.toUpperCase()] || null).filter(v => v !== null);
        
        if (vkCodes.length === 0) return false;

        const scriptActions = vkCodes.map(vk => `
            [Win32.User32]::PostMessage($hWnd, 0x0100, ${vk}, 0); 
            Start-Sleep -Milliseconds ${Math.max(50, interval)}; 
            [Win32.User32]::PostMessage($hWnd, 0x0101, ${vk}, 0); 
            Start-Sleep -Milliseconds ${Math.max(50, interval)};
        `).join('');

        const psCommand = `
            $code = '[DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);';
            $type = Add-Type -MemberDefinition $code -Name "User32" -Namespace Win32 -PassThru;
            $hWnd = [IntPtr]::new(${target.hwnd});
            ${scriptActions}
        `;

        const fullCommand = `powershell -ExecutionPolicy Bypass -Command "${psCommand.replace(/"/g, '\\"')}"`;

        return new Promise((resolve) => {
            exec(fullCommand, (err) => {
                if (err) {
                    console.error(`[WindowService] Erro ao enviar macro: ${err.message}`);
                    resolve(false);
                } else {
                    console.log(`[WindowService] Macro enviada para PID ${pid} (HWND: ${target.hwnd})`);
                    resolve(true);
                }
            });
        });
    }

    _updateLastWindow(hwnd) {
        if (this.last_window_handles.includes(hwnd)) {
            this.last_window_handles = this.last_window_handles.filter(h => h !== hwnd);
        }
        this.last_window_handles.unshift(hwnd);
        if (this.last_window_handles.length > 2) {
            this.last_window_handles.pop();
        }
    }
}

module.exports = { WindowService };
