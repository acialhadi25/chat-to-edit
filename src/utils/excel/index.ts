/**
 * Excel operations - code split by category
 * This file provides lazy loading for Excel operations to improve initial bundle size
 */

// Re-export basic operations (always loaded)
export {
  cloneExcelData,
  getCellValue,
  setCellValue,
  clearCells,
  applyChanges,
} from "./basicOperations";

// Lazy load data manipulation operations
export const loadDataManipulation = () =>
  import("./dataManipulation").then((m) => ({
    sortData: m.sortData,
    filterData: m.filterData,
    removeDuplicates: m.removeDuplicates,
    fillDown: m.fillDown,
  }));

// Lazy load text operations
export const loadTextOperations = () =>
  import("./textOperations").then((m) => ({
    findReplace: m.findReplace,
    trimCells: m.trimCells,
    transformText: m.transformText,
    splitColumn: m.splitColumn,
    mergeColumns: m.mergeColumns,
  }));

// Lazy load column operations
export const loadColumnOperations = () =>
  import("./columnOperations").then((m) => ({
    addColumn: m.addColumn,
    deleteColumn: m.deleteColumn,
    renameColumn: m.renameColumn,
    copyColumn: m.copyColumn,
    deleteRows: m.deleteRows,
    removeEmptyRows: m.removeEmptyRows,
  }));

// Lazy load analysis operations
export const loadAnalysisOperations = () =>
  import("./analysisOperations").then((m) => ({
    calculateStatistics: m.calculateStatistics,
    createGroupSummary: m.createGroupSummary,
    findCells: m.findCells,
    analyzeDataForCleansing: m.analyzeDataForCleansing,
  }));

// Type definitions for lazy loaded operations
export type DataManipulationOps = Awaited<ReturnType<typeof loadDataManipulation>>;
export type TextOps = Awaited<ReturnType<typeof loadTextOperations>>;
export type ColumnOps = Awaited<ReturnType<typeof loadColumnOperations>>;
export type AnalysisOps = Awaited<ReturnType<typeof loadAnalysisOperations>>;
