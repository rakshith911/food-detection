import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { sendOTP } from '../store/slices/authSlice';
import { setShowWelcome } from '../store/slices/appSlice';
import VectorBackButton from '../components/VectorBackButton';
import Group2076Logo from '../components/Group2076Logo';
import ScreenLoader from '../components/ScreenLoader';
import { useImageLoadTracker } from '../hooks/useImageLoadTracker';
import CustomInput from '../components/CustomInput';
import BottomButtonContainer from '../components/BottomButtonContainer';

export default function EmailLoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);
  
  const handleBack = () => {
    console.log('[EmailLogin] Back button pressed, setting showWelcome to true');
    
    // First, check if Welcome is in the current navigation stack
    let shouldNavigateBack = false;
    if (navigation.canGoBack && navigation.canGoBack()) {
      try {
        const state = navigation.getState();
        const routes = state?.routes || [];
        const hasWelcome = routes.some((route: any) => route.name === 'Welcome');
        if (hasWelcome) {
          console.log('[EmailLogin] Welcome found in stack, going back');
          shouldNavigateBack = true;
        }
      } catch (error) {
        console.log('[EmailLogin] Error checking navigation state:', error);
      }
    }
    
    if (shouldNavigateBack) {
      navigation.goBack();
    } else {
      // Set showWelcome to true - this will cause AppContent in App.tsx to re-render
      // and conditionally show the Welcome NavigationContainer
      console.log('[EmailLogin] Welcome not in stack, dispatching setShowWelcome(true)');
      dispatch(setShowWelcome(true));
      
      // Force a small delay to ensure state update propagates
      // The AppContent component should re-render and show Welcome screen
      setTimeout(() => {
        console.log('[EmailLogin] State update should have triggered re-render');
      }, 100);
    }
  };
  
  // Track logo image loading - wait for actual image to load
  const { isLoading: isImageLoading, handleImageLoad } = useImageLoadTracker({
    imageCount: 1, // We have 1 logo image
    minLoadTime: 400, // Show loader for at least 400ms
  });

  // Comprehensive email validation function (RFC 5322 compliant pattern)
  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    
    // RFC 5322 compliant email regex pattern
    // This pattern is more comprehensive than a simple regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Additional checks
    if (trimmed.length > 254) return false; // Max email length
    if (trimmed.includes('..')) return false; // No consecutive dots
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) return false; // No leading/trailing dots
    if (trimmed.startsWith('@') || trimmed.endsWith('@')) return false; // No leading/trailing @
    
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false; // Must have exactly one @
    
    const [localPart, domain] = parts;
    if (!localPart || localPart.length > 64) return false; // Local part max 64 chars
    if (!domain || domain.length > 253) return false; // Domain max 253 chars
    if (!domain.includes('.')) return false; // Domain must have at least one dot
    
    return emailRegex.test(trimmed);
  };

  const handleSendOTP = async () => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    // Use comprehensive email validation
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('', 'Please enter a valid email address');
      return;
    }

    try {
      const result = await dispatch(sendOTP({ input: trimmedEmail, method: 'email' }));
      if (sendOTP.fulfilled.match(result)) {
        // Navigate to OTP screen
        navigation.navigate('OTPScreen', { email: trimmedEmail });
      } else if (sendOTP.rejected.match(result)) {
        const errorMessage = result.error?.message || 'Failed to send OTP. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <ScreenLoader isLoading={isImageLoading}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.contentWrapper}>
          <View style={styles.backButtonWrapper}>
            <VectorBackButton onPress={handleBack} />
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentInsetAdjustmentBehavior="automatic"
              decelerationRate="normal"
              bounces={true}
              scrollEventThrottle={16}
              overScrollMode="never"
              nestedScrollEnabled={true}
            >
              <View style={styles.logoContainer}>
                <Group2076Logo width={280} height={280} onLoad={handleImageLoad} />
              </View>

              <View style={styles.formContainer}>
                <View style={styles.emailInputContainer}>
                  <CustomInput
                    placeholder="Your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    isDisabled={isLoading}
                  />
                </View>

                <View style={styles.linksContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
                    <Text style={styles.linkText}>Terms & Conditions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                    <Text style={styles.linkText}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Button - Fixed at Bottom */}
          <BottomButtonContainer>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP (One-Time Password)</Text>
              )}
            </TouchableOpacity>
          </BottomButtonContainer>
        </View>
      </SafeAreaView>
      </ScreenLoader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButtonWrapper: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 10,
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
  emailInputContainer: {
    marginBottom: 6,
  },
  button: {
    height: 56, // Fixed height
    width: '100%', // Fixed width
    backgroundColor: '#7BA21B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linksContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  linkText: {
    color: '#D4B896',
    fontSize: 14,
    fontWeight: '400',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

