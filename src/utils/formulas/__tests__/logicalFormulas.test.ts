import { describe, it, expect } from "vitest";
import {
  evaluateIf,
  evaluateAnd,
  evaluateOr,
  evaluateNot,
  evaluateIsBlank,
  evaluateIsNumber,
  evaluateIsText,
} from "../logicalFormulas";
import { createMockExcelData } from "@/test/utils/testHelpers";

describe("logicalFormulas", () => {
  describe("evaluateIf", () => {
    it("should return true value when condition is true", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      const result = evaluateIf('A2>5,"Yes","No"', data);
      expect(result).toBe("Yes");
    });

    it("should return false value when condition is false", () => {
      const data = createMockExcelData({
        rows: [[3]],
      });

      const result = evaluateIf('A2>5,"Yes","No"', data);
      expect(result).toBe("No");
    });

    it("should handle equals comparison", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      const result = evaluateIf('A2=5,"Equal","Not Equal"', data);
      expect(result).toBe("Equal");
    });

    it("should handle not equals comparison", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      const result = evaluateIf('A2<>5,"Different","Same"', data);
      expect(result).toBe("Same");
    });

    it("should handle less than or equal", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      expect(evaluateIf('A2<=5,"Yes","No"', data)).toBe("Yes");
      expect(evaluateIf('A2<=4,"Yes","No"', data)).toBe("No");
    });

    it("should handle greater than or equal", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      expect(evaluateIf('A2>=5,"Yes","No"', data)).toBe("Yes");
      expect(evaluateIf('A2>=6,"Yes","No"', data)).toBe("No");
    });

    it("should return numeric values", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      const result = evaluateIf("A2>5,100,200", data);
      expect(result).toBe(100);
    });

    it("should return cell references", () => {
      const data = createMockExcelData({
        rows: [[10, 100, 200]],
      });

      const result = evaluateIf("A2>5,B2,C2", data);
      expect(result).toBe(100);
    });

    it("should default to empty string for false value", () => {
      const data = createMockExcelData({
        rows: [[3]],
      });

      const result = evaluateIf('A2>5,"Yes"', data);
      expect(result).toBe("");
    });

    it("should handle string comparisons", () => {
      const data = createMockExcelData({
        rows: [["Active"]],
      });

      const result = evaluateIf('A2="Active","Yes","No"', data);
      expect(result).toBe("Yes");
    });
  });

  describe("evaluateAnd", () => {
    it("should return true when all conditions are true", () => {
      const data = createMockExcelData({
        rows: [[10, 20, 30]],
      });

      const result = evaluateAnd("A2>5,B2>15,C2>25", data);
      expect(result).toBe(true);
    });

    it("should return false when any condition is false", () => {
      const data = createMockExcelData({
        rows: [[10, 20, 30]],
      });

      const result = evaluateAnd("A2>5,B2>25,C2>25", data);
      expect(result).toBe(false);
    });

    it("should return false when all conditions are false", () => {
      const data = createMockExcelData({
        rows: [[1, 2, 3]],
      });

      const result = evaluateAnd("A2>10,B2>20,C2>30", data);
      expect(result).toBe(false);
    });

    it("should handle single condition", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      expect(evaluateAnd("A2>5", data)).toBe(true);
      expect(evaluateAnd("A2>15", data)).toBe(false);
    });
  });

  describe("evaluateOr", () => {
    it("should return true when any condition is true", () => {
      const data = createMockExcelData({
        rows: [[10, 2, 3]],
      });

      const result = evaluateOr("A2>5,B2>5,C2>5", data);
      expect(result).toBe(true);
    });

    it("should return false when all conditions are false", () => {
      const data = createMockExcelData({
        rows: [[1, 2, 3]],
      });

      const result = evaluateOr("A2>10,B2>10,C2>10", data);
      expect(result).toBe(false);
    });

    it("should return true when all conditions are true", () => {
      const data = createMockExcelData({
        rows: [[10, 20, 30]],
      });

      const result = evaluateOr("A2>5,B2>15,C2>25", data);
      expect(result).toBe(true);
    });

    it("should handle single condition", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      expect(evaluateOr("A2>5", data)).toBe(true);
      expect(evaluateOr("A2>15", data)).toBe(false);
    });
  });

  describe("evaluateNot", () => {
    it("should return opposite of condition", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      expect(evaluateNot("A2>5", data)).toBe(false);
      expect(evaluateNot("A2>15", data)).toBe(true);
    });

    it("should handle equals condition", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      expect(evaluateNot("A2=5", data)).toBe(false);
      expect(evaluateNot("A2=10", data)).toBe(true);
    });
  });

  describe("evaluateIsBlank", () => {
    it("should return true for null cells", () => {
      const data = createMockExcelData({
        rows: [[null]],
      });

      const result = evaluateIsBlank("A2", data);
      expect(result).toBe(true);
    });

    it("should return true for zero", () => {
      const data = createMockExcelData({
        rows: [[0]],
      });

      const result = evaluateIsBlank("A2", data);
      expect(result).toBe(true);
    });

    it("should return false for non-empty cells", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      const result = evaluateIsBlank("A2", data);
      expect(result).toBe(false);
    });

    it("should return false for text cells", () => {
      const data = createMockExcelData({
        rows: [["text"]],
      });

      const result = evaluateIsBlank("A2", data);
      expect(result).toBe(false);
    });

    it("should return false for non-cell references", () => {
      const data = createMockExcelData();

      const result = evaluateIsBlank("5", data);
      expect(result).toBe(false);
    });
  });

  describe("evaluateIsNumber", () => {
    it("should return true for numeric cells", () => {
      const data = createMockExcelData({
        rows: [[42]],
      });

      const result = evaluateIsNumber("A2", data);
      expect(result).toBe(true);
    });

    it("should return false for null cells", () => {
      const data = createMockExcelData({
        rows: [[null]],
      });

      const result = evaluateIsNumber("A2", data);
      expect(result).toBe(false);
    });

    it("should return true for numeric literals", () => {
      const data = createMockExcelData();

      expect(evaluateIsNumber("42", data)).toBe(true);
      expect(evaluateIsNumber("3.14", data)).toBe(true);
    });

    it("should return false for text literals", () => {
      const data = createMockExcelData();

      const result = evaluateIsNumber("hello", data);
      expect(result).toBe(false);
    });
  });

  describe("evaluateIsText", () => {
    it("should return true for text cells", () => {
      const data = createMockExcelData({
        rows: [["hello"]],
      });

      const result = evaluateIsText("A2", data);
      expect(result).toBe(true);
    });

    it("should return false for numeric cells", () => {
      const data = createMockExcelData({
        rows: [[42]],
      });

      const result = evaluateIsText("A2", data);
      expect(result).toBe(false);
    });

    it("should return false for cells with numeric strings", () => {
      const data = createMockExcelData({
        rows: [["42"]],
      });

      const result = evaluateIsText("A2", data);
      expect(result).toBe(false);
    });

    it("should return false for non-cell references", () => {
      const data = createMockExcelData();

      const result = evaluateIsText("42", data);
      expect(result).toBe(false);
    });
  });
});
