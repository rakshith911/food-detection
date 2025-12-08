import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import historyAPI from '../../services/HistoryAPI';

export interface DishContent {
  id: string;
  name: string;
  weight: string;
  calories: string;
}

export interface FeedbackData {
  ratings: {
    foodDishIdentification: number;
    dishContentsIdentification: number;
    massEstimation: number;
    calorieEstimation: number;
    overall: number;
  };
  comment: string;
  timestamp: string;
}

export interface AnalysisEntry {
  id: string;
  type: 'image' | 'video';
  timestamp: string;
  imageUri?: string;
  videoUri?: string;
  textDescription?: string;
  analysisResult: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealName?: string;
  dishContents?: DishContent[];
  feedback?: FeedbackData;
}

interface HistoryState {
  history: AnalysisEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  history: [],
  isLoading: false,
  error: null,
};

// Async thunks for history operations
export const loadHistory = createAsyncThunk(
  'history/loadHistory',
  async (userEmail: string) => {
    const response = await historyAPI.getHistory(userEmail);
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to load history');
    }
  }
);

export const addAnalysis = createAsyncThunk(
  'history/addAnalysis',
  async ({ userEmail, analysis }: { userEmail: string; analysis: Omit<AnalysisEntry, 'id' | 'timestamp'> }) => {
    const response = await historyAPI.saveAnalysis(userEmail, analysis);
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to save analysis');
    }
  }
);

export const deleteAnalysis = createAsyncThunk(
  'history/deleteAnalysis',
  async ({ userEmail, analysisId }: { userEmail: string; analysisId: string }) => {
    const response = await historyAPI.deleteAnalysis(userEmail, analysisId);
    if (response.success) {
      return analysisId;
    } else {
      throw new Error(response.error || 'Failed to delete analysis');
    }
  }
);

export const clearHistory = createAsyncThunk(
  'history/clearHistory',
  async (userEmail: string) => {
    const response = await historyAPI.clearHistory(userEmail);
    if (response.success) {
      return true;
    } else {
      throw new Error(response.error || 'Failed to clear history');
    }
  }
);

export const updateAnalysis = createAsyncThunk(
  'history/updateAnalysis',
  async ({ userEmail, analysisId, updates }: { userEmail: string; analysisId: string; updates: Partial<AnalysisEntry> }) => {
    const response = await historyAPI.updateAnalysis(userEmail, analysisId, updates);
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to update analysis');
    }
  }
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearHistoryLocal: (state) => {
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    // Load history
    builder
      .addCase(loadHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load history';
      });

    // Add analysis
    builder
      .addCase(addAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history.unshift(action.payload); // Add to beginning
        state.error = null;
      })
      .addCase(addAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save analysis';
      });

    // Delete analysis - don't set isLoading to prevent loader from showing
    builder
      .addCase(deleteAnalysis.pending, (state) => {
        // Don't set isLoading for delete operations to prevent loader from showing
        state.error = null;
      })
      .addCase(deleteAnalysis.fulfilled, (state, action) => {
        state.history = state.history.filter(item => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAnalysis.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete analysis';
      });

    // Clear history
    builder
      .addCase(clearHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearHistory.fulfilled, (state) => {
        state.isLoading = false;
        state.history = [];
        state.error = null;
      })
      .addCase(clearHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to clear history';
      });

    // Update analysis
    builder
      .addCase(updateAnalysis.pending, (state) => {
        state.error = null;
      })
      .addCase(updateAnalysis.fulfilled, (state, action) => {
        const index = state.history.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.history[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAnalysis.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update analysis';
      });
  },
});

export const { clearError, clearHistoryLocal } = historySlice.actions;
export default historySlice.reducer;

