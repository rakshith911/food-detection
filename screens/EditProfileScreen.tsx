import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadProfile, saveBusinessProfile, updateProfileFields, setAvatar as setAvatarAction, updateProfileImage } from '../store/slices/profileSlice';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VectorBackButton from '../components/VectorBackButton';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import MultiSelect from '../components/MultiSelect';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { userService, BusinessProfile } from '../services/UserService';
import { captureException } from '../utils/sentry';

interface MultiSelectItem {
  _id: string;
  value: string;
}

interface MultiSelectState {
  value: string;
  list: MultiSelectItem[];
  selectedList: MultiSelectItem[];
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const profileState = useAppSelector((state) => state.profile);

  const [menuFile, setMenuFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  
  // Get profile data from Redux
  const profileImage = profileState.profileImage;
  const avatar = profileState.avatar;

  // Step 1 fields
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // UK Cities/Towns list
  const ukTowns = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool',
    'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Nottingham',
    'Coventry', 'Bradford', 'Cardiff', 'Belfast', 'Derby', 'Southampton',
    'Brighton', 'Plymouth', 'Reading', 'York', 'Oxford', 'Cambridge'
  ].sort();

  const [town, setTown] = useState<MultiSelectState>({
    value: '',
    list: ukTowns.map((t, index) => ({ _id: String(index + 1), value: t })),
    selectedList: [],
  });

  const [country, setCountry] = useState<MultiSelectState>({
    value: 'United Kingdom',
    list: [{ _id: '1', value: 'United Kingdom' }],
    selectedList: [{ _id: '1', value: 'United Kingdom' }],
  });

  // Step 2 fields
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

  const [primaryServingStyle, setPrimaryServingStyle] = useState<MultiSelectState>({
    value: '',
    list: [
      { _id: '1', value: 'Eat-in' },
      { _id: '2', value: 'Takeaway' },
      { _id: '3', value: 'Delivery' },
      { _id: '4', value: 'Eat-in & Takeaway' },
      { _id: '5', value: 'Eat-in & Delivery' },
      { _id: '6', value: 'Takeaway & Delivery' },
      { _id: '7', value: 'All (Eat-in, Takeaway & Delivery)' },
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

  // Load profile data from Redux when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      dispatch(loadProfile());
    }, [dispatch])
  );

  // Load existing business profile data from Redux state
  useEffect(() => {
    const profile = profileState.businessProfile;
    if (profile) {
      setBusinessName(profile.businessName || '');
      setBusinessAddress(profile.address || '');
      setDistrict(profile.district || '');
      setPostalCode(profile.postalCode || '');
      setMenuFile(profile.menuFile || null);

      // Set town
      if (profile.town) {
        const townItem = town.list.find(t => t.value === profile.town);
        if (townItem) {
          setTown({
            ...town,
            value: profile.town,
            selectedList: [townItem],
          });
        }
      }

      // Set country
      if (profile.country) {
        setCountry({
          ...country,
          value: profile.country,
          selectedList: [{ _id: '1', value: profile.country }],
        });
      }

      // Set business category
      if (profile.businessCategory) {
        const catItem = businessCategory.list.find(c => c.value === profile.businessCategory);
        if (catItem) {
          setBusinessCategory({
            ...businessCategory,
            value: profile.businessCategory,
            selectedList: [catItem],
          });
        }
      }

      // Set other fields similarly
      if (profile.cuisineType) {
        const cuisineItem = cuisineType.list.find(c => c.value === profile.cuisineType);
        if (cuisineItem) {
          setCuisineType({
            ...cuisineType,
            value: profile.cuisineType,
            selectedList: [cuisineItem],
          });
        }
      }

      if (profile.primaryServingStyle) {
        const styleItem = primaryServingStyle.list.find(s => s.value === profile.primaryServingStyle);
        if (styleItem) {
          setPrimaryServingStyle({
            ...primaryServingStyle,
            value: profile.primaryServingStyle,
            selectedList: [styleItem],
          });
        }
      }

      if (profile.averageDishPrice) {
        const priceItem = averageDishPrice.list.find(p => p.value === profile.averageDishPrice);
        if (priceItem) {
          setAverageDishPrice({
            ...averageDishPrice,
            value: profile.averageDishPrice,
            selectedList: [priceItem],
          });
        }
      }

      if (profile.standardMealSize) {
        const sizeItem = standardMealSize.list.find(s => s.value === profile.standardMealSize);
        if (sizeItem) {
          setStandardMealSize({
            ...standardMealSize,
            value: profile.standardMealSize,
            selectedList: [sizeItem],
          });
        }
      }

      if (profile.businessSize) {
        const bizSizeItem = businessSize.list.find(s => s.value === profile.businessSize);
        if (bizSizeItem) {
          setBusinessSize({
            ...businessSize,
            value: profile.businessSize,
            selectedList: [bizSizeItem],
          });
        }
      }
    }
  }, [profileState.businessProfile]);

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
        const imageUri = result.assets[0].uri;
        // Update profile image via Redux
        await dispatch(updateProfileImage(imageUri));
        // Clear avatar if profile image is selected
        await dispatch(setAvatarAction(undefined));
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

