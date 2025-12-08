@echo off
echo ========================================
echo Waiting for Build to Complete
echo ========================================
echo.
echo Checking build status...
echo.

:check
timeout /t 5 /nobreak >nul

REM Check if APK exists
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ✓ Build completed! APK found.
    echo.
    echo Installing on emulator...
    adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo ✓ Installation complete!
    echo.
    echo Launching app...
    adb shell am start -n com.firebeats.fooddetection/.MainActivity
    echo.
    echo ✓ App launched!
    echo.
    echo The development client should now be running.
    echo The react-native-vision-camera error should be gone.
    goto :end
)

REM Check if Java/Gradle is still running
tasklist | findstr "java.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo Build still in progress... (Java processes running)
    echo Checking again in 5 seconds...
    goto :check
) else (
    echo Build processes stopped. Checking for APK...
    if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        echo ✓ APK found! Installing...
        adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
        adb shell am start -n com.firebeats.fooddetection/.MainActivity
        goto :end
    ) else (
        echo ✗ Build may have failed. Check terminal for errors.
        echo.
        echo Try running: npm run android
    )
)

:end
echo.
pause

