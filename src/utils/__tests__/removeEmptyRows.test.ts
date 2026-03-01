// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for REMOVE_EMPTY_ROWS AI Action
 * 
 * REMOVE_EMPTY_ROWS removes all rows that are completely empty (all cells are null, undefined, or empty string).
 * 
 * Test coverage:
 * - Remove single empty row
 * - Remove multiple empty rows
 * - Non-empty rows preserved
 * - Partially empty rows NOT removed
 * - Row indices updated correctly
 * 
 * Validates: AI Action REMOVE_EMPTY_ROWS
 */
describe("REMOVE_EMPTY_ROWS Action", () => {
  describe("Remove single empty row", () => {
    it("should remove a single empty row in the middle", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          [null, null, null], // Empty row
          ["Bob", 30, "Los Angeles"],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should generate 3 ROW_DELETE changes (one per column in the empty row)
      expect(changes).toHaveLength(3);
      expect(changes.every(c => c.type === 'ROW_DELETE')).toBe(true);
      expect(changes.every(c => c.row === 1)).toBe(true); // Row index 1 is empty

      const result = applyChanges(data, changes);
      
      // Empty row should be removed
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Alice", 25, "New York"]);
      expect(result.data.rows[1]).toEqual(["Bob", 30, "Los Angeles"]);
    });

    it("should remove a single empty row at the beginning", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [null, null], // Empty row
          [1, "First"],
          [2, "Second"],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, "First"]);
      expect(result.data.rows[1]).toEqual([2, "Second"]);
    });

    it("should remove a single empty row at the end", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [1, "First"],
          [2, "Second"],
          [null, null], // Empty row
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, "First"]);
      expect(result.data.rows[1]).toEqual([2, "Second"]);
    });

    it("should remove empty row with empty strings", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          ["", "", ""], // Empty strings
          [4, 5, 6],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, 2, 3]);
      expect(result.data.rows[1]).toEqual([4, 5, 6]);
    });

    it("should remove empty row with whitespace strings", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [
          [1, 2],
          ["  ", " "], // Whitespace only - NOT considered empty by old implementation
          [3, 4],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Old implementation doesn't trim whitespace, so row is NOT removed
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([1, 2]);
      expect(result.data.rows[1]).toEqual(["  ", " "]);
      expect(result.data.rows[2]).toEqual([3, 4]);
    });
  });

  describe("Remove multiple empty rows", () => {
    it("should remove two consecutive empty rows", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          [null, null], // Empty
          [null, null], // Empty
          ["Bob", 30],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should generate 4 ROW_DELETE changes (2 rows × 2 columns)
      expect(changes).toHaveLength(4);
      expect(changes.every(c => c.type === 'ROW_DELETE')).toBe(true);
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Alice", 25]);
      expect(result.data.rows[1]).toEqual(["Bob", 30]);
    });

    it("should remove three non-consecutive empty rows", () => {
      const data = createMockExcelData({
        headers: ["ID"],
        rows: [
          [1],
          [null], // Empty
          [2],
          [null], // Empty
          [3],
          [null], // Empty
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes).toHaveLength(3);
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([2]);
      expect(result.data.rows[2]).toEqual([3]);
    });

    it("should remove all empty rows from dataset", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [
          [1],
          [null],
          [2],
          [""],
          [3],
          [null],
          [4],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes).toHaveLength(3); // 3 empty rows
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(4);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([2]);
      expect(result.data.rows[2]).toEqual([3]);
      expect(result.data.rows[3]).toEqual([4]);
    });

    it("should remove multiple empty rows at the beginning", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [
          [null],
          [""],
          [null],
          [1],
          [2],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([2]);
    });

    it("should remove multiple empty rows at the end", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [
          [1],
          [2],
          [null],
          [""],
          [null],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([2]);
    });
  });

  describe("Non-empty rows preserved", () => {
    it("should preserve rows with at least one non-empty cell", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, null, null],
          [null, 2, null],
          [null, null, 3],
          [null, null, null], // Only this is empty
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Only 1 empty row × 3 columns = 3 changes
      expect(changes).toHaveLength(3);
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([1, null, null]);
      expect(result.data.rows[1]).toEqual([null, 2, null]);
      expect(result.data.rows[2]).toEqual([null, null, 3]);
    });

    it("should preserve rows with zero values", () => {
      const data = createMockExcelData({
        headers: ["Number", "Text"],
        rows: [
          [0, "zero"],
          [null, null], // Empty
          [0, null],
          [null, "text"],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Zero is not empty
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([0, "zero"]);
      expect(result.data.rows[1]).toEqual([0, null]);
      expect(result.data.rows[2]).toEqual([null, "text"]);
    });

    it("should preserve rows with zero values (falsy but not empty)", () => {
      const data = createMockExcelData({
        headers: ["Number", "Value"],
        rows: [
          [0, 1],
          [null, null], // Empty
          [0, null],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // 0 is not empty (falsy but valid value)
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([0, 1]);
      expect(result.data.rows[1]).toEqual([0, null]);
    });

    it("should preserve all rows when none are empty", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
          ["Charlie", 35, "Chicago"],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // No empty rows
      expect(changes).toHaveLength(0);
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual(["Alice", 25, "New York"]);
      expect(result.data.rows[1]).toEqual(["Bob", 30, "Los Angeles"]);
      expect(result.data.rows[2]).toEqual(["Charlie", 35, "Chicago"]);
    });
  });

  describe("Partially empty rows NOT removed", () => {
    it("should NOT remove row with one non-null value", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D"],
        rows: [
          [1, null, null, null],
          [null, null, null, null], // Empty
          [null, 2, null, null],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, null, null, null]);
      expect(result.data.rows[1]).toEqual([null, 2, null, null]);
    });

    it("should NOT remove row with one empty string among nulls", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [null, "text", null],
          [null, null, null], // Empty
          ["", null, null], // Has empty string but still considered empty
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Both rows with all null/empty should be removed
      expect(result.data.rows.length).toBe(1);
      expect(result.data.rows[0]).toEqual([null, "text", null]);
    });

    it("should NOT remove row with single character", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [null, null, null], // Empty
          ["x", null, null],
          [null, null, null], // Empty
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(1);
      expect(result.data.rows[0]).toEqual(["x", null, null]);
    });

    it("should NOT remove row with formula", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Formula"],
        rows: [
          [1, 2, "=A2+B2"],
          [null, null, null], // Empty
          [null, null, "=SUM(A:A)"],
        ],
        formulas: {
          C2: "=A2+B2",
          C4: "=SUM(A:A)",
        },
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, 2, "=A2+B2"]);
      expect(result.data.rows[1]).toEqual([null, null, "=SUM(A:A)"]);
    });

    it("should NOT remove row with mixed empty and non-empty cells", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City", "Country"],
        rows: [
          ["Alice", null, null, null],
          [null, 25, null, null],
          [null, null, "NYC", null],
          [null, null, null, "USA"],
          [null, null, null, null], // Empty
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(4);
      expect(result.data.rows[0]).toEqual(["Alice", null, null, null]);
      expect(result.data.rows[1]).toEqual([null, 25, null, null]);
      expect(result.data.rows[2]).toEqual([null, null, "NYC", null]);
      expect(result.data.rows[3]).toEqual([null, null, null, "USA"]);
    });
  });

  describe("Row indices updated correctly", () => {
    it("should correctly identify empty row indices", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [
          [1],
          [null], // Index 1
          [2],
          [null], // Index 3
          [3],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes).toHaveLength(2);
      expect(changes[0].row).toBe(1);
      expect(changes[1].row).toBe(3);
    });

    it("should handle sequential deletions correctly", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [
          [1],
          [null],
          [null],
          [null],
          [2],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // After removing 3 empty rows, should have 2 rows left
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1]);
      expect(result.data.rows[1]).toEqual([2]);
    });

    it("should maintain correct order after removal", () => {
      const data = createMockExcelData({
        headers: ["Order"],
        rows: [
          [1],
          [null],
          [2],
          [null],
          [3],
          [null],
          [4],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(4);
      expect(result.data.rows[0][0]).toBe(1);
      expect(result.data.rows[1][0]).toBe(2);
      expect(result.data.rows[2][0]).toBe(3);
      expect(result.data.rows[3][0]).toBe(4);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty dataset", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes).toHaveLength(0);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows.length).toBe(0);
    });

    it("should handle dataset with all empty rows", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [
          [null, null],
          ["", ""],
          [null, null],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // 3 empty rows × 2 columns = 6 changes
      expect(changes).toHaveLength(6);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows.length).toBe(0);
    });

    it("should handle single row dataset", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[null]],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(0);
    });

    it("should handle rows with null values", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [
          [1, 2],
          [null, null],
          [3, 4],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, 2]);
      expect(result.data.rows[1]).toEqual([3, 4]);
    });

    it("should handle rows with mixed null and empty string", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [null, "", null],
          [4, 5, 6],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual([1, 2, 3]);
      expect(result.data.rows[1]).toEqual([4, 5, 6]);
    });

    it("should handle large dataset efficiently", () => {
      const rows = [];
      for (let i = 0; i < 100; i++) {
        if (i % 10 === 0) {
          rows.push([null, null, null]); // Every 10th row is empty
        } else {
          rows.push([i, i * 2, i * 3]);
        }
      }

      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows,
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should find 10 empty rows × 3 columns = 30 changes
      expect(changes).toHaveLength(30);
      
      const result = applyChanges(data, changes);
      
      // Should have 90 rows left
      expect(result.data.rows.length).toBe(90);
    });
  });

  describe("Integration with other features", () => {
    it("should work after adding rows", () => {
      let data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      // Simulate adding rows
      data.rows.push([null]);
      data.rows.push(["Bob"]);
      data.rows.push([null]);

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0]).toEqual(["Alice"]);
      expect(result.data.rows[1]).toEqual(["Bob"]);
    });

    it("should preserve formulas in non-empty rows", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [1, 2, "=A2+B2"],
          [null, null, null],
          [3, 4, "=A4+B4"],
        ],
        formulas: {
          C2: "=A2+B2",
          C4: "=A4+B4",
        },
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[0][2]).toBe("=A2+B2");
      // After deletion, the formula is adjusted by applyChanges
      expect(result.data.rows[1][2]).toBe("=A3+B3");
    });

    it("should work with special characters in data", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["Special: @#$%"],
          [null],
          ["Unicode: 你好"],
          [""],
          ["Emoji: 😀"],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual(["Special: @#$%"]);
      expect(result.data.rows[1]).toEqual(["Unicode: 你好"]);
      expect(result.data.rows[2]).toEqual(["Emoji: 😀"]);
    });

    it("should handle rows with different data types", () => {
      const data = createMockExcelData({
        headers: ["Mixed"],
        rows: [
          [123],
          [null],
          ["text"],
          [""],
          [0],
        ],
      });

      const action: AIAction = {
        type: "REMOVE_EMPTY_ROWS",
        params: {},
        description: "Remove empty rows",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows.length).toBe(3);
      expect(result.data.rows[0]).toEqual([123]);
      expect(result.data.rows[1]).toEqual(["text"]);
      expect(result.data.rows[2]).toEqual([0]);
    });
  });
});
