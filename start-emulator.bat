@echo off
echo ========================================
echo Starting Expo for Android Emulator
echo ========================================
echo.

REM Check if emulator is running
adb devices | findstr "emulator" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No emulator detected!
    echo Please start your Android emulator first.
    echo.
    pause
    exit /b 1
)

echo ✓ Emulator detected
echo.

REM Set up port forwarding
echo Setting up port forwarding...
adb reverse tcp:8081 tcp:8081
if %ERRORLEVEL% EQU 0 (
    echo ✓ Port forwarding configured
) else (
    echo ✗ Failed to configure port forwarding
)
echo.

echo ========================================
echo Starting Metro Bundler...
echo ========================================
echo.
echo The app should connect automatically.
echo If not, shake device and select "Reload"
echo.

npx expo start --localhost

