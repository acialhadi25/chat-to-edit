/**
 * Web Worker for asynchronous formula evaluation
 * 
 * This worker handles formula evaluation off the main thread to prevent UI blocking
 * during complex calculations. It implements a message passing protocol with
 * error handling and timeout support.
 * 
 * Requirements: 3.2.1 - Asynchronous formula evaluation with Web Workers
 */

import { evaluateFormula } from '@/utils/formulas';
import { FormulaCache } from '@/utils/formulaCache';
import type { ExcelData } from '@/types/excel';

/**
 * Message types for worker communication
 */
interface FormulaEvaluationRequest {
  type: 'evaluate';
  id: string;
  formula: string;
  data: ExcelData;
}

interface CacheInvalidationRequest {
  type: 'invalidate';
}

interface CacheStatsRequest {
  type: 'stats';
  id: string;
}

interface FormulaEvaluationSuccess {
  type: 'success';
  id: string;
  result: string | number | null;
  cached?: boolean;
}

interface CacheStatsResponse {
  type: 'stats';
  id: string;
  stats: {
    size: number;
    maxSize: number;
    hitRate: number;
    dataVersion: number;
  };
}

interface FormulaEvaluationError {
  type: 'error';
  id: string;
  error: string;
}

type WorkerRequest = FormulaEvaluationRequest | CacheInvalidationRequest | CacheStatsRequest;
type WorkerResponse = FormulaEvaluationSuccess | FormulaEvaluationError | CacheStatsResponse;

/**
 * Worker-specific formula cache instance
 */
const formulaCache = new FormulaCache({ maxSize: 1000, ttl: 5 * 60 * 1000 });

/**
 * Handle incoming messages from the main thread
 */
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;

  if (request.type === 'evaluate') {
    try {
      // Check cache first
      const cachedResult = formulaCache.get(request.formula, request.data);
      
      if (cachedResult !== null) {
        // Cache hit - return cached result
        const response: FormulaEvaluationSuccess = {
          type: 'success',
          id: request.id,
          result: cachedResult,
          cached: true,
        };
        self.postMessage(response);
        return;
      }

      // Cache miss - evaluate the formula
      const result = evaluateFormula(request.formula, request.data);

      // Store result in cache
      formulaCache.set(request.formula, request.data, result);

      // Send success response
      const response: FormulaEvaluationSuccess = {
        type: 'success',
        id: request.id,
        result,
        cached: false,
      };
      self.postMessage(response);
    } catch (error) {
      // Send error response
      const response: FormulaEvaluationError = {
        type: 'error',
        id: request.id,
        error: error instanceof Error ? error.message : 'Unknown error during formula evaluation',
      };
      self.postMessage(response);
    }
  } else if (request.type === 'invalidate') {
    // Invalidate the cache when data changes
    formulaCache.invalidate();
  } else if (request.type === 'stats') {
    // Return cache statistics
    const stats = formulaCache.getStats();
    const response: CacheStatsResponse = {
      type: 'stats',
      id: request.id,
      stats,
    };
    self.postMessage(response);
  }
};

/**
 * Handle worker errors
 */
self.onerror = (event: string | Event) => {
  const errorMessage = typeof event === 'string' ? event : (event as ErrorEvent).message || 'Worker error occurred';
  console.error('Formula Worker Error:', errorMessage);
  
  // Send error response if possible
  const response: FormulaEvaluationError = {
    type: 'error',
    id: 'unknown',
    error: errorMessage,
  };
  self.postMessage(response);
};

// Export types for use in main thread
export type { 
  WorkerRequest, 
  WorkerResponse, 
  FormulaEvaluationRequest, 
  FormulaEvaluationSuccess, 
  FormulaEvaluationError,
  CacheInvalidationRequest,
  CacheStatsRequest,
  CacheStatsResponse,
};
