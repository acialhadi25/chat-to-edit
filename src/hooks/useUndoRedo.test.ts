import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "./useUndoRedo";
import { excelDataFactory } from "@/test/factories/excel";

describe("useUndoRedo", () => {
  const createTestData = () => excelDataFactory.create();

  describe("initial state", () => {
    it("should start with empty history", () => {
      const initialData = createTestData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      expect(result.current.historyLength).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("should return null descriptions initially", () => {
      const initialData = createTestData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      expect(result.current.getCurrentDescription()).toBeNull();
      expect(result.current.getNextDescription()).toBeNull();
    });
  });

  describe("pushState", () => {
    it("should add entry to history", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit cell A1");
      });

      expect(result.current.historyLength).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("should store correct description", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit cell A1");
      });

      expect(result.current.getCurrentDescription()).toBe("Edit cell A1");
    });

    it("should clear redo history when pushing new state", () => {
      const before = createTestData();
      const after1 = createTestData();
      const after2 = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      // Push first state
      act(() => {
        result.current.pushState(before, after1, "EDIT_CELL", "First edit");
      });

      // Undo to enable redo
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Push new state - should clear redo
      act(() => {
        result.current.pushState(before, after2, "EDIT_CELL", "Second edit");
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.historyLength).toBe(1);
    });

    it("should enforce MAX_HISTORY limit (50 entries)", () => {
      const before = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      // Add 55 entries
      for (let i = 0; i < 55; i++) {
        const after = createTestData();
        act(() => {
          result.current.pushState(before, after, "EDIT_CELL", `Edit ${i}`);
        });
      }

      expect(result.current.historyLength).toBe(50);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe("undo", () => {
    it("should return null when nothing to undo", () => {
      const initialData = createTestData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      let undoResult: ReturnType<typeof result.current.undo>;
      act(() => {
        undoResult = result.current.undo();
      });

      expect(undoResult!).toBeNull();
    });

    it("should return previous state on undo", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit A1");
      });

      let undoResult: ReturnType<typeof result.current.undo>;
      act(() => {
        undoResult = result.current.undo();
      });

      expect(undoResult!).toBeDefined();
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("should move current index back on undo", () => {
      const before = createTestData();
      const after1 = createTestData();
      const after2 = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after1, "EDIT_CELL", "First");
      });
      act(() => {
        result.current.pushState(after1, after2, "EDIT_CELL", "Second");
      });

      // Wait for state to settle
      expect(result.current.getCurrentDescription()).toBe("Second");

      act(() => {
        result.current.undo();
      });

      expect(result.current.getCurrentDescription()).toBe("First");
    });
  });

  describe("redo", () => {
    it("should return null when nothing to redo", () => {
      const initialData = createTestData();
      const { result } = renderHook(() => useUndoRedo(initialData));

      let redoResult: ReturnType<typeof result.current.redo>;
      act(() => {
        redoResult = result.current.redo();
      });

      expect(redoResult!).toBeNull();
    });

    it("should return next state on redo", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit A1");
        result.current.undo();
      });

      let redoResult: ReturnType<typeof result.current.redo>;
      act(() => {
        redoResult = result.current.redo();
      });

      expect(redoResult!).toBeDefined();
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("should move current index forward on redo", () => {
      const before = createTestData();
      const after1 = createTestData();
      const after2 = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after1, "EDIT_CELL", "First");
      });
      act(() => {
        result.current.pushState(after1, after2, "EDIT_CELL", "Second");
      });

      // Undo twice
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.getCurrentDescription()).toBeNull();

      act(() => {
        result.current.redo();
      });

      expect(result.current.getCurrentDescription()).toBe("First");
    });
  });

  describe("clearHistory", () => {
    it("should clear all history", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit");
        result.current.clearHistory();
      });

      expect(result.current.historyLength).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("should reset current index", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit");
        result.current.undo();
        result.current.clearHistory();
      });

      expect(result.current.getCurrentDescription()).toBeNull();
      expect(result.current.getNextDescription()).toBeNull();
    });
  });

  describe("getNextDescription", () => {
    it("should return next action description", () => {
      const before = createTestData();
      const after1 = createTestData();
      const after2 = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after1, "EDIT_CELL", "First");
      });
      act(() => {
        result.current.pushState(after1, after2, "EDIT_CELL", "Second");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.getNextDescription()).toBe("Second");
    });

    it("should return null when no redo available", () => {
      const before = createTestData();
      const after = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Edit");
      });

      expect(result.current.getNextDescription()).toBeNull();
    });
  });

  describe("complex undo/redo sequences", () => {
    it("should handle multiple undo/redo operations", () => {
      const states = Array.from({ length: 5 }, () => createTestData());
      const { result } = renderHook(() => useUndoRedo(states[0]));

      // Push 4 states - each in separate act()
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.pushState(states[i], states[i + 1], "EDIT_CELL", `Edit ${i + 1}`);
        });
      }

      expect(result.current.historyLength).toBe(4);

      // Undo 2 steps
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.getCurrentDescription()).toBe("Edit 2");
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      // Redo 1 step
      act(() => {
        result.current.redo();
      });

      expect(result.current.getCurrentDescription()).toBe("Edit 3");
    });

    it("should maintain data integrity through undo/redo", () => {
      const before = createTestData();
      const after = createTestData();
      after.rows[0][0] = "MODIFIED";

      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after, "EDIT_CELL", "Modify A1");
      });

      let undoneData: ReturnType<typeof result.current.undo>;
      act(() => {
        undoneData = result.current.undo();
      });

      expect(undoneData!.rows[0][0]).toBe(before.rows[0][0]);
    });
  });

  describe("action type tracking", () => {
    it("should track different action types", () => {
      const before = createTestData();
      const after1 = createTestData();
      const after2 = createTestData();
      const { result } = renderHook(() => useUndoRedo(before));

      act(() => {
        result.current.pushState(before, after1, "INSERT_FORMULA", "Add formula");
      });
      act(() => {
        result.current.pushState(after1, after2, "DELETE_COLUMN", "Remove col");
      });

      expect(result.current.historyLength).toBe(2);
      expect(result.current.canUndo).toBe(true);
    });
  });
});
