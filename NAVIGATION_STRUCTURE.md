# Navigation Structure - All Screens

## ✅ All Screens Are Accessible

### **Bottom Tab Navigator** (Main Navigation)
Located in: `components/BottomTabNavigator.tsx`

1. **Home Tab** → `TutorialScreen`
   - Shows tutorial/welcome screen
   - Tab bar is hidden on this screen
   - Can navigate to Camera and Profile from here

2. **Message Tab** → `HistoryScreen`
   - Shows analysis history
   - Tab bar visible

3. **Notification Tab** → `HistoryScreen` (duplicate)
   - Same as Message tab
   - Tab bar visible
   - ⚠️ Consider removing or changing this

4. **Profile Tab** → `ProfileScreen`
   - User profile and settings
   - Tab bar is hidden on this screen
   - Can logout from here

5. **Camera Tab** → `CameraScreen`
   - Hidden from tab bar (`tabBarButton: () => null`)
   - Accessible via navigation from other screens

---

### **Stack Navigator** (Modal/Detail Screens)
Located in: `App.tsx` - Stack Navigator

These screens are accessible via navigation (not tabs):

1. **MainTabs** → `BottomTabNavigator` (entry point)
2. **Camera** → `CameraScreen` (can navigate from TutorialScreen)
3. **History** → `HistoryScreen` (also in tabs)
4. **Results** → `ResultsScreen` (navigated to after analysis)
5. **MealDetail** → `MealDetailScreen` (navigated from ResultsScreen)
6. **Feedback** → `FeedbackScreen` (navigated from MealDetailScreen)
7. **ImageText** → `ImageTextTab` (component, accessible via navigation)
8. **VideoText** → `VideoTextTab` (component, accessible via navigation)

---

### **Onboarding Flow** (Before Authentication)
Located in: `App.tsx` - Onboarding Stack

1. **EmailLogin** → `EmailLoginScreen`
2. **OTPScreen** → `OTPScreen`
3. **Consent** → `ConsentScreen`
4. **BusinessProfileStep1** → `BusinessProfileStep1Screen`
5. **BusinessProfileStep2** → `BusinessProfileStep2Screen`
6. **MainTabs** → `BottomTabNavigator` (after onboarding)

---

## 🔍 How to Access Each Screen

### **Via Bottom Tabs:**
- **Home** → Tap "Home" tab → TutorialScreen
- **History** → Tap "Message" or "Notification" tab → HistoryScreen
- **Profile** → Tap "Profile" tab → ProfileScreen

### **Via Navigation:**
- **Camera** → From TutorialScreen, tap camera button → CameraScreen
- **Results** → After analyzing food in CameraScreen → ResultsScreen
- **MealDetail** → Tap a card in ResultsScreen → MealDetailScreen
- **Feedback** → From MealDetailScreen → FeedbackScreen

### **Via Onboarding:**
- **EmailLogin** → App startup (if not logged in)
- **OTPScreen** → After entering email
- **Consent** → After OTP verification
- **BusinessProfile** → After consent

---

## ⚠️ Current Issues

1. **DashboardScreen.tsx is empty** - Imported but never used (removed from imports)
2. **"Notification" tab is duplicate** - Both "Message" and "Notification" show HistoryScreen
3. **Tab bar hidden on some screens** - Makes navigation less obvious
4. **ResultsScreen not in tabs** - Only accessible via navigation after analysis

---

## ✅ All Screens Are Now Migrated to Redux

All screens have been migrated from Context to Redux:
- ✅ TutorialScreen
- ✅ LoginScreen  
- ✅ EmailLoginScreen
- ✅ OTPScreen
- ✅ ResultsScreen
- ✅ HistoryScreen
- ✅ PreviewScreen
- ✅ CameraScreen
- ✅ ProfileScreen
- ✅ FeedbackScreen
- ✅ MealDetailScreen
- ✅ ImageTextTab
- ✅ VideoTextTab

---

## 🎯 Testing Checklist

To test all screens:

1. **Onboarding Flow:**
   - [ ] EmailLoginScreen
   - [ ] OTPScreen
   - [ ] ConsentScreen
   - [ ] BusinessProfileStep1Screen
   - [ ] BusinessProfileStep2Screen

2. **Main App (Tabs):**
   - [ ] TutorialScreen (Home tab)
   - [ ] HistoryScreen (Message tab)
   - [ ] HistoryScreen (Notification tab - duplicate)
   - [ ] ProfileScreen (Profile tab)

3. **Navigation Screens:**
   - [ ] CameraScreen (from TutorialScreen)
   - [ ] ResultsScreen (after analysis)
   - [ ] MealDetailScreen (from ResultsScreen)
   - [ ] FeedbackScreen (from MealDetailScreen)

4. **Components:**
   - [ ] ImageTextTab (if accessible)
   - [ ] VideoTextTab (if accessible)

---

## 📝 Notes

- All screens are registered in navigation
- All screens are migrated to Redux
- Context providers are removed
- App should work fully with Redux now







