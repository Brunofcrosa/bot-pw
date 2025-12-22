$code = '[DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);'
Add-Type -MemberDefinition $code -Name "User32" -Namespace Win32

Write-Output "READY"

while ($true) {
    $line = Read-Host
    if ($line -eq $null) { break }
    
    # Format: HWND|VK1,VK2|INTERVAL
    $parts = $line.Split('|')
    if ($parts.Length -lt 2) { continue }
    
    try {
        $hwnd = [IntPtr]::new([long]$parts[0])
        $keys = $parts[1].Split(',')
        $interval = if ($parts.Length -gt 2) { [int]$parts[2] } else { 50 }
        
        foreach ($k in $keys) {
            $vk = [uint32]$k
            [Win32.User32]::PostMessage($hwnd, 0x0100, $vk, 0) # WM_KEYDOWN
            Start-Sleep -Milliseconds 50
            [Win32.User32]::PostMessage($hwnd, 0x0101, $vk, 0) # WM_KEYUP
            Start-Sleep -Milliseconds $interval
        }
    } catch {
        Write-Error $_
    }
}
