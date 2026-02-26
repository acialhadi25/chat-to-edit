/**
 * Performance Optimization Utilities for Univer Workbook Operations
 * 
 * This module provides utilities to optimize workbook recreation and data updates
 * for large datasets (1000+ rows) by implementing:
 * - Incremental updates using Univer commands
 * - Caching for frequently accessed data
 * - Batch operations
 * - Performance profiling
 */

import { ExcelData, DataChange } from '@/types/excel';

// Cache for frequently accessed data
interface DataCache {
  cellValues: Map<string, any>;
  formulas: Map<string, string>;
  styles: Map<string, any>;
  lastUpdate: number;
}

const dataCache: DataCache = {
  cellValues: new Map(),
  formulas: new Map(),
  styles: new Map(),
  lastUpdate: Date.now(),
};

// Performance metrics
interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  rowCount?: number;
  cellCount?: number;
}

const performanceMetrics: PerformanceMetrics[] = [];

/**
 * Start performance profiling for an operation
 */
export function startProfiling(operationName: string, rowCount?: number, cellCount?: number): number {
  const metric: PerformanceMetrics = {
    operationName,
    startTime: performance.now(),
    rowCount,
    cellCount,
  };
  
  performanceMetrics.push(metric);
  return performanceMetrics.length - 1;
}

/**
 * End performance profiling and return duration
 */
export function endProfiling(metricIndex: number): number {
  if (metricIndex < 0 || metricIndex >= performanceMetrics.length) {
    return 0;
  }
  
  const metric = performanceMetrics[metricIndex];
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  
  console.log(`⏱️ Performance: ${metric.operationName} took ${metric.duration.toFixed(2)}ms`, {
    rowCount: metric.rowCount,
    cellCount: metric.cellCount,
  });
  
  return metric.duration;
}

/**
 * Get all performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return [...performanceMetrics];
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

/**
 * Apply incremental updates to workbook using Univer commands
 * instead of full workbook recreation
 */
export function applyIncrementalUpdates(
  univerAPI: any,
  changes: DataChange[]
): boolean {
  if (!univerAPI || !changes || changes.length === 0) {
    return false;
  }

  const metricIndex = startProfiling('applyIncrementalUpdates', undefined, changes.length);

  try {
    const workbook = univerAPI.getActiveWorkbook();
    const sheet = workbook?.getActiveSheet();
    
    if (!sheet) {
      console.warn('No active sheet for incremental updates');
      return false;
    }

    // Group changes by type for batch processing
    const cellUpdates: DataChange[] = [];
    const formulaUpdates: DataChange[] = [];
    const styleUpdates: DataChange[] = [];

    changes.forEach(change => {
      const value = change.newValue;
      
      if (typeof value === 'string' && value.startsWith('=')) {
        formulaUpdates.push(change);
      } else if (change.type === 'CELL_UPDATE') {
        cellUpdates.push(change);
      }
    });

    // Batch update cell values
    if (cellUpdates.length > 0) {
      cellUpdates.forEach(change => {
        const range = sheet.getRange(change.row, change.col);
        range.setValue(change.newValue);
        
        // Update cache
        const cellRef = `${String.fromCharCode(65 + change.col)}${change.row + 1}`;
        dataCache.cellValues.set(cellRef, change.newValue);
      });
    }

    // Batch update formulas
    if (formulaUpdates.length > 0) {
      formulaUpdates.forEach(change => {
        const range = sheet.getRange(change.row, change.col);
        const formula = change.newValue as string;
        range.setValue(formula);
        
        // Update cache
        const cellRef = `${String.fromCharCode(65 + change.col)}${change.row + 1}`;
        dataCache.formulas.set(cellRef, formula);
      });
    }

    dataCache.lastUpdate = Date.now();
    endProfiling(metricIndex);
    
    return true;
  } catch (error) {
    console.error('Error applying incremental updates:', error);
    endProfiling(metricIndex);
    return false;
  }
}

/**
 * Get cached cell value
 */
export function getCachedCellValue(cellRef: string): any | undefined {
  return dataCache.cellValues.get(cellRef);
}

/**
 * Get cached formula
 */
export function getCachedFormula(cellRef: string): string | undefined {
  return dataCache.formulas.get(cellRef);
}

/**
 * Clear cache
 */
export function clearCache(): void {
  dataCache.cellValues.clear();
  dataCache.formulas.clear();
  dataCache.styles.clear();
  dataCache.lastUpdate = Date.now();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cellValues: dataCache.cellValues.size,
    formulas: dataCache.formulas.size,
    styles: dataCache.styles.size,
    lastUpdate: dataCache.lastUpdate,
    age: Date.now() - dataCache.lastUpdate,
  };
}

