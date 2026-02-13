import { describe, it, expect } from "vitest";
import {
  evaluateConcat,
  evaluateConcatenate,
  evaluateLeft,
  evaluateRight,
  evaluateMid,
  evaluateLen,
  evaluateTrim,
  evaluateUpper,
  evaluateLower,
  evaluateProper,
  evaluateSubstitute,
  evaluateReplace,
  evaluateText,
} from "../textFormulas";
import { createMockExcelData } from "@/test/utils/testHelpers";

describe("textFormulas", () => {
  describe("evaluateConcat", () => {
    it("should concatenate cell values", () => {
      const data = createMockExcelData({
        rows: [["Hello", " ", "World"]],
      });

      const result = evaluateConcat("A2,B2,C2", data);
      expect(result).toBe("Hello World");
    });

    it("should concatenate string literals", () => {
      const data = createMockExcelData();

      const result = evaluateConcat('"Hello"," ","World"', data);
      expect(result).toBe("Hello World");
    });

    it("should mix cell references and literals", () => {
      const data = createMockExcelData({
        rows: [["John"]],
      });

      const result = evaluateConcat('A2," ","Doe"', data);
      expect(result).toBe("John Doe");
    });

    it("should handle empty cells", () => {
      const data = createMockExcelData({
        rows: [["Hello", null, "World"]],
      });

      const result = evaluateConcat("A2,B2,C2", data);
      expect(result).toBe("HelloWorld");
    });
  });

  describe("evaluateConcatenate", () => {
    it("should be alias for concat", () => {
      const data = createMockExcelData({
        rows: [["A", "B", "C"]],
      });

      const result = evaluateConcatenate("A2,B2,C2", data);
      expect(result).toBe("ABC");
    });
  });

  describe("evaluateLeft", () => {
    it("should return leftmost characters", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      expect(evaluateLeft("A2,5", data)).toBe("Hello");
      expect(evaluateLeft("A2,1", data)).toBe("H");
    });

    it("should default to 1 character", () => {
      const data = createMockExcelData({
        rows: [["Hello"]],
      });

      const result = evaluateLeft("A2", data);
      expect(result).toBe("H");
    });

    it("should handle numChars greater than string length", () => {
      const data = createMockExcelData({
        rows: [["Hi"]],
      });

      const result = evaluateLeft("A2,10", data);
      expect(result).toBe("Hi");
    });

    it("should handle empty string", () => {
      const data = createMockExcelData({
        rows: [[""]],
      });

      const result = evaluateLeft("A2,5", data);
      expect(result).toBe("");
    });
  });

  describe("evaluateRight", () => {
    it("should return rightmost characters", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      expect(evaluateRight("A2,5", data)).toBe("World");
      expect(evaluateRight("A2,1", data)).toBe("d");
    });

    it("should default to 1 character", () => {
      const data = createMockExcelData({
        rows: [["Hello"]],
      });

      const result = evaluateRight("A2", data);
      expect(result).toBe("o");
    });

    it("should handle numChars greater than string length", () => {
      const data = createMockExcelData({
        rows: [["Hi"]],
      });

      const result = evaluateRight("A2,10", data);
      expect(result).toBe("Hi");
    });
  });

  describe("evaluateMid", () => {
    it("should return middle characters", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      expect(evaluateMid("A2,7,5", data)).toBe("World");
      expect(evaluateMid("A2,1,5", data)).toBe("Hello");
    });

    it("should handle start position beyond string length", () => {
      const data = createMockExcelData({
        rows: [["Hello"]],
      });

      const result = evaluateMid("A2,10,5", data);
      expect(result).toBe("");
    });

    it("should handle numChars extending beyond string", () => {
      const data = createMockExcelData({
        rows: [["Hello"]],
      });

      const result = evaluateMid("A2,3,10", data);
      expect(result).toBe("llo");
    });
  });

  describe("evaluateLen", () => {
    it("should return length of text", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateLen("A2", data);
      expect(result).toBe(11);
    });

    it("should handle empty string", () => {
      const data = createMockExcelData({
        rows: [[""]],
      });

      const result = evaluateLen("A2", data);
      expect(result).toBe(0);
    });

    it("should handle string literals", () => {
      const data = createMockExcelData();

      const result = evaluateLen('"Hello"', data);
      expect(result).toBe(5);
    });
  });

  describe("evaluateTrim", () => {
    it("should remove leading and trailing spaces", () => {
      const data = createMockExcelData({
        rows: [["  Hello World  "]],
      });

      const result = evaluateTrim("A2", data);
      expect(result).toBe("Hello World");
    });

    it("should reduce multiple spaces to single space", () => {
      const data = createMockExcelData({
        rows: [["Hello    World"]],
      });

      const result = evaluateTrim("A2", data);
      expect(result).toBe("Hello World");
    });

    it("should handle string with no extra spaces", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateTrim("A2", data);
      expect(result).toBe("Hello World");
    });
  });

  describe("evaluateUpper", () => {
    it("should convert to uppercase", () => {
      const data = createMockExcelData({
        rows: [["hello world"]],
      });

      const result = evaluateUpper("A2", data);
      expect(result).toBe("HELLO WORLD");
    });

    it("should handle mixed case", () => {
      const data = createMockExcelData({
        rows: [["HeLLo WoRLd"]],
      });

      const result = evaluateUpper("A2", data);
      expect(result).toBe("HELLO WORLD");
    });

    it("should handle already uppercase", () => {
      const data = createMockExcelData({
        rows: [["HELLO"]],
      });

      const result = evaluateUpper("A2", data);
      expect(result).toBe("HELLO");
    });
  });

  describe("evaluateLower", () => {
    it("should convert to lowercase", () => {
      const data = createMockExcelData({
        rows: [["HELLO WORLD"]],
      });

      const result = evaluateLower("A2", data);
      expect(result).toBe("hello world");
    });

    it("should handle mixed case", () => {
      const data = createMockExcelData({
        rows: [["HeLLo WoRLd"]],
      });

      const result = evaluateLower("A2", data);
      expect(result).toBe("hello world");
    });
  });

  describe("evaluateProper", () => {
    it("should convert to title case", () => {
      const data = createMockExcelData({
        rows: [["hello world"]],
      });

      const result = evaluateProper("A2", data);
      expect(result).toBe("Hello World");
    });

    it("should handle all caps", () => {
      const data = createMockExcelData({
        rows: [["HELLO WORLD"]],
      });

      const result = evaluateProper("A2", data);
      expect(result).toBe("Hello World");
    });

    it("should handle mixed case", () => {
      const data = createMockExcelData({
        rows: [["hELLo wORLd"]],
      });

      const result = evaluateProper("A2", data);
      expect(result).toBe("Hello World");
    });
  });

  describe("evaluateSubstitute", () => {
    it("should replace all occurrences by default", () => {
      const data = createMockExcelData({
        rows: [["Hello World Hello"]],
      });

      const result = evaluateSubstitute('A2,"Hello","Hi"', data);
      expect(result).toBe("Hi World Hi");
    });

    it("should replace specific instance", () => {
      const data = createMockExcelData({
        rows: [["Hello World Hello"]],
      });

      const result = evaluateSubstitute('A2,"Hello","Hi",1', data);
      expect(result).toBe("Hi World Hello");
    });

    it("should handle no matches", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateSubstitute('A2,"Goodbye","Hi"', data);
      expect(result).toBe("Hello World");
    });

    it("should handle empty replacement", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateSubstitute('A2,"Hello",""', data);
      expect(result).toBe(" World");
    });
  });

  describe("evaluateReplace", () => {
    it("should replace characters by position", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateReplace('A2,7,5,"Universe"', data);
      expect(result).toBe("Hello Universe");
    });

    it("should handle replacement at start", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateReplace('A2,1,5,"Hi"', data);
      expect(result).toBe("Hi World");
    });

    it("should handle replacement at end", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateReplace('A2,7,5,"!"', data);
      expect(result).toBe("Hello !");
    });

    it("should handle zero numChars (insert)", () => {
      const data = createMockExcelData({
        rows: [["Hello World"]],
      });

      const result = evaluateReplace('A2,6,0," Beautiful"', data);
      expect(result).toBe("Hello Beautiful World");
    });
  });

  describe("evaluateText", () => {
    it("should format number with decimals", () => {
      const data = createMockExcelData({
        rows: [[3.14159]],
      });

      expect(evaluateText('A2,"0.00"', data)).toBe("3.14");
      expect(evaluateText('A2,"0.0000"', data)).toBe("3.1416");
    });

    it("should handle integer format", () => {
      const data = createMockExcelData({
        rows: [[42.7]],
      });

      const result = evaluateText('A2,"0"', data);
      expect(result).toBe("43");
    });

    it("should handle literal values", () => {
      const data = createMockExcelData();

      const result = evaluateText('123.456,"0.00"', data);
      expect(result).toBe("123.46");
    });

    it("should convert to string for non-numeric format", () => {
      const data = createMockExcelData({
        rows: [[42]],
      });

      const result = evaluateText('A2,"text"', data);
      expect(result).toBe("42");
    });
  });
});
