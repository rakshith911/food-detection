# Fix Emulator Connection
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Emulator Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check emulator
$devices = adb devices
if ($devices -notmatch "emulator") {
    Write-Host "ERROR: No emulator detected!" -ForegroundColor Red
    Write-Host "Please start your Android emulator first." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Emulator detected" -ForegroundColor Green
Write-Host ""

# Set up port forwarding
Write-Host "Setting up port forwarding..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Port forwarding configured" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to configure port forwarding" -ForegroundColor Red
}
Write-Host ""

# Check if Metro is running
$metroRunning = Test-NetConnection -ComputerName localhost -Port 8081 -WarningAction SilentlyContinue
if (-not $metroRunning.TcpTestSucceeded) {
    Write-Host "Metro bundler is not running!" -ForegroundColor Yellow
    Write-Host "Starting Metro bundler..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"
    Write-Host "Waiting for Metro to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "✓ Metro bundler is running" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure Metro bundler is running:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Launch the app on emulator:" -ForegroundColor White
Write-Host "   adb shell am start -n com.firebeats.fooddetection/.MainActivity" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. If app doesn't connect automatically:" -ForegroundColor White
Write-Host "   - Shake emulator (Ctrl+M or Cmd+M)" -ForegroundColor Gray
Write-Host "   - Select 'Configure Bundler'" -ForegroundColor Gray
Write-Host "   - Enter: localhost:8081" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Or reload the app:" -ForegroundColor White
Write-Host "   - Press 'r' in Metro terminal" -ForegroundColor Gray
Write-Host "   - Or shake device and select 'Reload'" -ForegroundColor Gray
Write-Host ""

