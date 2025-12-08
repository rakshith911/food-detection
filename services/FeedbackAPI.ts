import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeedbackData {
  analysisId: string;
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

class FeedbackAPI {
  private getStorageKey(email: string): string {
    return `feedback_${email}`;
  }

  async saveFeedback(email: string, feedback: FeedbackData): Promise<boolean> {
    try {
      const key = this.getStorageKey(email);
      const existingFeedback = await this.getFeedback(email);
      
      // Add new feedback to the list
      const updatedFeedback = [...existingFeedback, feedback];
      
      // Save to AsyncStorage (mock implementation)
      await AsyncStorage.setItem(key, JSON.stringify(updatedFeedback));
      
      console.log('[Feedback API] Saved feedback for', email, 'analysis:', feedback.analysisId);
      return true;
    } catch (error) {
      console.error('[Feedback API] Error saving feedback:', error);
      return false;
    }
  }

  async getFeedback(email: string): Promise<FeedbackData[]> {
    try {
      const key = this.getStorageKey(email);
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('[Feedback API] Error getting feedback:', error);
      return [];
    }
  }

  async getFeedbackForAnalysis(email: string, analysisId: string): Promise<FeedbackData | null> {
    try {
      const allFeedback = await this.getFeedback(email);
      return allFeedback.find((f) => f.analysisId === analysisId) || null;
    } catch (error) {
      console.error('[Feedback API] Error getting feedback for analysis:', error);
      return null;
    }
  }
}

export const feedbackAPI = new FeedbackAPI();









