import { trackExcelOperation } from './sentry';

/**
 * Wrapper to track performance of Excel operations
 * 
 * @param operationName - Name of the operation (e.g., 'sortData', 'filterData')
 * @param operation - The operation function to execute
 * @param metadata - Additional metadata to track
 * @returns The result of the operation
 */
export async function trackOperation<T>(
  operationName: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await Promise.resolve(operation());
    const duration = performance.now() - startTime;
    
    // Track successful operation
    trackExcelOperation(operationName, duration, metadata);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Track failed operation
    trackExcelOperation(`${operationName}_error`, duration, {
      ...metadata,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}

/**
 * Synchronous version of trackOperation for non-async operations
 * 
 * @param operationName - Name of the operation
 * @param operation - The operation function to execute
 * @param metadata - Additional metadata to track
 * @returns The result of the operation
 */
export function trackOperationSync<T>(
  operationName: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T {
  const startTime = performance.now();
  
  try {
    const result = operation();
    const duration = performance.now() - startTime;
    
    // Track successful operation
    trackExcelOperation(operationName, duration, metadata);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Track failed operation
    trackExcelOperation(`${operationName}_error`, duration, {
      ...metadata,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}
