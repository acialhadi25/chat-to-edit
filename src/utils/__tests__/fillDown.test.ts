// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for FILL_DOWN AI Action
 * 
 * FILL_DOWN fills down values or formulas from a source cell to a range:
 * - Copy values from source cell to target cells
 * - For formulas, adjust row references automatically (e.g., =A1 becomes =A2, =A3, etc.)
 * - Handle empty source cells
 * - Support range notation (e.g., "A1:A10")
 * - Preserve formula structure while updating row references
 * 
 * Validates: AI Action FILL_DOWN
 */
describe("FILL_DOWN Action", () => {
  describe("Fill down values (non-formula)", () => {
    it("should fill down string value from first cell", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          [null, 30, "Los Angeles"],
          [null, 35, "Chicago"],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down name column",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].row).toBe(1);
      expect(changes[0].col).toBe(0);
      expect(changes[0].oldValue).toBeNull();
      expect(changes[0].newValue).toBe("Alice");
      expect(changes[1].row).toBe(2);
      expect(changes[1].newValue).toBe("Alice");

      const result = applyChanges(data, changes);
      expect(result.data.rows[1][0]).toBe("Alice");
      expect(result.data.rows[2][0]).toBe("Alice");
    });

    it("should fill down number value from first cell", () => {
      const data = createMockExcelData({
        headers: ["Price", "Quantity"],
        rows: [
          [100, 5],
          [null, 10],
          [null, 15],
          [null, 20],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down price",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[1][0]).toBe(100);
      expect(result.data.rows[2][0]).toBe(100);
      expect(result.data.rows[3][0]).toBe(100);
    });

    it("should fill down from first non-empty cell", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [
          [null],
          [null],
          ["Active"],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down status",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].row).toBe(3);
      expect(changes[0].newValue).toBe("Active");
      expect(changes[1].row).toBe(4);
      expect(changes[1].newValue).toBe("Active");

      const result = applyChanges(data, changes);
      expect(result.data.rows[3][0]).toBe("Active");
      expect(result.data.rows[4][0]).toBe("Active");
    });

    it("should overwrite existing values when filling down", () => {
      const data = createMockExcelData({
        headers: ["Category"],
        rows: [
          ["Electronics"],
          ["Furniture"],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down category",
      };

      const changes = generateChangesFromAction(data, action);
      // FILL_DOWN fills to ALL rows below source, including non-empty ones
      expect(changes).toHaveLength(2);
      expect(changes[0].row).toBe(1);
      expect(changes[0].oldValue).toBe("Furniture");
      expect(changes[0].newValue).toBe("Electronics");
      expect(changes[1].row).toBe(2);
      expect(changes[1].oldValue).toBeNull();
      expect(changes[1].newValue).toBe("Electronics");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Electronics");
      expect(result.data.rows[1][0]).toBe("Electronics");
      expect(result.data.rows[2][0]).toBe("Electronics");
    });
  });

  describe("Fill down formulas with row adjustment", () => {
    it("should fill down formula with row reference adjustment", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [10, 20, "=A2+B2"],
          [30, 40, null],
          [50, 60, null],
        ],
        formulas: { C2: "=A2+B2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C" },
          fillType: "formula",
        },
        description: "Fill down sum formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      
      // Row 1 (index 1): =A3+B3
      expect(changes[0].row).toBe(1);
      expect(changes[0].col).toBe(2);
      expect(changes[0].newValue).toBe("=A3+B3");
      
      // Row 2 (index 2): =A4+B4
      expect(changes[1].row).toBe(2);
      expect(changes[1].col).toBe(2);
      expect(changes[1].newValue).toBe("=A4+B4");

      const result = applyChanges(data, changes);
      expect(result.data.rows[1][2]).toBe("=A3+B3");
      expect(result.data.rows[2][2]).toBe("=A4+B4");
    });

    it("should adjust multiple row references in formula", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "Result"],
        rows: [
          [10, 20, 30, "=A2+B2+C2"],
          [5, 15, 25, null],
          [8, 18, 28, null],
        ],
        formulas: { D2: "=A2+B2+C2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "D" },
          fillType: "formula",
        },
        description: "Fill down result formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe("=A3+B3+C3");
      expect(changes[1].newValue).toBe("=A4+B4+C4");
    });

    it("should handle formula with multiplication", () => {
      const data = createMockExcelData({
        headers: ["Price", "Qty", "Total"],
        rows: [
          [100, 5, "=A2*B2"],
          [200, 3, null],
          [150, 4, null],
        ],
        formulas: { C2: "=A2*B2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C" },
          fillType: "formula",
        },
        description: "Fill down total calculation",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe("=A3*B3");
      expect(changes[1].newValue).toBe("=A4*B4");

      const result = applyChanges(data, changes);
      expect(result.data.rows[1][2]).toBe("=A3*B3");
      expect(result.data.rows[2][2]).toBe("=A4*B4");
    });

    it("should handle complex formula with parentheses", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "Result"],
        rows: [
          [10, 20, 5, "=(A2+B2)*C2"],
          [15, 25, 3, null],
        ],
        formulas: { D2: "=(A2+B2)*C2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "D" },
          fillType: "formula",
        },
        description: "Fill down complex formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].newValue).toBe("=(A3+B3)*C3");
    });

    it("should handle SUM formula with range", () => {
      const data = createMockExcelData({
        headers: ["Values", "Sum"],
        rows: [
          [10, "=SUM(A2:A2)"],
          [20, null],
          [30, null],
        ],
        formulas: { B2: "=SUM(A2:A2)" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "B" },
          fillType: "formula",
        },
        description: "Fill down sum formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe("=SUM(A3:A3)");
      expect(changes[1].newValue).toBe("=SUM(A4:A4)");
    });
  });

  describe("Test with empty source cell", () => {
    it("should not generate changes when source cell is empty", () => {
      const data = createMockExcelData({
        headers: ["Empty"],
        rows: [
          [null],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Try to fill down from empty",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should not generate changes when all cells are empty strings", () => {
      const data = createMockExcelData({
        headers: ["Empty"],
        rows: [
          [""],
          [""],
          [""],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Try to fill down from empty strings",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should skip empty cells and use first non-empty cell", () => {
      const data = createMockExcelData({
        headers: ["Data"],
        rows: [
          [null],
          [""],
          ["Valid"],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down from first valid cell",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].row).toBe(3);
      expect(changes[0].newValue).toBe("Valid");
    });
  });

  describe("Test formula references updated correctly", () => {
    it("should only update row numbers that match source row", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Formula"],
        rows: [
          [10, 20, "=A2+100"],
          [30, 40, null],
        ],
        formulas: { C2: "=A2+100" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C" },
          fillType: "formula",
        },
        description: "Fill down formula with constant",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      // Should update A2 to A3, but keep 100 as is
      expect(changes[0].newValue).toBe("=A3+100");
    });

    it("should handle formula with absolute references", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Formula"],
        rows: [
          [10, 20, "=A2+$B$1"],
          [30, 40, null],
        ],
        formulas: { C2: "=A2+$B$1" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C" },
          fillType: "formula",
        },
        description: "Fill down with absolute reference",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      // Should update A2 to A3, absolute reference stays same
      expect(changes[0].newValue).toBe("=A3+$B$1");
    });

    it("should preserve formula structure with division", () => {
      const data = createMockExcelData({
        headers: ["Total", "Count", "Average"],
        rows: [
          [100, 5, "=A2/B2"],
          [200, 10, null],
        ],
        formulas: { C2: "=A2/B2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C" },
          fillType: "formula",
        },
        description: "Fill down division formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].newValue).toBe("=A3/B3");
    });

    it("should handle IF formula with row references", () => {
      const data = createMockExcelData({
        headers: ["Score", "Pass"],
        rows: [
          [85, '=IF(A2>=60,"Pass","Fail")'],
          [45, null],
          [70, null],
        ],
        formulas: { B2: '=IF(A2>=60,"Pass","Fail")' },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "B" },
          fillType: "formula",
        },
        description: "Fill down IF formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe('=IF(A3>=60,"Pass","Fail")');
      expect(changes[1].newValue).toBe('=IF(A4>=60,"Pass","Fail")');
    });
  });

  describe("Test with range notation", () => {
    it("should handle cell reference with row number", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [10, 20, "=A2+B2"],
          [30, 40, null],
          [50, 60, null],
        ],
        formulas: { C2: "=A2+B2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C2" },
          fillType: "formula",
        },
        description: "Fill down from C2",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe("=A3+B3");
      expect(changes[1].newValue).toBe("=A4+B4");
    });

    it("should handle column letter only", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [
          ["Active"],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down column A",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].col).toBe(0);
      expect(changes[1].col).toBe(0);
    });

    it("should work with different column letters", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E", "F"],
        rows: [
          [1, 2, 3, 4, 5, "=E2*10"],
          [6, 7, 8, 9, 10, null],
        ],
        formulas: { F2: "=E2*10" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "F" },
          fillType: "formula",
        },
        description: "Fill down column F",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].col).toBe(5);
      // The formula adjusts E2 to E3, and keeps 10 as is (since 10 != 2)
      expect(changes[0].newValue).toBe("=E3*10");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing target gracefully", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[10]],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          fillType: "value",
        },
        description: "Fill down without target",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle single row data", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[100]],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down single row",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should default to value fillType when not specified", () => {
      const data = createMockExcelData({
        headers: ["Data"],
        rows: [
          ["Test"],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
        },
        description: "Fill down without fillType",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].newValue).toBe("Test");
    });

    it("should handle formula as value when fillType is value", () => {
      const data = createMockExcelData({
        headers: ["Formula"],
        rows: [
          ["=A1+B1"],
          [null],
        ],
        formulas: { A2: "=A1+B1" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down formula as value",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      // When fillType is 'value', formula is copied as-is without adjustment
      expect(changes[0].newValue).toBe("=A1+B1");
    });

    it("should handle zero value", () => {
      const data = createMockExcelData({
        headers: ["Count"],
        rows: [
          [0],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down zero",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe(0);
      expect(changes[1].newValue).toBe(0);
    });

    it("should handle boolean values", () => {
      const data = createMockExcelData({
        headers: ["Active"],
        rows: [
          [true],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down boolean",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe(true);
      expect(changes[1].newValue).toBe(true);
    });
  });

  describe("Integration with applyChanges", () => {
    it("should correctly apply fill down changes to data", () => {
      const data = createMockExcelData({
        headers: ["Category", "Price"],
        rows: [
          ["Electronics", 100],
          [null, 200],
          [null, 300],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down category",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[0][0]).toBe("Electronics");
      expect(result.data.rows[1][0]).toBe("Electronics");
      expect(result.data.rows[2][0]).toBe("Electronics");
      // Other columns should remain unchanged
      expect(result.data.rows[0][1]).toBe(100);
      expect(result.data.rows[1][1]).toBe(200);
      expect(result.data.rows[2][1]).toBe(300);
    });

    it("should store formulas in formulas object when filling down", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [10, 20, "=A2+B2"],
          [30, 40, null],
        ],
        formulas: { C2: "=A2+B2" },
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "C" },
          fillType: "formula",
        },
        description: "Fill down sum",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[1][2]).toBe("=A3+B3");
      expect(result.data.formulas["C3"]).toBe("=A3+B3");
    });

    it("should track old values for undo functionality", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [
          ["Active"],
          ["Pending"],
          ["Inactive"],
        ],
      });

      const action: AIAction = {
        type: "FILL_DOWN",
        params: {
          target: { type: "cell", ref: "A" },
          fillType: "value",
        },
        description: "Fill down status",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].oldValue).toBe("Pending");
      expect(changes[1].oldValue).toBe("Inactive");

      // Apply changes
      const result = applyChanges(data, changes);
      expect(result.data.rows[1][0]).toBe("Active");
      expect(result.data.rows[2][0]).toBe("Active");

      // Simulate undo
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      expect(undoResult.data.rows[1][0]).toBe("Pending");
      expect(undoResult.data.rows[2][0]).toBe("Inactive");
    });
  });
});
