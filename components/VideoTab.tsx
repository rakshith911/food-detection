import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  Dimensions 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function VideoTab() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
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

  return (
    <View style={styles.container}>
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
                <Text style={styles.fallbackSubtext}>
                  Use Expo Go app for full camera functionality
                </Text>
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

      {/* Analysis Section */}
      <View style={styles.analysisContainer}>
        <Text style={styles.title}>Video Analysis</Text>
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={() => {
            if (recordedVideo) {
              Alert.alert('Analysis', 'Analyzing video content...');
            } else {
              Alert.alert('No Video', 'Please record or select a video first.');
            }
          }}
        >
          <Text style={styles.buttonText}>Analyze Video</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    flex: 0.7,
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
    height: height * 0.4,
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
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  fallbackSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
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
  analysisContainer: {
    flex: 0.3,
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  analyzeButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});







