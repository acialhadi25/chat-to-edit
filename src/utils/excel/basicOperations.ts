/**
 * Basic Excel operations - core functionality for cell manipulation
 * Lazy loaded for code splitting
 */

import { ExcelData, DataChange, createCellRef } from '@/types/excel';

/**
 * Creates a deep clone of Excel data for immutability.
 * Ensures all nested arrays and objects are copied to prevent mutations.
 *
 * @param data - The Excel data to clone
 * @returns A new ExcelData object with all properties deeply cloned
 * @example
 * const cloned = cloneExcelData(originalData);
 * cloned.rows[0][0] = 'new value'; // Does not affect originalData
 */
export function cloneExcelData(data: ExcelData): ExcelData {
  return {
    ...data,
    headers: [...data.headers],
    rows: data.rows.map((row) => [...row]),
    formulas: { ...data.formulas },
    selectedCells: [...data.selectedCells],
    pendingChanges: [...data.pendingChanges],
    allSheets: data.allSheets ? { ...data.allSheets } : undefined,
    cellStyles: { ...data.cellStyles },
  };
}

/**
 * Retrieves the value of a cell at the specified column and row.
 * Returns null if the coordinates are out of bounds.
 *
 * @param data - The Excel data to read from
 * @param col - Zero-based column index
 * @param row - Zero-based row index
 * @returns The cell value (string, number, or null)
 * @example
 * const value = getCellValue(data, 0, 0); // Gets value from A1
 */
export function getCellValue(data: ExcelData, col: number, row: number): string | number | null {
  if (row < 0 || row >= data.rows.length) return null;
  if (col < 0 || col >= data.headers.length) return null;
  return data.rows[row][col] ?? null;
}

/**
 * Sets a cell value and returns the modified data with change tracking.
 * Automatically removes any formula at the cell location.
 *
 * @param data - The Excel data to modify
 * @param col - Zero-based column index
 * @param row - Zero-based row index
 * @param value - The new value to set (string, number, or null)
 * @returns Object containing the modified data and the change record
 * @example
 * const { data: newData, change } = setCellValue(data, 0, 0, 'Hello');
 */
export function setCellValue(
  data: ExcelData,
  col: number,
  row: number,
  value: string | number | null
): { data: ExcelData; change: DataChange } {
  const newData = cloneExcelData(data);
  const cellRef = createCellRef(col, row);
  const before = getCellValue(data, col, row);

  newData.rows[row][col] = value;

  // Remove any formula at this cell if setting a value
  if (newData.formulas[cellRef]) {
    delete newData.formulas[cellRef];
  }

  return {
    data: newData,
    change: { cellRef, before, after: value, type: 'value' },
  };
}

/**
 * Clears all cells in a specified rectangular range.
 * Removes both values and formulas from the affected cells.
 *
 * @param data - The Excel data to modify
 * @param startCol - Zero-based starting column index
 * @param startRow - Zero-based starting row index
 * @param endCol - Zero-based ending column index (inclusive)
 * @param endRow - Zero-based ending row index (inclusive)
 * @returns Object containing the modified data and array of changes
 * @example
 * const { data: newData, changes } = clearCells(data, 0, 0, 2, 5);
 */
export function clearCells(
  data: ExcelData,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellRef = createCellRef(col, row);
      const before = getCellValue(data, col, row);

      if (before !== null) {
        newData.rows[row][col] = null;
        changes.push({ cellRef, before, after: null, type: 'value' });
      }

      if (newData.formulas[cellRef]) {
        delete newData.formulas[cellRef];
      }
    }
  }

  return { data: newData, changes };
}

/**
 * Applies a batch of pending changes to the Excel data.
 * Supports both value changes and formula changes.
 *
 * @param data - The Excel data to modify
 * @param changes - Array of DataChange objects to apply
 * @returns The modified Excel data with all changes applied
 * @example
 * const changes = [
 *   { cellRef: 'A1', before: null, after: 'Hello', type: 'value' },
 *   { cellRef: 'B1', before: null, after: '=SUM(A1:A10)', type: 'formula' }
 * ];
 * const newData = applyChanges(data, changes);
 */
export function applyChanges(data: ExcelData, changes: DataChange[]): ExcelData {
  const newData = cloneExcelData(data);

  changes.forEach((change) => {
    const { col, row } = parseCellRef(change.cellRef);
    if (change.type === 'value') {
      newData.rows[row][col] = change.after;
    } else if (change.type === 'formula') {
      newData.formulas[change.cellRef] = change.after as string;
    }
  });

  return newData;
}

/**
 * Parses a cell reference string (e.g., "A1", "B2") into column and row indices.
 *
 * @param cellRef - Cell reference in Excel format (e.g., "A1", "AB10")
 * @returns Object with zero-based col and row indices
 * @throws Error if the cell reference format is invalid
 * @internal
 */
function parseCellRef(cellRef: string): { col: number; row: number } {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid cell reference: ${cellRef}`);

  const colLetter = match[1];
  const row = parseInt(match[2], 10) - 2; // Convert to 0-based row index

  let col = 0;
  for (let i = 0; i < colLetter.length; i++) {
    col = col * 26 + (colLetter.charCodeAt(i) - 64);
  }
  col -= 1; // Convert to 0-based column index

  return { col, row };
}
