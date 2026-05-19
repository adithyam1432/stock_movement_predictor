/**
 * API configuration utilities for native Android and Web platforms.
 */

export const isNativePlatform = () => {
  return typeof window !== 'undefined' && (!!window.Capacitor || !!window.androidBridge);
};

export const getApiBaseUrl = () => {
  if (!isNativePlatform()) {
    // Relative path for standard web browser proxy / unified domain hosting
    return '';
  }
  // For Android emulator/device, fetch dynamic user-configured URL or fallback to emulator host address
  return localStorage.getItem('quantedge_api_url') || 'http://10.0.2.2:8000';
};

export const setApiBaseUrl = (url) => {
  if (url) {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    localStorage.setItem('quantedge_api_url', cleanUrl);
  }
};
