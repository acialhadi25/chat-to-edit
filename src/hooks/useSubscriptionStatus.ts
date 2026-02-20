import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscriptionInfo, getUserCreditUsage } from '@/lib/subscription';

interface SubscriptionStatus {
  tierName: string;
  tierDisplayName: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  status: string;
}

interface UseSubscriptionStatusReturn {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubscriptionStatus = (): UseSubscriptionStatusReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch subscription info and credit usage in parallel
      const [subInfo, creditUsage] = await Promise.all([
        getUserSubscriptionInfo(user.id),
        getUserCreditUsage(user.id),
      ]);

      setSubscription({
        tierName: subInfo.tier_name,
        tierDisplayName: subInfo.tier_display_name,
        creditsUsed: creditUsage.credits_used,
        creditsLimit: creditUsage.credits_limit,
        creditsRemaining: creditUsage.credits_remaining,
        status: subInfo.status,
      });
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      
      // Fallback to free tier
      setSubscription({
        tierName: 'free',
        tierDisplayName: 'Free',
        creditsUsed: 0,
        creditsLimit: 50,
        creditsRemaining: 50,
        status: 'none',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user?.id]);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscriptionStatus,
  };
};
