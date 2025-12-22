const { exec, spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');
const { VK_MAP, TARGET_PROCESS_NAME } = require('../constants');
const { logger } = require('./Logger');

const log = logger.child('WindowService');


class WindowService {
    constructor(processManager) {
        this.processManager = processManager;
        this.window_handles_for_cycle = [];
        this.last_window_handles = [];
        this.current_window_index = 0;

        this.senderProcess = null;
        this.backgroundSenderProcess = null;
        this.startSender();
        this.startBackgroundSender();
    }

    startSender() {
        const psScript = path.join(__dirname, '..', 'scripts', 'ps-sender.ps1');
        log.info(`Iniciando sender de teclas persistente: ${psScript}`);

        this.senderProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', psScript]);

        this.senderProcess.stdout.on('data', (data) => {
            log.debug(`[Sender]: ${data}`);
        });

        this.senderProcess.stderr.on('data', (data) => {
            log.error(`[Sender Error]: ${data}`);
        });

        this.senderProcess.on('close', (code) => {
            log.warn(`Sender process closed with code ${code}. Restarting...`);
            setTimeout(() => this.startSender(), 2000);
        });
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
                    log.error('Erro ao analisar JSON:', e);
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
            if (error) log.error(`Falha ao focar janela ${hwnd}: ${error.message}`);
        });
    }

    focusHwnd(hwnd) {
        this.focusWindow(hwnd);
        this._updateLastWindow(hwnd);
        return true;
    }

    focusWindowByPid(pid) {
        if (!pid) {
            log.error('Tentativa de focar janela sem PID.');
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
        // Get HWND directly from PID using a fast PowerShell query
        const hwnd = await this.getHwndFromPid(pid);

        if (!hwnd) {
            log.error(`Janela com PID ${pid} não encontrada.`);
            return false;
        }

        const vkCodes = keys.map(k => VK_MAP[k.toUpperCase()] || null).filter(v => v !== null);

        if (vkCodes.length === 0) return false;

        if (this.senderProcess && !this.senderProcess.killed) {
            // Send to persistent process: HWND|VKs|INTERVAL
            const cmd = `${hwnd}|${vkCodes.join(',')}|${interval}\n`;
            this.senderProcess.stdin.write(cmd);
            log.info(`Enviado (Persistent) para PID ${pid} (HWND: ${hwnd}): ${cmd.trim()}`);
            return true;
        } else {
            log.error('Sender process not running. Fallback is disabled.');
            return false;
        }
    }

    // --- Background Combo Implementation ---

    startBackgroundSender() {
        const exeName = 'background-focus-window-batch.exe';
        let exePath;

        if (!app.isPackaged) {
            exePath = path.join(__dirname, '..', '..', 'executaveis', exeName);
        } else {
            exePath = path.join(process.resourcesPath, 'executaveis', exeName);
        }

        // Fallback if not found in root executaveis (development structure variation)
        if (!app.isPackaged && !require('fs').existsSync(exePath)) {
            exePath = path.join(__dirname, '..', '..', 'help', 'shared', 'exe', exeName);
        }

        log.info(`Iniciando Background Sender: ${exePath}`);

        this.backgroundSenderProcess = spawn(exePath, [], {
            stdio: ['pipe', 'pipe', 'ignore'],
            windowsHide: true
        });

        this.backgroundSenderProcess.stdout.on('data', (data) => {
            const lines = data.toString().split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
                try {
                    const msg = JSON.parse(line);
                    if (msg.status === 'error') {
                        log.error(`[BackgroundSender Error]: ${msg.message}`);
                    } else if (msg.status === 'done' || msg.status === 'cancelled') {
                        log.info(`[BackgroundSender]: Job ${msg.jobId} ${msg.status}`);
                    }
                } catch (e) {
                    log.debug(`[BackgroundSender Raw]: ${line}`);
                }
            }
        });

        this.backgroundSenderProcess.on('close', (code) => {
            log.warn(`Background Sender process closed with code ${code}. Restarting...`);
            setTimeout(() => this.startBackgroundSender(), 3000);
        });

        this.backgroundSenderProcess.on('error', (err) => {
            log.error(`Falha ao iniciar Background Sender: ${err.message}`);
        });
    }

    sendBatchSequence(jobId, commands, loop = false) {
        if (!this.backgroundSenderProcess || this.backgroundSenderProcess.killed) {
            log.error('Background Sender process not running');
            return false;
        }

        const payload = JSON.stringify({
            type: "execute",
            jobId,
            commands,
            loop
        }) + "\n";

        this.backgroundSenderProcess.stdin.write(payload);
        log.info(`Enviado para background sender (Job: ${jobId}, Loop: ${loop})`);
        return true;
    }

    cancelBatchSequence(jobId) {
        if (!this.backgroundSenderProcess || this.backgroundSenderProcess.killed) return;

        const payload = JSON.stringify({
            type: "cancel",
            jobId
        }) + "\n";

        this.backgroundSenderProcess.stdin.write(payload);
        log.info(`Cancelamento enviado para Job: ${jobId}`);
    }

    stopAllBackground() {
        if (!this.backgroundSenderProcess || this.backgroundSenderProcess.killed) return;
        const payload = JSON.stringify({
            type: "exit"
        }) + "\n";
        this.backgroundSenderProcess.stdin.write(payload);

        // Restart connection
        setTimeout(() => {
            if (this.backgroundSenderProcess.killed) this.startBackgroundSender();
        }, 1000);
    }

    // ---------------------------------------

    getHwndFromPid(pid) {
        return new Promise((resolve) => {
            const command = `powershell -Command "try { $p = Get-Process -Id ${pid} -ErrorAction Stop; if ($p.MainWindowHandle -ne 0) { $p.MainWindowHandle } else { 0 } } catch { 0 }"`;

            exec(command, (error, stdout) => {
                if (error) {
                    log.debug(`Erro ao obter HWND para PID ${pid}: ${error.message}`);
                    return resolve(null);
                }

                const hwnd = parseInt(stdout.trim());
                if (hwnd && hwnd !== 0) {
                    resolve(hwnd);
                } else {
                    resolve(null);
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
