import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getSubscriptionTiers,
  getUserSubscription,
  getUserSubscriptionInfo,
  getUserUsage,
  checkUsageLimit,
  trackUsage,
  cancelSubscription,
  reactivateSubscription,
} from '@/lib/subscription';
import type { SubscriptionTier, UserSubscriptionInfo } from '@/types/subscription';

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

export function useUserUsage() {
  const { user } = useAuth();

  return useQuery<Record<string, number>>({
    queryKey: ['user-usage', user?.id],
    queryFn: () => (user?.id ? getUserUsage(user.id) : {}),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useCheckUsageLimit() {
  const { user } = useAuth();

  return async (
    resourceType: 'excel_operation' | 'file_upload' | 'ai_message'
  ): Promise<boolean> => {
    if (!user?.id) return false;
    return checkUsageLimit(user.id, resourceType);
  };
}

export function useTrackUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceType,
      count = 1,
    }: {
      resourceType: 'excel_operation' | 'file_upload' | 'ai_message';
      count?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await trackUsage(user.id, resourceType, count);
    },
    onSuccess: () => {
      // Invalidate usage query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-usage', user?.id] });
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
