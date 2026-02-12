import { 
  ExcelData, 
  DataChange, 
  getColumnLetter, 
  createCellRef, 
  parseCellRef 
} from "@/types/excel";
import { evaluateFormula } from "@/utils/formulas";
import { expandRange } from "@/utils/formulas/helpers";

// Clone excel data for immutability
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

// Get cell value
export function getCellValue(
  data: ExcelData,
  col: number,
  row: number
): string | number | null {
  if (row < 0 || row >= data.rows.length) return null;
  if (col < 0 || col >= data.headers.length) return null;
  return data.rows[row][col] ?? null;
}

// Set cell value and return changes
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

// Set formula at cell
export function setCellFormula(
  data: ExcelData,
  col: number,
  row: number,
  formula: string
): { data: ExcelData; change: DataChange } {
  const newData = cloneExcelData(data);
  const cellRef = createCellRef(col, row);
  const before = newData.formulas[cellRef] || getCellValue(data, col, row);

  newData.formulas[cellRef] = formula;

  return {
    data: newData,
    change: { cellRef, before, after: formula, type: "formula" },
  };
}

// Apply formula to entire column
export function applyFormulaToColumn(
  data: ExcelData,
  colIndex: number,
  formulaTemplate: string
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const firstCol = newData.rows[rowIndex]?.[0];
    if (
      typeof firstCol === "string" &&
      ["SUM", "AVERAGE", "COUNT", "MIN", "MAX", "MEDIAN", "STD_DEV"].includes(
        firstCol.toUpperCase()
      )
    ) {
      continue;
    }
     const actualRow = rowIndex + 2; // Excel rows: header=1, data starts at 2
    const formula = formulaTemplate.replace(/\{row\}/g, String(actualRow));
     const cellRef = `${getColumnLetter(colIndex)}${actualRow}`;
    const before = newData.formulas[cellRef] || getCellValue(data, colIndex, rowIndex);

    newData.formulas[cellRef] = formula;
    changes.push({ cellRef, before, after: formula, type: "formula" });
  }

  return { data: newData, changes };
}

// Find and replace in data
export function findReplace(
  data: ExcelData,
  find: string,
  replace: string,
  options: { 
    caseSensitive?: boolean; 
    wholeCell?: boolean; 
    columns?: number[];
  } = {}
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  const { caseSensitive = false, wholeCell = false, columns } = options;

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < data.headers.length; colIndex++) {
      if (columns && !columns.includes(colIndex)) continue;

      const cellValue = newData.rows[rowIndex][colIndex];
      if (cellValue === null || cellValue === undefined) continue;

      const strValue = String(cellValue);
      const searchValue = caseSensitive ? find : find.toLowerCase();
      const compareValue = caseSensitive ? strValue : strValue.toLowerCase();

      let shouldReplace = false;
      if (wholeCell) {
        shouldReplace = compareValue === searchValue;
      } else {
        shouldReplace = compareValue.includes(searchValue);
      }

      if (shouldReplace) {
        const cellRef = createCellRef(colIndex, rowIndex);
        let newValue: string;
        
        if (wholeCell) {
          newValue = replace;
        } else {
          const regex = new RegExp(find, caseSensitive ? "g" : "gi");
          newValue = strValue.replace(regex, replace);
        }

        changes.push({
          cellRef,
          before: cellValue,
          after: newValue,
          type: "value",
        });
        newData.rows[rowIndex][colIndex] = newValue;
      }
    }
  }

  return { data: newData, changes };
}

// Trim whitespace from cells
export function trimCells(
  data: ExcelData,
  columns?: number[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < data.headers.length; colIndex++) {
      if (columns && !columns.includes(colIndex)) continue;

      const cellValue = newData.rows[rowIndex][colIndex];
      if (typeof cellValue !== "string") continue;

      const trimmed = cellValue.trim().replace(/\s+/g, " ");
      if (trimmed !== cellValue) {
        const cellRef = createCellRef(colIndex, rowIndex);
        changes.push({
          cellRef,
          before: cellValue,
          after: trimmed,
          type: "value",
        });
        newData.rows[rowIndex][colIndex] = trimmed;
      }
    }
  }

  return { data: newData, changes };
}