/**
 * Optimize workbook recreation for large datasets
 * Uses chunking and batching to improve performance
 */
export function optimizedWorkbookRecreation(
  data: ExcelData,
  chunkSize: number = 100
): any {
  const metricIndex = startProfiling('optimizedWorkbookRecreation', data.rows.length);

  try {
    const sheetId = 'sheet-01';
    const sheetName = data.currentSheet || 'Sheet1';
    
    // Build cellData in chunks
    const cellData: any = {};
    
    // Add headers (row 0)
    data.headers.forEach((header, colIdx) => {
      if (!cellData[0]) cellData[0] = {};
      cellData[0][colIdx] = { v: header };
    });

    // Process rows in chunks to avoid blocking the main thread
    const totalRows = data.rows.length;
    const chunks = Math.ceil(totalRows / chunkSize);
    
    for (let chunkIdx = 0; chunkIdx < chunks; chunkIdx++) {
      const startRow = chunkIdx * chunkSize;
      const endRow = Math.min(startRow + chunkSize, totalRows);
      
      for (let rowIdx = startRow; rowIdx < endRow; rowIdx++) {
        const row = data.rows[rowIdx];
        const univerRowIdx = rowIdx + 1;
        
        if (!cellData[univerRowIdx]) cellData[univerRowIdx] = {};
        
        row.forEach((cellValue, colIdx) => {
          const excelRowNum = rowIdx + 2;
          const cellRef = `${String.fromCharCode(65 + colIdx)}${excelRowNum}`;
          
          const cell: any = {};
          
          // Check for formula
          const hasFormula = data.formulas?.[cellRef];
          if (hasFormula) {
            const formula = data.formulas[cellRef];
            cell.f = formula.startsWith('=') ? formula : `=${formula}`;
            cell.v = '';
          } else {
            cell.v = cellValue ?? '';
          }
          
          // Add styles if exists
          if (data.cellStyles?.[cellRef]) {
            const style = data.cellStyles[cellRef];
            cell.s = {};
            
            if (style.backgroundColor && typeof style.backgroundColor === 'string') {
              const bgColor = style.backgroundColor.replace('#', '');
              if (bgColor !== '000000' && !bgColor.match(/^00000[0-9A-Fa-f]$/)) {
                cell.s.bg = { rgb: bgColor };
              }
            }
            
            if (style.fontColor && typeof style.fontColor === 'string') {
              cell.s.fc = { rgb: style.fontColor.replace('#', '') };
            }
            
            if (style.fontWeight === 'bold') {
              cell.s.bl = 1;
            }
          }
          
          cellData[univerRowIdx][colIdx] = cell;
        });
      }
    }

    // Build columnData for column widths
    const columnData: any = {};
    if (data.columnWidths) {
      Object.entries(data.columnWidths).forEach(([colIndex, width]) => {
        const colIdx = parseInt(colIndex);
        columnData[colIdx] = { w: width };
      });
    }

    const univerData = {
      id: 'workbook-01',
      name: data.fileName || 'Workbook',
      sheetOrder: [sheetId],
      sheets: {
        [sheetId]: {
          id: sheetId,
          name: sheetName,
          cellData,
          columnData: Object.keys(columnData).length > 0 ? columnData : undefined,
          rowCount: data.rows.length + 20,
          columnCount: data.headers.length + 5,
        },
      },
    };

    const duration = endProfiling(metricIndex);
    
    // Log warning if performance target not met
    if (duration > 1000 && data.rows.length >= 1000) {
      console.warn(`⚠️ Performance target not met: ${duration.toFixed(2)}ms for ${data.rows.length} rows (target: <1000ms)`);
    }
    
    return univerData;
  } catch (error) {
    console.error('Error in optimized workbook recreation:', error);
    endProfiling(metricIndex);
    throw error;
  }
}

/**
 * Determine if incremental update should be used instead of full recreation
 */
export function shouldUseIncrementalUpdate(
  changes: DataChange[],
  totalRows: number
): boolean {
  // Use incremental updates if:
  // 1. Changes are less than 10% of total rows
  // 2. Total rows > 100
  // 3. Changes are less than 100 cells
  
  const changeRatio = changes.length / totalRows;
  
  return (
    totalRows > 100 &&
    changes.length < 100 &&
    changeRatio < 0.1
  );
}

/**
 * Batch process large operations
 */
export async function batchProcess<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  batchSize: number = 50
): Promise<void> {
  const metricIndex = startProfiling('batchProcess', undefined, items.length);

  try {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(processor));
      
      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    endProfiling(metricIndex);
  } catch (error) {
    console.error('Error in batch processing:', error);
    endProfiling(metricIndex);
    throw error;
  }
}
