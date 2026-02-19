import { ExcelData, DataChange, AIAction } from '@/types/excel';

/**
 * Creates a deep copy of the Excel data to ensure immutability.
 * This is crucial for state management and undo/redo functionality.
 * FIX: This function is now robust against partially undefined data during initialization.
 */
export function cloneExcelData(data: ExcelData | null): ExcelData | null {
  if (!data) return null;

  return {
    fileName: data.fileName || '',
    currentSheet: data.currentSheet || 'Sheet1',
    sheets: Array.isArray(data.sheets) ? [...data.sheets] : [],
    headers: Array.isArray(data.headers) ? [...data.headers] : [],
    rows: Array.isArray(data.rows)
      ? data.rows.map((row) => (Array.isArray(row) ? [...row] : []))
      : [],
    columnWidths: Array.isArray(data.columnWidths) ? [...data.columnWidths] : [],
    selectedCells: Array.isArray(data.selectedCells) ? [...data.selectedCells] : [],
    pendingChanges: Array.isArray(data.pendingChanges) ? [...data.pendingChanges] : [],
    cellStyles: data.cellStyles ? JSON.parse(JSON.stringify(data.cellStyles)) : {},
    formulas: data.formulas ? JSON.parse(JSON.stringify(data.formulas)) : {},
  };
}

/**
 * Analyzes the current data for potential data cleansing operations.
 * This is a simplified example; a real implementation would be more complex.
 */
export function analyzeDataForCleansing(data: ExcelData): string[] {
  const issues: string[] = [];
  const nonEmptyRows = (data.rows || []).filter((row) =>
    row.some((cell) => cell !== null && cell !== '')
  );
  if ((data.rows || []).length > nonEmptyRows.length) {
    issues.push(`Found ${(data.rows || []).length - nonEmptyRows.length} empty rows.`);
  }

  let extraSpacesCount = 0;
  (data.rows || []).forEach((row) => {
    (row || []).forEach((cell) => {
      if (typeof cell === 'string' && cell.trim() !== cell) {
        extraSpacesCount++;
      }
    });
  });
  if (extraSpacesCount > 0) {
    issues.push(`Found ${extraSpacesCount} cells with leading/trailing spaces.`);
  }

  return issues;
}
