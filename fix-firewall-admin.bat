@echo off
REM This script must be run as Administrator
echo ========================================
echo Adding Windows Firewall Rule for Expo
echo ========================================
echo.
echo This will allow port 8081 through Windows Firewall
echo.

netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Firewall rule added successfully!
    echo.
) else (
    echo.
    echo ✗ Failed to add firewall rule
    echo Make sure you're running as Administrator
    echo.
)

pause

