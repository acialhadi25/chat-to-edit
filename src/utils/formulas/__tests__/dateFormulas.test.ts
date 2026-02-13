import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  evaluateToday,
  evaluateNow,
  evaluateYear,
  evaluateMonth,
  evaluateDay,
  evaluateWeekday,
  evaluateDate,
  evaluateDateDif,
} from "../dateFormulas";
import { createMockExcelData } from "@/test/utils/testHelpers";

describe("dateFormulas", () => {
  describe("evaluateToday", () => {
    beforeEach(() => {
      // Mock Date to return consistent value
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return current date in YYYY-MM-DD format", () => {
      const result = evaluateToday();
      expect(result).toBe("2024-01-15");
    });
  });

  describe("evaluateNow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:30:45Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return current date and time", () => {
      const result = evaluateNow();
      expect(result).toMatch(/2024-01-15 12:30:45/);
    });
  });

  describe("evaluateYear", () => {
    it("should extract year from date cell", () => {
      const data = createMockExcelData({
        rows: [["2024-03-15"]],
      });

      const result = evaluateYear("A2", data);
      expect(result).toBe(2024);
    });

    it("should extract year from date literal", () => {
      const data = createMockExcelData();

      const result = evaluateYear('"2024-03-15"', data);
      expect(result).toBe(2024);
    });

    it("should return 0 for invalid date", () => {
      const data = createMockExcelData({
        rows: [["invalid"]],
      });

      const result = evaluateYear("A2", data);
      expect(result).toBe(0);
    });

    it("should return 0 for null cell", () => {
      const data = createMockExcelData({
        rows: [[null]],
      });

      const result = evaluateYear("A2", data);
      expect(result).toBe(0);
    });

    it("should handle different date formats", () => {
      const data = createMockExcelData({
        rows: [["03/15/2024"]],
      });

      const result = evaluateYear("A2", data);
      expect(result).toBe(2024);
    });
  });

  describe("evaluateMonth", () => {
    it("should extract month from date (1-12)", () => {
      const data = createMockExcelData({
        rows: [["2024-03-15"]],
      });

      const result = evaluateMonth("A2", data);
      expect(result).toBe(3);
    });

    it("should handle January", () => {
      const data = createMockExcelData({
        rows: [["2024-01-15"]],
      });

      const result = evaluateMonth("A2", data);
      expect(result).toBe(1);
    });

    it("should handle December", () => {
      const data = createMockExcelData({
        rows: [["2024-12-15"]],
      });

      const result = evaluateMonth("A2", data);
      expect(result).toBe(12);
    });

    it("should return 0 for invalid date", () => {
      const data = createMockExcelData({
        rows: [["invalid"]],
      });

      const result = evaluateMonth("A2", data);
      expect(result).toBe(0);
    });
  });

  describe("evaluateDay", () => {
    it("should extract day from date (1-31)", () => {
      const data = createMockExcelData({
        rows: [["2024-03-15"]],
      });

      const result = evaluateDay("A2", data);
      expect(result).toBe(15);
    });

    it("should handle first day of month", () => {
      const data = createMockExcelData({
        rows: [["2024-03-01"]],
      });

      const result = evaluateDay("A2", data);
      expect(result).toBe(1);
    });

    it("should handle last day of month", () => {
      const data = createMockExcelData({
        rows: [["2024-03-31"]],
      });

      const result = evaluateDay("A2", data);
      expect(result).toBe(31);
    });

    it("should return 0 for invalid date", () => {
      const data = createMockExcelData({
        rows: [["invalid"]],
      });

      const result = evaluateDay("A2", data);
      expect(result).toBe(0);
    });
  });

  describe("evaluateWeekday", () => {
    it("should return day of week with default return type (1=Sunday)", () => {
      const data = createMockExcelData({
        rows: [["2024-01-15"]], // Monday
      });

      const result = evaluateWeekday("A2", data);
      expect(result).toBe(2); // Monday = 2 (1=Sunday)
    });

    it("should handle return type 1 (1=Sunday, 7=Saturday)", () => {
      const data = createMockExcelData({
        rows: [["2024-01-14"]], // Sunday
      });

      const result = evaluateWeekday("A2,1", data);
      expect(result).toBe(1);
    });

    it("should handle return type 2 (1=Monday, 7=Sunday)", () => {
      const data = createMockExcelData({
        rows: [["2024-01-15"]], // Monday
      });

      const result = evaluateWeekday("A2,2", data);
      expect(result).toBe(1);
    });

    it("should handle return type 3 (0=Monday, 6=Sunday)", () => {
      const data = createMockExcelData({
        rows: [["2024-01-15"]], // Monday
      });

      const result = evaluateWeekday("A2,3", data);
      expect(result).toBe(0);
    });

    it("should return 0 for invalid date", () => {
      const data = createMockExcelData({
        rows: [["invalid"]],
      });

      const result = evaluateWeekday("A2", data);
      expect(result).toBe(0);
    });
  });

  describe("evaluateDate", () => {
    it("should create date from year, month, day", () => {
      const data = createMockExcelData({
        rows: [[2024, 3, 15]],
      });

      const result = evaluateDate("A2,B2,C2", data);
      expect(result).toBe("2024-03-15");
    });

    it("should handle literal values", () => {
      const data = createMockExcelData();

      const result = evaluateDate("2024,3,15", data);
      expect(result).toBe("2024-03-15");
    });

    it("should handle single digit month and day", () => {
      const data = createMockExcelData();

      const result = evaluateDate("2024,1,5", data);
      expect(result).toBe("2024-01-05");
    });

    it("should handle cell references", () => {
      const data = createMockExcelData({
        rows: [[2024, 12, 25]],
      });

      const result = evaluateDate("A2,B2,C2", data);
      expect(result).toBe("2024-12-25");
    });
  });

  describe("evaluateDateDif", () => {
    it("should calculate difference in days", () => {
      const data = createMockExcelData({
        rows: [["2024-01-01", "2024-01-11"]],
      });

      const result = evaluateDateDif('A2,B2,"D"', data);
      expect(result).toBe(10);
    });

    it("should calculate difference in months", () => {
      const data = createMockExcelData({
        rows: [["2024-01-01", "2024-03-15"]],
      });

      const result = evaluateDateDif('A2,B2,"M"', data);
      expect(result).toBeGreaterThanOrEqual(2);
    });

    it("should calculate difference in years", () => {
      const data = createMockExcelData({
        rows: [["2020-01-01", "2024-01-01"]],
      });

      const result = evaluateDateDif('A2,B2,"Y"', data);
      expect(result).toBeGreaterThanOrEqual(3);
    });

    it("should return #VALUE! for invalid dates", () => {
      const data = createMockExcelData({
        rows: [["invalid", "2024-01-01"]],
      });

      const result = evaluateDateDif('A2,B2,"D"', data);
      expect(result).toBe("#VALUE!");
    });

    it("should return #VALUE! for null dates", () => {
      const data = createMockExcelData({
        rows: [[null, "2024-01-01"]],
      });

      const result = evaluateDateDif('A2,B2,"D"', data);
      expect(result).toBe("#VALUE!");
    });

    it("should return #VALUE! for missing arguments", () => {
      const data = createMockExcelData({
        rows: [["2024-01-01"]],
      });

      const result = evaluateDateDif("A2", data);
      expect(result).toBe("#VALUE!");
    });

    it("should handle literal date values", () => {
      const data = createMockExcelData();

      const result = evaluateDateDif('"2024-01-01","2024-01-11","D"', data);
      expect(result).toBe(10);
    });
  });
});
