/**
 * Safe Effect Hooks
 * Handles proper cleanup to prevent memory leaks
 */

import {
  useEffect,
  useCallback,
  useRef,
  useState,
  DependencyList,
} from 'react';

// ============================================
// useIsMounted Hook
// ============================================

/**
 * Returns a function that returns whether the component is still mounted
 * Use this to prevent state updates on unmounted components
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

// ============================================
// useSafeState Hook
// ============================================

/**
 * Like useState but only updates if component is still mounted
 */
export function useSafeState<T>(
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const isMounted = useIsMounted();
  const [state, setState] = useState(initialValue);

  const safeSetState = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (isMounted()) {
        setState(value);
      }
    },
    [isMounted]
  );

  return [state, safeSetState];
}

// ============================================
// useSafeAsync Hook
// ============================================

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Handles async operations safely with automatic cleanup
 */
export function useSafeAsync<T>() {
  const isMounted = useIsMounted();
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const run = useCallback(
    async (asyncFn: () => Promise<T>) => {
      if (!isMounted()) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await asyncFn();
        if (isMounted()) {
          setState({ data, error: null, isLoading: false });
        }
        return data;
      } catch (error) {
        if (isMounted()) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error'),
            isLoading: false,
          });
        }
        throw error;
      }
    },
    [isMounted]
  );

  const reset = useCallback(() => {
    if (isMounted()) {
      setState({ data: null, error: null, isLoading: false });
    }
  }, [isMounted]);

  return { ...state, run, reset };
}

// ============================================
// useInterval Hook
// ============================================

/**
 * setInterval with automatic cleanup and dynamic delay
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ============================================
// useTimeout Hook
// ============================================

/**
 * setTimeout with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

// ============================================
// useDebounce Hook
// ============================================

/**
 * Debounce a value with cleanup
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// useDebouncedCallback Hook
// ============================================

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// ============================================
// useThrottle Hook
// ============================================

/**
 * Throttle a value
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// ============================================
// useEventListener Hook
// ============================================

/**
 * Add event listener with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | HTMLElement | null,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element ?? window;
    if (!targetElement?.addEventListener) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    targetElement.addEventListener(eventName, eventListener, options);
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

// ============================================
// useOnClickOutside Hook
// ============================================

/**
 * Detect clicks outside an element
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ============================================
// useAbortController Hook
// ============================================

/**
 * Create and manage AbortController with automatic cleanup
 */
export function useAbortController(): {
  signal: AbortSignal;
  abort: () => void;
  reset: () => AbortController;
} {
  const controllerRef = useRef<AbortController>(new AbortController());

  const abort = useCallback(() => {
    controllerRef.current.abort();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current = new AbortController();
    return controllerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current.abort();
    };
  }, []);

  return {
    signal: controllerRef.current.signal,
    abort,
    reset,
  };
}

// ============================================
// useEffectOnce Hook
// ============================================

/**
 * Run an effect only once on mount
 */
export function useEffectOnce(effect: () => void | (() => void)): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}

// ============================================
// useUpdateEffect Hook
// ============================================

/**
 * Run an effect only on updates, not on mount
 */
export function useUpdateEffect(
  effect: () => void | (() => void),
  deps: DependencyList
): void {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================
// usePrevious Hook
// ============================================

/**
 * Get the previous value of a variable
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================
// useLatest Hook
// ============================================

/**
 * Get a ref that always has the latest value
 */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export default useIsMounted;
