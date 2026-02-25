/**
 * Performance Service Tests
 * 
 * Tests for performance optimization utilities including:
 * - Caching with TTL
 * - Debouncing and throttling
 * - Memoization
 * - Batch operations
 * - Memory management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceService, performanceService } from '../performanceService';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = new PerformanceService({
      maxSize: 10,
      ttl: 1000, // 1 second for testing
    });
  });

  describe('Cache Operations', () => {
    it('should store and retrieve values', () => {
      service.set('key1', 'value1');
      expect(service.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('should handle different data types', () => {
      service.set('string', 'hello');
      service.set('number', 42);
      service.set('boolean', true);
      service.set('object', { foo: 'bar' });
      service.set('array', [1, 2, 3]);

      expect(service.get('string')).toBe('hello');
      expect(service.get('number')).toBe(42);
      expect(service.get('boolean')).toBe(true);
      expect(service.get('object')).toEqual({ foo: 'bar' });
      expect(service.get('array')).toEqual([1, 2, 3]);
    });

    it('should clear all cache entries', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      
      service.clear();
      
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.getMetrics().cacheSize).toBe(0);
    });

    it('should delete specific keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      
      const deleted = service.delete('key1');
      
      expect(deleted).toBe(true);
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBe('value2');
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = service.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      service.set('key1', 'value1');
      
      // Should be available immediately
      expect(service.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      expect(service.get('key1')).toBeNull();
    });

    it('should not expire entries before TTL', async () => {
      service.set('key1', 'value1');
      
      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should still be available
      expect(service.get('key1')).toBe('value1');
    });
  });

  describe('Cache Eviction', () => {
    it('should evict least used entry when cache is full', () => {
      // Fill cache to max size
      for (let i = 0; i < 10; i++) {
        service.set(`key${i}`, `value${i}`);
      }

      // Access some keys to increase hit count
      service.get('key5');
      service.get('key5');
      service.get('key7');

      // Add one more entry (should evict least used)
      service.set('key10', 'value10');

      // key10 should be in cache
      expect(service.get('key10')).toBe('value10');
      
      // One of the least used keys should be evicted
      const metrics = service.getMetrics();
      expect(metrics.cacheSize).toBe(10);
    });
  });

  describe('Metrics', () => {
    it('should track cache hits and misses', () => {
      service.set('key1', 'value1');
      
      // Hit
      service.get('key1');
      
      // Miss
      service.get('nonexistent');
      
      const metrics = service.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      service.set('key1', 'value1');
      
      service.get('key1'); // hit
      service.get('key1'); // hit
      service.get('nonexistent'); // miss
      
      const hitRate = service.getCacheHitRate();
      expect(hitRate).toBeCloseTo(2 / 3);
    });

    it('should return 0 hit rate when no accesses', () => {
      const hitRate = service.getCacheHitRate();
      expect(hitRate).toBe(0);
    });

    it('should track cache size', () => {
      expect(service.getMetrics().cacheSize).toBe(0);
      
      service.set('key1', 'value1');
      expect(service.getMetrics().cacheSize).toBe(1);
      
      service.set('key2', 'value2');
      expect(service.getMetrics().cacheSize).toBe(2);
      
      service.delete('key1');
      expect(service.getMetrics().cacheSize).toBe(1);
    });
  });

  describe('Static Utilities', () => {
    describe('debounce', () => {
      it('should debounce function calls', async () => {
        const fn = vi.fn();
        const debounced = PerformanceService.debounce(fn, 100);

        debounced();
        debounced();
        debounced();

        expect(fn).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 150));

        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('should reset timer on each call', async () => {
        const fn = vi.fn();
        const debounced = PerformanceService.debounce(fn, 100);

        debounced();
        await new Promise(resolve => setTimeout(resolve, 50));
        debounced();
        await new Promise(resolve => setTimeout(resolve, 50));
        debounced();

        expect(fn).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 150));

        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    describe('throttle', () => {
      it('should throttle function calls', async () => {
        const fn = vi.fn();
        const throttled = PerformanceService.throttle(fn, 100);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 150));

        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });

    describe('memoize', () => {
      it('should memoize function results', () => {
        const fn = vi.fn((a: number, b: number) => a + b);
        const memoized = PerformanceService.memoize(fn);

        expect(memoized(1, 2)).toBe(3);
        expect(memoized(1, 2)).toBe(3);
        expect(memoized(2, 3)).toBe(5);

        expect(fn).toHaveBeenCalledTimes(2); // Only called for unique args
      });

      it('should use custom key generator', () => {
        const fn = vi.fn((obj: { a: number; b: number }) => obj.a + obj.b);
        const memoized = PerformanceService.memoize(
          fn,
          (obj) => `${obj.a}-${obj.b}`
        );

        expect(memoized({ a: 1, b: 2 })).toBe(3);
        expect(memoized({ a: 1, b: 2 })).toBe(3);

        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    describe('batch', () => {
      it('should process items in batches', async () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const batches: number[][] = [];

        await PerformanceService.batch(items, 3, async (batch) => {
          batches.push(batch);
        });

        expect(batches).toEqual([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          [10],
        ]);
      });

      it('should process batches sequentially', async () => {
        const items = [1, 2, 3, 4];
        const order: number[] = [];

        await PerformanceService.batch(items, 2, async (batch) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push(...batch);
        });

        expect(order).toEqual([1, 2, 3, 4]);
      });
    });

    describe('measureTime', () => {
      it('should measure execution time', async () => {
        const consoleSpy = vi.spyOn(console, 'log');

        await PerformanceService.measureTime('test', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'result';
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Performance] test:')
        );
      });

      it('should return function result', async () => {
        const result = await PerformanceService.measureTime('test', async () => {
          return 42;
        });

        expect(result).toBe(42);
      });
    });

    describe('shouldCache', () => {
      it('should return true for small values', () => {
        const smallValue = { foo: 'bar' };
        expect(PerformanceService.shouldCache(smallValue)).toBe(true);
      });

      it('should return false for large values', () => {
        const largeValue = { data: 'x'.repeat(2 * 1024 * 1024) };
        expect(PerformanceService.shouldCache(largeValue)).toBe(false);
      });

      it('should use custom max size', () => {
        const value = { data: 'x'.repeat(100) };
        expect(PerformanceService.shouldCache(value, 50)).toBe(false);
      });
    });

    describe('optimizeWorkbookData', () => {
      it('should remove empty cells', () => {
        const data: any = {
          sheets: {
            sheet1: {
              cellData: {
                0: {
                  0: { v: '' },
                  1: { v: null },
                  2: { v: undefined },
                },
                1: {
                  0: { v: 'data' },
                },
              },
            },
          },
        };

        const optimized = PerformanceService.optimizeWorkbookData(data);

        expect(optimized.sheets.sheet1.cellData[0]).toBeUndefined();
        expect(optimized.sheets.sheet1.cellData[1]).toBeDefined();
      });
    });

    describe('estimateMemoryUsage', () => {
      it('should estimate memory usage', () => {
        const data = { foo: 'bar', baz: 123 };
        const size = PerformanceService.estimateMemoryUsage(data);
        
        expect(size).toBeGreaterThan(0);
      });
    });

    describe('supportsWorkers', () => {
      it('should check worker support', () => {
        const supported = PerformanceService.supportsWorkers();
        expect(typeof supported).toBe('boolean');
      });
    });

    describe('shouldOptimize', () => {
      it('should return true for large datasets', () => {
        expect(PerformanceService.shouldOptimize(2000)).toBe(true);
      });

      it('should return false for small datasets', () => {
        expect(PerformanceService.shouldOptimize(500)).toBe(false);
      });

      it('should use custom threshold', () => {
        expect(PerformanceService.shouldOptimize(500, 400)).toBe(true);
        expect(PerformanceService.shouldOptimize(300, 400)).toBe(false);
      });
    });
  });

  describe('Global Instance', () => {
    it('should provide global instance', () => {
      expect(performanceService).toBeInstanceOf(PerformanceService);
    });

    it('should be usable across modules', () => {
      performanceService.set('global-key', 'global-value');
      expect(performanceService.get('global-key')).toBe('global-value');
    });
  });
});
