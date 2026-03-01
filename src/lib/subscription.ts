// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import type {
  SubscriptionTier,
  UserSubscription,
  UserSubscriptionInfo,
  UsageTracking,
} from '@/types/subscription';
import type { UserCreditUsage, CreditAction } from '@/types/credits';
import { CREDIT_COSTS } from '@/types/credits';

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
 * Check if user can perform an action based on credit limits
 */
export async function checkUsageLimit(
  userId: string,
  action: CreditAction
): Promise<boolean> {
  const creditCost = CREDIT_COSTS[action];
  const usage = await getUserCreditUsage(userId);
  
  return usage.credits_remaining >= creditCost;
}

/**
 * Track credit usage for an action
 */
export async function trackUsage(
  userId: string,
  action: CreditAction,
  count: number = 1
): Promise<void> {
  const creditCost = CREDIT_COSTS[action] * count;
  
  const { error } = await supabase.rpc('track_usage', {
    p_user_id: userId,
    p_resource_type: 'credits',
    p_count: creditCost,
  });

  if (error) {
    console.error('Failed to track usage:', error);
    throw error;
  }
}

/**
 * Get user's current credit usage for the current period
 */
export async function getUserCreditUsage(userId: string): Promise<UserCreditUsage> {
  const { data, error } = await supabase.rpc('get_user_usage', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to fetch user usage:', error);
    // Return default values on error
    return {
      credits_used: 0,
      credits_limit: 100, // Free tier default
      credits_remaining: 100,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
    };
  }

  return data[0];
}

/**
 * @deprecated Use getUserCreditUsage instead
 * Get user's current usage for the current period (legacy)
 */
export async function getUserUsage(userId: string): Promise<Record<string, number>> {
  const usage = await getUserCreditUsage(userId);
  return {
    credits: usage.credits_used,
  };
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
