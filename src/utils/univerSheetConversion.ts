/**
 * Utility functions for converting between FortuneSheet and Univer Sheet data formats
 */

/**
 * Convert FortuneSheet data format to Univer Sheet format
 */
export function convertFortuneSheetToUniver(fortuneData: any[]): any {
  if (!fortuneData || fortuneData.length === 0) {
    return {
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cellData: {},
        },
      },
    };
  }

  const sheet = fortuneData[0];
  const univerSheet: any = {
    id: 'sheet1',
    name: sheet.name || 'Sheet1',
    cellData: {},
    columnData: {},
    rowData: {},
  };

  // Convert celldata array to cellData object
  if (sheet.celldata && Array.isArray(sheet.celldata)) {
    sheet.celldata.forEach((cell: any) => {
      const row = cell.r;
      const col = cell.c;

      if (!univerSheet.cellData[row]) {
        univerSheet.cellData[row] = {};
      }

      univerSheet.cellData[row][col] = {
        v: cell.v?.v ?? cell.v,
        s: {
          bg: { rgb: cell.v?.bg },
          fc: { rgb: cell.v?.fc },
          bl: cell.v?.bl === 1 ? 1 : 0,
        },
        f: cell.v?.f,
      };
    });
  }

  // Convert 2D data array to cellData object
  if (sheet.data && Array.isArray(sheet.data)) {
    sheet.data.forEach((row: any[], rowIndex: number) => {
      if (!Array.isArray(row)) return;

      row.forEach((cell: any, colIndex: number) => {
        if (!cell) return;

        if (!univerSheet.cellData[rowIndex]) {
          univerSheet.cellData[rowIndex] = {};
        }

        univerSheet.cellData[rowIndex][colIndex] = {
          v: cell.v ?? cell,
          s: {
            bg: { rgb: cell.bg },
            fc: { rgb: cell.fc },
            bl: cell.bl === 1 ? 1 : 0,
          },
          f: cell.f,
        };
      });
    });
  }

  // Convert column widths
  if (sheet.config?.columnlen) {
    Object.entries(sheet.config.columnlen).forEach(([col, width]) => {
      univerSheet.columnData[col] = { width };
    });
  }

  // Convert row heights
  if (sheet.config?.rowlen) {
    Object.entries(sheet.config.rowlen).forEach(([row, height]) => {
      univerSheet.rowData[row] = { height };
    });
  }

  return {
    sheets: {
      sheet1: univerSheet,
    },
  };
}

/**
 * Convert Univer Sheet data format to FortuneSheet format
 */
export function convertUniverToFortuneSheet(univerData: any): any[] {
  if (!univerData || !univerData.sheets) {
    return [
      {
        name: 'Sheet1',
        celldata: [],
        config: {},
      },
    ];
  }

  const sheet = Object.values(univerData.sheets)[0] as any;
  const celldata: any[] = [];
  const data: any[][] = [];

  // Convert cellData object to celldata array
  Object.entries(sheet.cellData || {}).forEach(([row, cols]: [string, any]) => {
    const rowNum = parseInt(row);

    Object.entries(cols).forEach(([col, cell]: [string, any]) => {
      const colNum = parseInt(col);

      // Add to celldata array (FortuneSheet format)
      celldata.push({
        r: rowNum,
        c: colNum,
        v: {
          v: cell.v,
          m: String(cell.v ?? ''),
          bg: cell.s?.bg?.rgb,
          fc: cell.s?.fc?.rgb,
          bl: cell.s?.bl,
          f: cell.f,
        },
      });

      // Add to 2D data array
      if (!data[rowNum]) {
        data[rowNum] = [];
      }
      data[rowNum][colNum] = {
        v: cell.v,
        m: String(cell.v ?? ''),
        bg: cell.s?.bg?.rgb,
        fc: cell.s?.fc?.rgb,
        bl: cell.s?.bl,
        f: cell.f,
      };
    });
  });

  return [
    {
      name: sheet.name || 'Sheet1',
      celldata,
      data,
      config: {
        columnlen: sheet.columnData || {},
        rowlen: sheet.rowData || {},
      },
      row: data.length + 20,
      column: Math.max(...data.map((r) => r?.length || 0)) + 5,
    },
  ];
}

