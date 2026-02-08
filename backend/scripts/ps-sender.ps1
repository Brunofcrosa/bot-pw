$code = @'
using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Text;

namespace Native {
    public static class Input {
        [DllImport("user32.dll")]
        public static extern uint MapVirtualKey(uint uCode, uint uMapType);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern int ToUnicode(uint wVirtKey, uint wScanCode, byte[] lpKeyState, [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pwszBuff, int cchBuff, uint wFlags);

        [DllImport("user32.dll")]
        public static extern bool GetKeyboardState(byte[] lpKeyState);

        const uint WM_KEYDOWN = 0x0100;
        const uint WM_KEYUP = 0x0101;
        const uint WM_CHAR = 0x0102;

        public static void SendBackgroundKey(IntPtr hwnd, int vk) {
            uint scanCode = MapVirtualKey((uint)vk, 0); // MAPVK_VK_TO_VSC
            
            // KEYDOWN
            // 0-15: Repeat=1
            // 16-23: ScanCode
            IntPtr lParamDown = (IntPtr)(1 | (scanCode << 16));
            
            // Use PostMessage first (Async is better for loops), if fails we might try SendMessage
            PostMessage(hwnd, WM_KEYDOWN, (IntPtr)vk, lParamDown);

            // CHAR (Try to translate and send WM_CHAR)
            // Some games ignore KeyDown and look for Char, or need both
            StringBuilder sb = new StringBuilder(5);
            byte[] keyState = new byte[256];
            GetKeyboardState(keyState);
            if (ToUnicode((uint)vk, scanCode, keyState, sb, sb.Capacity, 0) > 0) {
                 foreach (char c in sb.ToString()) {
                     PostMessage(hwnd, WM_CHAR, (IntPtr)c, (IntPtr)(1 | (scanCode << 16)));
                 }
            }

            Thread.Sleep(100); 

            // KEYUP
            // 30: Prev=1, 31: Trans=1
            // 0xC0000001
            uint flagsUp = 0xC0000001 | (scanCode << 16);
            IntPtr lParamUp = (IntPtr)unchecked((int)flagsUp);
            
            PostMessage(hwnd, WM_KEYUP, (IntPtr)vk, lParamUp);
        }
    }
}
'@

Add-Type -TypeDefinition $code

Write-Output "Background Scancode Sender (Hybrid) Ready"

while ($true) {
    # Format: HWND|VK1,VK2|INTERVAL
    $line = Read-Host
    if ($line -eq $null) { break }
    
    $parts = $line.Split('|')
    if ($parts.Length -lt 2) { continue }
    
    try {
        $hwnd = [IntPtr]::new([long]$parts[0])
        $keys = $parts[1].Split(',')
        $interval = if ($parts.Length -gt 2) { [int]$parts[2] } else { 50 }
        
        foreach ($k in $keys) {
            $vk = [int]$k
            [Native.Input]::SendBackgroundKey($hwnd, $vk)
            Start-Sleep -Milliseconds $interval
        }
    }
    catch {
        Write-Error "Error: $_"
    }
}
