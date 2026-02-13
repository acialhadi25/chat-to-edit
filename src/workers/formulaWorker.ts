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

interface FormulaEvaluationSuccess {
  type: 'success';
  id: string;
  result: string | number | null;
}

interface FormulaEvaluationError {
  type: 'error';
  id: string;
  error: string;
}

type WorkerRequest = FormulaEvaluationRequest;
type WorkerResponse = FormulaEvaluationSuccess | FormulaEvaluationError;

/**
 * Handle incoming messages from the main thread
 */
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;

  if (request.type === 'evaluate') {
    try {
      // Evaluate the formula with the provided data
      const result = evaluateFormula(request.formula, request.data);

      // Send success response
      const response: FormulaEvaluationSuccess = {
        type: 'success',
        id: request.id,
        result,
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
export type { WorkerRequest, WorkerResponse, FormulaEvaluationRequest, FormulaEvaluationSuccess, FormulaEvaluationError };
