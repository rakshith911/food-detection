# Sentry Error Tracking Configuration

## ✅ What's Automatically Tracked

### 1. **JavaScript Errors** ✅
- All unhandled JavaScript exceptions
- Unhandled promise rejections
- Syntax errors
- Runtime errors

### 2. **React Component Errors** ✅
- Errors caught by `ErrorBoundary` component
- Component render errors
- Lifecycle method errors

### 3. **Redux Thunk Errors** ✅
- All rejected Redux thunk actions
- Example: `history/addAnalysis/rejected`, `auth/login/rejected`
- Includes action type and payload context

### 4. **API Errors** ✅
- HistoryAPI request failures
- Network errors
- HTTP errors (4xx, 5xx)
- Includes endpoint and method context

### 5. **Camera Errors** ✅
- Photo capture errors
- Video recording errors
- Gallery picker errors
- Recording start/stop errors

### 6. **Navigation Errors** ✅
- Screen navigation failures
- Route parameter errors
- Navigation state errors

### 7. **Profile Errors** ✅
- User data loading errors
- Logout errors
- Profile save errors

## 📊 Error Context Included

Each error sent to Sentry includes:

1. **User Context**
   - User email
   - User ID (if available)

2. **Device Info**
   - Device model
   - OS version
   - App version

3. **Breadcrumbs**
   - Redux actions before error
   - User actions (navigation, button clicks)
   - API requests

4. **Custom Context**
   - Error location (Camera, API, Navigation, etc.)
   - Action type (for Redux errors)
   - Endpoint (for API errors)

## 🔍 Where Errors Are Tracked

### Redux Store (`store/index.ts`)
- ✅ Catches all rejected thunk actions
- ✅ Sends to Sentry with action context

### API Service (`services/HistoryAPI.ts`)
- ✅ Catches all API request failures
- ✅ Sends to Sentry with endpoint context

### Camera Screen (`screens/CameraScreen.tsx`)
- ✅ Photo capture errors
- ✅ Video recording errors
- ✅ Gallery picker errors

### Results Screen (`screens/ResultsScreen.tsx`)
- ✅ Navigation errors

### Profile Screen (`screens/ProfileScreen.tsx`)
- ✅ User data loading errors
- ✅ Logout errors

### Business Profile Screen (`screens/BusinessProfileStep2Screen.tsx`)
- ✅ Profile save errors

### Error Boundary (`components/ErrorBoundary.tsx`)
- ✅ React component errors
- ✅ Render errors

## 🧪 Testing Error Tracking

1. **Test Button**: Go to ProfileScreen → "🧪 Test Sentry"
2. **Trigger Real Errors**:
   - Camera errors (permission denied, etc.)
   - API errors (network failure)
   - Navigation errors (invalid route)
   - Redux errors (thunk rejection)

## 📈 What You'll See in Sentry

For each error, you'll see:
- **Error Message**: The actual error
- **Stack Trace**: Full stack trace with line numbers
- **User**: Email of user who encountered error
- **Device**: Device info, OS, app version
- **Breadcrumbs**: Actions before error
- **Context**: Custom context (Camera, API, Navigation, etc.)
- **Tags**: Error type, screen, feature

## 🎯 Error Categories

Errors are tagged with context:
- `Camera - Take Photo`
- `Camera - Video Recording`
- `API - HistoryAPI Request`
- `Redux Thunk Rejection`
- `Navigation - Results to Profile`
- `Profile - Logout`
- `BusinessProfile - Save Profile`

## ✅ Summary

**All major error sources are now tracked:**
- ✅ JavaScript errors (automatic)
- ✅ React errors (ErrorBoundary)
- ✅ Redux errors (middleware)
- ✅ API errors (HistoryAPI)
- ✅ Camera errors (CameraScreen)
- ✅ Navigation errors (ResultsScreen)
- ✅ Profile errors (ProfileScreen)
- ✅ Business profile errors (BusinessProfileStep2Screen)

**Your app is fully instrumented for error tracking!** 🎉







