/**
 * React hook for asynchronous formula evaluation using Web Workers
 * 
 * This hook manages a Web Worker instance for formula evaluation, providing
 * a clean API for evaluating formulas without blocking the main thread.
 * 
 * Features:
 * - Automatic worker lifecycle management
 * - Promise-based API for formula evaluation
 * - Timeout support for long-running calculations
 * - Error handling and recovery
 * - Request ID tracking for concurrent evaluations
 * 
 * Requirements: 3.2.1 - Asynchronous formula evaluation with Web Workers
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ExcelData } from '@/types/excel';
import type {
  WorkerRequest,
  WorkerResponse,
  CacheStatsResponse,
} from '@/workers/formulaWorker';

/**
 * Options for formula evaluation
 */
interface EvaluateOptions {
  /**
   * Timeout in milliseconds (default: 5000ms)
   */
  timeout?: number;
}

/**
 * Hook return type
 */
interface UseFormulaWorkerReturn {
  /**
   * Evaluate a formula asynchronously
   */
  evaluateAsync: (
    formula: string,
    data: ExcelData,
    options?: EvaluateOptions
  ) => Promise<string | number | null>;

  /**
   * Invalidate the formula cache (call when data changes)
   */
  invalidateCache: () => void;

  /**
   * Get cache statistics
   */
  getCacheStats: () => Promise<{
    size: number;
    maxSize: number;
    hitRate: number;
    dataVersion: number;
  }>;

  /**
   * Check if the worker is ready
   */
  isReady: boolean;

  /**
   * Terminate the worker manually (usually not needed)
   */
  terminate: () => void;
}

/**
 * Pending request tracker
 */
interface PendingRequest {
  resolve: (value: string | number | null | { size: number; maxSize: number; hitRate: number; dataVersion: number }) => void;
  reject: (error: Error) => void;
  timeoutId?: number;
}

/**
 * Hook for using the formula evaluation Web Worker
 * 
 * @example
 * ```tsx
 * const { evaluateAsync, invalidateCache, isReady } = useFormulaWorker();
 * 
 * const handleCalculate = async () => {
 *   if (!isReady) return;
 *   
 *   try {
 *     const result = await evaluateAsync('=SUM(A1:A10)', excelData);
 *     console.log('Result:', result);
 *   } catch (error) {
 *     console.error('Evaluation failed:', error);
 *   }
 * };
 * 
 * const handleDataChange = () => {
 *   // Invalidate cache when data changes
 *   invalidateCache();
 * };
 * ```
 */
export function useFormulaWorker(): UseFormulaWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const requestIdCounter = useRef(0);

  /**
   * Initialize the Web Worker
   */
  useEffect(() => {
    try {
      // Create the worker
      workerRef.current = new Worker(
        new URL('../workers/formulaWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up message handler
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse | CacheStatsResponse>) => {
        const response = e.data;
        const pending = pendingRequestsRef.current.get(response.id);

        if (!pending) {
          console.warn('Received response for unknown request:', response.id);
          return;
        }

        // Clear timeout
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }

        // Remove from pending requests
        pendingRequestsRef.current.delete(response.id);

        // Handle response
        if (response.type === 'success') {
          pending.resolve(response.result);
        } else if (response.type === 'error') {
          pending.reject(new Error(response.error));
        } else if (response.type === 'stats') {
          pending.resolve(response.stats);
        }
      };

      // Set up error handler
      workerRef.current.onerror = (error: ErrorEvent) => {
        console.error('Formula Worker Error:', error);
        
        // Reject all pending requests
        pendingRequestsRef.current.forEach((pending) => {
          if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
          }
          pending.reject(new Error('Worker error: ' + error.message));
        });
        pendingRequestsRef.current.clear();
      };

      setIsReady(true);

      // Cleanup on unmount
      return () => {
        if (workerRef.current) {
          // Reject all pending requests
          pendingRequestsRef.current.forEach((pending) => {
            if (pending.timeoutId) {
              clearTimeout(pending.timeoutId);
            }
            pending.reject(new Error('Worker terminated'));
          });
          pendingRequestsRef.current.clear();

          // Terminate worker
          workerRef.current.terminate();
          workerRef.current = null;
          setIsReady(false);
        }
      };
    } catch (error) {
      console.error('Failed to initialize formula worker:', error);
      setIsReady(false);
      return undefined;
    }
  }, []);

  /**
   * Evaluate a formula asynchronously
   */
  const evaluateAsync = useCallback(
    (
      formula: string,
      data: ExcelData,
      options: EvaluateOptions = {}
    ): Promise<string | number | null> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isReady) {
          reject(new Error('Worker not initialized'));
          return;
        }

        // Generate unique request ID
        const id = `req_${++requestIdCounter.current}`;

        // Set up timeout
        const timeout = options.timeout ?? 5000;
        const timeoutId = window.setTimeout(() => {
          pendingRequestsRef.current.delete(id);
          reject(new Error(`Formula evaluation timed out after ${timeout}ms`));
        }, timeout);

        // Store pending request
        pendingRequestsRef.current.set(id, {
          resolve,
          reject,
          timeoutId,
        });

        // Send request to worker
        const request: WorkerRequest = {
          type: 'evaluate',
          id,
          formula,
          data,
        };

        workerRef.current.postMessage(request);
      });
    },
    [isReady]
  );

  /**
   * Invalidate the formula cache
   * 
   * Call this when the Excel data changes to ensure fresh calculations
   */
  const invalidateCache = useCallback(() => {
    if (!workerRef.current || !isReady) {
      console.warn('Worker not initialized, cannot invalidate cache');
      return;
    }

    workerRef.current.postMessage({ type: 'invalidate' });
  }, [isReady]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback((): Promise<{
    size: number;
    maxSize: number;
    hitRate: number;
    dataVersion: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Generate unique request ID
      const id = `stats_${++requestIdCounter.current}`;

      // Set up timeout
      const timeoutId = window.setTimeout(() => {
        pendingRequestsRef.current.delete(id);
        reject(new Error('Cache stats request timed out'));
      }, 1000);

      // Store pending request
      pendingRequestsRef.current.set(id, {
        resolve: resolve as (value: string | number | null | { size: number; maxSize: number; hitRate: number; dataVersion: number }) => void,
        reject,
        timeoutId,
      });

      // Send request to worker
      workerRef.current.postMessage({ type: 'stats', id });
    });
  }, [isReady]);

  /**
   * Terminate the worker manually
   */
  const terminate = useCallback(() => {
    if (workerRef.current) {
      // Reject all pending requests
      pendingRequestsRef.current.forEach((pending) => {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        pending.reject(new Error('Worker terminated manually'));
      });
      pendingRequestsRef.current.clear();

      // Terminate worker
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
    }
  }, []);

  return {
    evaluateAsync,
    invalidateCache,
    getCacheStats,
    isReady,
    terminate,
  };
}
