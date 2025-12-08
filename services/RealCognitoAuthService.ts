// Real AWS Cognito Authentication Service
// Handles OTP-based authentication using AWS Cognito with real email/SMS
import { Amplify } from 'aws-amplify';
import { signIn, signUp, confirmSignUp, resendSignUpCode, signOut, getCurrentUser as getCognitoUser, fetchAuthSession, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { awsConfig } from '../aws-config';

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
  getCurrentUser(): Promise<CognitoUser | null>;
  logout(): Promise<void>;
}

class RealCognitoAuthService implements CognitoOTPService {
  private isInitialized = false;

  constructor() {
    // Don't initialize here - let App.tsx handle it
    // This ensures Amplify is configured before any service methods are called
  }

  private ensureAmplifyConfigured() {
    if (!this.isInitialized) {
      try {
        // AWS Amplify v6 configuration format for React Native
        const amplifyConfig = {
          Auth: {
            Cognito: {
              userPoolId: awsConfig.Auth.userPoolId,
              userPoolClientId: awsConfig.Auth.userPoolWebClientId,
            }
          }
        };
        
        // Only configure if not already configured
        try {
          Amplify.configure(amplifyConfig);
          this.isInitialized = true;
          console.log('[AWS Cognito] ✅ Amplify configured in service');
        } catch (configError: any) {
          // If already configured, that's fine
          if (configError.message?.includes('already configured') || configError.message?.includes('configured')) {
            this.isInitialized = true;
            console.log('[AWS Cognito] ✅ Amplify already configured');
          } else {
            throw configError;
          }
        }
      } catch (error: any) {
        console.error('[AWS Cognito] ❌ Failed to ensure Amplify is configured:', error);
        console.error('[AWS Cognito] Error message:', error?.message);
        throw error; // Re-throw to prevent silent failures
      }
    }
  }

