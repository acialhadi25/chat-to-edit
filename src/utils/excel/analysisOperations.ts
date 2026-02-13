/**
 * Analysis operations - statistics, summaries, grouping
 * Lazy loaded for code splitting
 */

import { ExcelData } from "@/types/excel";
import { getCellValue } from "./basicOperations";

/**
 * Calculate statistics for a column
 */
export function calculateStatistics(
  data: ExcelData,
  colIndex: number
): {
  sum: number;
  average: number;
  count: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
} {
  const values = data.rows
    .map((_, rowIndex) => getCellValue(data, colIndex, rowIndex))
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) {
    return { sum: 0, average: 0, count: 0, min: 0, max: 0, median: 0, stdDev: 0 };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const sorted = [...values].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { sum, average, count: values.length, min, max, median, stdDev };
}

/**
 * Create group summary
 */
export function createGroupSummary(
  data: ExcelData,
  groupByCol: number,
  aggregateCol: number,
  aggregation: "sum" | "average" | "count" | "min" | "max"
): ExcelData {
  const groups = new Map<string, number[]>();

  // Group values
  data.rows.forEach((_row, rowIndex) => {
    const groupKey = String(getCellValue(data, groupByCol, rowIndex) ?? "");
    const value = getCellValue(data, aggregateCol, rowIndex);
    
    if (typeof value === "number") {
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(value);
    }
  });

  // Calculate aggregations
  const summaryRows: (string | number | null)[][] = [];
  groups.forEach((values, groupKey) => {
    let result: number;
    switch (aggregation) {
      case "sum":
        result = values.reduce((acc, val) => acc + val, 0);
        break;
      case "average":
        result = values.reduce((acc, val) => acc + val, 0) / values.length;
        break;
      case "count":
        result = values.length;
        break;
      case "min":
        result = Math.min(...values);
        break;
      case "max":
        result = Math.max(...values);
        break;
    }
    summaryRows.push([groupKey, result]);
  });

  return {
    headers: [data.headers[groupByCol], `${aggregation}(${data.headers[aggregateCol]})`],
    rows: summaryRows,
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    fileName: `${data.fileName || "summary"}_grouped`,
    sheets: ["Summary"],
    currentSheet: "Summary",
  };
}

/**
 * Find cells matching criteria
 */
export function findCells(
  data: ExcelData,
  searchValue: string | number,
  options: {
    matchCase?: boolean;
    matchWholeCell?: boolean;
    columns?: number[];
  } = {}
): Array<{ col: number; row: number; value: string | number | null }> {
  const { matchCase = false, matchWholeCell = false, columns } = options;
  const results: Array<{ col: number; row: number; value: string | number | null }> = [];

  const columnsToSearch = columns || data.headers.map((_, i) => i);

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (const colIndex of columnsToSearch) {
      const cellValue = getCellValue(data, colIndex, rowIndex);
      if (cellValue === null) continue;

      let matches = false;
      if (typeof searchValue === "number" && typeof cellValue === "number") {
        matches = cellValue === searchValue;
      } else {
        const cellStr = String(cellValue);
        const searchStr = String(searchValue);
        
        if (matchWholeCell) {
          matches = matchCase
            ? cellStr === searchStr
            : cellStr.toLowerCase() === searchStr.toLowerCase();
        } else {
          matches = matchCase
            ? cellStr.includes(searchStr)
            : cellStr.toLowerCase().includes(searchStr.toLowerCase());
        }
      }

      if (matches) {
        results.push({ col: colIndex, row: rowIndex, value: cellValue });
      }
    }
  }

  return results;
}

/**
 * Analyze data for cleansing opportunities
 */
export function analyzeDataForCleansing(data: ExcelData): {
  emptyRows: number;
  duplicateRows: number;
  inconsistentFormats: number;
  missingValues: number;
} {
  let emptyRows = 0;
  let duplicateRows = 0;
  let missingValues = 0;

  const seen = new Set<string>();
  
  data.rows.forEach((row) => {
    // Check for empty rows
    if (row.every((cell) => cell === null || cell === "")) {
      emptyRows++;
    }

    // Check for duplicates
    const rowKey = row.map((cell) => String(cell ?? "")).join("|");
    if (seen.has(rowKey)) {
      duplicateRows++;
    }
    seen.add(rowKey);

    // Check for missing values
    row.forEach((cell) => {
      if (cell === null || cell === "") {
        missingValues++;
      }
    });
  });

  return {
    emptyRows,
    duplicateRows,
    inconsistentFormats: 0, // Placeholder
    missingValues,
  };
}
