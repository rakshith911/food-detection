import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView,
  Image,
  Dimensions 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addAnalysis } from '../store/slices/historySlice';
import { mockFoodDetectionService } from '../services/MockFoodDetection';

const { width } = Dimensions.get('window');

export default function ImageTextTab() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        Alert.alert('Success', 'Image selected successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image from gallery');
      console.error('Gallery error:', error);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
        });
        if (photo) {
          setSelectedImage(photo.uri);
          setUseCamera(false);
          Alert.alert('Success', 'Photo taken successfully!');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
        console.error('Camera error:', error);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const analyzeImageText = async () => {
    if (selectedImage && textInput.trim()) {
      const analysisResult = mockFoodDetectionService.analyzeFood(textInput, 'image');
      const result = mockFoodDetectionService.formatAnalysisResult(analysisResult);
      
      setAnalysisResult(result);
      
      // Save to history
      if (user?.email) {
        const result_action = await dispatch(addAnalysis({
          userEmail: user.email,
          analysis: {
            type: 'image',
            imageUri: selectedImage,
            textDescription: textInput,
            analysisResult: result,
            nutritionalInfo: { 
              calories: analysisResult.totalCalories, 
              protein: analysisResult.totalProtein, 
              carbs: analysisResult.totalCarbs, 
              fat: analysisResult.totalFat 
            },
          },
        }));
        
        if (addAnalysis.fulfilled.match(result_action)) {
          Alert.alert('Analysis Complete', 'Image and text analysis completed and saved to history!');
        } else {
          Alert.alert('Warning', 'Analysis completed but failed to save to history. Please try again.');
        }
      }
    } else if (selectedImage) {
      const analysisResult = mockFoodDetectionService.analyzeFood(undefined, 'image');
      const result = mockFoodDetectionService.formatAnalysisResult(analysisResult);
      
      setAnalysisResult(result);
      
      // Save to history
      if (user?.email) {
        await dispatch(addAnalysis({
          userEmail: user.email,
          analysis: {
            type: 'image',
            imageUri: selectedImage,
            textDescription: textInput || undefined,
            analysisResult: result,
            nutritionalInfo: { 
              calories: analysisResult.totalCalories, 
              protein: analysisResult.totalProtein, 
              carbs: analysisResult.totalCarbs, 
              fat: analysisResult.totalFat 
            },
          },
        }));
      }
      
      Alert.alert('Analysis Complete', 'Image analysis completed and saved to history! Add text for better results.');
    } else if (textInput.trim()) {
      Alert.alert('Add Image', 'Please select or take a photo for complete analysis.');
    } else {
      Alert.alert('Add Content', 'Please add both image and text for comprehensive analysis.');
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setTextInput('');
    setAnalysisResult(null);
    setUseCamera(false);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Text style={styles.title}>📸 Image Analysis</Text>
        
        {selectedImage ? (
          <View style={styles.imageDisplayContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity 
              style={styles.changeImageButton} 
              onPress={clearAll}
            >
              <Text style={styles.buttonText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : useCamera ? (
          <View style={styles.cameraContainer}>
            <CameraView 
              ref={cameraRef}
              style={styles.camera} 
              facing={facing}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={styles.flipButton} 
                  onPress={toggleCameraFacing}
                >
                  <Text style={styles.buttonText}>Flip</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={takePhoto}
                >
                  <Text style={styles.buttonText}>📷</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setUseCamera(false)}
                >
                  <Text style={styles.buttonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No image selected</Text>
            <View style={styles.imageButtons}>
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={() => setUseCamera(true)}
              >
                <Text style={styles.buttonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.galleryButton} 
                onPress={pickImageFromGallery}
              >
                <Text style={styles.buttonText}>📁 Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Text Input Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.title}>📝 Additional Description (Optional)</Text>
        <Text style={styles.subtitle}>Add text to enhance image analysis</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Include additional details if you would like to (Optional)"
          value={textInput}
          onChangeText={setTextInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Analysis Section */}
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>🔍 Analysis</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAll}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={analyzeImageText}
        >
          <Text style={styles.buttonText}>🔍 Analyze Image + Text</Text>
        </TouchableOpacity>
        
        {analysisResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{analysisResult}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  imageContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  imageDisplayContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: width - 80,
    height: (width - 80) * 0.75,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  changeImageButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  placeholderText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 24,
    fontWeight: '500',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  galleryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
    minHeight: 100,
    fontFamily: 'System',
    lineHeight: 22,
  },
  analysisContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resultBox: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    fontFamily: 'System',
  },
  cameraContainer: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginVertical: 8,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 24,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  captureButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(239,68,68,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 16,
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
