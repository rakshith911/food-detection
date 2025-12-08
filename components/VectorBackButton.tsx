import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface VectorBackButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export default function VectorBackButton({ 
  onPress, 
  size = 18, 
  color = '#1F1F1F',
  style 
}: VectorBackButtonProps) {
  // Scale down the dimensions proportionally
  const scale = size / 20; // Base size is 20 (height)
  const width = 11.77500057220459 * scale;
  const height = 20 * scale;
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]} activeOpacity={0.7}>
      <Svg width={width} height={height} viewBox="0 0 12 20" fill="none">
        <Path
          d="M10 20L0 10L10 0L11.775 1.775L3.55 10L11.775 18.225L10 20Z"
          fill={color}
          opacity={1}
        />
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
});

