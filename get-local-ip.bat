@echo off
echo ========================================
echo Finding Your Local IP Address
echo ========================================
echo.
echo Your local IP addresses:
echo.

ipconfig | findstr /c:"IPv4"

echo.
echo ========================================
echo Instructions:
echo ========================================
echo.
echo 1. Look for the IP address that starts with 192.168.x.x or 10.x.x.x
echo 2. This is your local IP address
echo 3. Use this IP to connect from your phone
echo.
echo To test connection:
echo   - Open browser on your phone
echo   - Go to: http://YOUR_IP:8081
echo   - You should see Expo DevTools
echo.
echo To connect Expo Go app:
echo   - Shake device or press menu
echo   - Select "Enter URL manually"
echo   - Enter: exp://YOUR_IP:8081
echo.
pause