// Helper to check if a cell value is empty (null, undefined, or whitespace-only string)
export function isEmptyCell(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    return value.trim() === "";
  }
  // Number 0 is NOT empty
  return false;
}

// Remove empty rows - a row is empty if ALL cells are empty/whitespace
export function removeEmptyRows(
  data: ExcelData
): { data: ExcelData; changes: DataChange[]; removedRows: number[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  const removedRows: number[] = [];

  const filteredRows = data.rows.filter((row, index) => {
    // Check if ALL cells in row are empty (using improved isEmptyCell helper)
    const isEmpty = row.every((cell) => isEmptyCell(cell));
    
    if (isEmpty) {
      removedRows.push(index + 2); // Excel row number (1-based, header=1, data starts at 2)
      // Record changes for each non-null cell in removed row (for tracking)
      row.forEach((cell, colIndex) => {
        changes.push({
          cellRef: createCellRef(colIndex, index),
          before: cell,
          after: null,
          type: "value",
        });
      });
    }
    return !isEmpty;
  });

  newData.rows = filteredRows;
  return { data: newData, changes, removedRows };
}

// Transform text (uppercase, lowercase, title case)
export function transformText(
  data: ExcelData,
  transform: "uppercase" | "lowercase" | "titlecase",
  columns?: number[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < data.headers.length; colIndex++) {
      if (columns && !columns.includes(colIndex)) continue;

      const cellValue = newData.rows[rowIndex][colIndex];
      if (typeof cellValue !== "string") continue;

      let transformed: string;
      switch (transform) {
        case "uppercase":
          transformed = cellValue.toUpperCase();
          break;
        case "lowercase":
          transformed = cellValue.toLowerCase();
          break;
        case "titlecase":
          transformed = cellValue.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          break;
      }

      if (transformed !== cellValue) {
        const cellRef = createCellRef(colIndex, rowIndex);
        changes.push({
          cellRef,
          before: cellValue,
          after: transformed,
          type: "value",
        });
        newData.rows[rowIndex][colIndex] = transformed;
      }
    }
  }

  return { data: newData, changes };
}

// Add new column
export function addColumn(
  data: ExcelData,
  columnName: string,
  position?: number
): { data: ExcelData } {
  const newData = cloneExcelData(data);
  const insertAt = position ?? data.headers.length;

  // Add header
  newData.headers = [
    ...newData.headers.slice(0, insertAt),
    columnName,
    ...newData.headers.slice(insertAt),
  ];

  // Add empty cell to each row
  newData.rows = newData.rows.map((row) => [
    ...row.slice(0, insertAt),
    null,
    ...row.slice(insertAt),
  ]);

  return { data: newData };
}

// Delete column
export function deleteColumn(
  data: ExcelData,
  colIndex: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  // Record changes
  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const cellValue = data.rows[rowIndex][colIndex];
    if (cellValue !== null && cellValue !== undefined) {
      changes.push({
        cellRef: createCellRef(colIndex, rowIndex),
        before: cellValue,
        after: null,
        type: "value",
      });
    }
  }

  // Remove header and cells
  newData.headers = [
    ...newData.headers.slice(0, colIndex),
    ...newData.headers.slice(colIndex + 1),
  ];
  newData.rows = newData.rows.map((row) => [
    ...row.slice(0, colIndex),
    ...row.slice(colIndex + 1),
  ]);

  return { data: newData, changes };
}

