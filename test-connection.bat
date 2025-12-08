@echo off
echo ========================================
echo Testing Expo Connection
echo ========================================
echo.

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    goto :found_ip
)

:found_ip
echo Your IP Address: %IP%
echo.

echo Testing port 8081...
netstat -an | findstr ":8081"
echo.

echo ========================================
echo Connection Test
echo ========================================
echo.
echo 1. Open browser on your phone
echo 2. Go to: http://%IP%:8081
echo 3. You should see Metro bundler status page
echo.
echo If browser works but app doesn't:
echo   - Open Expo Go app
echo   - Shake device or press menu
echo   - Select "Enter URL manually"
echo   - Enter: exp://%IP%:8081
echo.
echo If browser doesn't work:
echo   - Check Windows Firewall
echo   - Ensure both devices on same WiFi
echo   - Try tunnel mode: npm run start:tunnel
echo.
pause

