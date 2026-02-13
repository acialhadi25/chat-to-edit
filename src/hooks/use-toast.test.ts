import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useToast, toast, reducer } from "./use-toast";

describe("useToast", () => {
  beforeEach(() => {
    // Reset toast state before each test
    act(() => {
      toast({ title: "init" }).dismiss();
    });
  });

  describe("reducer", () => {
    it("should add toast to state", () => {
      const initialState = { toasts: [] };
      const newToast = { id: "1", title: "Test", open: true };

      const newState = reducer(initialState, {
        type: "ADD_TOAST",
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(newToast);
    });

    it("should limit toasts to TOAST_LIMIT (1)", () => {
      const initialState = { toasts: [{ id: "1", title: "First", open: true }] };
      const newToast = { id: "2", title: "Second", open: true };

      const newState = reducer(initialState, {
        type: "ADD_TOAST",
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe("2");
    });

    it("should update toast by id", () => {
      const initialState = {
        toasts: [{ id: "1", title: "Old", description: "Desc", open: true }],
      };

      const newState = reducer(initialState, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "New" },
      });

      expect(newState.toasts[0].title).toBe("New");
      expect(newState.toasts[0].description).toBe("Desc");
    });

    it("should dismiss toast by id", () => {
      const initialState = {
        toasts: [{ id: "1", title: "Test", open: true }],
      };

      const newState = reducer(initialState, {
        type: "DISMISS_TOAST",
        toastId: "1",
      });

      expect(newState.toasts[0].open).toBe(false);
    });

    it("should dismiss all toasts when no id provided", () => {
      const initialState = {
        toasts: [
          { id: "1", title: "First", open: true },
          { id: "2", title: "Second", open: true },
        ],
      };

      const newState = reducer(initialState, {
        type: "DISMISS_TOAST",
      });

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    it("should remove toast by id", () => {
      const initialState = {
        toasts: [
          { id: "1", title: "First", open: false },
          { id: "2", title: "Second", open: true },
        ],
      };

      const newState = reducer(initialState, {
        type: "REMOVE_TOAST",
        toastId: "1",
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe("2");
    });

    it("should remove all toasts when no id provided", () => {
      const initialState = {
        toasts: [
          { id: "1", title: "First", open: true },
          { id: "2", title: "Second", open: true },
        ],
      };

      const newState = reducer(initialState, {
        type: "REMOVE_TOAST",
      });

      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe("toast function", () => {
    it("should create toast with generated id", () => {
      const result = toast({ title: "Test message" });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
      expect(result.dismiss).toBeTypeOf("function");
      expect(result.update).toBeTypeOf("function");
    });

    it("should add toast to state", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "Test" });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Test");
      expect(result.current.toasts[0].open).toBe(true);
    });

    it("should support toast with description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: "Title",
          description: "Description text",
        });
      });

      expect(result.current.toasts[0].description).toBe("Description text");
    });

    it("should support toast with action", () => {
      const { result } = renderHook(() => useToast());
      const mockAction = { label: "Undo", onClick: vi.fn() };

      act(() => {
        toast({
          title: "Action toast",
          action: mockAction,
        });
      });

      expect(result.current.toasts[0].action).toEqual(mockAction);
    });

    it("should dismiss toast", () => {
      const { result } = renderHook(() => useToast());

      let toastResult: ReturnType<typeof toast>;
      act(() => {
        toastResult = toast({ title: "To dismiss" });
      });

      act(() => {
        toastResult.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should update toast", () => {
      const { result } = renderHook(() => useToast());

      let toastResult: ReturnType<typeof toast>;
      act(() => {
        toastResult = toast({ title: "Original" });
      });

      act(() => {
        toastResult.update({ id: toastResult.id, title: "Updated", open: true });
      });

      expect(result.current.toasts[0].title).toBe("Updated");
    });
  });

  describe("useToast hook", () => {
    it("should return toasts array", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toBeInstanceOf(Array);
    });

    it("should return toast function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toast).toBeTypeOf("function");
    });

    it("should return dismiss function", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.dismiss).toBeTypeOf("function");
    });

    it("should dismiss specific toast by id", () => {
      const { result } = renderHook(() => useToast());

      let toastResult: ReturnType<typeof toast>;
      act(() => {
        toastResult = toast({ title: "Specific" });
      });

      act(() => {
        result.current.dismiss(toastResult.id);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should dismiss all toasts when no id provided", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "First" });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should subscribe to state changes", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "State test" });
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe("toast lifecycle", () => {
    it("should handle complete toast lifecycle", () => {
      const { result } = renderHook(() => useToast());

      // Create toast
      let toastResult: ReturnType<typeof toast>;
      act(() => {
        toastResult = toast({ title: "Lifecycle" });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(true);

      // Dismiss toast
      act(() => {
        toastResult.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should replace toast when limit reached", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: "First" });
      });

      act(() => {
        toast({ title: "Second" });
      });

      // Should only have the second toast (limit is 1)
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Second");
    });
  });
});
