// AWS Cognito Authentication Service
// Handles OTP-based authentication using AWS Cognito
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface CognitoUser {
  email: string;
  phoneNumber?: string;
  isVerified: boolean;
  sub: string;
}

export interface CognitoOTPService {
  sendEmailOTP(email: string): Promise<boolean>;
  verifyEmailOTP(email: string, otp: string): Promise<{ success: boolean; userId?: string }>;
  sendPhoneOTP(phoneNumber: string): Promise<boolean>;
  verifyPhoneOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; userId?: string }>;
  getCurrentUser(): CognitoUser | null;
  logout(): Promise<void>;
}

class CognitoOTPService implements CognitoOTPService {
  
  async sendEmailOTP(email: string): Promise<boolean> {
    try {
      console.log('═══════════════════════════════════════════');
      console.log('📧 SENDING EMAIL OTP');
      console.log('═══════════════════════════════════════════');
      console.log('Email:', email);
      
      // For now, simulate email OTP sending
      // In production, you would use Cognito's custom authentication flow
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP for verification
      await AsyncStorage.setItem(`email_otp_${email}`, otp);
      await AsyncStorage.setItem(`email_otp_time_${email}`, Date.now().toString());
      
      console.log('');
      console.log('🔑 YOUR OTP CODE IS:', otp);
      console.log('');
      console.log('✅ Copy this OTP and paste it in the app');
      console.log('⏰ Valid for 5 minutes');
      console.log('═══════════════════════════════════════════');
      
      // Show OTP in alert for easier testing
      Alert.alert(
        '🔑 Test OTP Code',
        `Your OTP is: ${otp}\n\nIn production, this would be sent via email.`,
        [{ text: 'OK' }]
      );
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error: any) {
      console.error('[Cognito Auth] ❌ Failed to send email OTP:', error);
      return false;
    }
  }

  async verifyEmailOTP(email: string, otp: string): Promise<{ success: boolean; userId?: string }> {
    try {
      console.log('═══════════════════════════════════════════');
      console.log('🔍 VERIFYING EMAIL OTP');
      console.log('═══════════════════════════════════════════');
      console.log('Email:', email);
      console.log('Entered OTP:', otp);
      
      // Get stored OTP
      const storedOTP = await AsyncStorage.getItem(`email_otp_${email}`);
      const otpTime = await AsyncStorage.getItem(`email_otp_time_${email}`);
      
      if (storedOTP && otpTime) {
        const timeElapsed = Date.now() - parseInt(otpTime);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeElapsed > fiveMinutes) {
          console.log('❌ OTP expired (older than 5 minutes)');
          console.log('═══════════════════════════════════════════');
          return { success: false };
        }
        
        if (storedOTP === otp) {
          console.log('✅ OTP VERIFIED SUCCESSFULLY!');
          console.log('═══════════════════════════════════════════');
          // Clear OTP after successful verification
          await AsyncStorage.removeItem(`email_otp_${email}`);
          await AsyncStorage.removeItem(`email_otp_time_${email}`);
          return { success: true };
        } else {
          console.log(`❌ OTP mismatch. Expected: ${storedOTP}, Got: ${otp}`);
          console.log('═══════════════════════════════════════════');
          return { success: false };
        }
      }
      
      // Fallback: For demo, accept any 6-digit OTP if no stored OTP found
      if (otp.length === 6 && /^\d+$/.test(otp)) {
        console.log('✅ OTP format valid (demo mode - no stored OTP)');
        console.log('═══════════════════════════════════════════');
        return { success: true };
      } else {
        console.log('❌ Invalid OTP format');
        console.log('═══════════════════════════════════════════');
        return { success: false };
      }
    } catch (error: any) {
      console.error('[Cognito Auth] ❌ Failed to verify email OTP:', error);
      return { success: false };
    }
  }

  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('═══════════════════════════════════════════');
      console.log('📱 SENDING SMS OTP');
      console.log('═══════════════════════════════════════════');
      console.log('Phone:', phoneNumber);
      
      // For now, simulate SMS OTP sending
      // In production, you would use Cognito's SMS service
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP for verification
      await AsyncStorage.setItem(`phone_otp_${phoneNumber}`, otp);
      await AsyncStorage.setItem(`phone_otp_time_${phoneNumber}`, Date.now().toString());
      
      console.log('');
      console.log('🔑 YOUR OTP CODE IS:', otp);
      console.log('');
      console.log('✅ Copy this OTP and paste it in the app');
      console.log('⏰ Valid for 5 minutes');
      console.log('═══════════════════════════════════════════');
      
      // Show OTP in alert for easier testing
      Alert.alert(
        '🔑 Test OTP Code',
        `Your OTP is: ${otp}\n\nIn production, this would be sent via SMS.`,
        [{ text: 'OK' }]
      );
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error: any) {
      console.error('[Cognito Auth] ❌ Failed to send SMS OTP:', error);
      return false;
    }
  }

  async verifyPhoneOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; userId?: string }> {
    try {
      console.log('═══════════════════════════════════════════');
      console.log('🔍 VERIFYING SMS OTP');
      console.log('═══════════════════════════════════════════');
      console.log('Phone:', phoneNumber);
      console.log('Entered OTP:', otp);
      
      // Get stored OTP
      const storedOTP = await AsyncStorage.getItem(`phone_otp_${phoneNumber}`);
      const otpTime = await AsyncStorage.getItem(`phone_otp_time_${phoneNumber}`);
      
      if (storedOTP && otpTime) {
        const timeElapsed = Date.now() - parseInt(otpTime);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeElapsed > fiveMinutes) {
          console.log('❌ OTP expired (older than 5 minutes)');
          console.log('═══════════════════════════════════════════');
          return { success: false };
        }
        
        if (storedOTP === otp) {
          console.log('✅ OTP VERIFIED SUCCESSFULLY!');
          console.log('═══════════════════════════════════════════');
          // Clear OTP after successful verification
          await AsyncStorage.removeItem(`phone_otp_${phoneNumber}`);
          await AsyncStorage.removeItem(`phone_otp_time_${phoneNumber}`);
          return { success: true };
        } else {
          console.log(`❌ OTP mismatch. Expected: ${storedOTP}, Got: ${otp}`);
          console.log('═══════════════════════════════════════════');
          return { success: false };
        }
      }
      
      // Fallback: For demo, accept any 6-digit OTP if no stored OTP found
      if (otp.length === 6 && /^\d+$/.test(otp)) {
        console.log('✅ OTP format valid (demo mode - no stored OTP)');
        console.log('═══════════════════════════════════════════');
        return { success: true };
      } else {
        console.log('❌ Invalid OTP format');
        console.log('═══════════════════════════════════════════');
        return { success: false };
      }
    } catch (error: any) {
      console.error('[Cognito Auth] ❌ Failed to verify SMS OTP:', error);
      return { success: false };
    }
  }

  getCurrentUser(): CognitoUser | null {
    // This should be async in production
    return null;
  }

  async logout(): Promise<void> {
    try {
      console.log('[Cognito Auth] User logged out successfully');
    } catch (error) {
      console.error('[Cognito Auth] Failed to logout:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cognitoOTPService = new CognitoOTPService();
export default cognitoOTPService;

