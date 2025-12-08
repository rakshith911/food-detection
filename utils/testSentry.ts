/**
 * Test Sentry Integration
 * 
 * Call this function to test if Sentry is working correctly
 * This will send a test error to your Sentry dashboard
 */

import { captureException, captureMessage } from './sentry';

/**
 * Test Sentry error tracking
 * This will send a test error to Sentry dashboard
 */
export const testSentryError = () => {
  try {
    throw new Error('🧪 Test Sentry Integration - This is a test error');
  } catch (error) {
    captureException(error as Error, {
      test: true,
      purpose: 'Verify Sentry integration is working',
    });
    console.log('[Sentry Test] ✅ Test error sent to Sentry');
  }
};

/**
 * Test Sentry message tracking
 * This will send a test message to Sentry dashboard
 */
export const testSentryMessage = () => {
  captureMessage('🧪 Test Sentry Message - Integration is working!', 'info', {
    test: true,
    purpose: 'Verify Sentry message tracking',
  });
  console.log('[Sentry Test] ✅ Test message sent to Sentry');
};







