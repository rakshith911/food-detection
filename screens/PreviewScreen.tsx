import React, { useState, useRef } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addAnalysis, updateAnalysis, updateAnalysisProgress } from '../store/slices/historySlice';
import { mockFoodDetectionService } from '../services/MockFoodDetection';
import { nutritionAnalysisAPI } from '../services/NutritionAnalysisAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import OptimizedImage from '../components/OptimizedImage';
import VectorBackButtonCircle from '../components/VectorBackButtonCircle';
import AppHeader from '../components/AppHeader';
import BottomButtonContainer from '../components/BottomButtonContainer';

async function scheduleAnalysisCompleteNotification(mealName: string) {
  const name = mealName?.trim();
  if (!name) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Analysis',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const body = name === 'Detected Food'
      ? 'Your analysis for food is ready'
      : `Your analysis for ${name} is ready`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'UKcal',
        body,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Preview] Notification failed:', e);
  }
}

interface PreviewScreenProps {
  imageUri?: string;
  videoUri?: string;
  onBack: () => void;
  onAnalyze?: () => void;
}

/** Renders video preview using expo-video (only mounted when uri is set so useVideoPlayer runs with a valid source). */
function PreviewVideo({ uri, style }: { uri: string; style: object }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false; // Stop at end; user taps play to start again
  });
  const playingPayload = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const isPlaying = playingPayload?.isPlaying ?? false;

  // When video ends, pause and reset to start so it stays stopped until user taps play
  useEventListener(player, 'playToEnd', () => {
    player.pause();
    player.replay(); // seek to start so next play starts from beginning
  });

  return (
    <>
      <VideoView
        player={player}
        style={style}
        contentFit="cover"
        nativeControls={false}
      />
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => {
          if (isPlaying) {
            player.pause();
          } else {
            player.play();
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.playIconCircle}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color="#1F2937" />
        </View>
      </TouchableOpacity>
    </>
  );
}

