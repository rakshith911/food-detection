import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput as PaperTextInput } from 'react-native-paper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import MultiSelect from '../components/MultiSelect';
import VectorBackButton from '../components/VectorBackButton';
import BottomButtonContainer from '../components/BottomButtonContainer';
import { Avatar } from '../constants/avatarConstants';
import { userService } from '../services/UserService';
import { safeGoBack } from '../utils/navigationHelpers';
import { customTheme } from '../constants/themeConstants';

interface BusinessData {
  profileImage?: string;
  avatar?: Avatar;
  businessName: string;
  businessAddress: string;
  town: string;
  country: string;
  district: string;
  postalCode: string;
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

export default function BusinessProfileStep1Screen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  // Initially hide address fields - only show after successful postcode lookup
  const [showAddressFields, setShowAddressFields] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Calculate bottom padding for ScrollView to account for button container
  // Button height (56) + container padding top (16) + container padding bottom (max(insets.bottom, 16)) + border (1)
  const buttonContainerHeight = 56 + 16 + Math.max(insets.bottom, 16) + 1;

  // UK Cities/Towns list
  const ukTowns = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool',
    'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Nottingham',
    'Coventry', 'Bradford', 'Cardiff', 'Belfast', 'Derby', 'Southampton',
    'Brighton', 'Plymouth', 'Reading', 'York', 'Oxford', 'Cambridge'
  ].sort();

  const [town, setTown] = useState<MultiSelectState>({
    value: "",
    list: ukTowns.map((t, index) => ({ _id: String(index + 1), value: t })),
    selectedList: [],
  });

  const [country, setCountry] = useState<MultiSelectState>({
    value: "United Kingdom",
    list: [{ _id: "1", value: "United Kingdom" }],
    selectedList: [{ _id: "1", value: "United Kingdom" }],
  });

  // Load saved step1 data ONLY if user is navigating back from Step 2
  // For new users, this should be empty (cleared on account creation)
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Check if user has completed profile - if yes, they shouldn't be here (should use EditProfile)
        const profileCompleted = await AsyncStorage.getItem('business_profile_completed');
        if (profileCompleted === 'true') {
          // User has completed profile - don't load saved step1 data (they should use EditProfile)
          console.log('[BusinessProfileStep1] Profile already completed, not loading saved data');
          return;
        }
        
        // Only load saved data if user is in the middle of creating profile (navigated back from Step 2)
        // This data should only exist if user went to Step 2 and came back
        const savedData = await AsyncStorage.getItem('business_profile_step1');
        if (savedData) {
          const data: BusinessData = JSON.parse(savedData);
          console.log('[BusinessProfileStep1] Loading saved Step 1 data:', data);
          // Load the data (user navigated back from Step 2)
          setBusinessName(data.businessName || '');
          setBusinessAddress(data.businessAddress || '');
          setDistrict(data.district || '');
          setPostalCode(data.postalCode || '');
          setProfileImage(data.profileImage || null);
          setAvatar(data.avatar || null);
          
          if (data.town) {
            const townItem = town.list.find(t => t.value === data.town);
            if (townItem) {
              setTown({
                ...town,
                value: data.town,
                selectedList: [townItem],
              });
            }
          }
          
          // Show address fields if we have saved address data (user navigated back from Step 2)
          // This ensures fields are visible when user returns to edit
          if (data.businessAddress || data.town || data.district || data.postalCode) {
            setShowAddressFields(true);
          }
        } else {
          console.log('[BusinessProfileStep1] No saved Step 1 data - starting fresh');
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, []);


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
        setAvatar(null); // Clear avatar if profile image is selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleAddAvatar = async () => {
    // Save current data temporarily
    const tempData: BusinessData = {
      profileImage: profileImage || undefined,
      avatar: avatar || undefined,
      businessName,
      businessAddress,
      town: town.value,
      country: country.value,
      district,
      postalCode,
    };
    await AsyncStorage.setItem('business_profile_step1', JSON.stringify(tempData));
    
    // Navigate to AddAvatar screen with context flag
    navigation.navigate('AddAvatar', { fromBusinessProfile: true });
  };

  // Load avatar when returning from AddAvatar
  useFocusEffect(
    React.useCallback(() => {
      const loadAvatarFromStorage = async () => {
        try {
          const savedData = await AsyncStorage.getItem('business_profile_step1');
          if (savedData) {
            const data: BusinessData = JSON.parse(savedData);
            if (data.avatar) {
              setAvatar(data.avatar);
              setProfileImage(null); // Clear profile image if avatar is selected
            } else if (data.profileImage) {
              setProfileImage(data.profileImage);
              setAvatar(null); // Clear avatar if profile image is selected
            }
          }
        } catch (error) {
          console.error('Error loading avatar:', error);
        }
      };
      loadAvatarFromStorage();
    }, [])
  );

  // Lookup UK postcode using Postcode.io API
  // Auto-fills address details in the background (not shown to user)
  const lookupPostcode = async (postcode: string) => {
    if (!postcode || postcode.trim().length < 5) {
      Alert.alert('', 'Please enter a valid postcode (at least 5 characters)');
      return;
    }

    setIsLookingUpPostcode(true);
    try {
      const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;
        
        // Auto-fill address with the most relevant field (stored but not shown)
        const address = result.parish || result.admin_ward || result.ward || result.post_town || '';
        if (address) {
          setBusinessAddress(address);
        }
        
        // Auto-fill town/city - try multiple fields to find a match
        const possibleTowns = [
          result.admin_district,
          result.post_town,
          result.parish,
          result.admin_ward,
        ].filter(Boolean);
        
        // Try to find a match in our town list
        let foundTown = false;
        for (const possibleTown of possibleTowns) {
          if (!possibleTown) continue;
          
          const townItem = town.list.find(t => 
            t.value.toLowerCase() === possibleTown.toLowerCase() ||
            possibleTown.toLowerCase().includes(t.value.toLowerCase()) ||
            t.value.toLowerCase().includes(possibleTown.toLowerCase())
          );
          
          if (townItem) {
            setTown({
              ...town,
              value: townItem.value,
              selectedList: [townItem],
            });
            foundTown = true;
            break;
          }
        }
        
        // If no match found, dynamically add the API town to the list
        if (!foundTown && possibleTowns.length > 0) {
          const apiTown = possibleTowns[0]; // Use the first available town from API
          const newTownId = String(town.list.length + 1);
          const newTownItem = { _id: newTownId, value: apiTown };
          
          // Add to the list and set as selected
          setTown({
            ...town,
            list: [...town.list, newTownItem],
            value: apiTown,
            selectedList: [newTownItem],
          });
        }
        
        // Auto-fill district/county (stored but not shown)
        const districtValue = result.admin_county || result.region || result.county || '';
        if (districtValue) {
          setDistrict(districtValue);
        }
        
        // Format and set the postcode (normalize format)
        const formattedPostcode = cleanPostcode.slice(0, -3) + ' ' + cleanPostcode.slice(-3);
        setPostalCode(formattedPostcode);
        
        // Show address fields after successful lookup (no popup - fields just appear)
        setShowAddressFields(true);
      } else {
        Alert.alert('', "We couldn't find your postal code. You may still proceed with this postal code.");
      }
    } catch (error) {
      console.error('Postcode lookup error:', error);
      Alert.alert('Error', 'Failed to lookup postcode. You can still proceed with just the postcode.');
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  const handleNext = async () => {
    // Validation - only require business name and postal code
    if (!businessName.trim()) {
      Alert.alert('', 'Please enter your business name');
      return;
    }
    if (!postalCode.trim()) {
      Alert.alert('', 'Please enter your postal code');
      return;
    }

    setIsLoading(true);
    try {
      // Save Step 1 data
      // If postcode lookup was done, use those values; otherwise use defaults
      const step1Data: BusinessData = {
        profileImage: profileImage || undefined,
        avatar: avatar || undefined,
        businessName,
        businessAddress: businessAddress || '', // Auto-filled from postcode or empty
        town: town.value || '', // Auto-filled from postcode or empty
        country: country.value || 'United Kingdom', // Default to UK
        district: district || '', // Auto-filled from postcode or empty
        postalCode,
      };

      await AsyncStorage.setItem('business_profile_step1', JSON.stringify(step1Data));
      
      // Navigate to Step 2
      navigation.navigate('BusinessProfileStep2');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
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
  const handleTownChange = useCallback((value: any) => {
    setTown({
      ...town,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [town]);

  const handleCountryChange = useCallback((value: any) => {
    setCountry({
      ...country,
      value: value.text,
      selectedList: value.selectedList,
    });
  }, [country]);

  const Content = (
    <View style={styles.contentWrapper}>
      {/* Header */}
      <View style={styles.header}>
        <VectorBackButton onPress={() => safeGoBack(navigation, 'Consent')} />
        <Text style={styles.headerTitle}>Create Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        decelerationRate="normal"
        bounces={true}
        scrollEventThrottle={16}
        overScrollMode="never"
        nestedScrollEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
          {/* Profile Image / Avatar Selector */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handleAddAvatar} style={styles.imagePickerButton}>
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
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity style={styles.selectImageButton} onPress={selectProfileImage}>
                <Text style={styles.selectImageText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Form */}
          <View style={styles.formContainer}>
            {/* Business Name */}
            <View style={styles.inputWrapper}>
              <CustomInput
                placeholder="Your Business Name"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            {/* Postal Code with Lookup */}
            <View style={styles.inputWrapper}>
              <View style={styles.postalCodeContainer}>
                <PaperTextInput
                  label="Postal Code"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  onBlur={() => {
                    // Auto-lookup when user finishes entering postcode (if valid length)
                    if (postalCode.trim().length >= 5 && !isLookingUpPostcode) {
                      lookupPostcode(postalCode);
                    }
                  }}
                  keyboardType="default"
                  autoCapitalize="characters"
                  mode="outlined"
                  outlineColor={customTheme.colors.dark}
                  placeholderTextColor={customTheme.colors.dark}
                  placeholder="e.g., SW1A 1AA"
                  contentStyle={{
                    color: customTheme.colors.dark,
                  }}
                  style={styles.postalCodeInput}
                  right={
                    <PaperTextInput.Icon
                      icon={() => (
                        <TouchableOpacity
                          onPress={() => lookupPostcode(postalCode)}
                          disabled={isLookingUpPostcode || !postalCode.trim()}
                          style={[
                            styles.searchIconTouchable,
                            (!postalCode.trim() || isLookingUpPostcode) && styles.searchIconDisabled
                          ]}
                        >
                          {isLookingUpPostcode ? (
                            <ActivityIndicator size="small" color="#7BA21B" />
                          ) : (
                            <Ionicons 
                              name="search" 
                              size={20} 
                              color={postalCode.trim() ? "#7BA21B" : "#D1D5DB"} 
                            />
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  }
                  theme={{
                    colors: {
                      primary: customTheme.colors.primary,
                      error: "#E32A17",
                    },
                  }}
                />
              </View>
            </View>

            {/* Address Fields - Shown after postcode lookup */}
            {showAddressFields && (
              <>
                {/* Business Address */}
                <View style={styles.inputWrapper}>
                  <CustomInput
                    placeholder="Business Address"
                    value={businessAddress}
                    onChangeText={setBusinessAddress}
                  />
                </View>

                {/* Town / City Dropdown */}
                <View style={styles.inputWrapper}>
                  <MultiSelect
                    label="Town / City"
                    value={town.value}
                    onSelection={handleTownChange}
                    arrayList={town.list}
                    selectedArrayList={town.selectedList}
                    multiEnable={false}
                  />
                </View>

                {/* Country Dropdown */}
                <View style={styles.inputWrapper}>
                  <MultiSelect
                    label="Country"
                    value={country.value}
                    onSelection={handleCountryChange}
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
                    onFocus={() => {
                      // Scroll to end to ensure the input is visible above keyboard
                      setTimeout(() => {
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollToEnd({ animated: true });
                        }
                      }, 300);
                    }}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
    </View>
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
      {/* Next Button - Fixed at Bottom (outside flex container to stay fixed) */}
      <BottomButtonContainer>
        <CustomButton
          variant={isLoading ? "disabled" : "primary"}
          btnLabel={isLoading ? "Saving..." : "Next"}
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
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
    borderColor: '#E5E7EB',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectImageButton: {
    backgroundColor: '#7BA21B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  selectImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  selectAvatarButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7BA21B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
  },
  selectAvatarText: {
    color: '#7BA21B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    alignItems: 'center',
  },
  inputWrapper: {
    width: 325,
    marginBottom: 16,
  },
  postalCodeContainer: {
    width: '100%',
  },
  postalCodeInput: {
    height: 55,
    backgroundColor: customTheme.colors.light,
    fontSize: 16,
    marginBottom: 4,
  },
  searchIconTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  searchIconDisabled: {
    opacity: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
});

