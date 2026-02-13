import { ExcelData, getColumnIndex } from "@/types/excel";
import { safeEvaluateMath } from "@/utils/safeMathParser";

/**
 * Get cell value from a cell reference like "B2"
 */
export function getCellValueFromRef(ref: string, data: ExcelData): number | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  const colIndex = getColumnIndex(match[1].toUpperCase());
  const rowIndex = parseInt(match[2], 10) - 2; // Convert to 0-based data index
  
  if (rowIndex < 0 || rowIndex >= data.rows.length) return null;
  if (colIndex < 0 || colIndex >= data.headers.length) return null;
  
  const cellRef = `${match[1].toUpperCase()}${match[2]}`;
  const existingFormula = data.formulas[cellRef];
  if (existingFormula && existingFormula.startsWith("=")) {
    try {
      let expr = existingFormula.slice(1).toUpperCase();
      expr = expr.replace(/[A-Z]+\d+/g, (innerRef) => {
        const v = getCellValueFromRef(innerRef, data);
        return v !== null ? String(v) : "0";
      });
      if (!/^[\d+\-*/().\s]+$/.test(expr)) {
        // Non-arithmetic or unsupported expression; fallback to raw value below
      } else {
        const result = safeEvaluateMath(expr);
        if (result !== null) {
          return result;
        }
      }
    } catch {
      // Fallback to raw value
    }
  }

  const value = data.rows[rowIndex][colIndex];
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  
  // Try to parse as number (remove currency symbols, commas, etc.)
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get string value from a cell reference or literal
 */
export function getStringValue(ref: string, data: ExcelData): string {
  // Check if it's a cell reference
  if (/^[A-Z]+\d+$/i.test(ref)) {
    const match = ref.match(/^([A-Z]+)(\d+)$/i);
    if (match) {
      const colIndex = getColumnIndex(match[1].toUpperCase());
      const rowIndex = parseInt(match[2], 10) - 2;
      
      if (rowIndex >= 0 && rowIndex < data.rows.length && colIndex >= 0 && colIndex < data.headers.length) {
        const value = data.rows[rowIndex][colIndex];
        return value !== null && value !== undefined ? String(value) : "";
      }
    }
    return "";
  }
  
  // It's a literal (remove quotes if present)
  return ref.replace(/^["']|["']$/g, "");
}

/**
 * Parse a range like "A2:A10" and return all cell references
 */
export function expandRange(range: string): string[] {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return [];
  
  const startCol = getColumnIndex(match[1].toUpperCase());
  const startRow = parseInt(match[2], 10);
  const endCol = getColumnIndex(match[3].toUpperCase());
  const endRow = parseInt(match[4], 10);
  
  const cells: string[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      let letter = "";
      let num = col;
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      cells.push(`${letter}${row}`);
    }
  }
  return cells;
}
