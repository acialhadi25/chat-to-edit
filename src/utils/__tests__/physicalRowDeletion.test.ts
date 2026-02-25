/**
 * Tests for physical row deletion
 * 
 * Validates: Requirements 2.2.5
 * - Physical row deletion (not just clearing content)
 * - Row indices updated correctly after deletion
 * - Formulas adjusted to reflect new row positions
 * - Formula references to deleted rows become #REF!
 */

import { applyChanges } from '../applyChanges';
import { ExcelData, DataChange } from '@/types/excel';

describe('Physical Row Deletion', () => {
  describe('Basic row deletion', () => {
    it('should physically remove a single row', () => {
      const data: ExcelData = {
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', 25, 'NYC'],
          ['Bob', 30, 'LA'],
          ['Charlie', 35, 'SF'],
        ],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [
        { row: 1, col: 0, oldValue: 'Bob', newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 1, oldValue: 30, newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 2, oldValue: 'LA', newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      // Row should be physically removed, not just cleared
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(['Alice', 25, 'NYC']);
      expect(result.data.rows[1]).toEqual(['Charlie', 35, 'SF']);
    });

    it('should physically remove multiple consecutive rows', () => {
      const data: ExcelData = {
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', 25],
          ['Bob', 30],
          ['Charlie', 35],
          ['David', 40],
        ],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [
        // Delete rows 1 and 2 (Bob and Charlie)
        { row: 1, col: 0, oldValue: 'Bob', newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 1, oldValue: 30, newValue: null, type: 'ROW_DELETE' },
        { row: 2, col: 0, oldValue: 'Charlie', newValue: null, type: 'ROW_DELETE' },
        { row: 2, col: 1, oldValue: 35, newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(['Alice', 25]);
      expect(result.data.rows[1]).toEqual(['David', 40]);
    });

    it('should physically remove non-consecutive rows', () => {
      const data: ExcelData = {
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', 25],
          ['Bob', 30],
          ['Charlie', 35],
          ['David', 40],
        ],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [
        // Delete rows 0 and 2 (Alice and Charlie)
        { row: 0, col: 0, oldValue: 'Alice', newValue: null, type: 'ROW_DELETE' },
        { row: 0, col: 1, oldValue: 25, newValue: null, type: 'ROW_DELETE' },
        { row: 2, col: 0, oldValue: 'Charlie', newValue: null, type: 'ROW_DELETE' },
        { row: 2, col: 1, oldValue: 35, newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(['Bob', 30]);
      expect(result.data.rows[1]).toEqual(['David', 40]);
    });
  });

  describe('Formula adjustment after row deletion', () => {
    it('should adjust formula references when rows are deleted', () => {
      const data: ExcelData = {
        headers: ['Value', 'Formula'],
        rows: [
          [10, null],
          [20, null],
          [30, null],
          [null, '=SUM(A2:A4)'], // Row 3, references rows 2-4 (data rows 0-2)
        ],
        formulas: {
          B5: '=SUM(A2:A4)',
        },
        pendingChanges: [],
      };

      // Delete row 1 (second data row, Excel row 3)
      const changes: DataChange[] = [
        { row: 1, col: 0, oldValue: 20, newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 1, oldValue: null, newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      // After deleting row 1, the formula row moves from index 3 to index 2
      // The formula should now reference A2:A3 instead of A2:A4
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[2][1]).toBe('=SUM(A2:A3)');
      
      // Check formulas object is also updated
      expect(result.data.formulas?.B4).toBe('=SUM(A2:A3)');
    });

    it('should set #REF! when formula references deleted row', () => {
      const data: ExcelData = {
        headers: ['Value', 'Formula'],
        rows: [
          [10, null],
          [20, null],
          [30, '=A2'], // References row 2 (data row 0)
        ],
        formulas: {
          B4: '=A2',
        },
        pendingChanges: [],
      };

      // Delete row 0 (first data row, Excel row 2)
      const changes: DataChange[] = [
        { row: 0, col: 0, oldValue: 10, newValue: null, type: 'ROW_DELETE' },
        { row: 0, col: 1, oldValue: null, newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      // After deleting row 0, the formula that referenced A2 should show #REF!
      // The formula is now in row index 1 (was index 2)
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[1][1]).toBe('=#REF!');
    });

    it('should adjust multiple formula references correctly', () => {
      const data: ExcelData = {
        headers: ['A', 'B', 'C'],
        rows: [
          [1, 2, '=A2+B2'],
          [3, 4, '=A3+B3'],
          [5, 6, '=A4+B4'],
          [7, 8, '=SUM(A2:A4)'],
        ],
        formulas: {
          C2: '=A2+B2',
          C3: '=A3+B3',
          C4: '=A4+B4',
          C5: '=SUM(A2:A4)',
        },
        pendingChanges: [],
      };

      // Delete row 1 (second data row, Excel row 3)
      const changes: DataChange[] = [
        { row: 1, col: 0, oldValue: 3, newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 1, oldValue: 4, newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 2, oldValue: '=A3+B3', newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(3);
      
      // First row formula unchanged (references row 2)
      expect(result.data.rows[0][2]).toBe('=A2+B2');
      
      // Second row formula adjusted (was A4+B4, now A3+B3)
      expect(result.data.rows[1][2]).toBe('=A3+B3');
      
      // Third row formula adjusted (was SUM(A2:A4), now SUM(A2:A3))
      expect(result.data.rows[2][2]).toBe('=SUM(A2:A3)');
    });

    it('should handle complex formulas with multiple references', () => {
      const data: ExcelData = {
        headers: ['A', 'B', 'C'],
        rows: [
          [10, 20, null],
          [30, 40, null],
          [50, 60, null],
          [null, null, '=A2*B3+A4'],
        ],
        formulas: {
          C5: '=A2*B3+A4',
        },
        pendingChanges: [],
      };

      // Delete row 0 (first data row, Excel row 2)
      const changes: DataChange[] = [
        { row: 0, col: 0, oldValue: 10, newValue: null, type: 'ROW_DELETE' },
        { row: 0, col: 1, oldValue: 20, newValue: null, type: 'ROW_DELETE' },
        { row: 0, col: 2, oldValue: null, newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      // Formula should show #REF! for A2, and adjust B3->B2, A4->A3
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[2][2]).toBe('=#REF!*B2+A3');
    });
  });

  describe('Edge cases', () => {
    it('should handle deleting the first row', () => {
      const data: ExcelData = {
        headers: ['Name'],
        rows: [
          ['Alice'],
          ['Bob'],
          ['Charlie'],
        ],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [
        { row: 0, col: 0, oldValue: 'Alice', newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(['Bob']);
      expect(result.data.rows[1]).toEqual(['Charlie']);
    });

    it('should handle deleting the last row', () => {
      const data: ExcelData = {
        headers: ['Name'],
        rows: [
          ['Alice'],
          ['Bob'],
          ['Charlie'],
        ],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [
        { row: 2, col: 0, oldValue: 'Charlie', newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(['Alice']);
      expect(result.data.rows[1]).toEqual(['Bob']);
    });

    it('should handle deleting all rows', () => {
      const data: ExcelData = {
        headers: ['Name'],
        rows: [
          ['Alice'],
          ['Bob'],
        ],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [
        { row: 0, col: 0, oldValue: 'Alice', newValue: null, type: 'ROW_DELETE' },
        { row: 1, col: 0, oldValue: 'Bob', newValue: null, type: 'ROW_DELETE' },
      ];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(0);
    });

    it('should handle empty change array', () => {
      const data: ExcelData = {
        headers: ['Name'],
        rows: [['Alice']],
        formulas: {},
        pendingChanges: [],
      };

      const changes: DataChange[] = [];

      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(1);
      expect(result.data.rows[0]).toEqual(['Alice']);
    });
  });
});
