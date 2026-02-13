/**
 * Basic Excel operations - core functionality for cell manipulation
 * Lazy loaded for code splitting
 */

import {
  ExcelData,
  DataChange,
  createCellRef,
} from "@/types/excel";

/**
 * Clone excel data for immutability
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
 * Get cell value
 */
export function getCellValue(
  data: ExcelData,
  col: number,
  row: number
): string | number | null {
  if (row < 0 || row >= data.rows.length) return null;
  if (col < 0 || col >= data.headers.length) return null;
  return data.rows[row][col] ?? null;
}

/**
 * Set cell value and return changes
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
    change: { cellRef, before, after: value, type: "value" },
  };
}

/**
 * Clear cells in a range
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
        changes.push({ cellRef, before, after: null, type: "value" });
      }
      
      if (newData.formulas[cellRef]) {
        delete newData.formulas[cellRef];
      }
    }
  }

  return { data: newData, changes };
}

/**
 * Apply pending changes to data
 */
export function applyChanges(
  data: ExcelData,
  changes: DataChange[]
): ExcelData {
  const newData = cloneExcelData(data);

  changes.forEach((change) => {
    const { col, row } = parseCellRef(change.cellRef);
    if (change.type === "value") {
      newData.rows[row][col] = change.after;
    } else if (change.type === "formula") {
      newData.formulas[change.cellRef] = change.after as string;
    }
  });

  return newData;
}

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
