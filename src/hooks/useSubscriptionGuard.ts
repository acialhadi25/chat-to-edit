import { useCallback } from 'react';
import { useUserSubscriptionInfo, useCheckUsageLimit } from './useSubscription';
import { useToast } from './use-toast';
import type { SubscriptionFeatures } from '@/types/subscription';

/**
 * Hook to guard features and actions based on subscription tier
 */
export function useSubscriptionGuard() {
  const { data: subscriptionInfo, isLoading } = useUserSubscriptionInfo();
  const checkLimit = useCheckUsageLimit();
  const { toast } = useToast();

  /**
   * Check if user has access to a feature
   */
  const hasFeature = useCallback(
    (featureName: keyof SubscriptionFeatures): boolean => {
      if (!subscriptionInfo) return false;
      return subscriptionInfo.features[featureName] === true;
    },
    [subscriptionInfo]
  );

  /**
   * Check if user can perform an action based on usage limits
   */
  const canPerformAction = useCallback(
    async (resourceType: 'excel_operation' | 'file_upload' | 'ai_message'): Promise<boolean> => {
      const canPerform = await checkLimit(resourceType);

      if (!canPerform) {
        const limitKey = `${resourceType}s_per_month`;
        const limit = subscriptionInfo?.limits[limitKey as keyof typeof subscriptionInfo.limits];

        toast({
          title: 'Usage Limit Reached',
          description: `You've reached your monthly limit of ${limit} ${resourceType.replace('_', ' ')}s. Upgrade your plan to continue.`,
          variant: 'destructive',
        });
      }

      return canPerform;
    },
    [checkLimit, subscriptionInfo, toast]
  );

  /**
   * Guard a feature - show upgrade prompt if not available
   */
  const guardFeature = useCallback(
    (featureName: keyof SubscriptionFeatures, featureDisplayName: string): boolean => {
      if (hasFeature(featureName)) {
        return true;
      }

      toast({
        title: 'Feature Not Available',
        description: `${featureDisplayName} is not available in your current plan. Please upgrade to access this feature.`,
        variant: 'destructive',
      });

      return false;
    },
    [hasFeature, toast]
  );

  /**
   * Check file size limit
   */
  const checkFileSize = useCallback(
    (fileSizeMB: number): boolean => {
      if (!subscriptionInfo) return false;

      const maxSize = subscriptionInfo.limits.max_file_size_mb;

      if (fileSizeMB > maxSize) {
        toast({
          title: 'File Too Large',
          description: `Your current plan supports files up to ${maxSize}MB. This file is ${fileSizeMB.toFixed(1)}MB. Please upgrade to upload larger files.`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    },
    [subscriptionInfo, toast]
  );

  return {
    hasFeature,
    canPerformAction,
    guardFeature,
    checkFileSize,
    subscriptionInfo,
    isLoading,
  };
}
