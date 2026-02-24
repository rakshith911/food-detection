import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import MultiSelect from '../components/MultiSelect';
import { useAppDispatch } from '../store/hooks';
import { saveBusinessProfile, setAvatar } from '../store/slices/profileSlice';
import { userService, BusinessProfile } from '../services/UserService';
import VectorBackButton from '../components/VectorBackButton';
import BottomButtonContainer from '../components/BottomButtonContainer';
import { captureException } from '../utils/sentry';
import { safeGoBack } from '../utils/navigationHelpers';
import { Avatar } from '../constants/avatarConstants';

interface BusinessDetailsData {
  menuFile?: any;
  businessCategory: string;
  cuisineType: string;
  primaryServingStyle: string;
  averageDishPrice: string;
  standardMealSize: string;
  businessSize: string;
}

interface Step1MediaData {
  profileImage?: string | null;
  avatar?: Avatar | null;
}

interface MultiSelectItem {
  _id: string;
  value: string;
}

interface MultiSelectState {
  value: string;
  list: MultiSelectItem[];
  selectedList: MultiSelectItem[];
}

export default function BusinessProfileStep2Screen({ navigation }: { navigation: any }) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatar, setAvatarState] = useState<Avatar | null>(null);
  const [menuFile, setMenuFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate bottom padding for ScrollView to account for button container
  // Button height (56) + container padding top (16) + container padding bottom (max(insets.bottom, 16)) + border (1)
  const buttonContainerHeight = 56 + 16 + Math.max(insets.bottom, 16) + 1;

  // Business Category State
  const [businessCategory, setBusinessCategory] = useState<MultiSelectState>({
    value: "",
    list: [
      { _id: "1", value: "Café" },
      { _id: "2", value: "Restaurant" },
      { _id: "3", value: "Takeaway" },
      { _id: "4", value: "Bakery" },
      { _id: "5", value: "Catering" },
      { _id: "6", value: "Fast Food" },
      { _id: "7", value: "Fine Dining" },
      { _id: "8", value: "Pub/Bar" },
      { _id: "9", value: "Food Truck" },
      { _id: "10", value: "Cloud Kitchen" },
    ],
    selectedList: [],
  });

  // Cuisine Type State
  const [cuisineType, setCuisineType] = useState<MultiSelectState>({
    value: "",
    list: [
      { _id: "1", value: "British" },
      { _id: "2", value: "Indian" },
      { _id: "3", value: "Italian" },
      { _id: "4", value: "Chinese" },
      { _id: "5", value: "Japanese" },
      { _id: "6", value: "Thai" },
      { _id: "7", value: "Mexican" },
      { _id: "8", value: "French" },
      { _id: "9", value: "American" },
      { _id: "10", value: "Mediterranean" },
      { _id: "11", value: "Middle Eastern" },
      { _id: "12", value: "Asian Fusion" },
      { _id: "13", value: "European" },
      { _id: "14", value: "African" },
      { _id: "15", value: "Caribbean" },
      { _id: "16", value: "International" },
    ],
    selectedList: [],
  });

  // Primary Serving Style State
  const [primaryServingStyle, setPrimaryServingStyle] = useState<MultiSelectState>({
    value: "",
    list: [
      { _id: "1", value: "Eat-in" },
      { _id: "2", value: "Takeaway" },
      { _id: "3", value: "Delivery" },
    ],
    selectedList: [],
  });

  // Average Dish Price State
  const [averageDishPrice, setAverageDishPrice] = useState<MultiSelectState>({
    value: "",
    list: [
      { _id: "1", value: "Under £25" },
      { _id: "2", value: "£26 - £50" },
      { _id: "3", value: "Over £51" },
    ],
    selectedList: [],
  });

  // Meal Size State
  const [standardMealSize, setStandardMealSize] = useState<MultiSelectState>({
    value: "",
    list: [
      { _id: "1", value: "Small Portion" },
      { _id: "2", value: "Regular Portion" },
      { _id: "3", value: "Large Portion" },
    ],
    selectedList: [],
  });

  // Business Size State
  const [businessSize, setBusinessSize] = useState<MultiSelectState>({
    value: "",
    list: [
      { _id: "1", value: "Micro (<10 staff)" },
      { _id: "2", value: "Small (<50 staff)" },
      { _id: "3", value: "Medium (<250 staff)" },
    ],
    selectedList: [],
  });

  const persistStep1MediaUpdates = async (updates: Partial<Step1MediaData>) => {
    try {
      const savedData = await AsyncStorage.getItem('business_profile_step1');
      const parsed = savedData ? JSON.parse(savedData) : {};
      const updated = { ...parsed, ...updates };
      await AsyncStorage.setItem('business_profile_step1', JSON.stringify(updated));
    } catch (error) {
      console.error('[BusinessProfileStep2] Error updating Step1 media data:', error);
    }
  };

  const selectProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setAvatarState(null);
        await persistStep1MediaUpdates({
          profileImage: result.assets[0].uri,
          avatar: null,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadMenu = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        setMenuFile(result.assets[0]);
        Alert.alert('Success', `Menu uploaded: ${result.assets[0].name}`);
      }
    } catch (error) {
      console.error('Error uploading menu:', error);
      Alert.alert('Error', 'Failed to upload menu');
    }
  };

  useEffect(() => {
    const loadStep1Media = async () => {
      try {
        const savedData = await AsyncStorage.getItem('business_profile_step1');
        if (savedData) {
          const parsed: Step1MediaData = JSON.parse(savedData);
          if (parsed.profileImage) {
            setProfileImage(parsed.profileImage);
          }
          if (parsed.avatar) {
            setAvatarState(parsed.avatar);
          }
        }
      } catch (error) {
        console.error('[BusinessProfileStep2] Error loading Step1 media:', error);
      }
    };
    loadStep1Media();
  }, []);

  const handleNext = async () => {
    // Validation
    if (!businessCategory.value) {
      Alert.alert('', 'Please select a business category');
      return;
    }
    if (!cuisineType.value) {
      Alert.alert('', 'Please select a cuisine type');
      return;
    }
    if (!primaryServingStyle.value) {
      Alert.alert('', 'Please select a primary serving style');
      return;
    }
    if (!averageDishPrice.value) {
      Alert.alert('', 'Please select average dish price');
      return;
    }
    if (!standardMealSize.value) {
      Alert.alert('', 'Please select meal size');
      return;
    }
    if (!businessSize.value) {
      Alert.alert('', 'Please select business size');
      return;
    }

    setIsLoading(true);
    try {
      // Get Step 1 data
      const step1DataString = await AsyncStorage.getItem('business_profile_step1');
      const step1Data = step1DataString ? JSON.parse(step1DataString) : {};

      // Combine all profile data
      // Map businessAddress to address (BusinessProfile interface uses 'address')
      const completeProfile: BusinessProfile = {
        profileImage: step1Data.profileImage,
        businessName: step1Data.businessName,
        address: step1Data.businessAddress || step1Data.address || '', // Map businessAddress to address
        town: step1Data.town,
        country: step1Data.country,
        district: step1Data.district,
        postalCode: step1Data.postalCode,
        menuFile: menuFile || undefined,
        businessCategory: businessCategory.value,
        cuisineType: cuisineType.value,
        primaryServingStyle: primaryServingStyle.value,
        averageDishPrice: averageDishPrice.value,
        standardMealSize: standardMealSize.value,
        businessSize: businessSize.value,
      };

      // Save business profile via Redux
      console.log('[BusinessProfile] Saving complete profile to user account...');
      const saveResult = await dispatch(saveBusinessProfile(completeProfile));
      
      if (!saveBusinessProfile.fulfilled.match(saveResult)) {
        throw new Error('Failed to save profile');
      }
      
      // Save avatar if it exists in step1Data
      if (step1Data.avatar) {
        await dispatch(setAvatar(step1Data.avatar));
        console.log('[BusinessProfile] Avatar saved to user account');
      }
      
      console.log('[BusinessProfile] Profile saved successfully:', completeProfile);
      
      // Set profile completion flag in AsyncStorage
      await AsyncStorage.setItem('business_profile_completed', 'true');
      
      // Show success message and navigate to TutorialScreen for new users
      Alert.alert('Success', 'Business profile created successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to TutorialScreen for new users
            navigation.reset({
              index: 0,
              routes: [{ name: 'Tutorial' }],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('[BusinessProfile] Error saving profile:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: 'BusinessProfile - Save Profile',
      });
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isIOS = Platform.OS === 'ios';

  // Memoize content container style
  const scrollContentStyle = useMemo(
    () => [styles.scrollContent, { paddingBottom: buttonContainerHeight + 20 }],
    [buttonContainerHeight]
  );

  // Memoize handlers to prevent re-renders
  const handleBusinessCategoryChange = useCallback((value: any) => {
    setBusinessCategory((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
    }));
  }, []);

  const handleCuisineTypeChange = useCallback((value: any) => {
    setCuisineType({
      ...cuisineType,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [cuisineType]);

  const handlePrimaryServingStyleChange = useCallback((value: any) => {
    setPrimaryServingStyle({
      ...primaryServingStyle,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [primaryServingStyle]);

  const handleAverageDishPriceChange = useCallback((value: any) => {
    setAverageDishPrice({
      ...averageDishPrice,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [averageDishPrice]);

  const handleStandardMealSizeChange = useCallback((value: any) => {
    setStandardMealSize({
      ...standardMealSize,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [standardMealSize]);

  const handleBusinessSizeChange = useCallback((value: any) => {
    setBusinessSize({
      ...businessSize,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [businessSize]);

  const Content = (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <VectorBackButton onPress={() => safeGoBack(navigation, 'BusinessProfileStep1')} />
          <Text style={styles.headerTitle}>Create Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          decelerationRate="normal"
          bounces={true}
          scrollEventThrottle={16}
          overScrollMode="never"
          nestedScrollEnabled={true}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={selectProfileImage} style={styles.imagePickerButton}>
              {avatar ? (
                <Image 
                  source={avatar.imgSrc} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#D1D5DB" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadMenuButton} onPress={uploadMenu}>
              <Ionicons name="document-text" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.uploadMenuText}>
                {menuFile ? `${menuFile.name}` : 'Upload Menu'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Form */}
          <View style={styles.formContainer}>
            {/* Business Category */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                label="Business Category"
                value={businessCategory.value}
                onSelection={handleBusinessCategoryChange}
                arrayList={businessCategory.list}
                selectedArrayList={businessCategory.selectedList}
                multiEnable={false}
              />
            </View>

            {/* Cuisine Type */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                label="Cuisine Type"
                value={cuisineType.value}
                onSelection={handleCuisineTypeChange}
                arrayList={cuisineType.list}
                selectedArrayList={cuisineType.selectedList}
                multiEnable={true}
              />
            </View>

            {/* Primary Serving Style */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                label="Primary Serving Style"
                value={primaryServingStyle.value}
                onSelection={handlePrimaryServingStyleChange}
                arrayList={primaryServingStyle.list}
                selectedArrayList={primaryServingStyle.selectedList}
                multiEnable={true}
              />
            </View>

            {/* Average Dish Price */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                label="Average Dish Price"
                value={averageDishPrice.value}
                onSelection={handleAverageDishPriceChange}
                arrayList={averageDishPrice.list}
                selectedArrayList={averageDishPrice.selectedList}
                multiEnable={false}
              />
            </View>

            {/* Meal Size */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                label="Meal Size"
                value={standardMealSize.value}
                onSelection={handleStandardMealSizeChange}
                arrayList={standardMealSize.list}
                selectedArrayList={standardMealSize.selectedList}
                multiEnable={true}
              />
            </View>

            {/* Business Size */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                label="Business Size"
                value={businessSize.value}
                onSelection={handleBusinessSizeChange}
                arrayList={businessSize.list}
                selectedArrayList={businessSize.selectedList}
                multiEnable={false}
              />
            </View>
          </View>
        </ScrollView>
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
          keyboardVerticalOffset={insets.top}
        >
          {Content}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {Content}
        </View>
      )}
      {/* Complete Profile Button - Fixed at Bottom (outside flex container to stay fixed) */}
      <BottomButtonContainer>
        <CustomButton
          variant={isLoading ? "disabled" : "primary"}
          btnLabel={isLoading ? "Saving..." : "Complete Profile"}
          onPress={handleNext}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 12,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
    flexGrow: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  imagePickerButton: {
    marginBottom: 6,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#7BA21B',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7BA21B',
  },
  uploadMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7BA21B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  uploadMenuText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    alignItems: 'center',
  },
  inputWrapper: {
    width: 325,
    marginBottom: 6,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
});
