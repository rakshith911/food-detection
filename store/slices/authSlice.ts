import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cognitoOTPService as mockCognitoService, CognitoOTPService } from '../../services/CognitoAuthService';
import { realCognitoOTPService } from '../../services/RealCognitoAuthService';
import { userService } from '../../services/UserService';
import { clearProfile } from './profileSlice';
import { clearHistoryLocal } from './historySlice';

// 🔧 CONFIGURATION: Switch between mock and real AWS Cognito
const USE_REAL_AWS_COGNITO = true; // 🚀 Real AWS Cognito enabled

// Select the appropriate service based on configuration
const cognitoOTPService: CognitoOTPService = (USE_REAL_AWS_COGNITO ? realCognitoOTPService : mockCognitoService) as CognitoOTPService;

export interface User {
  email: string;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Async thunks for auth operations
export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser) as User;
      }
      return null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      throw error;
    }
  }
);

export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async ({ input, method }: { input: string; method: 'email' | 'phone' }) => {
    try {
      console.log(`[Auth] Sending ${method} OTP using ${USE_REAL_AWS_COGNITO ? 'AWS Cognito' : 'Mock'} service`);
      
      if (method === 'phone') {
        const result = await cognitoOTPService.sendPhoneOTP(input);
        if (!result) {
          throw new Error('Failed to send OTP');
        }
        return { success: true };
      } else {
        const result = await cognitoOTPService.sendEmailOTP(input);
        if (!result) {
          throw new Error('Failed to send OTP');
        }
        return { success: true };
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ input, otp, method }: { input: string; otp: string; method: 'email' | 'phone' }) => {
    try {
      console.log(`[Auth] Verifying ${method} OTP using ${USE_REAL_AWS_COGNITO ? 'AWS Cognito' : 'Mock'} service`);
      
      let verificationResult: { success: boolean; userId?: string };
      
      if (method === 'phone') {
        verificationResult = await cognitoOTPService.verifyPhoneOTP(input, otp);
      } else {
        verificationResult = await cognitoOTPService.verifyEmailOTP(input, otp);
      }

      if (verificationResult.success) {
        // Check if user account already exists for this email
        // We need to check by email since after logout getUserAccount() returns null
        let userAccount = await userService.getUserAccount();

        console.log('[Auth] Checking for existing account:', {
          hasAccount: !!userAccount,
          accountEmail: userAccount?.email,
          loginEmail: input,
        });

        // If no account exists OR the email doesn't match, create a new account
        // This handles both new users and users logging in with a different email
        if (!userAccount || userAccount.email !== input) {
          console.log('[Auth] OTP verified, creating user account...');
          
          // Clear any old profile completion flags and saved profile data for new users
          await AsyncStorage.removeItem('business_profile_completed');
          await AsyncStorage.removeItem('user_consent');
          await AsyncStorage.removeItem('consent_date');
          await AsyncStorage.removeItem('business_profile_step1'); // Clear any saved Step 1 data
          await AsyncStorage.removeItem('edit_profile_step1'); // Clear any saved edit profile data
          
          // Pass Cognito user ID if available (for DynamoDB mode)
          userAccount = await userService.createUserAccount(input, verificationResult.userId);
          
          // Explicitly set flags to false for new users
          await AsyncStorage.setItem('business_profile_completed', 'false');
          await AsyncStorage.setItem('user_consent', 'false');
          
          console.log('[Auth] User account created successfully');
        } else {
          console.log('[Auth] OTP verified, using existing user account');
          console.log('[Auth] Existing user ID:', userAccount.userId);

          // For existing users, if they have ANY history, consider profile completed
          // This handles the case where users created history but profile wasn't marked complete
          const historyAPI = require('../../services/HistoryAPI').default;
          let hasHistory = false;
          try {
            const historyResponse = await historyAPI.getHistory(input);
            hasHistory = historyResponse.success && historyResponse.data && historyResponse.data.length > 0;
            console.log('[Auth] Existing user history check:', { hasHistory, count: historyResponse.data?.length || 0 });
          } catch (error) {
            console.log('[Auth] Could not check history:', error);
          }

          // Restore profile completion status for existing users
          // Consider profile complete if: explicitly marked complete OR has history
          if (userAccount.hasCompletedProfile === true || hasHistory) {
            // Existing user with completed profile - set both consent and profile flags
            await AsyncStorage.setItem('business_profile_completed', 'true');
            await AsyncStorage.setItem('user_consent', 'true');
            console.log('[Auth] Restored profile completion and consent status for existing user (hasCompletedProfile:', userAccount.hasCompletedProfile, ', hasHistory:', hasHistory, ')');
          } else {
            // Existing user but profile not completed - check consent separately
            const storedConsent = await AsyncStorage.getItem('user_consent');
            await AsyncStorage.setItem('business_profile_completed', 'false');
            await AsyncStorage.setItem('user_consent', storedConsent || 'false');
            console.log('[Auth] Existing user with incomplete profile - restored consent status');
          }
        }
        
        const userData: User = {
          email: input,
          isVerified: true,
        };
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        console.log('[Auth] User logged in successfully');
        console.log('[Auth] User ID:', userAccount.userId);
        
        return userData;
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      // Logout from Cognito (works for both mock and real)
      await cognitoOTPService.logout();
      
      // Clear auth state but keep user account data
      // This allows users to login again with the same email and keep their data
      await AsyncStorage.removeItem('user');
      
      // Clear profile state (will be reloaded on next login)
      dispatch(clearProfile());
      
      // Clear history state (will be reloaded on next login)
      dispatch(clearHistoryLocal());
      
      // Note: We're NOT deleting the user account here
      // This allows users to login again and reuse their existing account
      // If you want to delete the account, use a separate "Delete Account" action
      
      console.log('[Auth] Logout completed successfully');
      console.log('[Auth] User account preserved for future login');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { dispatch }) => {
    try {
      // Anonymize user account (email is anonymized, data is preserved)
      await userService.deleteUserAccount();
      
      // Logout from Cognito
      await cognitoOTPService.logout();
      
      // Clear auth state
      await AsyncStorage.removeItem('user');
      
      // Clear profile state
      dispatch(clearProfile());
      
      console.log('[Auth] Account deleted (anonymized) successfully');
      return { success: true };
    } catch (error) {
      console.error('Error during account deletion:', error);
      throw error;
    }
  }
);

export const withdrawParticipation = createAsyncThunk(
  'auth/withdrawParticipation',
  async (_, { dispatch }) => {
    try {
      // Anonymize user account (email is anonymized, data is preserved)
      await userService.withdrawParticipation();
      
      // Logout from Cognito
      await cognitoOTPService.logout();
      
      // Clear auth state
      await AsyncStorage.removeItem('user');
      
      // Clear profile state
      dispatch(clearProfile());
      
      console.log('[Auth] Participation withdrawn (anonymized) successfully');
      return { success: true };
    } catch (error) {
      console.error('Error during withdrawal:', error);
      throw error;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load user from storage
    builder
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load user';
      });

    // Send OTP
    builder
      .addCase(sendOTP.pending, (state) => {
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to send OTP';
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Logout failed';
      });

    // Delete Account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Account deletion failed';
      });

    // Withdraw Participation
    builder
      .addCase(withdrawParticipation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawParticipation.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(withdrawParticipation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Withdrawal failed';
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

