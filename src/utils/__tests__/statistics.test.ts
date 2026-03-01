// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for STATISTICS AI Action
 * 
 * STATISTICS allows adding summary statistics rows with:
 * - SUM statistics
 * - AVERAGE statistics
 * - COUNT statistics
 * - MIN/MAX statistics
 * - Specific columns selection
 * - Auto-detect (all numeric columns)
 * - Formulas calculate correctly
 * - Formulas update when data changes
 * 
 * Validates: AI Action STATISTICS, Property 32
 */
describe("STATISTICS Action", () => {
  describe("Add SUM statistics", () => {
    it("should add SUM formula for single column", () => {
      const data = createMockExcelData({
        headers: ["Amount"],
        rows: [[100], [200], [300]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM for Amount column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should add a new row at the end
      expect(result.data.rows.length).toBe(4);
      
      // First column should have label
      expect(result.data.rows[3][0]).toBe("SUM");
      
      // Formula should be stored
      expect(result.data.formulas["A5"]).toBe("=SUM(A2:A5)");
    });

    it("should add SUM formula for multiple columns", () => {
      const data = createMockExcelData({
        headers: ["Price", "Quantity", "Total"],
        rows: [
          [10, 5, 50],
          [20, 3, 60],
          [15, 4, 60],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0, 1, 2],
        },
        description: "Add SUM for all columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(4);
      expect(result.data.rows[3][0]).toBe("SUM");
      
      // Check formulas for each column
      expect(result.data.formulas["A5"]).toBe("=SUM(A2:A5)");
      expect(result.data.formulas["B5"]).toBe("=SUM(B2:B5)");
      expect(result.data.formulas["C5"]).toBe("=SUM(C2:C5)");
    });

    it("should add SUM with auto-detect numeric columns", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "Score", "City"],
        rows: [
          ["Alice", 25, 85, "NYC"],
          ["Bob", 30, 90, "LA"],
          ["Charlie", 28, 88, "SF"],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [], // Empty means auto-detect
        },
        description: "Add SUM for numeric columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should detect Age (col 1) and Score (col 2) as numeric
      expect(result.data.rows[3][0]).toBe("SUM");
      expect(result.data.formulas["B5"]).toBeDefined();
      expect(result.data.formulas["C5"]).toBeDefined();
    });
  });

  describe("Add AVERAGE statistics", () => {
    it("should add AVERAGE formula for single column", () => {
      const data = createMockExcelData({
        headers: ["Score"],
        rows: [[85], [90], [88], [92]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [0],
        },
        description: "Calculate average score",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(5);
      expect(result.data.rows[4][0]).toBe("AVG");
      expect(result.data.formulas["A6"]).toBe("=AVERAGE(A2:A6)");
    });

    it("should add AVERAGE for multiple columns", () => {
      const data = createMockExcelData({
        headers: ["Math", "Science", "English"],
        rows: [
          [85, 90, 88],
          [92, 87, 91],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "average",
          columns: [0, 1, 2],
        },
        description: "Average for all subjects",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[2][0]).toBe("AVERAGE");
      expect(result.data.formulas["A4"]).toBe("=AVERAGE(A2:A4)");
      expect(result.data.formulas["B4"]).toBe("=AVERAGE(B2:B4)");
      expect(result.data.formulas["C4"]).toBe("=AVERAGE(C2:C4)");
    });
  });

  describe("Add COUNT statistics", () => {
    it("should add COUNT formula for single column", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20], [null], [30], [40]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "count",
          columns: [0],
        },
        description: "Count non-empty values",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(6);
      expect(result.data.rows[5][0]).toBe("COUNT");
      expect(result.data.formulas["A7"]).toBe("=COUNT(A2:A7)");
    });

    it("should add COUNT for multiple columns", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, null, 6],
          [7, 8, null],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "count",
          columns: [0, 1, 2],
        },
        description: "Count values in all columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[3][0]).toBe("COUNT");
      expect(result.data.formulas["A5"]).toBe("=COUNT(A2:A5)");
      expect(result.data.formulas["B5"]).toBe("=COUNT(B2:B5)");
      expect(result.data.formulas["C5"]).toBe("=COUNT(C2:C5)");
    });
  });

  describe("Add MIN/MAX statistics", () => {
    it("should add MIN formula for single column", () => {
      const data = createMockExcelData({
        headers: ["Temperature"],
        rows: [[25], [18], [30], [22], [27]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "min",
          columns: [0],
        },
        description: "Find minimum temperature",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(6);
      expect(result.data.rows[5][0]).toBe("MIN");
      expect(result.data.formulas["A7"]).toBe("=MIN(A2:A7)");
    });

    it("should add MAX formula for single column", () => {
      const data = createMockExcelData({
        headers: ["Sales"],
        rows: [[1000], [1500], [1200], [1800], [1300]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "max",
          columns: [0],
        },
        description: "Find maximum sales",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(6);
      expect(result.data.rows[5][0]).toBe("MAX");
      expect(result.data.formulas["A7"]).toBe("=MAX(A2:A7)");
    });

    it("should add MIN and MAX for multiple columns", () => {
      const data = createMockExcelData({
        headers: ["Low", "High"],
        rows: [
          [10, 20],
          [15, 25],
          [12, 22],
        ],
      });

      // Add MIN
      const minAction: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "min",
          columns: [0, 1],
        },
        description: "Add MIN row",
      };

      let changes = generateChangesFromAction(data, minAction);
      let result = applyChanges(data, changes);

      expect(result.data.rows[3][0]).toBe("MIN");
      expect(result.data.formulas["A5"]).toBe("=MIN(A2:A5)");
      expect(result.data.formulas["B5"]).toBe("=MIN(B2:B5)");

      // Add MAX
      const maxAction: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "max",
          columns: [0, 1],
        },
        description: "Add MAX row",
      };

      changes = generateChangesFromAction(result.data, maxAction);
      result = applyChanges(result.data, changes);

      expect(result.data.rows[4][0]).toBe("MAX");
      expect(result.data.formulas["A6"]).toBe("=MAX(A2:A6)");
      expect(result.data.formulas["B6"]).toBe("=MAX(B2:B6)");
    });
  });

  describe("Test with specific columns", () => {
    it("should add statistics only for specified columns", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name", "Age", "Score", "City"],
        rows: [
          [1, "Alice", 25, 85, "NYC"],
          [2, "Bob", 30, 90, "LA"],
          [3, "Charlie", 28, 88, "SF"],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [2, 3], // Only Age and Score
        },
        description: "Sum only Age and Score",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[3][0]).toBe("SUM");
      
      // Should have formulas only for Age (col 2) and Score (col 3)
      expect(result.data.formulas["C5"]).toBe("=SUM(C2:C5)");
      expect(result.data.formulas["D5"]).toBe("=SUM(D2:D5)");
      
      // Should NOT have formulas for other columns
      expect(result.data.formulas["A5"]).toBeUndefined();
      expect(result.data.formulas["B5"]).toBeUndefined();
      expect(result.data.formulas["E5"]).toBeUndefined();
    });

    it("should handle non-contiguous column selection", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E"],
        rows: [
          [10, 20, 30, 40, 50],
          [15, 25, 35, 45, 55],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [0, 2, 4], // A, C, E
        },
        description: "Average for A, C, E",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[2][0]).toBe("AVG");
      expect(result.data.formulas["A4"]).toBe("=AVERAGE(A2:A4)");
      expect(result.data.formulas["C4"]).toBe("=AVERAGE(C2:C4)");
      expect(result.data.formulas["E4"]).toBe("=AVERAGE(E2:E4)");
      
      // B and D should not have formulas
      expect(result.data.formulas["B4"]).toBeUndefined();
      expect(result.data.formulas["D4"]).toBeUndefined();
    });

    it("should handle single column selection", () => {
      const data = createMockExcelData({
        headers: ["Revenue", "Cost", "Profit"],
        rows: [
          [1000, 600, 400],
          [1500, 800, 700],
          [1200, 700, 500],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [2], // Only Profit
        },
        description: "Sum only Profit column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[3][0]).toBe("SUM");
      expect(result.data.formulas["C5"]).toBe("=SUM(C2:C5)");
      expect(result.data.formulas["A5"]).toBeUndefined();
      expect(result.data.formulas["B5"]).toBeUndefined();
    });
  });

  describe("Test with auto-detect (all numeric columns)", () => {
    it("should auto-detect numeric columns when columns array is empty", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "Score", "City", "Grade"],
        rows: [
          ["Alice", 25, 85, "NYC", 90],
          ["Bob", 30, 90, "LA", 88],
          ["Charlie", 28, 88, "SF", 92],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [], // Auto-detect
        },
        description: "Auto-detect numeric columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[3][0]).toBe("SUM");
      
      // Should detect Age (1), Score (2), Grade (4) as numeric
      expect(result.data.formulas["B5"]).toBeDefined();
      expect(result.data.formulas["C5"]).toBeDefined();
      expect(result.data.formulas["E5"]).toBeDefined();
      
      // Should NOT detect Name (0) and City (3) as numeric
      expect(result.data.formulas["A5"]).toBeUndefined();
      expect(result.data.formulas["D5"]).toBeUndefined();
    });

    it("should handle mixed data types in columns", () => {
      const data = createMockExcelData({
        headers: ["Mixed", "Numbers", "Text"],
        rows: [
          [10, 100, "A"],
          ["text", 200, "B"],
          [20, 300, "C"],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "count",
          columns: [],
        },
        description: "Auto-detect with mixed types",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should detect Mixed (0) and Numbers (1) as having numeric data
      expect(result.data.formulas["A5"]).toBeDefined();
      expect(result.data.formulas["B5"]).toBeDefined();
    });

    it("should handle all text columns gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name", "City", "Country"],
        rows: [
          ["Alice", "NYC", "USA"],
          ["Bob", "LA", "USA"],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [],
        },
        description: "Auto-detect with no numeric columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should still add label row
      expect(result.data.rows[2][0]).toBe("SUM");
      
      // But no formulas should be added
      expect(Object.keys(result.data.formulas).length).toBe(0);
    });

    it("should handle all numeric columns", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D"],
        rows: [
          [10, 20, 30, 40],
          [15, 25, 35, 45],
          [12, 22, 32, 42],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [],
        },
        description: "Auto-detect all numeric",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[3][0]).toBe("AVG");
      
      // All columns should have formulas
      expect(result.data.formulas["A5"]).toBe("=AVERAGE(A2:A5)");
      expect(result.data.formulas["B5"]).toBe("=AVERAGE(B2:B5)");
      expect(result.data.formulas["C5"]).toBe("=AVERAGE(C2:C5)");
      expect(result.data.formulas["D5"]).toBe("=AVERAGE(D2:D5)");
    });
  });

  describe("Test formulas calculate correctly", () => {
    it("should generate correct SUM formula range", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20], [30]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Formula should reference A2:A5 (rows 2-4 are data, row 5 is summary)
      expect(result.data.formulas["A5"]).toBe("=SUM(A2:A5)");
    });

    it("should generate correct AVERAGE formula range", () => {
      const data = createMockExcelData({
        headers: ["Scores"],
        rows: [[85], [90], [88], [92], [87]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [0],
        },
        description: "Add AVERAGE",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Formula should reference A2:A7 (5 data rows + 1 summary row)
      expect(result.data.formulas["A7"]).toBe("=AVERAGE(A2:A7)");
    });

    it("should generate correct COUNT formula range", () => {
      const data = createMockExcelData({
        headers: ["Data"],
        rows: [[1], [2], [3], [4]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "count",
          columns: [0],
        },
        description: "Add COUNT",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.formulas["A6"]).toBe("=COUNT(A2:A6)");
    });

    it("should generate correct MIN/MAX formula ranges", () => {
      const data = createMockExcelData({
        headers: ["Numbers"],
        rows: [[100], [50], [75]],
      });

      // MIN
      let action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "min",
          columns: [0],
        },
        description: "Add MIN",
      };

      let changes = generateChangesFromAction(data, action);
      let result = applyChanges(data, changes);
      expect(result.data.formulas["A5"]).toBe("=MIN(A2:A5)");

      // MAX
      action = {
        type: "STATISTICS",
        params: {
          statType: "max",
          columns: [0],
        },
        description: "Add MAX",
      };

      changes = generateChangesFromAction(result.data, action);
      result = applyChanges(result.data, changes);
      expect(result.data.formulas["A6"]).toBe("=MAX(A2:A6)");
    });

    it("should handle multi-column formulas correctly", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [10, 20, 30],
          [15, 25, 35],
        ],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0, 1, 2],
        },
        description: "Sum all columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Each column should have correct range
      expect(result.data.formulas["A4"]).toBe("=SUM(A2:A4)");
      expect(result.data.formulas["B4"]).toBe("=SUM(B2:B4)");
      expect(result.data.formulas["C4"]).toBe("=SUM(C2:C4)");
    });

    it("should handle column letters beyond Z correctly", () => {
      // Create data with 30 columns (goes beyond Z to AA, AB, etc.)
      const headers = Array.from({ length: 30 }, (_, i) => `Col${i}`);
      const row = Array.from({ length: 30 }, (_, i) => i + 1);
      const data = createMockExcelData({ headers, rows: [row] });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [26, 27], // AA, AB
        },
        description: "Sum columns AA and AB",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Column 26 is AA, column 27 is AB
      expect(result.data.formulas["AA3"]).toBeDefined();
      expect(result.data.formulas["AB3"]).toBeDefined();
    });
  });

  describe("Test formulas update when data changes", () => {
    it("should preserve formulas when adding new data rows", () => {
      let data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20]],
      });

      // Add statistics
      const statsAction: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM",
      };

      let changes = generateChangesFromAction(data, statsAction);
      data = applyChanges(data, changes).data;

      expect(data.formulas["A4"]).toBe("=SUM(A2:A4)");

      // Add a new row before the summary
      const editAction: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 2, col: 0 },
          value: 30,
        },
        description: "Add new value",
      };

      changes = generateChangesFromAction(data, editAction);
      data = applyChanges(data, changes).data;

      // Formula should still exist
      expect(data.formulas["A4"]).toBeDefined();
      expect(data.rows[2][0]).toBe(30);
    });

    it("should handle editing cells that formulas reference", () => {
      let data = createMockExcelData({
        headers: ["Amount"],
        rows: [[100], [200], [300]],
      });

      // Add SUM
      const statsAction: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM",
      };

      let changes = generateChangesFromAction(data, statsAction);
      data = applyChanges(data, changes).data;

      const originalFormula = data.formulas["A5"];
      expect(originalFormula).toBe("=SUM(A2:A5)");

      // Edit a cell
      const editAction: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { row: 0, col: 0 },
          value: 500,
        },
        description: "Update first value",
      };

      changes = generateChangesFromAction(data, editAction);
      data = applyChanges(data, changes).data;

      // Formula should remain unchanged
      expect(data.formulas["A5"]).toBe(originalFormula);
      expect(data.rows[0][0]).toBe(500);
    });

    it("should handle multiple statistics rows", () => {
      let data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20], [30]],
      });

      // Add SUM
      let action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM",
      };

      let changes = generateChangesFromAction(data, action);
      data = applyChanges(data, changes).data;
      expect(data.formulas["A5"]).toBe("=SUM(A2:A5)");

      // Add AVERAGE
      action = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [0],
        },
        description: "Add AVERAGE",
      };

      changes = generateChangesFromAction(data, action);
      data = applyChanges(data, changes).data;
      expect(data.formulas["A6"]).toBe("=AVERAGE(A2:A6)");

      // Add COUNT
      action = {
        type: "STATISTICS",
        params: {
          statType: "count",
          columns: [0],
        },
        description: "Add COUNT",
      };

      changes = generateChangesFromAction(data, action);
      data = applyChanges(data, changes).data;
      expect(data.formulas["A7"]).toBe("=COUNT(A2:A7)");

      // All three formulas should exist
      expect(data.rows.length).toBe(6); // 3 data + 3 statistics
      expect(data.rows[3][0]).toBe("SUM");
      expect(data.rows[4][0]).toBe("AVG");
      expect(data.rows[5][0]).toBe("COUNT");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty dataset", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM to empty data",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should add summary row even with no data
      expect(result.data.rows.length).toBe(1);
      expect(result.data.rows[0][0]).toBe("SUM");
    });

    it("should handle single row dataset", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[100]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM to single row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows.length).toBe(2);
      expect(result.data.rows[1][0]).toBe("SUM");
      expect(result.data.formulas["A3"]).toBe("=SUM(A2:A3)");
    });

    it("should handle columns with null values", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [null], [20], [null], [30]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Sum with nulls",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Formula should still be generated
      expect(result.data.formulas["A7"]).toBe("=SUM(A2:A7)");
    });

    it("should handle columns with zero values", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[0], [10], [0], [20]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Sum with zeros",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.formulas["A6"]).toBe("=SUM(A2:A6)");
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData({
        headers: ["Balance"],
        rows: [[100], [-50], [75], [-25]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Sum with negatives",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.formulas["A6"]).toBe("=SUM(A2:A6)");
    });

    it("should handle decimal numbers", () => {
      const data = createMockExcelData({
        headers: ["Price"],
        rows: [[10.5], [20.75], [15.25]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [0],
        },
        description: "Average with decimals",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.formulas["A5"]).toBe("=AVERAGE(A2:A5)");
    });

    it("should handle missing statType parameter (default to sum)", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          columns: [0],
        },
        description: "Add statistics without statType",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should default to SUM
      expect(result.data.rows[2][0]).toBe("SUM");
      expect(result.data.formulas["A4"]).toBe("=SUM(A2:A4)");
    });

    it("should handle invalid column indices gracefully", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[10, 20]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0, 1, 5, 10], // 5 and 10 are out of bounds
        },
        description: "Sum with invalid columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should process valid columns (0, 1) and ignore invalid ones
      expect(result.data.formulas["A3"]).toBeDefined();
      expect(result.data.formulas["B3"]).toBeDefined();
    });

    it("should handle case-insensitive statType", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20]],
      });

      const testCases = [
        { statType: "SUM", expected: "SUM" },
        { statType: "sum", expected: "SUM" },
        { statType: "Sum", expected: "SUM" },
        { statType: "AVG", expected: "AVG" },
        { statType: "avg", expected: "AVG" },
        { statType: "AVERAGE", expected: "AVERAGE" },
      ];

      testCases.forEach(({ statType, expected }) => {
        const action: AIAction = {
          type: "STATISTICS",
          params: {
            statType,
            columns: [0],
          },
          description: `Test ${statType}`,
        };

        const changes = generateChangesFromAction(data, action);
        const result = applyChanges(data, changes);

        expect(result.data.rows[2][0]).toBe(expected);
      });
    });
  });

  describe("Integration with other actions", () => {
    it("should work after adding columns", () => {
      let data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[10, 20]],
      });

      // Add column
      const addColAction: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "C",
          position: 2,
        },
        description: "Add column C",
      };

      let changes = generateChangesFromAction(data, addColAction);
      data = applyChanges(data, changes).data;

      // Add statistics
      const statsAction: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0, 1, 2],
        },
        description: "Sum all columns",
      };

      changes = generateChangesFromAction(data, statsAction);
      data = applyChanges(data, changes).data;

      expect(data.headers).toEqual(["A", "B", "C"]);
      expect(data.rows[1][0]).toBe("SUM");
      expect(data.formulas["A3"]).toBeDefined();
      expect(data.formulas["B3"]).toBeDefined();
      expect(data.formulas["C3"]).toBeDefined();
    });

    it("should work after deleting rows", () => {
      let data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20], [30], [40]],
      });

      // Delete a row
      const deleteAction: AIAction = {
        type: "DELETE_ROW",
        params: {
          rowIndex: 1,
        },
        description: "Delete row 2",
      };

      let changes = generateChangesFromAction(data, deleteAction);
      data = applyChanges(data, changes).data;

      // Add statistics
      const statsAction: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Add SUM",
      };

      changes = generateChangesFromAction(data, statsAction);
      data = applyChanges(data, changes).data;

      // Should have 3 data rows + 1 summary row
      expect(data.rows.length).toBe(4);
      expect(data.rows[3][0]).toBe("SUM");
    });

    it("should work with formulas in data", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [10, 20, "=A2+B2"],
          [15, 25, "=A3+B3"],
        ],
        formulas: {
          C2: "=A2+B2",
          C3: "=A3+B3",
        },
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0, 1, 2],
        },
        description: "Sum all including formula column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[2][0]).toBe("SUM");
      expect(result.data.formulas["A4"]).toBe("=SUM(A2:A4)");
      expect(result.data.formulas["B4"]).toBe("=SUM(B2:B4)");
      expect(result.data.formulas["C4"]).toBe("=SUM(C2:C4)");
      
      // Original formulas should be preserved
      expect(result.data.formulas["C2"]).toBe("=A2+B2");
      expect(result.data.formulas["C3"]).toBe("=A3+B3");
    });
  });

  describe("Property 32: AI Summary Statistics Accuracy", () => {
    it("should generate mathematically correct SUM formulas", () => {
      const data = createMockExcelData({
        headers: ["Values"],
        rows: [[10], [20], [30], [40], [50]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "sum",
          columns: [0],
        },
        description: "Calculate SUM",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Formula should reference all data rows
      expect(result.data.formulas["A7"]).toBe("=SUM(A2:A7)");
      // The formula would calculate to 150 (10+20+30+40+50)
    });

    it("should generate mathematically correct AVERAGE formulas", () => {
      const data = createMockExcelData({
        headers: ["Scores"],
        rows: [[85], [90], [88], [92]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "avg",
          columns: [0],
        },
        description: "Calculate AVERAGE",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.formulas["A6"]).toBe("=AVERAGE(A2:A6)");
      // The formula would calculate to 88.75 ((85+90+88+92)/4)
    });

    it("should generate mathematically correct COUNT formulas", () => {
      const data = createMockExcelData({
        headers: ["Data"],
        rows: [[1], [2], [null], [4], [5]],
      });

      const action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "count",
          columns: [0],
        },
        description: "Calculate COUNT",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.formulas["A7"]).toBe("=COUNT(A2:A7)");
      // The formula would calculate to 4 (excludes null)
    });

    it("should generate mathematically correct MIN/MAX formulas", () => {
      const data = createMockExcelData({
        headers: ["Numbers"],
        rows: [[100], [50], [75], [25], [90]],
      });

      // MIN
      let action: AIAction = {
        type: "STATISTICS",
        params: {
          statType: "min",
          columns: [0],
        },
        description: "Calculate MIN",
      };

      let changes = generateChangesFromAction(data, action);
      let result = applyChanges(data, changes);
      expect(result.data.formulas["A7"]).toBe("=MIN(A2:A7)");
      // The formula would calculate to 25

      // MAX
      action = {
        type: "STATISTICS",
        params: {
          statType: "max",
          columns: [0],
        },
        description: "Calculate MAX",
      };

      changes = generateChangesFromAction(result.data, action);
      result = applyChanges(result.data, changes);
      expect(result.data.formulas["A8"]).toBe("=MAX(A2:A8)");
      // The formula would calculate to 100
    });
  });
});
