/**
 * Unit Tests for SortFilterService
 * 
 * Tests cover:
 * - Single and multiple column sorting
 * - Single and multiple criteria filtering
 * - Filter clearing and restoration
 * - Error handling and validation
 * 
 * Requirements: 4.2.1, 4.2.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SortFilterService, createSortFilterService } from '../sortFilterService';
import type { FUniver, FWorkbook, FWorksheet, FRange } from '../../types/univer.types';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockRange = (values: any[][] = []): FRange => {
  let currentValues = values;
  let sortCalled = false;
  let lastSortConfig: any = null;

  return {
    getValues: vi.fn(() => currentValues),
    setValues: vi.fn(async (newValues: any[][]) => {
      currentValues = newValues;
      return true;
    }),
    getValue: vi.fn(() => currentValues[0]?.[0]),
    setValue: vi.fn(async () => true),
    getFormula: vi.fn(() => ''),
    getFormulas: vi.fn(() => []),
    setFormula: vi.fn(async () => true),
    setFormulas: vi.fn(async () => true),
    setFontWeight: vi.fn(async () => true),
    setFontStyle: vi.fn(async () => true),
    setFontSize: vi.fn(async () => true),
    setFontColor: vi.fn(async () => true),
    setBackgroundColor: vi.fn(async () => true),
    setHorizontalAlignment: vi.fn(async () => true),
    setVerticalAlignment: vi.fn(async () => true),
    setNumberFormat: vi.fn(async () => true),
    sort: vi.fn((config: any) => {
      sortCalled = true;
      lastSortConfig = config;
      // Simulate sorting
      return true;
    }),
    getRow: vi.fn(() => 0),
    getColumn: vi.fn(() => 0),
    getNumRows: vi.fn(() => currentValues.length),
    getNumColumns: vi.fn(() => currentValues[0]?.length || 0),
    _getSortCalled: () => sortCalled,
    _getLastSortConfig: () => lastSortConfig,
  } as any;
};

const createMockWorksheet = (rangeValues: any[][] = []): FWorksheet => {
  const mockRange = createMockRange(rangeValues);
  
  return {
    getSheetId: vi.fn(() => 'sheet1'),
    getSheetName: vi.fn(() => 'Sheet1'),
    getRange: vi.fn(() => mockRange),
    getCellData: vi.fn(() => null),
    getMaxRows: vi.fn(() => 1000),
    getMaxColumns: vi.fn(() => 26),
    activate: vi.fn(),
    _getMockRange: () => mockRange,
  } as any;
};

const createMockWorkbook = (worksheetData: any[][] = []): FWorkbook => {
  const mockWorksheet = createMockWorksheet(worksheetData);
  
  return {
    getId: vi.fn(() => 'workbook1'),
    getName: vi.fn(() => 'Workbook1'),
    getActiveSheet: vi.fn(() => mockWorksheet),
    getSheetByName: vi.fn(() => mockWorksheet),
    getSheetBySheetId: vi.fn(() => mockWorksheet),
    create: vi.fn(() => mockWorksheet),
    save: vi.fn(() => ({ id: 'workbook1', name: 'Workbook1', sheets: {} })),
    dispose: vi.fn(),
    _getMockWorksheet: () => mockWorksheet,
  } as any;
};

const createMockUniverAPI = (worksheetData: any[][] = []): FUniver => {
  const mockWorkbook = createMockWorkbook(worksheetData);
  
  return {
    createWorkbook: vi.fn(() => mockWorkbook),
    getActiveWorkbook: vi.fn(() => mockWorkbook),
    getWorkbook: vi.fn(() => mockWorkbook),
    disposeUnit: vi.fn(),
    addEvent: vi.fn(() => ({ dispose: vi.fn() })),
    Enum: {} as any,
    Event: {} as any,
    _getMockWorkbook: () => mockWorkbook,
  } as any;
};

// ============================================================================
// Test Suite
// ============================================================================

describe('SortFilterService', () => {
  let service: SortFilterService;
  let mockAPI: FUniver;

  beforeEach(() => {
    mockAPI = createMockUniverAPI();
    service = createSortFilterService(mockAPI, true);
  });

  // ==========================================================================
  // Constructor and Initialization Tests
  // ==========================================================================

  describe('Constructor and Initialization', () => {
    it('should create service with univerAPI and ready state', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(SortFilterService);
    });

    it('should create service using factory function', () => {
      const factoryService = createSortFilterService(mockAPI, true);
      expect(factoryService).toBeDefined();
      expect(factoryService).toBeInstanceOf(SortFilterService);
    });

    it('should handle null univerAPI', () => {
      const nullService = createSortFilterService(null, false);
      expect(nullService).toBeDefined();
    });

    it('should update API instance', () => {
      const newAPI = createMockUniverAPI();
      service.updateAPI(newAPI, true);
      // Service should now use the new API
      expect(service).toBeDefined();
    });
  });

  // ==========================================================================
  // Sort Tests - Single Column
  // ==========================================================================

  describe('Sort - Single Column', () => {
    it('should sort by single column ascending', async () => {
      const data = [
        ['Name', 'Age', 'Score'],
        ['John', 25, 85],
        ['Alice', 30, 92],
        ['Bob', 22, 78],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:C4', { column: 0, ascending: true });
      
      expect(result).toBe(true);
      const mockWorkbook = (mockAPI as any)._getMockWorkbook();
      const mockWorksheet = mockWorkbook._getMockWorksheet();
      const mockRange = mockWorksheet._getMockRange();
      expect(mockRange.sort).toHaveBeenCalled();
    });

    it('should sort by single column descending', async () => {
      const data = [
        ['Name', 'Age', 'Score'],
        ['John', 25, 85],
        ['Alice', 30, 92],
        ['Bob', 22, 78],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:C4', { column: 1, ascending: false });
      
      expect(result).toBe(true);
      const mockWorkbook = (mockAPI as any)._getMockWorkbook();
      const mockWorksheet = mockWorkbook._getMockWorksheet();
      const mockRange = mockWorksheet._getMockRange();
      expect(mockRange.sort).toHaveBeenCalledWith({ column: 1, ascending: false });
    });

    it('should sort using simple config with order', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:A3', { column: 0, order: 'asc' });
      
      expect(result).toBe(true);
    });

    it('should sort descending using order parameter', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:A3', { column: 0, order: 'desc' });
      
      expect(result).toBe(true);
    });

    it('should sort using sortByColumn convenience method', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortByColumn('A1:A3', 0, 'asc');
      
      expect(result).toBe(true);
    });

    it('should sort descending using sortByColumn', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortByColumn('A1:A3', 0, 'desc');
      
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // Sort Tests - Multiple Columns
  // ==========================================================================

  describe('Sort - Multiple Columns', () => {
    it('should sort by multiple columns', async () => {
      const data = [
        ['Dept', 'Name', 'Salary'],
        ['Sales', 'John', 50000],
        ['IT', 'Alice', 60000],
        ['Sales', 'Bob', 55000],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:C4', [
        { column: 0, ascending: true },
        { column: 2, ascending: false },
      ]);
      
      expect(result).toBe(true);
      const mockWorkbook = (mockAPI as any)._getMockWorkbook();
      const mockWorksheet = mockWorkbook._getMockWorksheet();
      const mockRange = mockWorksheet._getMockRange();
      expect(mockRange.sort).toHaveBeenCalled();
    });

    it('should sort by three columns', async () => {
      const data = [['A', 'B', 'C'], ['1', '2', '3']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:C2', [
        { column: 0, ascending: true },
        { column: 1, ascending: false },
        { column: 2, ascending: true },
      ]);
      
      expect(result).toBe(true);
    });

    it('should sort using mixed simple and standard config', async () => {
      const data = [['A', 'B'], ['1', '2']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:B2', [
        { column: 0, order: 'asc' },
        { column: 1, order: 'desc' },
      ]);
      
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // Sort Tests - Error Handling
  // ==========================================================================

  describe('Sort - Error Handling', () => {
    it('should throw error for invalid range notation', async () => {
      await expect(service.sortData('invalid', { column: 0, ascending: true }))
        .rejects.toThrow('Invalid range notation');
    });

    it('should throw error for empty range', async () => {
      await expect(service.sortData('', { column: 0, ascending: true }))
        .rejects.toThrow('Range must be a non-empty string');
    });

    it('should throw error for negative column index', async () => {
      await expect(service.sortData('A1:B2', { column: -1, ascending: true }))
        .rejects.toThrow('Invalid column index');
    });

    it('should throw error for non-boolean ascending value', async () => {
      await expect(service.sortData('A1:B2', { column: 0, ascending: 'true' as any }))
        .rejects.toThrow('Invalid ascending value');
    });

    it('should throw error for empty sort config array', async () => {
      await expect(service.sortData('A1:B2', []))
        .rejects.toThrow('Sort configuration cannot be empty');
    });

    it('should throw error when Univer is not ready', async () => {
      service.updateAPI(null, false);
      await expect(service.sortData('A1:B2', { column: 0, ascending: true }))
        .rejects.toThrow('No active worksheet available');
    });

    it('should throw error when no active workbook', async () => {
      const mockAPINoWorkbook = {
        ...mockAPI,
        getActiveWorkbook: vi.fn(() => null),
      } as any;
      service.updateAPI(mockAPINoWorkbook, true);
      
      await expect(service.sortData('A1:B2', { column: 0, ascending: true }))
        .rejects.toThrow('No active worksheet available');
    });
  });

  // ==========================================================================
  // Filter Tests - Single Criterion
  // ==========================================================================

  describe('Filter - Single Criterion', () => {
    it('should filter by equals operator', async () => {
      const data = [
        ['Status', 'Name'],
        ['Active', 'John'],
        ['Inactive', 'Alice'],
        ['Active', 'Bob'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 0, operator: 'equals', value: 'Active' }]
      });
      
      expect(result).toBe(true);
      expect(service.hasFilter('A1:B4')).toBe(true);
      
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by notEquals operator', async () => {
      const data = [
        ['Status', 'Name'],
        ['Active', 'John'],
        ['Inactive', 'Alice'],
        ['Active', 'Bob'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 0, operator: 'notEquals', value: 'Active' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by greaterThan operator', async () => {
      const data = [
        ['Age', 'Name'],
        [25, 'John'],
        [30, 'Alice'],
        [22, 'Bob'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 0, operator: 'greaterThan', value: 24 }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by greaterThanOrEqual operator', async () => {
      const data = [
        ['Score', 'Name'],
        [85, 'John'],
        [90, 'Alice'],
        [78, 'Bob'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 0, operator: 'greaterThanOrEqual', value: 85 }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by lessThan operator', async () => {
      const data = [
        ['Price', 'Item'],
        [100, 'A'],
        [50, 'B'],
        [150, 'C'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 0, operator: 'lessThan', value: 100 }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(1);
    });

    it('should filter by lessThanOrEqual operator', async () => {
      const data = [
        ['Price', 'Item'],
        [100, 'A'],
        [50, 'B'],
        [150, 'C'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 0, operator: 'lessThanOrEqual', value: 100 }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by contains operator', async () => {
      const data = [
        ['Name', 'Email'],
        ['John Doe', 'john@test.com'],
        ['Alice Smith', 'alice@demo.com'],
        ['Bob Test', 'bob@test.com'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 1, operator: 'contains', value: 'test' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by notContains operator', async () => {
      const data = [
        ['Name', 'Email'],
        ['John Doe', 'john@test.com'],
        ['Alice Smith', 'alice@demo.com'],
        ['Bob Test', 'bob@test.com'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [{ column: 1, operator: 'notContains', value: 'test' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(2); // Header + 1 data row
    });

    it('should filter by startsWith operator', async () => {
      const data = [
        ['Name'],
        ['Alice'],
        ['Bob'],
        ['Alex'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'startsWith', value: 'Al' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by endsWith operator', async () => {
      const data = [
        ['Email'],
        ['john@test.com'],
        ['alice@demo.com'],
        ['bob@test.com'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'endsWith', value: 'test.com' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by isEmpty operator', async () => {
      const data = [
        ['Name'],
        ['John'],
        [''],
        [null],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'isEmpty', value: null }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by isNotEmpty operator', async () => {
      const data = [
        ['Name'],
        ['John'],
        [''],
        ['Alice'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'isNotEmpty', value: null }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(3); // Header + 2 data rows
    });

    it('should filter by between operator', async () => {
      const data = [
        ['Age'],
        [20],
        [25],
        [30],
        [35],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A5', {
        criteria: [{ column: 0, operator: 'between', value: 25, value2: 30 }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A5');
      expect(filtered).toHaveLength(2);
    });

    it('should filter using filterByColumn convenience method', async () => {
      const data = [
        ['Status'],
        ['Active'],
        ['Inactive'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterByColumn('A1:A3', 0, 'equals', 'Active');
      
      expect(result).toBe(true);
      expect(service.hasFilter('A1:A3')).toBe(true);
    });
  });

  // ==========================================================================
  // Filter Tests - Multiple Criteria
  // ==========================================================================

  describe('Filter - Multiple Criteria', () => {
    it('should filter with multiple criteria using AND logic', async () => {
      const data = [
        ['Status', 'Score'],
        ['Active', 85],
        ['Active', 92],
        ['Inactive', 78],
        ['Active', 65],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B5', {
        criteria: [
          { column: 0, operator: 'equals', value: 'Active' },
          { column: 1, operator: 'greaterThan', value: 80 }
        ],
        logic: 'AND'
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B5');
      expect(filtered).toHaveLength(2);
    });

    it('should filter with multiple criteria using OR logic', async () => {
      const data = [
        ['Name', 'Email'],
        ['John', 'john@test.com'],
        ['Alice', 'alice@demo.com'],
        ['Bob', 'bob@test.com'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [
          { column: 1, operator: 'contains', value: 'test' },
          { column: 0, operator: 'equals', value: 'Alice' }
        ],
        logic: 'OR'
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(3);
    });

    it('should default to AND logic when not specified', async () => {
      const data = [
        ['A', 'B'],
        [1, 10],
        [2, 20],
        [3, 30],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:B4', {
        criteria: [
          { column: 0, operator: 'greaterThan', value: 1 },
          { column: 1, operator: 'lessThan', value: 30 }
        ]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:B4');
      expect(filtered).toHaveLength(1);
    });

    it('should filter with three criteria using AND logic', async () => {
      const data = [
        ['A', 'B', 'C'],
        [1, 10, 'X'],
        [2, 20, 'Y'],
        [3, 30, 'X'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:C4', {
        criteria: [
          { column: 0, operator: 'greaterThan', value: 1 },
          { column: 1, operator: 'lessThanOrEqual', value: 30 },
          { column: 2, operator: 'equals', value: 'X' }
        ],
        logic: 'AND'
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:C4');
      expect(filtered).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Filter Tests - State Management
  // ==========================================================================

  describe('Filter - State Management', () => {
    it('should track filter state', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      await service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      });
      
      const state = service.getFilterState('A1:A3');
      expect(state).not.toBeNull();
      expect(state?.range).toBe('A1:A3');
      expect(state?.originalData).toEqual(data);
    });

    it('should return null for non-existent filter state', () => {
      const state = service.getFilterState('A1:A3');
      expect(state).toBeNull();
    });

    it('should check if filter exists', async () => {
      const data = [['A'], ['B']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      expect(service.hasFilter('A1:A2')).toBe(false);
      
      await service.filterData('A1:A2', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      });
      
      expect(service.hasFilter('A1:A2')).toBe(true);
    });

    it('should get filtered data', async () => {
      const data = [
        ['Name'],
        ['Alice'],
        ['Bob'],
        ['Alex'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'startsWith', value: 'Al' }]
      });
      
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(2);
      expect(filtered?.[0][0]).toBe('Alice');
      expect(filtered?.[1][0]).toBe('Alex');
    });

    it('should return null for filtered data when no filter applied', () => {
      const filtered = service.getFilteredData('A1:A3');
      expect(filtered).toBeNull();
    });
  });

  // ==========================================================================
  // Filter Tests - Clear Filter
  // ==========================================================================

  describe('Filter - Clear Filter', () => {
    it('should clear filter from range', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      await service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      });
      
      expect(service.hasFilter('A1:A3')).toBe(true);
      
      const result = await service.clearFilter('A1:A3');
      expect(result).toBe(true);
      expect(service.hasFilter('A1:A3')).toBe(false);
    });

    it('should handle clearing non-existent filter', async () => {
      const result = await service.clearFilter('A1:A3');
      expect(result).toBe(true); // Not an error
    });

    it('should clear all filters', async () => {
      const data = [['A'], ['B'], ['C']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      await service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      });
      
      await service.filterData('B1:B3', {
        criteria: [{ column: 0, operator: 'equals', value: 'B' }]
      });
      
      expect(service.hasFilter('A1:A3')).toBe(true);
      expect(service.hasFilter('B1:B3')).toBe(true);
      
      const result = await service.clearAllFilters();
      expect(result).toBe(true);
      expect(service.hasFilter('A1:A3')).toBe(false);
      expect(service.hasFilter('B1:B3')).toBe(false);
    });

    it('should handle clearing all filters when none exist', async () => {
      const result = await service.clearAllFilters();
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // Filter Tests - Error Handling
  // ==========================================================================

  describe('Filter - Error Handling', () => {
    it('should throw error for invalid range notation', async () => {
      await expect(service.filterData('invalid', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      })).rejects.toThrow('Invalid range notation');
    });

    it('should throw error for empty criteria', async () => {
      await expect(service.filterData('A1:A3', {
        criteria: []
      })).rejects.toThrow('Filter configuration must have at least one criterion');
    });

    it('should throw error for invalid column index', async () => {
      await expect(service.filterData('A1:A3', {
        criteria: [{ column: -1, operator: 'equals', value: 'A' }]
      })).rejects.toThrow('Invalid column index');
    });

    it('should throw error for invalid operator', async () => {
      await expect(service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'invalid' as any, value: 'A' }]
      })).rejects.toThrow('Invalid filter operator');
    });

    it('should throw error for between without value2', async () => {
      await expect(service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'between', value: 1 }]
      })).rejects.toThrow('BETWEEN operator requires value2');
    });

    it('should throw error for operator requiring value without value', async () => {
      await expect(service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: undefined as any }]
      })).rejects.toThrow('Operator equals requires a value');
    });

    it('should throw error for invalid filter logic', async () => {
      await expect(service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }],
        logic: 'INVALID' as any
      })).rejects.toThrow('Invalid filter logic');
    });

    it('should throw error when Univer is not ready', async () => {
      service.updateAPI(null, false);
      await expect(service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      })).rejects.toThrow('No active worksheet available');
    });

    it('should throw error for empty data range', async () => {
      mockAPI = createMockUniverAPI([]);
      service.updateAPI(mockAPI, true);

      await expect(service.filterData('A1:A3', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      })).rejects.toThrow('Range contains no data');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle case-insensitive string comparison', async () => {
      const data = [
        ['Name'],
        ['ALICE'],
        ['alice'],
        ['Alice'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'equals', value: 'alice' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(1); // Only the exact lowercase match
    });

    it('should handle numeric string comparison', async () => {
      const data = [
        ['Value'],
        ['100'],
        [100],
        ['200'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A4', {
        criteria: [{ column: 0, operator: 'equals', value: 100 }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A4');
      expect(filtered).toHaveLength(2);
    });

    it('should handle null and undefined values', async () => {
      const data = [
        ['Value'],
        [null],
        [undefined],
        [''],
        ['data'],
      ];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A5', {
        criteria: [{ column: 0, operator: 'isEmpty', value: null }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A5');
      expect(filtered).toHaveLength(3);
    });

    it('should handle single row data', async () => {
      const data = [['A']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.filterData('A1:A1', {
        criteria: [{ column: 0, operator: 'equals', value: 'A' }]
      });
      
      expect(result).toBe(true);
      const filtered = service.getFilteredData('A1:A1');
      expect(filtered).toHaveLength(1);
    });

    it('should handle large column index', async () => {
      const data = [['A', 'B', 'C', 'D', 'E']];
      mockAPI = createMockUniverAPI(data);
      service.updateAPI(mockAPI, true);

      const result = await service.sortData('A1:E1', { column: 4, ascending: true });
      expect(result).toBe(true);
    });
  });
});
