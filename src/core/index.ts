/**
 * Core Module Exports
 * Central export point for all core functionality
 */

// Configuration
export * from './config/constants';
export * from './config/theme';

// Types
export * from './types';

// API
export { mainApi, examApi, assignmentApi, placementApi, ApiClientError } from './api/ApiClient';

// Cache
export { cacheManager, CacheKeys, createCacheKey } from './cache/CacheManager';

// Hooks
export * from './hooks/useApi';
export * from './hooks/useSafeEffect';

// Errors
export { ErrorBoundary, withErrorBoundary, RouteErrorBoundary, FeatureErrorBoundary } from './errors/ErrorBoundary';

// Utils
export * from './utils/sanitize';