/**
 * Convert ExcelData format to Univer Sheet format
 */
export function convertExcelDataToUniver(excelData: {
  headers: string[];
  rows: any[][];
  formulas?: { [key: string]: string };
  cellStyles?: { [key: string]: any };
  columnWidths?: { [key: number]: number };
}): any {
  const univerSheet: any = {
    id: 'sheet1',
    name: 'Sheet1',
    cellData: {},
    columnData: {},
  };

  // Add headers (row 0)
  excelData.headers.forEach((header, colIndex) => {
    if (!univerSheet.cellData[0]) {
      univerSheet.cellData[0] = {};
    }
    univerSheet.cellData[0][colIndex] = {
      v: header,
      s: {
        bl: 1, // bold
        bg: { rgb: '#f4f4f4' },
      },
    };
  });

  // Add data rows
  excelData.rows.forEach((row, rowIndex) => {
    const univerRow = rowIndex + 1; // +1 because row 0 is headers

    row.forEach((cellValue, colIndex) => {
      if (!univerSheet.cellData[univerRow]) {
        univerSheet.cellData[univerRow] = {};
      }

      const cellRef = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
      const formula = excelData.formulas?.[cellRef];
      const style = excelData.cellStyles?.[cellRef];

      univerSheet.cellData[univerRow][colIndex] = {
        v: cellValue,
        f: formula,
        s: style
          ? {
              bg: { rgb: style.bgcolor },
              fc: { rgb: style.color },
              bl: style.font?.bold ? 1 : 0,
            }
          : undefined,
      };
    });
  });

  // Add column widths
  if (excelData.columnWidths) {
    Object.entries(excelData.columnWidths).forEach(([col, width]) => {
      univerSheet.columnData[col] = { width };
    });
  }

  return {
    sheets: {
      sheet1: univerSheet,
    },
  };
}

/**
 * Convert Univer Sheet format to ExcelData format
 */
export function convertUniverToExcelData(univerData: any): {
  headers: string[];
  rows: any[][];
  formulas: { [key: string]: string };
  cellStyles: { [key: string]: any };
  columnWidths: { [key: number]: number };
} {
  const sheet = Object.values(univerData.sheets)[0] as any;
  const headers: string[] = [];
  const rows: any[][] = [];
  const formulas: { [key: string]: string } = {};
  const cellStyles: { [key: string]: any } = {};
  const columnWidths: { [key: number]: number } = {};

  // Extract headers from row 0
  if (sheet.cellData[0]) {
    Object.entries(sheet.cellData[0]).forEach(([col, cell]: [string, any]) => {
      headers[parseInt(col)] = cell.v;
    });
  }

  // Extract data rows
  Object.entries(sheet.cellData || {}).forEach(([row, cols]: [string, any]) => {
    const rowNum = parseInt(row);
    if (rowNum === 0) return; // Skip header row

    const dataRowIndex = rowNum - 1;
    if (!rows[dataRowIndex]) {
      rows[dataRowIndex] = [];
    }

    Object.entries(cols).forEach(([col, cell]: [string, any]) => {
      const colNum = parseInt(col);
      const cellRef = `${String.fromCharCode(65 + colNum)}${dataRowIndex + 1}`;

      rows[dataRowIndex][colNum] = cell.v;

      if (cell.f) {
        formulas[cellRef] = cell.f;
      }

      if (cell.s) {
        cellStyles[cellRef] = {
          bgcolor: cell.s.bg?.rgb,
          color: cell.s.fc?.rgb,
          font: { bold: cell.s.bl === 1 },
        };
      }
    });
  });

  // Extract column widths
  Object.entries(sheet.columnData || {}).forEach(([col, data]: [string, any]) => {
    columnWidths[parseInt(col)] = data.width;
  });

  return {
    headers,
    rows,
    formulas,
    cellStyles,
    columnWidths,
  };
}
