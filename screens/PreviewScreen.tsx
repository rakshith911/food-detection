import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  useWindowDimensions,
  Dimensions,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addAnalysis } from '../store/slices/historySlice';
import { mockFoodDetectionService } from '../services/MockFoodDetection';
import { nutritionAnalysisAPI } from '../services/NutritionAnalysisAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import OptimizedImage from '../components/OptimizedImage';
import VectorBackButtonCircle from '../components/VectorBackButtonCircle';
import AppHeader from '../components/AppHeader';
import BottomButtonContainer from '../components/BottomButtonContainer';

interface PreviewScreenProps {
  imageUri?: string;
  videoUri?: string;
  onBack: () => void;
  onAnalyze?: () => void;
}

export default function PreviewScreen({ imageUri, videoUri, onBack, onAnalyze }: PreviewScreenProps) {
  const { width, height } = useWindowDimensions();
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const businessProfile = useAppSelector((state) => state.profile.businessProfile);
  const navigation = useNavigation();
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputContainerRef = useRef<View>(null);

  // Handle keyboard show to scroll to input
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Scroll to input when keyboard appears, but not too aggressively
        setTimeout(() => {
          if (inputContainerRef.current && scrollViewRef.current) {
            inputContainerRef.current.measureLayout(
              scrollViewRef.current as any,
              (x, y) => {
                // Only scroll if input is below the visible area
                scrollViewRef.current?.scrollTo({
                  y: Math.max(0, y - 50), // Small offset, not too much
                  animated: true,
                });
              },
              () => {
                // Fallback: minimal scroll
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }
            );
          }
        }, 200);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);
  
  // Use business name as display name, fallback to email if business name not available
  // Only use businessName if it exists and is not empty
  const userName = (businessProfile?.businessName && businessProfile.businessName.trim()) 
    ? businessProfile.businessName 
    : (user?.email?.split('@')[0] || 'User');
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Get current date for last login (mock)
  const lastLoginDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const lastLoginTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const analysisType = imageUri ? 'image' : 'video';
      let analysisResult;
      let result;

      // Use real API for both video and image analysis
      if (videoUri || imageUri) {
        const mediaType = videoUri ? 'video' : 'image';
        console.log(`[PreviewScreen] Starting real ${mediaType} analysis...`);
        setShowProgressModal(true);
        setProgressStatus(`Preparing ${mediaType}...`);

        const filename = videoUri
          ? `video_${Date.now()}.mp4`
          : `image_${Date.now()}.jpg`;

        const apiResult = videoUri
          ? await nutritionAnalysisAPI.analyzeVideo(
              videoUri,
              filename,
              (status) => {
                console.log('[PreviewScreen] Progress:', status);
                setProgressStatus(status);
              }
            )
          : await nutritionAnalysisAPI.analyzeImage(
              imageUri!,
              filename,
              (status) => {
                console.log('[PreviewScreen] Progress:', status);
                setProgressStatus(status);
              }
            );

        setShowProgressModal(false);

        if (!apiResult || !apiResult.nutrition_summary) {
          // If image analysis failed, fall back to mock service
          if (imageUri) {
            console.warn('[PreviewScreen] Image API failed, falling back to mock service');
            const mockResult = mockFoodDetectionService.analyzeFood(
              textInput.trim() || undefined,
              analysisType
            );
            result = mockFoodDetectionService.formatAnalysisResult(mockResult);

            // Convert mock result to the same format as API result
            analysisResult = {
              totalCalories: mockResult.totalCalories,
              totalProtein: mockResult.totalProtein,
              totalCarbs: mockResult.totalCarbs,
              totalFat: mockResult.totalFat,
              dishContents: mockResult.detectedFoods.map((food, index) => ({
                id: `${Date.now()}_${index}`,
                name: food.name,
                weight: food.portion || '',
                calories: food.calories.toString(),
              })),
              mealName: mockResult.detectedFoods[0]?.name || 'Analyzed Meal',
            };
          } else {
            throw new Error(`${mediaType} analysis failed or returned no results`);
          }
        } else {
          console.log('[PreviewScreen] API Result:', apiResult.nutrition_summary);

          // Convert API result to app format
          let dishContents;
          let mealName = 'Analyzed Meal';

          // Use detailed results if available
          if (apiResult.detailed_results?.items && apiResult.detailed_results.items.length > 0) {
            console.log('[PreviewScreen] Using detailed item results');
            dishContents = apiResult.detailed_results.items.map((item: any, index: number) => ({
              id: `${Date.now()}_${index}`,
              name: item.food_name || 'Unknown Food',
              weight: item.mass_g ? Math.round(item.mass_g).toString() : '',
              calories: Math.round(item.calories || 0).toString(),
            }));
            mealName = apiResult.detailed_results.items[0]?.food_name || 'Analyzed Meal';
          } else {
            // Fallback: Create items based on num_food_items with distributed calories
            const itemCount = apiResult.nutrition_summary.num_food_items || 1;
            const avgCalories = Math.round(apiResult.nutrition_summary.total_calories_kcal / itemCount);

            console.log(`[PreviewScreen] Creating ${itemCount} food items from summary (avg ${avgCalories} kcal each)`);

            dishContents = Array.from({ length: itemCount }, (_, index) => ({
              id: `${Date.now()}_${index}`,
              name: itemCount === 1 ? 'Detected Food' : `Food Item ${index + 1}`,
              weight: '',
              calories: avgCalories.toString(),
            }));

            mealName = itemCount === 1 ? 'Detected Food' : `Meal (${itemCount} items)`;
          }

          analysisResult = {
            totalCalories: apiResult.nutrition_summary.total_calories_kcal,
            totalProtein: 0, // Not available in current API response
            totalCarbs: 0, // Not available in current API response
            totalFat: 0, // Not available in current API response
            dishContents,
            mealName,
          };

          result = {
            summary: `Detected ${apiResult.nutrition_summary.num_food_items} food items with ${Math.round(apiResult.nutrition_summary.total_calories_kcal)} calories`,
            nutrition_summary: apiResult.nutrition_summary,
            detailed_results: apiResult.detailed_results,
          };
        }
      } else {
        throw new Error('No image or video URI provided');
      }

      if (user?.email) {
        const result_action = await dispatch(addAnalysis({
          userEmail: user.email,
          analysis: {
            type: analysisType,
            imageUri: imageUri || undefined,
            videoUri: videoUri || undefined,
            textDescription: textInput.trim() || undefined,
            analysisResult: JSON.parse(JSON.stringify(result)),
            dishContents: analysisResult.dishContents,
            mealName: analysisResult.mealName,
            nutritionalInfo: {
              calories: Number(analysisResult.totalCalories) || 0,
              protein: Number(analysisResult.totalProtein) || 0,
              carbs: Number(analysisResult.totalCarbs) || 0,
              fat: Number(analysisResult.totalFat) || 0,
            },
          },
        }));

        if (addAnalysis.rejected.match(result_action)) {
          console.error('Error saving analysis:', result_action.error);
          return;
        }
      }

      // Update streak
      try {
        const savedStreak = await AsyncStorage.getItem('streakDays');
        const currentStreak = savedStreak ? parseInt(savedStreak, 10) : 0;
        await AsyncStorage.setItem('streakDays', (currentStreak + 1).toString());
      } catch (error) {
        console.error('Error saving streak:', error);
      }

      // Navigate back after successful submission
      if (onAnalyze) {
        onAnalyze();
      }
      // Call onBack safely
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      setShowProgressModal(false);
      // Show error alert but don't prevent navigation for now (fallback to mock)
      const analysisType = imageUri ? 'image' : 'video';
      const analysisResult = mockFoodDetectionService.analyzeFood(
        textInput.trim() || undefined,
        analysisType
      );
      const result = mockFoodDetectionService.formatAnalysisResult(analysisResult);

      if (user?.email) {
        await dispatch(addAnalysis({
          userEmail: user.email,
          analysis: {
            type: analysisType,
            imageUri: imageUri || undefined,
            videoUri: videoUri || undefined,
            textDescription: textInput.trim() || undefined,
            analysisResult: JSON.parse(JSON.stringify(result)),
            nutritionalInfo: {
              calories: Number(analysisResult.totalCalories) || 0,
              protein: Number(analysisResult.totalProtein) || 0,
              carbs: Number(analysisResult.totalCarbs) || 0,
              fat: Number(analysisResult.totalFat) || 0,
            },
          },
        }));
      }

      if (onAnalyze) onAnalyze();
      if (onBack) onBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1 }}>
          <AppHeader
            displayName={displayName}
            lastLoginDate={lastLoginDate}
            lastLoginTime={lastLoginTime}
            onProfilePress={() => navigation.navigate('Profile' as never)}
          />

          {/* Main Content */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
            bounces={true}
            scrollEventThrottle={16}
            overScrollMode="never"
            nestedScrollEnabled={true}
          >
            {/* Preview with Dark Overlay */}
            <View style={styles.previewContainer}>
              {imageUri ? (
                <OptimizedImage 
                  source={{ uri: imageUri }} 
                  style={styles.previewMedia} 
                  resizeMode="cover"
                  cachePolicy="memory-disk"
                  priority="high"
                />
              ) : videoUri ? (
                <Video
                  source={{ uri: videoUri }}
                  style={styles.previewMedia}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                />
              ) : null}
              
              {/* Dark Overlay */}
              <View style={styles.darkOverlay} />
              
              {/* Back Button - Top Left */}
              <View style={styles.backButtonContainer}>
                <View style={styles.backButtonBackground}>
                  <VectorBackButtonCircle onPress={onBack} size={24} />
                </View>
              </View>
              
              {/* Play Icon - Center (only for videos) */}
              {videoUri && (
                <TouchableOpacity 
                  style={styles.playButton} 
                  onPress={() => {
                    // Handle play action if needed
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.playIconCircle}>
                    <Ionicons name="play" size={40} color="#1F2937" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Text Input Field */}
            <View ref={inputContainerRef} style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder="You may provide additional details such as dish name, menu description, recipe, etc. (Optional)"
                value={textInput}
                onChangeText={setTextInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999999"
                onFocus={() => {
                  // Scroll to input when focused, but not too aggressively
                  setTimeout(() => {
                    if (inputContainerRef.current && scrollViewRef.current) {
                      inputContainerRef.current.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                          // Only scroll if input is below the visible area
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, y - 50), // Small offset, not too much
                            animated: true,
                          });
                        },
                        () => {
                          // Fallback: minimal scroll
                          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                        }
                      );
                    }
                  }, 200);
                }}
              />
            </View>

          </ScrollView>

          {/* Submit Button - Fixed at Bottom */}
          <BottomButtonContainer paddingHorizontal={0}>
            <View style={{ paddingHorizontal: 10 }}>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Analyzing...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </BottomButtonContainer>
        </View>
      </TouchableWithoutFeedback>

      {/* Progress Modal */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="analytics" size={48} color="#7BA21B" />
            <Text style={styles.modalTitle}>Analyzing Video</Text>
            <Text style={styles.modalStatus}>{progressStatus}</Text>
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
              <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  previewContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.45,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  backButtonBackground: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 10,
  },
  playIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    marginHorizontal: 10,
    marginTop: 20,
    marginBottom: 20,
    minHeight: 150,
  },
  textInput: {
    borderWidth: 3,
    borderColor: '#EDF5DE',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 150,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 56, // Fixed height
    width: '100%', // Fixed width
    backgroundColor: '#7BA21B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#7BA21B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  modalStatus: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7BA21B',
  },
});