// Delete rows by indices
export function deleteRows(
  data: ExcelData,
  rowIndices: number[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  const sortedIndices = [...rowIndices].sort((a, b) => b - a);

  for (const rowIndex of sortedIndices) {
    if (rowIndex < 0 || rowIndex >= data.rows.length) continue;

    // Record changes
    data.rows[rowIndex].forEach((cell, colIndex) => {
      if (cell !== null && cell !== undefined) {
        changes.push({
          cellRef: createCellRef(colIndex, rowIndex),
          before: cell,
          after: null,
          type: "value",
        });
      }
    });

    newData.rows.splice(rowIndex, 1);
  }

  return { data: newData, changes };
}

// Clear cell values and formulas
export function clearCells(
  data: ExcelData,
  refs: string[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (const ref of refs) {
    const parsed = parseCellRef(ref);
    if (!parsed) continue;

    const before = newData.formulas[ref] || newData.rows[parsed.row][parsed.col];
    
    // Clear formula if exists
    if (newData.formulas[ref]) {
      delete newData.formulas[ref];
    }
    
    // Clear cell value
    newData.rows[parsed.row][parsed.col] = null;
    
    changes.push({
      cellRef: ref,
      before,
      after: null,
      type: "value",
    });
  }

  return { data: newData, changes };
}

// Apply pending changes to data
export function applyChanges(
  data: ExcelData,
  changes: DataChange[]
): ExcelData {
  const newData = cloneExcelData(data);

  for (const change of changes) {
    const parsed = parseCellRef(change.cellRef);
    if (!parsed) continue;

    if (change.type === "formula" || (typeof change.after === "string" && change.after.startsWith("="))) {
      newData.formulas[change.cellRef] = change.after as string;
    } else {
      newData.rows[parsed.row][parsed.col] = change.after;
    }
  }

  newData.pendingChanges = [];
  return newData;
}

export function removeFormulas(
  data: ExcelData,
  refs: string[]
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  const uniqueRefs = [...new Set(refs)];
  for (const ref of uniqueRefs) {
    const parsed = parseCellRef(ref);
    if (!parsed) continue;
    const existing = newData.formulas[ref];
    if (!existing) continue;
    const result = evaluateFormula(existing, newData);
    newData.rows[parsed.row][parsed.col] = result !== null ? result : null;
    delete newData.formulas[ref];
    changes.push({
      cellRef: ref,
      before: existing,
      after: result !== null ? result : null,
      type: "value",
    });
  }
  return { data: newData, changes };
}

// Find cells matching a condition
export function findCells(
  data: ExcelData,
  predicate: (value: string | number | null, col: number, row: number) => boolean
): { cellRef: string; value: string | number | null }[] {
  const results: { cellRef: string; value: string | number | null }[] = [];

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < data.headers.length; colIndex++) {
      const value = data.rows[rowIndex][colIndex];
      if (predicate(value, colIndex, rowIndex)) {
        results.push({
          cellRef: createCellRef(colIndex, rowIndex),
          value,
        });
      }
    }
  }

  return results;
}

// Analyze data for cleansing opportunities
export function analyzeDataForCleansing(
  data: ExcelData
): {
  emptyRows: number[];
  cellsWithExtraSpaces: { cellRef: string; value: string }[];
  duplicateRows: number[][];
   totalCells: number;
   emptyCells: number;
} {
  const emptyRows: number[] = [];
  const cellsWithExtraSpaces: { cellRef: string; value: string }[] = [];
  const rowHashes = new Map<string, number[]>();
   let totalCells = 0;
   let emptyCells = 0;

  for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
    const row = data.rows[rowIndex];
    
    // Check empty rows using improved isEmptyCell helper
    const isEmpty = row.every((cell) => isEmptyCell(cell));
    if (isEmpty) {
      emptyRows.push(rowIndex + 2);
    }

    // Check extra spaces
    row.forEach((cell, colIndex) => {
       totalCells++;
       if (cell === null || cell === undefined || cell === "") {
         emptyCells++;
       }
      if (typeof cell === "string") {
        if (cell !== cell.trim() || /\s{2,}/.test(cell)) {
          cellsWithExtraSpaces.push({
            cellRef: createCellRef(colIndex, rowIndex),
            value: cell,
          });
        }
      }
    });

    // Check duplicates
    const rowHash = JSON.stringify(row);
    if (!rowHashes.has(rowHash)) {
      rowHashes.set(rowHash, []);
    }
    rowHashes.get(rowHash)!.push(rowIndex + 2);
  }

  const duplicateRows = Array.from(rowHashes.values()).filter(
    (rows) => rows.length > 1
  );

   return { emptyRows, cellsWithExtraSpaces, duplicateRows, totalCells, emptyCells };
}

