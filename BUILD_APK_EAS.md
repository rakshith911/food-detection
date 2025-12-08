# Building Android APK with EAS Build

This is the **recommended method** to build your APK. EAS Build runs in the cloud, so you don't need to worry about local network issues, SSL certificates, or Android SDK setup.

## Quick Start

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

If you don't have an Expo account, create one at https://expo.dev

### 3. Configure EAS (First time only)

```bash
eas build:configure
```

This will set up your project for EAS Build.

### 4. Build APK

**For preview/testing (APK format):**
```bash
eas build --platform android --profile preview
```

**For production (APK format):**
```bash
eas build --platform android --profile production
```

The build will run in the cloud. You'll get a download link when it's complete (usually takes 10-20 minutes).

## Installing the APK

### Option 1: Install on Emulator Automatically

After the build completes, the CLI will ask if you want to install it on an emulator. Press `Y` to install automatically.

Or install a specific build later:
```bash
eas build:run -p android --latest
```

### Option 2: Install on Physical Device

1. **Download the APK:**
   - Copy the download URL from the build completion message
   - Or visit the build page on expo.dev

2. **Send to device:**
   - Email the URL to yourself
   - Or use a QR code
   - Or download on your computer and transfer via USB

3. **Install:**
   - Open the URL on your Android device
   - Allow installation from unknown sources if prompted
   - Tap to install

### Option 3: Install with ADB

1. **Download the APK** to your computer

2. **Connect your device** via USB and enable USB debugging

3. **Install:**
   ```bash
   adb install path/to/downloaded.apk
   ```

## Build Profiles

The project is configured with these profiles:

- **`preview`**: Builds APK for testing (internal distribution)
- **`production`**: Builds APK for production release
- **`development`**: Builds development client (for Expo Go alternative)

## Benefits of EAS Build

✅ No local Android SDK setup required  
✅ No network/SSL issues  
✅ Consistent build environment  
✅ Automatic signing (or you can provide your own keystore)  
✅ Builds run in the cloud  
✅ Works on any operating system  

## Troubleshooting

### Build fails with authentication error

Make sure you're logged in:
```bash
eas login
```

### Want to use your own keystore?

See: https://docs.expo.dev/app-signing/app-credentials/#android-credentials

### Need to build locally instead?

See `BUILD_APK.md` for local build instructions (requires fixing network issues first).

## Next Steps

1. Run `eas build --platform android --profile preview`
2. Wait for build to complete (10-20 minutes)
3. Download and install the APK
4. Test your app!

