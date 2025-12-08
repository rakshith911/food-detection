/**
 * Utility script to view user data stored in AsyncStorage
 * 
 * HOW TO ACCESS USER DATA FROM TERMINAL:
 * ======================================
 * 
 * Method 1: View Terminal Console (EASIEST)
 * ─────────────────────────────────────────
 * 1. Run the app: npx expo start --port 8081
 * 2. Open ProfileScreen in the app
 * 3. Click "🔍 View Debug Info (Terminal)" button
 * 4. Check your terminal - all user data will be logged there!
 * 
 * Method 2: Use Expo Console Commands
 * ────────────────────────────────────
 * While the app is running, in your terminal where Expo is running,
 * you'll see logs like:
 * 
 *   📱 USER DATA (Accessible in Terminal)
 *   📊 User Account: {...}
 *   📋 Business Profile: {...}
 *   📈 User Stats: {...}
 * 
 * Method 3: React Native Debugger Console
 * ──────────────────────────────────────
 * 1. Open React Native Debugger (or Chrome DevTools)
 * 2. In the Console tab, type:
 * 
 *    AsyncStorage.getAllKeys().then(console.log)
 *    AsyncStorage.getItem("user_account").then(d => console.log(JSON.parse(d)))
 *    AsyncStorage.getItem("user_profile").then(d => console.log(JSON.parse(d)))
 * 
 * Method 4: Direct Terminal Access (iOS Simulator)
 * ────────────────────────────────────────────────
 * For iOS Simulator only:
 * 
 *    # List all AsyncStorage keys
 *    xcrun simctl get_app_container booted com.your.app bundle | xargs -I {} find {} -name "*.sqlite" -o -name "*.db"
 * 
 * Method 5: Android ADB (Android Emulator)
 * ─────────────────────────────────────────
 * For Android Emulator only:
 * 
 *    adb shell run-as com.your.app
 *    cd /data/data/com.your.app/files
 *    cat AsyncStorage
 * 
 * ═══════════════════════════════════════════
 * STORAGE KEYS USED:
 * ═══════════════════════════════════════════
 * 
 *   - user_account: Full user account data
 *     (userId, email, createdAt, hasCompletedProfile, profileData)
 * 
 *   - user_profile: Business profile data
 *     (businessName, address, category, cuisineType, etc.)
 * 
 *   - user: Basic auth info
 *     (email, isVerified)
 * 
 *   - user_consent: Consent status
 *     ("true" or "false")
 * 
 *   - business_profile_completed: Profile completion flag
 *     ("true" or "false")
 * 
 * ═══════════════════════════════════════════
 * QUICK ACCESS:
 * ═══════════════════════════════════════════
 * 
 * The easiest way is to:
 * 1. Open ProfileScreen in the app
 * 2. Click "🔍 View Debug Info (Terminal)"
 * 3. Check your terminal console output
 * 
 * All user data will be automatically logged to the terminal!
 */

console.log('═══════════════════════════════════════════');
console.log('📱 User Data Access Guide');
console.log('═══════════════════════════════════════════\n');
console.log('✅ EASIEST METHOD:');
console.log('   1. Open ProfileScreen in the app');
console.log('   2. Click "🔍 View Debug Info (Terminal)"');
console.log('   3. Check this terminal for all user data!\n');
console.log('📋 See this file for all access methods.');
console.log('═══════════════════════════════════════════\n');