// Sort data by column
export function sortData(
  data: ExcelData,
  colIndex: number,
  direction: "asc" | "desc"
): { data: ExcelData } {
  const newData = cloneExcelData(data);
  
  newData.rows = [...newData.rows].sort((a, b) => {
    const valA = a[colIndex];
    const valB = b[colIndex];
    
    // Handle null/undefined
    if (valA === null || valA === undefined) return direction === "asc" ? 1 : -1;
    if (valB === null || valB === undefined) return direction === "asc" ? -1 : 1;
    
    // Try numeric comparison first
    const numA = typeof valA === "number" ? valA : parseFloat(String(valA).replace(/[^0-9.-]/g, ""));
    const numB = typeof valB === "number" ? valB : parseFloat(String(valB).replace(/[^0-9.-]/g, ""));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === "asc" ? numA - numB : numB - numA;
    }
    
    // String comparison
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    
    if (direction === "asc") {
      return strA.localeCompare(strB);
    } else {
      return strB.localeCompare(strA);
    }
  });
  
  return { data: newData };
}

// Filter data by condition
export function filterData(
  data: ExcelData,
  colIndex: number,
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "not_contains" | "empty" | "not_empty",
  value?: string | number
): { data: ExcelData; removedCount: number } {
  const newData = cloneExcelData(data);
  const originalCount = newData.rows.length;
  
  newData.rows = newData.rows.filter((row) => {
    const cellValue = row[colIndex];
    
    switch (operator) {
      case "empty":
        return isEmptyCell(cellValue);
      case "not_empty":
        return !isEmptyCell(cellValue);
      case "contains":
        return String(cellValue ?? "").toLowerCase().includes(String(value ?? "").toLowerCase());
      case "not_contains":
        return !String(cellValue ?? "").toLowerCase().includes(String(value ?? "").toLowerCase());
      case "=":
        return String(cellValue) === String(value);
      case "!=":
        return String(cellValue) !== String(value);
      case ">": {
        const numCell = typeof cellValue === "number" ? cellValue : parseFloat(String(cellValue));
        const numVal = typeof value === "number" ? value : parseFloat(String(value));
        return !isNaN(numCell) && !isNaN(numVal) && numCell > numVal;
      }
      case "<": {
        const numCell = typeof cellValue === "number" ? cellValue : parseFloat(String(cellValue));
        const numVal = typeof value === "number" ? value : parseFloat(String(value));
        return !isNaN(numCell) && !isNaN(numVal) && numCell < numVal;
      }
      case ">=": {
        const numCell = typeof cellValue === "number" ? cellValue : parseFloat(String(cellValue));
        const numVal = typeof value === "number" ? value : parseFloat(String(value));
        return !isNaN(numCell) && !isNaN(numVal) && numCell >= numVal;
      }
      case "<=": {
        const numCell = typeof cellValue === "number" ? cellValue : parseFloat(String(cellValue));
        const numVal = typeof value === "number" ? value : parseFloat(String(value));
        return !isNaN(numCell) && !isNaN(numVal) && numCell <= numVal;
      }
      default:
        return true;
    }
  });
  
  return { data: newData, removedCount: originalCount - newData.rows.length };
}

// Remove duplicate rows
export function removeDuplicates(
  data: ExcelData,
  columns?: number[] // If not specified, check all columns
): { data: ExcelData; removedCount: number } {
  const newData = cloneExcelData(data);
  const seenHashes = new Set<string>();
  const originalCount = newData.rows.length;
  
  newData.rows = newData.rows.filter((row) => {
    // Create hash based on specified columns or all columns
    const hashParts = columns 
      ? columns.map(i => JSON.stringify(row[i] ?? ""))
      : row.map(cell => JSON.stringify(cell ?? ""));
    const hash = hashParts.join("|");
    
    if (seenHashes.has(hash)) {
      return false; // Duplicate, filter out
    }
    
    seenHashes.add(hash);
    return true;
  });
  
  return { data: newData, removedCount: originalCount - newData.rows.length };
}

