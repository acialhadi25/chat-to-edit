import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for EDIT_CELL AI Action
 * 
 * EDIT_CELL allows editing a single cell value with:
 * - String values
 * - Number values
 * - A1 notation (e.g., "A1", "B2")
 * - Row/col coordinates (e.g., row: 0, col: 0)
 * - Undo/redo functionality
 * 
 * Validates: AI Action EDIT_CELL
 */
describe("EDIT_CELL Action", () => {
  describe("Edit with string value", () => {
    it("should edit cell with string value using A1 notation", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "A1" },
          value: "Charlie",
        },
        description: "Edit cell A1 to Charlie",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(0);
      expect(changes[0].oldValue).toBe("Alice");
      expect(changes[0].newValue).toBe("Charlie");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Charlie");
    });

    it("should edit cell with string value using row/col coordinates", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 1, col: 2 },
          value: "San Francisco",
        },
        description: "Edit cell at row 1, col 2",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].row).toBe(1);
      expect(changes[0].col).toBe(2);
      expect(changes[0].oldValue).toBe("Los Angeles");
      expect(changes[0].newValue).toBe("San Francisco");

      const result = applyChanges(data, changes);
      expect(result.data.rows[1][2]).toBe("San Francisco");
    });

    it("should handle empty string value", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "A1" },
          value: "",
        },
        description: "Clear cell A1",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("");
    });

    it("should handle string with special characters", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [["Normal text"]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: "Special: @#$%^&*()",
        },
        description: "Edit with special characters",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Special: @#$%^&*()");
    });
  });

  describe("Edit with number value", () => {
    it("should edit cell with integer value", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [["Alice", 25]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "B1" },
          value: 30,
        },
        description: "Edit age to 30",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].newValue).toBe(30);

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe(30);
      expect(typeof result.data.rows[0][1]).toBe("number");
    });

    it("should edit cell with decimal value", () => {
      const data = createMockExcelData({
        headers: ["Price"],
        rows: [[10.5]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: 15.75,
        },
        description: "Edit price",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(15.75);
    });

    it("should edit cell with zero value", () => {
      const data = createMockExcelData({
        headers: ["Count"],
        rows: [[5]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "A1" },
          value: 0,
        },
        description: "Reset count to zero",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(0);
    });

    it("should edit cell with negative number", () => {
      const data = createMockExcelData({
        headers: ["Balance"],
        rows: [[100]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: -50,
        },
        description: "Set negative balance",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(-50);
    });
  });

  describe("Edit with A1 notation", () => {
    it("should handle single letter column (A-Z)", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E"],
        rows: [[1, 2, 3, 4, 5]],
      });

      const testCases = [
        { ref: "A1", col: 0 },
        { ref: "B1", col: 1 },
        { ref: "C1", col: 2 },
        { ref: "D1", col: 3 },
        { ref: "E1", col: 4 },
      ];

      testCases.forEach(({ ref, col }) => {
        const action: AIAction = {
          type: "EDIT_CELL",
          params: {
            target: { type: "cell", ref },
            value: 999,
          },
          description: `Edit ${ref}`,
        };

        const changes = generateChangesFromAction(data, action);
        expect(changes[0].col).toBe(col);
      });
    });

    it("should handle multi-row references", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Row1"], ["Row2"], ["Row3"], ["Row4"], ["Row5"]],
      });

      const testCases = [
        { ref: "A1", row: 0 },
        { ref: "A2", row: 1 },
        { ref: "A3", row: 2 },
        { ref: "A5", row: 4 },
      ];

      testCases.forEach(({ ref, row }) => {
        const action: AIAction = {
          type: "EDIT_CELL",
          params: {
            target: { type: "cell", ref },
            value: "Updated",
          },
          description: `Edit ${ref}`,
        };

        const changes = generateChangesFromAction(data, action);
        expect(changes[0].row).toBe(row);
      });
    });

    it("should handle double letter columns (AA, AB, etc.)", () => {
      // Create data with many columns
      const headers = Array.from({ length: 30 }, (_, i) => `Col${i}`);
      const row = Array.from({ length: 30 }, (_, i) => i);
      const data = createMockExcelData({ headers, rows: [row] });

      // Column AA is the 27th column (index 26)
      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "AA1" },
          value: 999,
        },
        description: "Edit AA1",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].col).toBe(26); // AA = 26 (0-indexed)
    });
  });

  describe("Edit with row/col coordinates", () => {
    it("should edit first cell (0,0)", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: 999,
        },
        description: "Edit first cell",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(0);

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(999);
    });

    it("should edit last cell in data", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 1, col: 2 },
          value: 999,
        },
        description: "Edit last cell",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[1][2]).toBe(999);
    });

    it("should handle middle cell coordinates", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E"],
        rows: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
        ],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 1, col: 2 },
          value: 888,
        },
        description: "Edit middle cell",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[1][2]).toBe(888);
    });
  });

  describe("Undo/redo functionality", () => {
    it("should track old value for undo", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "A1" },
          value: "Bob",
        },
        description: "Edit name",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].oldValue).toBe("Alice");
      expect(changes[0].newValue).toBe("Bob");
    });

    it("should support undo by reverting to old value", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[100]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: 200,
        },
        description: "Change value",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(200);

      // Simulate undo by applying reverse change
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      expect(undoResult.data.rows[0][0]).toBe(100);
    });

    it("should support multiple sequential edits", () => {
      let data = createMockExcelData({
        headers: ["Counter"],
        rows: [[0]],
      });

      // Edit 1: 0 -> 1
      const action1: AIAction = {
        type: "EDIT_CELL",
        params: { target: { row: 0, col: 0 }, value: 1 },
        description: "Increment to 1",
      };
      const changes1 = generateChangesFromAction(data, action1);
      data = applyChanges(data, changes1).data;
      expect(data.rows[0][0]).toBe(1);

      // Edit 2: 1 -> 2
      const action2: AIAction = {
        type: "EDIT_CELL",
        params: { target: { row: 0, col: 0 }, value: 2 },
        description: "Increment to 2",
      };
      const changes2 = generateChangesFromAction(data, action2);
      data = applyChanges(data, changes2).data;
      expect(data.rows[0][0]).toBe(2);

      // Edit 3: 2 -> 3
      const action3: AIAction = {
        type: "EDIT_CELL",
        params: { target: { row: 0, col: 0 }, value: 3 },
        description: "Increment to 3",
      };
      const changes3 = generateChangesFromAction(data, action3);
      data = applyChanges(data, changes3).data;
      expect(data.rows[0][0]).toBe(3);
    });

    it("should handle undo of null to value change", () => {
      const data = createMockExcelData({
        headers: ["Optional"],
        rows: [[null]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: "Filled",
        },
        description: "Fill empty cell",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].oldValue).toBeNull();
      expect(changes[0].newValue).toBe("Filled");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Filled");

      // Undo
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      expect(undoResult.data.rows[0][0]).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle editing cell with null value", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[null]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: "New Value",
        },
        description: "Fill null cell",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("New Value");
    });

    it("should handle setting cell to null", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [["Something"]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: null,
        },
        description: "Clear cell",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBeNull();
    });

    it("should handle editing same cell multiple times", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1]],
      });

      // First edit
      const action1: AIAction = {
        type: "EDIT_CELL",
        params: { target: { row: 0, col: 0 }, value: 2 },
        description: "Edit 1",
      };
      const changes1 = generateChangesFromAction(data, action1);
      const result1 = applyChanges(data, changes1);

      // Second edit on same cell
      const action2: AIAction = {
        type: "EDIT_CELL",
        params: { target: { row: 0, col: 0 }, value: 3 },
        description: "Edit 2",
      };
      const changes2 = generateChangesFromAction(result1.data, action2);
      const result2 = applyChanges(result1.data, changes2);

      expect(result2.data.rows[0][0]).toBe(3);
    });

    it("should preserve other cells when editing one cell", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 1 },
          value: 999,
        },
        description: "Edit B1",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Check edited cell
      expect(result.data.rows[0][1]).toBe(999);

      // Check other cells are unchanged
      expect(result.data.rows[0][0]).toBe(1);
      expect(result.data.rows[0][2]).toBe(3);
      expect(result.data.rows[1][0]).toBe(4);
      expect(result.data.rows[1][1]).toBe(5);
      expect(result.data.rows[1][2]).toBe(6);
    });

    it("should handle very long strings", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [["Short"]],
      });

      const longString = "A".repeat(1000);
      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: longString,
        },
        description: "Set long string",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(longString);
      expect((result.data.rows[0][0] as string).length).toBe(1000);
    });
  });

  describe("Error handling", () => {
    it("should handle missing target gracefully", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          value: 999,
        },
        description: "Edit without target",
      };

      const changes = generateChangesFromAction(data, action);
      // Should return empty changes array when target is missing
      expect(changes).toHaveLength(0);
    });

    it("should handle missing value gracefully", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
        },
        description: "Edit without value",
      };

      const changes = generateChangesFromAction(data, action);
      // Should return empty changes array when value is missing
      expect(changes).toHaveLength(0);
    });

    it("should handle out of bounds row gracefully", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 100, col: 0 },
          value: 999,
        },
        description: "Edit out of bounds row",
      };

      const changes = generateChangesFromAction(data, action);
      // applyChanges should handle this by creating new rows
      const result = applyChanges(data, changes);
      expect(result.data.rows.length).toBeGreaterThan(1);
      expect(result.data.rows[100][0]).toBe(999);
    });

    it("should handle out of bounds column gracefully", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 10 },
          value: 999,
        },
        description: "Edit out of bounds column",
      };

      const changes = generateChangesFromAction(data, action);
      // applyChanges should handle this by extending the row
      const result = applyChanges(data, changes);
      expect(result.data.rows[0].length).toBeGreaterThan(2);
      expect(result.data.rows[0][10]).toBe(999);
    });
  });

  describe("Integration with formulas", () => {
    it("should replace formula with value when editing cell", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [[1, 2, "=A2+B2"]],
        formulas: { C2: "=A2+B2" },
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "C1" },
          value: 100,
        },
        description: "Replace formula with value",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][2]).toBe(100);
      // Note: Formula removal is handled by applyChanges if needed
    });

    it("should allow setting a formula as a string value", () => {
      const data = createMockExcelData({
        headers: ["Formula"],
        rows: [[null]],
      });

      const action: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: "=SUM(A1:A10)",
        },
        description: "Set formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("=SUM(A1:A10)");
      // applyChanges should detect formula and add to formulas object
      expect(result.data.formulas["A2"]).toBe("=SUM(A1:A10)");
    });
  });
});

