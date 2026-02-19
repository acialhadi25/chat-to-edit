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

export interface AIAction {
  id?: string;
  type:
    | 'FORMULA'
    | 'FORMAT'
    | 'DELETE_ROWS'
    | 'DELETE_COLUMNS'
    | 'FILL_DATA'
    | 'SORT'
    | 'FILTER'
    | 'CHART'
    | 'INFO'
    | 'DATA_AUDIT'
    | 'CLARIFY'
    | 'RENAME_COLUMN';
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

// --- X-DATA-SPREADSHEET TYPES ---

export interface XSpreadsheetCell {
  text?: string;
  style?: number;
  [key: string]: unknown;
}

export interface XSpreadsheetRow {
  cells: { [key: string]: XSpreadsheetCell };
}

export interface XSpreadsheetStyle {
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
}

export interface XSpreadsheetSheet {
  name?: string;
  freeze?: string;
  styles?: XSpreadsheetStyle[];
  rows: {
    len: number;
    [key: number]: XSpreadsheetRow;
  };
  cols?: {
    len: number;
    [key: number]: {
      width: number;
    };
  };
  [key: string]: unknown;
}
