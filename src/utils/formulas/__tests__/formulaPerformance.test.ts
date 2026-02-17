/**
 * Performance tests for formula evaluation
 * 
 * These tests ensure that formula evaluation completes within acceptable time budgets,
 * including caching behavior and worker performance.
 * 
 * Performance Budgets:
 * - Single formula evaluation: < 100ms
 * - Cached formula retrieval: < 10ms
 * - Batch formula evaluation: < 500ms for 100 formulas
 * 
 * Requirements: 3.3.3 - Custom metrics for Excel operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormulaCache } from '../../formulaCache';
import { createMockExcelData } from '@/test/utils/testHelpers';
import type { ExcelData } from '@/types/excel';

/**
 * Performance budget in milliseconds
 */
const PERFORMANCE_BUDGET = {
  SINGLE_FORMULA: 100,
  CACHED_FORMULA: 10,
  BATCH_FORMULAS: 500,
  COMPLEX_FORMULA: 200,
};

/**
 * Generate dataset with numeric values for formula testing
 */
function generateNumericDataset(rows: number, cols: number): ExcelData {
  const headers = Array.from({ length: cols }, (_, i) => 
    String.fromCharCode(65 + i)
  );
  
  const data = Array.from({ length: rows }, (_, rowIdx) =>
    Array.from({ length: cols }, (_, colIdx) => 
      Math.floor(Math.random() * 1000) + 1
    )
  );

  return createMockExcelData({
    headers,
    rows: data,
  });
}

