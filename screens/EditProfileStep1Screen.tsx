import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput as PaperTextInput } from 'react-native-paper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import MultiSelect from '../components/MultiSelect';
import VectorBackButton from '../components/VectorBackButton';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadProfile, updateProfileImage, setAvatar as setAvatarAction } from '../store/slices/profileSlice';
import { safeGoBack } from '../utils/navigationHelpers';
import { customTheme } from '../constants/themeConstants';
import OptimizedImage from '../components/OptimizedImage';
import BottomButtonContainer from '../components/BottomButtonContainer';

interface MultiSelectItem {
  _id: string;
  value: string;
}

interface MultiSelectState {
  value: string;
  list: MultiSelectItem[];
  selectedList: MultiSelectItem[];
}

export default function EditProfileStep1Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const profileState = useAppSelector((state) => state.profile);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const districtInputContainerRef = useRef<View>(null);
  const businessAddressInputContainerRef = useRef<View>(null);

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

  // Load profile data from Redux when screen is focused
  // Only load if profile is not already loaded to avoid triggering AppLoader
  useFocusEffect(
    React.useCallback(() => {
      try {
        // Only load profile if it's not already loaded to prevent App from showing AppLoader
        if (!profileState.businessProfile && !profileState.isLoading) {
          console.log('[EditProfileStep1] Profile not loaded, loading now...');
          dispatch(loadProfile());
        } else {
          console.log('[EditProfileStep1] Profile already loaded, skipping loadProfile');
        }
      } catch (error) {
        console.error('[EditProfileStep1] Error loading profile in useFocusEffect:', error);
      }
    }, [dispatch, profileState.businessProfile, profileState.isLoading])
  );

  // Load existing business profile data
  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      try {
        const profile = profileState.businessProfile;
        
        // First, try to load from saved Step 1 data (in case user navigated back)
        try {
        const savedData = await AsyncStorage.getItem('edit_profile_step1');
        if (savedData) {
          const data = JSON.parse(savedData);
          console.log('[EditProfileStep1] Loading from saved Step 1 data:', data);
          if (data.businessName !== undefined) {
            setBusinessName(data.businessName);
          }
          // Handle both businessAddress and address in saved data
          const savedAddress = data.businessAddress || data.address;
          if (savedAddress !== undefined) {
            setBusinessAddress(savedAddress);
          }
          if (data.district !== undefined) {
            setDistrict(data.district);
          }
          if (data.postalCode !== undefined) {
            setPostalCode(data.postalCode);
          }
        }
      } catch (error) {
        console.error('Error loading saved Step 1 data:', error);
      }

      // Then, load from profile (this will override saved data if profile exists)
      if (profile) {
        console.log('[EditProfileStep1] Loading profile data:', {
          businessName: profile.businessName,
          address: (profile as any).address,
          businessAddress: (profile as any).businessAddress,
          district: profile.district,
          postalCode: profile.postalCode,
        });
        
        // Set business name - ensure it's set even if empty string
        if (profile.businessName !== undefined && profile.businessName !== null) {
          setBusinessName(profile.businessName);
        }
        // Handle both 'address' and 'businessAddress' field names for backward compatibility
        const addressValue = (profile as any).address || (profile as any).businessAddress;
        console.log('[EditProfileStep1] Address value:', addressValue);
        // Set address even if empty string (like we do for businessName)
        if (addressValue !== undefined && addressValue !== null) {
          setBusinessAddress(addressValue);
        } else {
          // If address is not in profile, try to keep what was loaded from saved data
          console.log('[EditProfileStep1] Address not found in profile, keeping saved data if any');
        }
        if (profile.district !== undefined && profile.district !== null) {
          setDistrict(profile.district);
        }
        if (profile.postalCode !== undefined && profile.postalCode !== null) {
          setPostalCode(profile.postalCode);
        }

        if (profile.town) {
          setTown((currentTown) => {
            const townItem = currentTown.list.find(t => t.value === profile.town);
            if (townItem) {
              return {
                ...currentTown,
                value: profile.town,
                selectedList: [townItem],
              };
            } else {
              // If town not in list, add it dynamically
              const newTownId = String(currentTown.list.length + 1);
              const newTownItem = { _id: newTownId, value: profile.town };
              return {
                ...currentTown,
                list: [...currentTown.list, newTownItem],
                value: profile.town,
                selectedList: [newTownItem],
              };
            }
          });
        }

        if (profile.country) {
          setCountry({
            ...country,
            value: profile.country,
            selectedList: [{ _id: '1', value: profile.country }],
          });
        }
      }
      
        // Load profile image and avatar
        if (profileState.profileImage && isMounted) {
          setProfileImage(profileState.profileImage);
        }
        if (profileState.avatar && isMounted) {
          setAvatar(profileState.avatar);
        }
      } catch (error) {
        console.error('[EditProfileStep1] Error in loadProfileData:', error);
      }
    };

    loadProfileData().catch((error) => {
      console.error('[EditProfileStep1] Error in loadProfileData:', error);
    });
    
    return () => {
      isMounted = false;
    };
  }, [profileState.businessProfile, profileState.profileImage, profileState.avatar]);

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
        setProfileImage(imageUri);
        await dispatch(updateProfileImage(imageUri));
        await dispatch(setAvatarAction(undefined));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleAddAvatar = async () => {
      // Save current data temporarily
      const tempData = {
        profileImage: profileImage || undefined,
        avatar: avatar || undefined,
        businessName,
        businessAddress,
        town: town.value,
        country: country.value,
        district,
        postalCode,
      };
      await AsyncStorage.setItem('edit_profile_step1', JSON.stringify(tempData));
    
    navigation.navigate('AddAvatar', { fromEditProfile: true });
  };

  // Load avatar when returning from AddAvatar
  useFocusEffect(
    React.useCallback(() => {
      const loadAvatarFromStorage = async () => {
        try {
          const savedData = await AsyncStorage.getItem('edit_profile_step1');
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.avatar) {
              setAvatar(data.avatar);
              setProfileImage(null);
            } else if (data.profileImage) {
              setProfileImage(data.profileImage);
              setAvatar(null);
            }
            // Also load other fields from saved data if profile is not yet loaded
            if (data.businessName !== undefined) {
              setBusinessName(data.businessName);
            }
            if (data.businessAddress !== undefined) {
              setBusinessAddress(data.businessAddress);
            }
            if (data.district !== undefined) {
              setDistrict(data.district);
            }
            if (data.postalCode !== undefined) {
              setPostalCode(data.postalCode);
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
  const lookupPostcode = async (postcode: string) => {
    if (!postcode || postcode.trim().length < 5) return;

    setIsLookingUpPostcode(true);
    try {
      const cleanPostcode = postcode.replace(/\s/g, '');
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;
        
        // Auto-fill address with the most relevant field
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
        
        // Use functional update to ensure we have the latest state
        setTown((currentTown) => {
          console.log('[EditProfileStep1] Looking up town, possibleTowns:', possibleTowns);
          console.log('[EditProfileStep1] Current town list length:', currentTown.list.length);
          console.log('[EditProfileStep1] Current town value:', currentTown.value);
          
          // Try to find a match in our town list
          let foundTown = false;
          let matchedTownItem = null;
          
          for (const possibleTown of possibleTowns) {
            if (!possibleTown) continue;
            
            const townItem = currentTown.list.find(t => 
              t.value.toLowerCase() === possibleTown.toLowerCase() ||
              possibleTown.toLowerCase().includes(t.value.toLowerCase()) ||
              t.value.toLowerCase().includes(possibleTown.toLowerCase())
            );
            
            if (townItem) {
              matchedTownItem = townItem;
              foundTown = true;
              console.log('[EditProfileStep1] Found matching town:', townItem.value);
              break;
            }
          }
          
          // If match found, return updated state with matched town
          if (foundTown && matchedTownItem) {
            console.log('[EditProfileStep1] Setting town to:', matchedTownItem.value);
            const newState = {
              ...currentTown,
              value: matchedTownItem.value,
              selectedList: [matchedTownItem],
            };
            console.log('[EditProfileStep1] New town state:', newState);
            return newState;
          }
          
          // If no match found, dynamically add the API town to the list
          if (!foundTown && possibleTowns.length > 0) {
            const apiTown = possibleTowns[0]; // Use the first available town from API
            const newTownId = String(currentTown.list.length + 1);
            const newTownItem = { _id: newTownId, value: apiTown };
            
            console.log('[EditProfileStep1] Adding new town to list:', apiTown);
            // Add to the list and set as selected
            const newState = {
              ...currentTown,
              list: [...currentTown.list, newTownItem],
              value: apiTown,
              selectedList: [newTownItem],
            };
            console.log('[EditProfileStep1] New town state with added town:', newState);
            return newState;
          }
          
          // If no towns found, return current state unchanged
          console.log('[EditProfileStep1] No town found, keeping current state');
          return currentTown;
        });
        
        // Auto-fill district/county
        const districtValue = result.admin_county || result.region || result.county || '';
        if (districtValue) {
          setDistrict(districtValue);
        }
        
        Alert.alert('Success', 'Address details auto-filled from postcode');
      } else {
        Alert.alert('', "We couldn't find your postal code. You may still proceed with this postal code.");
      }
    } catch (error) {
      console.error('Postcode lookup error:', error);
      Alert.alert('Error', 'Failed to lookup postcode. Please enter details manually.');
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  const handleNext = async () => {
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

    setIsLoading(true);
    try {
      // Save Step 1 data
      const step1Data = {
        profileImage: profileImage || undefined,
        avatar: avatar || undefined,
        businessName,
        businessAddress,
        town: town.value,
        country: country.value,
        district,
        postalCode,
      };

      await AsyncStorage.setItem('edit_profile_step1', JSON.stringify(step1Data));
      
      // Navigate to Step 2
      console.log('[EditProfileStep1] Navigating to EditProfileStep2');
      console.log('[EditProfileStep1] Navigation object:', navigation);
      try {
        navigation.navigate('EditProfileStep2' as never);
        console.log('[EditProfileStep1] Navigation to Step 2 successful');
      } catch (navError) {
        console.error('[EditProfileStep1] Navigation error:', navError);
        Alert.alert('Navigation Error', 'Unable to navigate to next step. Please try again.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isIOS = Platform.OS === 'ios';

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

  // Memoize handlers to prevent unnecessary re-renders
  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleBackPress = useCallback(() => {
    safeGoBack(navigation as any, 'Profile');
  }, [navigation]);

  const Content = (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
          <VectorBackButton onPress={handleBackPress} />
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentInsetAdjustmentBehavior="automatic"
          decelerationRate="normal"
          bounces={true}
          scrollEventThrottle={16}
          overScrollMode="never"
          nestedScrollEnabled={true}
        >
          {/* Profile Image / Avatar Selector */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handleAddAvatar} style={styles.imagePickerButton}>
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
            </TouchableOpacity>
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity style={styles.selectImageButton} onPress={selectProfileImage}>
                <Text style={styles.selectImageText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Form */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputWrapper}>
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

            {/* Postal Code with Lookup */}
            <View style={styles.inputWrapper}>
              <View style={styles.postalCodeContainer}>
                <PaperTextInput
                  label="Postal Code"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="default"
                  autoCapitalize="characters"
                  mode="outlined"
                  outlineColor={customTheme.colors.dark}
                  placeholderTextColor={customTheme.colors.dark}
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
                          style={styles.searchIconTouchable}
                        >
                          {isLookingUpPostcode ? (
                            <ActivityIndicator size="small" color="#7BA21B" />
                          ) : (
                            <Ionicons name="search" size={20} color="#7BA21B" />
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

            {/* Business Address */}
            <View ref={businessAddressInputContainerRef} style={styles.inputWrapper}>
              <CustomInput
                placeholder="Business Address"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                returnKeyType="next"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                }}
                onFocus={() => {
                  // Scroll to ensure the input is visible above keyboard
                  setTimeout(() => {
                    if (businessAddressInputContainerRef.current && scrollViewRef.current) {
                      businessAddressInputContainerRef.current.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                          // Scroll to show input with padding above
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, y - 100),
                            animated: true,
                          });
                        },
                        () => {
                          // Fallback: scroll to end
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }
                      );
                    } else if (scrollViewRef.current) {
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                  }, 300);
                }}
              />
            </View>

            {/* Town / City Dropdown */}
            <View style={styles.inputWrapper}>
              <MultiSelect
                key={`town-${town.list.length}-${town.value}`}
                label="Town / City"
                value={town.value}
                onSelection={(value) =>
                  setTown((prevTown) => ({
                    ...prevTown,
                    value: value.text,
                    selectedList: value.selectedList,
                  }))
                }
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
            <View ref={districtInputContainerRef} style={styles.inputWrapper}>
              <CustomInput
                placeholder="District/County/State"
                value={district}
                onChangeText={setDistrict}
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                }}
                onFocus={() => {
                  // Scroll to ensure the input is visible above keyboard
                  setTimeout(() => {
                    if (districtInputContainerRef.current && scrollViewRef.current) {
                      districtInputContainerRef.current.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                          // Scroll to show input with padding above
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, y - 100),
                            animated: true,
                          });
                        },
                        () => {
                          // Fallback: scroll to end
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }
                      );
                    } else if (scrollViewRef.current) {
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                  }, 300);
                }}
              />
            </View>
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
    marginVertical: 20,
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
  imageButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
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
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
});

