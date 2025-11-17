const { app, BrowserWindow, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');

const PRELOAD_SCRIPT = path.join(__dirname, 'preload.js');
const HTML_FILE = path.join(__dirname, '..', 'frontend', 'index.html');

const TARGET_PROCESS_NAME = 'ElementClient_64.exe';
const GLOBAL_HOTKEY_CYCLE = 'Control+Shift+T';

const VK_MAP = {
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73, 'F5': 0x74, 'F6': 0x75,
    'F7': 0x76, 'F8': 0x77, 'enter': 0x0D
};

let global_cycle_hotkey_handle = null;
let global_toggle_hotkey_handle = null;
let global_macro_hotkey_handle = null;

let window_handles_for_cycle = [];
let last_window_handles = [];
let macro_keys_to_send = [];
let focus_on_macro_enabled = true;
let background_macro_enabled = false;

let current_window_index = 0;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: PRELOAD_SCRIPT,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(HTML_FILE);

  //mainWindow.webContents.openDevTools();
}

async function findPerfectWorldWindows() {
  if (process.platform !== 'win32') return [];

  const baseName = TARGET_PROCESS_NAME.endsWith('.exe') ? TARGET_PROCESS_NAME.slice(0, -4) : TARGET_PROCESS_NAME;
  const command = `powershell -Command "@(Get-Process -Name '${baseName}' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object MainWindowHandle, MainWindowTitle) | ConvertTo-Json -Compress"`;
  
  return new Promise((resolve) => {
    exec(command, (error, stdout) => {
      if (error) {
        console.error(`Erro ao buscar processos: ${error.message}`);
        return resolve([]);
      }
      try {
        const stdoutTrimmed = stdout.trim();
        if (!stdoutTrimmed) return resolve([]);
            
        let json = JSON.parse(stdoutTrimmed);
            
        if (!Array.isArray(json)) {
          json = [json];
        }

        const windows = json
            .filter(p => p.MainWindowHandle && p.MainWindowHandle !== 0)
            .map(p => ({
                title: p.MainWindowTitle && p.MainWindowTitle.trim() !== '' ? p.MainWindowTitle.trim() : `${baseName} (PID Desconhecido)`,
                hwnd: parseInt(p.MainWindowHandle)
            }));
        
        resolve(windows);

      } catch (e) {
        console.error('Erro ao analisar JSON dos processos:', e);
        resolve([]);
      }
    });
  });
}

function focusWindow(hwnd) {
    if (process.platform !== 'win32' || !hwnd) {
        return;
    }

    const powershellScript = `
        Add-Type -TypeDefinition '
            [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
        ' -Name 'User32Funcs' -Namespace 'Win32';
        $HWND = [System.IntPtr]::new(${hwnd});
        $HWND_TOPMOST = [System.IntPtr]::new(-1);
        $SW_RESTORE = 9;
        $SWP_NOMOVE = 0x0002;
        $SWP_NOSIZE = 0x0001;
        $SWP_SHOWWINDOW = 0x0040;
        [Win32.User32Funcs]::ShowWindow($HWND, $SW_RESTORE);
        $success = [Win32.User32Funcs]::SetForegroundWindow($HWND);
        [Win32.User32Funcs]::SetWindowPos($HWND, $HWND_TOPMOST, 0, 0, 0, 0, ($SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW));
        if (!($success)) {
            $wshell = New-Object -ComObject WScript.Shell; 
            $wshell.AppActivate(${hwnd});
        }
    `.replace(/\s+/g, ' ').trim();

    const command = `powershell -ExecutionPolicy Bypass -Command "${powershellScript}"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Falha ao focar janela ${hwnd}: ${error.message}`);
        }
    });
}

function sendBackgroundMacro(hwnd, keys) {
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
        if (error) {
            console.error(`Falha ao enviar macro para ${hwnd}: ${error.message}`);
        }
    });
}

function getCurrentForegroundWindow() {
    return new Promise(resolve => {
        exec('powershell -Command "[System.Runtime.InteropServices.Marshal]::GetLastWin32Error(); Add-Type -TypeDefinition \\"[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();\\" -Name \\"User32Funcs\\" -Namespace \\"Win32\\"; [Win32.User32Funcs]::GetForegroundWindow()"', (error, stdout) => {
            if (error) {
                return resolve(null);
            }
            resolve(parseInt(stdout.trim()));
        });
    });
}

async function cycleWindows() {
    const windows = await findPerfectWorldWindows();
    if (windows.length === 0) {
        window_handles_for_cycle = [];
        current_window_index = 0;
        return;
    }
    
    window_handles_for_cycle = windows.map(w => w.hwnd);

    if (window_handles_for_cycle.length > 0) {
        const nextHwnd = window_handles_for_cycle[current_window_index];
        focusWindow(nextHwnd);
        
        if (last_window_handles.includes(nextHwnd)) {
            last_window_handles = last_window_handles.filter(h => h !== nextHwnd);
        }
        last_window_handles.unshift(nextHwnd);
        if (last_window_handles.length > 2) {
            last_window_handles.pop();
        }
        
        current_window_index = (current_window_index + 1) % window_handles_for_cycle.length;
    }
}