export default function PreviewScreen({ imageUri, videoUri, onBack, onAnalyze }: PreviewScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const businessProfile = useAppSelector((state) => state.profile.businessProfile);
  const navigation = useNavigation();
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);


  
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
    let analysisId: string | null = null;

    try {
      const analysisType: 'image' | 'video' = imageUri ? 'image' : 'video';
      let analysisResult;
      let result;

      // Create analysis entry immediately with "analyzing" status
      if (user?.email) {
        const tempAnalysis = {
          type: analysisType,
          imageUri: imageUri || undefined,
          videoUri: videoUri || undefined,
          textDescription: textInput.trim() || undefined,
          analysisResult: JSON.stringify({ summary: 'Analysis in progress...' }),
          nutritionalInfo: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
          analysisStatus: 'analyzing' as const,
          analysisProgress: 0,
        };

        const result_action = await dispatch(addAnalysis({
          userEmail: user.email,
          analysis: tempAnalysis,
        }));

        if (addAnalysis.fulfilled.match(result_action)) {
          analysisId = result_action.payload.id;
          setCurrentAnalysisId(analysisId);

          // Navigate to Results page immediately after creating the entry
          // Analysis will continue in background and update progress on the card via Redux
          // Use setTimeout to ensure navigation happens after Redux state update
          setTimeout(() => {
            if (onAnalyze) {
              onAnalyze();
            }
          }, 100);
        }
      }

      // Continue analysis in background - this will continue even after navigation
      // because Redux updates are global and async operations continue
      // Use real API for both video and image analysis
      if (videoUri || imageUri) {
        const mediaType = videoUri ? 'video' : 'image';
        console.log(`[PreviewScreen] Starting real ${mediaType} analysis...`);

        const filename = videoUri
          ? `video_${Date.now()}.mp4`
          : `image_${Date.now()}.jpg`;

        const updateProgress = (status: string) => {
          if (!analysisId) return;
          
          // Update progress based on status messages
          if (status.includes('Preparing')) {
            dispatch(updateAnalysisProgress({ id: analysisId, progress: 10, status: 'analyzing' }));
          } else if (status.includes('Uploading')) {
            dispatch(updateAnalysisProgress({ id: analysisId, progress: 30, status: 'analyzing' }));
          } else if (status.includes('Starting')) {
            dispatch(updateAnalysisProgress({ id: analysisId, progress: 40, status: 'analyzing' }));
          } else if (status.includes('Processing')) {
            // Incrementally increase progress during processing
            const match = status.match(/\((\d+)\/(\d+)\)/);
            if (match) {
              const current = parseInt(match[1], 10);
              const total = parseInt(match[2], 10);
              const processingProgress = 50 + Math.floor((current / total) * 40); // 50-90%
              dispatch(updateAnalysisProgress({ id: analysisId, progress: processingProgress, status: 'analyzing' }));
            } else {
              dispatch(updateAnalysisProgress({ id: analysisId, progress: 60, status: 'analyzing' }));
            }
          } else if (status.includes('complete') || status.includes('Complete')) {
            dispatch(updateAnalysisProgress({ id: analysisId, progress: 100, status: 'completed' }));
          }
        };

        const apiResult = videoUri
          ? await nutritionAnalysisAPI.analyzeVideo(
              videoUri,
              filename,
              (status) => {
                console.log('[PreviewScreen] Progress:', status);
                updateProgress(status);
              }
            )
          : await nutritionAnalysisAPI.analyzeImage(
              imageUri!,
              filename,
              (status) => {
                console.log('[PreviewScreen] Progress:', status);
                updateProgress(status);
              }
            );

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
          console.log('[PreviewScreen] API Result nutrition_summary:', apiResult.nutrition_summary);
          console.log('[PreviewScreen] API Result items:', apiResult.items);

          // Convert API result to app format
          let dishContents;
          let mealName = 'Analyzed Meal';

          // Use items array if available (extracted by API service)
          if (apiResult.items && apiResult.items.length > 0) {
            console.log('[PreviewScreen] Using extracted items:', apiResult.items.length, 'items');
            dishContents = apiResult.items.map((item: any, index: number) => ({
              id: `${Date.now()}_${index}`,
              name: item.food_name || 'Unknown Food',
              weight: item.mass_g ? Math.round(item.mass_g).toString() : '',
              calories: Math.round(item.total_calories || item.calories || 0).toString(),
            }));
            mealName = apiResult.items[0]?.food_name || 'Analyzed Meal';
          } 
          // Fallback: Use detailed_results.items if available
          else if (apiResult.detailed_results?.items && apiResult.detailed_results.items.length > 0) {
            console.log('[PreviewScreen] Using detailed_results.items');
            dishContents = apiResult.detailed_results.items.map((item: any, index: number) => ({
              id: `${Date.now()}_${index}`,
              name: item.food_name || 'Unknown Food',
              weight: item.mass_g ? Math.round(item.mass_g).toString() : '',
              calories: Math.round(item.total_calories || item.calories || 0).toString(),
            }));
            mealName = apiResult.detailed_results.items[0]?.food_name || 'Analyzed Meal';
          } 
          // Last fallback: Create items based on num_food_items with distributed calories
          else {
            const itemCount = apiResult.nutrition_summary?.num_food_items || 1;
            const totalCalories = apiResult.nutrition_summary?.total_calories_kcal || 0;
            const avgCalories = itemCount > 0 ? Math.round(totalCalories / itemCount) : 0;

            console.log(`[PreviewScreen] Creating ${itemCount} food items from summary (avg ${avgCalories} kcal each)`);

            dishContents = Array.from({ length: itemCount }, (_, index) => ({
              id: `${Date.now()}_${index}`,
              name: itemCount === 1 ? 'Detected Food' : `Food Item ${index + 1}`,
              weight: '',
              calories: avgCalories.toString(),
            }));

            mealName = itemCount === 1 ? 'Detected Food' : `Meal (${itemCount} items)`;
          }

          // Calculate total calories from items if nutrition_summary is incomplete
          const totalCaloriesFromItems = apiResult.items?.reduce(
            (sum: number, item: any) => sum + (item.total_calories || item.calories || 0), 0
          ) || apiResult.nutrition_summary?.total_calories_kcal || 0;

          analysisResult = {
            totalCalories: totalCaloriesFromItems,
            totalProtein: 0, // Not available in current API response
            totalCarbs: 0, // Not available in current API response
            totalFat: 0, // Not available in current API response
            dishContents,
            mealName,
          };

          const numItems = apiResult.items?.length || apiResult.nutrition_summary?.num_food_items || dishContents.length;

          result = {
            summary: `Detected ${numItems} food items with ${Math.round(totalCaloriesFromItems)} calories`,
            nutrition_summary: apiResult.nutrition_summary || { 
              total_calories_kcal: totalCaloriesFromItems,
              num_food_items: numItems,
              total_mass_g: 0,
              total_food_volume_ml: 0
            },
            detailed_results: apiResult.detailed_results,
            segmented_images: apiResult.segmented_images,
            job_id: apiResult.job_id,
          };
        }
      } else {
        throw new Error('No image or video URI provided');
      }

      // Update the analysis entry with final results
      if (user?.email && analysisId) {
        const result_action = await dispatch(updateAnalysis({
          userEmail: user.email,
          analysisId: analysisId,
          updates: {
            analysisResult: JSON.parse(JSON.stringify(result)),
            dishContents: analysisResult.dishContents,
            mealName: analysisResult.mealName,
            nutritionalInfo: {
              calories: Number(analysisResult.totalCalories) || 0,
              protein: Number(analysisResult.totalProtein) || 0,
              carbs: Number(analysisResult.totalCarbs) || 0,
              fat: Number(analysisResult.totalFat) || 0,
            },
            segmented_images: typeof result === 'object' && result?.segmented_images ? result.segmented_images : undefined,
            job_id: typeof result === 'object' && 'job_id' in result ? (result as any).job_id : undefined,
            analysisStatus: 'completed',
            analysisProgress: 100,
          },
        }));

        if (updateAnalysis.rejected.match(result_action)) {
          console.error('Error updating analysis:', result_action.error);
        } else {
          scheduleAnalysisCompleteNotification((analysisResult as any).mealName ?? '');
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

      // Note: Navigation already happened after creating the entry
      // Analysis continues in background and updates progress via Redux
    } catch (error) {
      console.error('Error analyzing:', error);
      
      // Mark analysis as failed if we have an ID
      if (analysisId && user?.email) {
        dispatch(updateAnalysisProgress({ id: analysisId, progress: 0, status: 'failed' }));
      }

      // Fallback to mock service
      const analysisType = imageUri ? 'image' : 'video';
      const analysisResult = mockFoodDetectionService.analyzeFood(
        textInput.trim() || undefined,
        analysisType
      );
      const result = mockFoodDetectionService.formatAnalysisResult(analysisResult);

      // If we have an analysis ID, update it; otherwise create new one
      if (user?.email) {
        if (analysisId) {
          await dispatch(updateAnalysis({
            userEmail: user.email,
            analysisId: analysisId,
            updates: {
              analysisResult: JSON.parse(JSON.stringify(result)),
              nutritionalInfo: {
                calories: Number(analysisResult.totalCalories) || 0,
                protein: Number(analysisResult.totalProtein) || 0,
                carbs: Number(analysisResult.totalCarbs) || 0,
                fat: Number(analysisResult.totalFat) || 0,
              },
analysisStatus: 'completed',
            analysisProgress: 100,
          },
        }));
          scheduleAnalysisCompleteNotification((analysisResult as any).mealName ?? '');
        } else {
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
              analysisStatus: 'completed',
              analysisProgress: 100,
            },
          }));
          scheduleAnalysisCompleteNotification((analysisResult as any).mealName ?? '');
        }
      }

      // Navigate to Results page even on error (fallback analysis was created)
      if (onAnalyze) {
        onAnalyze();
      }
    } finally {
      setIsSubmitting(false);
      setCurrentAnalysisId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={{ flex: 1 }}>
            <AppHeader
              displayName={displayName}
              lastLoginDate={lastLoginDate}
              lastLoginTime={lastLoginTime}
              onProfilePress={() => navigation.navigate('Profile' as never)}
            />

            {/* Main Content - only this area scrolls */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
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
                  <PreviewVideo uri={videoUri} style={styles.previewMedia} />
                ) : null}
                
                {/* Dark Overlay */}
                <View style={styles.darkOverlay} />
                
                {/* Back Button - Top Left */}
                <View style={styles.backButtonContainer}>
                  <View style={styles.backButtonBackground}>
                    <VectorBackButtonCircle onPress={onBack} size={24} />
                  </View>
                </View>
              </View>

              {/* Text Input Field */}
              <View style={styles.inputContainer}>
                <TextInput
                  ref={textInputRef}
                  style={[styles.textInput, isTextInputFocused && styles.textInputFocused]}
                  placeholder="You may provide additional details such as dish name, menu description, recipe, etc. (Optional)"
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#999999"
                  onFocus={() => {
                    setIsTextInputFocused(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                  onBlur={() => setIsTextInputFocused(false)}
                />
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>

      </KeyboardAvoidingView>

      {/* Submit Button - Fixed at Bottom, outside KAV so it doesn't float above keyboard */}
      <BottomButtonContainer paddingHorizontal={10}>
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
      </BottomButtonContainer>
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: '#4a4a4a',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 150,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  textInputFocused: {
    borderColor: '#7BA21B',
    borderWidth: 2,
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
});

