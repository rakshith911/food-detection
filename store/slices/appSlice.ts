import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { s3UserDataService, SettingsBackup } from '../../services/S3UserDataService';

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
  showSplash: true, // In-app splash with 280 logo (smaller); native splash kept minimal
  showWelcome: false,
};

/**
 * Backup current app + camera settings to S3 (fire-and-forget)
 */
export const backupSettings = createAsyncThunk(
  'app/backupSettings',
  async (_, { getState }) => {
    try {
      const state = getState() as {
        app: AppState;
        camera: { facing: string; flashEnabled: boolean; activeTab: 'photo' | 'video'; lastMediaMode: 'photo' | 'video'; streakDays: number };
        profile: { userAccount: { userId: string } | null };
      };

      const userId = state.profile?.userAccount?.userId;
      if (!userId) return;

      const backup: SettingsBackup = {
        hasConsented: state.app.hasConsented,
        hasCompletedProfile: state.app.hasCompletedProfile,
        cameraPrefs: {
          facing: state.camera.facing,
          flashEnabled: state.camera.flashEnabled,
          activeTab: state.camera.activeTab,
          lastMediaMode: state.camera.lastMediaMode,
        },
        streakDays: state.camera.streakDays,
        updatedAt: new Date().toISOString(),
      };

      s3UserDataService.backupInBackground(userId, 'settings', backup);
    } catch (error) {
      console.warn('[App] Settings S3 backup failed silently:', error);
    }
  }
);

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
