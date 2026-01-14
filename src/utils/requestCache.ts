/**
 * Request Cache Utility
 * Prevents duplicate API requests by caching in-flight and recent requests
 * Helps avoid 429 rate limiting errors, especially in React StrictMode development
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
  data?: T;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_DURATION = 1000; // 1 second cache for completed requests
  private readonly DEDUP_DURATION = 5000; // 5 seconds for in-flight request deduplication

  /**
   * Generate a cache key from URL and parameters
   */
  private getCacheKey(url: string, params?: Record<string, any>): string {
    const sortedParams = params
      ? Object.keys(params).sort().map(key => `${key}=${JSON.stringify(params[key])}`).join('&')
      : '';
    return `${url}?${sortedParams}`;
  }

  /**
   * Execute a request with caching and deduplication
   */
  async fetch<T>(
    url: string,
    params?: Record<string, any>,
    fetcher?: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, params);
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached) {
      // If we have completed data and it's still fresh
      if (cached.data && (now - cached.timestamp) < this.CACHE_DURATION) {
        console.log(`[RequestCache] Returning cached data for ${url}`);
        return cached.data;
      }

      // If there's an in-flight request, wait for it
      if (!cached.data && (now - cached.timestamp) < this.DEDUP_DURATION) {
        console.log(`[RequestCache] Waiting for in-flight request ${url}`);
        return cached.promise;
      }
    }

    // No cache or expired - make new request
    if (!fetcher) {
      throw new Error('Fetcher function required for new requests');
    }

    console.log(`[RequestCache] Making new request to ${url}`);

    const promise = fetcher()
      .then(data => {
        // Update cache with completed data
        this.cache.set(cacheKey, {
          promise,
          timestamp: Date.now(),
          data
        });
        return data;
      })
      .catch(error => {
        // Remove failed requests from cache
        this.cache.delete(cacheKey);
        throw error;
      });

    // Store in-flight request
    this.cache.set(cacheKey, {
      promise,
      timestamp: now
    });

    return promise;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific URL
   */
  clearUrl(url: string, params?: Record<string, any>): void {
    const cacheKey = this.getCacheKey(url, params);
    this.cache.delete(cacheKey);
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.DEDUP_DURATION) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Auto-clear expired entries every 10 seconds
if (typeof window !== 'undefined') {
  setInterval(() => requestCache.clearExpired(), 10000);
}
