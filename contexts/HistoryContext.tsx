import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import historyAPI from '../services/HistoryAPI';

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
}

interface HistoryContextType {
  history: AnalysisEntry[];
  addAnalysis: (analysis: Omit<AnalysisEntry, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteAnalysis: (analysisId: string) => Promise<boolean>;
  clearHistory: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<AnalysisEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Load history when user logs in
  useEffect(() => {
    console.log('[History] Auth state changed:', { isAuthenticated, userEmail: user?.email });
    if (isAuthenticated && user?.email) {
      loadHistoryFromServer();
    } else {
      // Clear history when user logs out
      console.log('[History] Clearing history due to logout');
      setHistory([]);
    }
  }, [isAuthenticated, user?.email]);

  const loadHistoryFromServer = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await historyAPI.getHistory(user.email);
      if (response.success && response.data) {
        setHistory(response.data);
        console.log(`[History] Loaded ${response.data.length} entries from server`);
      } else {
        setError(response.error || 'Failed to load history');
        console.error('[History] Failed to load:', response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('[History] Error loading from server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAnalysis = async (analysis: Omit<AnalysisEntry, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!user?.email) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await historyAPI.saveAnalysis(user.email, analysis);
      if (response.success && response.data) {
        setHistory(prev => [response.data!, ...prev]);
        console.log('[History] Analysis saved to server:', response.data.id);
        return true;
      } else {
        setError(response.error || 'Failed to save analysis');
        console.error('[History] Failed to save:', response.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('[History] Error saving to server:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async (): Promise<boolean> => {
    if (!user?.email) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await historyAPI.clearHistory(user.email);
      if (response.success) {
        setHistory([]);
        console.log('[History] All history cleared from server');
        return true;
      } else {
        setError(response.error || 'Failed to clear history');
        console.error('[History] Failed to clear:', response.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('[History] Error clearing from server:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAnalysis = async (analysisId: string): Promise<boolean> => {
    if (!user?.email) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await historyAPI.deleteAnalysis(user.email, analysisId);
      if (response.success) {
        setHistory(prev => prev.filter(item => item.id !== analysisId));
        console.log('[History] Analysis deleted from server:', analysisId);
        return true;
      } else {
        setError(response.error || 'Failed to delete analysis');
        console.error('[History] Failed to delete:', response.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('[History] Error deleting from server:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistory = async () => {
    await loadHistoryFromServer();
  };

  const value: HistoryContextType = {
    history,
    addAnalysis,
    deleteAnalysis,
    clearHistory,
    isLoading,
    error,
    refreshHistory,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};
