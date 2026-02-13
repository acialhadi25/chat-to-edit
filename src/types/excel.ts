// Action types that AI can perform
export type ActionType =
  | "INSERT_FORMULA"
  | "REMOVE_FORMULA"
  | "EDIT_CELL"
  | "EDIT_COLUMN"
  | "EDIT_ROW"
  | "FIND_REPLACE"
  | "DATA_CLEANSING"
  | "DATA_TRANSFORM"
  | "ADD_COLUMN"
  | "DELETE_COLUMN"
  | "DELETE_ROW"
  | "SORT_DATA"
  | "FILTER_DATA"
  | "REMOVE_DUPLICATES"
  | "FILL_DOWN"
  | "SPLIT_COLUMN"
  | "MERGE_COLUMNS"
  | "CLARIFY"
  | "INFO"
  | "REMOVE_EMPTY_ROWS"
  | "RENAME_COLUMN"
  | "FORMAT_NUMBER"
  | "EXTRACT_NUMBER"
  | "CONDITIONAL_FORMAT"
  | "GENERATE_ID"
  | "DATE_CALCULATION"
  | "CONCATENATE"
  | "STATISTICS"
  | "PIVOT_SUMMARY"
  | "DATA_VALIDATION"
  | "TEXT_EXTRACTION"
  | "CREATE_CHART"
  | "DATA_AUDIT"
  | "INSIGHTS"
  | "COPY_COLUMN";

// Target for actions
export interface CellTarget {
  type: "cell" | "range" | "column" | "row";
  ref: string; // e.g., "A1", "A1:D10", "B", "5"
}

// Individual data change
export interface DataChange {
  cellRef: string;
  before: string | number | null;
  after: string | number | null;
  type: "value" | "formula";
}

// Quick option button for user to click
export interface QuickOption {
  id: string;
  label: string;
  value: string;
  variant: "default" | "success" | "destructive" | "outline";
  icon?: string;
  isApplyAction?: boolean; // Flag to indicate if this button applies the action
  action?: AIAction; // Optional specific action to apply when clicked
}

// AI Action attached to a message
export interface AIAction {
  type: ActionType;
  target?: CellTarget;
  changes?: DataChange[];
  formula?: string;
  newColumnName?: string;
  findValue?: string;
  replaceValue?: string;
  targetColumns?: number[];
  transformType?: "uppercase" | "lowercase" | "titlecase";
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  filterOperator?: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "not_contains" | "empty" | "not_empty";
  filterValue?: string | number;
  delimiter?: string;
  maxParts?: number;
  separator?: string;
  mergeColumns?: number[];
  // New fields for extended functionality
  renameFrom?: string;
  renameTo?: string;
  numberFormat?: "currency" | "percentage" | "decimal" | "integer" | "scientific";
  currencySymbol?: string;
  idPrefix?: string;
  idStartFrom?: number;
  dateColumn?: string;
  dateOperation?: "age" | "days_until" | "days_since" | "add_days" | "year" | "month" | "day";
  concatenateColumns?: number[];
  concatenateSeparator?: string;
  statisticsType?: "sum" | "average" | "count" | "min" | "max" | "median" | "std_dev";
  groupByColumn?: number;
  aggregateColumn?: number;
  // Chart fields
  chartType?: "bar" | "line" | "pie" | "area" | "scatter";
  chartTitle?: string;
  xAxisColumn?: number;
  yAxisColumns?: number[];
  chartColors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Conditional formatting
  conditionType?: "greater_than" | "less_than" | "equal_to" | "contains" | "between" | ">" | "<" | ">=" | "<=" | "=" | "!=" | "not_equal" | "not_contains" | "empty" | "not_empty";
  conditionValues?: (string | number)[];
  formatStyle?: {
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
  };
  // Data validation
  validationType?: "list" | "number" | "date" | "text_length";
  validationOptions?: (string | number)[];
  validationCriteria?: string;
  // Text extraction
  extractionPattern?: string;
  extractionType?: "regex" | "word" | "pattern";
  // Data Audit fields
  auditReport?: {
    totalErrors: number;
    outliers: { cellRef: string; value: any; reason: string }[];
    typeInconsistencies: { cellRef: string; expected: string; found: string }[];
    missingValues: { cellRef: string; column: string }[];
    suggestions: { id: string; description: string; action: AIAction }[];
  };
  // Insight fields
  insights?: {
    summary: string;
    highlights: { text: string; type: "positive" | "negative" | "neutral" }[];
    trends: { topic: string; direction: "up" | "down" | "stable"; description: string }[];
    anomalies: { description: string; cellRefs: string[] }[];
  };
  appliedActionIds?: string[]; // Track which suggestion or quick option IDs have been applied
  status: "pending" | "applied" | "rejected";
}