function toggleLastWindows() {
    if (last_window_handles.length < 2) return;
        
    const nextHwnd = last_window_handles[1];
    
    if (last_window_handles.includes(nextHwnd)) {
        last_window_handles = last_window_handles.filter(h => h !== nextHwnd);
    }
    last_window_handles.unshift(nextHwnd);
    if (last_window_handles.length > 2) {
        last_window_handles.pop();
    }
    
    focusWindow(nextHwnd);
}

async function sendMacroToWindows() {
    if (macro_keys_to_send.length === 0) return;

    const windows = await findPerfectWorldWindows();
    if (windows.length === 0) return;

    if (background_macro_enabled) {
        windows.forEach(win => {
            sendBackgroundMacro(win.hwnd, macro_keys_to_send);
        });
    } else {
        const currentHwnd = await getCurrentForegroundWindow(); 
        
        for (const win of windows) {
            if (focus_on_macro_enabled) {
                focusWindow(win.hwnd);
                await new Promise(r => setTimeout(r, 100)); 
            }
        }
        
        if (focus_on_macro_enabled && currentHwnd) {
             focusWindow(currentHwnd);
        }
    }
}

function registerGlobalHotkey(hotkeyString, callback, hotkeyType) {
    let handle;
    
    if (hotkeyType === 'cycle') handle = global_cycle_hotkey_handle;
    else if (hotkeyType === 'toggle') handle = global_toggle_hotkey_handle;
    else if (hotkeyType === 'macro') handle = global_macro_hotkey_handle;
    else return null;

    if (handle) {
        globalShortcut.unregister(handle);
    }
    
    let newHandle = null;
    if (hotkeyString) {
        const isRegistered = globalShortcut.register(hotkeyString, callback);
        if (isRegistered) {
            newHandle = hotkeyString;
        } else {
            console.error(`MAIN: Falha ao registrar atalho global de ${hotkeyType} [${hotkeyString}].`);
        }
    }
    
    if (hotkeyType === 'cycle') global_cycle_hotkey_handle = newHandle;
    else if (hotkeyType === 'toggle') global_toggle_hotkey_handle = newHandle;
    else if (hotkeyType === 'macro') global_macro_hotkey_handle = newHandle;

    return newHandle;
}

app.whenReady().then(() => {
  createWindow();
  
  registerGlobalHotkey(GLOBAL_HOTKEY_CYCLE, cycleWindows, 'cycle'); 

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { 
    app.quit();
  }
});

ipcMain.handle('find-pw-windows', findPerfectWorldWindows);
ipcMain.handle('focus-window', (event, hwnd) => {
    focusWindow(hwnd);
    if (last_window_handles.includes(hwnd)) {
        last_window_handles = last_window_handles.filter(h => h !== hwnd);
    }
    last_window_handles.unshift(hwnd);
    if (last_window_handles.length > 2) last_window_handles.pop();
    return true; 
});
ipcMain.handle('cycle-windows', cycleWindows);

ipcMain.handle('send-background-macro', (event, hwnd, keys) => {
    sendBackgroundMacro(hwnd, keys);
    return true; 
});

ipcMain.handle('set-cycle-hotkey', (event, hotkeyString) => {
    return registerGlobalHotkey(hotkeyString, cycleWindows, 'cycle');
});
ipcMain.handle('set-toggle-hotkey', (event, hotkeyString) => {
    return registerGlobalHotkey(hotkeyString, toggleLastWindows, 'toggle');
});
ipcMain.handle('set-macro-hotkey', (event, hotkeyString) => {
    return registerGlobalHotkey(hotkeyString, sendMacroToWindows, 'macro');
});

ipcMain.handle('set-macro-keys', (event, keys) => {
    macro_keys_to_send = keys;
    return true;
});
ipcMain.handle('set-focus-on-macro', (event, state) => {
    focus_on_macro_enabled = state;
    return true;
});
ipcMain.handle('set-background-macro', (event, state) => {
    background_macro_enabled = state;
    return true;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-external-link', async (event, url) => {
    await shell.openExternal(url);
    return true;
});
ipcMain.handle('open-element', (event, args) => {
    console.log(`[IPC MAIN] Recebido open-element para: ${args.login}`);
    return { success: true, pid: 12345, accountId: args.id }; 
});
ipcMain.handle('close-element', (event, pid) => {
    console.log(`[IPC MAIN] Recebido close-element para PID: ${pid}`);
    return { success: true, closedPid: pid };
});