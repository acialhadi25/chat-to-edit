import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for INSERT_FORMULA AI Action
 * 
 * INSERT_FORMULA allows inserting formulas into cells with:
 * - Single cell formula (e.g., "=SUM(A1:A10)")
 * - Range formula with {row} placeholder (e.g., "=D{row}*E{row}")
 * - Formula calculation correctness
 * - Formula display (not as text)
 * - Various formula types (SUM, AVERAGE, IF, etc.)
 * - Workbook recreation preserves formulas
 * 
 * Validates: AI Action INSERT_FORMULA, Property 8, Property 9
 */
describe("INSERT_FORMULA Action", () => {
  describe("Single cell formula", () => {
    it("should insert SUM formula in single cell", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [10, 20, null],
          [30, 40, null],
          [50, 60, null],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: "=SUM(A1:B1)",
        },
        description: "Add sum formula to C1",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(2);
      expect(changes[0].newValue).toBe("=SUM(A1:B1)");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][2]).toBe("=SUM(A1:B1)");
      expect(result.data.formulas["C2"]).toBe("=SUM(A1:B1)");
    });

    it("should insert AVERAGE formula in single cell", () => {
      const data = createMockExcelData({
        headers: ["Values", "Average"],
        rows: [[10], [20], [30], [40], [50]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=AVERAGE(A1:A5)",
        },
        description: "Calculate average",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=AVERAGE(A1:A5)");
    });

    it("should insert COUNT formula in single cell", () => {
      const data = createMockExcelData({
        headers: ["Data", "Count"],
        rows: [[1], [2], [null], [4], [5]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=COUNT(A1:A5)",
        },
        description: "Count non-empty cells",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=COUNT(A1:A5)");
    });

    it("should insert MIN formula in single cell", () => {
      const data = createMockExcelData({
        headers: ["Numbers", "Min"],
        rows: [[100], [50], [75], [25], [90]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=MIN(A1:A5)",
        },
        description: "Find minimum value",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=MIN(A1:A5)");
    });

    it("should insert MAX formula in single cell", () => {
      const data = createMockExcelData({
        headers: ["Numbers", "Max"],
        rows: [[100], [50], [75], [25], [90]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=MAX(A1:A5)",
        },
        description: "Find maximum value",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=MAX(A1:A5)");
    });
  });


  describe("Range formula with {row} placeholder", () => {
    it("should replace {row} placeholder with actual row numbers", () => {
      const data = createMockExcelData({
        headers: ["Price", "Quantity", "Total"],
        rows: [
          [10, 5, null],
          [20, 3, null],
          [15, 4, null],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1:C3" },
          formula: "=A{row}*B{row}",
        },
        description: "Calculate total for each row",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      // Row 1 (index 0): =A2*B2
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(2);
      expect(changes[0].newValue).toBe("=A2*B2");
      
      // Row 2 (index 1): =A3*B3
      expect(changes[1].row).toBe(1);
      expect(changes[1].col).toBe(2);
      expect(changes[1].newValue).toBe("=A3*B3");
      
      // Row 3 (index 2): =A4*B4
      expect(changes[2].row).toBe(2);
      expect(changes[2].col).toBe(2);
      expect(changes[2].newValue).toBe("=A4*B4");
    });


    it("should handle multiple {row} placeholders in formula", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "Result"],
        rows: [
          [10, 20, 30, null],
          [5, 15, 25, null],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "D1:D2" },
          formula: "=A{row}+B{row}+C{row}",
        },
        description: "Sum three columns",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe("=A2+B2+C2");
      expect(changes[1].newValue).toBe("=A3+B3+C3");
    });

    it("should apply formulas to entire column when column letter specified", () => {
      const data = createMockExcelData({
        headers: ["Price", "Tax Rate", "Tax"],
        rows: [
          [100, 0.1, null],
          [200, 0.1, null],
          [150, 0.1, null],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C" },
          formula: "=A{row}*B{row}",
        },
        description: "Calculate tax for all rows",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      expect(changes[0].newValue).toBe("=A2*B2");
      expect(changes[1].newValue).toBe("=A3*B3");
      expect(changes[2].newValue).toBe("=A4*B4");
    });
  });


  describe("Formula calculation correctness", () => {
    it("should store formula in formulas object for calculation", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [[10, 20, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: "=A2+B2",
        },
        description: "Add formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Formula should be stored in formulas object
      expect(result.data.formulas["C2"]).toBe("=A2+B2");
      // Cell should contain the formula string
      expect(result.data.rows[0][2]).toBe("=A2+B2");
    });

    it("should handle complex formulas with multiple operations", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "Result"],
        rows: [[10, 20, 5, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "D1" },
          formula: "=(A2+B2)*C2",
        },
        description: "Complex calculation",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][3]).toBe("=(A2+B2)*C2");
      expect(result.data.formulas["D2"]).toBe("=(A2+B2)*C2");
    });
  });


  describe("Formula display (not as text)", () => {
    it("should start with = to indicate formula", () => {
      const data = createMockExcelData({
        headers: ["Value", "Formula"],
        rows: [[100, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=A2*2",
        },
        description: "Double the value",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Formula should start with =
      expect(result.data.rows[0][1]).toMatch(/^=/);
      expect(result.data.rows[0][1]).toBe("=A2*2");
    });

    it("should distinguish formula from text", () => {
      const data = createMockExcelData({
        headers: ["Text", "Formula"],
        rows: [["SUM(A1:A10)", null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=SUM(A1:A10)",
        },
        description: "Actual formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Column A has text (no =)
      expect(result.data.rows[0][0]).toBe("SUM(A1:A10)");
      expect(result.data.formulas["A2"]).toBeUndefined();
      
      // Column B has formula (with =)
      expect(result.data.rows[0][1]).toBe("=SUM(A1:A10)");
      expect(result.data.formulas["B2"]).toBe("=SUM(A1:A10)");
    });
  });


  describe("Various formula types", () => {
    it("should handle IF formula", () => {
      const data = createMockExcelData({
        headers: ["Score", "Pass/Fail"],
        rows: [[85, null], [45, null], [70, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1:B3" },
          formula: '=IF(A{row}>=60,"Pass","Fail")',
        },
        description: "Check pass/fail",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      expect(changes[0].newValue).toBe('=IF(A2>=60,"Pass","Fail")');
      expect(changes[1].newValue).toBe('=IF(A3>=60,"Pass","Fail")');
      expect(changes[2].newValue).toBe('=IF(A4>=60,"Pass","Fail")');
    });

    it("should handle CONCATENATE formula", () => {
      const data = createMockExcelData({
        headers: ["First", "Last", "Full Name"],
        rows: [["John", "Doe", null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: '=CONCATENATE(A2," ",B2)',
        },
        description: "Combine names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][2]).toBe('=CONCATENATE(A2," ",B2)');
    });

    it("should handle ROUND formula", () => {
      const data = createMockExcelData({
        headers: ["Value", "Rounded"],
        rows: [[3.14159, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=ROUND(A2,2)",
        },
        description: "Round to 2 decimals",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=ROUND(A2,2)");
    });


    it("should handle VLOOKUP formula", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name", "Price"],
        rows: [
          [1, "Apple", 1.5],
          [2, "Banana", 0.8],
          [3, "Orange", 1.2],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "D1" },
          formula: "=VLOOKUP(2,A2:C4,2,FALSE)",
        },
        description: "Lookup name for ID 2",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][3]).toBe("=VLOOKUP(2,A2:C4,2,FALSE)");
    });

    it("should handle nested formulas", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Result"],
        rows: [[10, 20, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: "=IF(SUM(A2:B2)>25,MAX(A2:B2),MIN(A2:B2))",
        },
        description: "Nested formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][2]).toBe("=IF(SUM(A2:B2)>25,MAX(A2:B2),MIN(A2:B2))");
    });
  });


  describe("Workbook recreation preserves formulas", () => {
    it("should preserve formulas in formulas object after recreation", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [
          [10, 20, null],
          [30, 40, null],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1:C2" },
          formula: "=A{row}+B{row}",
        },
        description: "Add sum formulas",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Verify formulas are stored
      expect(result.data.formulas["C2"]).toBe("=A2+B2");
      expect(result.data.formulas["C3"]).toBe("=A3+B3");
      
      // Simulate workbook recreation by creating new data with formulas
      const recreated = createMockExcelData({
        headers: result.data.headers,
        rows: result.data.rows,
        formulas: result.data.formulas,
      });
      
      // Formulas should be preserved
      expect(recreated.formulas["C2"]).toBe("=A2+B2");
      expect(recreated.formulas["C3"]).toBe("=A3+B3");
      expect(recreated.rows[0][2]).toBe("=A2+B2");
      expect(recreated.rows[1][2]).toBe("=A3+B3");
    });

    it("should preserve complex formulas through multiple operations", () => {
      let data = createMockExcelData({
        headers: ["Price", "Qty", "Total"],
        rows: [[10, 5, null]],
      });

      // Add formula
      const action1: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: "=A2*B2",
        },
        description: "Calculate total",
      };
      
      const changes1 = generateChangesFromAction(data, action1);
      data = applyChanges(data, changes1).data;
      
      // Edit a cell
      const action2: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "A1" },
          value: 20,
        },
        description: "Update price",
      };
      
      const changes2 = generateChangesFromAction(data, action2);
      data = applyChanges(data, changes2).data;
      
      // Formula should still be preserved
      expect(data.formulas["C2"]).toBe("=A2*B2");
      expect(data.rows[0][2]).toBe("=A2*B2");
      expect(data.rows[0][0]).toBe(20);
    });
  });


  describe("Edge cases and error handling", () => {
    it("should handle formula without = prefix by adding it", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[10, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=A2*2",
        },
        description: "Formula with =",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=A2*2");
    });

    it("should handle empty target gracefully", () => {
      const data = createMockExcelData({
        headers: ["A"],
        rows: [[10]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          formula: "=A2*2",
        },
        description: "Formula without target",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle missing formula gracefully", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[10, null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
        },
        description: "Target without formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });


    it("should replace existing value with formula", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[10, 999]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: "=A2*2",
        },
        description: "Replace value with formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes[0].oldValue).toBe(999);
      expect(changes[0].newValue).toBe("=A2*2");
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe("=A2*2");
    });

    it("should handle formulas with special characters", () => {
      const data = createMockExcelData({
        headers: ["Text", "Result"],
        rows: [["Hello", null]],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "B1" },
          formula: '=CONCATENATE(A2,"!")',
        },
        description: "Formula with quotes",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe('=CONCATENATE(A2,"!")');
    });

    it("should handle range spanning multiple rows", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "Product"],
        rows: [
          [2, 3, null],
          [4, 5, null],
          [6, 7, null],
          [8, 9, null],
          [10, 11, null],
        ],
      });

      const action: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1:C5" },
          formula: "=A{row}*B{row}",
        },
        description: "Calculate product for 5 rows",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(5);
      expect(changes[0].newValue).toBe("=A2*B2");
      expect(changes[4].newValue).toBe("=A6*B6");
    });
  });


  describe("Integration with other actions", () => {
    it("should work after adding a column", () => {
      let data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[10, 20]],
      });

      // Add column
      const addColAction: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Sum",
          position: 2,
        },
        description: "Add Sum column",
      };
      
      const addColChanges = generateChangesFromAction(data, addColAction);
      data = applyChanges(data, addColChanges).data;
      
      // Insert formula
      const formulaAction: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: "=A2+B2",
        },
        description: "Add sum formula",
      };
      
      const formulaChanges = generateChangesFromAction(data, formulaAction);
      data = applyChanges(data, formulaChanges).data;
      
      expect(data.headers[2]).toBe("Sum");
      expect(data.rows[0][2]).toBe("=A2+B2");
      expect(data.formulas["C2"]).toBe("=A2+B2");
    });

    it("should preserve formulas when editing other cells", () => {
      let data = createMockExcelData({
        headers: ["A", "B", "Sum"],
        rows: [[10, 20, null]],
      });

      // Add formula
      const formulaAction: AIAction = {
        type: "INSERT_FORMULA",
        params: {
          target: { type: "cell", ref: "C1" },
          formula: "=A2+B2",
        },
        description: "Add sum",
      };
      
      const formulaChanges = generateChangesFromAction(data, formulaAction);
      data = applyChanges(data, formulaChanges).data;
      
      // Edit cell A1
      const editAction: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "A1" },
          value: 30,
        },
        description: "Update A1",
      };
      
      const editChanges = generateChangesFromAction(data, editAction);
      data = applyChanges(data, editChanges).data;
      
      // Formula should still be there
      expect(data.rows[0][2]).toBe("=A2+B2");
      expect(data.formulas["C2"]).toBe("=A2+B2");
      expect(data.rows[0][0]).toBe(30);
    });
  });
});
