import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import VectorBackButton from '../components/VectorBackButton';
import CustomButton from '../components/CustomButton';
import BottomButtonContainer from '../components/BottomButtonContainer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteAccount } from '../store/slices/authSlice';
import { captureException } from '../utils/sentry';

export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteOtp, setDeleteOtp] = useState<string | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Send OTP email on mount
    sendDeleteOTP();
  }, []);

  // Load the generated OTP from storage (for testing)
  useEffect(() => {
    const loadOTP = async () => {
      if (!user?.email) return;
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const storedOTP = await AsyncStorage.getItem(`delete_otp_${user.email}`);
        if (storedOTP) {
          setGeneratedOTP(storedOTP);
          setDeleteOtp(storedOTP);
          console.log('[DeleteAccount] Loaded test OTP from storage:', storedOTP);
        }
      } catch (error) {
        console.error('[DeleteAccount] Error loading OTP:', error);
      }
    };
    loadOTP();
  }, [user?.email]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const countdownInterval = setInterval(() => {
        setResendCooldown((prevCount) => prevCount - 1);
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [resendCooldown]);

  const sendDeleteOTP = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      navigation.goBack();
      return;
    }

    setIsSendingOTP(true);
    setErrorMessage('');
    
    try {
      // Generate a test OTP and store it (similar to login OTP)
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setDeleteOtp(generatedOTP);
      setGeneratedOTP(generatedOTP);
      
      // Store OTP in AsyncStorage for testing (similar to login flow)
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(`delete_otp_${user.email}`, generatedOTP);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[DeleteAccount] OTP sent to:', user.email);
      console.log('[DeleteAccount] Test OTP (for testing):', generatedOTP);
    } catch (error) {
      console.error('[DeleteAccount] Error sending OTP:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: 'DeleteAccount - Send OTP',
      });
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const resendOTP = async () => {
    if (resendCooldown > 0) return;
    await sendDeleteOTP();
    setResendCooldown(30);
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-validate when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('');
      if (fullOtp.length === 6) {
        validateOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateOTP = async (enteredOtp: string) => {
    if (!deleteOtp) {
      setErrorMessage('Please request an OTP first');
      return;
    }

    if (enteredOtp === deleteOtp) {
      setIsLoading(true);
      try {
        // Delete account via Redux (anonymizes email, preserves data)
        const result = await dispatch(deleteAccount());
        
        if (deleteAccount.fulfilled.match(result)) {
          Alert.alert(
            'Account Deleted',
            'Your account has been deleted.'
          );
          // Navigation will be handled by Redux state change
        } else {
          throw new Error(result.error?.message || 'Failed to delete account');
        }
      } catch (error) {
        console.error('[DeleteAccount] Error deleting account:', error);
        captureException(error instanceof Error ? error : new Error(String(error)), {
          context: 'DeleteAccount - Delete Account',
        });
        setErrorMessage('Failed to delete account. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage('Sorry! This is not a valid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const isIOS = Platform.OS === 'ios';

  const Content = (
    <TouchableWithoutFeedback
      onPress={() => Keyboard.dismiss()}
      style={{ height: '100%' }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <VectorBackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          decelerationRate="normal"
          bounces={true}
          scrollEventThrottle={16}
          overScrollMode="never"
          nestedScrollEnabled={true}
        >
          <View style={styles.content}>
            <View style={styles.contentInner}>
              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpInputWrapper,
                      (focusedIndex === index || otp[index]) && styles.otpInputWrapperFocused,
                      errorMessage !== '' && styles.otpInputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      value={otp[index]}
                      onChangeText={(value) => handleOTPChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!isLoading}
                    />
                  </View>
                ))}
              </View>

              {/* Instructions - Below OTP boxes */}
              <View style={styles.instructionsContainer}>
                {errorMessage === '' && (
                  <>
                    <Text style={styles.instructionsText}>
                      Please check your email and enter the OTP
                    </Text>
                    {generatedOTP && (
                      <View style={styles.testOtpContainer}>
                        <Text style={styles.testOtpLabel}>Test OTP:</Text>
                        <Text style={styles.testOtpValue}>{generatedOTP}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Error Message */}
              {errorMessage !== '' && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Resend OTP Button - Fixed at Bottom */}
        <BottomButtonContainer>
          <CustomButton
            variant={resendCooldown === 0 && !isSendingOTP ? 'primary' : 'disabled'}
            btnLabel={
              isSendingOTP ? (
                'Sending...'
              ) : resendCooldown === 0 ? (
                'Resend One-Time-Password (OTP)'
              ) : (
                `Resend One-Time-Password (${resendCooldown} sec)`
              )
            }
            onPress={resendOTP}
          />
        </BottomButtonContainer>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7BA21B" />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {isIOS ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {Content}
        </KeyboardAvoidingView>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  contentInner: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  instructionsContainer: {
    marginTop: 4,
    marginBottom: 16,
    width: '100%',
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#7BA21B',
    textAlign: 'center',
    marginBottom: 16,
  },
  testOtpContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  testOtpLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  testOtpValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
    width: '100%',
  },
  otpInputWrapper: {
    width: 48,
    height: 55,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputWrapperFocused: {
    borderWidth: 2,
    borderColor: '#7BA21B',
  },
  otpInputWrapperError: {
    borderColor: '#EF4444',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

