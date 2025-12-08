/**
 * Sentry Utility Functions
 * 
 * Helper functions for Sentry error tracking and monitoring
 */

import * as Sentry from '@sentry/react-native';
import type { User } from '../store/slices/authSlice';

/**
 * Initialize Sentry with configuration
 */
export const initSentry = (dsn: string) => {
  if (!dsn) {
    console.warn('[Sentry] DSN not provided, Sentry will not be initialized');
    return;
  }

  try {
    Sentry.init({
      dsn,
      enableInExpoDevelopment: false,
      debug: __DEV__,
      environment: __DEV__ ? 'development' : 'production',
      enableNative: true,
      enableJavaScript: true,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      attachStacktrace: true,
      maxBreadcrumbs: 100,
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      enableNativeFramesTracking: true,
      enableAutoInstrumentation: false, // Disabled to prevent console override
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from event
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['authorization'];
          }
          // Remove sensitive query params
          if (event.request.query_string) {
            // You can add more filtering here
          }
        }
        return event;
      },
    });

    console.log('[Sentry] ✅ Initialized successfully');
  } catch (error) {
    console.error('[Sentry] ❌ Failed to initialize:', error);
  }
};

/**
 * Set user context for error tracking
 */
export const setSentryUser = (user: User | null) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    email: user.email,
    id: user.email, // Using email as ID
    // Don't send sensitive data
  });
};

/**
 * Add breadcrumb for user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'user',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture message manually
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
};

/**
 * Set custom tags for filtering
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Set custom context
 */
export const setContext = (key: string, context: Record<string, any>) => {
  Sentry.setContext(key, context);
};

/**
 * Start a performance transaction
 */
export const startTransaction = (name: string, op: string = 'navigation') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Add Redux action as breadcrumb
 */
export const addReduxBreadcrumb = (action: { type: string; payload?: any }) => {
  addBreadcrumb(
    `Redux Action: ${action.type}`,
    'redux',
    'info',
    {
      actionType: action.type,
      hasPayload: !!action.payload,
      // Don't log full payload to avoid sensitive data
    }
  );
};







