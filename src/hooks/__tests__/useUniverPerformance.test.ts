/**
 * useUniverPerformance Hook Tests
 * 
 * Tests for performance optimization hooks including:
 * - Worker initialization
 * - Cache management
 * - Lazy loading
 * - Virtual scrolling
 * - Debouncing and throttling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useUniverPerformance,
  useLazyWorksheet,
  useVirtualScrolling,
  useDebouncedValue,
  useThrottledCallback,
  useMemoizedComputation,
} from '../useUniverPerformance';
import { performanceService } from '../../services/performanceService';

// Mock Worker
global.Worker = class Worker {
  url: string;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;

  constructor(url: string | URL) {
    this.url = url.toString();
  }

  postMessage() {}
  terminate() {}
} as any;

describe('useUniverPerformance', () => {
  beforeEach(() => {
    performanceService.clear();
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useUniverPerformance());

    expect(result.current.isWorkerSupported).toBe(true);
    expect(result.current.cacheMetrics).toBeDefined();
    expect(result.current.clearCache).toBeInstanceOf(Function);
    expect(result.current.measurePerformance).toBeInstanceOf(Function);
  });

  it('should enable worker when supported', async () => {
    const { result } = renderHook(() =>
      useUniverPerformance({ enableWorker: true })
    );

    await waitFor(() => {
      expect(result.current.isWorkerEnabled).toBe(true);
    });
  });

  it('should disable worker when not enabled', () => {
    const { result } = renderHook(() =>
      useUniverPerformance({ enableWorker: false })
    );

    expect(result.current.isWorkerEnabled).toBe(false);
    expect(result.current.workerURL).toBeUndefined();
  });

  it('should provide cache metrics', () => {
    const { result } = renderHook(() =>
      useUniverPerformance({ enableCaching: true })
    );

    expect(result.current.cacheMetrics).toEqual({
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
    });
  });

  it('should clear cache', () => {
    const { result } = renderHook(() =>
      useUniverPerformance({ enableCaching: true })
    );

    performanceService.set('test-key', 'test-value');

    act(() => {
      result.current.clearCache();
    });

    expect(performanceService.get('test-key')).toBeNull();
  });

  it('should measure performance', async () => {
    const { result } = renderHook(() => useUniverPerformance());

    const consoleSpy = vi.spyOn(console, 'log');

    await act(async () => {
      await result.current.measurePerformance('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] test:')
    );
  });

  it('should cleanup worker on unmount', async () => {
    const { unmount } = renderHook(() =>
      useUniverPerformance({ enableWorker: true })
    );

    await waitFor(() => {
      // Worker should be initialized
    });

    unmount();

    // Worker should be terminated (no errors)
  });
});

describe('useLazyWorksheet', () => {
  beforeEach(() => {
    performanceService.clear();
  });

  it('should initialize with null data', () => {
    const loader = vi.fn().mockResolvedValue({ data: 'worksheet' });
    const { result } = renderHook(() =>
      useLazyWorksheet('sheet1', loader)
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load data on demand', async () => {
    const loader = vi.fn().mockResolvedValue({ data: 'worksheet' });
    const { result } = renderHook(() =>
      useLazyWorksheet('sheet1', loader)
    );

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.data).toEqual({ data: 'worksheet' });
    expect(result.current.isLoading).toBe(false);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('should cache loaded data', async () => {
    const loader = vi.fn().mockResolvedValue({ data: 'worksheet' });
    const { result } = renderHook(() =>
      useLazyWorksheet('sheet1', loader)
    );

    await act(async () => {
      await result.current.load();
    });

    // Load again
    await act(async () => {
      await result.current.load();
    });

    // Loader should only be called once (cached)
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('should handle loading errors', async () => {
    const error = new Error('Load failed');
    const loader = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() =>
      useLazyWorksheet('sheet1', loader)
    );

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it('should use cached data from previous load', async () => {
    const cachedData = { data: 'cached' };
    performanceService.set('worksheet:sheet1', cachedData);

    const loader = vi.fn().mockResolvedValue({ data: 'new' });
    const { result } = renderHook(() =>
      useLazyWorksheet('sheet1', loader)
    );

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.data).toEqual(cachedData);
    expect(loader).not.toHaveBeenCalled();
  });
});

describe('useVirtualScrolling', () => {
  it('should calculate visible range', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(1000, 30, 600)
    );

    expect(result.current.visibleRange.start).toBe(0);
    expect(result.current.visibleRange.end).toBeGreaterThan(0);
    expect(result.current.totalHeight).toBe(30000);
  });

  it('should update visible range on scroll', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(1000, 30, 600)
    );

    const scrollEvent = {
      target: { scrollTop: 300 },
    } as unknown as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(scrollEvent);
    });

    expect(result.current.scrollTop).toBe(300);
    expect(result.current.visibleRange.start).toBeGreaterThan(0);
  });

  it('should include buffer in visible range', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(1000, 30, 600)
    );

    // Scroll to middle to test buffer
    const scrollEvent = {
      target: { scrollTop: 300 },
    } as unknown as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(scrollEvent);
    });

    const { visibleRange } = result.current;

    // Buffer should extend range beyond visible area
    expect(visibleRange.start).toBeLessThan(visibleRange.visibleStart);
    expect(visibleRange.end).toBeGreaterThan(visibleRange.visibleEnd);
  });

  it('should calculate offset correctly', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(1000, 30, 600)
    );

    const scrollEvent = {
      target: { scrollTop: 300 },
    } as unknown as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(scrollEvent);
    });

    const expectedOffset = result.current.visibleRange.start * 30;
    expect(result.current.offsetY).toBe(expectedOffset);
  });

  it('should not exceed total rows', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(100, 30, 600)
    );

    const scrollEvent = {
      target: { scrollTop: 10000 }, // Scroll beyond end
    } as unknown as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(scrollEvent);
    });

    expect(result.current.visibleRange.end).toBeLessThanOrEqual(100);
  });
});

describe('useDebouncedValue', () => {
  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 100 });

    // Should still be initial immediately
    expect(result.current).toBe('initial');

    // Wait for debounce
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 200 }
    );
  });

  it('should reset timer on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'v1', delay: 100 } }
    );

    rerender({ value: 'v2', delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 50));
    rerender({ value: 'v3', delay: 100 });

    // Should still be v1
    expect(result.current).toBe('v1');

    // Wait for final debounce
    await waitFor(
      () => {
        expect(result.current).toBe('v3');
      },
      { timeout: 200 }
    );
  });
});

describe('useThrottledCallback', () => {
  it('should throttle callback execution', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(callback, 100)
    );

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    await new Promise(resolve => setTimeout(resolve, 150));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe('useMemoizedComputation', () => {
  it('should memoize computation result', () => {
    const computation = vi.fn(() => 'result');
    const { result, rerender } = renderHook(
      ({ deps }) => useMemoizedComputation(computation, deps),
      { initialProps: { deps: [1, 2] } }
    );

    expect(result.current).toBe('result');
    expect(computation).toHaveBeenCalledTimes(1);

    // Rerender with same deps
    rerender({ deps: [1, 2] });

    expect(computation).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should recompute when deps change', () => {
    const computation = vi.fn(() => 'result');
    const { rerender } = renderHook(
      ({ deps }) => useMemoizedComputation(computation, deps),
      { initialProps: { deps: [1, 2] } }
    );

    expect(computation).toHaveBeenCalledTimes(1);

    // Rerender with different deps
    rerender({ deps: [2, 3] });

    expect(computation).toHaveBeenCalledTimes(2);
  });

  it('should use cache when cache key provided', () => {
    performanceService.set('test-cache-key', 'cached-result');

    const computation = vi.fn(() => 'new-result');
    const { result } = renderHook(() =>
      useMemoizedComputation(computation, [], 'test-cache-key')
    );

    expect(result.current).toBe('cached-result');
    expect(computation).not.toHaveBeenCalled();
  });

  it('should cache result when cache key provided', () => {
    const computation = vi.fn(() => 'result');
    renderHook(() =>
      useMemoizedComputation(computation, [], 'new-cache-key')
    );

    expect(performanceService.get('new-cache-key')).toBe('result');
  });
});
