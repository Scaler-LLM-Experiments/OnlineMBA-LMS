/**
 * Custom Hooks for API Operations
 * Provides reusable data fetching patterns with caching and error handling
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ApiResponse, LoadingState, PaginationParams, FilterParams, ApiMetadata } from '../types';
import { cacheManager } from '../cache/CacheManager';

// ============================================
// Types
// ============================================

interface UseApiOptions<T> {
  /** Initial data before fetch */
  initialData?: T;
  /** Cache key for storing results */
  cacheKey?: string;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Whether to fetch immediately */
  immediate?: boolean;
  /** Dependencies that trigger refetch */
  deps?: unknown[];
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Transform response data */
  transform?: (data: unknown) => T;
  /** Skip fetching entirely */
  skip?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  status: LoadingState;
  refetch: () => Promise<void>;
  mutate: (data: T | ((prev: T | null) => T)) => void;
  reset: () => void;
}

interface UsePaginatedApiOptions<T> extends UseApiOptions<T[]> {
  pageSize?: number;
}

interface UsePaginatedApiResult<T> extends UseApiResult<T[]> {
  pagination: PaginationParams & ApiMetadata;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setPageSize: (size: number) => void;
}

// ============================================
// useApi Hook
// ============================================

/**
 * Generic hook for API calls with caching and error handling
 */
export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    initialData,
    cacheKey,
    cacheTTL,
    immediate = true,
    deps = [],
    onSuccess,
    onError,
    transform,
    skip = false,
  } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetch = useCallback(async () => {
    if (skip) return;

    // Check cache first
    if (cacheKey) {
      const cached = cacheManager.get<T>(cacheKey);
      if (cached && !cacheManager.isStale(cacheKey)) {
        setData(cached);
        setStatus('success');
        return;
      }
    }

    // Abort previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setStatus('loading');
    setError(null);

    try {
      const response = await fetcher();

      if (!isMounted.current) return;

      if (response.success && response.data !== undefined) {
        const transformedData = transform ? transform(response.data) : response.data;
        setData(transformedData);
        setStatus('success');

        // Cache the result
        if (cacheKey) {
          cacheManager.set(cacheKey, transformedData, { ttl: cacheTTL });
        }

        onSuccess?.(transformedData);
      } else {
        throw new Error(response.error || 'Request failed');
      }
    } catch (err) {
      if (!isMounted.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error');

      // Don't set error for aborted requests
      if (error.name === 'AbortError') return;

      setError(error);
      setStatus('error');
      onError?.(error);
    }
  }, [fetcher, cacheKey, cacheTTL, skip, transform, onSuccess, onError]);

  // Fetch on mount and when deps change
  useEffect(() => {
    if (immediate) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, skip, ...deps]);

  const refetch = useCallback(async () => {
    // Invalidate cache
    if (cacheKey) {
      cacheManager.delete(cacheKey);
    }
    await fetch();
  }, [fetch, cacheKey]);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setData((prev) => {
      const updated = typeof newData === 'function'
        ? (newData as (prev: T | null) => T)(prev)
        : newData;

      // Update cache
      if (cacheKey) {
        cacheManager.set(cacheKey, updated, { ttl: cacheTTL });
      }

      return updated;
    });
  }, [cacheKey, cacheTTL]);

  const reset = useCallback(() => {
    setData(initialData ?? null);
    setError(null);
    setStatus('idle');
    if (cacheKey) {
      cacheManager.delete(cacheKey);
    }
  }, [initialData, cacheKey]);

  return {
    data,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    status,
    refetch,
    mutate,
    reset,
  };
}

// ============================================
// usePaginatedApi Hook
// ============================================

/**
 * Hook for paginated API calls with infinite scroll support
 */
