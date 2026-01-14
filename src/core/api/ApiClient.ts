/**
 * API Client
 * Centralized HTTP client with caching, retry logic, and error handling
 */

import { API_CONFIG } from '../config/constants';
import { ApiResponse, ApiError, PaginationParams, FilterParams } from '../types';
import { cacheManager, createCacheKey } from '../cache/CacheManager';

// ============================================
// Types
// ============================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  retries?: number;
  signal?: AbortSignal;
}

interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  execute: () => Promise<unknown>;
}

// ============================================
// Request Queue for Deduplication
// ============================================

const pendingRequests = new Map<string, Promise<unknown>>();

function getRequestKey(url: string, config: RequestConfig): string {
  return `${config.method || 'GET'}:${url}:${JSON.stringify(config.body || {})}`;
}

// ============================================
// API Client Class
// ============================================

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private maxConcurrent = 6;
  private activeRequests = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'text/plain', // Required for Google Apps Script CORS
    };
  }

  /**
   * Make an HTTP request
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'POST', // Google Apps Script typically uses POST
      body,
      headers = {},
      timeout = API_CONFIG.timeout,
      cache = false,
      cacheTTL,
      cacheKey,
      retries = API_CONFIG.retryAttempts,
      signal,
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const requestKey = getRequestKey(url, config);

    // Check cache first for GET-like requests
    if (cache && method === 'POST' && body && typeof body === 'object' && 'action' in body) {
      const action = (body as Record<string, unknown>).action;
      const cacheKeyToUse = cacheKey || createCacheKey('api', url, String(action));

      const cached = cacheManager.get<ApiResponse<T>>(cacheKeyToUse);
      if (cached && !cacheManager.isStale(cacheKeyToUse)) {
        return cached;
      }
    }

    // Deduplicate concurrent identical requests
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            ...this.defaultHeaders,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new ApiClientError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            'HTTP_ERROR'
          );
        }

        const data = await response.json();

        // Handle Google Apps Script response format
        const result: ApiResponse<T> = {
          success: data.success ?? true,
          data: data.data ?? data,
          error: data.error,
          message: data.message,
          metadata: data.metadata,
        };

        // Cache successful responses
        if (cache && result.success && method === 'POST') {
          const action = body && typeof body === 'object' && 'action' in body
            ? (body as Record<string, unknown>).action
            : undefined;
          const cacheKeyToUse = cacheKey || createCacheKey('api', url, String(action));
          cacheManager.set(cacheKeyToUse, result, { ttl: cacheTTL });
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof ApiClientError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new ApiClientError('Request timeout', 408, 'TIMEOUT');
          }
          throw new ApiClientError(error.message, 0, 'NETWORK_ERROR');
        }

        throw new ApiClientError('Unknown error occurred', 0, 'UNKNOWN');
      }
    };

    // Create promise with retry logic
    const requestPromise = this.withRetry(executeRequest, retries);

    // Store pending request for deduplication
    pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      pendingRequests.delete(requestKey);
    }
  }

  /**
   * Retry wrapper
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number = API_CONFIG.retryDelay
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      // Don't retry on client errors (4xx)
      if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Make a request to Google Apps Script backend
   * This is the primary method for this LMS which uses GAS
   */
  async action<T>(
    action: string,
    params: Record<string, unknown> = {},
    config: Omit<RequestConfig, 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('', {
      ...config,
      method: 'POST',
      body: { action, ...params },
    });
  }

  /**
   * Batch multiple actions into a single request
   */
  async batchActions<T extends unknown[]>(
    actions: Array<{ action: string; params?: Record<string, unknown> }>,
    config: Omit<RequestConfig, 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('', {
      ...config,
      method: 'POST',
      body: {
        action: 'batch',
        requests: actions,
      },
    });
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(pattern: string | RegExp): void {
    cacheManager.clearPattern(pattern);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    cacheManager.clear();
  }
}

// ============================================
// Custom Error Class
// ============================================

export class ApiClientError extends Error implements ApiError {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ============================================
// API Client Instances
// ============================================

// Main backend client
export const mainApi = new ApiClient(API_CONFIG.mainBackend);

// Exam backend client
export const examApi = new ApiClient(API_CONFIG.examBackend);

// Assignment backend client
export const assignmentApi = new ApiClient(API_CONFIG.assignmentBackend);

// Placement backend client
export const placementApi = new ApiClient(API_CONFIG.placementBackend);

// ============================================
// Helper Functions
// ============================================

/**
 * Build query string from params
 */
export function buildQueryParams(
  pagination?: PaginationParams,
  filters?: FilterParams
): Record<string, string | number | undefined> {
  return {
    ...pagination,
    ...filters,
  };
}

/**
 * Create abort controller with cleanup
 */
export function createAbortController(
  timeoutMs?: number
): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;

  if (timeoutMs) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  return {
    controller,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

// Export default main API client
export default mainApi;
