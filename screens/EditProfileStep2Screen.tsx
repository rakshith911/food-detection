import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import MultiSelect from '../components/MultiSelect';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadProfile, saveBusinessProfile, setAvatar as setAvatarAction } from '../store/slices/profileSlice';
import { useFocusEffect } from '@react-navigation/native';
import { BusinessProfile, Avatar } from '../services/UserService';
import VectorBackButton from '../components/VectorBackButton';
import { captureException } from '../utils/sentry';
import { safeGoBack } from '../utils/navigationHelpers';
import BottomButtonContainer from '../components/BottomButtonContainer';
import OptimizedImage from '../components/OptimizedImage';
import { avatarList } from '../constants/avatarConstants';

interface MultiSelectItem {
  _id: string;
  value: string;
}

interface MultiSelectState {
  value: string;
  list: MultiSelectItem[];
  selectedList: MultiSelectItem[];
}

export default function EditProfileStep2Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.profile);
  const [menuFile, setMenuFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);

  // Business Category State
  const [businessCategory, setBusinessCategory] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'Café' },
      { _id: '2', value: 'Restaurant' },
      { _id: '3', value: 'Takeaway' },
      { _id: '4', value: 'Bakery' },
      { _id: '5', value: 'Catering' },
      { _id: '6', value: 'Fast Food' },
      { _id: '7', value: 'Fine Dining' },
      { _id: '8', value: 'Pub/Bar' },
      { _id: '9', value: 'Food Truck' },
      { _id: '10', value: 'Cloud Kitchen' },
    ],
    selectedList: [],
  });

  // Cuisine Type State
  const [cuisineType, setCuisineType] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'British' },
      { _id: '2', value: 'Indian' },
      { _id: '3', value: 'Italian' },
      { _id: '4', value: 'Chinese' },
      { _id: '5', value: 'Japanese' },
      { _id: '6', value: 'Thai' },
      { _id: '7', value: 'Mexican' },
      { _id: '8', value: 'French' },
      { _id: '9', value: 'American' },
      { _id: '10', value: 'Mediterranean' },
      { _id: '11', value: 'Middle Eastern' },
      { _id: '12', value: 'Asian Fusion' },
      { _id: '13', value: 'European' },
      { _id: '14', value: 'African' },
      { _id: '15', value: 'Caribbean' },
      { _id: '16', value: 'International' },
    ],
    selectedList: [],
  });

  // Primary Serving Style State
  const [primaryServingStyle, setPrimaryServingStyle] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'Eat-in' },
      { _id: '2', value: 'Takeaway' },
      { _id: '3', value: 'Delivery' },
    ],
    selectedList: [],
  });

  const [averageDishPrice, setAverageDishPrice] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'Under £25' },
      { _id: '2', value: '£26 - £50' },
      { _id: '3', value: 'Over £51' },
    ],
    selectedList: [],
  });

  const [standardMealSize, setStandardMealSize] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'Small Portion' },
      { _id: '2', value: 'Regular Portion' },
      { _id: '3', value: 'Large Portion' },
    ],
    selectedList: [],
  });

  const [businessSize, setBusinessSize] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'Micro (<10 staff)' },
      { _id: '2', value: 'Small (<50 staff)' },
      { _id: '3', value: 'Medium (<250 staff)' },
    ],
    selectedList: [],
  });

  // Profile is loaded by App.tsx on login — no need to dispatch here

  // Helper: parse profile string (single or comma-separated) into value + selectedList for MultiSelect
  const parseProfileMultiSelect = useCallback(
    (profileStr: string | undefined, list: MultiSelectItem[]): { value: string; selectedList: MultiSelectItem[] } => {
      if (!profileStr || typeof profileStr !== 'string' || list.length === 0) {
        return { value: '', selectedList: [] };
      }
      const parts = profileStr.split(',').map((s) => s.trim()).filter(Boolean);
      const selectedList: MultiSelectItem[] = [];
      for (const part of parts) {
        const found = list.find((item) => item.value.trim() === part || item.value === part);
        if (found && !selectedList.some((s) => s._id === found._id)) {
          selectedList.push(found);
        }
      }
      const value = selectedList.map((s) => s.value).join(', ');
      return { value, selectedList };
    },
    []
  );

  // Load Step 1 data and existing profile data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Step 1 data (we'll use it when saving)
        const step1DataString = await AsyncStorage.getItem('edit_profile_step1');
        if (step1DataString) {
          const step1Data = JSON.parse(step1DataString);
          // Load avatar and profile image from Step 1
          if (step1Data.avatar) {
            // Reconstruct avatar from avatarList to ensure imgSrc is properly set
            const savedAvatar = step1Data.avatar;
            const reconstructedAvatar = avatarList.find(av => av.id === savedAvatar.id);
            if (reconstructedAvatar) {
              setAvatar(reconstructedAvatar);
              setProfileImage(null);
            } else {
              // Fallback: use saved avatar if not found in list
              setAvatar(savedAvatar);
              setProfileImage(null);
            }
          } else if (step1Data.profileImage) {
            setProfileImage(step1Data.profileImage);
            setAvatar(null);
          }
        }

        // Load existing profile to populate Step 2 fields
        const profile = profileState.businessProfile;
        if (profile) {
          // Load menu file from existing profile
          if (profile.menuFile) {
            // Ensure menuFile has the expected structure
            const loadedMenuFile = profile.menuFile as any;
            if (loadedMenuFile && (loadedMenuFile.uri || loadedMenuFile.name)) {
              setMenuFile(loadedMenuFile);
            } else {
              console.warn('[EditProfileStep2] Invalid menuFile structure from profile:', loadedMenuFile);
            }
          }

          // Use helper so single and comma-separated values load correctly
          const cat = parseProfileMultiSelect(profile.businessCategory, businessCategory.list);
          if (cat.selectedList.length > 0 || profile.businessCategory === '') {
            setBusinessCategory((prev) => ({ ...prev, value: cat.value, selectedList: cat.selectedList }));
          }

          const cuisine = parseProfileMultiSelect(profile.cuisineType, cuisineType.list);
          if (cuisine.selectedList.length > 0 || profile.cuisineType === '') {
            setCuisineType((prev) => ({ ...prev, value: cuisine.value, selectedList: cuisine.selectedList }));
          }

          const style = parseProfileMultiSelect(profile.primaryServingStyle, primaryServingStyle.list);
          if (style.selectedList.length > 0 || profile.primaryServingStyle === '') {
            setPrimaryServingStyle((prev) => ({ ...prev, value: style.value, selectedList: style.selectedList }));
          }

          const price = parseProfileMultiSelect(profile.averageDishPrice, averageDishPrice.list);
          if (price.selectedList.length > 0 || profile.averageDishPrice === '') {
            setAverageDishPrice((prev) => ({ ...prev, value: price.value, selectedList: price.selectedList }));
          }

          const mealSize = parseProfileMultiSelect(profile.standardMealSize, standardMealSize.list);
          if (mealSize.selectedList.length > 0 || profile.standardMealSize === '') {
            setStandardMealSize((prev) => ({ ...prev, value: mealSize.value, selectedList: mealSize.selectedList }));
          }

          const bizSize = parseProfileMultiSelect(profile.businessSize, businessSize.list);
          if (bizSize.selectedList.length > 0 || profile.businessSize === '') {
            setBusinessSize((prev) => ({ ...prev, value: bizSize.value, selectedList: bizSize.selectedList }));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [profileState.businessProfile]);

  const uploadMenu = useCallback(async () => {
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
  }, []);

  const handleSave = async () => {
    // Validation
    if (!businessCategory.value) {
      Alert.alert('Required', 'Please select a business category');
      return;
    }
    if (!cuisineType.value) {
      Alert.alert('Required', 'Please select a cuisine type');
      return;
    }
    if (!primaryServingStyle.value) {
      Alert.alert('Required', 'Please select a primary serving style');
      return;
    }
    if (!averageDishPrice.value) {
      Alert.alert('Required', 'Please select average dish price');
      return;
    }
    if (!standardMealSize.value) {
      Alert.alert('Required', 'Please select standard meal size');
      return;
    }
    if (!businessSize.value) {
      Alert.alert('Required', 'Please select business size');
      return;
    }

    setIsLoading(true);
    let step1Data: any = {};
    try {
      // Get Step 1 data
      const step1DataString = await AsyncStorage.getItem('edit_profile_step1');
      step1Data = step1DataString ? JSON.parse(step1DataString) : {};

      // Combine all profile data
      // Map businessAddress to address (BusinessProfile interface uses 'address')
      // Handle menuFile - ensure it's in the correct format and doesn't cause serialization issues
      let processedMenuFile: any = undefined;
      if (menuFile) {
        try {
          // Normalize menuFile to avoid serialization issues
          // DocumentPicker result has: name, type, mimeType, uri, size, etc.
          // Profile-loaded menuFile might just have: uri
          
          // First, ensure menuFile is an object
          let menuFileAny: any = null;
          if (typeof menuFile === 'object' && menuFile !== null && !Array.isArray(menuFile)) {
            menuFileAny = menuFile;
          } else if (typeof menuFile === 'string' && menuFile.length > 0) {
            // If it's a string (URI), convert to object
            menuFileAny = { uri: menuFile };
          }
          
          if (menuFileAny && typeof menuFileAny === 'object') {
            // Extract properties safely, checking for existence first
            const uri = menuFileAny.uri;
            const name = menuFileAny.name;
            
            // Safely get mimeType or type - check if properties exist before accessing
            const mimeType = (menuFileAny && 'mimeType' in menuFileAny) ? menuFileAny.mimeType : undefined;
            const type = (menuFileAny && 'type' in menuFileAny) ? menuFileAny.type : undefined;
            
            // Determine file type safely - only access if properties exist
            let fileType = 'application/pdf';
            if (mimeType && typeof mimeType === 'string' && mimeType.length > 0) {
              fileType = mimeType;
            } else if (type && typeof type === 'string' && type.length > 0) {
              fileType = type;
            }
            
            // Only create processedMenuFile if we have at least a URI
            if (uri && typeof uri === 'string' && uri.length > 0) {
              // Create a clean, serializable object with only primitive values
              processedMenuFile = {
                uri: String(uri),
                name: (name && typeof name === 'string' && name.length > 0) ? String(name) : 'menu.pdf',
                type: String(fileType),
              };
            } else {
              // If no valid URI, skip menuFile to avoid issues
              console.warn('[EditProfileStep2] menuFile has no valid URI, skipping');
              processedMenuFile = undefined;
            }
          } else {
            console.warn('[EditProfileStep2] menuFile is not a valid object or string, skipping');
            processedMenuFile = undefined;
          }
        } catch (menuFileError) {
          console.error('[EditProfileStep2] Error processing menuFile:', menuFileError);
          // If there's an error processing menuFile, set it to undefined to avoid issues
          processedMenuFile = undefined;
        }
      }
      
      // Build profile object - only include menuFile if it's properly defined and serializable
      const completeProfile: BusinessProfile = {
        profileImage: step1Data.profileImage || profileImage || undefined,
        businessName: step1Data.businessName,
        address: step1Data.businessAddress || step1Data.address || '', // Map businessAddress to address
        town: step1Data.town,
        country: step1Data.country,
        district: step1Data.district,
        postalCode: step1Data.postalCode,
        businessCategory: businessCategory.value,
        cuisineType: cuisineType.value,
        primaryServingStyle: primaryServingStyle.value,
        averageDishPrice: averageDishPrice.value,
        standardMealSize: standardMealSize.value,
        businessSize: businessSize.value,
      };

      // Only add menuFile if it's valid and serializable - create a completely clean object
      if (processedMenuFile && processedMenuFile.uri && typeof processedMenuFile.uri === 'string') {
        // Ensure menuFile is a plain object with only serializable primitive values
        const cleanMenuFile = {
          uri: String(processedMenuFile.uri),
          name: String(processedMenuFile.name || 'menu.pdf'),
          type: String(processedMenuFile.type || 'application/pdf'),
        };
        // Only add if all required fields are present and valid
        if (cleanMenuFile.uri && cleanMenuFile.name && cleanMenuFile.type) {
          completeProfile.menuFile = cleanMenuFile;
        }
      }
      
      // Sanitize the profile object before dispatching to ensure it's fully serializable
      // Build a completely clean object with only primitive values - no undefined properties
      const sanitizedProfile: any = {
        businessName: String(completeProfile.businessName || ''),
        address: String(completeProfile.address || ''),
        town: String(completeProfile.town || ''),
        country: String(completeProfile.country || ''),
        district: String(completeProfile.district || ''),
        postalCode: String(completeProfile.postalCode || ''),
        businessCategory: String(completeProfile.businessCategory || ''),
        cuisineType: String(completeProfile.cuisineType || ''),
        primaryServingStyle: String(completeProfile.primaryServingStyle || ''),
        averageDishPrice: String(completeProfile.averageDishPrice || ''),
        standardMealSize: String(completeProfile.standardMealSize || ''),
        businessSize: String(completeProfile.businessSize || ''),
      };
      
      // Only add profileImage if it exists and is a string
      if (completeProfile.profileImage && typeof completeProfile.profileImage === 'string') {
        sanitizedProfile.profileImage = String(completeProfile.profileImage);
      }
      
      // Only add menuFile if it exists and is completely valid - create a fresh object
      if (completeProfile.menuFile && 
          typeof completeProfile.menuFile === 'object' &&
          completeProfile.menuFile !== null &&
          !Array.isArray(completeProfile.menuFile) &&
          completeProfile.menuFile.uri && 
          typeof completeProfile.menuFile.uri === 'string' &&
          completeProfile.menuFile.uri.length > 0) {
        try {
          // Safely access type and name properties with fallbacks
          const menuFileUri = String(completeProfile.menuFile.uri);
          const menuFileName = (completeProfile.menuFile.name && typeof completeProfile.menuFile.name === 'string')
            ? String(completeProfile.menuFile.name)
            : 'menu.pdf';
          const menuFileType = (completeProfile.menuFile.type && typeof completeProfile.menuFile.type === 'string')
            ? String(completeProfile.menuFile.type)
            : 'application/pdf';
          
          // Only add if we have all required fields and they're all strings
          if (menuFileUri && menuFileName && menuFileType && 
              typeof menuFileUri === 'string' && 
              typeof menuFileName === 'string' && 
              typeof menuFileType === 'string') {
            // Create a completely fresh object with only these three properties
            sanitizedProfile.menuFile = {
              uri: menuFileUri,
              name: menuFileName,
              type: menuFileType,
            };
          }
        } catch (menuFileError) {
          console.error('[EditProfileStep2] Error processing menuFile:', menuFileError);
          // Don't add menuFile if there's any error
        }
      }
      
      // Save avatar if it exists in step1Data - do this before saving profile
      // Only dispatch if we have a valid avatar object
      if (step1Data.avatar && typeof step1Data.avatar === 'object' && step1Data.avatar.id) {
        try {
          // Reconstruct avatar from avatarList to ensure imgSrc is properly set
          const reconstructedAvatar = avatarList.find(av => av.id === step1Data.avatar.id);
          if (reconstructedAvatar && reconstructedAvatar.id) {
            const avatarResult = await dispatch(setAvatarAction(reconstructedAvatar));
            if (setAvatarAction.rejected.match(avatarResult)) {
              console.warn('[EditProfileStep2] Failed to set avatar, continuing...');
            }
          } else if (step1Data.avatar && step1Data.avatar.id) {
            // Fallback: use saved avatar if not found in list
            const avatarResult = await dispatch(setAvatarAction(step1Data.avatar));
            if (setAvatarAction.rejected.match(avatarResult)) {
              console.warn('[EditProfileStep2] Failed to set avatar, continuing...');
            }
          }
        } catch (avatarError) {
          console.error('[EditProfileStep2] Error setting avatar:', avatarError);
          // Continue even if avatar setting fails
        }
      }
      // Note: We don't clear avatar here - let the profile save handle it

      // Final safety check - ensure menuFile is valid before dispatching
      // Remove menuFile if it's not a valid object with all required properties
      if (sanitizedProfile.menuFile) {
        try {
          const mf = sanitizedProfile.menuFile;
          if (!mf || 
              typeof mf !== 'object' ||
              !mf.uri || 
              !mf.name || 
              !mf.type ||
              typeof mf.uri !== 'string' ||
              typeof mf.name !== 'string' ||
              typeof mf.type !== 'string') {
            // Remove invalid menuFile
            delete sanitizedProfile.menuFile;
          }
        } catch (menuFileCheckError) {
          // If there's any error checking menuFile, remove it
          console.warn('[EditProfileStep2] Error checking menuFile, removing it:', menuFileCheckError);
          delete sanitizedProfile.menuFile;
        }
      }
      
      // Create a completely clean payload - convert to JSON and back to ensure serializability
      // This will remove any non-serializable properties and undefined values
      let finalPayload: BusinessProfile;
      try {
        // First, remove any undefined values
        const cleanedProfile = Object.fromEntries(
          Object.entries(sanitizedProfile).filter(([_, value]) => value !== undefined)
        );
        
        // Convert to JSON and back to ensure full serializability
        const jsonString = JSON.stringify(cleanedProfile);
        const parsed = JSON.parse(jsonString);
        
        // Ensure menuFile is valid if it exists
        if (parsed.menuFile) {
          if (!parsed.menuFile.uri || !parsed.menuFile.name || !parsed.menuFile.type) {
            delete parsed.menuFile;
          }
        }
        
        finalPayload = parsed as BusinessProfile;
      } catch (serializeError) {
        console.error('[EditProfileStep2] Error serializing profile:', serializeError);
        // If serialization fails, create a minimal profile without menuFile
        const { menuFile, ...profileWithoutMenuFile } = sanitizedProfile;
        // Remove any undefined values and ensure all required fields are present
        const cleaned = Object.fromEntries(
          Object.entries(profileWithoutMenuFile).filter(([_, value]) => value !== undefined)
        );
        finalPayload = {
          businessName: String(cleaned.businessName || ''),
          address: String(cleaned.address || ''),
          town: String(cleaned.town || ''),
          country: String(cleaned.country || ''),
          district: String(cleaned.district || ''),
          postalCode: String(cleaned.postalCode || ''),
          businessCategory: String(cleaned.businessCategory || ''),
          cuisineType: String(cleaned.cuisineType || ''),
          primaryServingStyle: String(cleaned.primaryServingStyle || ''),
          averageDishPrice: String(cleaned.averageDishPrice || ''),
          standardMealSize: String(cleaned.standardMealSize || ''),
          businessSize: String(cleaned.businessSize || ''),
          ...(cleaned.profileImage ? { profileImage: String(cleaned.profileImage) } : {}),
        } as BusinessProfile;
      }
      
      // Save business profile via Redux with error handling
      let saveResult;
      try {
        saveResult = await dispatch(saveBusinessProfile(finalPayload));
      } catch (dispatchError) {
        console.error('[EditProfileStep2] Error dispatching saveBusinessProfile:', dispatchError);
        // If dispatch fails, try without menuFile
        const { menuFile: _, ...profileWithoutMenuFile } = finalPayload;
        finalPayload = profileWithoutMenuFile as BusinessProfile;
        saveResult = await dispatch(saveBusinessProfile(finalPayload));
      }
      
      if (!saveBusinessProfile.fulfilled.match(saveResult)) {
        throw new Error('Failed to save profile');
      }
      
      // Clear temporary data
      await AsyncStorage.removeItem('edit_profile_step1');
      
      Alert.alert('Success', 'Your business profile has been updated!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset navigation stack to go back to Results, clearing edit profile screens
            navigation.reset({
              index: 0,
              routes: [{ name: 'Profile' as never }],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('[EditProfileStep2] Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Safely log error details
      try {
        console.error('[EditProfileStep2] Error details:', {
          message: errorMessage,
          stack: errorStack,
          menuFile: menuFile ? { 
            hasUri: !!(menuFile as any).uri, 
            hasName: !!(menuFile as any).name, 
            hasType: !!((menuFile as any).type || (menuFile as any).mimeType) 
          } : 'null',
          step1Data: step1Data && typeof step1Data === 'object' ? Object.keys(step1Data) : 'null',
        });
      } catch (logError) {
        console.error('[EditProfileStep2] Error logging details:', logError);
      }
      
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: 'EditProfileStep2 - Save Profile',
        extra: {
          menuFile: menuFile ? { 
            hasUri: !!(menuFile as any).uri, 
            hasName: !!(menuFile as any).name 
          } : null,
        },
      });
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize content container style to prevent re-creation on every render
  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent, 
      { 
        paddingBottom: 100,
        flexGrow: 1,
      }
    ],
    []
  );

  // Memoize keyboard dismiss handler
  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Memoize all MultiSelect handlers to prevent re-renders during scroll
  const handleBusinessCategoryChange = useCallback((value: any) => {
    // Single-select: only keep the most recently selected item
    const singleItem = value.selectedList && value.selectedList.length > 0 
      ? [value.selectedList[value.selectedList.length - 1]] 
      : [];
    setBusinessCategory((prev) => ({
      ...prev,
      value: singleItem.length > 0 ? singleItem[0].value : '',
      selectedList: singleItem,
    }));
  }, []);

  const handleCuisineTypeChange = useCallback((value: any) => {
    setCuisineType((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
    }));
  }, []);

  const handlePrimaryServingStyleChange = useCallback((value: any) => {
    setPrimaryServingStyle((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
    }));
  }, []);

  const handleAverageDishPriceChange = useCallback((value: any) => {
    // Single-select: only keep the most recently selected item
    const singleItem = value.selectedList && value.selectedList.length > 0 
      ? [value.selectedList[value.selectedList.length - 1]] 
      : [];
    setAverageDishPrice((prev) => ({
      ...prev,
      value: singleItem.length > 0 ? singleItem[0].value : '',
      selectedList: singleItem,
    }));
  }, []);

  const handleStandardMealSizeChange = useCallback((value: any) => {
    setStandardMealSize((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
    }));
  }, []);

  const handleBusinessSizeChange = useCallback((value: any) => {
    // Single-select: only keep the most recently selected item
    const singleItem = value.selectedList && value.selectedList.length > 0 
      ? [value.selectedList[value.selectedList.length - 1]] 
      : [];
    setBusinessSize((prev) => ({
      ...prev,
      value: singleItem.length > 0 ? singleItem[0].value : '',
      selectedList: singleItem,
    }));
  }, []);

  const isIOS = Platform.OS === 'ios';

  const Content = (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <VectorBackButton onPress={() => safeGoBack(navigation as any, 'EditProfileStep1')} />
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          decelerationRate={Platform.OS === 'android' ? 'normal' : 'fast'}
          bounces={Platform.OS === 'ios'}
          scrollEventThrottle={Platform.OS === 'android' ? 16 : 32}
          overScrollMode={Platform.OS === 'android' ? 'never' : undefined}
          nestedScrollEnabled={Platform.OS === 'android'}
          removeClippedSubviews={Platform.OS === 'android' ? false : true}
          scrollEnabled={true}
          fadingEdgeLength={0}
        >
            {/* Profile Image / Avatar Display */}
            <View style={styles.profileImageContainer}>
              {avatar ? (
                <Image source={avatar.imgSrc} style={styles.profileImage} />
              ) : profileImage ? (
                <OptimizedImage 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                  cachePolicy="memory-disk"
                  priority="high"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#D1D5DB" />
                </View>
              )}
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity style={styles.uploadMenuButton} onPress={uploadMenu}>
                  <Ionicons name="document-text" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.uploadMenuText}>
                    {menuFile && typeof menuFile === 'object' && (menuFile as any)?.name 
                      ? String((menuFile as any).name) 
                      : menuFile 
                        ? 'Menu Uploaded' 
                        : 'Upload Menu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Business Details Form */}
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

              {/* Standard Meal Size */}
              <View style={styles.inputWrapper}>
                <MultiSelect
                  label="Standard Meal Size"
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

        {/* Save Button - Fixed at Bottom */}
        <BottomButtonContainer>
          <CustomButton
            variant={isLoading ? "disabled" : "primary"}
            btnLabel={isLoading ? "Saving..." : "Save"}
            onPress={handleSave}
          />
        </BottomButtonContainer>
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
          enabled={true}
        >
          {Content}
        </KeyboardAvoidingView>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'android' && {
      flexGrow: 1,
    }),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    ...(Platform.OS === 'android' && {
      flexGrow: 1,
    }),
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#7BA21B',
    marginBottom: 4,
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
    marginBottom: 4,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  formContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  inputWrapper: {
    width: 325,
    marginBottom: 6,
  },
  uploadMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
});

