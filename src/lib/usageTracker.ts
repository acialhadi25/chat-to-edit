/**
 * Usage Tracking Utilities
 *
 * This module provides utilities to track user resource usage and enforce limits.
 */

import { trackUsage, checkUsageLimit } from './subscription';

export type ResourceType = 'excel_operation' | 'file_upload' | 'ai_message';

/**
 * Wrapper function to track usage for an operation
 * Automatically tracks usage after the operation completes successfully
 */
export async function withUsageTracking<T>(
  userId: string,
  resourceType: ResourceType,
  operation: () => Promise<T>
): Promise<T> {
  // Execute the operation
  const result = await operation();

  // Track usage after successful completion
  await trackUsage(userId, resourceType, 1);

  return result;
}

/**
 * Wrapper function to check usage limit before executing an operation
 * Throws an error if limit is exceeded
 */
export async function withUsageLimit<T>(
  userId: string,
  resourceType: ResourceType,
  operation: () => Promise<T>
): Promise<T> {
  // Check if user can perform the operation
  const canPerform = await checkUsageLimit(userId, resourceType);

  if (!canPerform) {
    throw new Error(
      `Usage limit exceeded for ${resourceType.replace('_', ' ')}. Please upgrade your plan.`
    );
  }

  // Execute the operation
  return operation();
}

/**
 * Combined wrapper: check limit, execute operation, track usage
 */
export async function withUsageLimitAndTracking<T>(
  userId: string,
  resourceType: ResourceType,
  operation: () => Promise<T>
): Promise<T> {
  // Check limit first
  const canPerform = await checkUsageLimit(userId, resourceType);

  if (!canPerform) {
    throw new Error(
      `Usage limit exceeded for ${resourceType.replace('_', ' ')}. Please upgrade your plan.`
    );
  }

  // Execute operation
  const result = await operation();

  // Track usage after successful completion
  await trackUsage(userId, resourceType, 1);

  return result;
}

/**
 * Get user-friendly resource type name
 */
export function getResourceTypeName(resourceType: ResourceType): string {
  const names: Record<ResourceType, string> = {
    excel_operation: 'Excel Operation',
    file_upload: 'File Upload',
    ai_message: 'AI Message',
  };

  return names[resourceType];
}

/**
 * Format usage count for display
 */
export function formatUsageCount(count: number, limit: number): string {
  if (limit === -1) {
    return `${count.toLocaleString()} (Unlimited)`;
  }

  return `${count.toLocaleString()} / ${limit.toLocaleString()}`;
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(count: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100;

  return Math.min(100, Math.round((count / limit) * 100));
}

/**
 * Check if usage is approaching limit (>80%)
 */
export function isApproachingLimit(count: number, limit: number): boolean {
  if (limit === -1) return false; // Unlimited

  const percentage = calculateUsagePercentage(count, limit);
  return percentage >= 80;
}

/**
 * Check if usage has exceeded limit
 */
export function hasExceededLimit(count: number, limit: number): boolean {
  if (limit === -1) return false; // Unlimited

  return count >= limit;
}
