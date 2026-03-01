// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for DATA_TRANSFORM AI Action
 * 
 * DATA_TRANSFORM transforms text in a range with:
 * - uppercase transformation
 * - lowercase transformation
 * - titlecase transformation
 * - Range notation support (e.g., "A1:C10")
 * - Skips non-string values (numbers, booleans, null)
 * - Preserves original values for undo
 * 
 * Validates: AI Action DATA_TRANSFORM
 */
describe("DATA_TRANSFORM Action", () => {
  describe("Transform range to uppercase", () => {
    it("should transform all strings in column to uppercase", () => {
      const data = createMockExcelData({
        headers: ["Name", "Age", "City"],
        rows: [
          ["alice", 25, "new york"],
          ["bob", 30, "los angeles"],
          ["charlie", 35, "chicago"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform column A to uppercase",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      expect(changes[0].row).toBe(0);
      expect(changes[0].col).toBe(0);
      expect(changes[0].oldValue).toBe("alice");
      expect(changes[0].newValue).toBe("ALICE");

      expect(changes[1].oldValue).toBe("bob");
      expect(changes[1].newValue).toBe("BOB");

      expect(changes[2].oldValue).toBe("charlie");
      expect(changes[2].newValue).toBe("CHARLIE");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("ALICE");
      expect(result.data.rows[1][0]).toBe("BOB");
      expect(result.data.rows[2][0]).toBe("CHARLIE");
    });

    it("should handle mixed case strings", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["Hello World"],
          ["MiXeD CaSe"],
          ["ALREADY UPPER"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform to uppercase",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("HELLO WORLD");
      expect(result.data.rows[1][0]).toBe("MIXED CASE");
      expect(result.data.rows[2][0]).toBe("ALREADY UPPER");
    });

    it("should handle strings with special characters", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["hello@world.com"],
          ["test-123"],
          ["price: $99.99"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform with special chars",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("HELLO@WORLD.COM");
      expect(result.data.rows[1][0]).toBe("TEST-123");
      expect(result.data.rows[2][0]).toBe("PRICE: $99.99");
    });
  });

  describe("Transform range to lowercase", () => {
    it("should transform all strings in column to lowercase", () => {
      const data = createMockExcelData({
        headers: ["Name", "Status"],
        rows: [
          ["ALICE", "ACTIVE"],
          ["BOB", "INACTIVE"],
          ["CHARLIE", "PENDING"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "lowercase",
        },
        description: "Transform column A to lowercase",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      expect(changes[0].oldValue).toBe("ALICE");
      expect(changes[0].newValue).toBe("alice");

      expect(changes[1].oldValue).toBe("BOB");
      expect(changes[1].newValue).toBe("bob");

      expect(changes[2].oldValue).toBe("CHARLIE");
      expect(changes[2].newValue).toBe("charlie");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("alice");
      expect(result.data.rows[1][0]).toBe("bob");
      expect(result.data.rows[2][0]).toBe("charlie");
    });

    it("should handle mixed case strings", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["Hello World"],
          ["MiXeD CaSe"],
          ["already lower"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "lowercase",
        },
        description: "Transform to lowercase",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("hello world");
      expect(result.data.rows[1][0]).toBe("mixed case");
      expect(result.data.rows[2][0]).toBe("already lower");
    });
  });

  describe("Transform range to titlecase", () => {
    it("should transform all strings in column to titlecase", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["alice smith"],
          ["bob jones"],
          ["charlie brown"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "titlecase",
        },
        description: "Transform column A to titlecase",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(3);
      
      expect(changes[0].oldValue).toBe("alice smith");
      expect(changes[0].newValue).toBe("Alice Smith");

      expect(changes[1].oldValue).toBe("bob jones");
      expect(changes[1].newValue).toBe("Bob Jones");

      expect(changes[2].oldValue).toBe("charlie brown");
      expect(changes[2].newValue).toBe("Charlie Brown");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("Alice Smith");
      expect(result.data.rows[1][0]).toBe("Bob Jones");
      expect(result.data.rows[2][0]).toBe("Charlie Brown");
    });

    it("should handle uppercase strings", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["HELLO WORLD"],
          ["NEW YORK CITY"],
          ["UNITED STATES"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "titlecase",
        },
        description: "Transform to titlecase",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Hello World");
      expect(result.data.rows[1][0]).toBe("New York City");
      expect(result.data.rows[2][0]).toBe("United States");
    });

    it("should handle single word strings", () => {
      const data = createMockExcelData({
        headers: ["Word"],
        rows: [
          ["hello"],
          ["WORLD"],
          ["TeSt"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "titlecase",
        },
        description: "Transform single words",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Hello");
      expect(result.data.rows[1][0]).toBe("World");
      expect(result.data.rows[2][0]).toBe("Test");
    });

    it("should handle strings with punctuation", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["hello, world!"],
          ["it's a test"],
          ["one-two-three"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "titlecase",
        },
        description: "Transform with punctuation",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);
      
      expect(result.data.rows[0][0]).toBe("Hello, World!");
      expect(result.data.rows[1][0]).toBe("It's A Test");
      // Note: titlecase implementation capitalizes words separated by spaces, not hyphens
      expect(result.data.rows[2][0]).toBe("One-two-three");
    });
  });

  describe("Test with mixed data types (skip non-strings)", () => {
    it("should skip numbers and only transform strings", () => {
      const data = createMockExcelData({
        headers: ["Mixed"],
        rows: [
          ["hello"],
          [123],
          ["world"],
          [456],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform mixed types",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should only have 2 changes (for the 2 strings)
      expect(changes).toHaveLength(2);
      expect(changes[0].row).toBe(0);
      expect(changes[0].newValue).toBe("HELLO");
      expect(changes[1].row).toBe(2);
      expect(changes[1].newValue).toBe("WORLD");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("HELLO");
      expect(result.data.rows[1][0]).toBe(123); // unchanged
      expect(result.data.rows[2][0]).toBe("WORLD");
      expect(result.data.rows[3][0]).toBe(456); // unchanged
    });

    it("should skip null values", () => {
      const data = createMockExcelData({
        headers: ["Data"],
        rows: [
          ["hello"],
          [null],
          ["world"],
          [null],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform with nulls",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes).toHaveLength(2);
      expect(changes[0].newValue).toBe("HELLO");
      expect(changes[1].newValue).toBe("WORLD");

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("HELLO");
      expect(result.data.rows[1][0]).toBeNull(); // unchanged
      expect(result.data.rows[2][0]).toBe("WORLD");
      expect(result.data.rows[3][0]).toBeNull(); // unchanged
    });

    it("should handle column with all non-string values", () => {
      const data = createMockExcelData({
        headers: ["Numbers"],
        rows: [
          [100],
          [200],
          [300],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform all numbers",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should have no changes since all values are numbers
      expect(changes).toHaveLength(0);

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe(100);
      expect(result.data.rows[1][0]).toBe(200);
      expect(result.data.rows[2][0]).toBe(300);
    });

    it("should handle mixed strings, numbers, and nulls", () => {
      const data = createMockExcelData({
        headers: ["Mixed"],
        rows: [
          ["TEXT"],
          [42],
          [null],
          ["MORE TEXT"],
          [3.14],
          ["FINAL"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "lowercase",
        },
        description: "Transform mixed data",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Should only transform the 3 string values
      expect(changes).toHaveLength(3);

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("text");
      expect(result.data.rows[1][0]).toBe(42);
      expect(result.data.rows[2][0]).toBeNull();
      expect(result.data.rows[3][0]).toBe("more text");
      expect(result.data.rows[4][0]).toBe(3.14);
      expect(result.data.rows[5][0]).toBe("final");
    });
  });

  describe("Test original values preserved in undo", () => {
    it("should preserve original values for undo with uppercase", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["alice"],
          ["bob"],
          ["charlie"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform to uppercase",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Verify old values are preserved
      expect(changes[0].oldValue).toBe("alice");
      expect(changes[1].oldValue).toBe("bob");
      expect(changes[2].oldValue).toBe("charlie");

      // Apply changes
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("ALICE");

      // Simulate undo by reverting to old values
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      
      expect(undoResult.data.rows[0][0]).toBe("alice");
      expect(undoResult.data.rows[1][0]).toBe("bob");
      expect(undoResult.data.rows[2][0]).toBe("charlie");
    });

    it("should preserve original values for undo with lowercase", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["HELLO"],
          ["WORLD"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "lowercase",
        },
        description: "Transform to lowercase",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes[0].oldValue).toBe("HELLO");
      expect(changes[1].oldValue).toBe("WORLD");

      const result = applyChanges(data, changes);
      
      // Undo
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      
      expect(undoResult.data.rows[0][0]).toBe("HELLO");
      expect(undoResult.data.rows[1][0]).toBe("WORLD");
    });

    it("should preserve original values for undo with titlecase", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [
          ["john doe"],
          ["jane smith"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "titlecase",
        },
        description: "Transform to titlecase",
      };

      const changes = generateChangesFromAction(data, action);
      
      expect(changes[0].oldValue).toBe("john doe");
      expect(changes[1].oldValue).toBe("jane smith");

      const result = applyChanges(data, changes);
      
      // Undo
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      
      expect(undoResult.data.rows[0][0]).toBe("john doe");
      expect(undoResult.data.rows[1][0]).toBe("jane smith");
    });

    it("should handle undo with mixed data types", () => {
      const data = createMockExcelData({
        headers: ["Mixed"],
        rows: [
          ["text"],
          [123],
          ["more"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform mixed",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Only 2 changes for strings
      expect(changes).toHaveLength(2);
      expect(changes[0].oldValue).toBe("text");
      expect(changes[1].oldValue).toBe("more");

      const result = applyChanges(data, changes);
      
      // Undo
      const undoChanges = changes.map((c) => ({
        ...c,
        newValue: c.oldValue,
      }));
      const undoResult = applyChanges(result.data, undoChanges);
      
      expect(undoResult.data.rows[0][0]).toBe("text");
      expect(undoResult.data.rows[1][0]).toBe(123);
      expect(undoResult.data.rows[2][0]).toBe("more");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty strings", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          [""],
          ["hello"],
          [""],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform with empty strings",
      };

      const changes = generateChangesFromAction(data, action);
      
      // Empty strings are still strings, but transformation doesn't change them
      // So they might not generate changes
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("");
      expect(result.data.rows[1][0]).toBe("HELLO");
      expect(result.data.rows[2][0]).toBe("");
    });

    it("should handle column with single row", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["alice"]],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform single row",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(1);
      
      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("ALICE");
    });

    it("should handle strings that don't change", () => {
      const data = createMockExcelData({
        headers: ["Text"],
        rows: [
          ["ALREADY UPPER"],
          ["STILL UPPER"],
        ],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform already uppercase",
      };

      const changes = generateChangesFromAction(data, action);
      
      // No changes should be generated since values don't change
      expect(changes).toHaveLength(0);

      const result = applyChanges(data, changes);
      expect(result.data.rows[0][0]).toBe("ALREADY UPPER");
      expect(result.data.rows[1][0]).toBe("STILL UPPER");
    });

    it("should handle different column references", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          ["a1", "b1", "c1"],
          ["a2", "b2", "c2"],
        ],
      });

      // Test column B
      const actionB: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "B" },
          transformType: "uppercase",
        },
        description: "Transform column B",
      };

      const changesB = generateChangesFromAction(data, actionB);
      const resultB = applyChanges(data, changesB);
      
      expect(resultB.data.rows[0][0]).toBe("a1"); // unchanged
      expect(resultB.data.rows[0][1]).toBe("B1"); // changed
      expect(resultB.data.rows[0][2]).toBe("c1"); // unchanged

      // Test column C
      const actionC: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "C" },
          transformType: "uppercase",
        },
        description: "Transform column C",
      };

      const changesC = generateChangesFromAction(data, actionC);
      expect(changesC[0].col).toBe(2);
      expect(changesC[0].newValue).toBe("C1");
    });
  });

  describe("Error handling", () => {
    it("should handle missing target gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["alice"]],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          transformType: "uppercase",
        },
        description: "Transform without target",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle missing transformType gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [["alice"]],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
        },
        description: "Transform without type",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });

    it("should handle empty data gracefully", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [],
      });

      const action: AIAction = {
        type: "DATA_TRANSFORM",
        params: {
          target: { type: "column", ref: "A" },
          transformType: "uppercase",
        },
        description: "Transform empty data",
      };

      const changes = generateChangesFromAction(data, action);
      expect(changes).toHaveLength(0);
    });
  });
});
