# Fixing Network/SSL Issues for Android APK Build

## Current Issue
The build is failing with SSL/authentication errors when downloading Kotlin dependencies:
- "No PSK available. Unable to resume"
- "peer not authenticated"

## Solutions (Try in order)

### Solution 1: Disable SSL Verification (Quick Fix - Development Only)

⚠️ **Warning**: Only use this for development builds, not production!

Add to `android/gradle.properties`:
```properties
systemProp.javax.net.ssl.trustStore=NONE
systemProp.javax.net.ssl.trustStoreType=Windows-ROOT
```

Or disable SSL verification:
```properties
systemProp.javax.net.ssl.trustStore=
systemProp.javax.net.ssl.trustStorePassword=
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Djavax.net.ssl.trustStore=NONE
```

### Solution 2: Configure Proxy (If Behind Corporate Firewall)

If you're behind a corporate proxy, add to `android/gradle.properties`:
```properties
systemProp.http.proxyHost=your.proxy.host
systemProp.http.proxyPort=8080
systemProp.http.proxyUser=your.username
systemProp.http.proxyPassword=your.password
systemProp.https.proxyHost=your.proxy.host
systemProp.https.proxyPort=8080
systemProp.https.proxyUser=your.username
systemProp.https.proxyPassword=your.password
systemProp.http.nonProxyHosts=localhost|127.0.0.1
```

### Solution 3: Use EAS Build (Cloud Build - Recommended)

This avoids local network issues entirely:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Build in the cloud:**
   ```bash
   eas build --platform android --profile production
   ```

   The build happens on Expo's servers, so no local network issues!

### Solution 4: Manual Dependency Download

1. Download Kotlin dependencies manually:
   - Visit: https://repo1.maven.org/maven2/org/jetbrains/kotlin/
   - Download required JAR files
   - Place in `~/.gradle/caches/` or `android/.gradle/caches/`

2. Or use a VPN to bypass network restrictions

### Solution 5: Use Different Network

Try building from:
- A different network (mobile hotspot, different WiFi)
- A location without corporate firewall
- Using a VPN

### Solution 6: Update Java/SSL Certificates

1. **Update Java:**
   - Ensure you have the latest JDK
   - Download from: https://adoptium.net/

2. **Update SSL certificates:**
   - Windows: Update via Windows Update
   - Or manually import certificates if using custom CA

### Solution 7: Use Gradle Wrapper with Retry

Create/update `android/gradle/wrapper/gradle-wrapper.properties` to use a different Gradle version, or add retry logic.

## Quick Test Commands

Test network connectivity:
```bash
# Test Maven Central
curl -I https://repo.maven.apache.org/maven2/

# Test Gradle Plugin Portal
curl -I https://plugins.gradle.org/m2/
```

## Recommended Approach

**For immediate APK build**: Use **EAS Build** (Solution 3) - it's the fastest and most reliable:
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

This builds your APK in the cloud and gives you a download link when done - no local network issues!

## After Fixing Network Issues

Once network is fixed, build with:
```bash
cd android
gradlew.bat assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