// Fill down - fill empty cells with value above
export function fillDown(
  data: ExcelData,
  colIndex: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  
  let lastValue: string | number | null = null;
  
  for (let rowIndex = 0; rowIndex < newData.rows.length; rowIndex++) {
    const cellValue = newData.rows[rowIndex][colIndex];
    
    if (isEmptyCell(cellValue)) {
      if (lastValue !== null) {
        const cellRef = createCellRef(colIndex, rowIndex);
        changes.push({
          cellRef,
          before: cellValue,
          after: lastValue,
          type: "value",
        });
        newData.rows[rowIndex][colIndex] = lastValue;
      }
    } else {
      lastValue = cellValue;
    }
  }
  
  return { data: newData, changes };
}

// Split column by delimiter
export function splitColumn(
  data: ExcelData,
  colIndex: number,
  delimiter: string,
  maxParts: number = 2
): { data: ExcelData; newColumnNames: string[] } {
  const newData = cloneExcelData(data);
  const originalHeader = newData.headers[colIndex];
  const newColumnNames: string[] = [];
  
  // Create new column names
  for (let i = 1; i <= maxParts; i++) {
    newColumnNames.push(`${originalHeader}_${i}`);
  }
  
  // Insert new headers after the original column
  newData.headers = [
    ...newData.headers.slice(0, colIndex + 1),
    ...newColumnNames.slice(1), // Skip first as we'll use original column
    ...newData.headers.slice(colIndex + 1),
  ];
  
  // Rename original column
  newData.headers[colIndex] = newColumnNames[0];
  
  // Split data in each row
  newData.rows = newData.rows.map((row) => {
    const cellValue = row[colIndex];
    const parts = cellValue !== null && cellValue !== undefined
      ? String(cellValue).split(delimiter, maxParts)
      : [];
    
    // Pad with nulls if needed
    while (parts.length < maxParts) {
      parts.push("");
    }
    
    return [
      ...row.slice(0, colIndex),
      parts[0] || null,
      ...parts.slice(1).map(p => p || null),
      ...row.slice(colIndex + 1),
    ];
  });
  
  return { data: newData, newColumnNames };
}

// Merge columns
export function mergeColumns(
  data: ExcelData,
  colIndices: number[],
  separator: string = " ",
  newColumnName?: string
): { data: ExcelData } {
  const newData = cloneExcelData(data);
  
  // Determine name for merged column
  const mergedName = newColumnName || colIndices.map(i => newData.headers[i]).join("_");
  
  // Add merged column at end
  newData.headers.push(mergedName);
  
  // Merge values for each row
  newData.rows = newData.rows.map((row) => {
    const mergedValue = colIndices
      .map(i => row[i])
      .filter(v => v !== null && v !== undefined && v !== "")
      .join(separator);
    
    return [...row, mergedValue || null];
  });
  
  return { data: newData };
}

// Rename column header
export function renameColumn(
  data: ExcelData,
  colIndex: number,
  newName: string
): { data: ExcelData; oldName: string } {
  const newData = cloneExcelData(data);
  const oldName = newData.headers[colIndex];
  newData.headers[colIndex] = newName;
  return { data: newData, oldName };
}

// Extract numbers from a column (remove currency symbols, text, etc.)
export function extractNumbers(
  data: ExcelData,
  colIndex: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];

  for (let rowIndex = 0; rowIndex < newData.rows.length; rowIndex++) {
    const cellValue = newData.rows[rowIndex][colIndex];
    if (cellValue === null || cellValue === undefined) continue;
    
    const strValue = String(cellValue);
    // Extract numbers including decimals and negatives
    const match = strValue.match(/-?[\d,]+\.?\d*/);
    if (match) {
      const numStr = match[0].replace(/,/g, "");
      const numValue = parseFloat(numStr);
      if (!isNaN(numValue) && strValue !== String(numValue)) {
        const cellRef = createCellRef(colIndex, rowIndex);
        changes.push({
          cellRef,
          before: cellValue,
          after: numValue,
          type: "value",
        });
        newData.rows[rowIndex][colIndex] = numValue;
      }
    }
  }

  return { data: newData, changes };
}

