// @ts-nocheck
/**
 * Tests for Find and Replace Service
 * 
 * Tests comprehensive find and replace functionality including:
 * - Find all matches
 * - Find next/previous
 * - Replace all
 * - Replace in range
 * - Case-sensitive matching
 * - Whole cell matching
 * - Formula matching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindReplaceService } from '../findReplaceService';
import type { FUniver, FWorkbook, FWorksheet, FRange } from '../../types/univer.types';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockRange = (row: number, col: number, value: any, formula?: string): FRange => ({
  getRow: vi.fn(() => row),
  getColumn: vi.fn(() => col),
  getValue: vi.fn(() => value),
  getFormula: vi.fn(() => formula || ''),
  getA1Notation: vi.fn(() => {
    const colLetter = String.fromCharCode(65 + col);
    return `${colLetter}${row + 1}`;
  }),
  setValue: vi.fn(),
  setFormula: vi.fn(),
  getHeight: vi.fn(() => 1),
  getWidth: vi.fn(() => 1),
  getValues: vi.fn(() => [[value]]),
  setValues: vi.fn(),
} as any);

const createMockTextFinder = (matches: FRange[]) => {
  let currentIndex = -1;
  
  return {
    findAll: vi.fn(() => matches),
    findNext: vi.fn(() => {
      currentIndex++;
      return currentIndex < matches.length ? matches[currentIndex] : null;
    }),
    findPrevious: vi.fn(() => {
      if (currentIndex === -1) {
        currentIndex = matches.length - 1;
      } else {
        currentIndex--;
      }
      return currentIndex >= 0 ? matches[currentIndex] : null;
    }),
    getCurrentMatch: vi.fn(() => {
      return currentIndex >= 0 && currentIndex < matches.length ? matches[currentIndex] : null;
    }),
    matchCaseAsync: vi.fn(async () => {}),
    matchEntireCellAsync: vi.fn(async () => {}),
    matchFormulaTextAsync: vi.fn(async () => {}),
    replaceWithAsync: vi.fn(async () => {}),
    replaceAllWithAsync: vi.fn(async () => {}),
    ensureCompleteAsync: vi.fn(async () => {}),
  };
};

const createMockWorksheet = (rangeData?: any[][]): FWorksheet => {
  const mockRange = {
    getRow: vi.fn(() => 0),
    getColumn: vi.fn(() => 0),
    getHeight: vi.fn(() => rangeData?.length || 10),
    getWidth: vi.fn(() => rangeData?.[0]?.length || 4),
    getValue: vi.fn(),
    getValues: vi.fn(() => rangeData || []),
    setValue: vi.fn(),
    setValues: vi.fn(),
    getA1Notation: vi.fn(() => 'A1:D10'),
    sort: vi.fn(),
  } as any;

  return {
    getRange: vi.fn(() => mockRange),
    getName: vi.fn(() => 'Sheet1'),
  } as any;
};

const createMockWorkbook = (worksheet: FWorksheet): FWorkbook => ({
  getActiveSheet: vi.fn(() => worksheet),
  getId: vi.fn(() => 'workbook-1'),
  getName: vi.fn(() => 'Workbook1'),
  getSheets: vi.fn(() => [worksheet]),
} as any);

const createMockUniverAPI = (workbook: FWorkbook, textFinder: any): FUniver => ({
  getActiveWorkbook: vi.fn(() => workbook),
  createTextFinderAsync: vi.fn(async () => textFinder),
} as any);

// ============================================================================
// Test Suite
// ============================================================================

describe('FindReplaceService', () => {
  let service: FindReplaceService;
  let mockWorksheet: FWorksheet;
  let mockWorkbook: FWorkbook;
  let mockUniverAPI: FUniver;
  let mockTextFinder: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create fresh mocks for each test
    mockWorksheet = createMockWorksheet();
    mockWorkbook = createMockWorkbook(mockWorksheet);
    mockTextFinder = createMockTextFinder([]);
    mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
    
    service = new FindReplaceService(mockUniverAPI, true);
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('Initialization', () => {
    it('should initialize with univerAPI and ready state', () => {
      expect(service).toBeDefined();
      expect(service.getCurrentState()).toBeNull();
    });

    it('should update API and ready state', () => {
      const newAPI = {} as FUniver;
      service.updateAPI(newAPI, false);
      
      // Service should now use the new API
      expect(service).toBeDefined();
    });
  });

  // ==========================================================================
  // Find All Tests
  // ==========================================================================

  describe('findAll', () => {
    it('should find all occurrences in entire sheet', async () => {
      const matches = [
        createMockRange(0, 0, 'hello'),
        createMockRange(1, 1, 'hello world'),
        createMockRange(2, 2, 'say hello'),
      ];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('hello');

      expect(results).toHaveLength(3);
      expect(results[0].address).toBe('A1');
      expect(results[1].address).toBe('B2');
      expect(results[2].address).toBe('C3');
      expect(mockUniverAPI.createTextFinderAsync).toHaveBeenCalledWith('hello');
      expect(mockTextFinder.findAll).toHaveBeenCalled();
    });

    it('should find with case-sensitive option', async () => {
      const matches = [createMockRange(0, 0, 'Hello')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('Hello', undefined, { matchCase: true });

      expect(results).toHaveLength(1);
      expect(mockTextFinder.matchCaseAsync).toHaveBeenCalledWith(true);
    });

    it('should find with match entire cell option', async () => {
      const matches = [createMockRange(0, 0, '5')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('5', undefined, { matchEntireCell: true });

      expect(results).toHaveLength(1);
      expect(mockTextFinder.matchEntireCellAsync).toHaveBeenCalledWith(true);
    });

    it('should find with match formula option', async () => {
      const matches = [createMockRange(0, 0, 10, '=SUM(A1:A5)')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('SUM', undefined, { matchFormula: true });

      expect(results).toHaveLength(1);
      expect(mockTextFinder.matchFormulaTextAsync).toHaveBeenCalledWith(true);
    });

    it('should find in specific range', async () => {
      const matches = [
        createMockRange(0, 0, 'test'), // A1 - in range
        createMockRange(1, 1, 'test'), // B2 - in range
        createMockRange(5, 5, 'test'), // F6 - out of range
      ];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('test', 'A1:D4');

      // Should only return matches within A1:D4 (first 2 matches)
      expect(results).toHaveLength(2);
      expect(results[0].address).toBe('A1');
      expect(results[1].address).toBe('B2');
    });

    it('should return empty array when no matches found', async () => {
      mockTextFinder = createMockTextFinder([]);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('notfound');

      expect(results).toHaveLength(0);
    });

    it('should throw error for invalid search text', async () => {
      await expect(service.findAll(null as any)).rejects.toThrow('Search text cannot be null or undefined');
      await expect(service.findAll(undefined as any)).rejects.toThrow('Search text cannot be null or undefined');
      await expect(service.findAll(123 as any)).rejects.toThrow('Search text must be a string');
    });

    it('should throw error for invalid range notation', async () => {
      await expect(service.findAll('test', 'invalid')).rejects.toThrow('Invalid range notation');
    });

    it('should handle Univer not ready', async () => {
      service = new FindReplaceService(null, false);

      await expect(service.findAll('test')).rejects.toThrow('No active worksheet available');
    });

    it('should store search state', async () => {
      const matches = [createMockRange(0, 0, 'hello')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findAll('hello', undefined, { matchCase: true });

      const state = service.getCurrentState();
      expect(state).not.toBeNull();
      expect(state?.searchText).toBe('hello');
      expect(state?.options.matchCase).toBe(true);
      expect(state?.matches).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Find Next/Previous Tests
  // ==========================================================================

  describe('findNext', () => {
    it('should find next occurrence', async () => {
      const matches = [
        createMockRange(0, 0, 'test'),
        createMockRange(1, 1, 'test'),
      ];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const first = await service.findNext('test');
      expect(first?.address).toBe('A1');

      const second = await service.findNext('test');
      expect(second?.address).toBe('B2');
    });

    it('should return null when no more matches', async () => {
      const matches = [createMockRange(0, 0, 'test')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findNext('test');
      const result = await service.findNext('test');

      expect(result).toBeNull();
    });

    it('should apply find options', async () => {
      const matches = [createMockRange(0, 0, 'Test')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findNext('Test', { matchCase: true, matchEntireCell: true });

      expect(mockTextFinder.matchCaseAsync).toHaveBeenCalledWith(true);
      expect(mockTextFinder.matchEntireCellAsync).toHaveBeenCalledWith(true);
    });
  });

  describe('findPrevious', () => {
    it('should find previous occurrence', async () => {
      const matches = [
        createMockRange(0, 0, 'test'),
        createMockRange(1, 1, 'test'),
      ];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const last = await service.findPrevious('test');
      expect(last?.address).toBe('B2');

      const first = await service.findPrevious('test');
      expect(first?.address).toBe('A1');
    });

    it('should return null when no more matches', async () => {
      mockTextFinder = createMockTextFinder([]);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.findPrevious('test');

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Replace All Tests
  // ==========================================================================

  describe('replaceAll', () => {
    it('should replace all occurrences in entire sheet', async () => {
      const matches = [
        createMockRange(0, 0, 'old'),
        createMockRange(1, 1, 'old value'),
        createMockRange(2, 2, 'very old'),
      ];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceAll('old', 'new');

      expect(result.count).toBe(3);
      expect(result.replacedCells).toHaveLength(3);
      expect(mockTextFinder.replaceAllWithAsync).toHaveBeenCalledWith('new');
    });

    it('should replace all in specific range', async () => {
      const cell1 = createMockRange(0, 0, 'old');
      const cell2 = createMockRange(1, 1, 'old value');
      const matches = [cell1, cell2];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceAll('old', 'new', 'A1:D4');

      expect(result.count).toBe(2);
      expect(cell1.setValue).toHaveBeenCalled();
      expect(cell2.setValue).toHaveBeenCalled();
    });

    it('should replace with case-sensitive matching', async () => {
      const matches = [createMockRange(0, 0, 'Old')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceAll('Old', 'New', undefined, { matchCase: true });

      expect(result.count).toBe(1);
      expect(mockTextFinder.matchCaseAsync).toHaveBeenCalledWith(true);
    });

    it('should replace entire cell when matchEntireCell is true', async () => {
      const cell = createMockRange(0, 0, '5');
      const matches = [cell];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceAll('5', '10', 'A1:D4', { matchEntireCell: true });

      expect(result.count).toBe(1);
      expect(cell.setValue).toHaveBeenCalledWith('10');
    });

    it('should return zero count when no matches found', async () => {
      mockTextFinder = createMockTextFinder([]);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceAll('notfound', 'new');

      expect(result.count).toBe(0);
      expect(result.replacedCells).toHaveLength(0);
      expect(mockTextFinder.replaceAllWithAsync).not.toHaveBeenCalled();
    });

    it('should throw error for invalid replace text', async () => {
      await expect(service.replaceAll('old', null as any)).rejects.toThrow('Replace text cannot be null or undefined');
      await expect(service.replaceAll('old', undefined as any)).rejects.toThrow('Replace text cannot be null or undefined');
    });

    it('should handle partial matches in range', async () => {
      const cell = createMockRange(0, 0, 'old text here');
      const matches = [cell];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceAll('old', 'new', 'A1:D4');

      expect(result.count).toBe(1);
      expect(cell.setValue).toHaveBeenCalledWith('new text here');
    });
  });

  // ==========================================================================
  // Replace Next Tests
  // ==========================================================================

  describe('replaceNext', () => {
    it('should replace next occurrence', async () => {
      const matches = [createMockRange(0, 0, 'old')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceNext('old', 'new');

      expect(result).not.toBeNull();
      expect(result?.address).toBe('A1');
      expect(mockTextFinder.replaceWithAsync).toHaveBeenCalledWith('new');
    });

    it('should return null when no match found', async () => {
      mockTextFinder = createMockTextFinder([]);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceNext('notfound', 'new');

      expect(result).toBeNull();
      expect(mockTextFinder.replaceWithAsync).not.toHaveBeenCalled();
    });

    it('should apply find options', async () => {
      const matches = [createMockRange(0, 0, 'Old')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.replaceNext('Old', 'New', { matchCase: true });

      expect(mockTextFinder.matchCaseAsync).toHaveBeenCalledWith(true);
    });
  });

  // ==========================================================================
  // Convenience Methods Tests
  // ==========================================================================

  describe('findInRange', () => {
    it('should be an alias for findAll with range', async () => {
      const matches = [createMockRange(0, 0, 'test')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findInRange('test', 'A1:D10');

      expect(results).toHaveLength(1);
      expect(mockUniverAPI.createTextFinderAsync).toHaveBeenCalledWith('test');
    });
  });

  describe('replaceInRange', () => {
    it('should be an alias for replaceAll with range', async () => {
      const matches = [createMockRange(0, 0, 'old')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const result = await service.replaceInRange('old', 'new', 'A1:D10');

      expect(result.count).toBe(1);
    });
  });

  // ==========================================================================
  // State Management Tests
  // ==========================================================================

  describe('State Management', () => {
    it('should get current state', async () => {
      const matches = [createMockRange(0, 0, 'test')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findAll('test');
      const state = service.getCurrentState();

      expect(state).not.toBeNull();
      expect(state?.searchText).toBe('test');
      expect(state?.matches).toHaveLength(1);
    });

    it('should clear state', async () => {
      const matches = [createMockRange(0, 0, 'test')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findAll('test');
      service.clearState();

      expect(service.getCurrentState()).toBeNull();
    });

    it('should get match count', async () => {
      const matches = [
        createMockRange(0, 0, 'test'),
        createMockRange(1, 1, 'test'),
        createMockRange(2, 2, 'test'),
      ];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findAll('test');

      expect(service.getMatchCount()).toBe(3);
    });

    it('should return 0 match count when no state', () => {
      expect(service.getMatchCount()).toBe(0);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty string search', async () => {
      const matches = [createMockRange(0, 0, '')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('');

      expect(results).toHaveLength(1);
    });

    it('should handle special regex characters in search', async () => {
      const matches = [createMockRange(0, 0, '$100.00')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('$100.00');

      expect(results).toHaveLength(1);
    });

    it('should handle very long search text', async () => {
      const longText = 'a'.repeat(1000);
      const matches = [createMockRange(0, 0, longText)];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll(longText);

      expect(results).toHaveLength(1);
    });

    it('should handle unicode characters', async () => {
      const matches = [createMockRange(0, 0, '你好世界')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      const results = await service.findAll('你好');

      expect(results).toHaveLength(1);
    });

    it('should handle multiple options combined', async () => {
      const matches = [createMockRange(0, 0, 'Test', '=SUM(A1:A5)')];
      
      mockTextFinder = createMockTextFinder(matches);
      mockUniverAPI = createMockUniverAPI(mockWorkbook, mockTextFinder);
      service = new FindReplaceService(mockUniverAPI, true);

      await service.findAll('Test', undefined, {
        matchCase: true,
        matchEntireCell: true,
        matchFormula: true
      });

      expect(mockTextFinder.matchCaseAsync).toHaveBeenCalledWith(true);
      expect(mockTextFinder.matchEntireCellAsync).toHaveBeenCalledWith(true);
      expect(mockTextFinder.matchFormulaTextAsync).toHaveBeenCalledWith(true);
    });
  });
});
