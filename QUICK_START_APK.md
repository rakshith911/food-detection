# Quick Start: Build Android APK with EAS

## ✅ Configuration Complete!

Your project is now configured to build APKs using EAS Build. This avoids all local network/SSL issues.

## 🚀 Build Your APK (3 Steps)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
(Create account at https://expo.dev if needed)

### Step 3: Build APK
```bash
# For testing/preview (recommended first)
npm run build:eas:android

# Or for production
npm run build:eas:android:prod

# Or use EAS directly
eas build --platform android --profile preview
```

## 📱 Install on Device

### Automatic (Emulator)
After build completes, press `Y` when prompted, or run:
```bash
npm run build:eas:run
```

### Manual (Physical Device)
1. Copy the download URL from the build output
2. Open URL on your Android device
3. Install the APK

## ⚡ Quick Commands

```bash
# Build preview APK
npm run build:eas:android

# Build production APK  
npm run build:eas:android:prod

# Install latest build on emulator
npm run build:eas:run
```

## 📚 More Info

- See `BUILD_APK_EAS.md` for detailed instructions
- See `BUILD_APK.md` for local build (if you fix network issues)

## 🎯 What's Configured

- ✅ `preview` profile: Builds APK for testing
- ✅ `production` profile: Builds APK for release
- ✅ Both profiles configured with `buildType: "apk"`

Build time: ~10-20 minutes (runs in cloud)

