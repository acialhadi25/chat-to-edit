import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFileHistory } from "../useFileHistory";
import { useAuth } from "../useAuth";
import { supabase } from "@/integrations/supabase/client";

// Mock dependencies
vi.mock("../useAuth");
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("useFileHistory", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("saveFileRecord", () => {
    it("should save file record to database", async () => {
      const mockFileData = {
        id: "file-123",
        user_id: "test-user-id",
        file_name: "test.xlsx",
        rows_count: 100,
        sheets_count: 2,
        formulas_applied: 0,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFileData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Mock profile update chain
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { files_used_this_month: 5 },
        error: null,
      });

      const mockProfileEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const mockProfileSelect = vi.fn().mockReturnValue({
        eq: mockProfileEq,
      });

      const mockProfileUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as any,
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signOut: vi.fn(),
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(((table: string) => {
        if (table === "file_history") {
          return { insert: mockInsert };
        }
        if (table === "profiles") {
          return {
            select: mockProfileSelect,
            update: mockProfileUpdate,
          };
        }
      }) as any);

      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useFileHistory());

      const fileRecord = await result.current.saveFileRecord(
        "test.xlsx",
        100,
        2
      );

      expect(supabase.from).toHaveBeenCalledWith("file_history");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        file_name: "test.xlsx",
        rows_count: 100,
        sheets_count: 2,
        formulas_applied: 0,
      });
      expect(fileRecord).toEqual(mockFileData);
    });

    it("should return null when user is not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signOut: vi.fn(),
        error: null,
      });

      const { result } = renderHook(() => useFileHistory());

      const fileRecord = await result.current.saveFileRecord(
        "test.xlsx",
        100,
        2
      );

      expect(fileRecord).toBeNull();
    });

    it("should return null on database error", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as any,
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signOut: vi.fn(),
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useFileHistory());

      const fileRecord = await result.current.saveFileRecord(
        "test.xlsx",
        100,
        2
      );

      expect(fileRecord).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Failed to save file history:",
        { message: "Database error" }
      );
    });

    it("should handle file with zero rows", async () => {
      const mockFileData = {
        id: "file-123",
        user_id: "test-user-id",
        file_name: "empty.xlsx",
        rows_count: 0,
        sheets_count: 1,
        formulas_applied: 0,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFileData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { files_used_this_month: 0 },
        error: null,
      });

      const mockProfileEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const mockProfileSelect = vi.fn().mockReturnValue({
        eq: mockProfileEq,
      });

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as any,
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signOut: vi.fn(),
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(((table: string) => {
        if (table === "file_history") {
          return { insert: mockInsert };
        }
        if (table === "profiles") {
          return {
            select: mockProfileSelect,
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
      }) as any);

      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useFileHistory());

      const fileRecord = await result.current.saveFileRecord("empty.xlsx", 0, 1);

      expect(fileRecord).toEqual(mockFileData);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        file_name: "empty.xlsx",
        rows_count: 0,
        sheets_count: 1,
        formulas_applied: 0,
      });
    });

    it("should handle file with multiple sheets", async () => {
      const mockFileData = {
        id: "file-123",
        user_id: "test-user-id",
        file_name: "multi-sheet.xlsx",
        rows_count: 500,
        sheets_count: 5,
        formulas_applied: 0,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFileData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { files_used_this_month: 10 },
        error: null,
      });

      const mockProfileEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const mockProfileSelect = vi.fn().mockReturnValue({
        eq: mockProfileEq,
      });

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as any,
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signOut: vi.fn(),
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(((table: string) => {
        if (table === "file_history") {
          return { insert: mockInsert };
        }
        if (table === "profiles") {
          return {
            select: mockProfileSelect,
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
      }) as any);

      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useFileHistory());

      const fileRecord = await result.current.saveFileRecord(
        "multi-sheet.xlsx",
        500,
        5
      );

      expect(fileRecord).toEqual(mockFileData);
    });
  });

  describe("updateFormulasCount", () => {
    it("should update formulas count for a file", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useFileHistory());

      await result.current.updateFormulasCount("file-123", 5);

      expect(mockFrom).toHaveBeenCalledWith("file_history");
      expect(mockUpdate).toHaveBeenCalledWith({ formulas_applied: 5 });
      expect(mockEq).toHaveBeenCalledWith("id", "file-123");
    });

    it("should handle zero formulas", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useFileHistory());

      await result.current.updateFormulasCount("file-123", 0);

      expect(mockUpdate).toHaveBeenCalledWith({ formulas_applied: 0 });
    });

    it("should handle large formula counts", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useFileHistory());

      await result.current.updateFormulasCount("file-123", 1000);

      expect(mockUpdate).toHaveBeenCalledWith({ formulas_applied: 1000 });
    });

    it("should work independently of user authentication", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signOut: vi.fn(),
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useFileHistory());

      await result.current.updateFormulasCount("file-123", 3);

      expect(mockUpdate).toHaveBeenCalledWith({ formulas_applied: 3 });
    });
  });
});
