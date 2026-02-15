import { configureStore, Middleware, AnyAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig, createTransform } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rootReducer from './rootReducer';
import type { RootState } from './rootReducer';

// Custom transform to always reset showSplash and showWelcome on rehydration
const appTransform = createTransform(
  // transform state on its way to being serialized and persisted
  (inboundState: any) => {
    // Don't change anything when saving
    return inboundState;
  },
  // transform state being rehydrated
  (outboundState: any) => {
    // Show in-app splash (280 logo) on each app open
    if (outboundState && typeof outboundState === 'object') {
      return {
        ...outboundState,
        showSplash: true,
        showWelcome: false,
      };
    }
    return outboundState;
  },
  // define which reducers this transform gets called for
  { whitelist: ['app'] }
);

// Persist configuration
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'camera', 'app', 'profile'], // Only persist these slices
  transforms: [appTransform], // Apply transform to reset showSplash
  // Don't persist history - it's loaded from server
  // Don't persist UI state - it's temporary
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serialization checks entirely to prevent errors
    }).concat(((store) => (next) => (action: AnyAction) => {
      // Safety check - ensure action exists and has type
      if (!action || !action.type) {
        return next(action);
      }
      
      // Log Redux actions in development
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('[Redux] Action:', action.type, (action as any).payload ? 'with payload' : '');
        } catch (logError) {
          // Ignore logging errors
        }
      }
      
      // Add Sentry breadcrumb for Redux actions
      try {
        const { addReduxBreadcrumb, captureException } = require('../utils/sentry');
        addReduxBreadcrumb(action);
        
        // Capture rejected thunk errors and send to Sentry
        if (action.type && action.type.endsWith('/rejected')) {
          const error = action.error || new Error(
            (action.payload && typeof action.payload === 'string') ? action.payload : 'Unknown error'
          );
          captureException(error, {
            redux: {
              actionType: action.type,
              actionPayload: action.payload,
            },
            context: 'Redux Thunk Rejection',
          });
        }
      } catch (error) {
        // Sentry not initialized yet, ignore
      }
      
      return next(action);
    }) as Middleware),
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

export const persistor = persistStore(store);

// Log when Redux Persist rehydrates
if (process.env.NODE_ENV !== 'production') {
  persistor.subscribe(() => {
    const state = store.getState();
    console.log('[Redux Persist] ✅ State rehydrated:', {
      auth: state.auth.isAuthenticated ? 'authenticated' : 'not authenticated',
      user: state.auth.user?.email || 'no user',
      splash: state.app.showSplash,
    });
  });
}

// Export types for TypeScript
export type AppDispatch = typeof store.dispatch;
export type { RootState };

