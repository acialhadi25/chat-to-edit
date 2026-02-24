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
      const formulaObj = cell.formula as { result?: any };
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
    if (style.font.color && 'argb' in style.font.color && typeof style.font.color.argb === 'string') {
      univerStyle.fc = { rgb: argbToRgb(style.font.color.argb) };
    }
  }

  // Fill (background color)
  if (style.fill && style.fill.type === 'pattern' && 'fgColor' in style.fill) {
    const fgColor = style.fill.fgColor;
    if (fgColor && 'argb' in fgColor && typeof fgColor.argb === 'string') {
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
      cl: { rgb: border.top.color && 'argb' in border.top.color && typeof border.top.color.argb === 'string' ? argbToRgb(border.top.color.argb) : '000000' },
    };
  }
  if (border.bottom) {
    univerBorder.b = {
      s: convertBorderStyle(border.bottom.style),
      cl: { rgb: border.bottom.color && 'argb' in border.bottom.color && typeof border.bottom.color.argb === 'string' ? argbToRgb(border.bottom.color.argb) : '000000' },
    };
  }
  if (border.left) {
    univerBorder.l = {
      s: convertBorderStyle(border.left.style),
      cl: { rgb: border.left.color && 'argb' in border.left.color && typeof border.left.color.argb === 'string' ? argbToRgb(border.left.color.argb) : '000000' },
    };
  }
  if (border.right) {
    univerBorder.r = {
      s: convertBorderStyle(border.right.style),
      cl: { rgb: border.right.color && 'argb' in border.right.color && typeof border.right.color.argb === 'string' ? argbToRgb(border.right.color.argb) : '000000' },
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
    Object.entries(workbookData.sheets).forEach(([_sheetId, sheetData]) => {
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

// ============================================================================
// CSV Import/Export Functions
// ============================================================================

export interface CSVOptions {
  delimiter?: string;
  sheetName?: string;
}

/**
 * Import workbook from CSV data
 * CSV is 2D format, so it creates a single sheet
 */
export function importFromCSV(
  csvData: string | File,
  options: CSVOptions = {}
): Promise<IWorkbookData> {
  const {
    delimiter = ',',
    sheetName = 'Sheet1',
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const processCSV = (csvText: string) => {
        // Parse CSV manually (simple parser for quoted strings)
        const rows = parseCSV(csvText, delimiter);
        
        if (rows.length === 0) {
          throw new Error('CSV file is empty');
        }

        // Create workbook
        const workbook: IWorkbookData = {
          id: generateId(),
          name: csvData instanceof File ? csvData.name.replace('.csv', '') : 'CSV Import',
          sheets: {},
        };

        // Create sheet
        const sheetId = 'sheet-1';
        const sheet: IWorksheetData = {
          id: sheetId,
          name: sheetName,
          cellData: {},
          rowCount: rows.length,
          columnCount: rows[0]?.length || 0,
          defaultRowHeight: 20,
          defaultColumnWidth: 100,
        };

        // Convert rows to cell data
        rows.forEach((row, rowIndex) => {
          sheet.cellData[rowIndex] = {};
          row.forEach((cellValue, colIndex) => {
            // Infer cell type and convert value
            const { value, type } = inferCellType(cellValue);
            sheet.cellData[rowIndex][colIndex] = {
              v: value,
              t: type,
            };
          });
        });

        workbook.sheets[sheetId] = sheet;
        resolve(workbook);
      };

      if (csvData instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          processCSV(text);
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(csvData);
      } else {
        processCSV(csvData);
      }
    } catch (error) {
      reject(new Error(
        `Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    }
  });
}

/**
 * Export workbook to CSV format
 * Exports only the first sheet or specified sheet
 */
export function exportToCSV(
  workbookData: IWorkbookData,
  options: CSVOptions = {}
): string {
  const {
    delimiter = ',',
    sheetName,
  } = options;

  try {
    // Get the sheet to export
    let sheet: IWorksheetData | undefined;
    
    if (sheetName) {
      // Find sheet by name
      sheet = Object.values(workbookData.sheets).find(s => s.name === sheetName);
      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }
    } else {
      // Use first sheet
      sheet = Object.values(workbookData.sheets)[0];
      if (!sheet) {
        throw new Error('No sheets found in workbook');
      }
    }

    // Find the bounds of the data
    const bounds = getSheetBounds(sheet);
    if (bounds.maxRow === -1 || bounds.maxCol === -1) {
      return ''; // Empty sheet
    }

    // Build CSV rows
    const csvRows: string[] = [];
    
    for (let row = 0; row <= bounds.maxRow; row++) {
      const csvCells: string[] = [];
      
      for (let col = 0; col <= bounds.maxCol; col++) {
        const cell = sheet.cellData[row]?.[col];
        const value = cell?.v ?? '';
        
        // Format cell value for CSV
        csvCells.push(formatCSVCell(String(value), delimiter));
      }
      
      csvRows.push(csvCells.join(delimiter));
    }

    return csvRows.join('\n');
  } catch (error) {
    throw new Error(
      `Failed to export to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse CSV text into 2D array
 * Handles quoted strings with commas
 */
function parseCSV(csvText: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    const row: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        // End of cell
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    // Add last cell
    row.push(currentCell.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * Format cell value for CSV output
 * Quotes strings that contain delimiter, quotes, or newlines
 */
function formatCSVCell(value: string, delimiter: string): string {
  // Check if value needs quoting
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return value;
}

/**
 * Infer cell type from string value
 */
function inferCellType(value: string): { value: any; type: CellValueType } {
  const trimmed = value.trim();
  
  // Empty cell
  if (trimmed === '') {
    return { value: null, type: CellValueType.STRING };
  }
  
  // Boolean
  if (trimmed.toLowerCase() === 'true') {
    return { value: true, type: CellValueType.BOOLEAN };
  }
  if (trimmed.toLowerCase() === 'false') {
    return { value: false, type: CellValueType.BOOLEAN };
  }
  
  // Number
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') {
    return { value: num, type: CellValueType.NUMBER };
  }
  
  // String (default)
  return { value: trimmed, type: CellValueType.STRING };
}

/**
 * Get the bounds of data in a sheet
 */
function getSheetBounds(sheet: IWorksheetData): {
  maxRow: number;
  maxCol: number;
} {
  let maxRow = -1;
  let maxCol = -1;
  
  Object.keys(sheet.cellData).forEach(rowStr => {
    const row = parseInt(rowStr, 10);
    if (row > maxRow) maxRow = row;
    
    Object.keys(sheet.cellData[row]).forEach(colStr => {
      const col = parseInt(colStr, 10);
      if (col > maxCol) maxCol = col;
    });
  });
  
  return { maxRow, maxCol };
}

/**
 * Download CSV file in browser
 */
export function downloadCSVFile(csvData: string, filename: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// JSON Import/Export Functions
// ============================================================================

export interface JSONOptions {
  pretty?: boolean;
  indent?: number;
}

/**
 * Import workbook from JSON
 * JSON format is direct serialization of IWorkbookData
 */
export function importFromJSON(
  jsonData: string | File | IWorkbookData
): Promise<IWorkbookData> {
  return new Promise((resolve, reject) => {
    try {
      const processJSON = (jsonText: string) => {
        const data = JSON.parse(jsonText) as IWorkbookData;
        
        // Validate structure
        if (!data.id || !data.name || !data.sheets) {
          throw new Error('Invalid workbook JSON structure');
        }
        
        // Validate sheets
        if (Object.keys(data.sheets).length === 0) {
          throw new Error('Workbook must have at least one sheet');
        }
        
        resolve(data);
      };

      if (jsonData instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          processJSON(text);
        };
        reader.onerror = () => reject(new Error('Failed to read JSON file'));
        reader.readAsText(jsonData);
      } else if (typeof jsonData === 'string') {
        processJSON(jsonData);
      } else {
        // Already parsed object
        resolve(jsonData);
      }
    } catch (error) {
      reject(new Error(
        `Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    }
  });
}

/**
 * Export workbook to JSON format
 * Direct serialization of IWorkbookData with all metadata
 */
export function exportToJSON(
  workbookData: IWorkbookData,
  options: JSONOptions = {}
): string {
  const { pretty = true, indent = 2 } = options;
  
  try {
    if (pretty) {
      return JSON.stringify(workbookData, null, indent);
    } else {
      return JSON.stringify(workbookData);
    }
  } catch (error) {
    throw new Error(
      `Failed to export to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Download JSON file in browser
 */
export function downloadJSONFile(jsonData: string, filename: string): void {
  const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
