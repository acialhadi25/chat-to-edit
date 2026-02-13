/**
 * Column operations - add, delete, rename, copy
 * Lazy loaded for code splitting
 */

import { ExcelData, DataChange } from "@/types/excel";
import { cloneExcelData } from "./basicOperations";

/**
 * Add a new column
 */
export function addColumn(
  data: ExcelData,
  columnName: string,
  position: number,
  defaultValue: string | number | null = null
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Add header
  newData.headers.splice(position, 0, columnName);

  // Add default value to each row
  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    newData.rows[rowIndex].splice(position, 0, defaultValue);
  }

  return { data: newData, changes };
}

/**
 * Delete a column
 */
export function deleteColumn(
  data: ExcelData,
  colIndex: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Remove header
  newData.headers.splice(colIndex, 1);

  // Remove column from each row
  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    newData.rows[rowIndex].splice(colIndex, 1);
  }

  return { data: newData, changes };
}

/**
 * Rename a column
 */
export function renameColumn(
  data: ExcelData,
  colIndex: number,
  newName: string
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  newData.headers[colIndex] = newName;

  return { data: newData, changes };
}

/**
 * Copy a column
 */
export function copyColumn(
  data: ExcelData,
  sourceColIndex: number,
  newColumnName: string,
  position: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Add new header
  newData.headers.splice(position, 0, newColumnName);

  // Copy values to new column
  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const value = data.rows[rowIndex][sourceColIndex];
    newData.rows[rowIndex].splice(position, 0, value);
  }

  return { data: newData, changes };
}

/**
 * Delete rows
 */
export function deleteRows(
  data: ExcelData,
  rowIndices: number[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Sort in descending order to avoid index shifting
  const sortedIndices = [...rowIndices].sort((a, b) => b - a);

  sortedIndices.forEach((rowIndex) => {
    if (rowIndex >= 0 && rowIndex < newData.rows.length) {
      newData.rows.splice(rowIndex, 1);
    }
  });

  return { data: newData, changes };
}

/**
 * Remove empty rows
 */
export function removeEmptyRows(
  data: ExcelData
): { data: ExcelData; removedRows: number[] } {
  const newData = cloneExcelData(data);
  const removedRows: number[] = [];

  newData.rows = data.rows.filter((row, index) => {
    const isEmpty = row.every((cell) => isEmptyCell(cell));
    if (isEmpty) {
      removedRows.push(index + 2); // Excel row number (header is row 1)
    }
    return !isEmpty;
  });

  return { data: newData, removedRows };
}

function isEmptyCell(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}
