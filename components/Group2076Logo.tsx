import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface Group2076LogoProps {
  width?: number;
  height?: number;
  style?: any;
  onLoad?: () => void;
}

export default function Group2076Logo({
  width = 280,
  height,
  style,
  onLoad
}: Group2076LogoProps) {
  // Original dimensions: 586x525 (aspect ratio ~0.896)
  // Calculate height based on width to maintain aspect ratio and show full image
  // This ensures the "UKcal" text and asparagus are fully visible
  const aspectRatio = 525 / 586; // height / width = ~0.896
  const calculatedHeight = width * aspectRatio;
  // Always use calculated height to show full image, ignore provided height if it would crop
  const displayHeight = calculatedHeight;

  // Use Group2076.png (without space) which shows the full logo with "UKcal" text
  // Using filename without space to avoid iOS require() issues
  return (
    <View style={[styles.container, { width, height: displayHeight }, style]}>
      <Image
        source={require('../icons/Group2076.png')}
        style={{ width, height: displayHeight }}
        resizeMode="contain"
        onLoad={onLoad}
        onError={(error) => {
          console.error('[Group2076Logo] Image load error:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
