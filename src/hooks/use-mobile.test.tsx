import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;
  let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

  beforeEach(() => {
    addEventListenerMock = vi.fn((event, callback) => {
      if (event === "change") {
        mediaQueryCallback = callback;
      }
    });
    removeEventListenerMock = vi.fn();

    matchMediaMock = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });

    // Default window size (desktop)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return false for desktop viewport", () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("should return true for mobile viewport", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("should return true at breakpoint (767px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("should return false at breakpoint (768px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("should subscribe to media query changes", () => {
    renderHook(() => useIsMobile());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
    expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should update when media query changes", () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate window resize to mobile
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 375,
    });

    act(() => {
      mediaQueryCallback?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  it("should update when window resizes back to desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);

    // Simulate window resize to desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    act(() => {
      mediaQueryCallback?.({ matches: false } as MediaQueryListEvent);
    });

    expect(result.current).toBe(false);
  });

  it("should cleanup event listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should handle undefined initial state", () => {
    const { result } = renderHook(() => useIsMobile());

    // Before effect runs, it should be undefined, but after render it will be boolean
    expect(typeof result.current).toBe("boolean");
  });

  it("should use correct breakpoint constant", () => {
    renderHook(() => useIsMobile());

    // Verify it uses 768 - 1 = 767 as breakpoint
    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
  });
});
