  // Nutrition Video Analysis API Service
// Integrates with the AWS-deployed nutrition analysis backend

const API_BASE_URL = 'https://qx3i66fa87.execute-api.us-east-1.amazonaws.com/v1';

export interface NutritionItem {
  food_name: string;
  mass_g: number;
  volume_ml?: number;
  total_calories?: number;
}

export interface NutritionAnalysisResult {
  job_id: string;
  status: 'pending_upload' | 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  filename?: string;
  download_url?: string;
  nutrition_summary?: {
    total_food_volume_ml: number;
    total_mass_g: number;
    total_calories_kcal: number;
    num_food_items: number;
  };
  items?: NutritionItem[];
  detailed_results?: any;
  error?: string;
}

export interface UploadResponse {
  job_id: string;
  upload_url: string;
  status: string;
  message: string;
}

export class NutritionAnalysisAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the API service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      console.log('[Nutrition API] Health check:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('[Nutrition API] Health check failed:', error);
      return false;
    }
  }

  /**
   * Request a presigned URL for video/image upload
   * @param filename - The filename for the upload
   * @param contentType - The MIME type (defaults to 'video/mp4', use 'image/jpeg' for images)
   */
  async requestUploadUrl(filename: string, contentType: string = 'video/mp4'): Promise<UploadResponse | null> {
    try {
      console.log('[Nutrition API] Requesting upload URL from:', `${this.baseUrl}/api/upload`);
      console.log('[Nutrition API] Request body:', { type: 'presigned', filename, content_type: contentType });
      
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'presigned',
          filename,
          content_type: contentType,
        }),
      });

      console.log('[Nutrition API] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Nutrition API] Error response body:', errorBody);
        throw new Error(`Upload request failed: ${response.status} - ${errorBody || response.statusText}`);
      }

      const data = await response.json();
      console.log('[Nutrition API] Upload URL received:', data.job_id);
      return data;
    } catch (error: any) {
      console.error('[Nutrition API] Failed to request upload URL:', error);
      console.error('[Nutrition API] Error details:', error.message);
      return null;
    }
  }

  /**
   * Upload video to S3 using presigned URL
   */
  async uploadVideo(presignedUrl: string, videoUri: string): Promise<boolean> {
    try {
      console.log('[Nutrition API] Uploading video from:', videoUri);

      // Fetch the video file
      const videoResponse = await fetch(videoUri);
      const videoBlob = await videoResponse.blob();

      // Upload to S3 with required encryption header
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'x-amz-server-side-encryption': 'aws:kms',
        },
        body: videoBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      console.log('[Nutrition API] Video uploaded successfully');
      return true;
    } catch (error) {
      console.error('[Nutrition API] Failed to upload video:', error);
      return false;
    }
  }

  /**
   * Confirm upload and start processing
   */
  async confirmUpload(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'confirm',
          job_id: jobId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload confirmation failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Nutrition API] Upload confirmed, processing queued:', data);
      return true;
    } catch (error) {
      console.error('[Nutrition API] Failed to confirm upload:', error);
      return false;
    }
  }

  /**
   * Check the status of a job
   */
  async checkStatus(jobId: string): Promise<NutritionAnalysisResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status/${jobId}`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Nutrition API] Job status:', data.status);
      return data;
    } catch (error) {
      console.error('[Nutrition API] Failed to check status:', error);
      return null;
    }
  }

  /**
   * Get the results of a completed job
   */
  async getResults(jobId: string): Promise<NutritionAnalysisResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/results/${jobId}`);

      if (!response.ok) {
        throw new Error(`Results fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Nutrition API] Results received:', data);

      // Fetch detailed results if download URL is available
      if (data.download_url) {
        try {
          console.log('[Nutrition API] Fetching detailed results from S3...');
          const detailsResponse = await fetch(data.download_url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          console.log('[Nutrition API] Details response status:', detailsResponse.status);

          if (detailsResponse.ok) {
            const detailedResults = await detailsResponse.json();
            console.log('[Nutrition API] Detailed results fetched successfully');
            console.log('[Nutrition API] Raw detailed results:', JSON.stringify(detailedResults, null, 2));
            data.detailed_results = detailedResults;

            // Extract items array from detailed results and map to NutritionItem format
            if (detailedResults.items && detailedResults.items.length > 0) {
              console.log('[Nutrition API] Detected items:');
              data.items = detailedResults.items.map((item: any) => ({
                food_name: item.food_name || item.name || 'Unknown',
                mass_g: item.mass_g || 0,
                volume_ml: item.volume_ml,
                total_calories: item.total_calories || item.calories || 0,
              }));

              data.items.forEach((item: NutritionItem, index: number) => {
                console.log(`  ${index + 1}. ${item.food_name} - ${Math.round(item.total_calories || 0)} kcal - ${Math.round(item.mass_g)}g`);
              });
            } else if (detailedResults.nutrition?.items && detailedResults.nutrition.items.length > 0) {
              // Alternative path: items might be nested under 'nutrition'
              console.log('[Nutrition API] Found items in nutrition object');
              data.items = detailedResults.nutrition.items.map((item: any) => ({
                food_name: item.food_name || item.name || 'Unknown',
                mass_g: item.mass_g || 0,
                volume_ml: item.volume_ml,
                total_calories: item.total_calories || item.calories || 0,
              }));

              data.items.forEach((item: NutritionItem, index: number) => {
                console.log(`  ${index + 1}. ${item.food_name} - ${Math.round(item.total_calories || 0)} kcal - ${Math.round(item.mass_g)}g`);
              });
            } else {
              console.warn('[Nutrition API] No items array found in detailed results');
            }
          } else {
            const errorText = await detailsResponse.text();
            console.error('[Nutrition API] Failed to fetch details. Status:', detailsResponse.status, 'Error:', errorText.substring(0, 200));
            console.log('[Nutrition API] Falling back to detected_foods from main response');

            // Fallback: use detected_foods from the main response if detailed fetch fails
            if ((data as any).detected_foods && Array.isArray((data as any).detected_foods)) {
              data.items = (data as any).detected_foods.map((item: any) => ({
                food_name: item.name || 'Unknown',
                mass_g: 0, // Not available in simplified response
                volume_ml: undefined,
                total_calories: item.calories || 0,
              }));
              console.log('[Nutrition API] Using fallback detected_foods:', data.items.length, 'items');
            }
          }
        } catch (detailError) {
          console.error('[Nutrition API] Could not fetch detailed results:', detailError);
          console.log('[Nutrition API] Falling back to detected_foods from main response');

          // Fallback: use detected_foods from the main response
          if ((data as any).detected_foods && Array.isArray((data as any).detected_foods)) {
            data.items = (data as any).detected_foods.map((item: any) => ({
              food_name: item.name || 'Unknown',
              mass_g: 0, // Not available in simplified response
              volume_ml: undefined,
              total_calories: item.calories || 0,
            }));
            console.log('[Nutrition API] Using fallback detected_foods:', data.items.length, 'items');
          }
        }
      } else {
        console.warn('[Nutrition API] No download_url provided in results');
        // Fallback: use detected_foods from the main response
        if ((data as any).detected_foods && Array.isArray((data as any).detected_foods)) {
          data.items = (data as any).detected_foods.map((item: any) => ({
            food_name: item.name || 'Unknown',
            mass_g: 0, // Not available in simplified response
            volume_ml: undefined,
            total_calories: item.calories || 0,
          }));
          console.log('[Nutrition API] Using detected_foods from response:', data.items.length, 'items');
        }
      }

      return data;
    } catch (error) {
      console.error('[Nutrition API] Failed to get results:', error);
      return null;
    }
  }

  /**
   * Upload image to S3 using presigned URL
   * @param presignedUrl - The presigned S3 URL
   * @param imageUri - The local image URI
   * @param contentType - The MIME type (must match what was used to generate presigned URL)
   */
  async uploadImage(presignedUrl: string, imageUri: string, contentType: string = 'image/jpeg'): Promise<boolean> {
    try {
      console.log('[Nutrition API] Uploading image from:', imageUri);
      console.log('[Nutrition API] Using content type:', contentType);

      // Fetch the image file
      const imageResponse = await fetch(imageUri);
      const imageBlob = await imageResponse.blob();

      console.log('[Nutrition API] Image blob size:', imageBlob.size);

      // Upload to S3 with required encryption header
      // IMPORTANT: Content-Type MUST match exactly what was used to generate the presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'x-amz-server-side-encryption': 'aws:kms',
        },
        body: imageBlob,
      });

      console.log('[Nutrition API] Upload response status:', uploadResponse.status, uploadResponse.statusText);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[Nutrition API] Upload error details:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      console.log('[Nutrition API] Image uploaded successfully');
      return true;
    } catch (error) {
      console.error('[Nutrition API] Failed to upload image:', error);
      return false;
    }
  }

  /**
   * Complete workflow: Upload video and wait for results
   */
  async analyzeVideo(
    videoUri: string,
    filename: string,
    onProgress?: (status: string) => void
  ): Promise<NutritionAnalysisResult | null> {
    try {
      // Step 1: Request upload URL
      onProgress?.('Requesting upload URL...');
      const uploadData = await this.requestUploadUrl(filename);
      if (!uploadData) {
        throw new Error('Failed to get upload URL');
      }

      // Step 2: Upload video
      onProgress?.('Uploading video...');
      const uploaded = await this.uploadVideo(uploadData.upload_url, videoUri);
      if (!uploaded) {
        throw new Error('Failed to upload video');
      }

      // Step 3: Confirm upload to start processing
      onProgress?.('Starting analysis...');
      const confirmed = await this.confirmUpload(uploadData.job_id);
      if (!confirmed) {
        throw new Error('Failed to confirm upload');
      }

      // Step 4: Poll for results
      onProgress?.('Processing video...');
      return await this.pollForResults(uploadData.job_id, onProgress);
    } catch (error) {
      console.error('[Nutrition API] Video analysis failed:', error);
      return null;
    }
  }

  /**
   * Complete workflow: Upload image and wait for results
   */
  async analyzeImage(
    imageUri: string,
    filename: string,
    onProgress?: (status: string) => void
  ): Promise<NutritionAnalysisResult | null> {
    try {
      // Step 1: Request upload URL with image content type
      onProgress?.('Requesting upload URL...');
      const contentType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const uploadData = await this.requestUploadUrl(filename, contentType);
      if (!uploadData) {
        throw new Error('Failed to get upload URL');
      }

      // Step 2: Upload image with matching content type
      onProgress?.('Uploading image...');
      const uploaded = await this.uploadImage(uploadData.upload_url, imageUri, contentType);
      if (!uploaded) {
        throw new Error('Failed to upload image');
      }

      // Step 3: Confirm upload to start processing
      onProgress?.('Starting analysis...');
      const confirmed = await this.confirmUpload(uploadData.job_id);
      if (!confirmed) {
        throw new Error('Failed to confirm upload');
      }

      // Step 4: Poll for results
      onProgress?.('Processing image...');
      return await this.pollForResults(uploadData.job_id, onProgress);
    } catch (error) {
      console.error('[Nutrition API] Image analysis failed:', error);
      return null;
    }
  }

  /**
   * Poll for job completion
   */
  private async pollForResults(
    jobId: string,
    onProgress?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<NutritionAnalysisResult | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));

      const status = await this.checkStatus(jobId);
      if (!status) {
        continue;
      }

      if (status.status === 'completed') {
        onProgress?.('Analysis complete!');
        return await this.getResults(jobId);
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Analysis failed');
      }

      onProgress?.(`Processing... (${attempt + 1}/${maxAttempts})`);
    }

    throw new Error('Analysis timeout');
  }
}

// Export singleton instance
export const nutritionAnalysisAPI = new NutritionAnalysisAPI();
