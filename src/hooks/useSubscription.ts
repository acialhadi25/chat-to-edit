import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getSubscriptionTiers,
  getUserSubscription,
  getUserSubscriptionInfo,
  getUserCreditUsage,
  checkUsageLimit,
  trackUsage,
  cancelSubscription,
  reactivateSubscription,
} from '@/lib/subscription';
import type { SubscriptionTier, UserSubscriptionInfo } from '@/types/subscription';
import type { UserCreditUsage, CreditAction } from '@/types/credits';

export function useSubscriptionTiers() {
  return useQuery<SubscriptionTier[]>({
    queryKey: ['subscription-tiers'],
    queryFn: getSubscriptionTiers,
  });
}

export function useUserSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: () => (user?.id ? getUserSubscription(user.id) : null),
    enabled: !!user?.id,
  });
}

export function useUserSubscriptionInfo() {
  const { user } = useAuth();

  return useQuery<UserSubscriptionInfo>({
    queryKey: ['user-subscription-info', user?.id],
    queryFn: () => getUserSubscriptionInfo(user!.id),
    enabled: !!user?.id,
  });
}

export function useUserCreditUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<UserCreditUsage>({
    queryKey: ['user-credit-usage', user?.id],
    queryFn: () => getUserCreditUsage(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000, // Fallback: Refetch every 30 seconds
  });

  // Setup realtime subscription for instant updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime subscription for user_profiles:', user.id);

    // Subscribe to changes in user_profiles table
    const channel = supabase
      .channel(`user-credits-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Credit update received:', payload);
          // Invalidate and refetch credit usage when user_profiles changes
          queryClient.invalidateQueries({ queryKey: ['user-credit-usage', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

/**
 * @deprecated Use useUserCreditUsage instead
 */
export function useUserUsage() {
  const { data: creditUsage } = useUserCreditUsage();
  
  return {
    data: creditUsage ? { credits: creditUsage.credits_used } : undefined,
    isLoading: !creditUsage,
  };
}

export function useCheckUsageLimit() {
  const { user } = useAuth();

  return async (action: CreditAction): Promise<boolean> => {
    if (!user?.id) return false;
    return checkUsageLimit(user.id, action);
  };
}

export function useTrackUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      count = 1,
    }: {
      action: CreditAction;
      count?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await trackUsage(user.id, action, count);
    },
    onSuccess: () => {
      // Invalidate credit usage query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-credit-usage', user?.id] });
    },
  });
}

export function useCancelSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      await cancelSubscription(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription-info', user?.id] });
    },
  });
}

export function useReactivateSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      await reactivateSubscription(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription-info', user?.id] });
    },
  });
}

/**
 * Hook to check if user has access to a feature
 */
export function useFeatureAccess(featureName: keyof UserSubscriptionInfo['features']) {
  const { data: subscriptionInfo } = useUserSubscriptionInfo();

  return {
    hasAccess: subscriptionInfo?.features[featureName] === true,
    isLoading: !subscriptionInfo,
  };
}
