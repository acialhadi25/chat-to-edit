import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session, AuthError, Subscription } from "@supabase/supabase-js";

describe("useAuth", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: { name: "Test User" },
  } as unknown as User;

  const mockSession = {
    access_token: "test-token",
    refresh_token: "test-refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: mockUser,
  } as Session;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with loading state", () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should start with no error", () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBeNull();
    });
  });

  describe("session fetching", () => {
    it("should set user and session when session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should handle null session (not logged in)", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle session fetch error", async () => {
      const mockError = { message: "Network error" } as unknown as AuthError;
      vi.mocked(supabase.auth.getSession).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook catches error and provides fallback message
      expect(result.current.error).toBe("Failed to fetch session");
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle supabase error response", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Auth error" } as AuthError,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Auth error");
    });
  });

  describe("auth state changes", () => {
    it("should update user when auth state changes to signed in", async () => {
      let authStateCallback: Parameters<typeof supabase.auth.onAuthStateChange>[0] | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } as unknown as Subscription } };
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate auth state change
      authStateCallback?.("SIGNED_IN" as any, mockSession);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it("should clear user when auth state changes to signed out", async () => {
      let authStateCallback: Parameters<typeof supabase.auth.onAuthStateChange>[0] | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } as unknown as Subscription } };
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Simulate sign out
      authStateCallback?.("SIGNED_OUT" as any, null);

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it("should clear error on successful auth state change", async () => {
      let authStateCallback: Parameters<typeof supabase.auth.onAuthStateChange>[0] | null = null;

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Initial error" } as AuthError,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } as unknown as Subscription } };
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.error).toBe("Initial error");
      });

      authStateCallback?.("SIGNED_IN", mockSession);

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("signOut", () => {
    it("should call supabase signOut", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await result.current.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle signOut error", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(new Error("Sign out failed"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await result.current.signOut();

      await waitFor(() => {
        expect(result.current.error).toBe("Sign out failed");
      });
    });

    it("should clear error before signOut", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Previous error" } as unknown as AuthError,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.error).toBe("Previous error");
      });

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

      await act(async () => {
        await result.current.signOut();
      });

      // Error should be cleared at start of signOut
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("cleanup", () => {
    it("should unsubscribe from auth state changes on unmount", async () => {
      const unsubscribeMock = vi.fn();

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValueOnce({
        data: { subscription: { unsubscribe: unsubscribeMock } as unknown as Subscription },
      });

      const { unmount } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe("isAuthenticated computed property", () => {
    it("should return true when user exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it("should return false when user is null", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });
});
