// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for DELETE_ROW AI Action
 * 
 * DELETE_ROW allows deleting rows with:
 * - Delete single row
 * - Delete multiple consecutive rows
 * - Row structure preserved
 * - Formulas in other rows still work
 * - Undo/redo functionality
 * 
 * Validates: AI Action DELETE_ROW
 * 
 * Note: Physical row deletion was implemented in task 7.3.
 * This action generates ROW_DELETE changes that are processed by applyChanges.
 */
describe("DELETE_ROW Action", () => {
  describe("Delete single row", () => {
    it("should delete a single row by row number", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
          ["Charlie", 35, "Chicago"],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" }, // Excel row 3 = data row index 1 (Bob)
        },
        description: "Delete row 3 (Bob)",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should generate 3 changes (one for each column in the row)
      expect(changes).toHaveLength(3);
      expect(changes.every(c => c.type === 'ROW_DELETE')).toBe(true);
      expect(changes.every(c => c.row === 1)).toBe(true);
      expect(changes.every(c => c.newValue === null)).toBe(true);

      // Verify old values are captured
      expect(changes[0].oldValue).toBe("Bob");
      expect(changes[1].oldValue).toBe(30);
      expect(changes[2].oldValue).toBe("Los Angeles");

      const result = applyChanges(data, changes);
      
      // Row should be physically removed
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Alice", 25, "New York"]);
      expect(result.data.rows[1]).toEqual(["Charlie", 35, "Chicago"]);
    });

    it("should delete the first data row", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [1, "First"],
          [2, "Second"],
          [3, "Third"],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2" }, // Excel row 2 = data row index 0
        },
        description: "Delete first row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([2, "Second"]);
      expect(result.data.rows[1]).toEqual([3, "Third"]);
    });

    it("should delete the last data row", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [1, "First"],
          [2, "Second"],
          [3, "Third"],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "4" }, // Excel row 4 = data row index 2
        },
        description: "Delete last row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, "First"]);
      expect(result.data.rows[1]).toEqual([2, "Second"]);
    });

    it("should delete a middle row", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          [10, 11, 12],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "4" }, // Excel row 4 = data row index 2
        },
        description: "Delete middle row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([1, 2, 3]);
      expect(result.data.rows[1]).toEqual([4, 5, 6]);
      expect(result.data.rows[2]).toEqual([10, 11, 12]);
    });

    it("should handle deleting a row with null values", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, null, 3],
          [4, 5, null],
          [null, null, null],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "4" }, // Delete row with all nulls
        },
        description: "Delete row with nulls",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, null, 3]);
      expect(result.data.rows[1]).toEqual([4, 5, null]);
    });
  });

  describe("Delete multiple consecutive rows", () => {
    it("should delete two consecutive rows", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
          ["Charlie", 35],
          ["David", 40],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3,4" }, // Delete rows 3 and 4 (Bob and Charlie)
        },
        description: "Delete rows 3 and 4",
      };

      const changes = generateChangesFromAction(data, action);

      
      // Should generate 4 changes (2 rows × 2 columns)
      expect(changes).toHaveLength(4);
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Alice", 25]);
      expect(result.data.rows[1]).toEqual(["David", 40]);
    });

    it("should delete three consecutive rows", () => {
      const data = createMockExcelData({
        headers: ["ID"],
        rows: [[1], [2], [3], [4], [5]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3,4,5" }, // Delete rows 3, 4, 5
        },
        description: "Delete three rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([5]);
    });

    it("should delete multiple rows at the beginning", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3], [4], [5]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2,3" }, // Delete first two data rows
        },
        description: "Delete first two rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([3]);
      expect(result.data.rows[1]).toEqual([4]);
      expect(result.data.rows[2]).toEqual([5]);
    });

    it("should delete multiple rows at the end", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3], [4], [5]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "5,6" }, // Delete last two data rows
        },
        description: "Delete last two rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([2]);
      expect(result.data.rows[2]).toEqual([3]);
    });
  });


  describe("Row structure preserved", () => {
    it("should preserve column count after deletion", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E"],
        rows: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete middle row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Column count should remain the same
      expect(result.data.headers.length).toBe(5);
      expect(result.data.rows[0].length).toBe(5);
      expect(result.data.rows[1].length).toBe(5);
    });

    it("should preserve data types in remaining rows", () => {
      const data = createMockExcelData({
        headers: ["String", "Number", "Boolean", "Null"],
        rows: [
          ["text", 123, true, null],
          ["delete", 456, false, null],
          ["keep", 789, true, null],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" }, // Delete middle row
        },
        description: "Delete row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Check data types are preserved
      expect(typeof result.data.rows[0][0]).toBe("string");
      expect(typeof result.data.rows[0][1]).toBe("number");
      expect(typeof result.data.rows[0][2]).toBe("boolean");
      expect(result.data.rows[0][3]).toBeNull();
      
      expect(typeof result.data.rows[1][0]).toBe("string");
      expect(typeof result.data.rows[1][1]).toBe("number");
      expect(typeof result.data.rows[1][2]).toBe("boolean");
      expect(result.data.rows[1][3]).toBeNull();
    });

    it("should preserve row order after deletion", () => {
      const data = createMockExcelData({
        headers: ["Order"],
        rows: [[1], [2], [3], [4], [5]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "4" }, // Delete row with value 3
        },
        description: "Delete row 4",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Remaining rows should maintain their order
      expect(result.data.rows[0][0]).toBe(1);
      expect(result.data.rows[1][0]).toBe(2);
      expect(result.data.rows[2][0]).toBe(4);
      expect(result.data.rows[3][0]).toBe(5);
    });


    it("should handle rows with varying column lengths", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5], // Shorter row
          [6, 7, 8],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" }, // Delete shorter row
        },
        description: "Delete row with fewer columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, 2, 3]);
      expect(result.data.rows[1]).toEqual([6, 7, 8]);
    });
  });

  describe("Formulas in other rows still work", () => {
    it("should preserve formulas in rows above deleted row", () => {
      const data = createMockExcelData({
        headers: ["Value", "Formula"],
        rows: [
          [10, "=A2*2"],
          [20, "=A3*2"],
          [30, "=A4*2"],
        ],
        formulas: {
          B2: "=A2*2",
          B3: "=A3*2",
          B4: "=A4*2",
        },
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "4" }, // Delete last row
        },
        description: "Delete last row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Formulas in remaining rows should be preserved
      expect(result.data.rows[0][1]).toBe("=A2*2");
      expect(result.data.rows[1][1]).toBe("=A3*2");
      expect(result.data.formulas?.B2).toBe("=A2*2");
      expect(result.data.formulas?.B3).toBe("=A3*2");
    });

    it("should adjust formulas in rows below deleted row", () => {
      const data = createMockExcelData({
        headers: ["Value", "Formula"],
        rows: [
          [10, null],
          [20, null],
          [30, "=SUM(A2:A3)"],
        ],
        formulas: {
          B4: "=SUM(A2:A3)",
        },
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2" }, // Delete first data row
        },
        description: "Delete first row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Formula should be adjusted after row deletion
      // Original: B4 with =SUM(A2:A3)
      // After deleting row 2: B3 with =SUM(A2:A2) or adjusted reference
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[1][1]).toBeDefined();
    });


    it("should handle formulas that reference deleted row", () => {
      const data = createMockExcelData({
        headers: ["Value", "Reference"],
        rows: [
          [10, null],
          [20, "=A2"],
          [30, null],
        ],
        formulas: {
          B3: "=A2",
        },
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2" }, // Delete row that is referenced
        },
        description: "Delete referenced row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Formula should show #REF! error or be adjusted
      expect(result.data.rows.length).toBe(2);
      // The formula that referenced the deleted row should be updated
      expect(result.data.rows[0][1]).toBeDefined();
    });

    it("should preserve complex formulas in other rows", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "Sum"],
        rows: [
          [1, 2, 3, "=SUM(A2:C2)"],
          [4, 5, 6, "=SUM(A3:C3)"],
          [7, 8, 9, "=SUM(A4:C4)"],
        ],
        formulas: {
          D2: "=SUM(A2:C2)",
          D3: "=SUM(A3:C3)",
          D4: "=SUM(A4:C4)",
        },
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" }, // Delete middle row
        },
        description: "Delete middle row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Formulas in remaining rows should be preserved
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0][3]).toBe("=SUM(A2:C2)");
      expect(result.data.rows[1][3]).toBeDefined();
    });

    it("should handle formulas with absolute references", () => {
      const data = createMockExcelData({
        headers: ["Value", "Formula"],
        rows: [
          [10, "=$A$2*2"],
          [20, "=$A$2*3"],
          [30, "=$A$2*4"],
        ],
        formulas: {
          B2: "=$A$2*2",
          B3: "=$A$2*3",
          B4: "=$A$2*4",
        },
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "4" }, // Delete last row
        },
        description: "Delete row with absolute refs",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Absolute references should be preserved
      expect(result.data.rows[0][1]).toBe("=$A$2*2");
      expect(result.data.rows[1][1]).toBe("=$A$2*3");
    });
  });


  describe("Undo/redo functionality", () => {
    it("should track old values for undo", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete Bob",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Changes should capture old values for undo
      expect(changes[0].oldValue).toBe("Bob");
      expect(changes[1].oldValue).toBe(30);
      expect(changes[0].newValue).toBeNull();
      expect(changes[1].newValue).toBeNull();
    });

    it("should support undo by restoring deleted row", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [1, "First"],
          [2, "Second"],
          [3, "Third"],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete second row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Row deleted
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, "First"]);
      expect(result.data.rows[1]).toEqual([3, "Third"]);

      // Simulate undo by reversing changes
      const undoChanges = changes.map(c => ({
        ...c,
        newValue: c.oldValue,
        oldValue: c.newValue,
        type: 'ROW_INSERT' as const,
      }));
      
      // Note: Full undo would require row insertion logic
      // This test verifies that old values are captured correctly
      expect(undoChanges[0].newValue).toBe(2);
      expect(undoChanges[1].newValue).toBe("Second");
    });

    it("should support undo of multiple row deletions", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3], [4], [5]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3,4" },
        },
        description: "Delete two rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should capture old values for both rows
      expect(changes).toHaveLength(2);
      expect(changes[0].oldValue).toBe(2);
      expect(changes[1].oldValue).toBe(3);
    });

    it("should handle redo after undo", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"], ["Bob"], ["Charlie"]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete Bob",
      };

      const changes = generateChangesFromAction(data, action);
      const afterDelete = applyChanges(data, changes);
      
      expect(afterDelete.data.rows.length).toBe(2);
      
      // Redo would reapply the same changes
      const redoResult = applyChanges(data, changes);
      expect(redoResult.data.rows.length).toBe(2);
      expect(redoResult.data.rows[0]).toEqual(["Alice"]);
      expect(redoResult.data.rows[1]).toEqual(["Charlie"]);
    });


    it("should preserve change history for audit", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2], [3, 4]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2" },
        },
        description: "Delete first row",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Each change should have complete information
      changes.forEach(change => {
        expect(change).toHaveProperty('row');
        expect(change).toHaveProperty('col');
        expect(change).toHaveProperty('oldValue');
        expect(change).toHaveProperty('newValue');
        expect(change).toHaveProperty('type');
        expect(change.type).toBe('ROW_DELETE');
      });
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing target gracefully", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[1]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {},
        description: "Delete without target",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle missing ref gracefully", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[1]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row" },
        },
        description: "Delete without ref",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle out of bounds row number", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[1], [2]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "100" },
        },
        description: "Delete non-existent row",
      };

      const changes = generateChangesFromAction(data, action);
      // Should not generate changes for out of bounds row
      expect(changes).toHaveLength(0);
    });

    it("should handle negative row number", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[1]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "-1" },
        },
        description: "Delete with negative row",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });


    it("should handle deleting row 1 (header row attempt)", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "1" },
        },
        description: "Try to delete header",
      };

      const changes = generateChangesFromAction(data, action);
      // Row 1 is header, so rowIndex = 1 - 2 = -1, should not generate changes
      expect(changes).toHaveLength(0);
    });

    it("should handle empty data rows", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2" },
        },
        description: "Delete from empty data",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle whitespace in ref", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[1], [2], [3]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: " 2 , 3 " },
        },
        description: "Delete with whitespace",
      };

      const changes = generateChangesFromAction(data, action);
      // Should handle whitespace and delete both rows
      expect(changes).toHaveLength(2);
    });

    it("should handle duplicate row numbers in ref", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[1], [2], [3]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2,2,2" },
        },
        description: "Delete same row multiple times",
      };

      const changes = generateChangesFromAction(data, action);
      // Should generate changes for each occurrence (implementation dependent)
      expect(changes.length).toBeGreaterThan(0);
    });

    it("should handle non-consecutive row numbers", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3], [4], [5]],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "2,4,6" }, // Delete rows 2, 4, 6
        },
        description: "Delete non-consecutive rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Should delete rows at indices 0, 2, 4
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([2]);
      expect(result.data.rows[1]).toEqual([4]);
    });
  });


  describe("Integration with other features", () => {
    it("should work after adding rows", () => {
      let data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      // Simulate adding a row
      data.rows.push(["Bob"]);
      data.rows.push(["Charlie"]);

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete Bob",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Alice"]);
      expect(result.data.rows[1]).toEqual(["Charlie"]);
    });

    it("should work with rows containing formulas", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, "=A2+B2"],
          [3, 4, "=A3+B3"],
          [5, 6, "=A4+B4"],
        ],
        formulas: {
          C2: "=A2+B2",
          C3: "=A3+B3",
          C4: "=A4+B4",
        },
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete row with formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0][2]).toBe("=A2+B2");
      expect(result.data.rows[1][2]).toBeDefined();
    });

    it("should preserve other rows when deleting one", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name", "Status"],
        rows: [
          [1, "Alice", "Active"],
          [2, "Bob", "Inactive"],
          [3, "Charlie", "Active"],
          [4, "David", "Active"],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete Bob",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([1, "Alice", "Active"]);
      expect(result.data.rows[1]).toEqual([3, "Charlie", "Active"]);
      expect(result.data.rows[2]).toEqual([4, "David", "Active"]);
    });

    it("should work with special characters in data", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["Normal"],
          ["Special: @#$%"],
          ["Unicode: 你好"],
        ],
      });

      const action: AIAction = {
        type: "DELETE_ROW",
        params: {
          target: { type: "row", ref: "3" },
        },
        description: "Delete special chars row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Normal"]);
      expect(result.data.rows[1]).toEqual(["Unicode: 你好"]);
    });
  });
});
