import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  subscription_tier: string;
  credits_remaining: number;
  email: string | null;
}

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export const useProfile = (): UseProfileReturn => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setError(null);

        // First, try to fetch the profile
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('subscription_tier, credits_remaining, email')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (queryError) {
          // Improved error logging for debugging
          const errorCode = (queryError as { code?: string })?.code || 'UNKNOWN';
          const errorMessage = (queryError as { message?: string })?.message || 'Unknown error';
          const errorStatus = (queryError as { status?: number })?.status || 'UNKNOWN';

          console.error('Profile fetch error:', {
            code: errorCode,
            status: errorStatus,
            message: errorMessage,
            fullError: queryError,
          });

          // Check if it's a 404 (not found) - this is expected if profile doesn't exist
          if (errorStatus === 404 || errorCode === 'PGRST116') {
            console.info('Profile not found, using defaults for user:', user.id);
          }

          setError(null); // Don't show error to user - this is expected

          // Always provide default profile as fallback
          setProfile({
            subscription_tier: 'free',
            credits_remaining: 100,
            email: user.email || null,
          });
        } else if (data) {
          // Profile found, use it
          setProfile(data as Profile);
        } else {
          // No profile exists yet (maybeSingle returns null if no rows)
          // This is expected - use defaults
          console.info('No profile found for user, using defaults');
          setProfile({
            subscription_tier: 'free',
            credits_remaining: 100,
            email: user.email || null,
          });
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Profile fetch exception:', errorMsg, err);

        // Don't show error to user - just use defaults
        setError(null);
        setProfile({
          subscription_tier: 'free',
          credits_remaining: 100,
          email: user.email || null,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    // Subscribe to realtime updates (optional - don't fail if it doesn't work)
    try {
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (isMounted) {
              setProfile(payload.new as Profile);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription failed:', err);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { profile, isLoading, error };
};
