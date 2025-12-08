import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface VectorBackButtonCircleProps {
  onPress: () => void;
  size?: number;
  style?: any;
}

export default function VectorBackButtonCircle({ 
  onPress, 
  size = 39,
  style 
}: VectorBackButtonCircleProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]} activeOpacity={0.7}>
      <Svg width={size} height={size} viewBox="0 0 39 39" fill="none">
        <Path
          d="M0 19.5C0 30.2691 8.73094 39 19.5 39C30.2691 39 39 30.2691 39 19.5C39 8.73094 30.2691 0 19.5 0C8.73094 0 0 8.73094 0 19.5ZM21 11.9916L15.0394 18H29.0625V21H15.0394L21 27.0084L18.8719 29.1216L9.32438 19.5L18.8719 9.87844L21 11.9916Z"
          fill="#7BA21B"
        />
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});


