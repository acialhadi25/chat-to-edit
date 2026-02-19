export type CellValue = string | number | null;
export type Row = CellValue[];
export type SheetData = Row[];

export interface CellStyle {
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  font?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    name?: string;
  };
  color?: string;
  bgcolor?: string;
  [key: string]: unknown;
}

export interface DataChange {
  row: number;
  col: number;
  oldValue: CellValue;
  newValue: CellValue;
  type?: 'CELL_UPDATE' | 'ROW_DELETE' | 'COLUMN_DELETE' | 'COLUMN_RENAME';
  params?: Record<string, unknown>;
}

export type ActionType =
  | 'INSERT_FORMULA'
  | 'REMOVE_FORMULA'
  | 'EDIT_CELL'
  | 'EDIT_COLUMN'
  | 'EDIT_ROW'
  | 'FIND_REPLACE'
  | 'DATA_CLEANSING'
  | 'DATA_TRANSFORM'
  | 'ADD_COLUMN'
  | 'DELETE_COLUMN'
  | 'DELETE_ROW'
  | 'SORT_DATA'
  | 'FILTER_DATA'
  | 'REMOVE_DUPLICATES'
  | 'FILL_DOWN'
  | 'SPLIT_COLUMN'
  | 'MERGE_COLUMNS'
  | 'CLARIFY'
  | 'INFO'
  | 'REMOVE_EMPTY_ROWS'
  | 'RENAME_COLUMN'
  | 'FORMAT_NUMBER'
  | 'EXTRACT_NUMBER'
  | 'CONDITIONAL_FORMAT'
  | 'GENERATE_ID'
  | 'DATE_CALCULATION'
  | 'CONCATENATE'
  | 'STATISTICS'
  | 'PIVOT_SUMMARY'
  | 'DATA_VALIDATION'
  | 'TEXT_EXTRACTION'
  | 'CREATE_CHART'
  | 'DATA_AUDIT'
  | 'INSIGHTS'
  | 'COPY_COLUMN';

export interface AIAction {
  id?: string;
  type: ActionType;
  status?: 'pending' | 'applied' | 'rejected';
  params: { [key: string]: unknown };
  changes?: DataChange[];
  formula?: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
  timestamp: Date;
}

export interface ExcelData {
  fileName: string;
  sheets: string[];
  currentSheet: string;
  headers: string[];
  rows: SheetData;
  formulas: { [cellRef: string]: string };
  mergedCells?: string[];
  cellStyles?: { [cellRef: string]: CellStyle };
  columnWidths?: { [colIndex: number]: number };
  selectedCells?: { r: number; c: number }[];
  pendingChanges?: DataChange[];
}

export interface EditHistory {
  state: ExcelData;
  description: string;
  timestamp: Date;
}

export const getColumnLetter = (colIndex: number): string => {
  let temp,
    letter = '';
  while (colIndex >= 0) {
    temp = colIndex % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
};

export const getColumnIndex = (colLetter: string): number => {
  let num = 0;
  for (let i = 0; i < colLetter.length; i++) {
    num = num * 26 + (colLetter.charCodeAt(i) - 64);
  }
  return num - 1;
};

export const createCellRef = (col: number, row: number): string => {
  return `${getColumnLetter(col)}${row + 1}`;
};

// --- FORTUNE-SHEET TYPES ---

export interface FortuneSheetCell {
  r: number; // row
  c: number; // column
  v: {
    v: string | number | null; // value
    m?: string; // formatted value
    ct?: { fa: string; t: string }; // cell type
    bg?: string; // background color
    fc?: string; // font color
    bl?: number; // bold (1 = true)
    it?: number; // italic (1 = true)
    ht?: number; // horizontal align (0=left, 1=center, 2=right)
    vt?: number; // vertical align (0=top, 1=middle, 2=bottom)
    [key: string]: unknown;
  };
}

export interface FortuneSheetData {
  name: string;
  celldata: FortuneSheetCell[];
  config?: {
    columnlen?: { [key: number]: number };
    rowlen?: { [key: number]: number };
  };
  frozen?: {
    type: 'row' | 'column' | 'both';
    range: { row_focus: number; column_focus: number };
  };
  row?: number;
  column?: number;
  [key: string]: unknown;
}

// Keep XSpreadsheet types for backward compatibility during migration
export interface XSpreadsheetSheet {
  name?: string;
  freeze?: string;
  styles?: unknown[];
  rows: unknown;
  cols?: unknown;
  [key: string]: unknown;
}
