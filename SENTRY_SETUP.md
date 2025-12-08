# Sentry Integration Setup Guide

## ✅ What's Been Integrated

1. **Sentry SDK** - Installed `@sentry/react-native`
2. **Error Tracking** - Automatic error capture
3. **Error Boundary** - React error boundary component
4. **User Context** - Tracks user email for error reports
5. **Redux Breadcrumbs** - Tracks Redux actions
6. **Performance Monitoring** - Enabled with 20% sample rate in production

## 📋 Setup Instructions

### Step 1: Get Your Sentry DSN

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up or log in
3. Create a new project (or use existing)
   - Select **React Native** as the platform
4. Copy your **DSN** from project settings
   - It looks like: `https://abc123@o123456.ingest.sentry.io/123456`

### Step 2: Configure DSN

**Option A: Environment Variable (Recommended)**

1. Create a `.env` file in `food-detection/` directory:
   ```bash
   SENTRY_DSN=https://your_dsn_here@o123456.ingest.sentry.io/123456
   ```

2. Install `react-native-dotenv` if not already installed:
   ```bash
   npm install react-native-dotenv --legacy-peer-deps
   ```

3. Update `babel.config.js` to include dotenv plugin

**Option B: Direct Configuration**

1. Open `food-detection/utils/sentry.ts`
2. Update the `initSentry` function call in `App.tsx`:
   ```typescript
   const SENTRY_DSN = 'https://your_dsn_here@o123456.ingest.sentry.io/123456';
   ```

### Step 3: Test Integration

1. Add a test error to verify Sentry is working:
   ```typescript
   import { captureException } from './utils/sentry';
   
   // Test error
   try {
     throw new Error('Test Sentry integration');
   } catch (error) {
     captureException(error as Error);
   }
   ```

2. Check your Sentry dashboard - you should see the error appear

## 🎯 What Gets Tracked

### Automatic Tracking:
- ✅ JavaScript errors and exceptions
- ✅ Unhandled promise rejections
- ✅ React component errors (via ErrorBoundary)
- ✅ Native crashes (iOS/Android)
- ✅ Redux action breadcrumbs
- ✅ User context (email)
- ✅ Device information
- ✅ App version and build number

### Manual Tracking:
You can manually track events:

```typescript
import { captureException, captureMessage, addBreadcrumb } from './utils/sentry';

// Capture an exception
try {
  // Some code
} catch (error) {
  captureException(error, { context: 'Camera capture' });
}

// Capture a message
captureMessage('User completed onboarding', 'info');

// Add breadcrumb
addBreadcrumb('User clicked button', 'user', 'info', { button: 'submit' });
```

## 📊 Sentry Dashboard Features

Once configured, you'll see:

1. **Issues** - All errors grouped by type
2. **Performance** - Slow operations and bottlenecks
3. **Releases** - Track errors by app version
4. **Users** - See which users are affected
5. **Breadcrumbs** - User actions before error
6. **Stack Traces** - Full error details with line numbers

## 🔒 Privacy & Security

- ✅ Sensitive data (passwords, tokens) are filtered out
- ✅ User emails are tracked (can be disabled)
- ✅ No sensitive Redux state is logged
- ✅ Network requests are sanitized

## 🚀 Production vs Development

- **Development**: Full error tracking, 100% performance sampling
- **Production**: Error tracking enabled, 20% performance sampling

## 📝 Next Steps

1. Set up your Sentry DSN
2. Test error tracking
3. Set up alerts in Sentry dashboard
4. Configure release tracking
5. Set up custom tags for filtering

## 🆘 Troubleshooting

**Sentry not capturing errors?**
- Check that DSN is correctly set
- Verify Sentry is initialized before other code runs
- Check console for Sentry initialization logs

**Too many errors in development?**
- Set `enableInExpoDevelopment: false` in `sentry.config.ts`
- Errors will only be tracked in production builds

**Need help?**
- Check [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- Review Sentry dashboard for error details







