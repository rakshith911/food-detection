@echo off
echo ========================================
echo Starting Expo with Connection Info
echo ========================================
echo.

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    goto :found_ip
)

:found_ip
echo Your IP Address: %IP%
echo.
echo Starting Expo Metro Bundler...
echo.
echo ========================================
echo CONNECTION URL:
echo ========================================
echo exp://%IP%:8081
echo.
echo ========================================
echo TO CONNECT:
echo ========================================
echo.
echo If using Expo Go:
echo   1. Open Expo Go app
echo   2. Shake device or press menu
echo   3. Select "Enter URL manually"
echo   4. Enter: exp://%IP%:8081
echo.
echo If using Development Build:
echo   - App should connect automatically
echo   - If not, shake device and select "Configure Bundler"
echo   - Enter: %IP%:8081
echo.
echo ========================================
echo.

npx expo start --lan

