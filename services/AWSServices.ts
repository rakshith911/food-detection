// AWS Configuration and Services
// NOTE: This file is deprecated and not used in React Native app
// The app now uses API Gateway endpoints instead of direct AWS SDK access
// import AWS from 'aws-sdk';
// import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

// AWS Configuration
// AWS.config.update({
//   region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
//   accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
// });

// Initialize AWS Services
// const s3 = new AWS.S3();
// const dynamodb = new AWS.DynamoDB.DocumentClient();
// const cognitoUserPool = new CognitoUserPool({
//   UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'your-user-pool-id',
//   ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || 'your-client-id'
// });

// Types
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

export interface User {
  email: string;
  userId: string;
  isVerified: boolean;
}

// AWS Authentication Service
export class AWSAuthService {
  async sendOTP(email: string): Promise<boolean> {
    try {
      const userData = { Username: email, Pool: cognitoUserPool };
      const cognitoUser = new CognitoUser(userData);
      
      return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => {
            console.log('[AWS Auth] OTP sent successfully');
            resolve(true);
          },
          onFailure: (err) => {
            console.error('[AWS Auth] Failed to send OTP:', err);
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('[AWS Auth] Error sending OTP:', error);
      return false;
    }
  }

  async verifyOTP(email: string, otp: string): Promise<string | null> {
    try {
      const userData = { Username: email, Pool: cognitoUserPool };
      const cognitoUser = new CognitoUser(userData);
      
      return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(otp, 'tempPassword123', {
          onSuccess: () => {
            cognitoUser.getSession((err, session) => {
              if (err) {
                reject(err);
              } else {
                const token = session.getIdToken().getJwtToken();
                console.log('[AWS Auth] OTP verified successfully');
                resolve(token);
              }
            });
          },
          onFailure: (err) => {
            console.error('[AWS Auth] Failed to verify OTP:', err);
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('[AWS Auth] Error verifying OTP:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const cognitoUser = cognitoUserPool.getCurrentUser();
      if (cognitoUser) {
        return new Promise((resolve, reject) => {
          cognitoUser.getSession((err, session) => {
            if (err) {
              reject(err);
            } else {
              const payload = session.getIdToken().payload;
              resolve({
                email: payload.email,
                userId: payload.sub,
                isVerified: payload.email_verified
              });
            }
          });
        });
      }
      return null;
    } catch (error) {
      console.error('[AWS Auth] Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const cognitoUser = cognitoUserPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
        console.log('[AWS Auth] User logged out successfully');
      }
    } catch (error) {
      console.error('[AWS Auth] Error during logout:', error);
    }
  }
}

// AWS File Storage Service
export class AWSFileService {
  private bucketName: string;

  constructor(bucketName: string = process.env.REACT_APP_S3_BUCKET_NAME || 'your-food-detection-bucket') {
    this.bucketName = bucketName;
  }

  async uploadImage(imageUri: string, userId: string): Promise<string> {
    try {
      const fileName = `users/${userId}/images/${Date.now()}.jpg`;
      
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: blob,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      };
      
      const result = await s3.upload(uploadParams).promise();
      console.log('[AWS S3] Image uploaded successfully:', result.Location);
      return result.Location;
    } catch (error) {
      console.error('[AWS S3] Error uploading image:', error);
      throw error;
    }
  }

  async uploadVideo(videoUri: string, userId: string): Promise<string> {
    try {
      const fileName = `users/${userId}/videos/${Date.now()}.mp4`;
      
      const response = await fetch(videoUri);
      const blob = await response.blob();
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: blob,
        ContentType: 'video/mp4',
        ACL: 'public-read'
      };
      
      const result = await s3.upload(uploadParams).promise();
      console.log('[AWS S3] Video uploaded successfully:', result.Location);
      return result.Location;
    } catch (error) {
      console.error('[AWS S3] Error uploading video:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) return false;

      const deleteParams = {
        Bucket: this.bucketName,
        Key: key
      };

      await s3.deleteObject(deleteParams).promise();
      console.log('[AWS S3] File deleted successfully:', key);
      return true;
    } catch (error) {
      console.error('[AWS S3] Error deleting file:', error);
      return false;
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes(this.bucketName));
      if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch (error) {
      console.error('[AWS S3] Error extracting key from URL:', error);
      return null;
    }
  }
}

// AWS History Service
export class AWSHistoryService {
  private tableName: string;

  constructor(tableName: string = process.env.REACT_APP_DYNAMODB_TABLE_NAME || 'FoodAnalysisHistory') {
    this.tableName = tableName;
  }

  async saveAnalysis(userId: string, analysis: Omit<AnalysisEntry, 'id' | 'timestamp'>): Promise<AnalysisEntry | null> {
    try {
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const params = {
        TableName: this.tableName,
        Item: {
          userId,
          analysisId,
          timestamp,
          type: analysis.type,
          imageUrl: analysis.imageUri,
          videoUrl: analysis.videoUri,
          textDescription: analysis.textDescription,
          analysisResult: analysis.analysisResult,
          nutritionalInfo: analysis.nutritionalInfo,
          ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
        }
      };

      await dynamodb.put(params).promise();
      console.log('[AWS DynamoDB] Analysis saved successfully:', analysisId);

      return {
        id: analysisId,
        timestamp,
        ...analysis
      };
    } catch (error) {
      console.error('[AWS DynamoDB] Error saving analysis:', error);
      return null;
    }
  }

  async getHistory(userId: string): Promise<AnalysisEntry[]> {
    try {
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false // Sort by timestamp descending
      };

      const result = await dynamodb.query(params).promise();
      console.log('[AWS DynamoDB] History loaded successfully:', result.Items?.length || 0, 'entries');

      return (result.Items || []).map(item => ({
        id: item.analysisId,
        timestamp: item.timestamp,
        type: item.type,
        imageUri: item.imageUrl,
        videoUri: item.videoUrl,
        textDescription: item.textDescription,
        analysisResult: item.analysisResult,
        nutritionalInfo: item.nutritionalInfo
      }));
    } catch (error) {
      console.error('[AWS DynamoDB] Error loading history:', error);
      return [];
    }
  }

  async deleteAnalysis(userId: string, analysisId: string): Promise<boolean> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          userId,
          analysisId
        }
      };

      await dynamodb.delete(params).promise();
      console.log('[AWS DynamoDB] Analysis deleted successfully:', analysisId);
      return true;
    } catch (error) {
      console.error('[AWS DynamoDB] Error deleting analysis:', error);
      return false;
    }
  }

  async clearHistory(userId: string): Promise<boolean> {
    try {
      // Get all analyses for the user
      const history = await this.getHistory(userId);
      
      // Delete each analysis
      const deletePromises = history.map(analysis => 
        this.deleteAnalysis(userId, analysis.id)
      );
      
      await Promise.all(deletePromises);
      console.log('[AWS DynamoDB] All history cleared successfully');
      return true;
    } catch (error) {
      console.error('[AWS DynamoDB] Error clearing history:', error);
      return false;
    }
  }
}

// Export singleton instances
export const awsAuthService = new AWSAuthService();
export const awsFileService = new AWSFileService();
export const awsHistoryService = new AWSHistoryService();










