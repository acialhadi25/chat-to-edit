import { ExcelData, getColumnLetter } from '@/types/excel';

// Helper to convert data from FortuneSheet format to our internal ExcelData format
export function convertXlsxToExcelData(
  fortuneSheetData: any[],
  initialData: ExcelData
): ExcelData {
  if (!fortuneSheetData || fortuneSheetData.length === 0) {
    return initialData;
  }

  const sheet = fortuneSheetData[0]; // Assuming one sheet for now
  if (!sheet || !sheet.celldata) {
    return initialData;
  }

  // Build a map of cell data for easy lookup
  const cellMap = new Map<string, any>();
  sheet.celldata.forEach((cell: any) => {
    const key = `${cell.r}_${cell.c}`;
    cellMap.set(key, cell);
  });

  // Extract headers from row 0
  const newHeaders: string[] = [];
  let maxCol = 0;
  
  // Find max column from celldata
  sheet.celldata.forEach((cell: any) => {
    if (cell.c > maxCol) maxCol = cell.c;
  });

  for (let c = 0; c <= maxCol; c++) {
    const headerCell = cellMap.get(`0_${c}`);
    if (headerCell && headerCell.v) {
      newHeaders.push(String(headerCell.v.v || headerCell.v.m || getColumnLetter(c)));
    } else {
      newHeaders.push(getColumnLetter(c));
    }
  }

  // Extract data rows
  const newRows: (string | number | null)[][] = [];
  let maxRow = 0;

  // Find max row from celldata
  sheet.celldata.forEach((cell: any) => {
    if (cell.r > maxRow) maxRow = cell.r;
  });

  // Start from row 1 (skip header row 0)
  for (let r = 1; r <= maxRow; r++) {
    const newRow: (string | number | null)[] = Array(newHeaders.length).fill(null);
    
    for (let c = 0; c < newHeaders.length; c++) {
      const cell = cellMap.get(`${r}_${c}`);
      if (cell && cell.v) {
        const cellValue = cell.v.v ?? cell.v.m ?? null;
        
        // Try to parse as number
        if (
          cellValue !== null &&
          !isNaN(Number(cellValue)) &&
          String(cellValue).trim() !== ''
        ) {
          newRow[c] = Number(cellValue);
        } else {
          newRow[c] = cellValue;
        }
      }
    }
    
    newRows.push(newRow);
  }

  // Extract column widths
  const columnWidths: { [colIndex: number]: number } = {};
  if (sheet.config && sheet.config.columnlen) {
    Object.keys(sheet.config.columnlen).forEach((key) => {
      columnWidths[parseInt(key)] = sheet.config.columnlen[key];
    });
  }

  // Extract cell styles
  const cellStyles: { [cellRef: string]: any } = {};
  sheet.celldata.forEach((cell: any) => {
    if (cell.v && (cell.v.bg || cell.v.fc || cell.v.bl || cell.v.it)) {
      const row = cell.r - 1; // Convert to 0-based (excluding header)
      const col = cell.c;
      
      if (row >= 0) { // Only for data rows, not header
        const cellRef = `${getColumnLetter(col)}${row + 1}`;
        const style: any = {};
        
        if (cell.v.bg) style.bgcolor = cell.v.bg;
        if (cell.v.fc) style.color = cell.v.fc;
        if (cell.v.bl) style.font = { ...style.font, bold: true };
        if (cell.v.it) style.font = { ...style.font, italic: true };
        if (cell.v.ht === 1) style.align = 'center';
        if (cell.v.ht === 2) style.align = 'right';
        if (cell.v.vt === 1) style.valign = 'middle';
        if (cell.v.vt === 2) style.valign = 'bottom';
        
        cellStyles[cellRef] = style;
      }
    }
  });

  return {
    ...initialData,
    headers: newHeaders,
    rows: newRows,
    columnWidths,
    cellStyles,
    formulas: {}, // FortuneSheet formulas would need separate extraction
    mergedCells: [], // FortuneSheet merge info would need separate extraction
  };
}
