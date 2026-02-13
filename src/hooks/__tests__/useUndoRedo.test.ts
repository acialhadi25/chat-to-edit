import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "../useUndoRedo";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { ExcelData } from "@/types/excel";

describe("useUndoRedo", () => {
  describe("initialization", () => {
    it("should initialize with empty history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.historyLength).toBe(0);
    });

    it("should initialize with null data", () => {
      const { result } = renderHook(() => useUndoRedo(null));

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.historyLength).toBe(0);
    });
  });

  describe("pushState", () => {
    it("should add entry to history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const modifiedData = createMockExcelData({
        rows: [[10, 20, 30]],
      });

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell A1"
        );
      });

      expect(result.current.historyLength).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("should clear redo history when pushing new state", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const state1 = createMockExcelData({ rows: [[1, 2, 3]] });
      const state2 = createMockExcelData({ rows: [[4, 5, 6]] });
      const state3 = createMockExcelData({ rows: [[7, 8, 9]] });

      // Push two states
      act(() => {
        result.current.pushState(initialData, state1, "EDIT_CELL", "Edit 1");
      });
      
      act(() => {
        result.current.pushState(state1, state2, "EDIT_CELL", "Edit 2");
      });

      expect(result.current.historyLength).toBe(2);

      // Undo once
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Push new state - should clear redo history
      act(() => {
        result.current.pushState(state1, state3, "EDIT_CELL", "Edit 3");
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.historyLength).toBe(2);
    });

    it("should limit history to MAX_HISTORY entries", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      // Push 51 states (MAX_HISTORY is 50)
      for (let i = 0; i < 51; i++) {
        const before = createMockExcelData({ rows: [[i, i, i]] });
        const after = createMockExcelData({ rows: [[i + 1, i + 1, i + 1]] });
        act(() => {
          result.current.pushState(before, after, "EDIT_CELL", `Edit ${i}`);
        });
      }

      // Should be limited to 50
      expect(result.current.historyLength).toBe(50);
    });
  });

  describe("undo", () => {
    it("should return previous state", () => {
      const initialData = createMockExcelData({ rows: [[1, 2, 3]] });
      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });
      const { result } = renderHook(() => useUndoRedo(initialData));

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell"
        );
      });

      let undoneData: ExcelData | null = null;
      act(() => {
        undoneData = result.current.undo();
      });

      expect(undoneData).not.toBeNull();
      expect(undoneData?.rows).toEqual([[1, 2, 3]]);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("should return null when no history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      let undoneData: ExcelData | null = null;
      act(() => {
        undoneData = result.current.undo();
      });

      expect(undoneData).toBeNull();
    });

    it("should handle multiple undos", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const state1 = createMockExcelData({ rows: [[1, 2, 3]] });
      const state2 = createMockExcelData({ rows: [[4, 5, 6]] });
      const state3 = createMockExcelData({ rows: [[7, 8, 9]] });

      act(() => {
        result.current.pushState(initialData, state1, "EDIT_CELL", "Edit 1");
      });
      
      act(() => {
        result.current.pushState(state1, state2, "EDIT_CELL", "Edit 2");
      });
      
      act(() => {
        result.current.pushState(state2, state3, "EDIT_CELL", "Edit 3");
      });

      let result1: ExcelData | null = null;
      let result2: ExcelData | null = null;

      act(() => {
        result1 = result.current.undo(); // Should return state2
      });
      
      act(() => {
        result2 = result.current.undo(); // Should return state1
      });

      expect(result1?.rows).toEqual([[4, 5, 6]]);
      expect(result2?.rows).toEqual([[1, 2, 3]]);
    });
  });

  describe("redo", () => {
    it("should return next state after undo", () => {
      const initialData = createMockExcelData({ rows: [[1, 2, 3]] });
      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });
      const { result } = renderHook(() => useUndoRedo(initialData));

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell"
        );
      });
      
      act(() => {
        result.current.undo();
      });

      let redoneData: ExcelData | null = null;
      act(() => {
        redoneData = result.current.redo();
      });

      expect(redoneData).not.toBeNull();
      expect(redoneData?.rows).toEqual([[10, 20, 30]]);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });

    it("should return null when no redo history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      let redoneData: ExcelData | null = null;
      act(() => {
        redoneData = result.current.redo();
      });

      expect(redoneData).toBeNull();
    });

    it("should handle multiple redos", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const state1 = createMockExcelData({ rows: [[1, 2, 3]] });
      const state2 = createMockExcelData({ rows: [[4, 5, 6]] });

      act(() => {
        result.current.pushState(initialData, state1, "EDIT_CELL", "Edit 1");
      });
      
      act(() => {
        result.current.pushState(state1, state2, "EDIT_CELL", "Edit 2");
      });
      
      act(() => {
        result.current.undo();
      });
      
      act(() => {
        result.current.undo();
      });

      let result1: ExcelData | null = null;
      let result2: ExcelData | null = null;

      act(() => {
        result1 = result.current.redo(); // Should return state1
      });
      
      act(() => {
        result2 = result.current.redo(); // Should return state2
      });

      expect(result1?.rows).toEqual([[1, 2, 3]]);
      expect(result2?.rows).toEqual([[4, 5, 6]]);
    });
  });

  describe("clearHistory", () => {
    it("should clear all history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell"
        );
      });

      expect(result.current.historyLength).toBe(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.historyLength).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("getCurrentDescription", () => {
    it("should return current action description", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell A1"
        );
      });

      expect(result.current.getCurrentDescription()).toBe("Edit cell A1");
    });

    it("should return null when no history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      expect(result.current.getCurrentDescription()).toBeNull();
    });

    it("should return null after undo to beginning", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell"
        );
      });
      
      act(() => {
        result.current.undo();
      });

      expect(result.current.getCurrentDescription()).toBeNull();
    });
  });

  describe("getNextDescription", () => {
    it("should return next action description after undo", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell A1"
        );
      });
      
      act(() => {
        result.current.undo();
      });

      expect(result.current.getNextDescription()).toBe("Edit cell A1");
    });

    it("should return null when no redo history", () => {
      const initialData = createMockExcelData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      expect(result.current.getNextDescription()).toBeNull();
    });
  });

  describe("data cloning", () => {
    it("should clone data to prevent mutations", () => {
      const initialData = createMockExcelData({ rows: [[1, 2, 3]] });
      const { result } = renderHook(() => useUndoRedo(initialData));

      const modifiedData = createMockExcelData({ rows: [[10, 20, 30]] });

      act(() => {
        result.current.pushState(
          initialData,
          modifiedData,
          "EDIT_CELL",
          "Edit cell"
        );
      });

      // Mutate original data
      initialData.rows[0][0] = 999;
      modifiedData.rows[0][0] = 888;

      // Undo should return cloned data, not mutated
      let undoneData: ExcelData | null = null;
      act(() => {
        undoneData = result.current.undo();
      });

      expect(undoneData?.rows[0][0]).toBe(1);
    });
  });
});
