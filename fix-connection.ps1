# Fix Expo Connection Issue
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Expo Connection Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" 
} | Select-Object -ExpandProperty IPAddress

if ($ipAddresses.Count -gt 0) {
    $ip = $ipAddresses[0]
    Write-Host "Your IP Address: $ip" -ForegroundColor Green
} else {
    Write-Host "Could not find IP address" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking Metro bundler..." -ForegroundColor Yellow
$metroRunning = Test-NetConnection -ComputerName localhost -Port 8081 -WarningAction SilentlyContinue
if ($metroRunning.TcpTestSucceeded) {
    Write-Host "✓ Metro bundler is running on port 8081" -ForegroundColor Green
} else {
    Write-Host "✗ Metro bundler is NOT running" -ForegroundColor Red
    Write-Host "Starting Metro bundler..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"
    Write-Host "Waiting for Metro to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connection Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app uses expo-dev-client (development build)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use Development Build (Recommended)" -ForegroundColor White
Write-Host "  1. Build development client:" -ForegroundColor Gray
Write-Host "     npm run android" -ForegroundColor Cyan
Write-Host "     OR" -ForegroundColor Gray
Write-Host "     eas build --profile development --platform android" -ForegroundColor Cyan
Write-Host "  2. Install the APK on your device" -ForegroundColor Gray
Write-Host "  3. Open the app - it will connect automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Use Expo Go (Limited - some features may not work)" -ForegroundColor White
Write-Host "  1. Open Expo Go app on your phone" -ForegroundColor Gray
Write-Host "  2. Shake device or press menu" -ForegroundColor Gray
Write-Host "  3. Select 'Enter URL manually'" -ForegroundColor Gray
Write-Host "  4. Enter: exp://$ip`:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 3: Test Connection" -ForegroundColor White
Write-Host "  1. Open browser on your phone" -ForegroundColor Gray
Write-Host "  2. Go to: http://$ip`:8081" -ForegroundColor Cyan
Write-Host "  3. If you see Metro status page, network is fine" -ForegroundColor Gray
Write-Host ""
Write-Host "If browser works but app doesn't:" -ForegroundColor Yellow
Write-Host "  - Check Windows Firewall (allow port 8081)" -ForegroundColor Gray
Write-Host "  - Ensure both devices on same WiFi" -ForegroundColor Gray
Write-Host "  - Try tunnel mode: npm run start:tunnel" -ForegroundColor Cyan
Write-Host ""

# Check Windows Firewall
Write-Host "Checking Windows Firewall..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "*8081*" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    Write-Host "⚠ No firewall rule found for port 8081" -ForegroundColor Yellow
    Write-Host "  You may need to allow port 8081 through Windows Firewall" -ForegroundColor Gray
} else {
    Write-Host "✓ Firewall rule exists for port 8081" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

