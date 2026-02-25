import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for EDIT_COLUMN AI Action
 * 
 * EDIT_COLUMN fills a column with an array of values. It should:
 * - Accept column letter (e.g., "G") or range notation (e.g., "G2:G13")
 * - Fill the column with provided values
 * - Not overwrite the header row
 * - Handle partial data (when values.length < rows.length)
 * - Preserve existing data in other columns
 * 
 * Validates: AI Action EDIT_COLUMN
 */
describe("EDIT_COLUMN Action", () => {
  describe("Fill column with values array", () => {
    it("should fill column with complete values array", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
          ["Charlie", 35, "Chicago"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: ["Boston", "Seattle", "Denver"],
        },
        description: "Fill City column with new values",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      // Verify all rows are updated
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(2);
      expect(changes[0].newValue).toBe("Boston");
      
      expect(changes[1].row).toBe(1);
      expect(changes[1].col).toBe(2);
      expect(changes[1].newValue).toBe("Seattle");
      
      expect(changes[2].row).toBe(2);
      expect(changes[2].col).toBe(2);
      expect(changes[2].newValue).toBe("Denver");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][2]).toBe("Boston");
      expect(result.data.rows[1][2]).toBe("Seattle");
      expect(result.data.rows[2][2]).toBe("Denver");
    });

    it("should fill column with mixed data types", () => {
      const data = createMockExcelData({
        headers: ["ID", "Value", "Status"],
        rows: [
          [1, 100, "Active"],
          [2, 200, "Pending"],
          [3, 300, "Inactive"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "B" },
          values: [150, 250, 350],
        },
        description: "Update Value column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][1]).toBe(150);
      expect(result.data.rows[1][1]).toBe(250);
      expect(result.data.rows[2][1]).toBe(350);
      expect(typeof result.data.rows[0][1]).toBe("number");
    });

    it("should preserve old values in changes", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"], ["Bob"], ["Charlie"]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: ["David", "Eve", "Frank"],
        },
        description: "Replace names",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes[0].oldValue).toBe("Alice");
      expect(changes[1].oldValue).toBe("Bob");
      expect(changes[2].oldValue).toBe("Charlie");
    });
  });

  describe("Column letter notation", () => {
    it("should handle single letter column (A-Z)", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E"],
        rows: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
        ],
      });

      const testCases = [
        { col: "A", index: 0, values: [100, 600] },
        { col: "C", index: 2, values: [300, 800] },
        { col: "E", index: 4, values: [500, 1000] },
      ];

      testCases.forEach(({ col, index, values }) => {
        const action: AIAction = {
          type: "EDIT_COLUMN",
          params: {
            target: { ref: col },
            values,
          },
          description: `Fill column ${col}`,
        };

        const changes = generateChangesFromAction(data, action);
        expect(changes).toHaveLength(2);
        expect(changes[0].col).toBe(index);
        expect(changes[0].newValue).toBe(values[0]);
        expect(changes[1].col).toBe(index);
        expect(changes[1].newValue).toBe(values[1]);
      });
    });

    it("should handle column G specifically", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E", "F", "G"],
        rows: [
          [1, 2, 3, 4, 5, 6, 7],
          [8, 9, 10, 11, 12, 13, 14],
          [15, 16, 17, 18, 19, 20, 21],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "G" },
          values: [700, 1400, 2100],
        },
        description: "Fill column G",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      changes.forEach((change, i) => {
        expect(change.col).toBe(6); // G is column index 6
        expect(change.row).toBe(i);
        expect(change.newValue).toBe([700, 1400, 2100][i]);
      });

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][6]).toBe(700);
      expect(result.data.rows[1][6]).toBe(1400);
      expect(result.data.rows[2][6]).toBe(2100);
    });

    it("should handle first column (A)", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [1, "Alice"],
          [2, "Bob"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [10, 20],
        },
        description: "Update ID column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(10);
      expect(result.data.rows[1][0]).toBe(20);
    });

    it("should handle last column", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: [30, 60],
        },
        description: "Update last column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][2]).toBe(30);
      expect(result.data.rows[1][2]).toBe(60);
    });
  });

  describe("Range notation", () => {
    it("should handle range notation (G2:G13)", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C", "D", "E", "F", "G"],
        rows: Array.from({ length: 12 }, (_, i) => [
          i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7
        ]),
      });

      const values = Array.from({ length: 12 }, (_, i) => (i + 1) * 100);

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "G2:G13" },
          values,
        },
        description: "Fill G2:G13 with values",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(12);
      
      changes.forEach((change, i) => {
        expect(change.col).toBe(6); // G is column 6
        expect(change.row).toBe(i);
        expect(change.newValue).toBe((i + 1) * 100);
      });

      const result = applyChanges(data, changes);
      result.data.rows.forEach((row, i) => {
        expect(row[6]).toBe((i + 1) * 100);
      });
    });

    it("should extract column letter from range", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "B5:B10" },
          values: [20, 50, 80],
        },
        description: "Fill B column with range notation",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      changes.forEach((change) => {
        expect(change.col).toBe(1); // B is column 1
      });

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][1]).toBe(20);
      expect(result.data.rows[1][1]).toBe(50);
      expect(result.data.rows[2][1]).toBe(80);
    });

    it("should handle range with different row numbers", () => {
      const data = createMockExcelData({
        headers: ["Name", "Score"],
        rows: [
          ["Alice", 85],
          ["Bob", 90],
          ["Charlie", 75],
          ["David", 88],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "B10:B20" },
          values: [95, 92, 78, 91],
        },
        description: "Update scores with range",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][1]).toBe(95);
      expect(result.data.rows[1][1]).toBe(92);
      expect(result.data.rows[2][1]).toBe(78);
      expect(result.data.rows[3][1]).toBe(91);
    });
  });

  describe("Header not overwritten", () => {
    it("should not overwrite header when values don't include header", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: ["Boston", "Seattle"],
        },
        description: "Update cities",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Header should remain unchanged
      expect(result.data.headers[2]).toBe("City");
      
      // Only data rows should be updated
      expect(result.data.rows[0][2]).toBe("Boston");
      expect(result.data.rows[1][2]).toBe("Seattle");
    });

    it("should skip header value if included in values array", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
        ],
      });

      // AI sometimes includes header in values array
      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: ["City", "Boston", "Seattle"], // First value matches header
        },
        description: "Update cities with header",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2); // Should skip the header value
      
      const result = applyChanges(data, changes);
      
      // Header unchanged
      expect(result.data.headers[2]).toBe("City");
      
      // Data rows updated correctly
      expect(result.data.rows[0][2]).toBe("Boston");
      expect(result.data.rows[1][2]).toBe("Seattle");
    });

    it("should preserve header with different case", () => {
      const data = createMockExcelData({
        headers: ["NAME", "AGE", "CITY"],
        rows: [
          ["Alice", 25, "New York"],
          ["Bob", 30, "Los Angeles"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: ["Charlie", "David"],
        },
        description: "Update names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.headers[0]).toBe("NAME");
      expect(result.data.rows[0][0]).toBe("Charlie");
      expect(result.data.rows[1][0]).toBe("David");
    });
  });

  describe("Partial data (values.length < rows.length)", () => {
    it("should fill only available rows when values are fewer", () => {
      const data = createMockExcelData({
        headers: ["Name", "Score"],
        rows: [
          ["Alice", 85],
          ["Bob", 90],
          ["Charlie", 75],
          ["David", 88],
          ["Eve", 92],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "B" },
          values: [95, 92, 78], // Only 3 values for 5 rows
        },
        description: "Update first 3 scores",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3); // Only 3 changes
      
      const result = applyChanges(data, changes);
      
      // First 3 rows updated
      expect(result.data.rows[0][1]).toBe(95);
      expect(result.data.rows[1][1]).toBe(92);
      expect(result.data.rows[2][1]).toBe(78);
      
      // Last 2 rows unchanged
      expect(result.data.rows[3][1]).toBe(88);
      expect(result.data.rows[4][1]).toBe(92);
    });

    it("should handle single value for multiple rows", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [
          ["Pending"],
          ["Active"],
          ["Pending"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: ["Completed"], // Only 1 value for 3 rows
        },
        description: "Update first status",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Completed");
      expect(result.data.rows[1][0]).toBe("Active");
      expect(result.data.rows[2][0]).toBe("Pending");
    });

    it("should handle empty values array", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"], ["Bob"]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [],
        },
        description: "Empty values",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should not exceed data.rows.length", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [10, 20], // 2 values for 3 rows
        },
        description: "Partial update",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(2);
      
      // Should not create changes beyond existing rows
      changes.forEach((change) => {
        expect(change.row).toBeLessThan(data.rows.length);
      });
    });
  });

  describe("Preserve other columns", () => {
    it("should not modify other columns when filling one column", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City", "Country"],
        rows: [
          ["Alice", 25, "New York", "USA"],
          ["Bob", 30, "Los Angeles", "USA"],
          ["Charlie", 35, "Chicago", "USA"],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: ["Boston", "Seattle", "Denver"],
        },
        description: "Update cities only",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      // Column C updated
      expect(result.data.rows[0][2]).toBe("Boston");
      expect(result.data.rows[1][2]).toBe("Seattle");
      expect(result.data.rows[2][2]).toBe("Denver");
      
      // Other columns unchanged
      expect(result.data.rows[0][0]).toBe("Alice");
      expect(result.data.rows[0][1]).toBe(25);
      expect(result.data.rows[0][3]).toBe("USA");
      
      expect(result.data.rows[1][0]).toBe("Bob");
      expect(result.data.rows[1][1]).toBe(30);
      expect(result.data.rows[1][3]).toBe("USA");
      
      expect(result.data.rows[2][0]).toBe("Charlie");
      expect(result.data.rows[2][1]).toBe(35);
      expect(result.data.rows[2][3]).toBe("USA");
    });

    it("should preserve null values in other columns", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, null, 3],
          [4, null, 6],
        ],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [10, 40],
        },
        description: "Update column A",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(10);
      expect(result.data.rows[0][1]).toBeNull();
      expect(result.data.rows[0][2]).toBe(3);
      
      expect(result.data.rows[1][0]).toBe(40);
      expect(result.data.rows[1][1]).toBeNull();
      expect(result.data.rows[1][2]).toBe(6);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing target gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          values: ["Bob"],
        },
        description: "Missing target",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle missing values array gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["Alice"]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
        },
        description: "Missing values",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle invalid column letter gracefully", () => {
      const data = createMockExcelData({
        headers: ["A", "B"],
        rows: [[1, 2]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "Z" }, // Column doesn't exist
          values: [100],
        },
        description: "Invalid column",
      };

      const changes = generateChangesFromAction(data, action);
      // Should return empty changes for invalid column
      expect(changes).toHaveLength(0);
    });

    it("should handle null values in values array", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [null, 20, null],
        },
        description: "Set some values to null",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBeNull();
      expect(result.data.rows[1][0]).toBe(20);
      expect(result.data.rows[2][0]).toBeNull();
    });

    it("should handle special characters in values", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [["Normal"], ["Text"], ["Here"]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: ["Special: @#$%", "Unicode: 你好", "Emoji: 🎉"],
        },
        description: "Special characters",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Special: @#$%");
      expect(result.data.rows[1][0]).toBe("Unicode: 你好");
      expect(result.data.rows[2][0]).toBe("Emoji: 🎉");
    });

    it("should handle very long strings", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [["Short"], ["Text"]],
      });

      const longString = "A".repeat(1000);
      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [longString, "Normal"],
        },
        description: "Long string",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(longString);
      expect((result.data.rows[0][0] as string).length).toBe(1000);
    });

    it("should handle boolean values", () => {
      const data = createMockExcelData({
        headers: ["Active"],
        rows: [[false], [false], [false]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [true, false, true],
        },
        description: "Update boolean values",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(true);
      expect(result.data.rows[1][0]).toBe(false);
      expect(result.data.rows[2][0]).toBe(true);
    });

    it("should handle zero and negative numbers", () => {
      const data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3]],
      });

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [0, -5, -10],
        },
        description: "Zero and negative numbers",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe(0);
      expect(result.data.rows[1][0]).toBe(-5);
      expect(result.data.rows[2][0]).toBe(-10);
    });
  });

  describe("Integration scenarios", () => {
    it("should work after adding a column", () => {
      let data = createMockExcelData({
        headers: ["Name", "Age"],
        rows: [
          ["Alice", 25],
          ["Bob", 30],
        ],
      });

      // Simulate adding a column (manually for test)
      data.headers.push("City");
      data.rows.forEach(row => row.push(null));

      const action: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: ["New York", "Los Angeles"],
        },
        description: "Fill new column",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][2]).toBe("New York");
      expect(result.data.rows[1][2]).toBe("Los Angeles");
    });

    it("should work with multiple sequential column fills", () => {
      let data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      });

      // Fill column A
      const action1: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [10, 40],
        },
        description: "Fill A",
      };
      
      const changes1 = generateChangesFromAction(data, action1);
      data = applyChanges(data, changes1).data;
      
      // Fill column C
      const action2: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "C" },
          values: [30, 60],
        },
        description: "Fill C",
      };
      
      const changes2 = generateChangesFromAction(data, action2);
      data = applyChanges(data, changes2).data;
      
      expect(data.rows[0][0]).toBe(10);
      expect(data.rows[0][1]).toBe(2); // Unchanged
      expect(data.rows[0][2]).toBe(30);
      
      expect(data.rows[1][0]).toBe(40);
      expect(data.rows[1][1]).toBe(5); // Unchanged
      expect(data.rows[1][2]).toBe(60);
    });

    it("should handle filling same column twice", () => {
      let data = createMockExcelData({
        headers: ["Value"],
        rows: [[1], [2], [3]],
      });

      // First fill
      const action1: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [10, 20, 30],
        },
        description: "First fill",
      };
      
      const changes1 = generateChangesFromAction(data, action1);
      data = applyChanges(data, changes1).data;
      
      expect(data.rows[0][0]).toBe(10);
      
      // Second fill (overwrite)
      const action2: AIAction = {
        type: "EDIT_COLUMN",
        params: {
          target: { ref: "A" },
          values: [100, 200, 300],
        },
        description: "Second fill",
      };
      
      const changes2 = generateChangesFromAction(data, action2);
      data = applyChanges(data, changes2).data;
      
      expect(data.rows[0][0]).toBe(100);
      expect(data.rows[1][0]).toBe(200);
      expect(data.rows[2][0]).toBe(300);
    });
  });
});
