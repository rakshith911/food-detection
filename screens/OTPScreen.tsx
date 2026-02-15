import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, sendOTP } from '../store/slices/authSlice';
import VectorBackButton from '../components/VectorBackButton';
import Group2076Logo from '../components/Group2076Logo';
import ScreenLoader from '../components/ScreenLoader';
import { useImageLoadTracker } from '../hooks/useImageLoadTracker';

export default function OTPScreen({ navigation, route }: { navigation: any; route: any }) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  
  // Track logo image loading - wait for actual image to load
  const { isLoading: isImageLoading, handleImageLoad } = useImageLoadTracker({
    imageCount: 1, // We have 1 logo image
    minLoadTime: 400,
  });
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    try {
      const result = await dispatch(sendOTP({ input: email, method: 'email' }));
      if (!sendOTP.fulfilled.match(result)) {
        Alert.alert('Error', 'Failed to resend code. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    try {
      const result = await dispatch(login({ input: email, otp: otpToVerify, method: 'email' }));
      if (login.fulfilled.match(result)) {
        // Don't navigate here - let App.tsx handle navigation based on user status
        // App.tsx will check consent/profile status and route appropriately
        // This prevents showing ConsentScreen/TutorialScreen for existing users
      } else if (login.rejected.match(result)) {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        Alert.alert(
          'Invalid OTP',
          'Invalid OTP. Please try again!',
          [{ text: 'Resend OTP', onPress: handleResendOTP }]
        );
      }
    } catch (error) {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert(
        'Invalid OTP',
        'Invalid OTP. Please try again!',
        [{ text: 'Resend OTP', onPress: handleResendOTP }]
      );
    }
  };

  // Load the generated OTP on mount
  useEffect(() => {
    const loadOTP = async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedOTP = await AsyncStorage.getItem(`email_otp_${email}`);
      if (storedOTP) {
        setGeneratedOTP(storedOTP);
      }
    };
    loadOTP();
  }, [email]);

  return (
    <ScreenLoader isLoading={isImageLoading}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 20}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
        >
        <VectorBackButton onPress={() => navigation.goBack()} />

        <View style={styles.logoContainer}>
          <Group2076Logo width={280} height={280} onLoad={handleImageLoad} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpInputWrapper,
                  (focusedIndex === index || digit) && styles.otpInputWrapperFocused
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={styles.otpInput}
                  value={digit}
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

          <Text style={styles.instructionText}>
            Please check your email and enter the OTP
          </Text>

          {/* DEMO MODE - Show OTP on screen */}
          {generatedOTP && (
            <View style={styles.demoOTPContainer}>
              <Text style={styles.demoOTPLabel}>🔑 Test OTP Code:</Text>
              <Text style={styles.demoOTPCode}>{generatedOTP}</Text>
              <Text style={styles.demoOTPHint}>
                Copy this code and paste it above
              </Text>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7BA21B" />
              <Text style={styles.loadingText}>Verifying...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenLoader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
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
  instructionText: {
    color: '#D4B896',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#7BA21B',
    fontSize: 16,
    fontWeight: '600',
  },
  demoOTPContainer: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  demoOTPLabel: {
    fontSize: 14,
    color: '#8B7500',
    marginBottom: 8,
    fontWeight: '600',
  },
  demoOTPCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7BA21B',
    letterSpacing: 8,
    marginBottom: 8,
  },
  demoOTPHint: {
    fontSize: 12,
    color: '#8B7500',
    fontStyle: 'italic',
  },
});

