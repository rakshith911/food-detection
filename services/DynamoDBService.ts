// DynamoDB Service for storing user profiles and business data
// Uses API Gateway endpoints instead of AWS SDK for React Native compatibility
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '../aws-config';

const API_ENDPOINT = awsConfig.API.endpoint;

// Helper to get auth token for API calls
const getAuthToken = async (): Promise<string> => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (!idToken) {
      throw new Error('No authentication token available');
    }
    return idToken;
  } catch (error) {
    console.error('[DynamoDB] ❌ Failed to get auth token:', error);
    throw error;
  }
};

export interface BusinessProfile {
  // User ID from Cognito (primary key)
  userId: string;

  // Step 1 data
  profileImage?: string;
  businessName: string;
  address: string;
  town: string;
  district: string;
  postalCode: string;
  country: string;

  // Step 2 data
  menuFileUrl?: string; // S3 URL when file is uploaded
  businessCategory: string;
  cuisineType: string;
  primaryServingStyle: string;
  averageDishPrice: string;
  standardMealSize: string;
  businessSize: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  hasCompletedProfile: boolean;
}

class DynamoDBService {
  /**
   * Save or update business profile in DynamoDB via API Gateway
   */
  async saveBusinessProfile(userId: string, profile: Partial<BusinessProfile>): Promise<boolean> {
    try {
      console.log('[DynamoDB] 💾 Saving business profile for user:', userId);

      const token = await getAuthToken();
      const now = new Date().toISOString();

      const profileData: BusinessProfile = {
        userId,
        createdAt: profile.createdAt || now,
        updatedAt: now,
        hasCompletedProfile: true,
        ...profile,
      } as BusinessProfile;

      const response = await fetch(`${API_ENDPOINT}/profiles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save profile: ${error}`);
      }

      console.log('[DynamoDB] ✅ Profile saved successfully');
      return true;
    } catch (error) {
      console.error('[DynamoDB] ❌ Failed to save profile:', error);
      throw error;
    }
  }

  /**
   * Get business profile from DynamoDB via API Gateway
   */
  async getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    try {
      console.log('[DynamoDB] 📖 Fetching business profile for user:', userId);

      const token = await getAuthToken();

      const response = await fetch(`${API_ENDPOINT}/profiles/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        console.log('[DynamoDB] ℹ️  No profile found');
        return null;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get profile: ${error}`);
      }

      const data = await response.json();
      console.log('[DynamoDB] ✅ Profile found');
      return data as BusinessProfile;
    } catch (error) {
      console.error('[DynamoDB] ❌ Failed to get profile:', error);
      throw error;
    }
  }

  /**
   * Update specific fields in business profile via API Gateway
   */
  async updateBusinessProfile(
    userId: string,
    updates: Partial<BusinessProfile>
  ): Promise<boolean> {
    try {
      console.log('[DynamoDB] 🔄 Updating business profile for user:', userId);

      const token = await getAuthToken();

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_ENDPOINT}/profiles/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update profile: ${error}`);
      }

      console.log('[DynamoDB] ✅ Profile updated successfully');
      return true;
    } catch (error) {
      console.error('[DynamoDB] ❌ Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Delete business profile from DynamoDB via API Gateway
   */
  async deleteBusinessProfile(userId: string): Promise<boolean> {
    try {
      console.log('[DynamoDB] 🗑️  Deleting business profile for user:', userId);

      const token = await getAuthToken();

      const response = await fetch(`${API_ENDPOINT}/profiles/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete profile: ${error}`);
      }

      console.log('[DynamoDB] ✅ Profile deleted successfully');
      return true;
    } catch (error) {
      console.error('[DynamoDB] ❌ Failed to delete profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();
export default dynamoDBService;
