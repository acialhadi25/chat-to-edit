/**
 * Unit tests for FormulaCache
 * 
 * Tests the LRU cache implementation for formula evaluation results,
 * including cache hits/misses, eviction, invalidation, and statistics.
 * 
 * Requirements: 3.2.2 - Formula result caching for repeated calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaCache } from '../formulaCache';
import type { ExcelData } from '@/types/excel';

/**
 * Helper function to create mock Excel data
 */
function createMockExcelData(overrides?: Partial<ExcelData>): ExcelData {
  return {
    fileName: 'test.xlsx',
    sheets: ['Sheet1'],
    currentSheet: 'Sheet1',
    headers: ['A', 'B', 'C'],
    rows: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    ...overrides,
  };
}

describe('FormulaCache', () => {
  let cache: FormulaCache;
  let mockData: ExcelData;

  beforeEach(() => {
    cache = new FormulaCache({ maxSize: 3, ttl: 1000 });
    mockData = createMockExcelData();
  });

  describe('Basic caching', () => {
    it('should return null for cache miss', () => {
      const result = cache.get('=SUM(A1:A3)', mockData);
      expect(result).toBeNull();
    });

    it('should cache and retrieve a formula result', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      const result = cache.get('=SUM(A1:A3)', mockData);
      expect(result).toBe(6);
    });

    it('should cache string results', () => {
      cache.set('=CONCATENATE(A1,B1)', mockData, 'Hello World');
      const result = cache.get('=CONCATENATE(A1,B1)', mockData);
      expect(result).toBe('Hello World');
    });

    it('should cache null results', () => {
      cache.set('=IF(FALSE,1,)', mockData, null);
      const result = cache.get('=IF(FALSE,1,)', mockData);
      expect(result).toBeNull();
    });

    it('should differentiate between different formulas', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);

      expect(cache.get('=SUM(A1:A3)', mockData)).toBe(6);
      expect(cache.get('=AVERAGE(A1:A3)', mockData)).toBe(2);
    });

    it('should differentiate between different data', () => {
      const data1 = createMockExcelData({ rows: [[1, 2, 3]] });
      const data2 = createMockExcelData({ rows: [[4, 5, 6]] });

      cache.set('=SUM(A1:C1)', data1, 6);
      cache.set('=SUM(A1:C1)', data2, 15);

      expect(cache.get('=SUM(A1:C1)', data1)).toBe(6);
      expect(cache.get('=SUM(A1:C1)', data2)).toBe(15);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      // Fill cache to capacity (3 entries)
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);
      cache.set('=COUNT(A1:A3)', mockData, 3);

      // Access first entry to make it recently used
      cache.get('=SUM(A1:A3)', mockData);

      // Add new entry, should evict AVERAGE (least recently used)
      cache.set('=MAX(A1:A3)', mockData, 3);

      expect(cache.get('=SUM(A1:A3)', mockData)).toBe(6); // Still cached
      expect(cache.get('=AVERAGE(A1:A3)', mockData)).toBeNull(); // Evicted
      expect(cache.get('=COUNT(A1:A3)', mockData)).toBe(3); // Still cached
      expect(cache.get('=MAX(A1:A3)', mockData)).toBe(3); // Newly added
    });

    it('should update access order on cache hit', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);
      cache.set('=COUNT(A1:A3)', mockData, 3);

      // Access SUM to make it most recently used
      cache.get('=SUM(A1:A3)', mockData);
      cache.get('=SUM(A1:A3)', mockData);

      // Add new entry, should evict AVERAGE
      cache.set('=MAX(A1:A3)', mockData, 3);

      expect(cache.get('=SUM(A1:A3)', mockData)).toBe(6);
      expect(cache.get('=AVERAGE(A1:A3)', mockData)).toBeNull();
    });

    it('should not evict when updating existing entry', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);
      cache.set('=COUNT(A1:A3)', mockData, 3);

      // Update existing entry (same formula and data)
      cache.set('=SUM(A1:A3)', mockData, 10);

      const stats = cache.getStats();
      expect(stats.size).toBe(3); // No eviction
      expect(cache.get('=SUM(A1:A3)', mockData)).toBe(10);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate all entries on invalidate()', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);

      cache.invalidate();

      // After invalidation, cache keys change due to version increment
      expect(cache.get('=SUM(A1:A3)', mockData)).toBeNull();
      expect(cache.get('=AVERAGE(A1:A3)', mockData)).toBeNull();
    });

    it('should allow new entries after invalidation', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.invalidate();

      cache.set('=SUM(A1:A3)', mockData, 10);
      expect(cache.get('=SUM(A1:A3)', mockData)).toBe(10);
    });

    it('should increment data version on invalidation', () => {
      const stats1 = cache.getStats();
      cache.invalidate();
      const stats2 = cache.getStats();

      expect(stats2.dataVersion).toBe(stats1.dataVersion + 1);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      vi.useFakeTimers();

      cache.set('=SUM(A1:A3)', mockData, 6);

      // Advance time past TTL (1000ms)
      vi.advanceTimersByTime(1001);

      expect(cache.get('=SUM(A1:A3)', mockData)).toBeNull();

      vi.useRealTimers();
    });

    it('should not expire entries before TTL', () => {
      vi.useFakeTimers();

      cache.set('=SUM(A1:A3)', mockData, 6);

      // Advance time but not past TTL
      vi.advanceTimersByTime(500);

      expect(cache.get('=SUM(A1:A3)', mockData)).toBe(6);

      vi.useRealTimers();
    });
  });

  describe('Cache statistics', () => {
    it('should track cache size', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
    });

    it('should calculate hit rate', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);

      // First get is not a hit (it's the initial set)
      cache.get('=SUM(A1:A3)', mockData); // Hit 1
      cache.get('=SUM(A1:A3)', mockData); // Hit 2
      cache.get('=SUM(A1:A3)', mockData); // Hit 3

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should track data version', () => {
      const stats1 = cache.getStats();
      expect(stats1.dataVersion).toBe(0);

      cache.invalidate();
      const stats2 = cache.getStats();
      expect(stats2.dataVersion).toBe(1);
    });
  });

  describe('Clear cache', () => {
    it('should clear all entries', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);
      cache.set('=AVERAGE(A1:A3)', mockData, 2);

      cache.clear();

      expect(cache.get('=SUM(A1:A3)', mockData)).toBeNull();
      expect(cache.get('=AVERAGE(A1:A3)', mockData)).toBeNull();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Data hash generation', () => {
    it('should generate different hashes for different row counts', () => {
      const data1 = createMockExcelData({ rows: [[1, 2, 3]] });
      const data2 = createMockExcelData({ rows: [[1, 2, 3], [4, 5, 6]] });

      cache.set('=SUM(A1:A3)', data1, 6);
      cache.set('=SUM(A1:A3)', data2, 15);

      expect(cache.get('=SUM(A1:A3)', data1)).toBe(6);
      expect(cache.get('=SUM(A1:A3)', data2)).toBe(15);
    });

    it('should generate different hashes for different column counts', () => {
      const data1 = createMockExcelData({ headers: ['A', 'B'] });
      const data2 = createMockExcelData({ headers: ['A', 'B', 'C', 'D'] });

      cache.set('=COUNT(A1:Z1)', data1, 2);
      cache.set('=COUNT(A1:Z1)', data2, 4);

      expect(cache.get('=COUNT(A1:Z1)', data1)).toBe(2);
      expect(cache.get('=COUNT(A1:Z1)', data2)).toBe(4);
    });

    it('should generate different hashes for different sheet names', () => {
      const data1 = createMockExcelData({ currentSheet: 'Sheet1' });
      const data2 = createMockExcelData({ currentSheet: 'Sheet2' });

      cache.set('=SUM(A1:A3)', data1, 6);
      cache.set('=SUM(A1:A3)', data2, 15);

      expect(cache.get('=SUM(A1:A3)', data1)).toBe(6);
      expect(cache.get('=SUM(A1:A3)', data2)).toBe(15);
    });

    it('should generate different hashes for different cell values', () => {
      const data1 = createMockExcelData({ rows: [[1, 2, 3]] });
      const data2 = createMockExcelData({ rows: [[10, 20, 30]] });

      cache.set('=SUM(A1:C1)', data1, 6);
      cache.set('=SUM(A1:C1)', data2, 60);

      expect(cache.get('=SUM(A1:C1)', data1)).toBe(6);
      expect(cache.get('=SUM(A1:C1)', data2)).toBe(60);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data', () => {
      const emptyData = createMockExcelData({ rows: [], headers: [] });
      cache.set('=SUM(A1:A3)', emptyData, 0);
      expect(cache.get('=SUM(A1:A3)', emptyData)).toBe(0);
    });

    it('should handle very long formulas', () => {
      const longFormula = '=SUM(' + 'A1:A100,'.repeat(100) + 'A1:A100)';
      cache.set(longFormula, mockData, 1000);
      expect(cache.get(longFormula, mockData)).toBe(1000);
    });

    it('should handle cache with size 1', () => {
      const smallCache = new FormulaCache({ maxSize: 1 });
      smallCache.set('=SUM(A1:A3)', mockData, 6);
      smallCache.set('=AVERAGE(A1:A3)', mockData, 2);

      expect(smallCache.get('=SUM(A1:A3)', mockData)).toBeNull();
      expect(smallCache.get('=AVERAGE(A1:A3)', mockData)).toBe(2);
    });

    it('should handle concurrent access to same formula', () => {
      cache.set('=SUM(A1:A3)', mockData, 6);

      // Multiple gets should all return the same value
      const results = [
        cache.get('=SUM(A1:A3)', mockData),
        cache.get('=SUM(A1:A3)', mockData),
        cache.get('=SUM(A1:A3)', mockData),
      ];

      expect(results).toEqual([6, 6, 6]);
    });
  });
});
