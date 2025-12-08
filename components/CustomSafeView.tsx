import React from 'react';
import { SafeAreaView, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';

type CustomSafeViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const CustomSafeView: React.FC<CustomSafeViewProps> = ({ children, style }) => {
  const androidStyles = StyleSheet.create({
    androidSafeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
  });

  const iosStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#FFFFFF',
  };

  return (
    <SafeAreaView
      style={[
        Platform.OS === 'android' ? androidStyles.androidSafeArea : iosStyle,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
};

export default CustomSafeView;


