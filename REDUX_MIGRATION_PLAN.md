# Redux Migration Plan - Next Steps

## ✅ Current Status

**Redux is WORKING!** ✅
- ✅ Redux store initialized
- ✅ Redux Persist rehydrating state
- ✅ Actions being dispatched
- ✅ Auth state tracked in Redux

**Both systems active:**
- Redux: Managing state in background
- Context: Still handling UI (for backward compatibility)

---

## 🎯 Migration Priority Order

### **Phase 1: Migrate Auth (High Priority)**
Auth is used everywhere - migrate this first.

**Files to update:**
1. ✅ `App.tsx` - Already using Redux for splash screen
2. ⏳ `screens/EmailLoginScreen.tsx` - Uses `useAuth()`
3. ⏳ `screens/OTPScreen.tsx` - Uses `useAuth()`
4. ⏳ `screens/LoginScreen.tsx` - Uses `useAuth()`
5. ⏳ `screens/ProfileScreen.tsx` - Uses `useAuth()`
6. ⏳ `screens/CameraScreen.tsx` - Uses `useHistory()` (also needs auth)
7. ⏳ `screens/PreviewScreen.tsx` - Uses `useHistory()` and `useAuth()`
8. ⏳ `components/ImageTextTab.tsx` - Uses `useAuth()`
9. ⏳ `components/VideoTextTab.tsx` - Uses `useAuth()`
10. ⏳ `screens/FeedbackScreen.tsx` - Uses `useAuth()`

### **Phase 2: Migrate History (Medium Priority)**
History is used in fewer places.

**Files to update:**
1. ⏳ `screens/ResultsScreen.tsx` - Uses `useHistory()` and `useAuth()`
2. ⏳ `screens/HistoryScreen.tsx` - Uses `useHistory()`
3. ⏳ `screens/MealDetailScreen.tsx` - Likely uses `useHistory()`
4. ⏳ `screens/CameraScreen.tsx` - Uses `useHistory()`
5. ⏳ `screens/PreviewScreen.tsx` - Uses `useHistory()`

### **Phase 3: Clean Up**
1. ⏳ Remove `AuthProvider` from `App.tsx`
2. ⏳ Remove `HistoryProvider` from `App.tsx`
3. ⏳ Delete or archive `contexts/AuthContext.tsx`
4. ⏳ Delete or archive `contexts/HistoryContext.tsx`

---

## 📝 Migration Pattern

### **Before (Context):**
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, sendOTP, isLoading } = useAuth();
  
  const handleLogin = async () => {
    await login(email, otp, 'email');
  };
}
```

### **After (Redux):**
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, logout, sendOTP } from '../store/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isLoading = useAppSelector(state => state.auth.isLoading);
  
  const handleLogin = async () => {
    await dispatch(login({ input: email, otp, method: 'email' }));
  };
}
```

---

## 🔄 Migration Steps for Each File

### **Step 1: Update Imports**
```typescript
// Remove
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from '../contexts/HistoryContext';

// Add
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, logout, sendOTP } from '../store/slices/authSlice';
import { loadHistory, addAnalysis, deleteAnalysis } from '../store/slices/historySlice';
```

### **Step 2: Replace Hooks**
```typescript
// OLD
const { user, isAuthenticated, login, logout } = useAuth();
const { history, addAnalysis, deleteAnalysis } = useHistory();

// NEW
const dispatch = useAppDispatch();
const user = useAppSelector(state => state.auth.user);
const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
const history = useAppSelector(state => state.history.history);
```

### **Step 3: Update Function Calls**
```typescript
// OLD
await login(email, otp, 'email');
await addAnalysis(analysisData);

// NEW
await dispatch(login({ input: email, otp, method: 'email' }));
await dispatch(addAnalysis({ userEmail: user?.email || '', analysis: analysisData }));
```

### **Step 4: Handle Loading States**
```typescript
// OLD
const { isLoading } = useAuth();

// NEW
const isLoading = useAppSelector(state => state.auth.isLoading);
// or
const historyLoading = useAppSelector(state => state.history.isLoading);
```

---

## 🚨 Important Notes

### **1. User Email Required for History Operations**
All history operations need `userEmail`:
```typescript
// ✅ Correct
dispatch(addAnalysis({ 
  userEmail: user?.email || '', 
  analysis: analysisData 
}));

// ❌ Wrong
dispatch(addAnalysis(analysisData));
```

### **2. Load History on Auth Change**
When user logs in, load their history:
```typescript
useEffect(() => {
  if (user?.email) {
    dispatch(loadHistory(user.email));
  }
}, [user?.email, dispatch]);
```

### **3. Clear History on Logout**
When user logs out, clear history:
```typescript
useEffect(() => {
  if (!isAuthenticated) {
    dispatch(clearHistoryLocal()); // Clear local state
  }
}, [isAuthenticated, dispatch]);
```

---

## 📋 Migration Checklist

### **Auth Migration:**
- [ ] `screens/EmailLoginScreen.tsx`
- [ ] `screens/OTPScreen.tsx`
- [ ] `screens/LoginScreen.tsx`
- [ ] `screens/ProfileScreen.tsx`
- [ ] `screens/CameraScreen.tsx` (auth part)
- [ ] `screens/PreviewScreen.tsx` (auth part)
- [ ] `components/ImageTextTab.tsx`
- [ ] `components/VideoTextTab.tsx`
- [ ] `screens/FeedbackScreen.tsx`
- [ ] `screens/TutorialScreen.tsx` (if uses auth)

### **History Migration:**
- [ ] `screens/ResultsScreen.tsx`
- [ ] `screens/HistoryScreen.tsx`
- [ ] `screens/MealDetailScreen.tsx`
- [ ] `screens/CameraScreen.tsx` (history part)
- [ ] `screens/PreviewScreen.tsx` (history part)

### **Clean Up:**
- [ ] Remove `AuthProvider` from `App.tsx`
- [ ] Remove `HistoryProvider` from `App.tsx`
- [ ] Update `App.tsx` to use Redux for auth state
- [ ] Test all screens work correctly
- [ ] Archive or delete Context files

---

## 🎯 Recommended Order

1. **Start with `EmailLoginScreen.tsx`** - Simple, isolated
2. **Then `OTPScreen.tsx`** - Similar pattern
3. **Then `ResultsScreen.tsx`** - Uses both auth and history
4. **Then `HistoryScreen.tsx`** - History-focused
5. **Then `CameraScreen.tsx`** - More complex
6. **Then `PreviewScreen.tsx`** - Uses both
7. **Finally `App.tsx`** - Remove Context providers

---

## ✅ Testing After Each Migration

After migrating each file:
1. ✅ Test the screen works
2. ✅ Test login/logout
3. ✅ Test history operations
4. ✅ Check console for errors
5. ✅ Verify Redux actions are dispatched

---

## 🚀 Ready to Start?

**Next file to migrate:** `screens/EmailLoginScreen.tsx`

This is the simplest one - good starting point!







