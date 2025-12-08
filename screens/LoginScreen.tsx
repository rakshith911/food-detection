import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { sendOTP, login } from '../store/slices/authSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const handleSendOTP = async () => {
    const input = authMethod === 'email' ? email : phoneNumber;
    
    if (!input.trim()) {
      Alert.alert('Error', `Please enter your ${authMethod === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    if (authMethod === 'email') {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    } else {
      // Phone validation
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +1234567890)');
        return;
      }
    }

    try {
      const result = await dispatch(sendOTP({ input, method: authMethod }));
      if (sendOTP.fulfilled.match(result)) {
        if (authMethod === 'email') {
          // For email, go to OTP input screen
          setStep('otp');
          Alert.alert('OTP Sent', `OTP has been sent to ${email}\n\nCheck your email for the verification code.`);
        } else {
          // For phone, go to OTP input screen
          setStep('otp');
          Alert.alert('OTP Sent', `OTP has been sent to ${phoneNumber}\n\nCheck your SMS for the verification code.`);
        }
      } else {
        Alert.alert('Error', 'Failed to send verification. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    const input = authMethod === 'email' ? email : phoneNumber;
    
    try {
      const result = await dispatch(login({ input, otp, method: authMethod }));
      if (login.fulfilled.match(result)) {
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleBackToInput = () => {
    setStep('input');
    setOtp('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🍎 Food Analysis</Text>
          <Text style={styles.subtitle}>Choose your login method</Text>
        </View>

        {/* reCAPTCHA container for Firebase Phone Auth */}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
        
        <View style={styles.formContainer}>
          {step === 'input' ? (
            <>
              {/* Authentication Method Selector */}
              <View style={styles.authMethodContainer}>
                <TouchableOpacity
                  style={[styles.authMethodButton, authMethod === 'email' && styles.authMethodButtonActive]}
                  onPress={() => setAuthMethod('email')}
                >
                  <Text style={[styles.authMethodText, authMethod === 'email' && styles.authMethodTextActive]}>
                    📧 Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authMethodButton, authMethod === 'phone' && styles.authMethodButtonActive]}
                  onPress={() => setAuthMethod('phone')}
                >
                  <Text style={[styles.authMethodText, authMethod === 'phone' && styles.authMethodTextActive]}>
                    📱 Phone
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    authMethod === 'email' 
                      ? "Enter your email address" 
                      : "Enter your phone number (e.g., +1234567890)"
                  }
                  value={authMethod === 'email' ? email : phoneNumber}
                  onChangeText={authMethod === 'email' ? setEmail : setPhoneNumber}
                  keyboardType={authMethod === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter OTP</Text>
                <Text style={styles.emailDisplay}>
                  Sent to: {authMethod === 'email' ? email : phoneNumber}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToInput}
              >
                <Text style={styles.backButtonText}>
                  ← Change {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* reCAPTCHA container for Firebase Auth */}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  authMethodContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  authMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  authMethodButtonActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  authMethodTextActive: {
    color: '#ffffff',
  },
  emailInstructions: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#0369a1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  emailDisplay: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    fontFamily: 'System',
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
});
