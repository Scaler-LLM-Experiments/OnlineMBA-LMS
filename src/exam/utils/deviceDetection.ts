/**
 * Device Detection Utility
 * Detects the type of device the user is on
 */

export type DeviceType = 'Laptop/Computer' | 'Mobile/Tab' | 'Unknown';

/**
 * Detect the current device type
 * @returns The detected device type
 */
export function detectDeviceType(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  // Check if it's a mobile or tablet device
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

  // Additional checks for tablets that might identify as desktop
  const isLargeScreen = window.screen.width >= 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Specific OS checks
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isWindows = /win/.test(platform);
  const isMac = /mac/.test(platform);
  const isLinux = /linux/.test(platform) && !isAndroid;

  // Determine device type
  if (isIOS && !isTablet) {
    // iPhone
    return 'Mobile/Tab';
  } else if (isIOS && isTablet) {
    // iPad
    return 'Mobile/Tab';
  } else if (isAndroid && isMobile && !isTablet) {
    // Android phone
    return 'Mobile/Tab';
  } else if (isAndroid && (isTablet || isLargeScreen)) {
    // Android tablet
    return 'Mobile/Tab';
  } else if (isMobile || (isTouchDevice && !isLargeScreen)) {
    // Other mobile devices
    return 'Mobile/Tab';
  } else if (isWindows || isMac || isLinux) {
    // Desktop/Laptop
    return 'Laptop/Computer';
  }

  // Default to unknown
  return 'Unknown';
}

/**
 * Get detailed device information
 * @returns Detailed device information object
 */
export function getDeviceInfo() {
  const deviceType = detectDeviceType();
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detect OS
  let os = 'Unknown';
  if (/win/i.test(platform)) {
    os = 'Windows';
  } else if (/mac/i.test(platform) && !/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(platform) && !/android/i.test(userAgent)) {
    os = 'Linux';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  }

  // Detect browser
  let browser = 'Unknown';
  if (/edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/opera|opr/i.test(userAgent)) {
    browser = 'Opera';
  }

  return {
    deviceType,
    os,
    browser,
    platform,
    userAgent,
    screenWidth,
    screenHeight,
    isTouchDevice,
  };
}

/**
 * Check if the current device is allowed based on exam restrictions
 * @param allowedDevice The device restriction from the exam
 * @returns True if device is allowed, false otherwise
 */
export function isDeviceAllowed(allowedDevice: string): boolean {
  if (!allowedDevice || allowedDevice === 'All') {
    return true;
  }

  const currentDevice = detectDeviceType();

  // If device detection failed
  if (currentDevice === 'Unknown') {
    // Allow access but log a warning
    console.warn('Unable to detect device type accurately');
    return true; // Be permissive on unknown devices
  }

  // Check if current device matches the allowed device
  return currentDevice === allowedDevice;
}

/**
 * Get a user-friendly device name
 * @returns User-friendly device name
 */
export function getDeviceName(): string {
  const info = getDeviceInfo();

  if (info.deviceType === 'Laptop/Computer') {
    return `${info.os} ${info.deviceType}`;
  } else if (info.deviceType === 'Mobile/Tab') {
    if (info.os === 'iOS') {
      if (info.screenWidth >= 768) {
        return 'iPad';
      } else {
        return 'iPhone';
      }
    } else if (info.os === 'Android') {
      if (info.screenWidth >= 768) {
        return 'Android Tablet';
      } else {
        return 'Android Phone';
      }
    }
    return `${info.os} Mobile Device`;
  }

  return 'Unknown Device';
}
