import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import historyReducer from './slices/historySlice';
import cameraReducer from './slices/cameraSlice';
import uiReducer from './slices/uiSlice';
import appReducer from './slices/appSlice';
import profileReducer from './slices/profileSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  history: historyReducer,
  camera: cameraReducer,
  ui: uiReducer,
  app: appReducer,
  profile: profileReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;


