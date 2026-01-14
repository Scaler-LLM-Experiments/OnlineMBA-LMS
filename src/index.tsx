/**
 * Application Entry Point
 * Online MBA - Learning Management System
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './features/auth/hooks/useAuth';
import { STORAGE_KEYS, APP_CONFIG } from './core/config/constants';

// Import global styles
import './styles/globals.css';

// App version for cache busting
const APP_VERSION = APP_CONFIG.version;

// ============================================
// Service Worker Registration
// ============================================

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');

        // Check for updates periodically
        setInterval(() => registration.update(), 60000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Dispatch custom event for update notification
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        });
      } catch (error) {
        // Service worker registration failed silently
      }
    });

    // Handle controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  } else {
    // Unregister service workers in development
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
}

// ============================================
// Version Check and Cache Management
// ============================================

async function checkForUpdates() {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.version);

    if (storedVersion !== APP_VERSION) {
      localStorage.setItem(STORAGE_KEYS.version, APP_VERSION);

      // Clear caches on version update
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Reload if previous version existed
      if (storedVersion) {
        window.location.reload();
      }
    }
  } catch {
    // Silent fail
  }
}

// ============================================
// Performance Monitoring
// ============================================

function reportWebVitals(onPerfEntry?: (metric: unknown) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
}

// ============================================
// Initialize Application
// ============================================

// Register service worker
registerServiceWorker();

// Check for updates
checkForUpdates();

// Periodic update check in production
if (process.env.NODE_ENV === 'production') {
  setInterval(checkForUpdates, 60000);
}

// Mount application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Report web vitals in production
if (process.env.NODE_ENV === 'production') {
  reportWebVitals();
}
