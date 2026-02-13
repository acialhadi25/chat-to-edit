import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProfile } from "./useProfile";
import { supabase } from "@/integrations/supabase/client";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";

describe("useProfile", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with loading state", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const { result } = renderHook(() => useProfile());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should reset profile when user is null", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: false,
        error: null,
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("profile fetching", () => {
    it("should fetch and set profile successfully", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      const mockProfile = {
        plan: "pro",
        files_used_this_month: 5,
        email: "test@example.com",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Mock realtime subscription
      vi.mocked(supabase.channel).mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      } as any);
      vi.mocked(supabase.removeChannel).mockImplementation(() => {});

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
    });

    it("should use default profile when no profile exists", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual({
        plan: "free",
        files_used_this_month: 0,
        email: "test@example.com",
      });

      consoleSpy.mockRestore();
    });

    it("should handle query error gracefully", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      const mockError = {
        code: "PGRST116",
        message: "Not found",
        status: 404,
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use default profile, not show error
      expect(result.current.error).toBeNull();
      expect(result.current.profile).toEqual({
        plan: "free",
        files_used_this_month: 0,
        email: "test@example.com",
      });

      consoleSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it("should handle exception gracefully", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("Connection failed");
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use default profile
      expect(result.current.error).toBeNull();
      expect(result.current.profile).toEqual({
        plan: "free",
        files_used_this_month: 0,
        email: "test@example.com",
      });

      consoleSpy.mockRestore();
    });
  });

  describe("realtime updates", () => {
    it("should subscribe to realtime updates", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      const subscribeMock = vi.fn();
      const onMock = vi.fn().mockReturnThis();

      vi.mocked(supabase.channel).mockReturnValue({
        on: onMock,
        subscribe: subscribeMock,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      renderHook(() => useProfile());

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith("profile-changes");
      });

      expect(onMock).toHaveBeenCalled();
      expect(subscribeMock).toHaveBeenCalled();
    });

    it("should update profile on realtime event", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      let realtimeCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null;

      const subscribeMock = vi.fn();
      const onMock = vi.fn().mockImplementation((event, config, callback) => {
        realtimeCallback = callback;
        return { on: onMock, subscribe: subscribeMock };
      });

      vi.mocked(supabase.channel).mockReturnValue({
        on: onMock,
        subscribe: subscribeMock,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate realtime update
      realtimeCallback?.({
        new: {
          plan: "enterprise",
          files_used_this_month: 10,
          email: "updated@example.com",
        },
      });

      await waitFor(() => {
        expect(result.current.profile?.plan).toBe("enterprise");
      });
    });

    it("should handle realtime subscription failure gracefully", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      vi.mocked(supabase.channel).mockImplementation(() => {
        throw new Error("Subscription failed");
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.current.profile).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe("cleanup", () => {
    it("should remove channel on unmount", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
        isAuthenticated: true,
        error: null,
      });

      const removeChannelMock = vi.fn();
      
      vi.mocked(supabase.removeChannel).mockImplementation(removeChannelMock);
      vi.mocked(supabase.channel).mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const { unmount } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalled();
      });

      unmount();

      expect(removeChannelMock).toHaveBeenCalled();
    });
  });
});
