import { describe, it, expect } from 'vitest';
import { requiresConfirmation, getActionImpact } from '../actionConfirmation';
import { AIAction, ExcelData } from '@/types/excel';

describe('actionConfirmation', () => {
  const mockData: ExcelData = {
    fileName: 'test.xlsx',
    currentSheet: 'Sheet1',
    sheets: ['Sheet1'],
    headers: ['Name', 'Age', 'City', 'Status'],
    rows: [
      ['Alice', 25, 'New York', 'Active'],
      ['Bob', 30, 'London', 'Active'],
      ['Charlie', 35, 'Paris', 'Inactive'],
      ['', '', '', ''], // Empty row
      ['Eve', 28, 'Tokyo', 'Active'],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
  };

  describe('requiresConfirmation', () => {
    it('should require confirmation for DELETE_ROW', () => {
      const action: AIAction = {
        id: '1',
        type: 'DELETE_ROW',
        description: 'Delete row 2',
        params: {
          target: { ref: '2' },
        },
      };

      expect(requiresConfirmation(action, mockData)).toBe(true);
    });

    it('should require confirmation for DELETE_COLUMN', () => {
      const action: AIAction = {
        id: '2',
        type: 'DELETE_COLUMN',
        description: 'Delete Status column',
        params: {
          columnName: 'Status',
        },
      };

      expect(requiresConfirmation(action, mockData)).toBe(true);
    });

    it('should require confirmation for REMOVE_EMPTY_ROWS', () => {
      const action: AIAction = {
        id: '3',
        type: 'REMOVE_EMPTY_ROWS',
        description: 'Remove empty rows',
        params: {},
      };

      expect(requiresConfirmation(action, mockData)).toBe(true);
    });

    it('should require confirmation for DATA_TRANSFORM affecting many cells', () => {
      // Create data with more than 10 cells in column A
      const largeData: ExcelData = {
        ...mockData,
        rows: Array(15).fill(['Test', 25, 'City', 'Active']),
      };

      const action: AIAction = {
        id: '4',
        type: 'DATA_TRANSFORM',
        description: 'Transform column A to uppercase',
        params: {
          target: { ref: 'A' },
          transformType: 'uppercase',
        },
      };

      expect(requiresConfirmation(action, largeData)).toBe(true);
    });

    it('should NOT require confirmation for DATA_TRANSFORM affecting few cells', () => {
      const action: AIAction = {
        id: '5',
        type: 'DATA_TRANSFORM',
        description: 'Transform column A to uppercase',
        params: {
          target: { ref: 'A' },
          transformType: 'uppercase',
        },
      };

      // mockData has only 4 non-empty cells in column A (< 10)
      expect(requiresConfirmation(action, mockData)).toBe(false);
    });

    it('should NOT require confirmation for EDIT_CELL', () => {
      const action: AIAction = {
        id: '6',
        type: 'EDIT_CELL',
        description: 'Edit cell A1',
        params: {
          target: { ref: 'A1' },
          value: 'New Value',
        },
      };

      expect(requiresConfirmation(action, mockData)).toBe(false);
    });

    it('should NOT require confirmation for INSERT_FORMULA', () => {
      const action: AIAction = {
        id: '7',
        type: 'INSERT_FORMULA',
        description: 'Insert formula',
        formula: '=SUM(A1:A10)',
        params: {
          target: { ref: 'E1' },
        },
      };

      expect(requiresConfirmation(action, mockData)).toBe(false);
    });

    it('should NOT require confirmation for ADD_COLUMN', () => {
      const action: AIAction = {
        id: '8',
        type: 'ADD_COLUMN',
        description: 'Add Email column',
        params: {
          newColumnName: 'Email',
        },
      };

      expect(requiresConfirmation(action, mockData)).toBe(false);
    });
  });

  describe('getActionImpact', () => {
    it('should calculate impact for DELETE_ROW', () => {
      const action: AIAction = {
        id: '1',
        type: 'DELETE_ROW',
        description: 'Delete rows 2 and 3',
        params: {
          target: { ref: '2,3' },
        },
      };

      const impact = getActionImpact(action, mockData);
      expect(impact.type).toBe('DELETE_ROW');
      expect(impact.affectedRows).toBe(2);
      expect(impact.affectedCells).toBe(8); // 2 rows * 4 columns
    });

    it('should calculate impact for DELETE_COLUMN', () => {
      const action: AIAction = {
        id: '2',
        type: 'DELETE_COLUMN',
        description: 'Delete Status column',
        params: {
          columnName: 'Status',
        },
      };

      const impact = getActionImpact(action, mockData);
      expect(impact.type).toBe('DELETE_COLUMN');
      expect(impact.affectedColumns).toBe(1);
      expect(impact.affectedCells).toBe(5); // 5 rows
    });

    it('should calculate impact for REMOVE_EMPTY_ROWS', () => {
      const action: AIAction = {
        id: '3',
        type: 'REMOVE_EMPTY_ROWS',
        description: 'Remove empty rows',
        params: {},
      };

      const impact = getActionImpact(action, mockData);
      expect(impact.type).toBe('REMOVE_EMPTY_ROWS');
      expect(impact.affectedRows).toBe(1); // 1 empty row
      expect(impact.affectedCells).toBe(4); // 1 row * 4 columns
    });

    it('should calculate impact for DATA_TRANSFORM', () => {
      const action: AIAction = {
        id: '4',
        type: 'DATA_TRANSFORM',
        description: 'Transform column A to uppercase',
        params: {
          target: { ref: 'A' },
          transformType: 'uppercase',
        },
      };

      const impact = getActionImpact(action, mockData);
      expect(impact.type).toBe('DATA_TRANSFORM');
      expect(impact.affectedCells).toBe(4); // 4 non-empty cells in column A
    });

    it('should handle action with no specific impact', () => {
      const action: AIAction = {
        id: '5',
        type: 'EDIT_CELL',
        description: 'Edit cell',
        params: {},
      };

      const impact = getActionImpact(action, mockData);
      expect(impact.type).toBe('EDIT_CELL');
      expect(impact.affectedRows).toBeUndefined();
      expect(impact.affectedColumns).toBeUndefined();
      expect(impact.affectedCells).toBeUndefined();
    });
  });
});