// Format numbers with specific format
export function formatNumbers(
  data: ExcelData,
  colIndex: number,
  format: "currency" | "percentage" | "decimal" | "integer" | "scientific",
  options: { symbol?: string; decimals?: number } = {}
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  const { symbol = "$", decimals = 2 } = options;

  for (let rowIndex = 0; rowIndex < newData.rows.length; rowIndex++) {
    const cellValue = newData.rows[rowIndex][colIndex];
    if (cellValue === null || cellValue === undefined) continue;
    
    const numValue = typeof cellValue === "number" 
      ? cellValue 
      : parseFloat(String(cellValue).replace(/[^0-9.-]/g, ""));
    
    if (isNaN(numValue)) continue;

    let formatted: string;
    switch (format) {
      case "currency":
        formatted = `${symbol}${numValue.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
        break;
      case "percentage":
        formatted = `${(numValue * 100).toFixed(decimals)}%`;
        break;
      case "decimal":
        formatted = numValue.toFixed(decimals);
        break;
      case "integer":
        formatted = Math.round(numValue).toLocaleString();
        break;
      case "scientific":
        formatted = numValue.toExponential(decimals);
        break;
    }

    const cellRef = createCellRef(colIndex, rowIndex);
    changes.push({
      cellRef,
      before: cellValue,
      after: formatted,
      type: "value",
    });
    newData.rows[rowIndex][colIndex] = formatted;
  }

  return { data: newData, changes };
}

// Generate unique IDs for a column
export function generateIds(
  data: ExcelData,
  prefix: string = "ID",
  startFrom: number = 1,
  targetColIndex?: number
): { data: ExcelData; changes: DataChange[] } {
  const newData = cloneExcelData(data);
  const changes: DataChange[] = [];
  
  // If no target column, add new column
  let colIndex: number;
  if (targetColIndex === undefined) {
    newData.headers.push("ID");
    colIndex = newData.headers.length - 1;
    newData.rows = newData.rows.map(row => [...row, null]);
  } else {
    colIndex = targetColIndex;
  }

  const padLength = String(startFrom + newData.rows.length - 1).length;
  
  for (let rowIndex = 0; rowIndex < newData.rows.length; rowIndex++) {
    const idNum = startFrom + rowIndex;
    const idValue = `${prefix}-${String(idNum).padStart(Math.max(padLength, 3), "0")}`;
    const cellRef = createCellRef(colIndex, rowIndex);
    const before = newData.rows[rowIndex][colIndex];
    
    changes.push({
      cellRef,
      before,
      after: idValue,
      type: "value",
    });
    newData.rows[rowIndex][colIndex] = idValue;
  }

  return { data: newData, changes };
}

// Calculate statistics for a column
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
  const values: number[] = [];
  
  for (const row of data.rows) {
    const cellValue = row[colIndex];
    if (cellValue === null || cellValue === undefined) continue;
    
    const numValue = typeof cellValue === "number" 
      ? cellValue 
      : parseFloat(String(cellValue).replace(/[^0-9.-]/g, ""));
    
    if (!isNaN(numValue)) {
      values.push(numValue);
    }
  }

  if (values.length === 0) {
    return { sum: 0, average: 0, count: 0, min: 0, max: 0, median: 0, stdDev: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const count = values.length;
  const average = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Median
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
  
  // Standard deviation
  const squaredDiffs = values.map(value => Math.pow(value - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return { sum, average, count, min, max, median, stdDev };
}

// Concatenate multiple columns with separator
export function concatenateColumns(
  data: ExcelData,
  colIndices: number[],
  separator: string = " ",
  newColumnName: string = "Combined"
): { data: ExcelData } {
  const newData = cloneExcelData(data);
  
  newData.headers.push(newColumnName);
  
  newData.rows = newData.rows.map((row) => {
    const combinedValue = colIndices
      .map(i => row[i])
      .filter(v => v !== null && v !== undefined && v !== "")
      .map(v => String(v))
      .join(separator);
    
    return [...row, combinedValue || null];
  });

  return { data: newData };
}

// Create pivot/group summary
export function createGroupSummary(
  data: ExcelData,
  groupByColIndex: number,
  valueColIndex: number,
  operation: "sum" | "average" | "count" | "min" | "max" = "sum"
): { groupName: string; value: number }[] {
  const groups = new Map<string, number[]>();
  
  for (const row of data.rows) {
    const groupKey = String(row[groupByColIndex] ?? "Unknown");
    const cellValue = row[valueColIndex];
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    
    if (cellValue !== null && cellValue !== undefined) {
      const numValue = typeof cellValue === "number" 
        ? cellValue 
        : parseFloat(String(cellValue).replace(/[^0-9.-]/g, ""));
      
      if (!isNaN(numValue)) {
        groups.get(groupKey)!.push(numValue);
      }
    }
  }

  const results: { groupName: string; value: number }[] = [];
  
  groups.forEach((values, groupName) => {
    let result: number;
    switch (operation) {
      case "sum":
        result = values.reduce((a, b) => a + b, 0);
        break;
      case "average":
        result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case "count":
        result = values.length;
        break;
      case "min":
        result = values.length > 0 ? Math.min(...values) : 0;
        break;
      case "max":
        result = values.length > 0 ? Math.max(...values) : 0;
        break;
      default:
        result = values.reduce((a, b) => a + b, 0);
    }
    
    results.push({ groupName, value: Math.round(result * 100) / 100 });
  });

  return results.sort((a, b) => b.value - a.value);
}

// Add a statistics row at the bottom
export function addStatisticsRow(
  data: ExcelData,
  colIndex: number,
  operation: "sum" | "average" | "count" | "min" | "max" | "median" | "std_dev"
): { data: ExcelData } {
  const newData = cloneExcelData(data);
  const stats = calculateStatistics(data, colIndex);
  
  const newRow: (string | number | null)[] = new Array(data.headers.length).fill(null);
  newRow[0] = operation.toUpperCase();
  
  switch (operation) {
    case "sum":
      newRow[colIndex] = stats.sum;
      break;
    case "average":
      newRow[colIndex] = Math.round(stats.average * 100) / 100;
      break;
    case "count":
      newRow[colIndex] = stats.count;
      break;
    case "min":
      newRow[colIndex] = stats.min;
      break;
    case "max":
      newRow[colIndex] = stats.max;
      break;
    case "median":
      newRow[colIndex] = stats.median;
      break;
    case "std_dev":
      newRow[colIndex] = Math.round(stats.stdDev * 100) / 100;
      break;
  }
  
  newData.rows.push(newRow);
  return { data: newData };
}

// Copy column values
export function copyColumn(
  data: ExcelData,
  sourceColIndex: number,
  targetColumnName: string
): { data: ExcelData } {
  const newData = cloneExcelData(data);
  
  newData.headers.push(targetColumnName);
  newData.rows = newData.rows.map((row) => {
    const value = row[sourceColIndex];
    return [...row, value];
  });

  return { data: newData };
}

export function padSpareSpace(
  data: ExcelData,
  spareRows: number = 10,
  spareCols: number = 10
): ExcelData {
  const newData = cloneExcelData(data);
  if (spareCols > 0) {
    const extraHeaders = Array(spareCols).fill("");
    newData.headers = [...newData.headers, ...extraHeaders];
    newData.rows = newData.rows.map((row) => [...row, ...Array(spareCols).fill(null)]);
  }
  if (spareRows > 0) {
    const rowLength = newData.headers.length;
    for (let i = 0; i < spareRows; i++) {
      newData.rows.push(Array(rowLength).fill(null));
    }
  }
  return newData;
}

