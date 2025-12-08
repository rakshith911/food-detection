import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VectorBackButton from '../components/VectorBackButton';
import CustomButton from '../components/CustomButton';
import BottomButtonContainer from '../components/BottomButtonContainer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAvatar, updateProfileFields, loadProfile } from '../store/slices/profileSlice';
import { avatarList, Avatar } from '../constants/avatarConstants';
import { userService } from '../services/UserService';

export default function AddAvatarScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.profile);
  const insets = useSafeAreaInsets();
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const isFromBusinessProfile = route.params?.fromBusinessProfile === true;
  
  // Calculate bottom padding for FlatList to account for button container
  // Button height (56) + container padding top (16) + container padding bottom (max(insets.bottom, 16)) + border (1)
  const buttonContainerHeight = 56 + 16 + Math.max(insets.bottom, 16) + 1;

  useEffect(() => {
    const loadCurrentAvatar = async () => {
      if (isFromBusinessProfile) {
        // Load from temporary step1 data
        try {
          const savedData = await AsyncStorage.getItem('business_profile_step1');
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.avatar) {
              setSelectedAvatar(data.avatar);
            }
          }
        } catch (error) {
          console.error('Error loading avatar from step1:', error);
        }
      } else {
        // Load from Redux profile state
        if (profileState.avatar) {
          setSelectedAvatar(profileState.avatar);
        } else {
          // Fallback: load from service if not in Redux
          dispatch(loadProfile());
        }
      }
    };
    loadCurrentAvatar();
  }, [isFromBusinessProfile, profileState.avatar, dispatch]);

  const saveAvatar = async () => {
    if (!selectedAvatar) {
      return;
    }

    if (isFromBusinessProfile) {
      // Save to temporary step1 data
      try {
        const savedData = await AsyncStorage.getItem('business_profile_step1');
        const data = savedData ? JSON.parse(savedData) : {};
        data.avatar = selectedAvatar;
        await AsyncStorage.setItem('business_profile_step1', JSON.stringify(data));
        navigation.goBack();
      } catch (error) {
        console.error('Error saving avatar to step1:', error);
      }
    } else {
      // Save to user account via Redux
      const result = await dispatch(setAvatar(selectedAvatar));
      if (setAvatar.fulfilled.match(result)) {
        // Clear profile image if avatar is selected
        await dispatch(updateProfileFields({ profileImage: undefined }));
        navigation.goBack();
      }
    }
  };

  const renderAvatar = ({ item }: { item: Avatar }) => {
    const isSelected = selectedAvatar?.id === item.id;

    return (
      <View
        style={[
          styles.avatarContainer,
          isSelected && styles.avatarContainerSelected,
        ]}
      >
        <TouchableOpacity
          onPress={() => setSelectedAvatar(item)}
          activeOpacity={0.7}
        >
          <Image source={item.imgSrc} style={styles.avatarImage} />
        </TouchableOpacity>
      </View>
    );
  };

  const isIOS = Platform.OS === 'ios';

  const Content = (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <VectorBackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Add Avatar</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatars Grid */}
        <View style={styles.content}>
          <FlatList
            data={avatarList}
            renderItem={renderAvatar}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={[styles.avatarList, { paddingBottom: buttonContainerHeight + 20 }]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {isIOS ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {Content}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {Content}
        </View>
      )}
      {/* Save Button - Fixed at Bottom (outside flex container to stay fixed) */}
      <BottomButtonContainer>
        <CustomButton
          variant="primary"
          btnLabel="Save"
          onPress={saveAvatar}
          disabled={!selectedAvatar}
        />
      </BottomButtonContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarList: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    margin: 8,
    padding: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainerSelected: {
    borderColor: '#7BA21B',
    borderWidth: 3,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});

