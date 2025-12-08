import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Keyboard,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { AnalysisEntry } from '../store/slices/historySlice';
import { updateAnalysis } from '../store/slices/historySlice';
import { feedbackAPI } from '../services/FeedbackAPI';
import OptimizedImage from '../components/OptimizedImage';
import VectorBackButtonCircle from '../components/VectorBackButtonCircle';
import AppHeader from '../components/AppHeader';
import BottomButtonContainer from '../components/BottomButtonContainer';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={24}
            color={star <= rating ? '#7BA21B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function FeedbackScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAppSelector((state) => state.auth.user);
  const businessProfile = useAppSelector((state) => state.profile.businessProfile);
  const dispatch = useAppDispatch();
  const item = (route.params as any)?.item as AnalysisEntry;

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  // Initialize state from existing feedback if available
  const [ratings, setRatings] = useState(
    item?.feedback?.ratings || {
      foodDishIdentification: 3,
      dishContentsIdentification: 3,
      massEstimation: 3,
      calorieEstimation: 3,
      overall: 3,
    }
  );
  const [comment, setComment] = useState(item?.feedback?.comment || '');
  const [isSaving, setIsSaving] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentContainerRef = useRef<View>(null);

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyState}>
          <VectorBackButtonCircle size={24} onPress={() => navigation.goBack()} />
          <Text>No meal data available</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  // Format capture date and time from item.timestamp
  const captureDate = item?.timestamp
    ? (() => {
        try {
          let date: Date;
          if (typeof item.timestamp === 'string') {
            date = new Date(item.timestamp);
            if (isNaN(date.getTime())) {
              const numValue = Number(item.timestamp);
              if (!isNaN(numValue) && numValue > 0) {
                date = new Date(numValue);
              }
            }
          } else if (typeof item.timestamp === 'number') {
            date = new Date(item.timestamp);
          } else {
            return null;
          }

          if (isNaN(date.getTime())) {
            return null;
          }

          return date;
        } catch (error) {
          return null;
        }
      })()
    : null;

  const captureDateText = captureDate
    ? captureDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const captureTimeText = captureDate
    ? captureDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  useEffect(() => {
    const keyboardListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          if (commentContainerRef.current && scrollViewRef.current) {
            commentContainerRef.current.measureLayout(
              scrollViewRef.current as any,
              (x, y) => {
                scrollViewRef.current?.scrollTo({
                  y: Math.max(0, y - 50),
                  animated: true,
                });
              },
              () => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }
            );
          }
        }, 200);
      }
    );

    return () => keyboardListener.remove();
  }, []);

  const handleSave = async () => {
    if (!user?.email || !item?.id) {
      Alert.alert('Error', 'User not authenticated or item not found');
      return;
    }

    setIsSaving(true);
    try {
      const feedback = {
        ratings,
        comment: comment.trim(),
        timestamp: new Date().toISOString(),
      };

      // Save feedback to the analysis entry via Redux
      await dispatch(updateAnalysis({
        userEmail: user.email,
        analysisId: item.id,
        updates: {
          ...item,
          feedback,
        },
      })).unwrap();

      // Also save to AsyncStorage for backward compatibility
      await feedbackAPI.saveFeedback(user.email, {
        analysisId: item.id,
        ...feedback,
      });
      
      console.log('[Feedback] Feedback saved successfully');
      
      Alert.alert(
        'Success',
        'Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Results (cards page)
              (navigation as any).navigate('Results');
            },
          },
        ]
      );
    } catch (error) {
      console.error('[Feedback] Error saving feedback:', error);
      Alert.alert('Error', 'An error occurred while saving feedback. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isVideo = !!item.videoUri;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <AppHeader
        displayName={displayName}
        lastLoginDate={lastLoginDate}
        lastLoginTime={lastLoginTime}
        onProfilePress={() => navigation.navigate('Profile' as never)}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
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
          removeClippedSubviews={false}
          scrollEnabled={true}
        >
        {/* Media Preview */}
        <View style={styles.mediaContainer}>
          {isVideo && item.videoUri ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: item.videoUri }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isVideoPlaying}
                isLooping
                useNativeControls={isVideoPlaying}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && 'isPlaying' in status) {
                    setIsVideoPlaying(status.isPlaying);
                  }
                }}
              />
              {!isVideoPlaying && (
                <TouchableOpacity
                  style={styles.playButtonOverlay}
                  onPress={() => {
                    setIsVideoPlaying(true);
                    videoRef.current?.playAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={28} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </>
          ) : item.imageUri ? (
            <OptimizedImage
              source={{ uri: item.imageUri }}
              style={styles.media}
              resizeMode="cover"
              cachePolicy="memory-disk"
              priority="normal"
            />
          ) : (
            <View style={[styles.media, styles.placeholder]} />
          )}
          {/* Back Button Overlay */}
          <View style={styles.backButtonOverlay}>
            <View style={styles.backButtonBackground}>
              <VectorBackButtonCircle onPress={() => navigation.goBack()} size={24} />
            </View>
          </View>
        </View>

        {/* Meal Info */}
        <View style={styles.mealInfo}>
          <View style={styles.mealHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mealName}>{item.mealName || 'Burger'}</Text>
              <Text style={styles.mealCalories}>{item.nutritionalInfo.calories} Kcal</Text>
            </View>

            <View style={styles.mealActions}>
              <TouchableOpacity
                style={styles.writeCommentButton}
                onPress={() => {
                  // Scroll to comment input
                  setTimeout(() => {
                    if (commentContainerRef.current && scrollViewRef.current) {
                      commentContainerRef.current.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, y - 50),
                            animated: true,
                          });
                          // Focus the input after scrolling
                          setTimeout(() => {
                            commentInputRef.current?.focus();
                          }, 300);
                        },
                        () => {
                          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                        }
                      );
                    }
                  }, 100);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.writeCommentButtonText}>Write Comments</Text>
              </TouchableOpacity>
              <View style={styles.captureInfo}>
                <Text style={styles.captureValue}>
                  {captureDateText && captureTimeText
                    ? `${captureDateText}, ${captureTimeText}`
                    : 'Unavailable'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Your feedback is valuable to us!</Text>

          {/* Food dish identification */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Food dish identification</Text>
            <StarRating
              rating={ratings.foodDishIdentification}
              onRatingChange={(rating) =>
                setRatings((prev) => ({ ...prev, foodDishIdentification: rating }))
              }
            />
          </View>

          {/* Dish contents identification */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Dish contents identification</Text>
            <StarRating
              rating={ratings.dishContentsIdentification}
              onRatingChange={(rating) =>
                setRatings((prev) => ({ ...prev, dishContentsIdentification: rating }))
              }
            />
          </View>

          {/* Mass estimation */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Mass estimation</Text>
            <StarRating
              rating={ratings.massEstimation}
              onRatingChange={(rating) =>
                setRatings((prev) => ({ ...prev, massEstimation: rating }))
              }
            />
          </View>

          {/* Calorie estimation */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Calorie estimation</Text>
            <StarRating
              rating={ratings.calorieEstimation}
              onRatingChange={(rating) =>
                setRatings((prev) => ({ ...prev, calorieEstimation: rating }))
              }
            />
          </View>

          {/* Overall */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Overall</Text>
            <StarRating
              rating={ratings.overall}
              onRatingChange={(rating) =>
                setRatings((prev) => ({ ...prev, overall: rating }))
              }
            />
          </View>

          {/* Comment Section */}
          <View ref={commentContainerRef} style={styles.commentSection}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Anything you would like to tell us? (e.g., wrong item, portion too high, etc.)"
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => {
                  if (commentContainerRef.current && scrollViewRef.current) {
                    commentContainerRef.current.measureLayout(
                      scrollViewRef.current as any,
                      (x, y) => {
                        scrollViewRef.current?.scrollTo({
                          y: Math.max(0, y - 50),
                          animated: true,
                        });
                      },
                      () => {
                        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                      }
                    );
                  }
                }, 200);
              }}
            />
          </View>
        </View>
        </ScrollView>

        {/* Save Button - Fixed at Bottom */}
        <BottomButtonContainer>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </BottomButtonContainer>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 15,
  },
  mediaContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#D1D5DB',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  backButtonBackground: {
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 5,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  writeCommentButton: {
    backgroundColor: '#7BA21B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  writeCommentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mealActions: {
    alignItems: 'flex-end',
  },
  captureInfo: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  captureValue: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  feedbackSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  commentSection: {
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    height: 56, // Fixed height
    width: '100%', // Fixed width
    backgroundColor: '#7BA21B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

