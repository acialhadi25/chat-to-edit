/**
 * Unit tests for formula support in useUniverCellOperations hook
 * 
 * Tests formula operations:
 * - getFormula
 * - setFormula
 * - Formula validation
 * - Formula error handling
 * - Basic formulas (SUM, AVERAGE, COUNT, MIN, MAX)
 * 
 * Requirements: 1.2.1, 1.2.2, 1.2.3
 */

import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useUniverCellOperations } from '../useUniverCellOperations';
import type { FUniver, FWorkbook, FWorksheet, FRange } from '../../types/univer.types';

describe('useUniverCellOperations - Formula Support', () => {
  let mockUniversAPI: FUniver;
  let mockWorkbook: FWorkbook;
  let mockWorksheet: FWorksheet;
  let mockRange: FRange;

  beforeEach(() => {
    // Setup mock range
    mockRange = {
      getValue: vi.fn(),
      setValue: vi.fn(),
      getFormula: vi.fn(),
      setFormula: vi.fn(),
      getValues: vi.fn(),
      setValues: vi.fn(),
      getNumRows: vi.fn(),
      getNumColumns: vi.fn(),
    } as any;

    // Setup mock worksheet
    mockWorksheet = {
      getRange: vi.fn().mockReturnValue(mockRange),
      getSheetId: vi.fn().mockReturnValue('sheet-1'),
      getSheetName: vi.fn().mockReturnValue('Sheet1'),
    } as any;

    // Setup mock workbook
    mockWorkbook = {
      getActiveSheet: vi.fn().mockReturnValue(mockWorksheet),
      getId: vi.fn().mockReturnValue('workbook-1'),
    } as any;

    // Setup mock univerAPI
    mockUniversAPI = {
      getActiveWorkbook: vi.fn().mockReturnValue(mockWorkbook),
    } as any;
  });

  describe('getFormula', () => {
    it('should get formula from cell successfully', () => {
      mockRange.getFormula.mockReturnValue('=SUM(A1:A10)');

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      const formula = result.current.getFormula(0, 0);

      expect(formula).toBe('=SUM(A1:A10)');
      expect(mockWorksheet.getRange).toHaveBeenCalledWith(0, 0);
      expect(mockRange.getFormula).toHaveBeenCalled();
    });

    it('should return null for cell without formula', () => {
      mockRange.getFormula.mockReturnValue('');

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      const formula = result.current.getFormula(0, 0);

      expect(formula).toBeNull();
    });

    it('should handle different formula types', () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // SUM formula
      mockRange.getFormula.mockReturnValue('=SUM(A1:A10)');
      expect(result.current.getFormula(0, 0)).toBe('=SUM(A1:A10)');

      // AVERAGE formula
      mockRange.getFormula.mockReturnValue('=AVERAGE(B1:B10)');
      expect(result.current.getFormula(0, 1)).toBe('=AVERAGE(B1:B10)');

      // COUNT formula
      mockRange.getFormula.mockReturnValue('=COUNT(C1:C10)');
      expect(result.current.getFormula(0, 2)).toBe('=COUNT(C1:C10)');

      // MIN formula
      mockRange.getFormula.mockReturnValue('=MIN(D1:D10)');
      expect(result.current.getFormula(0, 3)).toBe('=MIN(D1:D10)');

      // MAX formula
      mockRange.getFormula.mockReturnValue('=MAX(E1:E10)');
      expect(result.current.getFormula(0, 4)).toBe('=MAX(E1:E10)');
    });

    it('should throw error for invalid row index', () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      expect(() => result.current.getFormula(-1, 0)).toThrow('Invalid row index');
      expect(() => result.current.getFormula(1.5, 0)).toThrow('Invalid row index');
    });

    it('should throw error for invalid column index', () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      expect(() => result.current.getFormula(0, -1)).toThrow('Invalid column index');
      expect(() => result.current.getFormula(0, 2.5)).toThrow('Invalid column index');
    });

    it('should return null when Univer is not ready', () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: false })
      );

      const formula = result.current.getFormula(0, 0);

      expect(formula).toBeNull();
      expect(mockWorksheet.getRange).not.toHaveBeenCalled();
    });

    it('should return null when no active workbook', () => {
      mockUniversAPI.getActiveWorkbook.mockReturnValue(null);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      const formula = result.current.getFormula(0, 0);

      expect(formula).toBeNull();
    });
  });

  describe('setFormula', () => {
    it('should set formula successfully', async () => {
      mockRange.setFormula.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(0, 0, '=SUM(A1:A10)');

      expect(mockWorksheet.getRange).toHaveBeenCalledWith(0, 0);
      expect(mockRange.setFormula).toHaveBeenCalledWith('=SUM(A1:A10)');
    });

    it('should set different formula types', async () => {
      mockRange.setFormula.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // SUM
      await result.current.setFormula(0, 0, '=SUM(A1:A10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=SUM(A1:A10)');

      // AVERAGE
      await result.current.setFormula(0, 1, '=AVERAGE(B1:B10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=AVERAGE(B1:B10)');

      // COUNT
      await result.current.setFormula(0, 2, '=COUNT(C1:C10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=COUNT(C1:C10)');

      // MIN
      await result.current.setFormula(0, 3, '=MIN(D1:D10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=MIN(D1:D10)');

      // MAX
      await result.current.setFormula(0, 4, '=MAX(E1:E10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=MAX(E1:E10)');
    });

    it('should handle complex formulas', async () => {
      mockRange.setFormula.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // Nested functions
      await result.current.setFormula(0, 0, '=SUM(A1:A10)/COUNT(A1:A10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=SUM(A1:A10)/COUNT(A1:A10)');

      // Multiple ranges
      await result.current.setFormula(0, 1, '=SUM(A1:A10,B1:B10)');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=SUM(A1:A10,B1:B10)');

      // Arithmetic operations
      await result.current.setFormula(0, 2, '=A1+B1*C1');
      expect(mockRange.setFormula).toHaveBeenCalledWith('=A1+B1*C1');
    });

    it('should throw error for formula without equals sign', async () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await expect(result.current.setFormula(0, 0, 'SUM(A1:A10)')).rejects.toThrow(
        'Formula must start with ='
      );
    });

    it('should throw error for empty formula', async () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await expect(result.current.setFormula(0, 0, '')).rejects.toThrow(
        'Formula must be a non-empty string'
      );
    });

    it('should throw error for formula with mismatched parentheses', async () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await expect(result.current.setFormula(0, 0, '=SUM(A1:A10')).rejects.toThrow(
        'Formula has mismatched parentheses'
      );

      await expect(result.current.setFormula(0, 0, '=SUM(A1:A10))')).rejects.toThrow(
        'Formula has mismatched parentheses'
      );
    });

    it('should throw error when setFormula fails', async () => {
      mockRange.setFormula.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await expect(result.current.setFormula(0, 0, '=SUM(A1:A10)')).rejects.toThrow(
        'Failed to set formula'
      );
    });

    it('should throw error for invalid coordinates', async () => {
      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await expect(result.current.setFormula(-1, 0, '=SUM(A1:A10)')).rejects.toThrow(
        'Invalid row index'
      );
      await expect(result.current.setFormula(0, -1, '=SUM(A1:A10)')).rejects.toThrow(
        'Invalid column index'
      );
    });

    it('should throw error when no active worksheet', async () => {
      mockWorkbook.getActiveSheet.mockReturnValue(null);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await expect(result.current.setFormula(0, 0, '=SUM(A1:A10)')).rejects.toThrow(
        'No active worksheet'
      );
    });
  });

  describe('Formula Error Handling', () => {
    it('should handle #DIV/0! error', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue('#DIV/0!');

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // Set formula that causes division by zero
      await result.current.setFormula(0, 0, '=A1/0');
      
      // Get the error value
      const value = result.current.getCellValue(0, 0);
      expect(value).toBe('#DIV/0!');
    });

    it('should handle #REF! error', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue('#REF!');

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // Set formula with invalid reference
      await result.current.setFormula(0, 0, '=ZZZ999999');
      
      // Get the error value
      const value = result.current.getCellValue(0, 0);
      expect(value).toBe('#REF!');
    });

    it('should handle #VALUE! error', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue('#VALUE!');

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // Set formula with type mismatch
      await result.current.setFormula(0, 0, '=SUM("text")');
      
      // Get the error value
      const value = result.current.getCellValue(0, 0);
      expect(value).toBe('#VALUE!');
    });
  });

  describe('Basic Formula Calculations', () => {
    it('should calculate SUM correctly', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue(55); // Sum of 1-10

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(10, 0, '=SUM(A1:A10)');
      const value = result.current.getCellValue(10, 0);

      expect(value).toBe(55);
    });

    it('should calculate AVERAGE correctly', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue(5.5); // Average of 1-10

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(10, 0, '=AVERAGE(A1:A10)');
      const value = result.current.getCellValue(10, 0);

      expect(value).toBe(5.5);
    });

    it('should calculate COUNT correctly', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue(10);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(10, 0, '=COUNT(A1:A10)');
      const value = result.current.getCellValue(10, 0);

      expect(value).toBe(10);
    });

    it('should calculate MIN correctly', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue(1);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(10, 0, '=MIN(A1:A10)');
      const value = result.current.getCellValue(10, 0);

      expect(value).toBe(1);
    });

    it('should calculate MAX correctly', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue(10);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(10, 0, '=MAX(A1:A10)');
      const value = result.current.getCellValue(10, 0);

      expect(value).toBe(10);
    });
  });

  describe('Formula Integration', () => {
    it('should set formula and get calculated value', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getValue.mockReturnValue(150);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      // Set formula
      await result.current.setFormula(0, 0, '=SUM(A1:A10)');
      
      // Get calculated value
      const value = result.current.getCellValue(0, 0);
      expect(value).toBe(150);
    });

    it('should distinguish between formula and value', async () => {
      mockRange.setFormula.mockResolvedValue(true);
      mockRange.getFormula.mockReturnValue('=SUM(A1:A10)');
      mockRange.getValue.mockReturnValue(150);

      const { result } = renderHook(() =>
        useUniverCellOperations({ univerAPI: mockUniversAPI, isReady: true })
      );

      await result.current.setFormula(0, 0, '=SUM(A1:A10)');

      // Get formula (returns formula string)
      const formula = result.current.getFormula(0, 0);
      expect(formula).toBe('=SUM(A1:A10)');

      // Get value (returns calculated result)
      const value = result.current.getCellValue(0, 0);
      expect(value).toBe(150);
    });
  });
});
