/**
 * Sentry Configuration
 * 
 * To get your DSN:
 * 1. Go to https://sentry.io
 * 2. Create a project (or use existing)
 * 3. Copy the DSN from project settings
 * 4. Replace the DSN below or set it via environment variable
 */

// You can set this via environment variable: SENTRY_DSN
// Or replace with your actual DSN
export const SENTRY_DSN = process.env.SENTRY_DSN || '';

// Sentry configuration options
export const sentryConfig = {
  dsn: SENTRY_DSN,
  enableInExpoDevelopment: false, // Set to true to test in development
  debug: __DEV__, // Enable debug mode in development
  environment: __DEV__ ? 'development' : 'production',
  // Enable native crash reporting
  enableNative: true,
  // Enable JavaScript error tracking
  enableJavaScript: true,
  // Automatically track unhandled promise rejections
  enableAutoSessionTracking: true,
  // Session tracking interval (in milliseconds)
  sessionTrackingIntervalMillis: 30000,
  // Attach stack traces to messages
  attachStacktrace: true,
  // Maximum breadcrumbs
  maxBreadcrumbs: 100,
  // Sample rate for performance monitoring (0.0 to 1.0)
  tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in production
  // Enable native frames tracking
  enableNativeFramesTracking: true,
  // Enable auto instrumentation
  enableAutoInstrumentation: true,
};







