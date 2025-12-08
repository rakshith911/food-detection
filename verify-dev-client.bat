@echo off
echo ========================================
echo Verifying Development Client Setup
echo ========================================
echo.

REM Check if app is installed
echo Checking installed app...
adb shell pm list packages | findstr "fooddetection" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ App is installed
) else (
    echo ✗ App not installed - run: npm run android
    goto :end
)

echo.

REM Check if it's a dev client (has expo-dev-client)
echo Checking if development client is installed...
adb shell dumpsys package com.firebeats.fooddetection | findstr "expo.dev" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Development client detected
) else (
    echo ⚠ May not be development client - rebuild with: npm run android
)

echo.

REM Check Metro
echo Checking Metro bundler...
netstat -an | findstr ":8081" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Metro bundler is running
) else (
    echo ✗ Metro bundler is not running - start with: npm start
)

echo.

REM Check emulator
echo Checking emulator connection...
adb devices | findstr "emulator" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Emulator is connected
) else (
    echo ✗ No emulator detected
)

echo.

REM Set up port forwarding
echo Setting up port forwarding...
adb reverse tcp:8081 tcp:8081 >nul 2>&1
echo ✓ Port forwarding configured

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Make sure Metro is running: npm start
echo 2. Launch the app on emulator
echo 3. The app should connect automatically
echo.
echo If you still see "react-native-vision-camera not supported":
echo   - The build may not have completed yet
echo   - Wait for build to finish (check terminal)
echo   - Or rebuild: npm run android
echo.

:end
pause