// Sheet data structure
export interface SheetData {
  headers: string[];
  rows: (string | number | null)[][];
}

// Excel data structure
export interface ExcelData {
  fileName: string;
  sheets: string[];
  currentSheet: string;
  headers: string[];
  rows: (string | number | null)[][];
  formulas: { [cellRef: string]: string };
  selectedCells: string[];
  isSelecting?: boolean;
  pendingChanges: DataChange[];
  allSheets?: { [sheetName: string]: SheetData }; // All sheets data for switching
  cellStyles: {
    [cellRef: string]: {
      color?: string;
      backgroundColor?: string;
      fontColor?: string;
      fontWeight?: string;
      fontSize?: number;
      textAlign?: "left" | "center" | "right";
      border?: boolean;
    }
  };
  validationRules?: {
    [cellRef: string]: {
      type: "list" | "number" | "date" | "text_length";
      values?: (string | number)[];
      criteria?: string;
      allowBlank?: boolean;
      showDropdown?: boolean;
    }
  };
}

// Chat message structure
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AIAction;
  quickOptions?: QuickOption[];
  timestamp: Date;
}

// History entry for undo/redo
export interface EditHistory {
  id: string;
  timestamp: Date;
  actionType: ActionType;
  description: string;
  before: ExcelData;
  after: ExcelData;
}

// AI Response from edge function
export interface AIResponse {
  content: string;
  action?: {
    type: ActionType;
    target?: CellTarget;
    changes?: DataChange[];
    formula?: string;
    newColumnName?: string;
  };
  quickOptions?: QuickOption[];
}

// Helper to get column letter from index
export function getColumnLetter(index: number): string {
  let letter = "";
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

// Helper to get column index from letter
export function getColumnIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

// Parse cell reference like "A1" into {col: 0, row: 0}
export function parseCellRef(ref: string): { col: number; row: number; excelRow: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const excelRow = parseInt(match[2], 10);
  return {
    col: getColumnIndex(match[1]),
    row: excelRow - 2, // Data row index (Excel row 2 = index 0)
    excelRow,
  };
}

// Create cell reference from col/row indices (rowIndex is 0-based data index)
export function createCellRef(col: number, row: number): string {
  return `${getColumnLetter(col)}${row + 2}`; // Data row 0 = Excel row 2
}

// Parse row reference (e.g., "5" or "2,5,8" or "2-5")
export function parseRowRefs(ref: string): number[] {
  const rows: number[] = [];
  const parts = ref.split(",").map(p => p.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(n => parseInt(n.trim(), 10) - 2);
      for (let i = start; i <= end; i++) {
        if (i >= 0) rows.push(i);
      }
    } else {
      const rowIndex = parseInt(part, 10) - 2;
      if (rowIndex >= 0) rows.push(rowIndex);
    }
  }

  return [...new Set(rows)].sort((a, b) => a - b);
}

// Parse column reference (e.g., "B" or "A,C,E" or "A-D")
export function parseColumnRefs(ref: string): number[] {
  const cols: number[] = [];
  const parts = ref.split(",").map(p => p.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [startLetter, endLetter] = part.split("-").map(l => l.trim());
      const start = getColumnIndex(startLetter);
      const end = getColumnIndex(endLetter);
      for (let i = start; i <= end; i++) {
        cols.push(i);
      }
    } else {
      cols.push(getColumnIndex(part));
    }
  }

  return [...new Set(cols)].sort((a, b) => a - b);
}
