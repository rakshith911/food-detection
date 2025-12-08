import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../store/hooks';
import { setShowWelcome } from '../store/slices/appSlice';
import Group2076Logo from '../components/Group2076Logo';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const handleLogin = () => {
    dispatch(setShowWelcome(false));
    navigation.navigate('EmailLogin');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Logo at top-center */}
      <View style={styles.logoContainer}>
        <Group2076Logo width={280} height={280} />
      </View>

      {/* Login Button at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#7BA21B',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7BA21B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