export function usePaginatedApi<T>(
  fetcher: (params: PaginationParams & FilterParams) => Promise<ApiResponse<T[]>>,
  options: UsePaginatedApiOptions<T> = {}
): UsePaginatedApiResult<T> {
  const { pageSize: initialPageSize = 20, ...apiOptions } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [metadata, setMetadata] = useState<ApiMetadata>({});
  const [allData, setAllData] = useState<T[]>([]);

  const paginatedFetcher = useCallback(async () => {
    const response = await fetcher({ page, pageSize });
    if (response.metadata) {
      setMetadata(response.metadata);
    }
    return response;
  }, [fetcher, page, pageSize]);

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    status,
    refetch,
    reset: baseReset,
  } = useApi(paginatedFetcher, {
    ...apiOptions,
    deps: [page, pageSize, ...(apiOptions.deps || [])],
    onSuccess: (newData) => {
      if (page === 1) {
        setAllData(newData);
      } else {
        setAllData((prev) => [...prev, ...newData]);
      }
      apiOptions.onSuccess?.(newData);
    },
  });

  const hasMore = useMemo(() => {
    if (metadata.totalPages) {
      return page < metadata.totalPages;
    }
    if (metadata.hasMore !== undefined) {
      return metadata.hasMore;
    }
    return (data?.length || 0) === pageSize;
  }, [page, pageSize, metadata, data]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  const goToPage = useCallback(async (newPage: number) => {
    setPage(newPage);
    setAllData([]); // Reset data for non-infinite pagination
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setMetadata({});
    baseReset();
  }, [baseReset]);

  const mutate = useCallback((newData: T[] | ((prev: T[] | null) => T[])) => {
    setAllData((prev) => {
      const updated = typeof newData === 'function'
        ? (newData as (prev: T[] | null) => T[])(prev)
        : newData;
      return updated;
    });
  }, []);

  return {
    data: allData,
    error,
    isLoading,
    isError,
    isSuccess,
    status,
    refetch,
    mutate,
    reset,
    pagination: {
      page,
      pageSize,
      ...metadata,
    },
    hasMore,
    loadMore,
    goToPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
      setAllData([]);
    },
  };
}

// ============================================
// useMutation Hook
// ============================================

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | null, error: Error | null, variables: V) => void;
  invalidateKeys?: string[];
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  mutateAsync: (variables: V) => Promise<T>;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

/**
 * Hook for mutation operations (create, update, delete)
 */
export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<ApiResponse<T>>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, onSettled, invalidateKeys } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const mutateAsync = useCallback(async (variables: V): Promise<T> => {
    setStatus('loading');
    setError(null);

    try {
      const response = await mutationFn(variables);

      if (response.success && response.data !== undefined) {
        setData(response.data);
        setStatus('success');

        // Invalidate cache keys
        if (invalidateKeys) {
          invalidateKeys.forEach((key) => cacheManager.clearPattern(key));
        }

        onSuccess?.(response.data, variables);
        onSettled?.(response.data, null, variables);

        return response.data;
      } else {
        throw new Error(response.error || 'Mutation failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setStatus('error');
      onError?.(error, variables);
      onSettled?.(null, error, variables);
      throw error;
    }
  }, [mutationFn, invalidateKeys, onSuccess, onError, onSettled]);

  const mutate = useCallback((variables: V) => {
    mutateAsync(variables).catch(() => {
      // Error is handled in mutateAsync
    });
    return mutateAsync(variables);
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    reset,
  };
}

// ============================================
// useInfiniteQuery Hook
// ============================================

interface UseInfiniteQueryOptions<T> {
  cacheKey?: string;
  pageSize?: number;
  getNextPageParam?: (lastPage: T[], pages: T[][]) => number | undefined;
}

/**
 * Hook for infinite scroll queries
 */
export function useInfiniteQuery<T>(
  fetcher: (page: number, pageSize: number) => Promise<ApiResponse<T[]>>,
  options: UseInfiniteQueryOptions<T> = {}
): {
  data: T[];
  pages: T[][];
  error: Error | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const { pageSize = 20, getNextPageParam } = options;

  const [pages, setPages] = useState<T[][]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPage = useCallback(async (page: number, isInitial: boolean) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const response = await fetcher(page, pageSize);

      if (!isMounted.current) return;

      if (response.success && response.data) {
        setPages((prev) => (isInitial ? [response.data!] : [...prev, response.data!]));
        setCurrentPage(page);

        // Determine if there are more pages
        if (getNextPageParam) {
          const allPages = isInitial ? [response.data] : [...pages, response.data];
          const nextPage = getNextPageParam(response.data, allPages);
          setHasNextPage(nextPage !== undefined);
        } else {
          setHasNextPage(response.data.length === pageSize);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch page');
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    }
  }, [fetcher, pageSize, getNextPageParam, pages]);

  // Initial fetch
  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isLoading || isFetchingMore) return;
    await fetchPage(currentPage + 1, false);
  }, [fetchPage, currentPage, hasNextPage, isLoading, isFetchingMore]);

  const refetch = useCallback(async () => {
    setPages([]);
    setCurrentPage(1);
    setHasNextPage(true);
    await fetchPage(1, true);
  }, [fetchPage]);

  const data = useMemo(() => pages.flat(), [pages]);

  return {
    data,
    pages,
    error,
    isLoading,
    isFetchingMore,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}

export default useApi;
