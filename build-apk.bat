@echo off
REM Build APK script for Android (Windows)
REM This script builds a release APK locally

echo Building Android APK...

REM Navigate to android directory
cd android

REM Clean previous builds
echo Cleaning previous builds...
call gradlew.bat clean

REM Build release APK
echo Building release APK...
call gradlew.bat assembleRelease

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ APK built successfully!
    echo 📦 APK location: android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo To install on a connected device:
    echo   adb install android\app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo ❌ Build failed. Please check the error messages above.
    exit /b 1
)

