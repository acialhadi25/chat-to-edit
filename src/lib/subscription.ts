import { supabase } from '@/integrations/supabase/client';
import type {
  SubscriptionTier,
  UserSubscription,
  UserSubscriptionInfo,
  UsageTracking,
} from '@/types/subscription';

/**
 * Get all available subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch subscription tiers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error
    throw new Error(`Failed to fetch user subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get user's subscription tier information
 */
export async function getUserSubscriptionInfo(userId: string): Promise<UserSubscriptionInfo> {
  const { data, error } = await supabase.rpc('get_user_subscription_tier', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch subscription info: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // Return free tier as default
    const freeTier = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('name', 'free')
      .single();

    if (freeTier.data) {
      return {
        tier_name: freeTier.data.name,
        tier_display_name: freeTier.data.display_name,
        features: freeTier.data.features,
        limits: freeTier.data.limits,
        status: 'none',
      };
    }
  }

  return data[0];
}

/**
 * Check if user can perform an action based on usage limits
 */
export async function checkUsageLimit(
  userId: string,
  resourceType: 'excel_operation' | 'file_upload' | 'ai_message'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_usage_limit', {
    p_user_id: userId,
    p_resource_type: resourceType,
  });

  if (error) {
    console.error('Failed to check usage limit:', error);
    return false;
  }

  return data === true;
}

/**
 * Track usage for a resource
 */
export async function trackUsage(
  userId: string,
  resourceType: 'excel_operation' | 'file_upload' | 'ai_message',
  count: number = 1
): Promise<void> {
  const { error } = await supabase.rpc('track_usage', {
    p_user_id: userId,
    p_resource_type: resourceType,
    p_count: count,
  });

  if (error) {
    console.error('Failed to track usage:', error);
  }
}

/**
 * Get user's current usage for the current period
 */
export async function getUserUsage(userId: string): Promise<Record<string, number>> {
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('resource_type, count')
    .eq('user_id', userId)
    .gte('period_start', periodStart.toISOString());

  if (error) {
    console.error('Failed to fetch user usage:', error);
    return {};
  }

  const usage: Record<string, number> = {};
  data?.forEach((item: UsageTracking) => {
    usage[item.resource_type] = item.count;
  });

  return usage;
}

/**
 * Cancel user subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Reactivate cancelled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: false,
      cancelled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to reactivate subscription: ${error.message}`);
  }
}
