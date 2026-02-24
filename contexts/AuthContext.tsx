import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cognitoOTPService as mockCognitoService, CognitoUser, CognitoOTPService } from '../services/CognitoAuthService';
import { realCognitoOTPService } from '../services/RealCognitoAuthService';
import { userService } from '../services/UserService';

// 🔧 CONFIGURATION: Switch between mock and real AWS Cognito
// Set to FALSE for mock (testing) or TRUE for real AWS Cognito (production)
const USE_REAL_AWS_COGNITO = true; // ✅ Real AWS Cognito — sends OTP via email

// Select the appropriate service based on configuration
const cognitoOTPService: CognitoOTPService = (USE_REAL_AWS_COGNITO ? realCognitoOTPService : mockCognitoService) as CognitoOTPService;

// Define User interface locally
interface User {
  email: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: string, otp: string, method: 'email' | 'phone') => Promise<boolean>;
  logout: () => Promise<void>;
  sendOTP: (input: string, method: 'email' | 'phone') => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock OTP storage - in production, this would be handled by a backend service
const mockOTPStorage: { [key: string]: string } = {};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);


  const loadUserFromStorage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const sendOTP = async (input: string, method: 'email' | 'phone'): Promise<boolean> => {
    try {
      console.log(`[Auth] Sending ${method} OTP using ${USE_REAL_AWS_COGNITO ? 'AWS Cognito' : 'Mock'} service`);
      
      if (method === 'phone') {
        return await cognitoOTPService.sendPhoneOTP(input);
      } else {
        return await cognitoOTPService.sendEmailOTP(input);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

  const login = async (input: string, otp: string, method: 'email' | 'phone'): Promise<boolean> => {
    try {
      console.log(`[Auth] Verifying ${method} OTP using ${USE_REAL_AWS_COGNITO ? 'AWS Cognito' : 'Mock'} service`);
      
      let verificationResult: { success: boolean; userId?: string };
      
      if (method === 'phone') {
        verificationResult = await cognitoOTPService.verifyPhoneOTP(input, otp);
      } else {
        verificationResult = await cognitoOTPService.verifyEmailOTP(input, otp);
      }

      if (verificationResult.success) {
        // Create user account (similar to mybeats-mobile's createUserWithEmailAndPassword)
        console.log('[Auth] OTP verified, creating user account...');
        
        // Pass Cognito user ID if available (for DynamoDB mode)
        const userAccount = await userService.createUserAccount(input, verificationResult.userId);
        
        const userData: User = {
          email: input, // Using input as identifier (email or phone)
          isVerified: true,
        };
        
        setUser(userData);
        await saveUserToStorage(userData);
        
        console.log('[Auth] User account created and logged in successfully');
        console.log('[Auth] User ID:', userAccount.userId);
        return true;
      } else {
        console.log('[Auth] Invalid OTP');
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logging out user:', user?.email);
      
      // Logout from Cognito (works for both mock and real)
      await cognitoOTPService.logout();
      
      // Delete user account and all associated data
      await userService.deleteUserAccount();
      
      setUser(null);
      console.log('[Auth] Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    sendOTP,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
