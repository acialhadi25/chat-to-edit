import { ExcelData, XSpreadsheetSheet, getColumnLetter } from '@/types/excel';

// Helper to convert data from x-data-spreadsheet format to our internal ExcelData format
export function convertXlsxToExcelData(
  spreadsheetData: XSpreadsheetSheet[],
  initialData: ExcelData
): ExcelData {
  if (!spreadsheetData || spreadsheetData.length === 0) {
    return initialData;
  }

  const sheet = spreadsheetData[0]; // Assuming one sheet for now
  if (!sheet || !sheet.rows) {
    return initialData;
  }

  let newHeaders: string[] = [];
  // Extract headers from row 0 of x-data-spreadsheet data
  if (sheet.rows[0] && sheet.rows[0].cells) {
    const headerCells = sheet.rows[0].cells;
    let maxHeaderCol = -1;
    for (const cIndexStr in headerCells) {
      const cIndex = parseInt(cIndexStr, 10);
      if (cIndex > maxHeaderCol) maxHeaderCol = cIndex;
    }
    for (let i = 0; i <= maxHeaderCol; i++) {
      newHeaders.push(headerCells[i]?.text || getColumnLetter(i));
    }
  } else {
    // Fallback to initial headers if x-spreadsheet's row 0 is empty
    newHeaders = [...initialData.headers];
  }

  const newRows: (string | number | null)[][] = [];

  // x-spreadsheet's .len property tells us the total number of rows (including our conceptual header row)
  const totalXlsxRows = sheet.rows.len || 0;

  // Iterate from row index 1 (actual data rows)
  for (let i = 1; i < totalXlsxRows; i++) {
    const rowData = sheet.rows[i];
    const newRow: (string | number | null)[] = Array(newHeaders.length).fill(null);
    if (rowData && rowData.cells) {
      for (const cellKey in rowData.cells) {
        const c = parseInt(cellKey, 10);
        if (c < newHeaders.length) {
          const cellContent = rowData.cells[cellKey]?.text ?? null;
          if (
            cellContent !== null &&
            !isNaN(Number(cellContent)) &&
            String(cellContent).trim() !== ''
          ) {
            newRow[c] = Number(cellContent);
          } else {
            newRow[c] = cellContent;
          }
        }
      }
    }
    newRows.push(newRow);
  }

  // Ensure newRows has at least some default length if data is smaller than headers.len
  while (newRows.length < initialData.rows.length) {
    newRows.push(Array(newHeaders.length).fill(null));
  }

  return {
    ...initialData,
    headers: newHeaders,
    rows: newRows,
    // We are not currently converting formulas, styles, merges back from x-spreadsheet
    // This is a limitation for now, as x-spreadsheet data structure is different.
    // If needed, more complex parsing would be required here.
    formulas: {},
    cellStyles: {},
    mergedCells: [],
  };
}
