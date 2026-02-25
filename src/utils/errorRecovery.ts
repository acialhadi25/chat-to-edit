/**
 * Error Recovery Utilities
 * 
 * Provides automatic retry logic, fallback mechanisms, and graceful degradation
 * for handling transient errors and system failures.
 * 
 * Requirements: Technical Requirements 4 - Security Requirements
 * - Error handling and logging
 * - Graceful degradation
 */

import { UniverError, ErrorCode, toUniverError } from './errors';
import { logError, logWarning, logInfo } from './errorLogger';

// ============================================================================
// Types
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryableErrors?: ErrorCode[];
  onRetry?: (attempt: number, error: UniverError) => void;
}

export interface FallbackOptions<T> {
  fallbackValue?: T;
  fallbackFn?: () => T | Promise<T>;
  logFallback?: boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  monitoringPeriodMs?: number;
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Default retryable error codes (transient errors)
 */
const DEFAULT_RETRYABLE_ERRORS: ErrorCode[] = [
  ErrorCode.NETWORK_ERROR,
  ErrorCode.API_RATE_LIMIT,
  ErrorCode.DATABASE_ERROR,
  ErrorCode.MCP_CONNECTION_ERROR,
  ErrorCode.UNIVER_NOT_READY,
];

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 10000,
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
    onRetry,
  } = options;

  let lastError: UniverError | null = null;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = toUniverError(error);

      // Check if error is retryable
      const isRetryable = retryableErrors.includes(lastError.code);
      const isLastAttempt = attempt === maxAttempts;

      if (!isRetryable || isLastAttempt) {
        throw lastError;
      }

      // Log retry attempt
      await logWarning(`Retry attempt ${attempt}/${maxAttempts} for ${lastError.code}`, {
        operation: 'withRetry',
        details: {
          attempt,
          maxAttempts,
          errorCode: lastError.code,
          errorMessage: lastError.message,
        },
      });

      // Call retry callback
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await sleep(currentDelay);

      // Increase delay for next attempt (exponential backoff)
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError!;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Fallback Mechanisms
// ============================================================================

/**
 * Execute operation with fallback value/function
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  options: FallbackOptions<T>
): Promise<T> {
  const { fallbackValue, fallbackFn, logFallback = true } = options;

  try {
    return await operation();
  } catch (error) {
    const univerError = toUniverError(error);

    if (logFallback) {
      await logWarning('Operation failed, using fallback', {
        operation: 'withFallback',
        details: {
          errorCode: univerError.code,
          errorMessage: univerError.message,
          hasFallbackValue: fallbackValue !== undefined,
          hasFallbackFn: fallbackFn !== undefined,
        },
      });
    }

    // Use fallback function if provided
    if (fallbackFn) {
      return await fallbackFn();
    }

    // Use fallback value if provided
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // No fallback available, rethrow
    throw univerError;
  }
}

/**
 * Execute operation with retry and fallback
 */
export async function withRetryAndFallback<T>(
  operation: () => Promise<T>,
  retryOptions: RetryOptions = {},
  fallbackOptions: FallbackOptions<T>
): Promise<T> {
  return withFallback(() => withRetry(operation, retryOptions), fallbackOptions);
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject immediately
  HALF_OPEN = 'half_open', // Testing if service recovered
}

/**
 * Circuit breaker to prevent cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeoutMs: 60000, // 1 minute
      monitoringPeriodMs: 10000, // 10 seconds
      ...options,
    };
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should try to recover
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        await logInfo(`Circuit breaker ${this.name} entering HALF_OPEN state`, {
          operation: 'CircuitBreaker',
        });
      } else {
        throw toUniverError(
          new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`)
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // After a few successes in HALF_OPEN, close the circuit
      if (this.successCount >= 2) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logInfo(`Circuit breaker ${this.name} recovered - state: CLOSED`, {
          operation: 'CircuitBreaker',
        });
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery attempt, open circuit again
      this.state = CircuitState.OPEN;
      logWarning(`Circuit breaker ${this.name} failed recovery - state: OPEN`, {
        operation: 'CircuitBreaker',
        details: { failureCount: this.failureCount },
      });
    } else if (this.failureCount >= this.options.failureThreshold!) {
      // Too many failures, open circuit
      this.state = CircuitState.OPEN;
      logWarning(`Circuit breaker ${this.name} opened due to failures`, {
        operation: 'CircuitBreaker',
        details: {
          failureCount: this.failureCount,
          threshold: this.options.failureThreshold,
        },
      });
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.options.resetTimeoutMs!;
  }
}

// ============================================================================
// Graceful Degradation
// ============================================================================

/**
 * Feature flags for graceful degradation
 */
export class FeatureFlags {
  private static instance: FeatureFlags;
  private flags: Map<string, boolean> = new Map();

  private constructor() {
    // Initialize with all features enabled
    this.flags.set('ai', true);
    this.flags.set('mcp', true);
    this.flags.set('charts', true);
    this.flags.set('collaboration', true);
    this.flags.set('autoSave', true);
    this.flags.set('versionHistory', true);
    this.flags.set('importExport', true);
  }

  static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(feature: string): boolean {
    return this.flags.get(feature) ?? false;
  }

  /**
   * Enable feature
   */
  enable(feature: string): void {
    this.flags.set(feature, true);
    logInfo(`Feature ${feature} enabled`, {
      operation: 'FeatureFlags',
    });
  }

  /**
   * Disable feature (for graceful degradation)
   */
  disable(feature: string): void {
    this.flags.set(feature, false);
    logWarning(`Feature ${feature} disabled for graceful degradation`, {
      operation: 'FeatureFlags',
    });
  }

  /**
   * Get all flags
   */
  getAll(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }
}

/**
 * Execute operation with feature flag check
 */
export async function withFeatureFlag<T>(
  feature: string,
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  const flags = FeatureFlags.getInstance();

  if (!flags.isEnabled(feature)) {
    await logWarning(`Feature ${feature} is disabled, using fallback`, {
      operation: 'withFeatureFlag',
    });
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    // If operation fails, disable feature and use fallback
    flags.disable(feature);
    await logError(error, {
      operation: 'withFeatureFlag',
      additionalContext: { feature },
    });
    return fallback;
  }
}

// ============================================================================
// Exports
// ============================================================================

export const featureFlags = FeatureFlags.getInstance();
