import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  hasConsented: boolean | null;
  hasCompletedProfile: boolean | null;
  isCheckingConsent: boolean;
  showSplash: boolean;
  showWelcome: boolean;
}

const initialState: AppState = {
  hasConsented: null,
  hasCompletedProfile: null,
  isCheckingConsent: true,
  showSplash: true, // Always start with splash screen
  showWelcome: false, // Show welcome screen after splash
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setHasConsented: (state, action: PayloadAction<boolean | null>) => {
      state.hasConsented = action.payload;
    },
    setHasCompletedProfile: (state, action: PayloadAction<boolean | null>) => {
      state.hasCompletedProfile = action.payload;
    },
    setIsCheckingConsent: (state, action: PayloadAction<boolean>) => {
      state.isCheckingConsent = action.payload;
    },
    setShowSplash: (state, action: PayloadAction<boolean>) => {
      state.showSplash = action.payload;
      // When splash finishes, show welcome screen
      if (!action.payload) {
        state.showWelcome = true;
      }
    },
    setShowWelcome: (state, action: PayloadAction<boolean>) => {
      state.showWelcome = action.payload;
    },
    resetAppState: (state) => {
      state.hasConsented = null;
      state.hasCompletedProfile = null;
      state.isCheckingConsent = false;
    },
  },
});

export const {
  setHasConsented,
  setHasCompletedProfile,
  setIsCheckingConsent,
  setShowSplash,
  setShowWelcome,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;


