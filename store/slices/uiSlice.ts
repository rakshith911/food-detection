import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  error: string | null;
  showModal: boolean;
  modalType: string | null;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
}

const initialState: UIState = {
  isLoading: false,
  error: null,
  showModal: false,
  modalType: null,
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    showModal: (state, action: PayloadAction<string>) => {
      state.showModal = true;
      state.modalType = action.payload;
    },
    hideModal: (state) => {
      state.showModal = false;
      state.modalType = null;
    },
    showNotification: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  showModal,
  hideModal,
  showNotification,
  clearNotification,
} = uiSlice.actions;

export default uiSlice.reducer;







