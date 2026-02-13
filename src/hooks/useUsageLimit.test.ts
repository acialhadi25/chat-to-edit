import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUsageLimit } from "./useUsageLimit";

// Mock useProfile
vi.mock("@/hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));

import { useProfile } from "@/hooks/useProfile";

describe("useUsageLimit", () => {
  describe("with free plan", () => {
    it("should return free plan limits", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "free",
          files_used_this_month: 2,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.maxFiles).toBe(5);
      expect(result.current.usedFiles).toBe(2);
      expect(result.current.remaining).toBe(3);
      expect(result.current.plan).toBe("free");
      expect(result.current.isAtLimit).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("should detect when at limit", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "free",
          files_used_this_month: 5,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.isAtLimit).toBe(true);
      expect(result.current.remaining).toBe(0);
    });

    it("should handle over-limit usage", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "free",
          files_used_this_month: 7,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.isAtLimit).toBe(true);
      expect(result.current.remaining).toBe(0);
    });
  });

  describe("with pro plan", () => {
    it("should return pro plan limits", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "pro",
          files_used_this_month: 10,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.maxFiles).toBe(50);
      expect(result.current.usedFiles).toBe(10);
      expect(result.current.remaining).toBe(40);
      expect(result.current.plan).toBe("pro");
    });

    it("should detect when at pro limit", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "pro",
          files_used_this_month: 50,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.isAtLimit).toBe(true);
      expect(result.current.remaining).toBe(0);
    });
  });

  describe("with no profile", () => {
    it("should default to free plan with 0 usage", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.maxFiles).toBe(5);
      expect(result.current.usedFiles).toBe(0);
      expect(result.current.remaining).toBe(5);
      expect(result.current.plan).toBe("free");
      expect(result.current.isAtLimit).toBe(false);
    });
  });

  describe("while loading", () => {
    it("should indicate loading state", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("checkCanUpload", () => {
    it("should allow upload when under limit", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "free",
          files_used_this_month: 3,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.checkCanUpload()).toEqual({ allowed: true });
    });

    it("should block upload when at limit", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "free",
          files_used_this_month: 5,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      const check = result.current.checkCanUpload();
      expect(check.allowed).toBe(false);
      expect(check.message).toContain("5 files");
      expect(check.message).toContain("Free plan");
    });

    it("should block upload for pro at limit", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "pro",
          files_used_this_month: 50,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      const check = result.current.checkCanUpload();
      expect(check.allowed).toBe(false);
      expect(check.message).toContain("50 files");
      expect(check.message).toContain("Pro plan");
    });

    it("should allow upload while loading", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.checkCanUpload()).toEqual({ allowed: true });
    });

    it("should allow upload with no profile", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.checkCanUpload()).toEqual({ allowed: true });
    });
  });

  describe("edge cases", () => {
    it("should handle unknown plan as free", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "unknown_plan",
          files_used_this_month: 3,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      // Falls back to free plan default (5 files)
      expect(result.current.maxFiles).toBe(5);
    });

    it("should handle negative remaining as 0", () => {
      vi.mocked(useProfile).mockReturnValue({
        profile: {
          plan: "free",
          files_used_this_month: 100,
          email: "test@example.com",
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageLimit());

      expect(result.current.remaining).toBe(0);
    });
  });
});
