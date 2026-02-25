/**
 * Error Recovery Tests
 * 
 * Tests for retry logic, fallback mechanisms, circuit breaker,
 * and graceful degradation.
 * 
 * Requirements: Technical Requirements 4 - Error handling and graceful degradation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withRetry,
  withFallback,
  withRetryAndFallback,
  CircuitBreaker,
  FeatureFlags,
  withFeatureFlag,
} from '../errorRecovery';
import { createSystemError, ErrorCode } from '../errors';

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient error', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(createSystemError.networkError('test'))
      .mockResolvedValue('success');
    
    const result = await withRetry(operation, {
      maxAttempts: 3,
      delayMs: 10,
    });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should fail after max attempts', async () => {
    const error = createSystemError.networkError('test');
    const operation = vi.fn().mockRejectedValue(error);
    
    await expect(
      withRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
      })
    ).rejects.toThrow();
    
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const error = new Error('Non-retryable error');
    error.name = 'ValidationError';
    const operation = vi.fn().mockRejectedValue(error);
    
    await expect(
      withRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
        retryableErrors: [ErrorCode.NETWORK_ERROR],
      })
    ).rejects.toThrow();
    
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const operation = vi.fn()
      .mockRejectedValueOnce(createSystemError.networkError('test'))
      .mockResolvedValue('success');
    
    await withRetry(operation, {
      maxAttempts: 3,
      delayMs: 10,
      onRetry,
    });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('should use exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(createSystemError.networkError('test'))
      .mockRejectedValueOnce(createSystemError.networkError('test'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    
    await withRetry(operation, {
      maxAttempts: 3,
      delayMs: 100,
      backoffMultiplier: 2,
    });
    
    const duration = Date.now() - startTime;
    
    // Should wait at least 100ms + 200ms = 300ms
    expect(duration).toBeGreaterThanOrEqual(300);
    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe('withFallback', () => {
  it('should return operation result on success', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withFallback(operation, {
      fallbackValue: 'fallback',
    });
    
    expect(result).toBe('success');
  });

  it('should use fallback value on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    
    const result = await withFallback(operation, {
      fallbackValue: 'fallback',
    });
    
    expect(result).toBe('fallback');
  });

  it('should use fallback function on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    const fallbackFn = vi.fn().mockResolvedValue('fallback from function');
    
    const result = await withFallback(operation, {
      fallbackFn,
    });
    
    expect(result).toBe('fallback from function');
    expect(fallbackFn).toHaveBeenCalledTimes(1);
  });

  it('should prefer fallback function over value', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    const fallbackFn = vi.fn().mockResolvedValue('from function');
    
    const result = await withFallback(operation, {
      fallbackValue: 'from value',
      fallbackFn,
    });
    
    expect(result).toBe('from function');
  });

  it('should throw if no fallback provided', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    
    await expect(
      withFallback(operation, {})
    ).rejects.toThrow();
  });
});

describe('withRetryAndFallback', () => {
  it('should retry then fallback on persistent failure', async () => {
    const operation = vi.fn().mockRejectedValue(createSystemError.networkError('test'));
    
    const result = await withRetryAndFallback(
      operation,
      { maxAttempts: 2, delayMs: 10 },
      { fallbackValue: 'fallback' }
    );
    
    expect(result).toBe('fallback');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should succeed without fallback if retry succeeds', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(createSystemError.networkError('test'))
      .mockResolvedValue('success');
    
    const result = await withRetryAndFallback(
      operation,
      { maxAttempts: 3, delayMs: 10 },
      { fallbackValue: 'fallback' }
    );
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      resetTimeoutMs: 100,
    });
  });

  it('should start in CLOSED state', () => {
    expect(circuitBreaker.getState()).toBe('closed');
  });

  it('should execute operation successfully', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe('closed');
  });

  it('should open circuit after threshold failures', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    
    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch {
        // Expected
      }
    }
    
    expect(circuitBreaker.getState()).toBe('open');
  });

  it('should reject immediately when circuit is open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch {
        // Expected
      }
    }
    
    // Try to execute again - should fail immediately
    await expect(
      circuitBreaker.execute(operation)
    ).rejects.toThrow('Circuit breaker');
    
    // Operation should not have been called again
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should reset circuit after successful recovery', async () => {
    const circuitBreaker = new CircuitBreaker('test-recovery', {
      failureThreshold: 3,
      resetTimeoutMs: 100,
    });
    
    const operation = vi.fn()
      .mockRejectedValue(new Error('test'))
      .mockRejectedValue(new Error('test'))
      .mockRejectedValue(new Error('test'))
      .mockResolvedValue('success')
      .mockResolvedValue('success');
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch {
        // Expected
      }
    }
    
    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Succeed twice to close circuit
    await circuitBreaker.execute(operation);
    await circuitBreaker.execute(operation);
    
    expect(circuitBreaker.getState()).toBe('closed');
  });
});

describe('FeatureFlags', () => {
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    featureFlags = FeatureFlags.getInstance();
    // Reset all flags
    featureFlags.enable('ai');
    featureFlags.enable('charts');
  });

  it('should check if feature is enabled', () => {
    expect(featureFlags.isEnabled('ai')).toBe(true);
    expect(featureFlags.isEnabled('nonexistent')).toBe(false);
  });

  it('should enable feature', () => {
    featureFlags.disable('ai');
    expect(featureFlags.isEnabled('ai')).toBe(false);
    
    featureFlags.enable('ai');
    expect(featureFlags.isEnabled('ai')).toBe(true);
  });

  it('should disable feature', () => {
    expect(featureFlags.isEnabled('ai')).toBe(true);
    
    featureFlags.disable('ai');
    expect(featureFlags.isEnabled('ai')).toBe(false);
  });

  it('should get all flags', () => {
    const flags = featureFlags.getAll();
    
    expect(flags).toHaveProperty('ai');
    expect(flags).toHaveProperty('charts');
  });
});

describe('withFeatureFlag', () => {
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    featureFlags = FeatureFlags.getInstance();
    featureFlags.enable('testFeature');
  });

  it('should execute operation when feature is enabled', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withFeatureFlag('testFeature', operation, 'fallback');
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should use fallback when feature is disabled', async () => {
    featureFlags.disable('testFeature');
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withFeatureFlag('testFeature', operation, 'fallback');
    
    expect(result).toBe('fallback');
    expect(operation).not.toHaveBeenCalled();
  });

  it('should disable feature and use fallback on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('test'));
    
    const result = await withFeatureFlag('testFeature', operation, 'fallback');
    
    expect(result).toBe('fallback');
    expect(featureFlags.isEnabled('testFeature')).toBe(false);
  });
});
