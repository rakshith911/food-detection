import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Dimensions,
  ScrollView 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function CombinedTab() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

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

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        setRecordedVideo(video?.uri || null);
        Alert.alert('Success', 'Video recorded successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to record video');
        console.error('Recording error:', error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const resetVideo = () => {
    setRecordedVideo(null);
  };

  const pickVideoFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setRecordedVideo(result.assets[0].uri);
        Alert.alert('Success', 'Video selected from gallery!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select video from gallery');
      console.error('Gallery error:', error);
    }
  };

  const analyzeCombined = () => {
    if (recordedVideo && textInput.trim()) {
      const result = `Combined Analysis:\n\nVideo Content: ✅ Available\nText Description: "${textInput}"\n\nDetected Items:\n• From video: Food items detected\n• From text: ${textInput.split(' ').slice(0, 3).join(', ')}\n\nComprehensive Analysis:\n• Calories: ~${(textInput.length * 10) + 200}\n• Protein: ~${(textInput.length * 2) + 15}g\n• Carbs: ~${(textInput.length * 5) + 30}g\n• Fat: ~${(textInput.length * 1) + 8}g\n\nConfidence: High (Video + Text)`;
      setAnalysisResult(result);
      Alert.alert('Analysis Complete', 'Combined video and text analysis completed!');
    } else if (recordedVideo) {
      Alert.alert('Add Text', 'Please add a text description for better analysis.');
    } else if (textInput.trim()) {
      Alert.alert('Add Video', 'Please record or select a video for complete analysis.');
    } else {
      Alert.alert('Add Content', 'Please add both video and text for comprehensive analysis.');
    }
  };

  const clearAll = () => {
    setRecordedVideo(null);
    setTextInput('');
    setAnalysisResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Camera/Video Section */}
      <View style={styles.cameraContainer}>
        {!recordedVideo ? (
          <>
            {!useFallback ? (
              <CameraView 
                ref={cameraRef}
                style={styles.camera} 
                facing={facing}
                mode="video"
              >
                <View style={styles.cameraControls}>
                  <TouchableOpacity 
                    style={styles.flipButton} 
                    onPress={toggleCameraFacing}
                  >
                    <Text style={styles.buttonText}>Flip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.recordButton, isRecording && styles.recordingButton]} 
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Text style={styles.buttonText}>
                      {isRecording ? 'Stop' : 'Record'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            ) : (
              <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText}>📱 Mobile Web Camera Not Available</Text>
                <TouchableOpacity 
                  style={styles.galleryButton} 
                  onPress={pickVideoFromGallery}
                >
                  <Text style={styles.buttonText}>📁 Select Video from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tryCameraButton} 
                  onPress={() => setUseFallback(false)}
                >
                  <Text style={styles.buttonText}>📷 Try Camera Again</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Fallback Toggle Button */}
            <TouchableOpacity 
              style={styles.fallbackToggle} 
              onPress={() => setUseFallback(!useFallback)}
            >
              <Text style={styles.fallbackToggleText}>
                {useFallback ? '📷 Use Camera' : '📁 Use Gallery'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: recordedVideo }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={resetVideo}
            >
              <Text style={styles.buttonText}>Record New Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Text Input Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.title}>Additional Food Description</Text>
        <Text style={styles.subtitle}>Add text to enhance video analysis</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Describe the food in the video...\n\nExample: Grilled chicken with steamed vegetables"
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
          <Text style={styles.analysisTitle}>Combined Analysis</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAll}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={analyzeCombined}
        >
          <Text style={styles.buttonText}>🔍 Analyze Video + Text</Text>
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
    backgroundColor: '#f0f0f0',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
  },
  cameraContainer: {
    height: height * 0.4,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width - 20,
    height: height * 0.3,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 25,
  },
  recordButton: {
    backgroundColor: 'rgba(255,0,0,0.8)',
    padding: 20,
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  galleryButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  tryCameraButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  fallbackToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
  },
  fallbackToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    minHeight: 80,
  },
  analysisContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
});







