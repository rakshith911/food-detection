import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';

interface ProfileIconProps {
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: any;
}

export default function ProfileIcon({
  size = 24,
  color = '#3B82F6',
  onPress,
  style
}: ProfileIconProps) {
  // Get avatar and profileImage from Redux
  const avatar = useAppSelector((state) => state.profile.avatar);
  const profileImage = useAppSelector((state) => state.profile.profileImage);

  const iconSize = size;

  // Only show image if source is valid
  const hasValidAvatar = avatar && avatar.imgSrc;
  const hasValidProfileImage = profileImage && typeof profileImage === 'string' && profileImage.length > 0;

  const content = hasValidAvatar ? (
    <Image source={avatar.imgSrc} style={styles.image} resizeMode="cover" />
  ) : hasValidProfileImage ? (
    <Image source={{ uri: profileImage }} style={styles.image} resizeMode="cover" />
  ) : (
    <Ionicons name="person" size={iconSize} color={color} />
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        style={style}
        android_ripple={{ color: 'transparent', borderless: true }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={style}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
});

