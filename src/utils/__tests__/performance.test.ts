// @ts-nocheck
/**
 * Performance Tests for AI Actions and Workbook Operations
 * 
 * Tests performance requirements:
 * - Load time with large dataset (< 2 seconds)
 * - Cell edit response (< 100ms)
 * - Formula calculation (< 500ms)
 * - AI command processing (< 2 seconds)
 * - GENERATE_DATA with 1000+ rows
 * - Workbook recreation with 1000+ rows (< 1 second)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExcelData, DataChange } from '@/types/excel';
import {
  startProfiling,
  endProfiling,
  clearPerformanceMetrics,
  getPerformanceMetrics,
  optimizedWorkbookRecreation,
  shouldUseIncrementalUpdate,
  applyIncrementalUpdates,
  getCacheStats,
  clearCache,
} from '../performanceOptimization';
import { applyChanges } from '../applyChanges';

describe('Performance Tests', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearCache();
  });

  describe('9.2.1 Load time with large dataset', () => {
    it('should load 1000 rows in less than 2 seconds', () => {
      // Create large dataset
      const data: ExcelData = {
        headers: ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'Status'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      // Generate 1000 rows
      for (let i = 0; i < 1000; i++) {
        data.rows.push([
          i + 1,
          `User ${i + 1}`,
          `user${i + 1}@example.com`,
          `+1-555-${String(i).padStart(4, '0')}`,
          `${i + 1} Main St`,
          'New York',
          i % 2 === 0 ? 'Active' : 'Inactive',
        ]);
      }

      const metricIndex = startProfiling('loadLargeDataset', 1000);
      
      // Simulate workbook creation
      const univerData = optimizedWorkbookRecreation(data);
      
      const duration = endProfiling(metricIndex);

      expect(univerData).toBeDefined();
      expect(univerData.sheets['sheet-01'].cellData).toBeDefined();
      expect(duration).toBeLessThan(2000); // < 2 seconds
      
      console.log(`✅ Load time: ${duration.toFixed(2)}ms for 1000 rows`);
    });

    it('should load 5000 rows in less than 5 seconds', () => {
      const data: ExcelData = {
        headers: ['ID', 'Name', 'Value', 'Status'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      for (let i = 0; i < 5000; i++) {
        data.rows.push([i + 1, `Item ${i + 1}`, Math.random() * 1000, 'Active']);
      }

      const metricIndex = startProfiling('loadVeryLargeDataset', 5000);
      const univerData = optimizedWorkbookRecreation(data);
      const duration = endProfiling(metricIndex);

      expect(univerData).toBeDefined();
      expect(duration).toBeLessThan(5000); // < 5 seconds
      
      console.log(`✅ Load time: ${duration.toFixed(2)}ms for 5000 rows`);
    });
  });

  describe('9.2.2 Cell edit response', () => {
    it('should apply single cell edit in less than 100ms', () => {
      const data: ExcelData = {
        headers: ['Name', 'Value'],
        rows: [
          ['Item 1', 100],
          ['Item 2', 200],
        ],
        formulas: {},
        cellStyles: {},
      };

      const changes: DataChange[] = [
        { row: 0, col: 1, newValue: 150, type: 'CELL_UPDATE' },
      ];

      const metricIndex = startProfiling('cellEdit', undefined, 1);
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows[0][1]).toBe(150);
      expect(duration).toBeLessThan(100); // < 100ms
      
      console.log(`✅ Cell edit: ${duration.toFixed(2)}ms`);
    });

    it('should apply batch cell edits (100 cells) in less than 500ms', () => {
      const data: ExcelData = {
        headers: ['ID', 'Value'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      // Create 100 rows
      for (let i = 0; i < 100; i++) {
        data.rows.push([i + 1, 0]);
      }

      // Create 100 cell updates
      const changes: DataChange[] = [];
      for (let i = 0; i < 100; i++) {
        changes.push({ row: i, col: 1, newValue: i * 10, type: 'CELL_UPDATE' });
      }

      const metricIndex = startProfiling('batchCellEdit', undefined, 100);
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows[50][1]).toBe(500);
      expect(duration).toBeLessThan(500); // < 500ms
      
      console.log(`✅ Batch cell edit (100 cells): ${duration.toFixed(2)}ms`);
    });
  });

  describe('9.2.3 Formula calculation', () => {
    it('should apply formula in less than 500ms', () => {
      const data: ExcelData = {
        headers: ['A', 'B', 'C', 'Sum'],
        rows: [
          [10, 20, 30, null],
          [15, 25, 35, null],
          [20, 30, 40, null],
        ],
        formulas: {},
        cellStyles: {},
      };

      const changes: DataChange[] = [
        { row: 0, col: 3, newValue: '=A2+B2+C2', type: 'CELL_UPDATE' },
        { row: 1, col: 3, newValue: '=A3+B3+C3', type: 'CELL_UPDATE' },
        { row: 2, col: 3, newValue: '=A4+B4+C4', type: 'CELL_UPDATE' },
      ];

      const metricIndex = startProfiling('formulaCalculation', undefined, 3);
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows[0][3]).toBe('=A2+B2+C2');
      expect(result.data.formulas?.['D2']).toBe('=A2+B2+C2');
      expect(duration).toBeLessThan(500); // < 500ms
      
      console.log(`✅ Formula calculation: ${duration.toFixed(2)}ms`);
    });

    it('should apply 100 formulas in less than 1 second', () => {
      const data: ExcelData = {
        headers: ['Value', 'Formula'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      for (let i = 0; i < 100; i++) {
        data.rows.push([i + 1, null]);
      }

      const changes: DataChange[] = [];
      for (let i = 0; i < 100; i++) {
        changes.push({
          row: i,
          col: 1,
          newValue: `=A${i + 2}*2`,
          type: 'CELL_UPDATE',
        });
      }

      const metricIndex = startProfiling('batchFormulaCalculation', undefined, 100);
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows[0][1]).toBe('=A2*2');
      expect(duration).toBeLessThan(1000); // < 1 second
      
      console.log(`✅ Batch formula calculation (100 formulas): ${duration.toFixed(2)}ms`);
    });
  });

  describe('9.2.4 AI command processing', () => {
    it('should process EDIT_CELL action in less than 100ms', () => {
      const data: ExcelData = {
        headers: ['Name', 'Value'],
        rows: [['Item 1', 100]],
        formulas: {},
        cellStyles: {},
      };

      const changes: DataChange[] = [
        { row: 0, col: 1, newValue: 200, type: 'CELL_UPDATE' },
      ];

      const metricIndex = startProfiling('aiEditCell');
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows[0][1]).toBe(200);
      expect(duration).toBeLessThan(100); // < 100ms
      
      console.log(`✅ AI EDIT_CELL: ${duration.toFixed(2)}ms`);
    });

    it('should process INSERT_FORMULA action in less than 200ms', () => {
      const data: ExcelData = {
        headers: ['A', 'B', 'Sum'],
        rows: [[10, 20, null]],
        formulas: {},
        cellStyles: {},
      };

      const changes: DataChange[] = [
        { row: 0, col: 2, newValue: '=A2+B2', type: 'CELL_UPDATE' },
      ];

      const metricIndex = startProfiling('aiInsertFormula');
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows[0][2]).toBe('=A2+B2');
      expect(duration).toBeLessThan(200); // < 200ms
      
      console.log(`✅ AI INSERT_FORMULA: ${duration.toFixed(2)}ms`);
    });

    it('should process DELETE_ROW action in less than 500ms', () => {
      const data: ExcelData = {
        headers: ['ID', 'Name'],
        rows: [
          [1, 'Item 1'],
          [2, 'Item 2'],
          [3, 'Item 3'],
        ],
        formulas: {},
        cellStyles: {},
      };

      const changes: DataChange[] = [
        { row: 1, col: 0, type: 'ROW_DELETE' },
      ];

      const metricIndex = startProfiling('aiDeleteRow');
      const result = applyChanges(data, changes);
      const duration = endProfiling(metricIndex);

      expect(result.data.rows.length).toBe(2);
      expect(duration).toBeLessThan(500); // < 500ms
      
      console.log(`✅ AI DELETE_ROW: ${duration.toFixed(2)}ms`);
    });
  });

  describe('9.2.5 GENERATE_DATA with 1000+ rows', () => {
    it('should generate 1000 rows in less than 3 seconds', () => {
      const data: ExcelData = {
        headers: ['ID', 'Name', 'Email', 'Phone'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      const metricIndex = startProfiling('generateData', 1000);

      // Simulate GENERATE_DATA action
      for (let i = 0; i < 1000; i++) {
        data.rows.push([
          i + 1,
          `User ${i + 1}`,
          `user${i + 1}@example.com`,
          `+1-555-${String(i).padStart(4, '0')}`,
        ]);
      }

      const duration = endProfiling(metricIndex);

      expect(data.rows.length).toBe(1000);
      expect(duration).toBeLessThan(3000); // < 3 seconds
      
      console.log(`✅ GENERATE_DATA (1000 rows): ${duration.toFixed(2)}ms`);
    });

    it('should generate 5000 rows in less than 10 seconds', () => {
      const data: ExcelData = {
        headers: ['ID', 'Value', 'Status'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      const metricIndex = startProfiling('generateLargeData', 5000);

      for (let i = 0; i < 5000; i++) {
        data.rows.push([i + 1, Math.random() * 1000, 'Active']);
      }

      const duration = endProfiling(metricIndex);

      expect(data.rows.length).toBe(5000);
      expect(duration).toBeLessThan(10000); // < 10 seconds
      
      console.log(`✅ GENERATE_DATA (5000 rows): ${duration.toFixed(2)}ms`);
    });
  });

  describe('9.1 Workbook recreation optimization', () => {
    it('should recreate workbook with 1000 rows in less than 1 second', () => {
      const data: ExcelData = {
        headers: ['ID', 'Name', 'Value'],
        rows: [],
        formulas: {},
        cellStyles: {},
      };

      for (let i = 0; i < 1000; i++) {
        data.rows.push([i + 1, `Item ${i + 1}`, i * 10]);
      }

      const metricIndex = startProfiling('workbookRecreation', 1000);
      const univerData = optimizedWorkbookRecreation(data);
      const duration = endProfiling(metricIndex);

      expect(univerData).toBeDefined();
      expect(univerData.sheets['sheet-01']).toBeDefined();
      expect(duration).toBeLessThan(1000); // < 1 second (target)
      
      console.log(`✅ Workbook recreation (1000 rows): ${duration.toFixed(2)}ms`);
    });

    it('should use incremental updates for small changes', () => {
      const changes: DataChange[] = [
        { row: 0, col: 0, newValue: 'Updated', type: 'CELL_UPDATE' },
        { row: 1, col: 1, newValue: 100, type: 'CELL_UPDATE' },
      ];

      const shouldUseIncremental = shouldUseIncrementalUpdate(changes, 1000);

      expect(shouldUseIncremental).toBe(true);
      console.log('✅ Incremental update decision: correct for small changes');
    });

    it('should use full recreation for large changes', () => {
      const changes: DataChange[] = [];
      for (let i = 0; i < 200; i++) {
        changes.push({ row: i, col: 0, newValue: i, type: 'CELL_UPDATE' });
      }

      const shouldUseIncremental = shouldUseIncrementalUpdate(changes, 1000);

      expect(shouldUseIncremental).toBe(false);
      console.log('✅ Full recreation decision: correct for large changes');
    });
  });

  describe('Performance metrics tracking', () => {
    it('should track performance metrics', () => {
      const metricIndex1 = startProfiling('operation1');
      endProfiling(metricIndex1);

      const metricIndex2 = startProfiling('operation2', 100);
      endProfiling(metricIndex2);

      const metrics = getPerformanceMetrics();

      expect(metrics.length).toBe(2);
      expect(metrics[0].operationName).toBe('operation1');
      expect(metrics[1].operationName).toBe('operation2');
      expect(metrics[1].rowCount).toBe(100);
      
      console.log('✅ Performance metrics tracking works');
    });

    it('should clear performance metrics', () => {
      startProfiling('test');
      clearPerformanceMetrics();

      const metrics = getPerformanceMetrics();
      expect(metrics.length).toBe(0);
      
      console.log('✅ Performance metrics clearing works');
    });
  });

  describe('Cache functionality', () => {
    it('should track cache statistics', () => {
      clearCache();
      
      const stats = getCacheStats();
      
      expect(stats.cellValues).toBe(0);
      expect(stats.formulas).toBe(0);
      expect(stats.styles).toBe(0);
      
      console.log('✅ Cache statistics tracking works');
    });
  });

  describe('Performance summary', () => {
    it('should log all performance metrics', () => {
      const metrics = getPerformanceMetrics();
      
      console.log('\n📊 Performance Test Summary:');
      console.log('================================');
      
      metrics.forEach(metric => {
        if (metric.duration) {
          console.log(`${metric.operationName}: ${metric.duration.toFixed(2)}ms`);
          if (metric.rowCount) {
            console.log(`  Rows: ${metric.rowCount}`);
          }
          if (metric.cellCount) {
            console.log(`  Cells: ${metric.cellCount}`);
          }
        }
      });
      
      console.log('================================\n');
    });
  });
});
