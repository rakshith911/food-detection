import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CameraType } from 'expo-camera';

interface CameraState {
  facing: CameraType;
  flashEnabled: boolean;
  activeTab: 'photo' | 'video';
  lastMediaMode: 'photo' | 'video';
  selectedImage: string | null;
  selectedVideo: string | null;
  isRecording: boolean;
  recordingTime: number;
  streakDays: number;
}

const initialState: CameraState = {
  facing: 'back',
  flashEnabled: false,
  activeTab: 'photo',
  lastMediaMode: 'photo',
  selectedImage: null,
  selectedVideo: null,
  isRecording: false,
  recordingTime: 0,
  streakDays: 1,
};

const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setFacing: (state, action: PayloadAction<CameraType>) => {
      state.facing = action.payload;
    },
    toggleFlash: (state) => {
      state.flashEnabled = !state.flashEnabled;
    },
    setActiveTab: (state, action: PayloadAction<'photo' | 'video'>) => {
      state.activeTab = action.payload;
      state.lastMediaMode = action.payload;
    },
    setSelectedImage: (state, action: PayloadAction<string | null>) => {
      state.selectedImage = action.payload;
    },
    setSelectedVideo: (state, action: PayloadAction<string | null>) => {
      state.selectedVideo = action.payload;
    },
    startRecording: (state) => {
      state.isRecording = true;
      state.recordingTime = 0;
    },
    stopRecording: (state) => {
      state.isRecording = false;
      state.recordingTime = 0;
    },
    updateRecordingTime: (state, action: PayloadAction<number>) => {
      state.recordingTime = action.payload;
    },
    setStreakDays: (state, action: PayloadAction<number>) => {
      state.streakDays = action.payload;
    },
    clearMedia: (state) => {
      state.selectedImage = null;
      state.selectedVideo = null;
    },
    resetCamera: (state) => {
      state.selectedImage = null;
      state.selectedVideo = null;
      state.isRecording = false;
      state.recordingTime = 0;
    },
  },
});

export const {
  setFacing,
  toggleFlash,
  setActiveTab,
  setSelectedImage,
  setSelectedVideo,
  startRecording,
  stopRecording,
  updateRecordingTime,
  setStreakDays,
  clearMedia,
  resetCamera,
} = cameraSlice.actions;

export default cameraSlice.reducer;







