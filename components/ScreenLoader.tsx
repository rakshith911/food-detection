import React from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

interface ScreenLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

/**
 * Screen-level loader that shows until content is ready
 * Shows a green spinner overlay while loading
 */
export default function ScreenLoader({ isLoading, children }: ScreenLoaderProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      <View style={styles.overlay}>
        <ActivityIndicator 
          size="large" 
          color="#7BA21B" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    opacity: 0.3, // Dim content while loading
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white overlay
  },
});


