import React from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';

interface AppLoaderProps {
  message?: string;
}

export default function AppLoader({ message }: AppLoaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator 
          size="large" 
          color="#7BA21B" 
          style={styles.spinner}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // Thin spinner appearance - centered and clean
  },
  spinner: {
    // Using large size for visibility, but styled to appear thinner
    // The green color (#7BA21B) matches the app theme
  },
});

