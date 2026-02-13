import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFileHistory } from "./useFileHistory";
import { supabase } from "@/integrations/supabase/client";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

describe("useFileHistory", () => {
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

  describe("saveFileRecord", () => {
    it("should save file record successfully", async () => {
      const mockFileRecord = {
        id: "file-123",
        user_id: mockUser.id,
        file_name: "test.xlsx",
        rows_count: 100,
        sheets_count: 1,
        formulas_applied: 0,
      };

      // Mock supabase chain
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFileRecord,
        error: null,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
        single: mockSingle,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useFileHistory());

      const saved = await result.current.saveFileRecord("test.xlsx", 100, 1);

      expect(saved).toEqual(mockFileRecord);
      expect(supabase.from).toHaveBeenCalledWith("file_history");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        file_name: "test.xlsx",
        rows_count: 100,
        sheets_count: 1,
        formulas_applied: 0,
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

      const { result } = renderHook(() => useFileHistory());

      const saved = await result.current.saveFileRecord("test.xlsx", 100, 1);

      expect(saved).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should handle database insert error", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
        single: mockSingle,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFileHistory());

      const saved = await result.current.saveFileRecord("test.xlsx", 100, 1);

      expect(saved).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to save file history:", { message: "Insert failed" });

      consoleSpy.mockRestore();
    });

    it("should not fail when RPC call fails", async () => {
      const mockFileRecord = {
        id: "file-123",
        user_id: mockUser.id,
        file_name: "test.xlsx",
        rows_count: 100,
        sheets_count: 1,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFileRecord,
        error: null,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
        single: mockSingle,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // RPC fails but insert succeeds
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        error: { message: "RPC failed" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFileHistory());

      const saved = await result.current.saveFileRecord("test.xlsx", 100, 1);

      // Should still return data even if RPC failed
      expect(saved).toEqual(mockFileRecord);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to increment usage:", { message: "RPC failed" });

      consoleSpy.mockRestore();
    });

    it("should call increment_files_used_this_month RPC with correct params", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "file-123" },
        error: null,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
        single: mockSingle,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useFileHistory());

      await result.current.saveFileRecord("test.xlsx", 100, 1);

      expect(supabase.rpc).toHaveBeenCalledWith("increment_files_used_this_month", {
        p_user_id: mockUser.id,
      });
    });
  });

  describe("getMonthlyUsage", () => {
    it("should return monthly usage count", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: 5,
        error: null,
      });

      const { result } = renderHook(() => useFileHistory());

      const usage = await result.current.getMonthlyUsage();

      expect(usage).toBe(5);
      expect(supabase.rpc).toHaveBeenCalledWith("get_monthly_usage", {
        p_user_id: mockUser.id,
      });
    });

    it("should return 0 when user is not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useFileHistory());

      const usage = await result.current.getMonthlyUsage();

      expect(usage).toBe(0);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it("should handle RPC error gracefully", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: "RPC error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFileHistory());

      const usage = await result.current.getMonthlyUsage();

      expect(usage).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get monthly usage:", { message: "RPC error" });

      consoleSpy.mockRestore();
    });

    it("should return 0 when data is null", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useFileHistory());

      const usage = await result.current.getMonthlyUsage();

      expect(usage).toBe(0);
    });
  });

  describe("updateFormulasCount", () => {
    it("should update formulas count successfully", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useFileHistory());

      await result.current.updateFormulasCount("file-123", 10);

      expect(supabase.from).toHaveBeenCalledWith("file_history");
      expect(mockUpdate).toHaveBeenCalledWith({ formulas_applied: 10 });
      expect(mockEq).toHaveBeenCalledWith("id", "file-123");
    });

    it("should handle update error gracefully", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: "Update failed" } });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFileHistory());

      await result.current.updateFormulasCount("file-123", 10);

      expect(consoleSpy).toHaveBeenCalledWith("Failed to update formulas count:", { message: "Update failed" });

      consoleSpy.mockRestore();
    });

    it("should work without user authentication", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useFileHistory());

      // Should not throw even without user
      await expect(result.current.updateFormulasCount("file-123", 10)).resolves.not.toThrow();
    });
  });
});
