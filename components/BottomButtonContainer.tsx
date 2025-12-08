import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomButtonContainerProps {
  children: ReactNode;
  paddingHorizontal?: number;
}

/**
 * Container for buttons that should be fixed at the bottom
 * and stay below the keyboard (doesn't move above keyboard)
 */
const BottomButtonContainer: React.FC<BottomButtonContainerProps> = ({ children, paddingHorizontal = 32 }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContainer: {
    paddingTop: 16,
  },
});

export default BottomButtonContainer;

