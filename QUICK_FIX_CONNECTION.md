# Quick Fix: Expo "No Apps Connected" Error

## 🚀 Fastest Solution

### Option 1: Use Tunnel Mode (Works Everywhere)
```bash
npm run start:tunnel
```
or
```bash
expo start --tunnel
```

**Why this works**: Tunnel mode routes through Expo's servers, bypassing firewall/router issues.

---

### Option 2: Use LAN Mode (Faster, Same Network Required)
```bash
npm run start:lan
```
or
```bash
expo start --lan
```

**Requirements**: 
- Device and computer on same WiFi network
- Firewall allows port 8081

---

## 🔧 Step-by-Step Troubleshooting

### Step 1: Find Your IP Address
Run this script:
```bash
.\get-local-ip.bat
```

Or manually:
```powershell
ipconfig | findstr IPv4
```

### Step 2: Test Browser Connection
On your phone's browser, open:
```
http://YOUR_IP_ADDRESS:8081
```

**If browser works**: Network is fine, issue is with Expo app connection
**If browser doesn't work**: Firewall/network issue - use tunnel mode

### Step 3: Connect Expo Go App
1. Shake device or press menu button
2. Select "Enter URL manually"
3. Enter: `exp://YOUR_IP_ADDRESS:8081`

---

## 🛠️ Helper Scripts

### Automated Helper (Recommended)
```bash
.\start-expo-helper.bat
```
or PowerShell:
```powershell
.\start-expo-helper.ps1
```

This script will:
- Find your IP automatically
- Let you choose connection mode
- Start Expo with correct settings

---

## 📋 Available NPM Scripts

After updating package.json, you can use:

```bash
npm run start          # Default mode
npm run start:lan      # LAN mode (same WiFi)
npm run start:tunnel   # Tunnel mode (works through firewalls)
npm run start:localhost # Localhost (emulator only)
npm run start:clear    # Clear cache and start
```

---

## 🔥 Common Issues & Fixes

### Issue: "Unable to resolve host"
**Fix**: Use tunnel mode or check firewall

### Issue: Works on WiFi but not mobile data
**Fix**: Expected behavior - Metro only works on local network. Use tunnel mode for remote access.

### Issue: Browser works but app doesn't connect
**Fix**: 
1. Clear Expo Go app cache
2. Log out and back into Expo Go
3. Try manual URL entry: `exp://IP:8081`

### Issue: Still not working
**Fix**: 
1. Restart everything (Metro, Expo Go, computer)
2. Try different WiFi network
3. Disable VPN if active
4. Use mobile hotspot as WiFi

---

## ✅ Quick Checklist

- [ ] Device and computer on same WiFi network (for LAN mode)
- [ ] Firewall allows port 8081 (or use tunnel mode)
- [ ] Latest Expo Go app installed
- [ ] Can access `http://YOUR_IP:8081` from phone browser
- [ ] VPN disabled (if using LAN mode)

---

## 💡 Pro Tips

1. **For development**: Use LAN mode (fastest)
2. **For firewall issues**: Use tunnel mode (most reliable)
3. **For emulators**: Use localhost mode
4. **For testing**: Use helper script to find IP automatically

---

## 📞 Still Stuck?

1. Check `EXPO_CONNECTION_FIX.md` for detailed troubleshooting
2. Try tunnel mode - it works 99% of the time
3. Check Expo documentation: https://docs.expo.dev/

