/**
 * Unit Tests for Type Guards
 * 
 * Tests runtime validation for ExcelData, API responses, and action types.
 * **Validates: Requirements 5.1.4**
 */

import { describe, it, expect } from "vitest";
import {
  isActionType,
  isCellTarget,
  isDataChange,
  isDataChangeArray,
  isQuickOption,
  isQuickOptionArray,
  isAIAction,
  isSheetData,
  isExcelData,
  isAIResponse,
  isChatMessage,
  validateExcelData,
  validateAIResponse,
  safeValidateAIResponse,
  safeValidateExcelData,
  isCellReference,
  isColumnReference,
  isRowReference,
  isRangeReference,
} from "../typeGuards";
import type {
  ExcelData,
  SheetData,
  AIAction,
  AIResponse,
  CellTarget,
  DataChange,
  QuickOption,
  ChatMessage,
} from "@/types/excel";

describe("typeGuards", () => {
  describe("isActionType", () => {
    it("should return true for valid action types", () => {
      expect(isActionType("INSERT_FORMULA")).toBe(true);
      expect(isActionType("EDIT_CELL")).toBe(true);
      expect(isActionType("ADD_COLUMN")).toBe(true);
      expect(isActionType("SORT_DATA")).toBe(true);
      expect(isActionType("CREATE_CHART")).toBe(true);
    });

    it("should return false for invalid action types", () => {
      expect(isActionType("INVALID_ACTION")).toBe(false);
      expect(isActionType("")).toBe(false);
      expect(isActionType(123)).toBe(false);
      expect(isActionType(null)).toBe(false);
      expect(isActionType(undefined)).toBe(false);
      expect(isActionType({})).toBe(false);
    });
  });

  describe("isCellTarget", () => {
    it("should return true for valid cell targets", () => {
      const validTargets: CellTarget[] = [
        { type: "cell", ref: "A1" },
        { type: "range", ref: "A1:B10" },
        { type: "column", ref: "B" },
        { type: "row", ref: "5" },
      ];

      validTargets.forEach((target) => {
        expect(isCellTarget(target)).toBe(true);
      });
    });

    it("should return false for invalid cell targets", () => {
      expect(isCellTarget({ type: "invalid", ref: "A1" })).toBe(false);
      expect(isCellTarget({ type: "cell" })).toBe(false);
      expect(isCellTarget({ ref: "A1" })).toBe(false);
      expect(isCellTarget({ type: 123, ref: "A1" })).toBe(false);
      expect(isCellTarget({ type: "cell", ref: 123 })).toBe(false);
      expect(isCellTarget(null)).toBe(false);
      expect(isCellTarget("A1")).toBe(false);
    });
  });

  describe("isDataChange", () => {
    it("should return true for valid data changes", () => {
      const validChanges: DataChange[] = [
        { cellRef: "A1", before: "old", after: "new", type: "value" },
        { cellRef: "B2", before: 10, after: 20, type: "value" },
        { cellRef: "C3", before: null, after: "value", type: "value" },
        { cellRef: "D4", before: "=SUM(A1:A10)", after: "=SUM(B1:B10)", type: "formula" },
      ];

      validChanges.forEach((change) => {
        expect(isDataChange(change)).toBe(true);
      });
    });

    it("should return false for invalid data changes", () => {
      expect(isDataChange({ cellRef: "A1", before: "old", after: "new" })).toBe(false); // missing type
      expect(isDataChange({ before: "old", after: "new", type: "value" })).toBe(false); // missing cellRef
      expect(isDataChange({ cellRef: 123, before: "old", after: "new", type: "value" })).toBe(false);
      expect(isDataChange({ cellRef: "A1", before: {}, after: "new", type: "value" })).toBe(false);
      expect(isDataChange({ cellRef: "A1", before: "old", after: "new", type: "invalid" })).toBe(false);
      expect(isDataChange(null)).toBe(false);
    });
  });

  describe("isDataChangeArray", () => {
    it("should return true for valid data change arrays", () => {
      const validArray: DataChange[] = [
        { cellRef: "A1", before: "old", after: "new", type: "value" },
        { cellRef: "B2", before: 10, after: 20, type: "value" },
      ];

      expect(isDataChangeArray(validArray)).toBe(true);
      expect(isDataChangeArray([])).toBe(true);
    });

    it("should return false for invalid data change arrays", () => {
      expect(isDataChangeArray([{ cellRef: "A1" }])).toBe(false);
      expect(isDataChangeArray([{ cellRef: "A1", before: "old", after: "new", type: "value" }, null])).toBe(false);
      expect(isDataChangeArray(null)).toBe(false);
      expect(isDataChangeArray("not an array")).toBe(false);
    });
  });

  describe("isQuickOption", () => {
    it("should return true for valid quick options", () => {
      const validOptions: QuickOption[] = [
        { id: "1", label: "Apply", value: "apply", variant: "default" },
        { id: "2", label: "Cancel", value: "cancel", variant: "destructive" },
        { id: "3", label: "Save", value: "save", variant: "success", icon: "save" },
        { id: "4", label: "Execute", value: "exec", variant: "outline", isApplyAction: true },
      ];

      validOptions.forEach((option) => {
        expect(isQuickOption(option)).toBe(true);
      });
    });

    it("should return false for invalid quick options", () => {
      expect(isQuickOption({ id: "1", label: "Apply", value: "apply" })).toBe(false); // missing variant
      expect(isQuickOption({ id: "1", label: "Apply", variant: "default" })).toBe(false); // missing value
      expect(isQuickOption({ id: "1", label: "Apply", value: "apply", variant: "invalid" })).toBe(false);
      expect(isQuickOption({ id: 123, label: "Apply", value: "apply", variant: "default" })).toBe(false);
      expect(isQuickOption(null)).toBe(false);
    });
  });

  describe("isQuickOptionArray", () => {
    it("should return true for valid quick option arrays", () => {
      const validArray: QuickOption[] = [
        { id: "1", label: "Apply", value: "apply", variant: "default" },
        { id: "2", label: "Cancel", value: "cancel", variant: "destructive" },
      ];

      expect(isQuickOptionArray(validArray)).toBe(true);
      expect(isQuickOptionArray([])).toBe(true);
    });

    it("should return false for invalid quick option arrays", () => {
      expect(isQuickOptionArray([{ id: "1", label: "Apply" }])).toBe(false);
      expect(isQuickOptionArray(null)).toBe(false);
      expect(isQuickOptionArray("not an array")).toBe(false);
    });
  });

  describe("isAIAction", () => {
    it("should return true for valid AI actions", () => {
      const validActions: AIAction[] = [
        { type: "INSERT_FORMULA", status: "pending", formula: "=SUM(A1:A10)" },
        { type: "EDIT_CELL", status: "applied", target: { type: "cell", ref: "A1" } },
        { type: "ADD_COLUMN", status: "pending", newColumnName: "Total" },
        { type: "SORT_DATA", status: "pending", sortColumn: "A", sortDirection: "asc" },
        {
          type: "FIND_REPLACE",
          status: "pending",
          findValue: "old",
          replaceValue: "new",
        },
      ];

      validActions.forEach((action) => {
        expect(isAIAction(action)).toBe(true);
      });
    });

    it("should return false for invalid AI actions", () => {
      expect(isAIAction({ type: "INVALID_TYPE", status: "pending" })).toBe(false);
      expect(isAIAction({ type: "INSERT_FORMULA" })).toBe(false); // missing status
      expect(isAIAction({ status: "pending" })).toBe(false); // missing type
      expect(isAIAction({ type: "INSERT_FORMULA", status: "invalid" })).toBe(false);
      expect(isAIAction({ type: "SORT_DATA", status: "pending", sortDirection: "invalid" })).toBe(false);
      expect(isAIAction(null)).toBe(false);
    });
  });

  describe("isSheetData", () => {
    it("should return true for valid sheet data", () => {
      const validSheetData: SheetData[] = [
        { headers: ["A", "B", "C"], rows: [[1, 2, 3], [4, 5, 6]] },
        { headers: ["Name", "Age"], rows: [["John", 30], ["Jane", 25]] },
        { headers: ["Col1"], rows: [[null], ["value"], [123]] },
      ];

      validSheetData.forEach((data) => {
        expect(isSheetData(data)).toBe(true);
      });
    });

    it("should return false for invalid sheet data", () => {
      expect(isSheetData({ headers: ["A"], rows: "not an array" })).toBe(false);
      expect(isSheetData({ headers: "not an array", rows: [[1, 2]] })).toBe(false);
      expect(isSheetData({ headers: [123], rows: [[1, 2]] })).toBe(false);
      expect(isSheetData({ headers: ["A"], rows: [[{}]] })).toBe(false); // invalid cell value
      expect(isSheetData(null)).toBe(false);
    });
  });

  describe("isExcelData", () => {
    it("should return true for valid Excel data", () => {
      const validExcelData: ExcelData = {
        fileName: "test.xlsx",
        sheets: ["Sheet1", "Sheet2"],
        currentSheet: "Sheet1",
        headers: ["A", "B", "C"],
        rows: [[1, 2, 3], [4, 5, 6]],
        formulas: { A1: "=SUM(B1:B10)" },
        selectedCells: ["A1", "B2"],
        pendingChanges: [],
        cellStyles: {},
      };

      expect(isExcelData(validExcelData)).toBe(true);
    });

    it("should return true for Excel data with optional fields", () => {
      const validExcelData: ExcelData = {
        fileName: "test.xlsx",
        sheets: ["Sheet1"],
        currentSheet: "Sheet1",
        headers: ["A", "B"],
        rows: [[1, 2]],
        formulas: {},
        selectedCells: [],
        pendingChanges: [],
        cellStyles: {},
        isSelecting: true,
        allSheets: {
          Sheet1: { headers: ["A", "B"], rows: [[1, 2]] },
        },
        validationRules: {},
      };

      expect(isExcelData(validExcelData)).toBe(true);
    });

    it("should return false for invalid Excel data", () => {
      expect(isExcelData({ fileName: "test.xlsx" })).toBe(false); // missing required fields
      expect(isExcelData({ fileName: 123 })).toBe(false);
      expect(
        isExcelData({
          fileName: "test.xlsx",
          sheets: "not an array",
          currentSheet: "Sheet1",
          headers: [],
          rows: [],
          formulas: {},
          selectedCells: [],
          pendingChanges: [],
          cellStyles: {},
        })
      ).toBe(false);
      expect(isExcelData(null)).toBe(false);
    });
  });

  describe("isAIResponse", () => {
    it("should return true for valid AI responses", () => {
      const validResponses: AIResponse[] = [
        { content: "Hello" },
        { content: "Response", action: { type: "INSERT_FORMULA" } },
        {
          content: "Response",
          quickOptions: [{ id: "1", label: "Apply", value: "apply", variant: "default" }],
        },
      ];

      validResponses.forEach((response) => {
        expect(isAIResponse(response)).toBe(true);
      });
    });

    it("should return false for invalid AI responses", () => {
      expect(isAIResponse({})).toBe(false); // missing content
      expect(isAIResponse({ content: 123 })).toBe(false);
      expect(isAIResponse({ content: "Hello", action: { type: "INVALID" } })).toBe(false);
      expect(isAIResponse({ content: "Hello", quickOptions: "not an array" })).toBe(false);
      expect(isAIResponse(null)).toBe(false);
    });
  });

  describe("isChatMessage", () => {
    it("should return true for valid chat messages", () => {
      const validMessages: ChatMessage[] = [
        { id: "1", role: "user", content: "Hello", timestamp: new Date() },
        { id: "2", role: "assistant", content: "Hi", timestamp: new Date() },
        {
          id: "3",
          role: "assistant",
          content: "Response",
          timestamp: new Date(),
          action: { type: "INSERT_FORMULA", status: "pending" },
        },
      ];

      validMessages.forEach((message) => {
        expect(isChatMessage(message)).toBe(true);
      });
    });

    it("should return false for invalid chat messages", () => {
      expect(isChatMessage({ id: "1", role: "user", content: "Hello" })).toBe(false); // missing timestamp
      expect(isChatMessage({ id: "1", role: "invalid", content: "Hello", timestamp: new Date() })).toBe(false);
      expect(isChatMessage({ id: 123, role: "user", content: "Hello", timestamp: new Date() })).toBe(false);
      expect(isChatMessage(null)).toBe(false);
    });
  });

  describe("validateExcelData", () => {
    it("should return valid Excel data", () => {
      const validData: ExcelData = {
        fileName: "test.xlsx",
        sheets: ["Sheet1"],
        currentSheet: "Sheet1",
        headers: ["A", "B"],
        rows: [[1, 2]],
        formulas: {},
        selectedCells: [],
        pendingChanges: [],
        cellStyles: {},
      };

      expect(validateExcelData(validData)).toEqual(validData);
    });

    it("should throw error for invalid Excel data", () => {
      expect(() => validateExcelData(null)).toThrow("Invalid ExcelData structure");
      expect(() => validateExcelData({ fileName: "test.xlsx" })).toThrow("Invalid ExcelData structure");
    });
  });

  describe("validateAIResponse", () => {
    it("should return valid AI response", () => {
      const validResponse: AIResponse = { content: "Hello" };
      expect(validateAIResponse(validResponse)).toEqual(validResponse);
    });

    it("should throw error for invalid AI response", () => {
      expect(() => validateAIResponse(null)).toThrow("Invalid AIResponse structure");
      expect(() => validateAIResponse({})).toThrow("Invalid AIResponse structure");
    });
  });

  describe("safeValidateAIResponse", () => {
    it("should return valid AI response", () => {
      const validResponse: AIResponse = { content: "Hello" };
      expect(safeValidateAIResponse(validResponse)).toEqual(validResponse);
    });

    it("should return null for invalid AI response", () => {
      expect(safeValidateAIResponse(null)).toBeNull();
      expect(safeValidateAIResponse({})).toBeNull();
    });
  });

  describe("safeValidateExcelData", () => {
    it("should return valid Excel data", () => {
      const validData: ExcelData = {
        fileName: "test.xlsx",
        sheets: ["Sheet1"],
        currentSheet: "Sheet1",
        headers: ["A", "B"],
        rows: [[1, 2]],
        formulas: {},
        selectedCells: [],
        pendingChanges: [],
        cellStyles: {},
      };

      expect(safeValidateExcelData(validData)).toEqual(validData);
    });

    it("should return null for invalid Excel data", () => {
      expect(safeValidateExcelData(null)).toBeNull();
      expect(safeValidateExcelData({ fileName: "test.xlsx" })).toBeNull();
    });
  });

  describe("isCellReference", () => {
    it("should return true for valid cell references", () => {
      expect(isCellReference("A1")).toBe(true);
      expect(isCellReference("B10")).toBe(true);
      expect(isCellReference("AA100")).toBe(true);
      expect(isCellReference("ZZ999")).toBe(true);
    });

    it("should return false for invalid cell references", () => {
      expect(isCellReference("A")).toBe(false);
      expect(isCellReference("1")).toBe(false);
      expect(isCellReference("A1:B10")).toBe(false);
      expect(isCellReference("a1")).toBe(false); // lowercase
      expect(isCellReference(123)).toBe(false);
      expect(isCellReference(null)).toBe(false);
    });
  });

  describe("isColumnReference", () => {
    it("should return true for valid column references", () => {
      expect(isColumnReference("A")).toBe(true);
      expect(isColumnReference("B")).toBe(true);
      expect(isColumnReference("AA")).toBe(true);
      expect(isColumnReference("ZZ")).toBe(true);
    });

    it("should return false for invalid column references", () => {
      expect(isColumnReference("A1")).toBe(false);
      expect(isColumnReference("1")).toBe(false);
      expect(isColumnReference("a")).toBe(false); // lowercase
      expect(isColumnReference(123)).toBe(false);
      expect(isColumnReference(null)).toBe(false);
    });
  });

  describe("isRowReference", () => {
    it("should return true for valid row references", () => {
      expect(isRowReference("1")).toBe(true);
      expect(isRowReference("10")).toBe(true);
      expect(isRowReference("100")).toBe(true);
      expect(isRowReference("999")).toBe(true);
    });

    it("should return false for invalid row references", () => {
      expect(isRowReference("A")).toBe(false);
      expect(isRowReference("A1")).toBe(false);
      expect(isRowReference("1.5")).toBe(false);
      expect(isRowReference(123)).toBe(false);
      expect(isRowReference(null)).toBe(false);
    });
  });

  describe("isRangeReference", () => {
    it("should return true for valid range references", () => {
      expect(isRangeReference("A1:B10")).toBe(true);
      expect(isRangeReference("C5:D20")).toBe(true);
      expect(isRangeReference("AA1:ZZ100")).toBe(true);
    });

    it("should return false for invalid range references", () => {
      expect(isRangeReference("A1")).toBe(false);
      expect(isRangeReference("A:B")).toBe(false);
      expect(isRangeReference("1:10")).toBe(false);
      expect(isRangeReference("A1-B10")).toBe(false);
      expect(isRangeReference(123)).toBe(false);
      expect(isRangeReference(null)).toBe(false);
    });
  });
});
