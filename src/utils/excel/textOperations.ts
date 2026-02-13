/**
 * Text operations - find/replace, trim, transform, split/merge
 * Lazy loaded for code splitting
 */

import { ExcelData, DataChange, createCellRef } from "@/types/excel";
import { cloneExcelData, getCellValue } from "./basicOperations";

/**
 * Find and replace text
 */
export function findReplace(
  data: ExcelData,
  findText: string,
  replaceText: string,
  options: {
    matchCase?: boolean;
    matchWholeCell?: boolean;
    useRegex?: boolean;
    columns?: number[];
  } = {}
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  const { matchCase = false, matchWholeCell = false, useRegex = false, columns } = options;

  const columnsToSearch = columns || data.headers.map((_, i) => i);

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (const colIndex of columnsToSearch) {
      const cellValue = getCellValue(data, colIndex, rowIndex);
      if (cellValue === null) continue;

      const cellStr = String(cellValue);
      let newValue: string;

      if (useRegex) {
        const flags = matchCase ? "g" : "gi";
        const regex = new RegExp(findText, flags);
        newValue = cellStr.replace(regex, replaceText);
      } else if (matchWholeCell) {
        const matches = matchCase
          ? cellStr === findText
          : cellStr.toLowerCase() === findText.toLowerCase();
        newValue = matches ? replaceText : cellStr;
      } else {
        const searchStr = matchCase ? findText : findText.toLowerCase();
        const targetStr = matchCase ? cellStr : cellStr.toLowerCase();
        newValue = targetStr.includes(searchStr)
          ? cellStr.replace(
              new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), matchCase ? "g" : "gi"),
              replaceText
            )
          : cellStr;
      }

      if (newValue !== cellStr) {
        newData.rows[rowIndex][colIndex] = newValue;
        changes.push({
          cellRef: createCellRef(colIndex, rowIndex),
          before: cellValue,
          after: newValue,
          type: "value",
        });
      }
    }
  }

  return { data: newData, changes };
}

/**
 * Trim whitespace from cells
 */
export function trimCells(
  data: ExcelData,
  columns?: number[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  const columnsToTrim = columns || data.headers.map((_, i) => i);

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (const colIndex of columnsToTrim) {
      const cellValue = getCellValue(data, colIndex, rowIndex);
      if (typeof cellValue === "string") {
        const trimmed = cellValue.trim();
        if (trimmed !== cellValue) {
          newData.rows[rowIndex][colIndex] = trimmed;
          changes.push({
            cellRef: createCellRef(colIndex, rowIndex),
            before: cellValue,
            after: trimmed,
            type: "value",
          });
        }
      }
    }
  }

  return { data: newData, changes };
}

/**
 * Transform text (uppercase, lowercase, capitalize)
 */
export function transformText(
  data: ExcelData,
  colIndex: number,
  transformation: "uppercase" | "lowercase" | "capitalize"
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const cellValue = getCellValue(data, colIndex, rowIndex);
    if (typeof cellValue === "string") {
      let transformed: string;
      switch (transformation) {
        case "uppercase":
          transformed = cellValue.toUpperCase();
          break;
        case "lowercase":
          transformed = cellValue.toLowerCase();
          break;
        case "capitalize":
          transformed = cellValue
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
          break;
      }

      if (transformed !== cellValue) {
        newData.rows[rowIndex][colIndex] = transformed;
        changes.push({
          cellRef: createCellRef(colIndex, rowIndex),
          before: cellValue,
          after: transformed,
          type: "value",
        });
      }
    }
  }

  return { data: newData, changes };
}

/**
 * Split column by delimiter
 */
export function splitColumn(
  data: ExcelData,
  colIndex: number,
  delimiter: string,
  newColumnNames: string[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Add new column headers
  newData.headers.splice(colIndex + 1, 0, ...newColumnNames);

  // Split each row
  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const cellValue = getCellValue(data, colIndex, rowIndex);
    const parts = typeof cellValue === "string" ? cellValue.split(delimiter) : [];

    // Insert new columns
    const newCells = newColumnNames.map((_, i) => parts[i] || null);
    newData.rows[rowIndex].splice(colIndex + 1, 0, ...newCells);
  }

  return { data: newData, changes };
}

/**
 * Merge columns with separator
 */
export function mergeColumns(
  data: ExcelData,
  colIndices: number[],
  separator: string,
  newColumnName: string
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Add new column header at the position of first column
  const firstColIndex = Math.min(...colIndices);
  newData.headers[firstColIndex] = newColumnName;

  // Remove other column headers
  const sortedIndices = [...colIndices].sort((a, b) => b - a);
  sortedIndices.slice(0, -1).forEach((index) => {
    newData.headers.splice(index, 1);
  });

  // Merge each row
  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const values = colIndices
      .map((col) => getCellValue(data, col, rowIndex))
      .filter((v) => v !== null)
      .map(String);
    
    const merged = values.join(separator);
    newData.rows[rowIndex][firstColIndex] = merged;

    // Remove other columns
    sortedIndices.slice(0, -1).forEach((index) => {
      newData.rows[rowIndex].splice(index, 1);
    });
  }

  return { data: newData, changes };
}
