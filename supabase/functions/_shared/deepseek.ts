/**
 * DeepSeek API Integration
 * 
 * Handles all DeepSeek API calls with credit tracking and cost monitoring
 */

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekRequest {
  model: 'deepseek-chat' | 'deepseek-reasoner';
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' | 'text' };
}

export interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: DeepSeekUsage;
}

/**
 * Calculate cost in IDR based on token usage
 */
export function calculateCost(usage: DeepSeekUsage): number {
  const USD_TO_IDR = 15000;
  
  // DeepSeek pricing per 1M tokens
  const INPUT_COST_PER_M = 0.28; // $0.28 per 1M tokens (cache miss)
  const INPUT_CACHE_HIT_COST_PER_M = 0.028; // $0.028 per 1M tokens (cache hit)
  const OUTPUT_COST_PER_M = 0.42; // $0.42 per 1M tokens
  
  let inputCost = 0;
  
  // Calculate input cost with cache consideration
  if (usage.prompt_cache_hit_tokens && usage.prompt_cache_miss_tokens) {
    const cacheHitCost = (usage.prompt_cache_hit_tokens / 1_000_000) * INPUT_CACHE_HIT_COST_PER_M;
    const cacheMissCost = (usage.prompt_cache_miss_tokens / 1_000_000) * INPUT_COST_PER_M;
    inputCost = cacheHitCost + cacheMissCost;
  } else {
    // Assume 40% cache hit rate if not provided
    const cacheHitTokens = usage.prompt_tokens * 0.4;
    const cacheMissTokens = usage.prompt_tokens * 0.6;
    inputCost = (cacheHitTokens / 1_000_000) * INPUT_CACHE_HIT_COST_PER_M +
                (cacheMissTokens / 1_000_000) * INPUT_COST_PER_M;
  }
  
  // Calculate output cost
  const outputCost = (usage.completion_tokens / 1_000_000) * OUTPUT_COST_PER_M;
  
  // Total cost in USD
  const totalCostUSD = inputCost + outputCost;
  
  // Convert to IDR
  const totalCostIDR = totalCostUSD * USD_TO_IDR;
  
  return Math.ceil(totalCostIDR); // Round up to nearest IDR
}

/**
 * Estimate credits needed for a request
 */
export function estimateCredits(messages: DeepSeekMessage[]): number {
  // Rough estimation: 1 credit per ~300 tokens
  const estimatedTokens = messages.reduce((sum, msg) => {
    // Rough estimate: 1 token ≈ 4 characters
    return sum + Math.ceil(msg.content.length / 4);
  }, 0);
  
  // Add buffer for response (assume 300 tokens response)
  const totalEstimatedTokens = estimatedTokens + 300;
  
  // Convert to credits (1 credit ≈ 300 tokens)
  const credits = Math.ceil(totalEstimatedTokens / 300);
  
  return Math.max(1, credits); // Minimum 1 credit
}

/**
 * Make a request to DeepSeek API
 */
export async function callDeepSeek(
  apiKey: string,
  request: DeepSeekRequest
): Promise<Response> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', response.status, errorText);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }
  
  return response;
}

/**
 * Log API usage for monitoring
 */
export async function logApiUsage(
  supabase: any,
  userId: string,
  usage: DeepSeekUsage,
  cost: number,
  action: string
) {
  try {
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: userId,
        provider: 'deepseek',
        action: action,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cache_hit_tokens: usage.prompt_cache_hit_tokens || 0,
        cache_miss_tokens: usage.prompt_cache_miss_tokens || usage.prompt_tokens,
        cost_idr: cost,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log API usage:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}
