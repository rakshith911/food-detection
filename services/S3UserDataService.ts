// S3 User Data Service
// Handles backup and restore of user data to/from S3 via API Gateway
// S3 folder structure: UKcal/{userId}/profile.json, history.json, settings.json

import { awsConfig } from '../aws-config';

// Use the dedicated UserData API endpoint (nutrition analysis API Gateway with /user-data routes)
const API_ENDPOINT = awsConfig.UserData.apiEndpoint;

export type DataType = 'profile' | 'history' | 'settings';

export interface ProfileBackup {
  userAccount: {
    userId: string;
    email: string;
    createdAt: number;
    hasCompletedProfile: boolean;
  };
  businessProfile: any | null;
  avatar: { id: number } | null;
  profileImage: string | null;
  updatedAt: string;
}

export interface HistoryBackup {
  entries: any[];
  updatedAt: string;
}

export interface SettingsBackup {
  hasConsented: boolean | null;
  hasCompletedProfile: boolean | null;
  cameraPrefs: {
    facing: string;
    flashEnabled: boolean;
    activeTab: 'photo' | 'video';
    lastMediaMode: 'photo' | 'video';
  };
  streakDays: number;
  updatedAt: string;
}

export interface AllUserData {
  profile: ProfileBackup | null;
  history: HistoryBackup | null;
  settings: SettingsBackup | null;
}

class S3UserDataService {
  /**
   * Backup a single data type to S3
   * PUT /user-data/{userId}/{dataType}
   */
  async backupData(userId: string, dataType: DataType, data: any): Promise<boolean> {
    try {
      console.log(`[S3UserData] Backing up ${dataType} for user ${userId}...`);

      const response = await fetch(
        `${API_ENDPOINT}/user-data/${encodeURIComponent(userId)}/${dataType}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to backup ${dataType}: ${error}`);
      }

      console.log(`[S3UserData] ${dataType} backed up successfully`);
      return true;
    } catch (error) {
      console.error(`[S3UserData] Failed to backup ${dataType}:`, error);
      return false;
    }
  }

  /**
   * Restore a single data type from S3
   * GET /user-data/{userId}/{dataType}
   */
  async restoreData<T>(userId: string, dataType: DataType): Promise<T | null> {
    try {
      console.log(`[S3UserData] Restoring ${dataType} for user ${userId}...`);

      const response = await fetch(
        `${API_ENDPOINT}/user-data/${encodeURIComponent(userId)}/${dataType}`,
        {
          method: 'GET',
        }
      );

      if (response.status === 404) {
        console.log(`[S3UserData] No ${dataType} data found in S3`);
        return null;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to restore ${dataType}: ${error}`);
      }

      const data = await response.json();
      console.log(`[S3UserData] ${dataType} restored successfully`);
      return data as T;
    } catch (error) {
      console.error(`[S3UserData] Failed to restore ${dataType}:`, error);
      return null;
    }
  }

  /**
   * Backup all user data to S3 in parallel
   */
  async backupAll(
    userId: string,
    data: { profile?: any; history?: any; settings?: any }
  ): Promise<boolean> {
    try {
      console.log(`[S3UserData] Backing up all data for user ${userId}...`);

      const promises: Promise<boolean>[] = [];

      if (data.profile) {
        promises.push(this.backupData(userId, 'profile', data.profile));
      }
      if (data.history) {
        promises.push(this.backupData(userId, 'history', data.history));
      }
      if (data.settings) {
        promises.push(this.backupData(userId, 'settings', data.settings));
      }

      const results = await Promise.allSettled(promises);
      const allSucceeded = results.every(
        (r) => r.status === 'fulfilled' && r.value === true
      );

      if (allSucceeded) {
        console.log('[S3UserData] All data backed up successfully');
      } else {
        console.warn('[S3UserData] Some backups failed:', results);
      }

      return allSucceeded;
    } catch (error) {
      console.error('[S3UserData] Failed to backup all data:', error);
      return false;
    }
  }

  /**
   * Restore all user data from S3 in parallel
   */
  async restoreAll(userId: string): Promise<AllUserData> {
    try {
      console.log(`[S3UserData] Restoring all data for user ${userId}...`);

      const [profile, history, settings] = await Promise.allSettled([
        this.restoreData<ProfileBackup>(userId, 'profile'),
        this.restoreData<HistoryBackup>(userId, 'history'),
        this.restoreData<SettingsBackup>(userId, 'settings'),
      ]);

      const result: AllUserData = {
        profile: profile.status === 'fulfilled' ? profile.value : null,
        history: history.status === 'fulfilled' ? history.value : null,
        settings: settings.status === 'fulfilled' ? settings.value : null,
      };

      const hasData = result.profile || result.history || result.settings;
      if (hasData) {
        console.log('[S3UserData] User data found in S3:', {
          hasProfile: !!result.profile,
          hasHistory: !!result.history,
          historyEntries: result.history?.entries?.length || 0,
          hasSettings: !!result.settings,
        });
      } else {
        console.log('[S3UserData] No existing user data found in S3');
      }

      return result;
    } catch (error) {
      console.error('[S3UserData] Failed to restore all data:', error);
      return { profile: null, history: null, settings: null };
    }
  }

  /**
   * Fire-and-forget backup — logs errors but never throws
   */
  backupInBackground(userId: string, dataType: DataType, data: any): void {
    this.backupData(userId, dataType, data).catch((error) => {
      console.warn(`[S3UserData] Background backup of ${dataType} failed:`, error);
    });
  }
}

export const s3UserDataService = new S3UserDataService();
export default s3UserDataService;
