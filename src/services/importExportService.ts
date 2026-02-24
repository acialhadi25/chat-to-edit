/**
 * Import/Export Service for Univer Workbooks
 * 
 * Handles Excel (.xlsx) import and export with format preservation.
 * Converts between Excel format and Univer's IWorkbookData format.
 * 
 * Features:
 * - Import from Excel (.xlsx) files
 * - Export to Excel (.xlsx) files
 * - Preserve cell values, formulas, and formatting
 * - Handle styles (colors, fonts, borders, alignment)
 * - Error handling and validation
 * 
 * @see Requirements 3.1.1, 3.1.2, 3.1.7
 */

import ExcelJS from 'exceljs';
import { 
  IWorkbookData, 
  IWorksheetData, 
  ICellData, 
  ICellStyle,
  IBorderData,
  CellValueType,
  BorderStyleType,
  HorizontalAlign,
  VerticalAlign
} from '@/types/univer.types';

// ============================================================================
// Types
// ============================================================================

export interface ImportOptions {
  preserveFormatting?: boolean;
  preserveFormulas?: boolean;
  sheetIndex?: number; // Import specific sheet (default: all sheets)
}

export interface ExportOptions {
  preserveFormatting?: boolean;
  preserveFormulas?: boolean;
  sheetName?: string; // Export specific sheet (default: all sheets)
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import workbook from Excel file
 */
export async function importFromExcel(
  file: File | ArrayBuffer,
  options: ImportOptions = {}
): Promise<IWorkbookData> {
  const {
    preserveFormatting = true,
    preserveFormulas = true,
  } = options;

  try {
    // Load Excel file
    const workbook = new ExcelJS.Workbook();
    
    if (file instanceof File) {
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
    } else {
      await workbook.xlsx.load(file);
    }

    // Convert to Univer format
    const univerWorkbook: IWorkbookData = {
      id: generateId(),
      name: file instanceof File ? file.name.replace('.xlsx', '') : 'Imported Workbook',
      sheets: {},
    };

    // Process each worksheet
    workbook.eachSheet((worksheet, sheetIndex) => {
      const sheetId = `sheet-${sheetIndex}`;
      univerWorkbook.sheets[sheetId] = convertWorksheetToUniver(
        worksheet,
        preserveFormatting,
        preserveFormulas
      );
    });

    return univerWorkbook;
  } catch (error) {
    throw new Error(
      `Failed to import Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert ExcelJS worksheet to Univer worksheet
 */
function convertWorksheetToUniver(
  worksheet: ExcelJS.Worksheet,
  preserveFormatting: boolean,
  preserveFormulas: boolean
): IWorksheetData {
  const univerSheet: IWorksheetData = {
    id: generateId(),
    name: worksheet.name,
    cellData: {},
    rowData: {},
    columnData: {},
    rowCount: worksheet.rowCount,
    columnCount: worksheet.columnCount,
    defaultRowHeight: 20,
    defaultColumnWidth: 100,
  };

  // Process each row
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowIndex = rowNumber - 1; // Convert to 0-based index
    
    // Store row height if different from default
    if (row.height && row.height !== 20) {
      if (!univerSheet.rowData) univerSheet.rowData = {};
      univerSheet.rowData[rowIndex] = { h: row.height };
    }

    // Process each cell in the row
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const colIndex = colNumber - 1; // Convert to 0-based index
      
      // Initialize row in cellData if needed
      if (!univerSheet.cellData[rowIndex]) {
        univerSheet.cellData[rowIndex] = {};
      }

      // Convert cell to Univer format
      univerSheet.cellData[rowIndex][colIndex] = convertCellToUniver(
        cell,
        preserveFormatting,
        preserveFormulas
      );
    });
  });

  // Process column widths
  worksheet.columns.forEach((column, index) => {
    if (column.width && column.width !== 10) {
      if (!univerSheet.columnData) univerSheet.columnData = {};
      univerSheet.columnData[index] = { w: column.width * 10 }; // Convert to pixels (approximate)
    }
  });

  // Process merged cells
  if (worksheet.model.merges && worksheet.model.merges.length > 0) {
    univerSheet.mergeData = worksheet.model.merges.map((merge: string) => {
      const range = parseExcelRange(merge);
      return {
        startRow: range.startRow,
        endRow: range.endRow,
        startColumn: range.startColumn,
        endColumn: range.endColumn,
      };
    });
  }

  return univerSheet;
}

/**
 * Convert ExcelJS cell to Univer cell
 */
function convertCellToUniver(
  cell: ExcelJS.Cell,
  preserveFormatting: boolean,
  preserveFormulas: boolean
): ICellData {
  const univerCell: ICellData = {};

  // Handle formula
  if (preserveFormulas && cell.formula) {
    let formula = '';
    if (typeof cell.formula === 'string') {
      formula = cell.formula;
    } else if (typeof cell.formula === 'object' && cell.formula !== null) {
      // ExcelJS formula can be an object with result property
      const formulaObj = cell.formula as any;
      formula = formulaObj.result ? String(formulaObj.result) : '';
    }
    univerCell.f = formula.startsWith('=') ? formula : `=${formula}`;
    univerCell.v = convertCellValue(cell.value); // Convert calculated value
  } else {
    // Handle value
    univerCell.v = convertCellValue(cell.value);
  }

  // Determine cell type
  univerCell.t = getCellValueType(univerCell.v);

  // Handle formatting
  if (preserveFormatting && cell.style) {
    univerCell.s = convertCellStyle(cell.style);
  }

  return univerCell;
}

/**
 * Convert cell value to appropriate type
 */
function convertCellValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle formula result object
  if (typeof value === 'object' && value !== null && 'result' in value) {
    return (value as { result: any }).result;
  }

  // Handle rich text
  if (typeof value === 'object' && value !== null && 'richText' in value) {
    return (value as { richText: Array<{ text: string }> }).richText.map((rt) => rt.text).join('');
  }

  // Handle date
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

/**
 * Get Univer cell value type
 */
function getCellValueType(value: any): CellValueType {
  if (typeof value === 'number') {
    return CellValueType.NUMBER;
  }
  if (typeof value === 'boolean') {
    return CellValueType.BOOLEAN;
  }
  return CellValueType.STRING;
}

/**
 * Convert ExcelJS cell style to Univer cell style
 */
function convertCellStyle(style: Partial<ExcelJS.Style>): ICellStyle {
  const univerStyle: ICellStyle = {};

  // Font
  if (style.font) {
    if (style.font.bold) univerStyle.bl = 1;
    if (style.font.italic) univerStyle.it = 1;
    if (style.font.underline) univerStyle.ul = { s: 1 };
    if (style.font.strike) univerStyle.st = { s: 1 };
    if (style.font.size) univerStyle.fs = style.font.size;
    if (style.font.name) univerStyle.ff = style.font.name;
    if (style.font.color && 'argb' in style.font.color && style.font.color.argb) {
      univerStyle.fc = { rgb: argbToRgb(style.font.color.argb) };
    }
  }

  // Fill (background color)
  if (style.fill && style.fill.type === 'pattern' && 'fgColor' in style.fill) {
    const fgColor = style.fill.fgColor;
    if (fgColor && 'argb' in fgColor && fgColor.argb) {
      univerStyle.bg = { rgb: argbToRgb(fgColor.argb) };
    }
  }

  // Alignment
  if (style.alignment) {
    if (style.alignment.horizontal) {
      univerStyle.ht = convertHorizontalAlignment(style.alignment.horizontal);
    }
    if (style.alignment.vertical) {
      univerStyle.vt = convertVerticalAlignment(style.alignment.vertical);
    }
    if (style.alignment.wrapText) {
      univerStyle.tb = 1;
    }
  }

  // Borders
  if (style.border) {
    univerStyle.bd = convertBorders(style.border);
  }

  return univerStyle;
}

/**
 * Convert ARGB color to RGB
 */
function argbToRgb(argb: string): string {
  // ARGB format: AARRGGBB, we need RRGGBB
  if (argb.length === 8) {
    return argb.substring(2);
  }
  return argb;
}

/**
 * Convert horizontal alignment
 */
function convertHorizontalAlignment(align: string): HorizontalAlign {
  switch (align) {
    case 'center':
      return HorizontalAlign.CENTER;
    case 'right':
      return HorizontalAlign.RIGHT;
    default:
      return HorizontalAlign.LEFT;
  }
}

/**
 * Convert vertical alignment
 */
function convertVerticalAlignment(align: string): VerticalAlign {
  switch (align) {
    case 'middle':
      return VerticalAlign.MIDDLE;
    case 'bottom':
      return VerticalAlign.BOTTOM;
    default:
      return VerticalAlign.TOP;
  }
}

/**
 * Convert borders
 */
function convertBorders(border: Partial<ExcelJS.Borders>): IBorderData {
  const univerBorder: IBorderData = {};

  if (border.top) {
    univerBorder.t = {
      s: convertBorderStyle(border.top.style),
      cl: { rgb: border.top.color && 'argb' in border.top.color && border.top.color.argb ? argbToRgb(border.top.color.argb) : '000000' },
    };
  }
  if (border.bottom) {
    univerBorder.b = {
      s: convertBorderStyle(border.bottom.style),
      cl: { rgb: border.bottom.color && 'argb' in border.bottom.color && border.bottom.color.argb ? argbToRgb(border.bottom.color.argb) : '000000' },
    };
  }
  if (border.left) {
    univerBorder.l = {
      s: convertBorderStyle(border.left.style),
      cl: { rgb: border.left.color && 'argb' in border.left.color && border.left.color.argb ? argbToRgb(border.left.color.argb) : '000000' },
    };
  }
  if (border.right) {
    univerBorder.r = {
      s: convertBorderStyle(border.right.style),
      cl: { rgb: border.right.color && 'argb' in border.right.color && border.right.color.argb ? argbToRgb(border.right.color.argb) : '000000' },
    };
  }

  return univerBorder;
}

/**
 * Convert border style
 */
function convertBorderStyle(style: string | undefined): BorderStyleType {
  switch (style) {
    case 'medium':
      return BorderStyleType.MEDIUM;
    case 'thick':
      return BorderStyleType.THICK;
    case 'dashed':
      return BorderStyleType.DASHED;
    case 'dotted':
      return BorderStyleType.DOTTED;
    case 'double':
      return BorderStyleType.DOUBLE;
    case 'thin':
    default:
      return BorderStyleType.THIN;
  }
}

/**
 * Parse Excel range string (e.g., "A1:B2")
 */
function parseExcelRange(range: string): {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
} {
  const [start, end] = range.split(':');
  const startCell = parseExcelCell(start);
  const endCell = end ? parseExcelCell(end) : startCell;

  return {
    startRow: startCell.row,
    endRow: endCell.row,
    startColumn: startCell.col,
    endColumn: endCell.col,
  };
}

/**
 * Parse Excel cell reference (e.g., "A1")
 */
function parseExcelCell(cell: string): { row: number; col: number } {
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cell}`);
  }

  const col = columnLetterToIndex(match[1]);
  const row = parseInt(match[2], 10) - 1; // Convert to 0-based

  return { row, col };
}

/**
 * Convert column letter to index (A=0, B=1, ..., Z=25, AA=26, etc.)
 */
function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1; // Convert to 0-based
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export workbook to Excel file
 */
export async function exportToExcel(
  workbookData: IWorkbookData,
  options: ExportOptions = {}
): Promise<ArrayBuffer> {
  const {
    preserveFormatting = true,
    preserveFormulas = true,
    sheetName,
  } = options;

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Univer Sheet';
    workbook.created = new Date();

    // Process each sheet
    Object.entries(workbookData.sheets).forEach(([, sheetData]) => {
      // Skip if specific sheet requested and this isn't it
      if (sheetName && sheetData.name !== sheetName) {
        return;
      }

      const worksheet = workbook.addWorksheet(sheetData.name);
      convertUniverSheetToExcel(worksheet, sheetData, preserveFormatting, preserveFormulas);
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new Error(
      `Failed to export to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert Univer worksheet to ExcelJS worksheet
 */
function convertUniverSheetToExcel(
  worksheet: ExcelJS.Worksheet,
  sheetData: IWorksheetData,
  preserveFormatting: boolean,
  preserveFormulas: boolean
): void {
  // Set default dimensions
  if (sheetData.defaultRowHeight) {
    worksheet.properties.defaultRowHeight = sheetData.defaultRowHeight;
  }
  if (sheetData.defaultColumnWidth) {
    worksheet.properties.defaultColWidth = sheetData.defaultColumnWidth / 10; // Convert from pixels
  }

  // Process cells
  Object.entries(sheetData.cellData).forEach(([rowIndexStr, rowData]) => {
    const rowIndex = parseInt(rowIndexStr, 10);
    const excelRow = worksheet.getRow(rowIndex + 1); // Convert to 1-based

    // Set row height if specified
    if (sheetData.rowData && sheetData.rowData[rowIndex]) {
      const rowInfo = sheetData.rowData[rowIndex];
      if (rowInfo.h) {
        excelRow.height = rowInfo.h;
      }
    }

    Object.entries(rowData).forEach(([colIndexStr, cellData]) => {
      const colIndex = parseInt(colIndexStr, 10);
      const excelCell = excelRow.getCell(colIndex + 1); // Convert to 1-based

      // Set value or formula
      if (preserveFormulas && cellData.f) {
        excelCell.value = { formula: cellData.f, result: cellData.v };
      } else {
        excelCell.value = cellData.v;
      }

      // Set formatting
      if (preserveFormatting && cellData.s) {
        applyUniverStyleToExcel(excelCell, cellData.s);
      }
    });

    excelRow.commit();
  });

  // Set column widths
  if (sheetData.columnData) {
    Object.entries(sheetData.columnData).forEach(([colIndexStr, colData]) => {
      const colIndex = parseInt(colIndexStr, 10);
      const column = worksheet.getColumn(colIndex + 1); // Convert to 1-based
      if (colData.w) {
        column.width = colData.w / 10; // Convert from pixels
      }
    });
  }

  // Set merged cells
  if (sheetData.mergeData) {
    sheetData.mergeData.forEach((merge) => {
      worksheet.mergeCells(
        merge.startRow + 1,
        merge.startColumn + 1,
        merge.endRow + 1,
        merge.endColumn + 1
      );
    });
  }
}

/**
 * Apply Univer cell style to ExcelJS cell
 */
function applyUniverStyleToExcel(cell: ExcelJS.Cell, style: ICellStyle): void {
  const excelStyle: Partial<ExcelJS.Style> = {};

  // Font
  const font: Partial<ExcelJS.Font> = {};
  if (style.bl === 1) font.bold = true;
  if (style.it === 1) font.italic = true;
  if (style.ul?.s === 1) font.underline = true;
  if (style.st?.s === 1) font.strike = true;
  if (style.fs) font.size = style.fs;
  if (style.ff) font.name = style.ff;
  if (style.fc) {
    font.color = { argb: 'FF' + style.fc.rgb };
  }
  if (Object.keys(font).length > 0) {
    excelStyle.font = font;
  }

  // Fill (background color)
  if (style.bg) {
    excelStyle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + style.bg.rgb },
    };
  }

  // Alignment
  const alignment: Partial<ExcelJS.Alignment> = {};
  if (style.ht !== undefined) {
    alignment.horizontal = convertUniverHorizontalAlignment(style.ht);
  }
  if (style.vt !== undefined) {
    alignment.vertical = convertUniverVerticalAlignment(style.vt);
  }
  if (style.tb === 1) {
    alignment.wrapText = true;
  }
  if (Object.keys(alignment).length > 0) {
    excelStyle.alignment = alignment;
  }

  // Borders
  if (style.bd) {
    excelStyle.border = convertUniverBordersToExcel(style.bd);
  }

  cell.style = excelStyle;
}

/**
 * Convert Univer horizontal alignment to Excel
 */
function convertUniverHorizontalAlignment(align: HorizontalAlign): 'left' | 'center' | 'right' {
  switch (align) {
    case HorizontalAlign.CENTER:
      return 'center';
    case HorizontalAlign.RIGHT:
      return 'right';
    default:
      return 'left';
  }
}

/**
 * Convert Univer vertical alignment to Excel
 */
function convertUniverVerticalAlignment(align: VerticalAlign): 'top' | 'middle' | 'bottom' {
  switch (align) {
    case VerticalAlign.MIDDLE:
      return 'middle';
    case VerticalAlign.BOTTOM:
      return 'bottom';
    default:
      return 'top';
  }
}

/**
 * Convert Univer borders to Excel borders
 */
function convertUniverBordersToExcel(border: IBorderData): Partial<ExcelJS.Borders> {
  const excelBorder: Partial<ExcelJS.Borders> = {};

  if (border.t) {
    excelBorder.top = {
      style: convertUniverBorderStyleToExcel(border.t.s),
      color: { argb: 'FF' + border.t.cl.rgb },
    };
  }
  if (border.b) {
    excelBorder.bottom = {
      style: convertUniverBorderStyleToExcel(border.b.s),
      color: { argb: 'FF' + border.b.cl.rgb },
    };
  }
  if (border.l) {
    excelBorder.left = {
      style: convertUniverBorderStyleToExcel(border.l.s),
      color: { argb: 'FF' + border.l.cl.rgb },
    };
  }
  if (border.r) {
    excelBorder.right = {
      style: convertUniverBorderStyleToExcel(border.r.s),
      color: { argb: 'FF' + border.r.cl.rgb },
    };
  }

  return excelBorder;
}

/**
 * Convert Univer border style to Excel border style
 */
function convertUniverBorderStyleToExcel(style: BorderStyleType): ExcelJS.BorderStyle {
  switch (style) {
    case BorderStyleType.MEDIUM:
      return 'medium';
    case BorderStyleType.THICK:
      return 'thick';
    case BorderStyleType.DASHED:
      return 'dashed';
    case BorderStyleType.DOTTED:
      return 'dotted';
    case BorderStyleType.DOUBLE:
      return 'double';
    case BorderStyleType.THIN:
    default:
      return 'thin';
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Download Excel file in browser
 */
export function downloadExcelFile(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
