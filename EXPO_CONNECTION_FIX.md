# Fixing Expo "No Apps Connected" Error

## Problem
Expo Metro bundler can't connect to your device/simulator. This is usually a network/firewall issue.

## Quick Solutions (Try in order)

### Solution 1: Use Tunnel Mode (Recommended for Firewall Issues)
Tunnel mode bypasses local network issues by routing through Expo's servers:

```bash
expo start --tunnel
```

Or add to `package.json` scripts:
```json
"start:tunnel": "expo start --tunnel"
```

**Note**: Tunnel mode requires an Expo account (free) and may be slower than LAN.

### Solution 2: Use LAN Mode with Local IP
1. **Find your local IP address:**
   - Windows: Open PowerShell and run:
     ```powershell
     ipconfig | findstr IPv4
     ```
   - Look for the IP address (e.g., `192.168.0.42`)

2. **Start Expo with LAN mode:**
   ```bash
   expo start --lan
   ```

3. **Test connection from your phone:**
   - Open browser on your phone
   - Navigate to: `http://YOUR_IP_ADDRESS:8081`
   - You should see the Expo DevTools page

4. **If browser works but app doesn't:**
   - Shake your device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
   - Select "Enter URL manually"
   - Enter: `exp://YOUR_IP_ADDRESS:8081`

### Solution 3: Configure Firewall
Allow port 8081 through Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `8081`
6. Allow the connection
7. Apply to all profiles
8. Name it "Expo Metro Bundler"

### Solution 4: Use Localhost (For Emulator/Simulator Only)
If using an emulator/simulator on the same machine:

```bash
expo start --localhost
```

**Note**: This only works for emulators/simulators, not physical devices.

### Solution 5: Check Network Connection
Ensure your device and computer are on the **same WiFi network**:
- Both must be on the same network
- Some corporate/public networks block device-to-device communication
- Try using a mobile hotspot if your WiFi blocks connections

## Automated Helper Script

Use the provided `start-expo-helper.bat` script to automatically:
1. Find your local IP address
2. Start Expo with the correct mode
3. Display connection instructions

## Troubleshooting Steps

### Step 1: Verify Metro is Running
When you run `expo start`, you should see:
```
Metro waiting on exp://192.168.x.x:8081
```

### Step 2: Test Browser Access
From your phone's browser, try:
```
http://YOUR_COMPUTER_IP:8081
```

If this works, the network is fine - the issue is with the Expo app connection.

### Step 3: Check Expo Go App
- Make sure you're using the latest version of Expo Go
- Try logging out and back into Expo Go
- Clear Expo Go app cache/data

### Step 4: Manual Connection
In Expo Go app:
1. Shake device or press menu button
2. Select "Enter URL manually"
3. Enter: `exp://YOUR_IP_ADDRESS:8081`

### Step 5: Reset Metro Cache
```bash
expo start --clear
```

## Common Issues

### Issue: "Unable to resolve host"
- Your device can't reach your computer
- Check firewall settings
- Ensure both devices on same network
- Try tunnel mode

### Issue: "Network request failed"
- Firewall blocking connection
- Network doesn't allow device-to-device communication
- Solution: Use tunnel mode or mobile hotspot

### Issue: Works on WiFi but not on mobile data
- This is expected - Metro bundler only works on local network
- Use tunnel mode for remote access (slower but works)

## Recommended Setup

For development, add these scripts to `package.json`:

```json
{
  "scripts": {
    "start": "expo start",
    "start:lan": "expo start --lan",
    "start:tunnel": "expo start --tunnel",
    "start:localhost": "expo start --localhost",
    "start:clear": "expo start --clear"
  }
}
```

Then use:
- `npm run start:lan` - For physical devices on same network
- `npm run start:tunnel` - When LAN doesn't work (firewall issues)
- `npm run start:localhost` - For emulators/simulators only

## Still Not Working?

1. **Check Expo CLI version:**
   ```bash
   npx expo --version
   ```
   Update if needed: `npm install -g expo-cli@latest`

2. **Check Node version:**
   ```bash
   node --version
   ```
   Should be Node 18+ for Expo SDK 54

3. **Restart everything:**
   - Stop Metro bundler (Ctrl+C)
   - Close Expo Go app
   - Restart your computer
   - Try again

4. **Check for VPN:**
   - VPNs can interfere with local network connections
   - Disable VPN and try again

5. **Try different network:**
   - Use mobile hotspot
   - Try different WiFi network
   - Some networks block device-to-device communication

