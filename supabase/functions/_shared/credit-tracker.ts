/**
 * Credit Tracking System
 * 
 * Handles credit checking and tracking for all AI operations
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type CreditAction = 
  | 'AI_CHAT'
  | 'SIMPLE_OPERATION'
  | 'COMPLEX_OPERATION'
  | 'FILE_UPLOAD'
  | 'TEMPLATE_GENERATION';

export const CREDIT_COSTS: Record<CreditAction, number> = {
  AI_CHAT: 1,
  SIMPLE_OPERATION: 1,
  COMPLEX_OPERATION: 2,
  FILE_UPLOAD: 5,
  TEMPLATE_GENERATION: 3,
};

export interface CreditCheckResult {
  allowed: boolean;
  creditsRemaining: number;
  creditsLimit: number;
  creditsUsed: number;
  message?: string;
}

/**
 * Check if user has enough credits for an action
 */
export async function checkCredits(
  supabase: SupabaseClient,
  userId: string,
  action: CreditAction
): Promise<CreditCheckResult> {
  const creditCost = CREDIT_COSTS[action];
  
  try {
    // Get user's current credit usage
    const { data: usage, error } = await supabase.rpc('get_user_usage', {
      p_user_id: userId,
    });
    
    if (error) {
      console.error('Error checking credits:', error);
      throw error;
    }
    
    if (!usage || usage.length === 0) {
      // User not found or no subscription - default to free tier
      return {
        allowed: false,
        creditsRemaining: 0,
        creditsLimit: 50,
        creditsUsed: 0,
        message: 'No active subscription found',
      };
    }
    
    const userUsage = usage[0];
    const hasEnoughCredits = userUsage.credits_remaining >= creditCost;
    
    return {
      allowed: hasEnoughCredits,
      creditsRemaining: userUsage.credits_remaining,
      creditsLimit: userUsage.credits_limit,
      creditsUsed: userUsage.credits_used,
      message: hasEnoughCredits 
        ? undefined 
        : `Insufficient credits. Need ${creditCost}, have ${userUsage.credits_remaining}`,
    };
  } catch (error) {
    console.error('Credit check failed:', error);
    throw error;
  }
}

/**
 * Track credit usage after an action
 */
export async function trackCredits(
  supabase: SupabaseClient,
  userId: string,
  action: CreditAction,
  count: number = 1
): Promise<void> {
  const creditCost = CREDIT_COSTS[action] * count;
  
  try {
    const { error } = await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_resource_type: 'credits',
      p_count: creditCost,
    });
    
    if (error) {
      console.error('Error tracking credits:', error);
      throw error;
    }
    
    console.log(`Tracked ${creditCost} credits for user ${userId} (action: ${action})`);
  } catch (error) {
    console.error('Credit tracking failed:', error);
    // Don't throw - tracking failure shouldn't break the main flow
    // But log it for monitoring
  }
}

/**
 * Get user's credit usage summary
 */
export async function getCreditUsage(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data, error } = await supabase.rpc('get_user_usage', {
      p_user_id: userId,
    });
    
    if (error) throw error;
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Failed to get credit usage:', error);
    throw error;
  }
}

/**
 * Middleware to check and track credits for an action
 */
export async function withCreditTracking<T>(
  supabase: SupabaseClient,
  userId: string,
  action: CreditAction,
  operation: () => Promise<T>
): Promise<T> {
  // Check credits before operation
  const checkResult = await checkCredits(supabase, userId, action);
  
  if (!checkResult.allowed) {
    throw new Error(checkResult.message || 'Insufficient credits');
  }
  
  // Perform operation
  const result = await operation();
  
  // Track credits after successful operation
  await trackCredits(supabase, userId, action);
  
  return result;
}

/**
 * Create error response for insufficient credits
 */
export function createInsufficientCreditsResponse(
  checkResult: CreditCheckResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'insufficient_credits',
      message: checkResult.message,
      credits_remaining: checkResult.creditsRemaining,
      credits_limit: checkResult.creditsLimit,
      credits_used: checkResult.creditsUsed,
    }),
    {
      status: 402, // Payment Required
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
