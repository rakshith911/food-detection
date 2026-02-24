import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import VectorBackButton from '../components/VectorBackButton';
import CustomButton from '../components/CustomButton';
import BottomButtonContainer from '../components/BottomButtonContainer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { sendDeleteAccountOTP, verifyDeleteAccountOTPAndDelete } from '../store/slices/authSlice';
import { captureException } from '../utils/sentry';

export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const authError = useAppSelector((state) => state.auth.error);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!user?.email) return;
    dispatch(sendDeleteAccountOTP(user.email));
  }, [user?.email, dispatch]);

  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const countdownInterval = setInterval(() => {
        setResendCooldown((prevCount) => prevCount - 1);
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      navigation.goBack();
      return;
    }
    if (resendCooldown > 0) return;

    setIsSendingOTP(true);
    setErrorMessage('');
    try {
      await dispatch(sendDeleteAccountOTP(user.email)).unwrap();
      setResendCooldown(30);
    } catch (error) {
      console.error('[DeleteAccount] Error sending OTP:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: 'DeleteAccount - Send OTP',
      });
      setErrorMessage('Failed to send verification code. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
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
    if (!user?.email) return;

    setIsVerifying(true);
    try {
      const result = await dispatch(
        verifyDeleteAccountOTPAndDelete({ email: user.email, otp: enteredOtp })
      ).unwrap();
      if (result?.success) {
        Alert.alert('Account Deleted', 'Your account has been deleted.');
      }
    } catch (error) {
      console.error('[DeleteAccount] Error verifying OTP or deleting account:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: 'DeleteAccount - Verify OTP',
      });
      setOtp(['', '', '', '', '', '']);
      Alert.alert(
        'Invalid OTP',
        'This is not a valid OTP.',
        [
          {
            text: 'Try Again',
            style: 'cancel',
            onPress: () => inputRefs.current[0]?.focus(),
          },
          {
            text: 'Resend OTP',
            onPress: () => handleSendOTP(),
          },
        ]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <VectorBackButton onPress={() => navigation.goBack()} />
              <Text style={styles.headerTitle}>Delete Account</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
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
                          editable={!isVerifying}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Instructions */}
                  <View style={styles.instructionsContainer}>
                    {errorMessage === '' && (
                      <Text style={styles.instructionsText}>
                        Please check your email and enter the verification code
                      </Text>
                    )}
                  </View>

                  {/* Error Message */}
                  {errorMessage !== '' && (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Button outside KAV — stays fixed at screen bottom */}
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
          onPress={handleSendOTP}
        />
      </BottomButtonContainer>

      {/* Loading Overlay */}
      {isVerifying && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7BA21B" />
        </View>
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