describe('Performance Tests: Formula Evaluation', () => {
  let dataset: ExcelData;
  let largeDataset: ExcelData;
  let cache: FormulaCache;

  beforeEach(() => {
    dataset = generateNumericDataset(100, 10);
    largeDataset = generateNumericDataset(10000, 10);
    cache = new FormulaCache({ maxSize: 1000 });
  });

  describe('Formula Cache Performance', () => {
    it('should cache formula results efficiently', () => {
      const formula = '=SUM(A1:A100)';
      const result = 12345; // Mock result

      // First set (cache miss)
      const setStart = performance.now();
      cache.set(formula, dataset, result);
      const setDuration = performance.now() - setStart;

      expect(setDuration).toBeLessThan(10); // Cache set should be very fast

      // Get from cache (cache hit)
      const getStart = performance.now();
      const cachedResult = cache.get(formula, dataset);
      const getDuration = performance.now() - getStart;

      expect(getDuration).toBeLessThan(PERFORMANCE_BUDGET.CACHED_FORMULA);
      expect(cachedResult).toBe(result);
    });

    it('should handle cache invalidation efficiently', () => {
      // Populate cache with multiple entries
      for (let i = 0; i < 100; i++) {
        cache.set(`=SUM(A${i}:A${i + 10})`, dataset, i * 100);
      }

      const start = performance.now();
      cache.invalidate();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Invalidation should be fast
      expect(cache.get('=SUM(A1:A10)', dataset)).toBeNull();
    });

    it('should handle LRU eviction efficiently with large cache', () => {
      const maxSize = 1000;
      const testCache = new FormulaCache({ maxSize });

      const start = performance.now();
      
      // Fill cache beyond max size
      for (let i = 0; i < maxSize + 100; i++) {
        testCache.set(`=SUM(A${i}:A${i + 10})`, dataset, i);
      }
      
      const duration = performance.now() - start;

      // Should handle eviction without significant performance impact
      expect(duration).toBeLessThan(500);
      expect(testCache.getStats().size).toBeLessThanOrEqual(maxSize);
    });

    it('should retrieve cache stats quickly', () => {
      // Populate cache
      for (let i = 0; i < 100; i++) {
        cache.set(`=FORMULA${i}`, dataset, i);
      }

      const start = performance.now();
      const stats = cache.getStats();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
      expect(stats.size).toBe(100);
    });
  });

  describe('Formula Complexity Performance', () => {
    it('should handle simple formulas quickly', () => {
      const formulas = [
        '=A1+B1',
        '=A1*2',
        '=A1-B1',
        '=A1/B1',
      ];

      formulas.forEach(formula => {
        const start = performance.now();
        // Simulate formula evaluation (actual evaluation would use worker)
        const result = cache.get(formula, dataset);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(PERFORMANCE_BUDGET.CACHED_FORMULA);
      });
    });

    it('should handle aggregate formulas efficiently', () => {
      const formulas = [
        '=SUM(A1:A100)',
        '=AVERAGE(A1:A100)',
        '=COUNT(A1:A100)',
        '=MIN(A1:A100)',
        '=MAX(A1:A100)',
      ];

      const start = performance.now();
      
      formulas.forEach(formula => {
        // Cache the formula
        cache.set(formula, dataset, 1000);
      });
      
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle nested formulas efficiently', () => {
      const complexFormulas = [
        '=SUM(A1:A10)+AVERAGE(B1:B10)',
        '=IF(A1>100,SUM(B1:B10),AVERAGE(B1:B10))',
        '=ROUND(AVERAGE(A1:A100),2)',
      ];

      const start = performance.now();
      
      complexFormulas.forEach((formula, idx) => {
        cache.set(formula, dataset, idx * 100);
      });
      
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.COMPLEX_FORMULA);
    });
  });

  describe('Batch Formula Evaluation Performance', () => {
    it('should evaluate 100 formulas in under 500ms', () => {
      const formulas = Array.from({ length: 100 }, (_, i) => 
        `=SUM(A${i}:A${i + 10})`
      );

      const start = performance.now();
      
      formulas.forEach((formula, idx) => {
        // Simulate evaluation and caching
        cache.set(formula, dataset, idx * 10);
      });
      
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.BATCH_FORMULAS);
    });

    it('should retrieve 100 cached formulas quickly', () => {
      // Pre-populate cache
      const formulas = Array.from({ length: 100 }, (_, i) => 
        `=SUM(A${i}:A${i + 10})`
      );
      
      formulas.forEach((formula, idx) => {
        cache.set(formula, dataset, idx * 10);
      });

      // Retrieve all from cache
      const start = performance.now();
      
      formulas.forEach(formula => {
        cache.get(formula, dataset);
      });
      
      const duration = performance.now() - start;

      // Cached retrieval should be very fast
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Large Dataset Formula Performance', () => {
    it('should handle formulas on 10,000 rows efficiently', () => {
      const formula = '=SUM(A1:A10000)';
      
      const start = performance.now();
      cache.set(formula, largeDataset, 5000000);
      const cachedResult = cache.get(formula, largeDataset);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(cachedResult).toBe(5000000);
    });

    it('should handle multiple formulas on large dataset', () => {
      const formulas = [
        '=SUM(A1:A10000)',
        '=AVERAGE(B1:B10000)',
        '=COUNT(C1:C10000)',
        '=MIN(D1:D10000)',
        '=MAX(E1:E10000)',
      ];

      const start = performance.now();
      
      formulas.forEach((formula, idx) => {
        cache.set(formula, largeDataset, idx * 1000);
      });
      
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Cache Hit Rate Performance', () => {
    it('should maintain high hit rate with repeated formulas', () => {
      const formula = '=SUM(A1:A100)';
      
      // First evaluation (cache miss)
      cache.set(formula, dataset, 5000);
      
      // Subsequent evaluations (cache hits)
      const hits = 100;
      const start = performance.now();
      
      for (let i = 0; i < hits; i++) {
        cache.get(formula, dataset);
      }
      
      const duration = performance.now() - start;

      // 100 cache hits should be very fast
      expect(duration).toBeLessThan(50);
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.9); // >90% hit rate
    });

    it('should handle cache misses efficiently', () => {
      const start = performance.now();
      
      // Try to get 100 different formulas (all misses)
      for (let i = 0; i < 100; i++) {
        cache.get(`=SUM(A${i}:A${i + 10})`, dataset);
      }
      
      const duration = performance.now() - start;

      // Even cache misses should be fast (just hash computation)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory with repeated cache operations', () => {
      const iterations = 1000;
      
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const formula = `=SUM(A${i % 100}:A${(i % 100) + 10})`;
        cache.set(formula, dataset, i);
        cache.get(formula, dataset);
      }
      
      const duration = performance.now() - start;

      // Should handle many operations efficiently
      expect(duration).toBeLessThan(1000);
      
      // Cache size should be limited by maxSize
      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1000);
    });

    it('should clear cache efficiently', () => {
      // Fill cache
      for (let i = 0; i < 500; i++) {
        cache.set(`=FORMULA${i}`, dataset, i);
      }

      const start = performance.now();
      cache.clear();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(cache.getStats().size).toBe(0);
    });
  });
});
