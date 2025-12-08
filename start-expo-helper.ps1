# Expo Connection Helper (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Connection Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find local IP address
Write-Host "Finding your local IP address..." -ForegroundColor Yellow
Write-Host ""

$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -ExpandProperty IPAddress

if ($ipAddresses.Count -eq 0) {
    Write-Host "Could not find IP address automatically." -ForegroundColor Red
    Write-Host "Please find it manually:" -ForegroundColor Yellow
    Write-Host "  1. Run: ipconfig | findstr IPv4" -ForegroundColor Yellow
    Write-Host "  2. Look for your local IP (usually starts with 192.168.x.x)" -ForegroundColor Yellow
    Write-Host ""
    $ip = Read-Host "Enter your IP address manually"
} else {
    Write-Host "Found IP addresses:" -ForegroundColor Green
    $ipAddresses | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
    
    if ($ipAddresses.Count -eq 1) {
        $ip = $ipAddresses[0]
        Write-Host "Using IP: $ip" -ForegroundColor Green
    } else {
        Write-Host "Multiple IP addresses found. Select one:" -ForegroundColor Yellow
        $index = 1
        $ipAddresses | ForEach-Object {
            Write-Host "  $index. $_" -ForegroundColor White
            $index++
        }
        $selection = Read-Host "Enter number (1-$($ipAddresses.Count))"
        $ip = $ipAddresses[$selection - 1]
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connection Options:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. LAN Mode (Recommended for same WiFi network)" -ForegroundColor White
Write-Host "   - Fastest connection" -ForegroundColor Gray
Write-Host "   - Requires same WiFi network" -ForegroundColor Gray
Write-Host "   - May not work with firewalls" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Tunnel Mode (Recommended for firewall issues)" -ForegroundColor White
Write-Host "   - Works through firewalls" -ForegroundColor Gray
Write-Host "   - Requires Expo account (free)" -ForegroundColor Gray
Write-Host "   - Slower than LAN" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Localhost Mode (Emulator/Simulator only)" -ForegroundColor White
Write-Host "   - Only works for emulators on same computer" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Default Mode (Let Expo decide)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Expo with LAN mode..." -ForegroundColor Green
        Write-Host "Your app should connect at: exp://${ip}:8081" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To test connection, open this URL on your phone's browser:" -ForegroundColor Yellow
        Write-Host "http://${ip}:8081" -ForegroundColor White
        Write-Host ""
        npx expo start --lan
    }
    "2" {
        Write-Host ""
        Write-Host "Starting Expo with Tunnel mode..." -ForegroundColor Green
        Write-Host "This may take a moment to establish tunnel..." -ForegroundColor Yellow
        Write-Host ""
        npx expo start --tunnel
    }
    "3" {
        Write-Host ""
        Write-Host "Starting Expo with Localhost mode..." -ForegroundColor Green
        Write-Host "NOTE: This only works for emulators/simulators!" -ForegroundColor Yellow
        Write-Host ""
        npx expo start --localhost
    }
    default {
        Write-Host ""
        Write-Host "Starting Expo with default settings..." -ForegroundColor Green
        Write-Host ""
        npx expo start
    }
}

