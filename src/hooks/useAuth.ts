import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* MOCK AUTH REMOVED - Reverting to original logic */

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (!isMounted) return;

        if (sessionError) {
          console.error("Session fetch error:", sessionError);
          setError(sessionError.message);
        }

        console.log('Session loaded:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id,
        });

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch session";
        console.error("Auth error:", errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', {
        event: _event,
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.access_token,
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to sign out";
      console.error("Sign out error:", errorMsg);
      setError(errorMsg);
    }
  };

  return {
    user,
    session,
    isLoading,
    signOut,
    isAuthenticated: !!user,
    error,
  };
};
