@echo off
setlocal enabledelayedexpansion
echo ========================================
echo Expo Connection Helper
echo ========================================
echo.

REM Find local IP address
echo Finding your local IP address...
echo.

set IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "TEMP_IP=%%a"
    set "TEMP_IP=!TEMP_IP:~1!"
    if "!IP!"=="" set "IP=!TEMP_IP!"
    echo Found IP: !TEMP_IP!
)

if not "!IP!"=="" (
    echo.
    echo Using IP: !IP!
    echo.
    goto :found_ip
)

:found_ip
if "%IP%"=="" (
    echo Could not find IP address automatically.
    echo Please find it manually:
    echo   1. Open PowerShell
    echo   2. Run: ipconfig ^| findstr IPv4
    echo   3. Look for your local IP (usually starts with 192.168.x.x)
    echo.
    set /p IP="Enter your IP address manually: "
)

echo ========================================
echo Connection Options:
echo ========================================
echo.
echo 1. LAN Mode (Recommended for same WiFi network)
echo    - Fastest connection
echo    - Requires same WiFi network
echo    - May not work with firewalls
echo.
echo 2. Tunnel Mode (Recommended for firewall issues)
echo    - Works through firewalls
echo    - Requires Expo account (free)
echo    - Slower than LAN
echo.
echo 3. Localhost Mode (Emulator/Simulator only)
echo    - Only works for emulators on same computer
echo.
echo 4. Default Mode (Let Expo decide)
echo.
set /p choice="Select option (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting Expo with LAN mode...
    echo Your app should connect at: exp://%IP%:8081
    echo.
    echo To test connection, open this URL on your phone's browser:
    echo http://%IP%:8081
    echo.
    npx expo start --lan
) else if "%choice%"=="2" (
    echo.
    echo Starting Expo with Tunnel mode...
    echo This may take a moment to establish tunnel...
    echo.
    npx expo start --tunnel
) else if "%choice%"=="3" (
    echo.
    echo Starting Expo with Localhost mode...
    echo NOTE: This only works for emulators/simulators!
    echo.
    npx expo start --localhost
) else (
    echo.
    echo Starting Expo with default settings...
    echo.
    npx expo start
)

pause

