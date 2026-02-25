import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for ADD_COLUMN AI Action
 * 
 * ADD_COLUMN allows adding new columns to the spreadsheet with:
 * - Single column at end
 * - Multiple columns at once
 * - Column at start
 * - Column at specific position
 * - Auto-fill with pattern-based data
 * - Headers updated correctly
 * - Rows extended with null values
 * 
 * Validates: AI Action ADD_COLUMN
 */
describe("ADD_COLUMN Action", () => {
  describe("Add single column at end", () => {
    it("should add a single column at the end with header only", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "City",
        },
        description: "Add City column",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should have 1 change for the header
      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe("COLUMN_ADD");
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(2); // After "Name" and "Age"
      expect(changes[0].oldValue).toBe(null);
      expect(changes[0].newValue).toBe("City");
      expect(changes[0].columnName).toBe("City");

      const result = applyChanges(data, changes);
      expect(result.data.headers).toEqual(["Name", "Age", "City"]);
      expect(result.data.rows[0]).toEqual(["Alice", 25, null]);
      expect(result.data.rows[1]).toEqual(["Bob", 30, null]);
    });

    it("should add column with multi-word name", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Phone Number",
        },
        description: "Add Phone Number column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Phone Number"]);
      expect(result.data.rows[0]).toEqual(["Alice", null]);
    });

    it("should extract column name from description", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add Email column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Email"]);
    });
  });

  describe("Add multiple columns", () => {
    it("should add two columns at once", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add City and Country columns",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should have 2 changes for headers
      expect(changes).toHaveLength(2);
      expect(changes[0].type).toBe("COLUMN_ADD");
      expect(changes[0].newValue).toBe("City");
      expect(changes[0].col).toBe(1);
      expect(changes[1].type).toBe("COLUMN_ADD");
      expect(changes[1].newValue).toBe("Country");
      expect(changes[1].col).toBe(2);

      const result = applyChanges(data, changes);
      expect(result.data.headers).toEqual(["Name", "City", "Country"]);
      expect(result.data.rows[0]).toEqual(["Alice", null, null]);
      expect(result.data.rows[1]).toEqual(["Bob", null, null]);
    });

    it("should add multiple columns with Indonesian description", () => {
      const data = createMockExcelData({
        headers: ["Nama"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Tambah Alamat dan Telepon kolom",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Nama", "Alamat", "Telepon"]);
    });
  });

  describe("Add column at start", () => {
    it("should add column at the beginning using provided changes", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
        ],
      });

      // Simulate adding column at start by providing changes directly
      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add ID column at start",
        changes: [
          {
            row: 0,
            col: 0,
            oldValue: null,
            newValue: "ID",
            type: "COLUMN_ADD",
            columnName: "ID",
          },
        ],
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].col).toBe(0);
      expect(changes[0].newValue).toBe("ID");
    });
  });

  describe("Add column at specific position", () => {
    it("should add column at specific position using provided changes", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "NYC"],
          ["Bob", 30, "LA"],
        ],
      });

      // Add column between Age and City (position 2)
      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add Email column at position 2",
        changes: [
          {
            row: 0,
            col: 2,
            oldValue: null,
            newValue: "Email",
            type: "COLUMN_ADD",
            columnName: "Email",
          },
        ],
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].col).toBe(2);
      expect(changes[0].newValue).toBe("Email");
    });
  });

  describe("Add column with auto-fill pattern", () => {
    it("should add column with status pattern auto-fill", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
          ["Charlie"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Status",
          pattern: {
            type: "status",
            values: ["Active", "Inactive"],
          },
          autoFill: true,
        },
        description: "Add Status column with pattern",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should have 1 header change + 3 data changes
      expect(changes).toHaveLength(4);
      expect(changes[0].type).toBe("COLUMN_ADD");
      expect(changes[0].newValue).toBe("Status");
      
      // Check data cells
      expect(changes[1].type).toBe("CELL_UPDATE");
      expect(changes[1].row).toBe(0);
      expect(changes[1].col).toBe(1);
      expect(changes[1].newValue).toBe("Active");
      
      expect(changes[2].newValue).toBe("Inactive");
      expect(changes[3].newValue).toBe("Active");

      const result = applyChanges(data, changes);
      expect(result.data.headers).toEqual(["Name", "Status"]);
      expect(result.data.rows[0]).toEqual(["Alice", "Active"]);
      expect(result.data.rows[1]).toEqual(["Bob", "Inactive"]);
      expect(result.data.rows[2]).toEqual(["Charlie", "Active"]);
    });

    it("should add column with phone pattern auto-fill", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Phone",
          pattern: {
            type: "phone",
          },
          autoFill: true,
        },
        description: "Add Phone column with pattern",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Phone"]);
      expect(result.data.rows[0][1]).toMatch(/^081234567800$/);
      expect(result.data.rows[1][1]).toMatch(/^081234567801$/);
    });

    it("should add column with email pattern auto-fill", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Email",
          pattern: {
            type: "email",
          },
          autoFill: true,
        },
        description: "Add Email column with pattern",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Email"]);
      expect(result.data.rows[0][1]).toBe("user1@example.com");
      expect(result.data.rows[1][1]).toBe("user2@example.com");
    });

    it("should add column with address pattern auto-fill", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Address",
          pattern: {
            type: "addresses",
          },
          autoFill: true,
        },
        description: "Add Address column with pattern",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Address"]);
      expect(result.data.rows[0][1]).toContain("Jl.");
      expect(result.data.rows[0][1]).toContain("No.");
      expect(result.data.rows[1][1]).toContain("Jl.");
    });

    it("should add column with numbers pattern auto-fill", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Score",
          pattern: {
            type: "numbers",
            min: 0,
            max: 100,
          },
          autoFill: true,
        },
        description: "Add Score column with pattern",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Score"]);
      expect(typeof result.data.rows[0][1]).toBe("number");
      expect(result.data.rows[0][1]).toBeGreaterThanOrEqual(0);
      expect(result.data.rows[0][1]).toBeLessThanOrEqual(100);
    });

    it("should add column with text pattern auto-fill", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
          ["Charlie"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Department",
          pattern: {
            type: "text",
            values: ["Sales", "Marketing", "Engineering"],
          },
          autoFill: true,
        },
        description: "Add Department column with pattern",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Department"]);
      expect(result.data.rows[0][1]).toBe("Sales");
      expect(result.data.rows[1][1]).toBe("Marketing");
      expect(result.data.rows[2][1]).toBe("Engineering");
    });
  });

  describe("Headers updated correctly", () => {
    it("should update headers array with new column name", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [
          [1, 2],
          [3, 4],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "C",
        },
        description: "Add column C",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toHaveLength(3);
      expect(result.data.headers[2]).toBe("C");
    });

    it("should maintain existing headers when adding new column", () => {
      const data = createMockExcelData({
        headers: ["First", "Second", "Third"],
        rows: [[1, 2, 3]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Fourth",
        },
        description: "Add Fourth column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["First", "Second", "Third", "Fourth"]);
    });

    it("should handle adding multiple columns to headers", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add Age and City columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toHaveLength(3);
      expect(result.data.headers).toContain("Age");
      expect(result.data.headers).toContain("City");
    });
  });

  describe("Rows extended with null values", () => {
    it("should extend all rows with null for new column", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
          ["Charlie", 35],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "City",
        },
        description: "Add City column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // All rows should have 3 columns now
      expect(result.data.rows[0]).toHaveLength(3);
      expect(result.data.rows[1]).toHaveLength(3);
      expect(result.data.rows[2]).toHaveLength(3);
      
      // New column should be null
      expect(result.data.rows[0][2]).toBe(null);
      expect(result.data.rows[1][2]).toBe(null);
      expect(result.data.rows[2][2]).toBe(null);
    });

    it("should extend empty dataset with null values", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Age",
        },
        description: "Add Age column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Age"]);
      expect(result.data.rows).toHaveLength(0);
    });

    it("should extend rows with null when adding multiple columns", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add Age and City columns",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0]).toHaveLength(3);
      expect(result.data.rows[1]).toHaveLength(3);
      expect(result.data.rows[0][1]).toBe(null);
      expect(result.data.rows[0][2]).toBe(null);
      expect(result.data.rows[1][1]).toBe(null);
      expect(result.data.rows[1][2]).toBe(null);
    });

    it("should preserve existing data when extending rows", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "City",
        },
        description: "Add City column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Existing data should be preserved
      expect(result.data.rows[0][0]).toBe("Alice");
      expect(result.data.rows[0][1]).toBe(25);
      expect(result.data.rows[1][0]).toBe("Bob");
      expect(result.data.rows[1][1]).toBe(30);
      
      // New column should be null
      expect(result.data.rows[0][2]).toBe(null);
      expect(result.data.rows[1][2]).toBe(null);
    });
  });

  describe("Edge cases", () => {
    it("should handle adding column to empty spreadsheet", () => {
      const data = createMockExcelData({
        headers: [],
        rows: [],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "First Column",
        },
        description: "Add first column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["First Column"]);
      expect(result.data.rows).toHaveLength(0);
    });

    it("should handle column name with special characters", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Email (Work)",
        },
        description: "Add Email (Work) column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers).toEqual(["Name", "Email (Work)"]);
    });

    it("should handle adding column without auto-fill when pattern provided", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Status",
          pattern: {
            type: "status",
            values: ["Active", "Inactive"],
          },
          autoFill: false, // Explicitly disabled
        },
        description: "Add Status column without auto-fill",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should only have header change, no data changes
      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe("COLUMN_ADD");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0]).toEqual(["Alice", null]);
      expect(result.data.rows[1]).toEqual(["Bob", null]);
    });

    it("should handle missing column name gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Please add something", // No clear column name pattern
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should return empty changes if no column name found
      expect(changes).toHaveLength(0);
    });

    it("should handle using provided changes array directly", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {},
        description: "Add Age column",
        changes: [
          {
            row: 0,
            col: 1,
            oldValue: null,
            newValue: "Age",
            type: "COLUMN_ADD",
            columnName: "Age",
          },
        ],
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      expect(changes[0].newValue).toBe("Age");
      expect(changes[0].col).toBe(1);
    });
  });

  describe("Integration with other operations", () => {
    it("should work correctly after adding and then editing column", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["Alice"],
          ["Bob"],
        ],
      });

      // First add column
      const addAction: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "Age",
        },
        description: "Add Age column",
      };

      const addChanges = generateChangesFromAction(data, addAction);
      const afterAdd = applyChanges(data, addChanges);
      
      expect(afterAdd.data.headers).toEqual(["Name", "Age"]);
      expect(afterAdd.data.rows[0]).toEqual(["Alice", null]);

      // Then edit the new column
      const editAction: AIAction = {
        type: "EDIT_CELL",
        params: {
          target: { type: "cell", ref: "B1" },
          value: 25,
        },
        description: "Set age for Alice",
      };

      const editChanges = generateChangesFromAction(afterAdd.data, editAction);
      const final = applyChanges(afterAdd.data, editChanges);
      
      expect(final.data.rows[0]).toEqual(["Alice", 25]);
    });

    it("should maintain column count consistency across all rows", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      });

      const action: AIAction = {
        type: "ADD_COLUMN",
        params: {
          newColumnName: "C",
        },
        description: "Add column C",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // All rows should have same length as headers
      result.data.rows.forEach(row => {
        expect(row).toHaveLength(result.data.headers.length);
      });
    });
  });
});
