/**
 * Credit System Types
 * 
 * Unified credit system for all AI actions in ChaTtoEdit.
 * Replaces the old multi-metric system (excel_operations, file_uploads, ai_messages)
 * with a single, flexible credit-based approach.
 */

/**
 * Credit costs for different actions
 */
export const CREDIT_COSTS = {
  // AI Chat
  AI_CHAT: 1,
  
  // Excel Operations
  SIMPLE_OPERATION: 1,    // sort, filter, format, basic formulas
  COMPLEX_OPERATION: 2,   // pivot tables, vlookup, advanced formulas, data analysis
  
  // File Operations
  FILE_UPLOAD: 5,         // includes file processing and parsing
  
  // Template Operations
  TEMPLATE_GENERATION: 3, // AI-powered template creation
  
  // Future features (for reference)
  BATCH_OPERATION: 5,     // bulk operations on multiple sheets
  DATA_VISUALIZATION: 2,  // chart generation
  EXPORT_ADVANCED: 1,     // export to PDF, DOCX, etc.
} as const;

/**
 * Action types that consume credits
 */
export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * User credit usage information
 */
export interface UserCreditUsage {
  credits_used: number;
  credits_limit: number;
  credits_remaining: number;
  period_start: string;
  period_end: string;
}

/**
 * Credit transaction record (for future implementation)
 */
export interface CreditTransaction {
  id: string;
  user_id: string;
  action: CreditAction;
  credits_deducted: number;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Helper to get credit cost for an action
 */
export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

/**
 * Helper to check if user has enough credits
 */
export function hasEnoughCredits(
  usage: UserCreditUsage,
  action: CreditAction
): boolean {
  const cost = getCreditCost(action);
  return usage.credits_remaining >= cost;
}

/**
 * Helper to format credits display
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
}

/**
 * Helper to calculate percentage used
 */
export function getUsagePercentage(usage: UserCreditUsage): number {
  if (usage.credits_limit === 0) return 0;
  return Math.round((usage.credits_used / usage.credits_limit) * 100);
}
