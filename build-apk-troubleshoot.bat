@echo off
REM Troubleshooting build script for Android APK
REM This script tries multiple approaches to build the APK

echo ========================================
echo Android APK Build Troubleshooting
echo ========================================
echo.

cd android

echo Step 1: Stopping Gradle daemon...
call gradlew.bat --stop
echo.

echo Step 2: Cleaning build cache...
call gradlew.bat clean --no-daemon
echo.

echo Step 3: Refreshing dependencies...
call gradlew.bat --refresh-dependencies --no-daemon
echo.

echo Step 4: Building release APK...
call gradlew.bat assembleRelease --no-daemon --refresh-dependencies

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ SUCCESS! APK built successfully!
    echo ========================================
    echo.
    echo 📦 APK location: android\app\build\outputs\apk\release\app-release.apk
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Build failed. Trying alternative approach...
    echo ========================================
    echo.
    echo Attempting build with offline mode (if dependencies cached)...
    call gradlew.bat assembleRelease --offline --no-daemon
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ SUCCESS with offline mode!
        echo 📦 APK location: android\app\build\outputs\apk\release\app-release.apk
    ) else (
        echo.
        echo ========================================
        echo ❌ Build still failed.
        echo ========================================
        echo.
        echo Troubleshooting steps:
        echo 1. Check your internet connection
        echo 2. If behind a proxy, configure it in gradle.properties:
        echo    systemProp.http.proxyHost=your.proxy.host
        echo    systemProp.http.proxyPort=8080
        echo 3. Try: gradlew.bat clean --refresh-dependencies
        echo 4. Check if Android SDK is properly installed
        echo 5. Verify JAVA_HOME is set correctly
        echo.
        exit /b 1
    )
)