  /**
   * Send OTP to email using AWS Cognito
   * Uses Cognito's signUp flow which automatically sends a verification code
   */
  async sendEmailOTP(email: string): Promise<boolean> {
    try {
      // Ensure Amplify is configured before use
      this.ensureAmplifyConfigured();
      
      console.log('═══════════════════════════════════════════');
      console.log('📧 SENDING EMAIL OTP (AWS COGNITO)');
      console.log('═══════════════════════════════════════════');
      console.log('Email:', email);

      // Generate a temporary password that meets Cognito password policy requirements:
      // - Minimum 8 characters
      // - At least one uppercase letter
      // - At least one lowercase letter
      // - At least one number
      // - At least one special character (if required)
      const generateSecurePassword = (): string => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*';
        
        // Ensure at least one of each required character type
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        // Fill the rest randomly (minimum 8 chars total, so add 4 more)
        const allChars = uppercase + lowercase + numbers + special;
        for (let i = 0; i < 4; i++) {
          password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
      };
      
      const tempPassword = generateSecurePassword();

      try {
        // Try to sign up the user (this will send OTP to email)
        const signUpResult = await signUp({
          username: email,
          password: tempPassword,
          options: {
            userAttributes: {
              email: email,
            },
            autoSignIn: {
              enabled: false,
            },
          },
        });

        console.log('✅ OTP sent successfully to email');
        console.log('Sign up result:', JSON.stringify(signUpResult, null, 2));
        
        if (signUpResult.userId) {
          console.log('User ID:', signUpResult.userId);
        }
        if (signUpResult.nextStep) {
          console.log('Next step:', signUpResult.nextStep.signUpStep);
        }
        console.log('═══════════════════════════════════════════');

        // Store temp password for later use
        await AsyncStorage.setItem(`temp_password_${email}`, tempPassword);

        return true;
      } catch (signUpError: any) {
        console.log('Sign up error details:', {
          name: signUpError.name,
          message: signUpError.message,
          code: signUpError.code,
          statusCode: signUpError.$metadata?.httpStatusCode,
        });
        
        // If user already exists, use password reset flow (most reliable for existing users)
        if (signUpError.name === 'UsernameExistsException' || 
            signUpError.code === 'UsernameExistsException') {
          console.log('ℹ️  User already exists, using password reset flow for OTP...');
          
          try {
            // Always use password reset flow for existing users
            // This works for both confirmed and unconfirmed users
            const resetResult = await resetPassword({
              username: email,
            });
            
            console.log('✅ OTP sent via password reset flow');
            console.log('Reset result:', JSON.stringify(resetResult, null, 2));
            console.log('═══════════════════════════════════════════');
            
            // Store flag indicating this user should use reset flow for verification
            await AsyncStorage.setItem(`user_reset_flow_${email}`, 'true');
            return true;
          } catch (resetError: any) {
            console.log('Reset error:', {
              name: resetError.name,
              message: resetError.message,
            });
            
            // If reset fails, try resending confirmation code (for unconfirmed users)
            if (resetError.name === 'InvalidParameterException' ||
                resetError.message?.includes('not confirmed')) {
              console.log('ℹ️  User not confirmed yet, trying to resend confirmation code...');
              
              try {
                await resendSignUpCode({
                  username: email,
                });
                
                console.log('✅ OTP resent successfully to email (confirmation flow)');
                console.log('═══════════════════════════════════════════');
                // Remove reset flow flag since we're using confirmation flow
                await AsyncStorage.removeItem(`user_reset_flow_${email}`);
                return true;
              } catch (resendError: any) {
                console.error('❌ Failed to resend confirmation code:', resendError);
                throw resendError;
              }
            }
            throw resetError;
          }
        } else if (signUpError.name === 'NotAuthorizedException' && signUpError.message?.includes('SignUp is not permitted')) {
          // If sign-up is not permitted, provide clear instructions
          console.error('❌ Self-registration is disabled in Cognito User Pool');
          throw new Error(
            'Self-registration is disabled. Please enable "Allow users to sign themselves up" in your AWS Cognito User Pool settings. See FIX_SIGNUP_ERROR.md for instructions.'
          );
        } else {
          throw signUpError;
        }
      }
    } catch (error: any) {
      console.error('[AWS Cognito] ❌ Failed to send email OTP:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('═══════════════════════════════════════════');
      
      let userMessage = error.message || 'Failed to send verification code. Please try again.';
      
      // Provide helpful message for common errors
      if (error.name === 'LimitExceededException') {
        userMessage = 'Too many attempts. Please wait a few minutes and try again.';
      } else if (error.name === 'NotAuthorizedException' && error.message?.includes('SignUp is not permitted')) {
        userMessage = 'Self-registration is disabled in your AWS Cognito User Pool. Please enable "Allow users to sign themselves up" in the Cognito User Pool settings.';
      } else if (error.name === 'InvalidParameterException' || error.code === 'InvalidParameterException') {
        userMessage = 'Invalid email format or parameters. Please check your email address.';
      } else if (error.$metadata?.httpStatusCode === 400) {
        // If OTP was sent but we got a 400, it might be a non-critical error
        // Check if we can still proceed
        console.log('⚠️  Received 400 error, but OTP may have been sent. Check your email.');
        userMessage = 'Please check your email for the verification code. If you don\'t receive it, please try again.';
      }
      
      Alert.alert(
        'Error Sending OTP',
        userMessage,
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Verify email OTP using AWS Cognito
   */
  async verifyEmailOTP(email: string, otp: string): Promise<{ success: boolean; userId?: string }> {
    try {
      // Ensure Amplify is configured before use
      this.ensureAmplifyConfigured();
      
      console.log('═══════════════════════════════════════════');
      console.log('🔍 VERIFYING EMAIL OTP (AWS COGNITO)');
      console.log('═══════════════════════════════════════════');
      console.log('Email:', email);
      console.log('Entered OTP:', otp);

      // Check if user is using the password reset flow (confirmed user)
      const isResetFlow = await AsyncStorage.getItem(`user_reset_flow_${email}`);
      if (isResetFlow === 'true') {
        console.log('ℹ️  User is using password reset flow for OTP verification');
        
        try {
          // Generate a new password for the user
          const generateSecurePassword = (): string => {
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const special = '!@#$%^&*';
            let password = '';
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += special[Math.floor(Math.random() * special.length)];
            const allChars = uppercase + lowercase + numbers + special;
            for (let i = 0; i < 4; i++) {
              password += allChars[Math.floor(Math.random() * allChars.length)];
            }
            return password.split('').sort(() => Math.random() - 0.5).join('');
          };
          
          const newPassword = generateSecurePassword();
          
          // Confirm the password reset with the OTP code
          await confirmResetPassword({
            username: email,
            confirmationCode: otp,
            newPassword: newPassword,
          });
          
          console.log('✅ OTP verified successfully (reset flow)');
          
          // Now sign in with the new password
          await signIn({
            username: email,
            password: newPassword,
          });
          
          // Get user info
          const cognitoUser = await getCognitoUser();
          const userId = cognitoUser.userId;
          
          console.log('✅ User signed in successfully');
          console.log('User ID:', userId);
          console.log('═══════════════════════════════════════════');
          
          // Clean up
          await AsyncStorage.removeItem(`user_reset_flow_${email}`);
          return { success: true, userId };
        } catch (resetError: any) {
          console.error('❌ Reset flow verification failed:', resetError);
          console.log('Error name:', resetError.name);
          console.log('Error message:', resetError.message);
          
          // Clean up flag on error
          await AsyncStorage.removeItem(`user_reset_flow_${email}`);
          
          // Show appropriate error message
          let errorMessage = 'Invalid verification code. Please try again.';
          if (resetError.name === 'CodeMismatchException') {
            errorMessage = 'Invalid verification code. Please check and try again.';
          } else if (resetError.name === 'ExpiredCodeException') {
            errorMessage = 'Verification code expired. Please request a new one.';
          } else if (resetError.name === 'LimitExceededException') {
            errorMessage = 'Too many attempts. Please wait a few minutes and try again.';
          }
          
          Alert.alert('Verification Failed', errorMessage, [{ text: 'OK' }]);
          return { success: false };
        }
      }

      // Standard flow: Confirm sign up with the OTP code (for new users)
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: otp,
      });

      if (isSignUpComplete) {
        console.log('✅ OTP VERIFIED SUCCESSFULLY!');
        console.log('Account confirmed and ready to use');
        
        // Now sign in the user
        const tempPassword = await AsyncStorage.getItem(`temp_password_${email}`);
        let userId: string | undefined;
        
        if (tempPassword) {
          try {
            const signInResult = await signIn({
              username: email,
              password: tempPassword,
            });
            
            // Get the user ID from Cognito
            const cognitoUser = await getCognitoUser();
            userId = cognitoUser.userId;
            
            console.log('✅ User signed in successfully');
            console.log('User ID:', userId);
            console.log('═══════════════════════════════════════════');
            
            // Clean up temp password
            await AsyncStorage.removeItem(`temp_password_${email}`);
            return { success: true, userId };
          } catch (signInError) {
            console.error('❌ Failed to sign in after verification:', signInError);
            // Still return success as verification was successful
            return { success: true };
          }
        }
        
        console.log('═══════════════════════════════════════════');
        return { success: true, userId };
      } else {
        console.log('❌ OTP verification incomplete');
        console.log('═══════════════════════════════════════════');
        return { success: false };
      }
    } catch (error: any) {
      console.error('[AWS Cognito] ❌ Failed to verify email OTP:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('═══════════════════════════════════════════');
      
      // Handle "already confirmed" users - automatically use the reset flow
      if (error.name === 'NotAuthorizedException' && 
          error.message?.includes('Current status is CONFIRMED')) {
        console.log('═══════════════════════════════════════════');
        console.log('ℹ️  User is already confirmed - switching to reset flow');
        console.log('═══════════════════════════════════════════');
        
        try {
          // Generate a new password for the user
          const generateSecurePassword = (): string => {
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const special = '!@#$%^&*';
            let password = '';
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += special[Math.floor(Math.random() * special.length)];
            const allChars = uppercase + lowercase + numbers + special;
            for (let i = 0; i < 4; i++) {
              password += allChars[Math.floor(Math.random() * allChars.length)];
            }
            return password.split('').sort(() => Math.random() - 0.5).join('');
          };
          
          const newPassword = generateSecurePassword();
          
          // Try to confirm the password reset with the OTP code
          await confirmResetPassword({
            username: email,
            confirmationCode: otp,
            newPassword: newPassword,
          });
          
          console.log('✅ OTP verified successfully (auto-switched to reset flow)');
          
          // Now sign in with the new password
          await signIn({
            username: email,
            password: newPassword,
          });
          
          // Get user info
          const cognitoUser = await getCognitoUser();
          const userId = cognitoUser.userId;
          
          console.log('✅ User signed in successfully');
          console.log('User ID:', userId);
          console.log('═══════════════════════════════════════════');
          
          return { success: true, userId };
        } catch (resetError: any) {
          console.error('❌ Reset flow also failed:', resetError);
          
          // If reset flow fails, the user needs to request a new OTP via reset flow
          if (resetError.name === 'CodeMismatchException' || 
              resetError.name === 'ExpiredCodeException') {
            // Need to send a new reset password code
            console.log('ℹ️  Sending new reset password code...');
            try {
              await resetPassword({ username: email });
              await AsyncStorage.setItem(`user_reset_flow_${email}`, 'true');
              Alert.alert(
                'New Code Sent',
                'A new verification code has been sent to your email. Please check and try again.',
                [{ text: 'OK' }]
              );
            } catch (sendError) {
              console.error('Failed to send new reset code:', sendError);
              Alert.alert(
                'Verification Failed',
                'Invalid or expired code. Please request a new verification code.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'Verification Failed',
              'Invalid verification code. Please try again.',
              [{ text: 'OK' }]
            );
          }
          return { success: false };
        }
      }
      
      let errorMessage = 'Invalid verification code. Please try again.';
      if (error.name === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error.name === 'ExpiredCodeException') {
        errorMessage = 'Verification code expired. Please request a new one.';
      }
      
      Alert.alert('Verification Failed', errorMessage, [{ text: 'OK' }]);
      return { success: false };
    }
  }

  /**
   * Send OTP to phone using AWS Cognito SMS
   */
  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      // Ensure Amplify is configured before use
      this.ensureAmplifyConfigured();
      
      console.log('═══════════════════════════════════════════');
      console.log('📱 SENDING SMS OTP (AWS COGNITO)');
      console.log('═══════════════════════════════════════════');
      console.log('Phone:', phoneNumber);

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);

      try {
        // Sign up with phone number
        const { userId, nextStep } = await signUp({
          username: phoneNumber,
          password: tempPassword,
          options: {
            userAttributes: {
              phone_number: phoneNumber,
            },
            autoSignIn: false,
          },
        });

        console.log('✅ OTP sent successfully via SMS');
        console.log('User ID:', userId);
        console.log('═══════════════════════════════════════════');

        // Store temp password
        await AsyncStorage.setItem(`temp_password_${phoneNumber}`, tempPassword);

        return true;
      } catch (signUpError: any) {
        if (signUpError.name === 'UsernameExistsException') {
          await resendSignUpCode({ username: phoneNumber });
          console.log('✅ OTP resent successfully via SMS');
          console.log('═══════════════════════════════════════════');
          return true;
        } else {
          throw signUpError;
        }
      }
    } catch (error: any) {
      console.error('[AWS Cognito] ❌ Failed to send SMS OTP:', error);
      console.log('═══════════════════════════════════════════');
      
      Alert.alert(
        'Error Sending SMS',
        error.message || 'Failed to send SMS verification code. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Verify phone OTP using AWS Cognito
   */
  async verifyPhoneOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; userId?: string }> {
    try {
      // Ensure Amplify is configured before use
      this.ensureAmplifyConfigured();
      
      console.log('═══════════════════════════════════════════');
      console.log('🔍 VERIFYING SMS OTP (AWS COGNITO)');
      console.log('═══════════════════════════════════════════');
      console.log('Phone:', phoneNumber);

      const { isSignUpComplete } = await confirmSignUp({
        username: phoneNumber,
        confirmationCode: otp,
      });

      if (isSignUpComplete) {
        console.log('✅ SMS OTP VERIFIED SUCCESSFULLY!');
        
        // Sign in the user
        const tempPassword = await AsyncStorage.getItem(`temp_password_${phoneNumber}`);
        let userId: string | undefined;
        
        if (tempPassword) {
          await signIn({
            username: phoneNumber,
            password: tempPassword,
          });
          
          // Get the user ID from Cognito
          const cognitoUser = await getCognitoUser();
          userId = cognitoUser.userId;
          
          console.log('✅ User signed in successfully');
          console.log('User ID:', userId);
          await AsyncStorage.removeItem(`temp_password_${phoneNumber}`);
        }
        
        console.log('═══════════════════════════════════════════');
        return { success: true, userId };
      } else {
        console.log('❌ SMS OTP verification incomplete');
        console.log('═══════════════════════════════════════════');
        return { success: false };
      }
    } catch (error: any) {
      console.error('[AWS Cognito] ❌ Failed to verify SMS OTP:', error);
      console.log('═══════════════════════════════════════════');
      
      Alert.alert(
        'Verification Failed',
        'Invalid verification code. Please try again.',
        [{ text: 'OK' }]
      );
      return { success: false };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      // Ensure Amplify is configured before use
      this.ensureAmplifyConfigured();
      
      const { username, userId, signInDetails } = await getCognitoUser();
      const session = await fetchAuthSession();
      
      return {
        email: username,
        sub: userId,
        isVerified: true,
      };
    } catch (error) {
      console.log('[AWS Cognito] No current user found');
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Ensure Amplify is configured before use
      this.ensureAmplifyConfigured();
      
      await signOut();
      console.log('[AWS Cognito] ✅ User logged out successfully');
    } catch (error) {
      console.error('[AWS Cognito] ❌ Failed to logout:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realCognitoOTPService = new RealCognitoAuthService();
export default realCognitoOTPService;

