@echo off
echo ========================================
echo Connecting Emulator to Metro
echo ========================================
echo.

REM Check emulator
adb devices | findstr "emulator" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No emulator detected!
    echo Please start your Android emulator first.
    pause
    exit /b 1
)

echo ✓ Emulator detected
echo.

REM Set up port forwarding
echo Setting up port forwarding (localhost:8081)...
adb reverse tcp:8081 tcp:8081
if %ERRORLEVEL% EQU 0 (
    echo ✓ Port forwarding configured
) else (
    echo ✗ Failed to configure port forwarding
)
echo.

REM Reload app
echo Reloading app...
adb shell am broadcast -a host.exp.exponent.EXPO_RELOAD >nul 2>&1
echo ✓ Reload signal sent
echo.

echo ========================================
echo Connection Status
echo ========================================
echo.
echo If Metro is running, the app should connect automatically.
echo.
echo To manually connect:
echo   1. Shake emulator (Ctrl+M)
echo   2. Select "Configure Bundler"
echo   3. Enter: localhost:8081
echo.
echo To reload app:
echo   - Press 'r' in Metro terminal
echo   - Or shake device and select "Reload"
echo.
pause

