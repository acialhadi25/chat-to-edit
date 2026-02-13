import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useChatHistory } from "./useChatHistory";
import { supabase } from "@/integrations/supabase/client";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

describe("useChatHistory", () => {
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

  describe("saveChatMessage", () => {
    it("should save chat message successfully", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "user", content: "Hello AI" },
        "file-123",
        "=SUM(A1:A10)"
      );

      expect(supabase.from).toHaveBeenCalledWith("chat_history");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        role: "user",
        content: "Hello AI",
        file_history_id: "file-123",
        formula: "=SUM(A1:A10)",
      });
    });

    it("should save message without formula", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "assistant", content: "Here's your data" },
        "file-123"
      );

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        role: "assistant",
        content: "Here's your data",
        file_history_id: "file-123",
        formula: null,
      });
    });

    it("should handle null fileHistoryId", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "user", content: "Test" },
        null
      );

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        role: "user",
        content: "Test",
        file_history_id: null,
        formula: null,
      });
    });

    it("should not save when user is not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "user", content: "Test" },
        "file-123"
      );

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("loadChatHistory", () => {
    it("should load chat history successfully", async () => {
      const mockData = [
        {
          id: "msg-1",
          role: "user",
          content: "Hello",
          created_at: "2024-01-01T10:00:00Z",
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "Hi there",
          created_at: "2024-01-01T10:01:00Z",
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      const history = await result.current.loadChatHistory("file-123");

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        id: "msg-1",
        role: "user",
        content: "Hello",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      });
      expect(history[1]).toEqual({
        id: "msg-2",
        role: "assistant",
        content: "Hi there",
        timestamp: new Date("2024-01-01T10:01:00Z"),
      });
    });

    it("should return empty array when user not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      const history = await result.current.loadChatHistory("file-123");

      expect(history).toEqual([]);
    });

    it("should return empty array on database error", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      const history = await result.current.loadChatHistory("file-123");

      expect(history).toEqual([]);
    });

    it("should return empty array when no data", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      const history = await result.current.loadChatHistory("file-123");

      expect(history).toEqual([]);
    });

    it("should query with correct filters", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      await result.current.loadChatHistory("file-456");

      expect(supabase.from).toHaveBeenCalledWith("chat_history");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq1).toHaveBeenCalledWith("file_history_id", "file-456");
      expect(mockEq2).toHaveBeenCalledWith("user_id", mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
    });

    it("should handle empty data array", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { result } = renderHook(() => useChatHistory());

      const history = await result.current.loadChatHistory("file-123");

      expect(history).toEqual([]);
    });
  });
});
