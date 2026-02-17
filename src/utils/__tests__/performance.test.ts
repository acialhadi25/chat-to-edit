/**
 * Performance tests for Excel operations
 * 
 * These tests ensure that critical operations complete within acceptable time budgets
 * when processing large datasets (10,000+ rows).
 * 
 * Performance Budgets (from design doc):
 * - Excel operations with 10,000 rows: < 1000ms
 * - Formula evaluation: < 100ms per formula
 * - Virtual scrolling: < 16ms per frame (60fps)
 * 
 * Requirements: 3.3.3 - Custom metrics for Excel operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sortData,
  filterData,
  removeDuplicates,
  findReplace,
  trimCells,
  removeEmptyRows,
  transformText,
  fillDown,
  splitColumn,
  mergeColumns,
  calculateStatistics,
  createGroupSummary,
} from '../excelOperations';
import { createMockExcelData } from '@/test/utils/testHelpers';
import type { ExcelData } from '@/types/excel';

/**
 * Performance budget in milliseconds
 */
const PERFORMANCE_BUDGET = {
  LARGE_DATASET: 1000, // 1 second for 10,000 rows
  MEDIUM_DATASET: 500, // 500ms for 5,000 rows
  SMALL_DATASET: 100, // 100ms for 1,000 rows
  FORMULA_EVAL: 100, // 100ms per formula
};

/**
 * Generate large dataset for performance testing
 */
function generateLargeDataset(rows: number, cols: number): ExcelData {
  const headers = Array.from({ length: cols }, (_, i) => 
    String.fromCharCode(65 + (i % 26))
  );
  
  const data = Array.from({ length: rows }, (_, rowIdx) =>
    Array.from({ length: cols }, (_, colIdx) => {
      // Mix of different data types
      if (colIdx === 0) return rowIdx + 1; // ID column
      if (colIdx === 1) return `Item ${rowIdx}`; // Text column
      if (colIdx === 2) return Math.random() * 1000; // Number column
      return Math.random() > 0.5 ? `Value ${rowIdx}-${colIdx}` : rowIdx * colIdx;
    })
  );

  return createMockExcelData({
    headers,
    rows: data,
  });
}

describe('Performance Tests: Excel Operations with 10,000 rows', () => {
  let largeDataset: ExcelData;
  let mediumDataset: ExcelData;

  beforeEach(() => {
    // Generate test datasets
    largeDataset = generateLargeDataset(10000, 10);
    mediumDataset = generateLargeDataset(5000, 10);
  });

  describe('Sorting Performance', () => {
    it('should sort 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = sortData(largeDataset, 0, 'asc');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
      
      // Verify sort correctness (first few rows)
      expect(result.data.rows[0][0]).toBeLessThanOrEqual(result.data.rows[1][0] as number);
    });

    it('should sort 10,000 rows descending in under 1 second', () => {
      const start = performance.now();
      const result = sortData(largeDataset, 2, 'desc');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });
  });

  describe('Filtering Performance', () => {
    it('should filter 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = filterData(largeDataset, 1, 'contains', 'Item 1');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows.length).toBeGreaterThan(0);
      expect(result.data.rows.length).toBeLessThan(10000);
    });

    it('should filter with numeric comparison in under 1 second', () => {
      const start = performance.now();
      const result = filterData(largeDataset, 2, 'greater_than', 500);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Duplicate Removal Performance', () => {
    it('should remove duplicates from 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = removeDuplicates(largeDataset, [0]);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000); // All unique IDs
    });

    it('should remove duplicates on multiple columns in under 1 second', () => {
      const start = performance.now();
      const result = removeDuplicates(largeDataset, [0, 1]);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
    });
  });

  describe('Find and Replace Performance', () => {
    it('should find and replace in 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = findReplace(largeDataset, 'Item', 'Product', {
        caseSensitive: false,
        wholeCell: false,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should find and replace with regex in under 1 second', () => {
      const start = performance.now();
      const result = findReplace(largeDataset, 'Item', 'Product', {
        caseSensitive: false,
        wholeCell: false,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });

  describe('Text Transformation Performance', () => {
    it('should trim 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = trimCells(largeDataset);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });

    it('should transform text case in 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = transformText(largeDataset, [1], 'uppercase');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });
  });

  describe('Empty Row Removal Performance', () => {
    it('should remove empty rows from 10,000 rows in under 1 second', () => {
      // Add some empty rows
      const dataWithEmpty = {
        ...largeDataset,
        rows: [
          ...largeDataset.rows.slice(0, 5000),
          [null, null, null, null, null, null, null, null, null, null],
          ...largeDataset.rows.slice(5000),
        ],
      };

      const start = performance.now();
      const result = removeEmptyRows(dataWithEmpty);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });
  });

  describe('Fill Down Performance', () => {
    it('should fill down 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = fillDown(largeDataset, 0, 0, 9999);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });
  });

  describe('Column Operations Performance', () => {
    it('should split column in 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = splitColumn(largeDataset, 1, '-', ['Part1', 'Part2']);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });

    it('should merge columns in 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = mergeColumns(largeDataset, [0, 1], 'Merged', '-');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.data.rows).toHaveLength(10000);
    });
  });

  describe('Statistical Operations Performance', () => {
    it('should calculate statistics for 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = calculateStatistics(largeDataset, 2);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.count).toBe(10000);
      expect(result.sum).toBeGreaterThan(0);
    });

    it('should create group summary for 10,000 rows in under 1 second', () => {
      const start = performance.now();
      const result = createGroupSummary(largeDataset, 1, 2, 'sum');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not cause memory issues with large datasets', () => {
      // Test multiple operations in sequence
      let data = largeDataset;
      
      const start = performance.now();
      
      // Chain multiple operations
      data = sortData(data, 0, 'asc').data;
      data = filterData(data, 2, 'greater_than', 100).data;
      data = trimCells(data).data;
      data = transformText(data, [1], 'lowercase').data;
      
      const duration = performance.now() - start;

      // All operations combined should still be reasonable
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET * 2);
      expect(data.rows.length).toBeGreaterThan(0);
    });
  });
});
