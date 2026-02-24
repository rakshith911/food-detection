/**
 * Dedicated Delete Account OTP service.
 * Call your AWS service (e.g. API Gateway + Lambda or separate Cognito) to send
 * and verify delete-account codes. Configure in aws-config.ts (DeleteAccountOTP).
 */

import { Alert } from 'react-native';
import { awsConfig } from '../aws-config';

const CONFIG = awsConfig.DeleteAccountOTP;

export interface DeleteAccountOTPResult {
  sendSuccess: boolean;
  verifySuccess: boolean;
}

/**
 * Send delete-account verification code to the user's email via your API.
 * Expects API: POST {apiEndpoint}/send-delete-otp (or /send) with body: { email }
 */
export async function sendDeleteAccountOTPViaApi(email: string): Promise<boolean> {
  if (!CONFIG.enabled || !CONFIG.apiEndpoint?.trim()) {
    return false;
  }

  const base = CONFIG.apiEndpoint.replace(/\/$/, '');
  const path = (CONFIG as { sendPath?: string }).sendPath || '/send-delete-otp';
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (CONFIG.apiKey?.trim()) {
      headers['x-api-key'] = CONFIG.apiKey.trim();
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[DeleteAccountOTP] Send failed:', res.status, text);
      Alert.alert(
        'Error',
        'Failed to send verification code. Please try again.'
      );
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[DeleteAccountOTP] Send error:', error);
    Alert.alert(
      'Error',
      error?.message || 'Failed to send verification code. Please try again.'
    );
    return false;
  }
}

/**
 * Verify delete-account code via your API.
 * Expects API: POST {apiEndpoint}/verify-delete-otp (or /verify) with body: { email, code }
 */
export async function verifyDeleteAccountOTPViaApi(email: string, code: string): Promise<boolean> {
  if (!CONFIG.enabled || !CONFIG.apiEndpoint?.trim()) {
    return false;
  }

  const base = CONFIG.apiEndpoint.replace(/\/$/, '');
  const path = (CONFIG as { verifyPath?: string }).verifyPath || '/verify-delete-otp';
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (CONFIG.apiKey?.trim()) {
      headers['x-api-key'] = CONFIG.apiKey.trim();
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[DeleteAccountOTP] Verify failed:', res.status, text);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[DeleteAccountOTP] Verify error:', error);
    return false;
  }
}

export function isDeleteAccountOTPApiConfigured(): boolean {
  return !!(CONFIG.enabled && CONFIG.apiEndpoint?.trim());
}
