/**
 * Exam Session Utility
 * Handles session verification, device fingerprinting, and geolocation
 */

import { getDeviceInfo } from './deviceDetection';

// Session storage key prefix
const SESSION_KEY_PREFIX = 'exam_session_';

export interface DeviceFingerprint {
  deviceType: string;
  os: string;
  browser: string;
  browserVersion: string;
  userAgent: string;
  screenResolution: string;
  deviceHash: string;
}

export interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  accuracy: number | null;
  error?: string;
}

export interface SessionData {
  examId: string;
  studentEmail: string;
  sessionToken: string;
  deviceHash: string;
  verifiedAt: string;
  expiresAt: string;
}

/**
 * Get browser version from user agent
 */
export function getBrowserVersion(): string {
  const userAgent = navigator.userAgent;

  // Chrome
  const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
  if (chromeMatch && !/Edg/.test(userAgent)) {
    return chromeMatch[1];
  }

  // Edge
  const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
  if (edgeMatch) {
    return edgeMatch[1];
  }

  // Firefox
  const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
  if (firefoxMatch) {
    return firefoxMatch[1];
  }

  // Safari
  const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
  if (safariMatch && /Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    return safariMatch[1];
  }

  // Opera
  const operaMatch = userAgent.match(/OPR\/(\d+\.\d+\.\d+\.\d+)/);
  if (operaMatch) {
    return operaMatch[1];
  }

  return 'Unknown';
}

/**
 * Generate a simple hash from a string
 * Uses a basic hashing algorithm for client-side fingerprinting
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and ensure positive
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate device fingerprint for session verification
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const deviceInfo = getDeviceInfo();
  const browserVersion = getBrowserVersion();
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Create a fingerprint string from device characteristics
  const fingerprintString = [
    deviceInfo.browser,
    browserVersion,
    deviceInfo.os,
    screenResolution,
    deviceInfo.platform,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');

  // Generate hash
  const deviceHash = simpleHash(fingerprintString);

  return {
    deviceType: deviceInfo.deviceType,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    browserVersion,
    userAgent: deviceInfo.userAgent,
    screenResolution,
    deviceHash
  };
}

/**
 * Get user's geolocation using browser API
 * Returns precise location if user grants permission
 */
export function getGeolocation(): Promise<GeolocationData> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        city: null,
        country: null,
        accuracy: null,
        error: 'Geolocation not supported'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Try to get city/country from reverse geocoding
        let city: string | null = null;
        let country: string | null = null;

        try {
          // Use a free reverse geocoding API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (response.ok) {
            const data = await response.json();
            city = data.address?.city || data.address?.town || data.address?.village || null;
            country = data.address?.country || null;
          }
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
        }

        resolve({
          latitude,
          longitude,
          city,
          country,
          accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied geolocation permission';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Geolocation request timed out';
            break;
        }

        resolve({
          latitude: null,
          longitude: null,
          city: null,
          country: null,
          accuracy: null,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Get user's IP address using a free API
 */
export async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    console.warn('Failed to get IP address:', error);
  }
  return 'Unknown';
}

/**
 * Store session data in sessionStorage
 */
export function storeSession(sessionData: SessionData): void {
  const key = `${SESSION_KEY_PREFIX}${sessionData.examId}`;
  sessionStorage.setItem(key, JSON.stringify(sessionData));
}

/**
 * Get session data from sessionStorage
 */
export function getStoredSession(examId: string): SessionData | null {
  const key = `${SESSION_KEY_PREFIX}${examId}`;
  const data = sessionStorage.getItem(key);
  if (!data) return null;

  try {
    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Clear session data from sessionStorage
 */
export function clearSession(examId: string): void {
  const key = `${SESSION_KEY_PREFIX}${examId}`;
  sessionStorage.removeItem(key);
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid(examId: string): boolean {
  const session = getStoredSession(examId);
  if (!session) return false;

  const now = new Date().getTime();
  const expiresAt = new Date(session.expiresAt).getTime();

  return now < expiresAt;
}

/**
 * Collect all device info for session creation
 */
export async function collectDeviceInfo(): Promise<{
  fingerprint: DeviceFingerprint;
  geolocation: GeolocationData;
  ipAddress: string;
}> {
  const fingerprint = generateDeviceFingerprint();

  // Collect geolocation and IP in parallel
  const [geolocation, ipAddress] = await Promise.all([
    getGeolocation(),
    getIPAddress()
  ]);

  return {
    fingerprint,
    geolocation,
    ipAddress
  };
}
