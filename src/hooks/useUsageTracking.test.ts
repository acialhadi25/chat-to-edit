import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUsageTracking, type UsageEventType, type UsageMetadata } from "./useUsageTracking";
import { supabase } from "@/integrations/supabase/client";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

describe("useUsageTracking", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      session: null,
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: true,
      error: null,
    });
  });

  describe("logUsageEvent", () => {
    it("should log usage event successfully", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "logged",
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const logged = await result.current.logUsageEvent("file_upload", {
        fileName: "test.xlsx",
        rowsCount: 100,
      });

      expect(logged).toBe("logged");
      expect(supabase.rpc).toHaveBeenCalledWith("log_usage_event", {
        p_user_id: mockUser.id,
        p_event_type: "file_upload",
        p_metadata: {
          fileName: "test.xlsx",
          rowsCount: 100,
        },
      });
    });

    it("should return null when user is not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageTracking());

      const logged = await result.current.logUsageEvent("file_upload");

      expect(logged).toBeNull();
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it("should handle RPC error gracefully", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: "RPC failed" },
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useUsageTracking());

      const logged = await result.current.logUsageEvent("ai_request");

      expect(logged).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to log usage event:", { message: "RPC failed" });

      consoleSpy.mockRestore();
    });

    it("should handle exception gracefully", async () => {
      vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useUsageTracking());

      const logged = await result.current.logUsageEvent("action_applied");

      expect(logged).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error logging usage event:", expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("should support all event types", async () => {
      const eventTypes: UsageEventType[] = [
        "file_upload",
        "ai_request",
        "action_applied",
        "formula_generated",
        "export_download",
      ];

      const { result } = renderHook(() => useUsageTracking());

      for (const eventType of eventTypes) {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: "logged",
          error: null,
        } as any);

        await result.current.logUsageEvent(eventType);

        expect(supabase.rpc).toHaveBeenCalledWith(
          "log_usage_event",
          expect.objectContaining({
            p_user_id: mockUser.id,
            p_event_type: eventType,
          })
        );
      }
    });
  });

  describe("getMonthlyUsage", () => {
    it("should return monthly usage summary", async () => {
      const mockSummary = {
        files_uploaded: 5,
        ai_requests: 10,
        actions_applied: 3,
        formulas_generated: 8,
        exports_downloaded: 2,
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [mockSummary],
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const summary = await result.current.getMonthlyUsage();

      expect(summary).toEqual(mockSummary);
      expect(supabase.rpc).toHaveBeenCalledWith("get_monthly_usage_summary", {
        p_user_id: mockUser.id,
      });
    });

    it("should return null when user not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageTracking());

      const summary = await result.current.getMonthlyUsage();

      expect(summary).toBeNull();
    });

    it("should handle RPC error", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: "Failed" },
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useUsageTracking());

      const summary = await result.current.getMonthlyUsage();

      expect(summary).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get monthly usage:", { message: "Failed" });

      consoleSpy.mockRestore();
    });

    it("should return first item from array response", async () => {
      const mockData = { files_uploaded: 1 };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [mockData, { files_uploaded: 2 }],
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const summary = await result.current.getMonthlyUsage();

      expect(summary).toEqual(mockData);
    });

    it("should return null for empty response", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const summary = await result.current.getMonthlyUsage();

      expect(summary).toBeNull();
    });
  });

  describe("checkQuota", () => {
    it("should return true when quota available", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const hasQuota = await result.current.checkQuota("ai_request");

      expect(hasQuota).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith("check_usage_quota", {
        p_user_id: mockUser.id,
        p_quota_type: "ai_request",
      });
    });

    it("should return false when quota exceeded", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const hasQuota = await result.current.checkQuota("file_upload");

      expect(hasQuota).toBe(false);
    });

    it("should return false when user not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageTracking());

      const hasQuota = await result.current.checkQuota("ai_request");

      expect(hasQuota).toBe(false);
    });

    it("should handle RPC error and return false", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useUsageTracking());

      const hasQuota = await result.current.checkQuota("ai_request");

      expect(hasQuota).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getUserQuota", () => {
    it("should return user quota from profile", async () => {
      const mockQuota = {
        monthly_ai_requests_quota: 100,
        monthly_files_quota: 50,
        plan_expires_at: "2024-12-31",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockQuota,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      const quota = await result.current.getUserQuota();

      expect(quota).toEqual(mockQuota);
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("monthly_ai_requests_quota, monthly_files_quota, plan_expires_at");
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUser.id);
    });

    it("should return null when user not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useUsageTracking());

      const quota = await result.current.getUserQuota();

      expect(quota).toBeNull();
    });

    it("should handle database error", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useUsageTracking());

      const quota = await result.current.getUserQuota();

      expect(quota).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get user quota:", { message: "DB error" });

      consoleSpy.mockRestore();
    });
  });

  describe("convenience methods", () => {
    it("logFileUpload should call logUsageEvent with correct params", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "logged",
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      await result.current.logFileUpload("data.xlsx", 100, 1);

      expect(supabase.rpc).toHaveBeenCalledWith("log_usage_event", {
        p_user_id: mockUser.id,
        p_event_type: "file_upload",
        p_metadata: {
          fileName: "data.xlsx",
          rowsCount: 100,
          sheetsCount: 1,
        },
      });
    });

    it("logAIRequest should call logUsageEvent with action type", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "logged",
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      await result.current.logAIRequest("INSERT_FORMULA");

      expect(supabase.rpc).toHaveBeenCalledWith(
        "log_usage_event",
        expect.objectContaining({
          p_user_id: mockUser.id,
          p_event_type: "ai_request",
          p_metadata: expect.objectContaining({
            actionType: "INSERT_FORMULA",
            timestamp: expect.any(String),
          }),
        })
      );
    });

    it("logActionApplied should call logUsageEvent with action details", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "logged",
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      await result.current.logActionApplied("EDIT_CELL", 5);

      expect(supabase.rpc).toHaveBeenCalledWith("log_usage_event", {
        p_user_id: mockUser.id,
        p_event_type: "action_applied",
        p_metadata: {
          actionType: "EDIT_CELL",
          affectedRows: 5,
        },
      });
    });

    it("logFormulaGenerated should call logUsageEvent with count", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "logged",
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      await result.current.logFormulaGenerated(3);

      expect(supabase.rpc).toHaveBeenCalledWith("log_usage_event", {
        p_user_id: mockUser.id,
        p_event_type: "formula_generated",
        p_metadata: {
          formulaCount: 3,
        },
      });
    });

    it("logExportDownload should call logUsageEvent with file name", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "logged",
        error: null,
      } as any);

      const { result } = renderHook(() => useUsageTracking());

      await result.current.logExportDownload("export.xlsx");

      expect(supabase.rpc).toHaveBeenCalledWith("log_usage_event", {
        p_user_id: mockUser.id,
        p_event_type: "export_download",
        p_metadata: {
          fileName: "export.xlsx",
        },
      });
    });
  });
});