  // Lookup UK postcode using Postcode.io API
  const lookupPostcode = async (postcode: string) => {
    if (!postcode || postcode.trim().length < 5) return;

    setIsLookingUpPostcode(true);
    try {
      const cleanPostcode = postcode.replace(/\s/g, '');
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;
        setBusinessAddress(result.parish || result.admin_ward || '');
        
        // Find and set town
        const foundTown = result.admin_district || result.postcode_area || '';
        if (foundTown) {
          const townItem = town.list.find(t => t.value === foundTown);
          if (townItem) {
            setTown({
              ...town,
              value: foundTown,
              selectedList: [townItem],
            });
          }
        }
        
        setDistrict(result.admin_county || result.region || '');
        Alert.alert('Success', 'Address details auto-filled from postcode');
      } else {
        Alert.alert('Not Found', 'Could not find details for this postcode');
      }
    } catch (error) {
      console.error('Postcode lookup error:', error);
      Alert.alert('Error', 'Failed to lookup postcode. Please enter details manually.');
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  const saveProfile = async () => {
    // Validation
    if (!businessName.trim()) {
      Alert.alert('Required', 'Please enter your business name');
      return;
    }
    if (!businessAddress.trim()) {
      Alert.alert('Required', 'Please enter your business address');
      return;
    }
    if (!town.value) {
      Alert.alert('Required', 'Please select your town/city');
      return;
    }
    if (!postalCode.trim()) {
      Alert.alert('Required', 'Please enter your postal code');
      return;
    }
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
    try {
      const completeProfile: BusinessProfile = {
        profileImage: profileImage || undefined,
        businessName,
        address: businessAddress,
        town: town.value,
        country: country.value,
        district,
        postalCode,
        menuFile: menuFile || undefined,
        businessCategory: businessCategory.value,
        cuisineType: cuisineType.value,
        primaryServingStyle: primaryServingStyle.value,
        averageDishPrice: averageDishPrice.value,
        standardMealSize: standardMealSize.value,
        businessSize: businessSize.value,
      };

      // Save profile via Redux
      const result = await dispatch(saveBusinessProfile(completeProfile));
      
      if (saveBusinessProfile.fulfilled.match(result)) {
        Alert.alert('Success', 'Your business profile has been saved', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('[EditProfile] Error saving profile:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: 'EditProfile - Save Profile',
      });
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableWithoutFeedback
        onPress={() => Keyboard.dismiss()}
        style={{ height: '100%' }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <VectorBackButton
                    onPress={() => navigation.goBack()}
                  />
                  <Text style={styles.headerTitle}>Edit Profile</Text>
                </View>
              </View>

              <View style={styles.content}>
                {/* Profile Image Selector */}
                <View style={styles.profileImageContainer}>
                  <TouchableOpacity onPress={selectProfileImage} style={styles.imagePickerButton}>
                    {avatar ? (
                      <Image source={avatar.imgSrc} style={styles.profileImage} />
                    ) : profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="person" size={60} color="#D1D5DB" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.selectImageButton} onPress={selectProfileImage}>
                    <Text style={styles.selectImageText}>Select Profile Image</Text>
                  </TouchableOpacity>
                </View>

                {/* User Form */}
                <View style={styles.formContainer}>
                  {/* Email */}
                  <View style={[styles.inputWrapper, styles.emailInputWrapper]}>
                    <CustomInput
                      placeholder="Email"
                      value={user?.email || ''}
                      isDisabled={true}
                      onChangeText={() => {}}
                    />
                  </View>

                  {/* Business Name */}
                  <View style={styles.inputWrapper}>
                    <CustomInput
                      placeholder="Your Business Name"
                      value={businessName}
                      onChangeText={setBusinessName}
                    />
                  </View>

                  {/* Business Address */}
                  <View style={styles.inputWrapper}>
                    <CustomInput
                      placeholder="Business Address"
                      value={businessAddress}
                      onChangeText={setBusinessAddress}
                    />
                  </View>

                  {/* Town / City Dropdown */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Town / City"
                      value={town.value}
                      onSelection={(value) =>
                        setTown({
                          ...town,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={town.list}
                      selectedArrayList={town.selectedList}
                      multiEnable={false}
                    />
                  </View>

                  {/* Country Dropdown */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Country"
                      value={country.value}
                      onSelection={(value) =>
                        setCountry({
                          ...country,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={country.list}
                      selectedArrayList={country.selectedList}
                      multiEnable={false}
                    />
                  </View>

                  {/* District/County/State */}
                  <View style={styles.inputWrapper}>
                    <CustomInput
                      placeholder="District/County/State"
                      value={district}
                      onChangeText={setDistrict}
                    />
                  </View>

                  {/* Postal Code with Lookup */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.postalCodeContainer}>
                      <CustomInput
                        placeholder="Postal Code"
                        value={postalCode}
                        onChangeText={setPostalCode}
                      />
                      {isLookingUpPostcode && (
                        <ActivityIndicator size="small" color="#7BA21B" style={styles.lookupIndicator} />
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.lookupButton}
                      onPress={() => lookupPostcode(postalCode)}
                      disabled={isLookingUpPostcode}
                    >
                      <Text style={styles.lookupButtonText}>
                        {isLookingUpPostcode ? 'Looking up...' : 'Auto-fill from Postcode'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Menu Upload */}
                  <View style={styles.profileImageContainer}>
                    <TouchableOpacity style={styles.uploadMenuButton} onPress={uploadMenu}>
                      <Ionicons name="document-text" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.uploadMenuText}>
                        {menuFile ? `${menuFile.name}` : 'Upload Menu (Optional)'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Business Category */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Business Category"
                      value={businessCategory.value}
                      onSelection={(value) =>
                        setBusinessCategory({
                          ...businessCategory,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={businessCategory.list}
                      selectedArrayList={businessCategory.selectedList}
                      multiEnable={true}
                    />
                  </View>

                  {/* Cuisine Type */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Cuisine Type"
                      value={cuisineType.value}
                      onSelection={(value) =>
                        setCuisineType({
                          ...cuisineType,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={cuisineType.list}
                      selectedArrayList={cuisineType.selectedList}
                      multiEnable={true}
                    />
                  </View>

                  {/* Primary Serving Style */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Primary Serving Style"
                      value={primaryServingStyle.value}
                      onSelection={(value) =>
                        setPrimaryServingStyle({
                          ...primaryServingStyle,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={primaryServingStyle.list}
                      selectedArrayList={primaryServingStyle.selectedList}
                      multiEnable={true}
                    />
                  </View>

                  {/* Average Dish Price */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Average Dish Price"
                      value={averageDishPrice.value}
                      onSelection={(value) =>
                        setAverageDishPrice({
                          ...averageDishPrice,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={averageDishPrice.list}
                      selectedArrayList={averageDishPrice.selectedList}
                      multiEnable={false}
                    />
                  </View>

                  {/* Standard Meal Size */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Standard Meal Size"
                      value={standardMealSize.value}
                      onSelection={(value) =>
                        setStandardMealSize({
                          ...standardMealSize,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={standardMealSize.list}
                      selectedArrayList={standardMealSize.selectedList}
                      multiEnable={true}
                    />
                  </View>

                  {/* Business Size */}
                  <View style={styles.multiSelectWrapper}>
                    <MultiSelect
                      label="Business Size"
                      value={businessSize.value}
                      onSelection={(value) =>
                        setBusinessSize({
                          ...businessSize,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }
                      arrayList={businessSize.list}
                      selectedArrayList={businessSize.selectedList}
                      multiEnable={false}
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <View style={styles.buttonContainer}>
        <CustomButton
          variant={isLoading ? 'disabled' : 'primary'}
          btnLabel={isLoading ? 'Saving...' : 'Save'}
          onPress={saveProfile}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '100%',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  imagePickerButton: {
    marginBottom: 12,
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
  selectImageButton: {
    backgroundColor: '#7BA21B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  selectImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7BA21B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  uploadMenuText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 12,
    width: 325,
  },
  emailInputWrapper: {
    marginBottom: 32,
  },
  multiSelectWrapper: {
    marginBottom: 16,
    width: 325,
    height: 50,
  },
  postalCodeContainer: {
    position: 'relative',
  },
  lookupIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  lookupButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  lookupButtonText: {
    fontSize: 13,
    color: '#7BA21B',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
  },
});
