/**
 * useUniverPerformance Hook
 * 
 * Provides performance optimization features including:
 * - Worker support for heavy computations
 * - Memoization for expensive operations
 * - Lazy loading for worksheets
 * - Performance monitoring
 * 
 * Requirements: Technical Requirements 3
 * @see https://docs.univer.ai/guides/sheets/features/core/worker
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { PerformanceService, performanceService } from '../services/performanceService';

interface UseUniverPerformanceOptions {
  enableWorker?: boolean;
  enableCaching?: boolean;
  cacheSize?: number;
  cacheTTL?: number;
}

interface UseUniverPerformanceReturn {
  isWorkerSupported: boolean;
  isWorkerEnabled: boolean;
  workerURL: Worker | undefined;
  cacheMetrics: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  clearCache: () => void;
  measurePerformance: <T>(name: string, func: () => Promise<T>) => Promise<T>;
}

/**
 * Hook for performance optimization features
 */
export function useUniverPerformance(
  options: UseUniverPerformanceOptions = {}
): UseUniverPerformanceReturn {
  const {
    enableWorker = true,
    enableCaching = true,
    cacheSize = 1000,
    cacheTTL = 5 * 60 * 1000,
  } = options;

  const [worker, setWorker] = useState<Worker | undefined>(undefined);
  const [isWorkerSupported] = useState(() => PerformanceService.supportsWorkers());

  // Initialize worker if supported and enabled
  useEffect(() => {
    if (!isWorkerSupported || !enableWorker) {
      return;
    }

    try {
      // Create worker instance
      const workerInstance = new Worker(
        new URL('../workers/univer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (e) => {
        console.log('[Univer Worker] Message:', e.data);
      };

      workerInstance.onerror = (error) => {
        console.error('[Univer Worker] Error:', error);
      };

      setWorker(workerInstance);

      console.log('[Performance] Worker initialized successfully');

      // Cleanup
      return () => {
        workerInstance.terminate();
        setWorker(undefined);
      };
    } catch (error) {
      console.error('[Performance] Failed to initialize worker:', error);
    }
  }, [isWorkerSupported, enableWorker]);

  // Cache metrics
  const cacheMetrics = useMemo(() => {
    if (!enableCaching) {
      return { hits: 0, misses: 0, hitRate: 0, size: 0 };
    }

    const metrics = performanceService.getMetrics();
    return {
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
      hitRate: performanceService.getCacheHitRate(),
      size: metrics.cacheSize,
    };
  }, [enableCaching]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (enableCaching) {
      performanceService.clear();
      console.log('[Performance] Cache cleared');
    }
  }, [enableCaching]);

  // Measure performance
  const measurePerformance = useCallback(
    async <T,>(name: string, func: () => Promise<T>): Promise<T> => {
      return PerformanceService.measureTime(name, func);
    },
    []
  );

  return {
    isWorkerSupported,
    isWorkerEnabled: enableWorker && isWorkerSupported && worker !== undefined,
    workerURL: worker,
    cacheMetrics,
    clearCache,
    measurePerformance,
  };
}

/**
 * Hook for lazy loading worksheets
 */
export function useLazyWorksheet(
  worksheetId: string,
  loader: () => Promise<any>
) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (data || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = performanceService.get(`worksheet:${worksheetId}`);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      // Load data
      const result = await loader();
      
      // Cache result
      performanceService.set(`worksheet:${worksheetId}`, result);
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load worksheet'));
    } finally {
      setIsLoading(false);
    }
  }, [worksheetId, loader, data, isLoading]);

  return {
    data,
    isLoading,
    error,
    load,
  };
}

/**
 * Hook for virtual scrolling support
 */
export function useVirtualScrolling(
  totalRows: number,
  rowHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / rowHeight)
    );

    // Add buffer for smooth scrolling
    const buffer = 5;
    const bufferedStart = Math.max(0, startIndex - buffer);
    const bufferedEnd = Math.min(totalRows, endIndex + buffer);

    return {
      start: bufferedStart,
      end: bufferedEnd,
      visibleStart: startIndex,
      visibleEnd: endIndex,
    };
  }, [scrollTop, rowHeight, containerHeight, totalRows]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return totalRows * rowHeight;
  }, [totalRows, rowHeight]);

  // Calculate offset for visible items
  const offsetY = useMemo(() => {
    return visibleRange.start * rowHeight;
  }, [visibleRange.start, rowHeight]);

  return {
    visibleRange,
    handleScroll,
    totalHeight,
    offsetY,
    scrollTop,
  };
}

/**
 * Hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useMemo(
    () => PerformanceService.throttle(callback, delay),
    [callback, delay]
  ) as T;
}

/**
 * Hook for memoized expensive computation
 */
export function useMemoizedComputation<T>(
  computation: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T {
  return useMemo(() => {
    if (cacheKey) {
      const cached = performanceService.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const result = computation();

    if (cacheKey) {
      performanceService.set(cacheKey, result);
    }

    return result;
  }, deps);
}
