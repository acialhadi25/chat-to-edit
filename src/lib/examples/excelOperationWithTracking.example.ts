// @ts-nocheck
/**
 * Example: How to integrate Sentry performance tracking with Excel operations
 * 
 * This file demonstrates best practices for tracking Excel operations
 * with Sentry for performance monitoring and error tracking.
 */

import { trackOperation, trackOperationSync } from '@/lib/performanceTracking';
import { addBreadcrumb, trackExcelOperation } from '@/lib/sentry';
import type { ExcelData } from '@/types/excel';

// Example 1: Tracking a simple sync operation
export function sortDataWithTracking(
  data: ExcelData,
  column: number,
  direction: 'asc' | 'desc'
) {
  return trackOperationSync(
    'sortData',
    () => {
      // Your actual sort logic here
      const sorted = { ...data };
      sorted.rows = [...data.rows].sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
      return sorted;
    },
    {
      rowCount: data.rows.length,
      columnCount: data.headers.length,
      direction,
    }
  );
}

// Example 2: Tracking an async operation with progress
export async function parseExcelFileWithTracking(file: File) {
  // Add breadcrumb for debugging
  addBreadcrumb('Starting Excel file parse', 'excel', 'info', {
    fileName: file.name,
    fileSize: file.size,
  });

  return trackOperation(
    'parseExcelFile',
    async () => {
      // Simulate async parsing
      const result = await parseExcelFile(file);
      
      addBreadcrumb('Excel file parsed successfully', 'excel', 'info', {
        rowCount: result.rows.length,
        columnCount: result.headers.length,
      });
      
      return result;
    },
    {
      fileSize: file.size,
      fileName: file.name,
    }
  );
}

// Example 3: Manual tracking with custom logic
export async function complexExcelOperation(data: ExcelData) {
  const startTime = performance.now();
  
  try {
    addBreadcrumb('Starting complex operation', 'excel', 'info', {
      rowCount: data.rows.length,
    });

    // Step 1: Clean data
    const cleaned = await cleanData(data);
    addBreadcrumb('Data cleaned', 'excel', 'info');

    // Step 2: Transform data
    const transformed = await transformData(cleaned);
    addBreadcrumb('Data transformed', 'excel', 'info');

    // Step 3: Validate data
    const validated = await validateData(transformed);
    addBreadcrumb('Data validated', 'excel', 'info');

    const duration = performance.now() - startTime;
    
    // Track successful operation
    trackExcelOperation('complexExcelOperation', duration, {
      rowCount: data.rows.length,
      columnCount: data.headers.length,
      steps: 3,
    });

    return validated;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Track failed operation
    trackExcelOperation('complexExcelOperation_error', duration, {
      rowCount: data.rows.length,
      columnCount: data.headers.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    addBreadcrumb('Complex operation failed', 'excel', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

// Example 4: Tracking multiple operations in sequence
export async function batchProcessFiles(files: File[]) {
  addBreadcrumb('Starting batch file processing', 'excel', 'info', {
    fileCount: files.length,
  });

  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    addBreadcrumb(`Processing file ${i + 1}/${files.length}`, 'excel', 'info', {
      fileName: file.name,
    });

    try {
      const result = await trackOperation(
        'processFile',
        () => processFile(file),
        {
          fileIndex: i,
          fileName: file.name,
          fileSize: file.size,
        }
      );
      
      results.push(result);
    } catch (error) {
      addBreadcrumb(`Failed to process file ${i + 1}`, 'excel', 'error', {
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Continue with other files
      continue;
    }
  }

  addBreadcrumb('Batch processing completed', 'excel', 'info', {
    successCount: results.length,
    totalCount: files.length,
  });

  return results;
}

// Example 5: Tracking with conditional logic
export function filterDataWithTracking(
  data: ExcelData,
  column: number,
  operator: string,
  value: string | number
) {
  // Only track if dataset is large enough to matter
  const shouldTrack = data.rows.length > 100;

  if (shouldTrack) {
    return trackOperationSync(
      'filterData',
      () => performFilter(data, column, operator, value),
      {
        rowCount: data.rows.length,
        operator,
        threshold: 'large',
      }
    );
  } else {
    // For small datasets, just execute without tracking overhead
    return performFilter(data, column, operator, value);
  }
}

// Helper functions (mock implementations)
async function parseExcelFile(file: File): Promise<ExcelData> {
  // Mock implementation
  return {
    headers: ['A', 'B', 'C'],
    rows: [[1, 2, 3]],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
  };
}

async function cleanData(data: ExcelData): Promise<ExcelData> {
  return data;
}

async function transformData(data: ExcelData): Promise<ExcelData> {
  return data;
}

async function validateData(data: ExcelData): Promise<ExcelData> {
  return data;
}

async function processFile(file: File): Promise<ExcelData> {
  return parseExcelFile(file);
}

function performFilter(
  data: ExcelData,
  column: number,
  operator: string,
  value: string | number
): ExcelData {
  return {
    ...data,
    rows: data.rows.filter(row => {
      const cellValue = row[column];
      switch (operator) {
        case '=':
          return cellValue === value;
        case '>':
          return Number(cellValue) > Number(value);
        case '<':
          return Number(cellValue) < Number(value);
        default:
          return true;
      }
    }),
  };
}
