import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for EDIT_ROW AI Action
 * 
 * EDIT_ROW allows editing an entire row with:
 * - rowData object with column names as keys
 * - Formula values (e.g., "=D8*E8")
 * - Column name mapping (flexible matching)
 * - Partial row data (not all columns need to be provided)
 * - Formulas calculate correctly
 * 
 * Validates: AI Action EDIT_ROW
 */
describe("EDIT_ROW Action", () => {
  describe("Row edit with rowData object", () => {
    it("should edit row with complete rowData object", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
          ["Charlie", 35, "Chicago"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Name: "David",
            Age: 28,
            City: "Boston",
          },
        },
        description: "Edit row 2 with new data",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      // Verify all columns are updated
      expect(changes.find(c => c.col === 0)?.newValue).toBe("David");
      expect(changes.find(c => c.col === 1)?.newValue).toBe(28);
      expect(changes.find(c => c.col === 2)?.newValue).toBe("Boston");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("David");
      expect(result.data.rows[0][1]).toBe(28);
      expect(result.data.rows[0][2]).toBe("Boston");
    });

    it("should edit row with mixed data types", () => {
      const data = createMockExcelData({
        headers: ["Product", "Price", "InStock", "Quantity"],
        rows: [
          ["Widget", 10.5, true, 100],
          ["Gadget", 25.0, false, 50],
        ],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Product: "Gizmo",
            Price: 15.75,
            InStock: true,
            Quantity: 75,
          },
        },
        description: "Edit row 2",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Gizmo");
      expect(result.data.rows[0][1]).toBe(15.75);
      expect(result.data.rows[0][2]).toBe(true);
      expect(result.data.rows[0][3]).toBe(75);
    });

    it("should handle row edit with string numbers", () => {
      const data = createMockExcelData({
        headers: ["ID", "Code", "Value"],
        rows: [["1", "ABC", "100"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            ID: "2",
            Code: "DEF",
            Value: "200",
          },
        },
        description: "Edit row with string numbers",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("2");
      expect(result.data.rows[0][1]).toBe("DEF");
      expect(result.data.rows[0][2]).toBe("200");
    });

    it("should edit multiple rows sequentially", () => {
      let data = createMockExcelData({
        headers: ["Name", "Score"],
        rows: [
          ["Alice", 85],
          ["Bob", 90],
          ["Charlie", 75],
        ],
      });

      // Edit row 2
      const action1: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: { Name: "Alice Updated", Score: 95 },
        },
        description: "Edit row 2",
      };
      
      const changes1 = generateChangesFromAction(data, action1);
      data = applyChanges(data, changes1).data;
      
      // Edit row 3
      const action2: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "3" },
          rowData: { Name: "Bob Updated", Score: 92 },
        },
        description: "Edit row 3",
      };
      
      const changes2 = generateChangesFromAction(data, action2);
      data = applyChanges(data, changes2).data;
      
      expect(data.rows[0][0]).toBe("Alice Updated");
      expect(data.rows[0][1]).toBe(95);
      expect(data.rows[1][0]).toBe("Bob Updated");
      expect(data.rows[1][1]).toBe(92);
      expect(data.rows[2][0]).toBe("Charlie");
      expect(data.rows[2][1]).toBe(75);
    });
  });

  describe("Row edit with formula values", () => {
    it("should edit row with formula in one column", () => {
      const data = createMockExcelData({
        headers: ["Price", "Quantity", "Total"],
        rows: [
          [10, 5, 50],
          [20, 3, 60],
        ],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Price: 15,
            Quantity: 4,
            Total: "=A2*B2",
          },
        },
        description: "Edit row 2 with formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(15);
      expect(result.data.rows[0][1]).toBe(4);
      expect(result.data.rows[0][2]).toBe("=A2*B2");
      expect(result.data.formulas["C2"]).toBe("=A2*B2");
    });

    it("should edit row with multiple formulas", () => {
      const data = createMockExcelData({
        headers: ["Base", "Tax", "Discount", "Total"],
        rows: [[100, null, null, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Base: 200,
            Tax: "=A2*0.1",
            Discount: "=A2*0.05",
            Total: "=A2+B2-C2",
          },
        },
        description: "Edit row with multiple formulas",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(200);
      expect(result.data.rows[0][1]).toBe("=A2*0.1");
      expect(result.data.rows[0][2]).toBe("=A2*0.05");
      expect(result.data.rows[0][3]).toBe("=A2+B2-C2");
      expect(result.data.formulas["B2"]).toBe("=A2*0.1");
      expect(result.data.formulas["C2"]).toBe("=A2*0.05");
      expect(result.data.formulas["D2"]).toBe("=A2+B2-C2");
    });

    it("should handle formula with specific row reference", () => {
      const data = createMockExcelData({
        headers: ["No", "Name", "Price", "Qty", "Total"],
        rows: [
          [1, "Item A", 100, 2, 200],
          [2, "Item B", 150, 3, 450],
          [3, "Item C", 200, 1, 200],
        ],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "9" },
          rowData: {
            No: 8,
            Name: "Item H",
            Price: 500,
            Qty: 2,
            Total: "=C9*D9",
          },
        },
        description: "Edit row 9 with formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Row 9 is index 7 (0-based, after header)
      expect(result.data.rows[7][0]).toBe(8);
      expect(result.data.rows[7][1]).toBe("Item H");
      expect(result.data.rows[7][2]).toBe(500);
      expect(result.data.rows[7][3]).toBe(2);
      expect(result.data.rows[7][4]).toBe("=C9*D9");
      expect(result.data.formulas["E9"]).toBe("=C9*D9");
    });

    it("should replace existing value with formula", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[10, 20, 30]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: 15,
            B: 25,
            C: "=A2+B2",
          },
        },
        description: "Replace value with formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes.find(c => c.col === 2)?.oldValue).toBe(30);
      expect(changes.find(c => c.col === 2)?.newValue).toBe("=A2+B2");
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][2]).toBe("=A2+B2");
    });

    it("should handle complex formulas in row", () => {
      const data = createMockExcelData({
        headers: ["Value", "Doubled", "Squared", "Result"],
        rows: [[5, null, null, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Value: 10,
            Doubled: "=A2*2",
            Squared: "=A2^2",
            Result: "=IF(B2>C2,B2,C2)",
          },
        },
        description: "Edit row with complex formulas",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(10);
      expect(result.data.rows[0][1]).toBe("=A2*2");
      expect(result.data.rows[0][2]).toBe("=A2^2");
      expect(result.data.rows[0][3]).toBe("=IF(B2>C2,B2,C2)");
    });
  });

  describe("Column name mapping", () => {
    it("should map exact column names", () => {
      const data = createMockExcelData({
        headers: ["FirstName", "LastName", "Email"],
        rows: [["John", "Doe", "john@example.com"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            FirstName: "Jane",
            LastName: "Smith",
            Email: "jane@example.com",
          },
        },
        description: "Edit with exact column names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Jane");
      expect(result.data.rows[0][1]).toBe("Smith");
      expect(result.data.rows[0][2]).toBe("jane@example.com");
    });

    it("should map case-insensitive column names", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [["Alice", 25, "New York"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            name: "Bob",
            AGE: 30,
            CiTy: "Boston",
          },
        },
        description: "Edit with case-insensitive names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Bob");
      expect(result.data.rows[0][1]).toBe(30);
      expect(result.data.rows[0][2]).toBe("Boston");
    });

    it("should map partial column name matches", () => {
      const data = createMockExcelData({
        headers: ["Customer Name", "Order Total", "Shipping Address"],
        rows: [["John Doe", 100, "123 Main St"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Name: "Jane Smith",
            Total: 150,
            Address: "456 Oak Ave",
          },
        },
        description: "Edit with partial column names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Jane Smith");
      expect(result.data.rows[0][1]).toBe(150);
      expect(result.data.rows[0][2]).toBe("456 Oak Ave");
    });

    it("should handle column names with spaces", () => {
      const data = createMockExcelData({
        headers: ["First Name", "Last Name", "Phone Number"],
        rows: [["John", "Doe", "555-1234"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            "First Name": "Jane",
            "Last Name": "Smith",
            "Phone Number": "555-5678",
          },
        },
        description: "Edit with spaced column names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Jane");
      expect(result.data.rows[0][1]).toBe("Smith");
      expect(result.data.rows[0][2]).toBe("555-5678");
    });

    it("should skip unmapped column names", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [["Alice", 25]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Name: "Bob",
            Age: 30,
            NonExistentColumn: "Should be ignored",
          },
        },
        description: "Edit with unmapped column",
      };

      const changes = generateChangesFromAction(data, action);
      // Should only generate changes for Name and Age
      expect(changes).toHaveLength(2);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Bob");
      expect(result.data.rows[0][1]).toBe(30);
    });
  });

  describe("Partial row data (not all columns)", () => {
    it("should edit only specified columns", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City", "Country"],
        rows: [["Alice", 25, "New York", "USA"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Name: "Bob",
            City: "Boston",
          },
        },
        description: "Edit only Name and City",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Bob");
      expect(result.data.rows[0][1]).toBe(25); // Unchanged
      expect(result.data.rows[0][2]).toBe("Boston");
      expect(result.data.rows[0][3]).toBe("USA"); // Unchanged
    });

    it("should edit single column in row", () => {
      const data = createMockExcelData({
        headers: ["ID", "Status", "Notes"],
        rows: [[1, "Pending", "Waiting for approval"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Status: "Approved",
          },
        },
        description: "Update only status",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(1);
      expect(result.data.rows[0][1]).toBe("Approved");
      expect(result.data.rows[0][2]).toBe("Waiting for approval");
    });

    it("should edit first and last columns only", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E"],
        rows: [[1, 2, 3, 4, 5]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: 10,
            E: 50,
          },
        },
        description: "Edit first and last",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(10);
      expect(result.data.rows[0][1]).toBe(2);
      expect(result.data.rows[0][2]).toBe(3);
      expect(result.data.rows[0][3]).toBe(4);
      expect(result.data.rows[0][4]).toBe(50);
    });

    it("should handle partial data with formulas", () => {
      const data = createMockExcelData({
        headers: ["Price", "Quantity", "Discount", "Total"],
        rows: [[100, 5, 10, 490]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Price: 150,
            Total: "=A2*B2-C2",
          },
        },
        description: "Update price and total formula",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(150);
      expect(result.data.rows[0][1]).toBe(5); // Unchanged
      expect(result.data.rows[0][2]).toBe(10); // Unchanged
      expect(result.data.rows[0][3]).toBe("=A2*B2-C2");
    });

    it("should preserve null values in unspecified columns", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D"],
        rows: [[1, null, 3, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: 10,
            C: 30,
          },
        },
        description: "Edit A and C only",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(10);
      expect(result.data.rows[0][1]).toBeNull();
      expect(result.data.rows[0][2]).toBe(30);
      expect(result.data.rows[0][3]).toBeNull();
    });
  });

  describe("Formulas in row calculate correctly", () => {
    it("should store formulas in formulas object", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[10, 20, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: 15,
            B: 25,
            C: "=A2+B2",
          },
        },
        description: "Add formula to row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.formulas["C2"]).toBe("=A2+B2");
      expect(result.data.rows[0][2]).toBe("=A2+B2");
    });

    it("should store multiple formulas in row", () => {
      const data = createMockExcelData({
        headers: ["Base", "Rate", "Tax", "Total"],
        rows: [[100, 0.1, null, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Base: 200,
            Rate: 0.15,
            Tax: "=A2*B2",
            Total: "=A2+C2",
          },
        },
        description: "Add multiple formulas",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.formulas["C2"]).toBe("=A2*B2");
      expect(result.data.formulas["D2"]).toBe("=A2+C2");
      expect(result.data.rows[0][2]).toBe("=A2*B2");
      expect(result.data.rows[0][3]).toBe("=A2+C2");
    });

    it("should handle formulas with different row numbers", () => {
      const data = createMockExcelData({
        headers: ["Value", "Result"],
        rows: [
          [10, null],
          [20, null],
          [30, null],
        ],
      });

      // Edit row 5 (index 3)
      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "5" },
          rowData: {
            Value: 40,
            Result: "=A5*2",
          },
        },
        description: "Edit row 5",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[3][0]).toBe(40);
      expect(result.data.rows[3][1]).toBe("=A5*2");
      expect(result.data.formulas["B5"]).toBe("=A5*2");
    });

    it("should handle formulas referencing other rows", () => {
      const data = createMockExcelData({
        headers: ["Value", "Previous", "Difference"],
        rows: [
          [100, null, null],
          [150, null, null],
        ],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "3" },
          rowData: {
            Value: 200,
            Previous: "=A2",
            Difference: "=A3-B3",
          },
        },
        description: "Edit row with cross-row references",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[1][0]).toBe(200);
      expect(result.data.rows[1][1]).toBe("=A2");
      expect(result.data.rows[1][2]).toBe("=A3-B3");
      expect(result.data.formulas["B3"]).toBe("=A2");
      expect(result.data.formulas["C3"]).toBe("=A3-B3");
    });

    it("should handle formulas with absolute references", () => {
      const data = createMockExcelData({
        headers: ["Value", "Multiplier", "Result"],
        rows: [[10, 5, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Value: 20,
            Multiplier: 3,
            Result: "=A2*$B$2",
          },
        },
        description: "Formula with absolute reference",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][2]).toBe("=A2*$B$2");
      expect(result.data.formulas["C2"]).toBe("=A2*$B$2");
    });

    it("should handle formulas with functions", () => {
      const data = createMockExcelData({
        headers: ["Numbers", "Sum", "Average", "Max"],
        rows: [[null, null, null, null]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Numbers: "1,2,3,4,5",
            Sum: "=SUM(A2:A6)",
            Average: "=AVERAGE(A2:A6)",
            Max: "=MAX(A2:A6)",
          },
        },
        description: "Formulas with functions",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][1]).toBe("=SUM(A2:A6)");
      expect(result.data.rows[0][2]).toBe("=AVERAGE(A2:A6)");
      expect(result.data.rows[0][3]).toBe("=MAX(A2:A6)");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty rowData object", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {},
        },
        description: "Empty rowData",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle missing target", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          rowData: { A: 10, B: 20 },
        },
        description: "Missing target",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle missing rowData", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
        },
        description: "Missing rowData",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle row beyond current data", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "10" },
          rowData: { A: 100, B: 200 },
        },
        description: "Edit row beyond data",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Should create new rows up to row 10
      expect(result.data.rows.length).toBeGreaterThanOrEqual(9);
      expect(result.data.rows[8][0]).toBe(100);
      expect(result.data.rows[8][1]).toBe(200);
    });

    it("should handle null values in rowData", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[1, 2, 3]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: null,
            B: 20,
            C: null,
          },
        },
        description: "Set some values to null",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBeNull();
      expect(result.data.rows[0][1]).toBe(20);
      expect(result.data.rows[0][2]).toBeNull();
    });

    it("should handle special characters in values", () => {
      const data = createMockExcelData({
        headers: ["Text", "Symbol", "Unicode"],
        rows: [["Normal", "A", "Text"]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Text: "Special: @#$%^&*()",
            Symbol: "€£¥",
            Unicode: "你好世界",
          },
        },
        description: "Special characters",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Special: @#$%^&*()");
      expect(result.data.rows[0][1]).toBe("€£¥");
      expect(result.data.rows[0][2]).toBe("你好世界");
    });

    it("should handle very long strings", () => {
      const data = createMockExcelData({
        headers: ["Short", "Long"],
        rows: [["A", "B"]],
      });

      const longString = "X".repeat(1000);
      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Short: "Y",
            Long: longString,
          },
        },
        description: "Long string",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][1]).toBe(longString);
      expect((result.data.rows[0][1] as string).length).toBe(1000);
    });

    it("should preserve other rows when editing one row", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "3" },
          rowData: { A: 30, B: 40 },
        },
        description: "Edit middle row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // First row unchanged
      expect(result.data.rows[0][0]).toBe(1);
      expect(result.data.rows[0][1]).toBe(2);
      
      // Second row changed
      expect(result.data.rows[1][0]).toBe(30);
      expect(result.data.rows[1][1]).toBe(40);
      
      // Third row unchanged
      expect(result.data.rows[2][0]).toBe(5);
      expect(result.data.rows[2][1]).toBe(6);
    });
  });

  describe("Integration with other actions", () => {
    it("should work after adding a column", () => {
      let data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [["Alice", 25]],
      });

      // Add column
      const addColAction: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "City",
          position: 2,
        },
        description: "Add City column",
      };
      
      const addColChanges = generateChangesFromAction(data, addColAction);
      data = applyChanges(data, addColChanges).data;

      // Edit row with new column
      const editRowAction: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            Name: "Bob",
            Age: 30,
            City: "Boston",
          },
        },
        description: "Edit row with new column",
      };
      
      const editRowChanges = generateChangesFromAction(data, editRowAction);
      data = applyChanges(data, editRowChanges).data;
      
      expect(data.headers[2]).toBe("City");
      expect(data.rows[0][0]).toBe("Bob");
      expect(data.rows[0][1]).toBe(30);
      expect(data.rows[0][2]).toBe("Boston");
    });

    it("should preserve formulas from INSERT_FORMULA", () => {
      let data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[10, 20, null]],
      });

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
      
      // Edit row (partial update)
      const editRowAction: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: 15,
            B: 25,
          },
        },
        description: "Update A and B",
      };
      
      const editRowChanges = generateChangesFromAction(data, editRowAction);
      data = applyChanges(data, editRowChanges).data;
      
      // Formula should still be there
      expect(data.rows[0][2]).toBe("=A2+B2");
      expect(data.formulas["C2"]).toBe("=A2+B2");
      expect(data.rows[0][0]).toBe(15);
      expect(data.rows[0][1]).toBe(25);
    });

    it("should work with EDIT_CELL on same row", () => {
      let data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[1, 2, 3]],
      });

      // Edit row
      const editRowAction: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: { A: 10, B: 20 },
        },
        description: "Edit row",
      };
      
      const editRowChanges = generateChangesFromAction(data, editRowAction);
      data = applyChanges(data, editRowChanges).data;
      
      // Edit single cell
      const editCellAction: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "C1" },
          value: 30,
        },
        description: "Edit C1",
      };
      
      const editCellChanges = generateChangesFromAction(data, editCellAction);
      data = applyChanges(data, editCellChanges).data;
      
      expect(data.rows[0][0]).toBe(10);
      expect(data.rows[0][1]).toBe(20);
      expect(data.rows[0][2]).toBe(30);
    });

    it("should handle multiple EDIT_ROW operations", () => {
      let data = createMockExcelData({
        headers: ["Name", "Score"],
        rows: [
          ["Alice", 85],
          ["Bob", 90],
          ["Charlie", 75],
        ],
      });

      // Edit row 2
      const action1: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: { Name: "Alice Updated", Score: 95 },
        },
        description: "Edit row 2",
      };
      data = applyChanges(data, generateChangesFromAction(data, action1)).data;
      
      // Edit row 3
      const action2: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "3" },
          rowData: { Name: "Bob Updated", Score: 92 },
        },
        description: "Edit row 3",
      };
      data = applyChanges(data, generateChangesFromAction(data, action2)).data;
      
      // Edit row 4
      const action3: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "4" },
          rowData: { Name: "Charlie Updated", Score: 88 },
        },
        description: "Edit row 4",
      };
      data = applyChanges(data, generateChangesFromAction(data, action3)).data;
      
      expect(data.rows[0][0]).toBe("Alice Updated");
      expect(data.rows[1][0]).toBe("Bob Updated");
      expect(data.rows[2][0]).toBe("Charlie Updated");
    });
  });

  describe("Undo/redo functionality", () => {
    it("should track old values for undo", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: { A: 10, B: 20 },
        },
        description: "Edit row",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes.find(c => c.col === 0)?.oldValue).toBe(1);
      expect(changes.find(c => c.col === 0)?.newValue).toBe(10);
      expect(changes.find(c => c.col === 1)?.oldValue).toBe(2);
      expect(changes.find(c => c.col === 1)?.newValue).toBe(20);
    });

    it("should support undo by reverting to old values", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [["Alice", 25]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: { Name: "Bob", Age: 30 },
        },
        description: "Edit row",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Bob");
      expect(result.data.rows[0][1]).toBe(30);

      // Simulate undo
      const undoChanges = changes.map(c => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      
      expect(undoResult.data.rows[0][0]).toBe("Alice");
      expect(undoResult.data.rows[0][1]).toBe(25);
    });

    it("should support undo with formulas", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[10, 20, 30]],
      });

      const action: AIAction = {
        type: "EDIT_ROW",
        params: {
          target: { type: "row", ref: "2" },
          rowData: {
            A: 15,
            B: 25,
            C: "=A2+B2",
          },
        },
        description: "Edit with formula",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][2]).toBe("=A2+B2");

      // Undo
      const undoChanges = changes.map(c => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      
      expect(undoResult.data.rows[0][0]).toBe(10);
      expect(undoResult.data.rows[0][1]).toBe(20);
      expect(undoResult.data.rows[0][2]).toBe(30);
    });
  });
});
