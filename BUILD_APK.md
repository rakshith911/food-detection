# Building Android APK

This guide explains how to build an APK for the food-detection Android app.

## Prerequisites

1. **Java Development Kit (JDK)**: Install JDK 17 or higher
   - Download from: https://www.oracle.com/java/technologies/downloads/
   - Or use OpenJDK: https://adoptium.net/

2. **Android SDK**: 
   - Install Android Studio: https://developer.android.com/studio
   - Or install Android SDK command-line tools
   - Set `ANDROID_HOME` environment variable

3. **Node.js and npm**: Already installed (required for Expo)

## Method 1: Local Build (Recommended for Testing)

### Windows

1. Open PowerShell or Command Prompt in the `food-detection` directory

2. Run the build script:
   ```bash
   .\build-apk.bat
   ```

   Or manually:
   ```bash
   cd android
   gradlew.bat assembleRelease
   ```

### Linux/Mac

1. Open Terminal in the `food-detection` directory

2. Make the script executable (first time only):
   ```bash
   chmod +x build-apk.sh
   ```

3. Run the build script:
   ```bash
   ./build-apk.sh
   ```

   Or manually:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### Using npm script

You can also use the npm script:
```bash
npm run build:apk
```

Or with clean build:
```bash
npm run build:android:clean
```

### Output Location

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Installing on Device

1. Enable USB debugging on your Android device
2. Connect device via USB
3. Install using ADB:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

## Method 2: EAS Build (Cloud Build)

### Setup

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

### Build APK

Build for Android:
```bash
eas build --platform android --profile production
```

Or for a preview build:
```bash
eas build --platform android --profile preview
```

The build will be done in the cloud and you'll get a download link when it's complete.

## Method 3: Using Expo CLI (Alternative)

If you have the Android folder already generated:

```bash
cd android
./gradlew assembleRelease  # Linux/Mac
gradlew.bat assembleRelease  # Windows
```

## Troubleshooting

### Build Fails with "SDK not found"

1. Set `ANDROID_HOME` environment variable:
   - Windows: `set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk`
   - Linux/Mac: `export ANDROID_HOME=$HOME/Android/Sdk`

2. Add to PATH:
   - Windows: Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools` to PATH
   - Linux/Mac: Add `$ANDROID_HOME/platform-tools` and `$ANDROID_HOME/tools` to PATH

### Build Fails with "Java version error"

- Ensure JDK 17 or higher is installed
- Set `JAVA_HOME` environment variable to your JDK installation path

### Build Fails with "Gradle daemon error"

- Stop Gradle daemon: `cd android && ./gradlew --stop`
- Try building again

### Build Fails with "peer not authenticated" or SSL errors

This is usually a network/SSL certificate issue. Try:

1. **Refresh dependencies:**
   ```bash
   cd android
   ./gradlew --refresh-dependencies
   ./gradlew assembleRelease
   ```

2. **If behind a corporate proxy**, add to `android/gradle.properties`:
   ```properties
   systemProp.http.proxyHost=your.proxy.host
   systemProp.http.proxyPort=8080
   systemProp.https.proxyHost=your.proxy.host
   systemProp.https.proxyPort=8080
   ```

3. **Use the troubleshooting script:**
   ```bash
   .\build-apk-troubleshoot.bat  # Windows
   ```

4. **Clear Gradle cache:**
   ```bash
   cd android
   ./gradlew clean --refresh-dependencies
   ```

5. **Check firewall/antivirus** - they might be blocking Maven downloads

### APK is too large

- The APK includes all native libraries for all architectures
- Consider using App Bundle (AAB) for Play Store: `./gradlew bundleRelease`
- Or use EAS Build which can optimize the build

## Signing the APK (For Production)

Currently, the app uses a debug keystore. For production:

1. Generate a release keystore:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   signingConfigs {
       release {
           storeFile file('my-release-key.keystore')
           storePassword 'your-password'
           keyAlias 'my-key-alias'
           keyPassword 'your-password'
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           // ... other config
       }
   }
   ```

## Notes

- The first build may take 10-15 minutes as it downloads dependencies
- Subsequent builds are faster (2-5 minutes)
- Make sure you have at least 2GB free disk space
- The debug APK is signed with a default debug keystore (not suitable for Play Store)

