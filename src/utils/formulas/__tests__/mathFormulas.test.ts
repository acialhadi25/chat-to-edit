import { describe, it, expect } from "vitest";
import {
  evaluateSum,
  evaluateAverage,
  evaluateCount,
  evaluateMin,
  evaluateMax,
  evaluateRound,
  evaluateRoundUp,
  evaluateRoundDown,
  evaluateAbs,
  evaluateSqrt,
  evaluatePower,
  evaluateMod,
  evaluateInt,
  evaluateFloor,
  evaluateCeiling,
} from "../mathFormulas";
import { createMockExcelData } from "@/test/utils/testHelpers";

describe("mathFormulas", () => {
  describe("evaluateSum", () => {
    it("should sum values in a range", () => {
      const data = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
      });

      const result = evaluateSum("A2:A4", data);
      expect(result).toBe(12); // 1 + 4 + 7
    });

    it("should sum comma-separated cells", () => {
      const data = createMockExcelData({
        rows: [[10, 20, 30]],
      });

      const result = evaluateSum("A2,B2,C2", data);
      expect(result).toBe(60);
    });

    it("should treat null values as 0", () => {
      const data = createMockExcelData({
        rows: [[1, null, 3]],
      });

      const result = evaluateSum("A2:C2", data);
      expect(result).toBe(4);
    });

    it("should handle empty range", () => {
      const data = createMockExcelData({
        rows: [[null, null, null]],
      });

      const result = evaluateSum("A2:C2", data);
      expect(result).toBe(0);
    });
  });

  describe("evaluateAverage", () => {
    it("should calculate average of range", () => {
      const data = createMockExcelData({
        rows: [[10, 20, 30]],
      });

      const result = evaluateAverage("A2:C2", data);
      expect(result).toBe(20);
    });

    it("should exclude null values from average", () => {
      const data = createMockExcelData({
        rows: [[10, null, 30]],
      });

      const result = evaluateAverage("A2:C2", data);
      expect(result).toBe(20); // (10 + 30) / 2
    });

    it("should return 0 for empty range", () => {
      const data = createMockExcelData({
        rows: [[null, null, null]],
      });

      const result = evaluateAverage("A2:C2", data);
      expect(result).toBe(0);
    });

    it("should handle comma-separated cells", () => {
      const data = createMockExcelData({
        rows: [[5, 10, 15, 20]],
      });

      const result = evaluateAverage("A2,C2,D2", data);
      expect(result).toBe(13.333333333333334); // (5 + 15 + 20) / 3
    });
  });

  describe("evaluateCount", () => {
    it("should count non-null values in range", () => {
      const data = createMockExcelData({
        rows: [[1, null, 3, null, 5]],
      });

      const result = evaluateCount("A2:E2", data);
      expect(result).toBe(3);
    });

    it("should count comma-separated cells", () => {
      const data = createMockExcelData({
        rows: [[1, 2, null, 4]],
      });

      const result = evaluateCount("A2,B2,C2,D2", data);
      expect(result).toBe(3);
    });

    it("should return 0 for all null values", () => {
      const data = createMockExcelData({
        rows: [[null, null, null]],
      });

      const result = evaluateCount("A2:C2", data);
      expect(result).toBe(0);
    });
  });

  describe("evaluateMin", () => {
    it("should find minimum value in range", () => {
      const data = createMockExcelData({
        rows: [[5, 2, 8, 1, 9]],
      });

      const result = evaluateMin("A2:E2", data);
      expect(result).toBe(1);
    });

    it("should exclude null values", () => {
      const data = createMockExcelData({
        rows: [[10, null, 5, null, 15]],
      });

      const result = evaluateMin("A2:E2", data);
      expect(result).toBe(5);
    });

    it("should return 0 for empty range", () => {
      const data = createMockExcelData({
        rows: [[null, null, null]],
      });

      const result = evaluateMin("A2:C2", data);
      expect(result).toBe(0);
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData({
        rows: [[5, -10, 3, -2]],
      });

      const result = evaluateMin("A2:D2", data);
      expect(result).toBe(-10);
    });
  });

  describe("evaluateMax", () => {
    it("should find maximum value in range", () => {
      const data = createMockExcelData({
        rows: [[5, 2, 8, 1, 9]],
      });

      const result = evaluateMax("A2:E2", data);
      expect(result).toBe(9);
    });

    it("should exclude null values", () => {
      const data = createMockExcelData({
        rows: [[10, null, 5, null, 15]],
      });

      const result = evaluateMax("A2:E2", data);
      expect(result).toBe(15);
    });

    it("should return 0 for empty range", () => {
      const data = createMockExcelData({
        rows: [[null, null, null]],
      });

      const result = evaluateMax("A2:C2", data);
      expect(result).toBe(0);
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData({
        rows: [[-5, -10, -3, -2]],
      });

      const result = evaluateMax("A2:D2", data);
      expect(result).toBe(-2);
    });
  });

  describe("evaluateRound", () => {
    it("should round to specified decimals", () => {
      const data = createMockExcelData({
        rows: [[3.14159]],
      });

      expect(evaluateRound("A2,2", data)).toBe(3.14);
      expect(evaluateRound("A2,0", data)).toBe(3);
      expect(evaluateRound("A2,4", data)).toBe(3.1416);
    });

    it("should round with default 0 decimals", () => {
      const data = createMockExcelData({
        rows: [[5.7]],
      });

      const result = evaluateRound("A2", data);
      expect(result).toBe(6);
    });

    it("should handle literal values", () => {
      const data = createMockExcelData();

      const result = evaluateRound("3.14159,2", data);
      expect(result).toBe(3.14);
    });
  });

  describe("evaluateRoundUp", () => {
    it("should round up to specified decimals", () => {
      const data = createMockExcelData({
        rows: [[3.14159]],
      });

      expect(evaluateRoundUp("A2,2", data)).toBe(3.15);
      expect(evaluateRoundUp("A2,0", data)).toBe(4);
    });

    it("should round up negative numbers", () => {
      const data = createMockExcelData({
        rows: [[-3.14]],
      });

      const result = evaluateRoundUp("A2,1", data);
      expect(result).toBe(-3.1);
    });
  });

  describe("evaluateRoundDown", () => {
    it("should round down to specified decimals", () => {
      const data = createMockExcelData({
        rows: [[3.14159]],
      });

      expect(evaluateRoundDown("A2,2", data)).toBe(3.14);
      expect(evaluateRoundDown("A2,0", data)).toBe(3);
    });

    it("should round down negative numbers", () => {
      const data = createMockExcelData({
        rows: [[-3.14]],
      });

      const result = evaluateRoundDown("A2,1", data);
      expect(result).toBe(-3.2);
    });
  });

  describe("evaluateAbs", () => {
    it("should return absolute value", () => {
      const data = createMockExcelData({
        rows: [[-5]],
      });

      const result = evaluateAbs("A2", data);
      expect(result).toBe(5);
    });

    it("should handle positive numbers", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      const result = evaluateAbs("A2", data);
      expect(result).toBe(5);
    });

    it("should handle literal values", () => {
      const data = createMockExcelData();

      expect(evaluateAbs("-10", data)).toBe(10);
      expect(evaluateAbs("10", data)).toBe(10);
    });
  });

  describe("evaluateSqrt", () => {
    it("should calculate square root", () => {
      const data = createMockExcelData({
        rows: [[16]],
      });

      const result = evaluateSqrt("A2", data);
      expect(result).toBe(4);
    });

    it("should return #NUM! for negative numbers", () => {
      const data = createMockExcelData({
        rows: [[-16]],
      });

      const result = evaluateSqrt("A2", data);
      expect(result).toBe("#NUM!");
    });

    it("should handle zero", () => {
      const data = createMockExcelData({
        rows: [[0]],
      });

      const result = evaluateSqrt("A2", data);
      expect(result).toBe(0);
    });
  });

  describe("evaluatePower", () => {
    it("should calculate power", () => {
      const data = createMockExcelData({
        rows: [[2, 3]],
      });

      const result = evaluatePower("A2,B2", data);
      expect(result).toBe(8); // 2^3
    });

    it("should handle literal values", () => {
      const data = createMockExcelData();

      expect(evaluatePower("5,2", data)).toBe(25);
      expect(evaluatePower("10,0", data)).toBe(1);
    });

    it("should handle negative exponents", () => {
      const data = createMockExcelData();

      const result = evaluatePower("2,-2", data);
      expect(result).toBe(0.25); // 2^-2 = 1/4
    });
  });

  describe("evaluateMod", () => {
    it("should calculate modulo", () => {
      const data = createMockExcelData({
        rows: [[10, 3]],
      });

      const result = evaluateMod("A2,B2", data);
      expect(result).toBe(1); // 10 % 3
    });

    it("should return #DIV/0! for zero divisor", () => {
      const data = createMockExcelData({
        rows: [[10, 0]],
      });

      const result = evaluateMod("A2,B2", data);
      expect(result).toBe("#DIV/0!");
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData();

      expect(evaluateMod("-10,3", data)).toBe(-1);
      expect(evaluateMod("10,-3", data)).toBe(1);
    });
  });

  describe("evaluateInt", () => {
    it("should round down to integer", () => {
      const data = createMockExcelData({
        rows: [[3.7]],
      });

      const result = evaluateInt("A2", data);
      expect(result).toBe(3);
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData({
        rows: [[-3.7]],
      });

      const result = evaluateInt("A2", data);
      expect(result).toBe(-4); // Floor of -3.7
    });

    it("should handle integers", () => {
      const data = createMockExcelData({
        rows: [[5]],
      });

      const result = evaluateInt("A2", data);
      expect(result).toBe(5);
    });
  });

  describe("evaluateFloor", () => {
    it("should floor to significance", () => {
      const data = createMockExcelData({
        rows: [[3.7]],
      });

      expect(evaluateFloor("A2,1", data)).toBe(3);
      expect(evaluateFloor("A2,0.5", data)).toBe(3.5);
    });

    it("should return #DIV/0! for zero significance", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      const result = evaluateFloor("A2,0", data);
      expect(result).toBe("#DIV/0!");
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData();

      const result = evaluateFloor("-3.7,1", data);
      expect(result).toBe(-4);
    });
  });

  describe("evaluateCeiling", () => {
    it("should ceiling to significance", () => {
      const data = createMockExcelData({
        rows: [[3.2]],
      });

      expect(evaluateCeiling("A2,1", data)).toBe(4);
      expect(evaluateCeiling("A2,0.5", data)).toBe(3.5);
    });

    it("should return #DIV/0! for zero significance", () => {
      const data = createMockExcelData({
        rows: [[10]],
      });

      const result = evaluateCeiling("A2,0", data);
      expect(result).toBe("#DIV/0!");
    });

    it("should handle negative numbers", () => {
      const data = createMockExcelData();

      const result = evaluateCeiling("-3.2,1", data);
      expect(result).toBe(-3);
    });
  });
});
