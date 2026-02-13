interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Retry wrapper for async functions with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryableStatuses = [429, 502, 503, 504],
    onRetry,
  } = options;

  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts <= maxRetries) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempts + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;

      // Check if we should retry
      if (attempts > maxRetries) {
        break;
      }

      // Check if error is retryable (based on status code for HTTP errors)
      const statusCode = (error as { status?: number }).status;
      if (statusCode && !retryableStatuses.includes(statusCode)) {
        return {
          success: false,
          error: lastError,
          attempts,
        };
      }

      // Calculate exponential backoff delay with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempts - 1) + Math.random() * 1000,
        maxDelay
      );

      if (onRetry) {
        onRetry(attempts, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
  };
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Circuit breaker pattern for preventing cascade failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeoutMs = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeoutMs) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open - too many failures");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "open";
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

/**
 * Enhanced stream chat with retry and timeout
 */
export interface EnhancedStreamChatParams {
  messages: { role: string; content: string }[];
  excelContext: Record<string, unknown> | null;
  onDelta: (deltaText: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error, status?: number) => void;
  timeoutMs?: number;
  maxRetries?: number;
}

export async function enhancedStreamChat({
  messages,
  excelContext,
  onDelta,
  onDone,
  onError,
  timeoutMs = 30000,
  maxRetries = 3,
}: EnhancedStreamChatParams): Promise<void> {
  const { streamChat } = await import("./streamChat");

  const retryResult = await withRetry(
    async () => {
      return new Promise<string>((resolve, reject) => {
        let fullText = "";

        const timeoutId = setTimeout(() => {
          reject(new Error(`AI request timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        streamChat({
          messages,
          excelContext,
          onDelta: (chunk) => {
            fullText += chunk;
            onDelta(chunk);
          },
          onDone: (text) => {
            clearTimeout(timeoutId);
            resolve(text);
          },
          onError: (error, status) => {
            clearTimeout(timeoutId);
            // Add status to error for retry logic
            (error as Error & { status?: number }).status = status;
            reject(error);
          },
        });
      });
    },
    {
      maxRetries,
      baseDelay: 2000,
      onRetry: (attempt, error) => {
        console.warn(`Retrying AI request (attempt ${attempt}):`, error.message);
      },
    }
  );

  if (!retryResult.success) {
    const error = retryResult.error || new Error("Unknown error");
    const status = (error as Error & { status?: number }).status;
    onError(error, status);
  }
}
