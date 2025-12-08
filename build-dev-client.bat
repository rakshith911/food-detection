@echo off
echo ========================================
echo Building Development Client for Android
echo ========================================
echo.
echo This will build and install a development client
echo that supports react-native-vision-camera.
echo.
echo NOTE: This requires Android SDK and may take 5-10 minutes
echo.

REM Check if emulator is running
adb devices | findstr "emulator" >nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: No emulator detected!
    echo Please start your Android emulator first.
    echo.
    pause
)

echo Building development client...
echo This will:
echo   1. Generate native Android code
echo   2. Build the development client APK
echo   3. Install it on your emulator
echo.
echo Starting build...
echo.

npx expo run:android

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo After the app installs:
echo   1. Metro bundler will start automatically
echo   2. The app will connect automatically
echo   3. You can now use react-native-vision-camera
echo.
pause

