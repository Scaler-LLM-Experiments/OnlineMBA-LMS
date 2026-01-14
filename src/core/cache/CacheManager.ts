/**
 * Advanced Cache Manager
 * Implements intelligent caching with TTL, LRU eviction, and stale-while-revalidate
 */

import { CACHE_CONFIG, STORAGE_KEYS } from '../config/constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  stale: boolean;
}

interface CacheOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  persist?: boolean;
}

type CacheEventType = 'hit' | 'miss' | 'set' | 'delete' | 'clear' | 'evict';

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>>;
  private stats: CacheStats;
  private maxEntries: number;
  private defaultTTL: number;
  private listeners: Map<CacheEventType, Set<(key: string) => void>>;

  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, size: 0, evictions: 0 };
    this.maxEntries = CACHE_CONFIG.maxEntries;
    this.defaultTTL = CACHE_CONFIG.defaultTTL;
    this.listeners = new Map();

    // Initialize from localStorage if available
    this.loadFromStorage();

    // Periodically clean expired entries
    this.startCleanupInterval();
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      this.emit('miss', key);
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired && !CACHE_CONFIG.staleWhileRevalidate) {
      this.delete(key);
      this.stats.misses++;
      this.emit('miss', key);
      return null;
    }

    // Mark as stale if expired but still returning
    if (isExpired) {
      entry.stale = true;
    }

    this.stats.hits++;
    this.emit('hit', key);
    return entry.data;
  }

  /**
   * Check if entry is stale and needs revalidation
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const now = Date.now();
    return now - entry.timestamp > entry.ttl;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, persist = false } = options;

    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      stale: false,
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
    this.emit('set', key);

    // Persist to localStorage if requested
    if (persist) {
      this.persistEntry(key, entry);
    }
  }

  /**
   * Delete a specific entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
      this.emit('delete', key);
      this.removeFromStorage(key);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.emit('clear', '*');
    this.clearStorage();
  }

  /**
   * Clear entries matching a pattern
   */
  clearPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let cleared = 0;

    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired && !CACHE_CONFIG.staleWhileRevalidate) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    return { ...this.stats, hitRate };
  }

  /**
   * Get or set with async function
   * Implements stale-while-revalidate pattern
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);

    // Return cached value if exists and not stale
    if (cached !== null && !this.isStale(key)) {
      return cached;
    }

    // If stale but exists, return stale data and revalidate in background
    if (cached !== null && CACHE_CONFIG.staleWhileRevalidate) {
      // Revalidate in background
      this.revalidate(key, fetchFn, options);
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetchFn();
      this.set(key, data, options);
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      if (cached !== null) {
        return cached;
      }
      throw error;
    }
  }

  /**
   * Revalidate a cache entry in the background
   */
  private async revalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
    } catch {
      // Silent fail - keep stale data
    }
  }

  /**
   * Evict the oldest entry (LRU-like behavior)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      this.emit('evict', oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const isExpired = now - entry.timestamp > entry.ttl;
      if (isExpired && !CACHE_CONFIG.staleWhileRevalidate) {
        this.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Run cleanup every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Load persisted cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.cache);
      if (stored) {
        const entries = JSON.parse(stored) as Record<string, CacheEntry<unknown>>;
        const now = Date.now();

        for (const [key, entry] of Object.entries(entries)) {
          // Only load non-expired entries
          if (now - entry.timestamp <= entry.ttl) {
            this.cache.set(key, entry);
          }
        }

        this.stats.size = this.cache.size;
      }
    } catch {
      // Silent fail - start with empty cache
    }
  }

  /**
   * Persist a single entry to localStorage
   */
  private persistEntry<T>(key: string, entry: CacheEntry<T>): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.cache);
      const entries = stored ? JSON.parse(stored) : {};
      entries[key] = entry;
      localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(entries));
    } catch {
      // Silent fail - quota exceeded or storage unavailable
    }
  }

  /**
   * Remove entry from localStorage
   */
  private removeFromStorage(key: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.cache);
      if (stored) {
        const entries = JSON.parse(stored);
        delete entries[key];
        localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(entries));
      }
    } catch {
      // Silent fail
    }
  }

  /**
   * Clear all persisted cache
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.cache);
    } catch {
      // Silent fail
    }
  }

  /**
   * Add event listener
   */
  on(event: CacheEventType, callback: (key: string) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: CacheEventType, callback: (key: string) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: CacheEventType, key: string): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(key));
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export class for testing
export { CacheManager };

// Helper function to create cache keys
export function createCacheKey(
  namespace: string,
  ...parts: (string | number | undefined)[]
): string {
  const filteredParts = parts.filter((p) => p !== undefined);
  return `${namespace}:${filteredParts.join(':')}`;
}

// Predefined cache key namespaces
export const CacheKeys = {
  user: (userId: string) => createCacheKey('user', userId),
  userProfile: (email: string) => createCacheKey('user', 'profile', email),
  sessions: (batch: string, page?: number) => createCacheKey('sessions', batch, page),
  session: (sessionId: string) => createCacheKey('session', sessionId),
  recordings: (term: string, domain?: string) => createCacheKey('recordings', term, domain),
  announcements: (batch: string, page?: number) => createCacheKey('announcements', batch, page),
  resources: (category?: string, page?: number) => createCacheKey('resources', category, page),
  exams: (batch: string) => createCacheKey('exams', batch),
  exam: (examId: string) => createCacheKey('exam', examId),
  assignments: (batch: string) => createCacheKey('assignments', batch),
  assignment: (assignmentId: string) => createCacheKey('assignment', assignmentId),
  forms: (batch: string) => createCacheKey('forms', batch),
  form: (formId: string) => createCacheKey('form', formId),
  jobs: (page?: number) => createCacheKey('jobs', page),
  job: (jobId: string) => createCacheKey('job', jobId),
  calendar: (month: string) => createCacheKey('calendar', month),
  policies: () => createCacheKey('policies'),
  leaderboard: () => createCacheKey('leaderboard'),
  dashboard: (userId: string) => createCacheKey('dashboard', userId),
} as const;
