import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { AnalysisEntry, DishContent } from '../store/slices/historySlice';
import { updateAnalysis } from '../store/slices/historySlice';
import VectorBackButtonCircle from '../components/VectorBackButtonCircle';
import OptimizedImage from '../components/OptimizedImage';
import AppHeader from '../components/AppHeader';
import BottomButtonContainer from '../components/BottomButtonContainer';

export default function MealDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const item = (route.params as any)?.item as AnalysisEntry;
  const user = useAppSelector((state) => state.auth.user);
  const businessProfile = useAppSelector((state) => state.profile.businessProfile);
  const dispatch = useAppDispatch();

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<Video>(null);
  const screenSwipePosition = useRef(new Animated.Value(0)); // For screen-level swipe right gesture

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

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <AppHeader
          displayName={displayName}
          lastLoginDate={lastLoginDate}
          lastLoginTime={lastLoginTime}
          onProfilePress={() => navigation.navigate('Profile')}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No meal data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize state from item data if it exists, otherwise use defaults
  const [dishContents, setDishContents] = useState<DishContent[]>(
    item?.dishContents && item.dishContents.length > 0
      ? item.dishContents
      : [
          { id: '1', name: 'Bread', weight: '250', calories: '100' },
          { id: '2', name: 'Chicken', weight: '150', calories: '400' },
          { id: '3', name: 'Bread', weight: '250', calories: '100' },
        ]
  );
  const [mealName, setMealName] = useState(item?.mealName || 'Burger');
  // Use the total calories from the API's nutritionalInfo
  const totalCalories = item?.nutritionalInfo?.calories || 0;
  
  // Track which input is currently focused
  const focusedInputRef = useRef<{ rowId: string; field: string } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const tableContainerRef = useRef<View>(null);
  // Refs for input fields to enable "next" button navigation
  const inputRefs = useRef<{ [rowId: string]: { name?: TextInput; weight?: TextInput; calories?: TextInput } }>({});

  // Format capture date and time from item.timestamp (same approach as login time)
  const captureDate = item?.timestamp 
    ? (() => {
        try {
          // Try parsing the timestamp - handle ISO strings, locale strings, and numbers
          let date: Date;
          if (typeof item.timestamp === 'string') {
            // Try ISO string first (standard format)
            date = new Date(item.timestamp);
            // If that fails, try parsing as number (timestamp in milliseconds)
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

  // Handle keyboard show to scroll to input
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Scroll to input when keyboard appears, but not too aggressively
        setTimeout(() => {
          if (tableContainerRef.current && scrollViewRef.current) {
            tableContainerRef.current.measureLayout(
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

  // Save changes to Redux store and backend
  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (!item?.id || !user?.email) {
      console.warn('[MealDetail] Cannot save: missing item.id or user.email', { 
        hasItemId: !!item?.id, 
        hasUserEmail: !!user?.email 
      });
      return false;
    }

    try {
      setIsSaving(true);
      // Include full item data in updates to ensure entry can be recreated if missing
      const updates = {
        ...item, // Include all existing item data
        mealName,
        dishContents,
        nutritionalInfo: {
          ...item.nutritionalInfo,
          calories: totalCalories,
        },
      };
      
      console.log('[MealDetail] Saving changes for analysis:', item.id);
      
      await dispatch(updateAnalysis({
        userEmail: user.email,
        analysisId: item.id,
        updates,
      })).unwrap();
      
      console.log('[MealDetail] Changes saved successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[MealDetail] Failed to save changes:', errorMessage, error);
      Alert.alert('Save Failed', 'Failed to save changes. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [item, user?.email, mealName, dishContents, totalCalories, dispatch]);

  // Reset scroll position when returning to this screen
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      return () => {};
    }, [])
  );

  const handleInputFocus = (rowId: string, field: string) => {
    focusedInputRef.current = { rowId, field };
  };

  const handleInputBlur = (rowId: string) => {
    // Exit edit mode only when clicking truly outside (handled by delay)
    // This allows switching between inputs in the same row
    setTimeout(() => {
      if (focusedInputRef.current?.rowId !== rowId) {
        setEditingRowId(null);
        focusedInputRef.current = null;
      }
    }, 300);
  };

  const handleEdit = (rowId: string) => {
    setEditingRowId(rowId);
  };

  const handleDelete = (rowId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = dishContents.filter(item => item.id !== rowId);
            setDishContents(updated);
            setEditingRowId(null);
          },
        },
      ]
    );
  };

  const handleUpdateRow = (rowId: string, field: 'name' | 'weight' | 'calories', value: string) => {
    setDishContents(prev =>
      prev.map(item => {
        if (item.id === rowId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleAddContent = () => {
    const newId = Date.now().toString();
    setDishContents(prev => [
      { id: newId, name: '', weight: '', calories: '' },
      ...prev,
    ]);
    setEditingRowId(newId);
  };

  // Handle swipe right to navigate to TutorialScreen
  const handleSwipeRight = () => {
    console.log('[MealDetail] Swipe right detected, navigating to Tutorial');
    try {
      navigation.navigate('Tutorial');
    } catch (error) {
      console.error('[MealDetail] Error navigating to Tutorial:', error);
    }
  };

  const isVideo = !!item.videoUri;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <PanGestureHandler
        onGestureEvent={Animated.event(
          [{ nativeEvent: { translationX: screenSwipePosition.current } }],
          { useNativeDriver: true }
        )}
        onHandlerStateChange={(event) => {
          const { state, translationX } = event.nativeEvent;

          if (state === State.END) {
            // Trigger on right swipe (positive translationX)
            if (translationX > 80) {
              console.log('[MealDetail] Right swipe detected, navigating to Tutorial');
              handleSwipeRight();
            }
            screenSwipePosition.current.setValue(0);
          }

          if (state === State.CANCELLED || state === State.FAILED) {
            screenSwipePosition.current.setValue(0);
          }
        }}
        activeOffsetX={20}
        failOffsetX={-10}
        failOffsetY={[-10, 10]}
      >
        <Animated.View style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1 }}>
          <AppHeader
            displayName={displayName}
            lastLoginDate={lastLoginDate}
            lastLoginTime={lastLoginTime}
            onProfilePress={() => {
              try {
                navigation.navigate('Profile');
              } catch (error) {
                console.error('[MealDetail] Error navigating to Profile:', error);
              }
            }}
          />

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            decelerationRate="normal"
            bounces={true}
            scrollEventThrottle={16}
            overScrollMode="never"
            nestedScrollEnabled={true}
            contentInsetAdjustmentBehavior="automatic"
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
              <VectorBackButtonCircle
                onPress={() => navigation.goBack()}
                size={24}
              />
            </View>
          </View>
        </View>

        {/* Meal Info */}
        <View style={styles.mealInfo}>
        <View style={styles.mealHeader}>
          <View style={{ flex: 1 }}>
            {editingMealName ? (
              <TextInput
                style={[styles.mealNameInput, styles.inputFocused]}
                value={mealName}
                onChangeText={setMealName}
                onBlur={() => setEditingMealName(false)}
                placeholder="Meal name"
                placeholderTextColor="#D1D5DB"
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingMealName(true)}>
                <Text style={styles.mealName}>{mealName}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.mealCalories}>{totalCalories} Kcal</Text>
          </View>

          <View style={styles.mealActions}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddContent}>
              <Text style={styles.addButtonText}>+ Add Content</Text>
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

        {/* Dish Contents Table */}
        <Pressable 
          ref={tableContainerRef}
          style={styles.tableContainer}
          onPress={() => {
            if (editingRowId) {
              setEditingRowId(null);
              focusedInputRef.current = null;
            }
          }}
        >
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Dish Contents</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Kcal</Text>
            <Text style={[styles.tableHeaderText, { width: 50 }]}>Action</Text>
          </View>

          {/* Table Rows */}
          {dishContents.map((row) => {
            const isEditing = editingRowId === row.id;
            return (
              <View key={row.id} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]} pointerEvents="box-none">
                  {isEditing ? (
                    <TextInput
                      ref={(ref) => {
                        if (!inputRefs.current[row.id]) {
                          inputRefs.current[row.id] = {};
                        }
                        inputRefs.current[row.id].name = ref || undefined;
                      }}
                      style={[styles.tableInput, styles.inputFocused]}
                      value={row.name}
                      onChangeText={(value) => handleUpdateRow(row.id, 'name', value)}
                      onFocus={() => {
                        handleInputFocus(row.id, 'name');
                        // Scroll to input when focused, but not too aggressively
                        setTimeout(() => {
                          if (tableContainerRef.current && scrollViewRef.current) {
                            tableContainerRef.current.measureLayout(
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
                      placeholder="Item name"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="default"
                      editable={true}
                      blurOnSubmit={false}
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        // Focus the weight input when "next" is pressed
                        setTimeout(() => {
                          inputRefs.current[row.id]?.weight?.focus();
                        }, 100);
                      }}
                      pointerEvents="auto"
                    />
                  ) : (
                    <Text style={styles.tableCellText}>{row.name || '—'}</Text>
                  )}
                </View>
                <View style={[styles.tableCell, { flex: 1 }]} pointerEvents="box-none">
                  {isEditing ? (
                    <TextInput
                      ref={(ref) => {
                        if (!inputRefs.current[row.id]) {
                          inputRefs.current[row.id] = {};
                        }
                        inputRefs.current[row.id].weight = ref || undefined;
                      }}
                      style={[styles.tableInput, styles.inputFocused]}
                      value={row.weight}
                      onChangeText={(value) => handleUpdateRow(row.id, 'weight', value)}
                      onFocus={() => handleInputFocus(row.id, 'weight')}
                      onSubmitEditing={() => {
                        // Focus the calories input when "next" is pressed
                        setTimeout(() => {
                          inputRefs.current[row.id]?.calories?.focus();
                        }, 100);
                      }}
                      placeholder="Weight"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="numeric"
                      editable={true}
                      blurOnSubmit={false}
                      returnKeyType="next"
                      pointerEvents="auto"
                    />
                  ) : (
                    <Text style={styles.tableCellText}>{row.weight ? `${row.weight} g` : '—'}</Text>
                  )}
                </View>
                <View style={[styles.tableCell, { flex: 1 }]} pointerEvents="box-none">
                  {isEditing ? (
                    <TextInput
                      ref={(ref) => {
                        if (!inputRefs.current[row.id]) {
                          inputRefs.current[row.id] = {};
                        }
                        inputRefs.current[row.id].calories = ref || undefined;
                      }}
                      style={[styles.tableInput, styles.inputFocused]}
                      value={row.calories}
                      onChangeText={(value) => handleUpdateRow(row.id, 'calories', value)}
                      onFocus={() => handleInputFocus(row.id, 'calories')}
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                        setEditingRowId(null);
                        focusedInputRef.current = null;
                      }}
                      placeholder="Calories"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="numeric"
                      editable={true}
                      blurOnSubmit={true}
                      returnKeyType="done"
                      pointerEvents="auto"
                    />
                  ) : (
                    <Text style={styles.tableCellText}>{row.calories || '—'}</Text>
                  )}
                </View>
                <View style={[styles.tableCell, { width: 50, alignItems: 'center' }]}>
                  <TouchableOpacity
                    onPress={() => {
                      if (isEditing) {
                        handleDelete(row.id);
                      } else {
                        handleEdit(row.id);
                      }
                    }}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name={isEditing ? 'trash' : 'pencil'}
                      size={20}
                      color="#7BA21B"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Pressable>
      </ScrollView>

      {/* Next Button - Fixed at Bottom */}
      <BottomButtonContainer>
        <TouchableOpacity
          style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
          onPress={async () => {
            if (isSaving) return; // Prevent multiple clicks while saving
            
            setEditingRowId(null);
            Keyboard.dismiss();
            
            // Save changes before navigating
            const saved = await saveChanges();
            
            if (saved) {
              // Update item with latest changes for navigation
              const updatedItem = {
                ...item,
                mealName,
                dishContents,
                nutritionalInfo: {
                  ...item.nutritionalInfo,
                  calories: totalCalories,
                },
              };
              (navigation as any).navigate('Feedback', { item: updatedItem });
            }
          }}
          disabled={isSaving}
        >
          <Text style={styles.nextButtonText}>
            {isSaving ? 'Saving...' : 'Next'}
          </Text>
        </TouchableOpacity>
      </BottomButtonContainer>
        </View>
      </TouchableWithoutFeedback>
        </Animated.View>
      </PanGestureHandler>
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
    paddingBottom: 20,
  },
  mediaContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000000',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#111827',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  backButtonBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  mealNameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#7BA21B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
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
  captureLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  captureValue: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#1F2937',
  },
  tableInput: {
    height: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#7BA21B',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    height: 56, // Fixed height
    width: '100%', // Fixed width
    backgroundColor: '#7BA21B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

