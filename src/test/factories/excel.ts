import { ExcelData, SheetData, DataChange } from "@/types/excel";

type CellStyle = {
  color?: string;
  backgroundColor?: string;
  fontColor?: string;
  fontWeight?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  border?: boolean;
};

/**
 * Factory for creating test Excel data
 */
export const excelDataFactory = {
  /**
   * Create a basic ExcelData object
   */
  create: (overrides: Partial<ExcelData> = {}): ExcelData => ({
    fileName: "test.xlsx",
    currentSheet: "Sheet1",
    sheets: ["Sheet1"],
    headers: ["A", "B", "C"],
    rows: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    ...overrides,
  }),

  /**
   * Create ExcelData with formulas
   */
  withFormulas: (formulas: Record<string, string>): ExcelData =>
    excelDataFactory.create({ formulas }),

  /**
   * Create ExcelData with cell styles
   */
  withStyles: (cellStyles: Record<string, CellStyle>): ExcelData =>
    excelDataFactory.create({ cellStyles }),

  /**
   * Create multi-sheet ExcelData
   */
  multiSheet: (sheets: { [name: string]: SheetData }): ExcelData => {
    const sheetNames = Object.keys(sheets);
    const firstSheet = sheets[sheetNames[0]];
    return excelDataFactory.create({
      sheets: sheetNames,
      currentSheet: sheetNames[0],
      headers: firstSheet.headers,
      rows: firstSheet.rows,
      allSheets: sheets,
    });
  },

  /**
   * Create large ExcelData for performance testing
   */
  large: (rowCount: number = 1000, colCount: number = 10): ExcelData => {
    const headers = Array.from({ length: colCount }, (_, i) => `Col${i}`);
    const rows = Array.from({ length: rowCount }, (_, rowIdx) =>
      Array.from({ length: colCount }, (_, colIdx) => rowIdx * colCount + colIdx)
    );
    return excelDataFactory.create({ headers, rows });
  },

  /**
   * Create empty ExcelData
   */
  empty: (): ExcelData =>
    excelDataFactory.create({
      headers: [],
      rows: [],
    }),
};

/**
 * Factory for creating test DataChange objects
 */
export const dataChangeFactory = {
  create: (overrides: Partial<DataChange> = {}): DataChange => ({
    cellRef: "A1",
    before: null,
    after: "test",
    type: "value",
    ...overrides,
  }),

  createMany: (count: number): DataChange[] =>
    Array.from({ length: count }, (_, i) =>
      dataChangeFactory.create({
        cellRef: `${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
        after: `value${i}`,
      })
    ),
};

/**
 * Factory for creating test SheetData
 */
export const sheetDataFactory = {
  create: (overrides: Partial<SheetData> = {}): SheetData => ({
    headers: ["A", "B", "C"],
    rows: [
      [1, 2, 3],
      [4, 5, 6],
    ],
    formulas: {},
    cellStyles: {},
    ...overrides,
  }),
};
