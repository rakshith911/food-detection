@echo off
echo ========================================
echo Checking Build Status
echo ========================================
echo.

REM Check if app is installed
adb shell pm list packages | findstr "fooddetection" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ App is installed on emulator
) else (
    echo ✗ App not installed yet - build in progress...
)

echo.

REM Check if Metro is running
netstat -an | findstr ":8081" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Metro bundler is running on port 8081
) else (
    echo ✗ Metro bundler is not running
)

echo.

REM Check emulator
adb devices | findstr "emulator" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Emulator is connected
) else (
    echo ✗ No emulator detected
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo If build is complete:
echo   1. The app should open automatically
echo   2. Metro bundler will start automatically  
echo   3. The app will connect automatically
echo.
echo If app doesn't connect:
echo   1. Shake emulator (Ctrl+M)
echo   2. Select "Configure Bundler"
echo   3. Enter: localhost:8081
echo.
pause

