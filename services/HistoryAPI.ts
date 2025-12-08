import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisEntry } from '../store/slices/historySlice';

// Mock API base URL - replace with your actual backend URL
const API_BASE_URL = 'https://your-backend-api.com/api';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class HistoryAPI {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      
      // Send error to Sentry
      try {
        const { captureException } = require('../utils/sentry');
        captureException(error instanceof Error ? error : new Error(String(error)), {
          api: {
            endpoint,
            method: options.method || 'GET',
          },
          context: 'HistoryAPI Request',
        });
      } catch (sentryError) {
        // Sentry not available, ignore
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get user's analysis history
  async getHistory(userEmail: string): Promise<APIResponse<AnalysisEntry[]>> {
    return this.makeRequest<AnalysisEntry[]>(`/history/${encodeURIComponent(userEmail)}`);
  }

  // Save a new analysis entry
  async saveAnalysis(userEmail: string, analysis: Omit<AnalysisEntry, 'id' | 'timestamp'>): Promise<APIResponse<AnalysisEntry>> {
    return this.makeRequest<AnalysisEntry>('/history', {
      method: 'POST',
      body: JSON.stringify({
        userEmail,
        ...analysis,
      }),
    });
  }

  // Delete a specific analysis entry
  async deleteAnalysis(userEmail: string, analysisId: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(`/history/${encodeURIComponent(userEmail)}/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // Clear all history for a user
  async clearHistory(userEmail: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(`/history/${encodeURIComponent(userEmail)}`, {
      method: 'DELETE',
    });
  }

  // Update an existing analysis entry
  async updateAnalysis(
    userEmail: string,
    analysisId: string,
    updates: Partial<AnalysisEntry>
  ): Promise<APIResponse<AnalysisEntry>> {
    return this.makeRequest<AnalysisEntry>(`/history/${encodeURIComponent(userEmail)}/${analysisId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

// For demo purposes, we'll create a mock API that simulates server behavior
class MockHistoryAPI extends HistoryAPI {
  private mockData: { [email: string]: AnalysisEntry[] } = {};
  private storageInitialized = false;

  constructor() {
    super();
    // Initialize storage asynchronously
    this.initializeStorage();
  }

  private async initializeStorage() {
    if (!this.storageInitialized) {
      await this.loadFromStorage();
      this.storageInitialized = true;
    }
  }

  private async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem('mockHistoryData');
      if (stored) {
        this.mockData = JSON.parse(stored);
        console.log('[Mock API] Loaded data from AsyncStorage:', Object.keys(this.mockData).length, 'users');
      } else {
        console.log('[Mock API] No existing data found in AsyncStorage');
      }
    } catch (error) {
      console.error('[Mock API] Failed to load from AsyncStorage:', error);
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem('mockHistoryData', JSON.stringify(this.mockData));
      console.log('[Mock API] Saved data to AsyncStorage');
    } catch (error) {
      console.error('[Mock API] Failed to save to AsyncStorage:', error);
    }
  }

  async getHistory(userEmail: string): Promise<APIResponse<AnalysisEntry[]>> {
    // Ensure storage is initialized
    await this.initializeStorage();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const history = this.mockData[userEmail] || [];
    console.log(`[Mock API] Retrieved ${history.length} entries for ${userEmail}`);
    
    return {
      success: true,
      data: history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    };
  }

  async saveAnalysis(userEmail: string, analysis: Omit<AnalysisEntry, 'id' | 'timestamp'>): Promise<APIResponse<AnalysisEntry>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const newEntry: AnalysisEntry = {
      ...analysis,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    if (!this.mockData[userEmail]) {
      this.mockData[userEmail] = [];
    }

    // Create a new array instead of mutating to avoid frozen array issues
    this.mockData[userEmail] = [newEntry, ...this.mockData[userEmail]];
    this.saveToStorage(); // Save to localStorage

    console.log(`[Mock API] Saved analysis for ${userEmail}:`, newEntry.id);

    return {
      success: true,
      data: newEntry,
    };
  }

  async deleteAnalysis(userEmail: string, analysisId: string): Promise<APIResponse<void>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.mockData[userEmail]) {
      this.mockData[userEmail] = this.mockData[userEmail].filter(entry => entry.id !== analysisId);
      this.saveToStorage(); // Save to localStorage
      console.log(`[Mock API] Deleted analysis ${analysisId} for ${userEmail}`);
    }
    
    return { success: true };
  }

  async clearHistory(userEmail: string): Promise<APIResponse<void>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.mockData[userEmail] = [];
    this.saveToStorage(); // Save to localStorage
    console.log(`[Mock API] Cleared all history for ${userEmail}`);
    
    return { success: true };
  }

  async updateAnalysis(
    userEmail: string,
    analysisId: string,
    updates: Partial<AnalysisEntry>
  ): Promise<APIResponse<AnalysisEntry>> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize user data if it doesn't exist
      if (!this.mockData[userEmail]) {
        this.mockData[userEmail] = [];
        console.log(`[Mock API] Initialized data for ${userEmail}`);
      }
      
      const index = this.mockData[userEmail].findIndex(entry => entry.id === analysisId);
      if (index !== -1) {
        // Create a new array with the updated entry (avoid mutation)
        const existingEntry = this.mockData[userEmail][index];
        const updatedEntry = { 
          ...existingEntry, 
          ...updates,
          // Ensure id and timestamp are preserved
          id: analysisId,
          timestamp: existingEntry.timestamp,
        };
        
        // Create a new array instead of mutating
        this.mockData[userEmail] = [
          ...this.mockData[userEmail].slice(0, index),
          updatedEntry,
          ...this.mockData[userEmail].slice(index + 1),
        ];
        
        this.saveToStorage(); // Save to localStorage
        console.log(`[Mock API] Updated analysis ${analysisId} for ${userEmail}`, updates);
        
        return {
          success: true,
          data: updatedEntry,
        };
      } else {
        // If entry doesn't exist, try to create it from updates (fallback for entries that weren't properly saved)
        console.warn(`[Mock API] Analysis ${analysisId} not found for ${userEmail}. Creating new entry from updates.`);
        
        // Check if updates contain enough data to create an entry
        if (updates.type && updates.timestamp) {
          const newEntry: AnalysisEntry = {
            id: analysisId,
            type: updates.type,
            timestamp: updates.timestamp,
            imageUri: updates.imageUri,
            videoUri: updates.videoUri,
            textDescription: updates.textDescription,
            analysisResult: updates.analysisResult || '',
            nutritionalInfo: updates.nutritionalInfo || {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            },
            mealName: updates.mealName,
            dishContents: updates.dishContents,
          };
          
          this.mockData[userEmail].unshift(newEntry);
          this.saveToStorage();
          console.log(`[Mock API] Created new entry ${analysisId} for ${userEmail}`);
          
          return {
            success: true,
            data: newEntry,
          };
        } else {
          console.warn(`[Mock API] Cannot create entry: missing required fields. Available IDs:`, 
            this.mockData[userEmail].map(e => e.id));
          return {
            success: false,
            error: `Analysis not found: ${analysisId}. Cannot create entry without required fields.`,
          };
        }
      }
    } catch (error) {
      console.error('[Mock API] Error updating analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export the mock API for now - replace with real API when backend is ready
export const historyAPI = new MockHistoryAPI();
export default historyAPI;
