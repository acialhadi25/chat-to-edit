import { describe, it, expect } from "vitest";
import {
  validateMergeOperation,
  checkHeaderCompatibility,
  validateSheetName,
  sanitizeSheetName,
  checkDuplicateSheetNames,
  generateUniqueSheetName,
} from "./mergeValidation";
import type { SheetData } from "@/types/excel";

describe("mergeValidation", () => {
  describe("validateMergeOperation", () => {
    const createMockFile = (name: string, sheets: { [key: string]: SheetData }) => ({
      name,
      data: sheets,
    });

    it("should validate empty files list", () => {
      const result = validateMergeOperation([], "single");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No files selected for merging");
    });

    it("should require at least 2 files", () => {
      const file = createMockFile("file1.xlsx", {
        Sheet1: { headers: ["A", "B"], rows: [[1, 2]] },
      });
      const result = validateMergeOperation([file], "single");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("At least 2 files are required for merging");
    });

    it("should limit to 10 files max", () => {
      const files = Array.from({ length: 11 }, (_, i) =>
        createMockFile(`file${i}.xlsx`, {
          Sheet1: { headers: ["A"], rows: [[1]] },
        })
      );
      const result = validateMergeOperation(files, "single");
      expect(result.errors).toContain("Maximum 10 files can be merged at once");
    });

    it("should detect files with no sheets", () => {
      const files = [
        createMockFile("file1.xlsx", {}),
        createMockFile("file2.xlsx", { Sheet1: { headers: ["A"], rows: [[1]] } }),
      ];
      const result = validateMergeOperation(files, "single");
      expect(result.errors).toContain("file1.xlsx has no sheets");
    });

    it("should warn about empty sheets", () => {
      const files = [
        createMockFile("file1.xlsx", { Sheet1: { headers: [], rows: [] } }),
        createMockFile("file2.xlsx", { Sheet1: { headers: ["A"], rows: [[1]] } }),
      ];
      const result = validateMergeOperation(files, "single");
      expect(result.warnings).toContain("file1.xlsx - Sheet1 has no headers");
      expect(result.warnings).toContain("file1.xlsx - Sheet1 has no data rows");
    });

    it("should validate header compatibility for single mode", () => {
      const files = [
        createMockFile("file1.xlsx", { Sheet1: { headers: ["A", "B", "C"], rows: [[1, 2, 3]] } }),
        createMockFile("file2.xlsx", { Sheet1: { headers: ["A", "B", "D"], rows: [[4, 5, 6]] } }),
      ];
      const result = validateMergeOperation(files, "single");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Headers don't match");
    });

    it("should pass for compatible files", () => {
      const files = [
        createMockFile("file1.xlsx", { Sheet1: { headers: ["A", "B"], rows: [[1, 2]] } }),
        createMockFile("file2.xlsx", { Sheet1: { headers: ["A", "B"], rows: [[3, 4]] } }),
      ];
      const result = validateMergeOperation(files, "single");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should warn about large datasets", () => {
      const files = [
        createMockFile("file1.xlsx", {
          Sheet1: { headers: ["A"], rows: Array(50000).fill([1]) },
        }),
        createMockFile("file2.xlsx", {
          Sheet1: { headers: ["A"], rows: Array(60000).fill([1]) },
        }),
      ];
      const result = validateMergeOperation(files, "single");
      expect(result.warnings).toContain("Large dataset (>100k rows) - merge may take longer");
    });
  });

  describe("checkHeaderCompatibility", () => {
    it("should detect exact match", () => {
      const result = checkHeaderCompatibility(["A", "B", "C"], ["A", "B", "C"]);
      expect(result.headerMatch).toBe(true);
      expect(result.compatible).toBe(true);
      expect(result.commonHeaders).toEqual(["a", "b", "c"]);
    });

    it("should detect partial match (80% threshold)", () => {
      const result = checkHeaderCompatibility(["A", "B", "C", "D", "E"], ["A", "B", "C", "F", "G"]);
      expect(result.headerMatch).toBe(false); // 3/5 = 60% which is below 80% threshold
    });

    it("should detect partial match at threshold", () => {
      const result = checkHeaderCompatibility(["A", "B", "C", "D", "E"], ["A", "B", "C", "D", "X"]);
      expect(result.headerMatch).toBe(true); // 4/5 = 80%
    });

    it("should detect below threshold", () => {
      const result = checkHeaderCompatibility(["A", "B", "C", "D", "E"], ["A", "B", "X", "Y", "Z"]);
      expect(result.headerMatch).toBe(false); // 2/5 = 40%
    });

    it("should identify missing and extra headers", () => {
      const result = checkHeaderCompatibility(["A", "B", "C"], ["A", "B", "D", "E"]);
      expect(result.missingHeaders).toEqual(["c"]);
      expect(result.extraHeaders).toEqual(["d", "e"]);
    });

    it("should be case insensitive", () => {
      const result = checkHeaderCompatibility(["Name", "Age"], ["NAME", "AGE"]);
      expect(result.headerMatch).toBe(true);
    });

    it("should trim whitespace", () => {
      const result = checkHeaderCompatibility(["Name ", " Age"], ["Name", "Age"]);
      expect(result.headerMatch).toBe(true);
    });
  });

  describe("validateSheetName", () => {
    it("should validate valid names", () => {
      expect(validateSheetName("Sheet1").valid).toBe(true);
      expect(validateSheetName("Data_2024").valid).toBe(true);
      expect(validateSheetName("Sales Data").valid).toBe(true);
    });

    it("should reject names over 31 characters", () => {
      const longName = "ThisIsAVeryLongSheetNameThatExceeds31Chars";
      const result = validateSheetName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("31 character");
    });

    it("should reject names with invalid characters", () => {
      const invalidChars = [":", "\\", "/", "?", "*", "[", "]"];
      invalidChars.forEach((char) => {
        const result = validateSheetName(`Sheet${char}1`);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("invalid characters");
      });
    });

    it("should reject empty names", () => {
      const result = validateSheetName("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot be empty");
    });

    it("should reject whitespace-only names", () => {
      const result = validateSheetName("   ");
      expect(result.valid).toBe(false);
    });
  });

  describe("sanitizeSheetName", () => {
    it("should replace invalid characters with underscore", () => {
      expect(sanitizeSheetName("Sheet:1")).toBe("Sheet_1");
      expect(sanitizeSheetName("Data[2024]")).toBe("Data_2024_");
      expect(sanitizeSheetName("A/B")).toBe("A_B");
    });

    it("should truncate long names", () => {
      const longName = "ThisIsAVeryLongSheetNameThatExceeds31Chars";
      expect(sanitizeSheetName(longName).length).toBe(31);
    });

    it("should preserve valid names", () => {
      expect(sanitizeSheetName("Sheet1")).toBe("Sheet1");
      expect(sanitizeSheetName("Sales Data")).toBe("Sales Data");
    });

    it("should handle custom max length", () => {
      expect(sanitizeSheetName("LongSheetName", 10)).toBe("LongSheetN");
    });
  });

  describe("checkDuplicateSheetNames", () => {
    it("should detect duplicates", () => {
      const files = [
        { name: "file.xlsx", data: { Sheet1: { headers: ["A"], rows: [] } } },
        { name: "file.xlsx", data: { Sheet1: { headers: ["A"], rows: [] } } },
      ];
      const result = checkDuplicateSheetNames(files);
      expect(result.duplicates).toContain("file_Sheet1");
    });

    it("should identify unique names", () => {
      const files = [
        { name: "file1.xlsx", data: { Sheet1: { headers: ["A"], rows: [] } } },
        { name: "file2.xlsx", data: { Sheet2: { headers: ["A"], rows: [] } } },
      ];
      const result = checkDuplicateSheetNames(files);
      expect(result.duplicates).toHaveLength(0);
      expect(result.uniqueNames).toContain("file1_Sheet1");
      expect(result.uniqueNames).toContain("file2_Sheet2");
    });

    it("should handle multiple sheets per file", () => {
      const files = [
        {
          name: "file1.xlsx",
          data: {
            Sheet1: { headers: ["A"], rows: [] },
            Sheet2: { headers: ["A"], rows: [] },
          },
        },
      ];
      const result = checkDuplicateSheetNames(files);
      expect(result.uniqueNames).toContain("file1_Sheet1");
      expect(result.uniqueNames).toContain("file1_Sheet2");
    });
  });

  describe("generateUniqueSheetName", () => {
    it("should return original name if not exists", () => {
      const result = generateUniqueSheetName("Sheet1", ["Sheet2", "Sheet3"]);
      expect(result).toBe("Sheet1");
    });

    it("should generate unique name with counter", () => {
      const result = generateUniqueSheetName("Sheet1", ["Sheet1"]);
      expect(result).toBe("Sheet1_1");
    });

    it("should increment counter until unique", () => {
      const result = generateUniqueSheetName("Sheet1", ["Sheet1", "Sheet1_1", "Sheet1_2"]);
      expect(result).toBe("Sheet1_3");
    });

    it("should handle name length with counter", () => {
      // 31 char limit - "_1" = 3 chars
      const baseName = "VeryLongSheetNameThatNeedsTruncation";
      // The sanitized name becomes exactly what would conflict
      const existingTruncated = sanitizeSheetName(baseName, 31); // Will be truncated to 31
      const result = generateUniqueSheetName(baseName, [existingTruncated]);
      expect(result.length).toBeLessThanOrEqual(31);
      // Should have _1 suffix since it was in existingNames
      expect(result).toMatch(/_1$/);
    });

    it("should sanitize before generating unique name", () => {
      const result = generateUniqueSheetName("Sheet:1", ["Sheet_1"]);
      expect(result).toBe("Sheet_1_1");
    });
  });
});
