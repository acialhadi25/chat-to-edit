/**
 * Data manipulation operations - sorting, filtering, deduplication
 * Lazy loaded for code splitting
 */

import { ExcelData, DataChange } from "@/types/excel";
import { cloneExcelData, getCellValue } from "./basicOperations";

/**
 * Sort data by column
 */
export function sortData(
  data: ExcelData,
  colIndex: number,
  order: "asc" | "desc" = "asc"
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  const sortedIndices = data.rows
    .map((_, index) => index)
    .sort((a, b) => {
      const valA = getCellValue(data, colIndex, a);
      const valB = getCellValue(data, colIndex, b);

      if (valA === null && valB === null) return 0;
      if (valA === null) return order === "asc" ? 1 : -1;
      if (valB === null) return order === "asc" ? -1 : 1;

      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return order === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });

  newData.rows = sortedIndices.map((index) => data.rows[index]);

  return { data: newData, changes };
}

/**
 * Filter data by condition
 */
export function filterData(
  data: ExcelData,
  colIndex: number,
  condition: (value: string | number | null) => boolean
): { data: ExcelData; removedRows: number[] } {
  const newData = cloneExcelData(data);
  const removedRows: number[] = [];

  newData.rows = data.rows.filter((row, index) => {
    const value = row[colIndex] ?? null;
    const keep = condition(value);
    if (!keep) {
      removedRows.push(index + 2); // Excel row number
    }
    return keep;
  });

  return { data: newData, removedRows };
}

/**
 * Remove duplicate rows
 */
export function removeDuplicates(
  data: ExcelData,
  colIndices: number[]
): { data: ExcelData; removedRows: number[] } {
  const newData = cloneExcelData(data);
  const seen = new Set<string>();
  const removedRows: number[] = [];

  newData.rows = data.rows.filter((row, index) => {
    const key = colIndices.map((col) => String(row[col] ?? "")).join("|");
    if (seen.has(key)) {
      removedRows.push(index + 2);
      return false;
    }
    seen.add(key);
    return true;
  });

  return { data: newData, removedRows };
}

/**
 * Fill down values in a column
 */
export function fillDown(
  data: ExcelData,
  colIndex: number,
  startRow: number,
  endRow: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  const sourceValue = getCellValue(data, colIndex, startRow);

  for (let row = startRow + 1; row <= endRow; row++) {
    const before = getCellValue(data, colIndex, row);
    if (before !== sourceValue) {
      newData.rows[row][colIndex] = sourceValue;
      changes.push({
        cellRef: `${getColumnLetter(colIndex)}${row + 2}`,
        before,
        after: sourceValue,
        type: "value",
      });
    }
  }

  return { data: newData, changes };
}

function getColumnLetter(col: number): string {
  let letter = "";
  let num = col + 1;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}
