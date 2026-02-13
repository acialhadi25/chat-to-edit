import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChatHistory } from "../useChatHistory";
import { useAuth } from "../useAuth";
import { supabase } from "@/integrations/supabase/client";

// Mock dependencies
vi.mock("../useAuth");
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("useChatHistory", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveChatMessage", () => {
    it("should save user message to database", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
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

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "user", content: "Hello AI" },
        "file-123",
        undefined
      );

      expect(mockFrom).toHaveBeenCalledWith("chat_history");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        role: "user",
        content: "Hello AI",
        file_history_id: "file-123",
        formula: null,
      });
    });

    it("should save assistant message with formula", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
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

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "assistant", content: "Here's the formula" },
        "file-123",
        "=SUM(A1:A10)"
      );

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        role: "assistant",
        content: "Here's the formula",
        file_history_id: "file-123",
        formula: "=SUM(A1:A10)",
      });
    });

    it("should not save when user is not authenticated", async () => {
      const mockInsert = vi.fn();
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
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

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "user", content: "Hello" },
        "file-123"
      );

      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("should handle null fileHistoryId", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
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

      const { result } = renderHook(() => useChatHistory());

      await result.current.saveChatMessage(
        { role: "user", content: "Hello" },
        null
      );

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        role: "user",
        content: "Hello",
        file_history_id: null,
        formula: null,
      });
    });
  });

  describe("loadChatHistory", () => {
    it("should load chat history for a file", async () => {
      const mockChatData = [
        {
          id: "chat-1",
          role: "user",
          content: "Hello",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat-2",
          role: "assistant",
          content: "Hi there!",
          created_at: "2024-01-01T00:01:00Z",
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockChatData,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const { result } = renderHook(() => useChatHistory());

      const messages = await result.current.loadChatHistory("file-123");

      expect(mockFrom).toHaveBeenCalledWith("chat_history");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq1).toHaveBeenCalledWith("file_history_id", "file-123");
      expect(mockEq2).toHaveBeenCalledWith("user_id", "test-user-id");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        id: "chat-1",
        role: "user",
        content: "Hello",
        timestamp: new Date("2024-01-01T00:00:00Z"),
      });
      expect(messages[1]).toEqual({
        id: "chat-2",
        role: "assistant",
        content: "Hi there!",
        timestamp: new Date("2024-01-01T00:01:00Z"),
      });
    });

    it("should return empty array when user is not authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signOut: vi.fn(),
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      const messages = await result.current.loadChatHistory("file-123");

      expect(messages).toEqual([]);
    });

    it("should return empty array on database error", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const { result } = renderHook(() => useChatHistory());

      const messages = await result.current.loadChatHistory("file-123");

      expect(messages).toEqual([]);
    });

    it("should return empty array when no data", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const { result } = renderHook(() => useChatHistory());

      const messages = await result.current.loadChatHistory("file-123");

      expect(messages).toEqual([]);
    });

    it("should handle empty chat history", async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const { result } = renderHook(() => useChatHistory());

      const messages = await result.current.loadChatHistory("file-123");

      expect(messages).toEqual([]);
    });
  });

  describe("message format", () => {
    it("should correctly map database fields to message format", async () => {
      const mockChatData = [
        {
          id: "msg-1",
          role: "user",
          content: "Test message",
          created_at: "2024-01-15T10:30:00Z",
          formula: null,
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockChatData,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const { result } = renderHook(() => useChatHistory());

      const messages = await result.current.loadChatHistory("file-123");

      expect(messages[0].id).toBe("msg-1");
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("Test message");
      expect(messages[0].timestamp).toBeInstanceOf(Date);
      expect(messages[0].timestamp.toISOString()).toBe("2024-01-15T10:30:00.000Z");
    });
  });
});
