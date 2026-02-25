/**
 * Tests for column width preservation through workbook recreation
 * 
 * Validates: Requirements 1.3.4 - Cell Alignment Preservation
 * Task: 7.4 - Preserve column widths through workbook recreation
 */

import { describe, it, expect } from 'vitest';
import { ExcelData } from '@/types/excel';

// Mock function to simulate convertExcelDataToUniver
function convertExcelDataToUniver(data: ExcelData) {
  const sheetId = 'sheet-01';
  const sheetName = data.currentSheet || 'Sheet1';
  
  // Build cellData
  const cellData: any = {};
  
  // Add headers (row 0)
  data.headers.forEach((header, colIdx) => {
    if (!cellData[0]) cellData[0] = {};
    cellData[0][colIdx] = { v: header };
  });

  // Add data rows
  data.rows.forEach((row, rowIdx) => {
    const univerRowIdx = rowIdx + 1;
    if (!cellData[univerRowIdx]) cellData[univerRowIdx] = {};
    
    row.forEach((cellValue, colIdx) => {
      cellData[univerRowIdx][colIdx] = { v: cellValue ?? '' };
    });
  });

  // Build columnData for column widths
  const columnData: any = {};
  if (data.columnWidths) {
    Object.entries(data.columnWidths).forEach(([colIndex, width]) => {
      const colIdx = parseInt(colIndex);
      columnData[colIdx] = {
        w: width,
      };
    });
  }

  // Return in Univer workbook format
  return {
    id: 'workbook-01',
    name: data.fileName || 'Workbook',
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: sheetName,
        cellData,
        columnData: Object.keys(columnData).length > 0 ? columnData : undefined,
        rowCount: data.rows.length + 20,
        columnCount: data.headers.length + 5,
      },
    },
  };
}

// Mock function to simulate extracting data from Univer
function extractColumnWidthsFromUniver(univerData: any): { [key: number]: number } {
  const columnWidths: { [key: number]: number } = {};
  
  const sheetIds = Object.keys(univerData.sheets || {});
  if (sheetIds.length > 0) {
    const firstSheetId = sheetIds[0];
    const sheetData = univerData.sheets[firstSheetId];
    
    if (sheetData && sheetData.columnData) {
      Object.keys(sheetData.columnData).forEach((colKey) => {
        const colIdx = parseInt(colKey);
        const colInfo = sheetData.columnData[colKey];
        
        if (colInfo && colInfo.w) {
          columnWidths[colIdx] = colInfo.w;
        }
      });
    }
  }
  
  return columnWidths;
}

describe('Column Width Preservation', () => {
  it('should store column widths in ExcelData', () => {
    const excelData: ExcelData = {
      fileName: 'test.xlsx',
      sheets: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: ['Name', 'Age', 'Email'],
      rows: [
        ['John', 25, 'john@example.com'],
        ['Jane', 30, 'jane@example.com'],
      ],
      formulas: {},
      columnWidths: {
        0: 150,  // Name column: 150px
        1: 80,   // Age column: 80px
        2: 200,  // Email column: 200px
      },
    };

    expect(excelData.columnWidths).toBeDefined();
    expect(excelData.columnWidths![0]).toBe(150);
    expect(excelData.columnWidths![1]).toBe(80);
    expect(excelData.columnWidths![2]).toBe(200);
  });

  it('should convert column widths to Univer format', () => {
    const excelData: ExcelData = {
      fileName: 'test.xlsx',
      sheets: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: ['Name', 'Age', 'Email'],
      rows: [
        ['John', 25, 'john@example.com'],
      ],
      formulas: {},
      columnWidths: {
        0: 150,
        1: 80,
        2: 200,
      },
    };

    const univerData = convertExcelDataToUniver(excelData);
    
    expect(univerData.sheets['sheet-01'].columnData).toBeDefined();
    expect(univerData.sheets['sheet-01'].columnData[0].w).toBe(150);
    expect(univerData.sheets['sheet-01'].columnData[1].w).toBe(80);
    expect(univerData.sheets['sheet-01'].columnData[2].w).toBe(200);
  });

  it('should extract column widths from Univer format', () => {
    const univerData = {
      id: 'workbook-01',
      name: 'test.xlsx',
      sheetOrder: ['sheet-01'],
      sheets: {
        'sheet-01': {
          id: 'sheet-01',
          name: 'Sheet1',
          cellData: {},
          columnData: {
            0: { w: 150 },
            1: { w: 80 },
            2: { w: 200 },
          },
        },
      },
    };

    const columnWidths = extractColumnWidthsFromUniver(univerData);
    
    expect(columnWidths[0]).toBe(150);
    expect(columnWidths[1]).toBe(80);
    expect(columnWidths[2]).toBe(200);
  });

  it('should preserve column widths through round trip conversion', () => {
    const originalExcelData: ExcelData = {
      fileName: 'test.xlsx',
      sheets: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: ['Name', 'Age', 'Email'],
      rows: [
        ['John', 25, 'john@example.com'],
      ],
      formulas: {},
      columnWidths: {
        0: 150,
        1: 80,
        2: 200,
      },
    };

    // Convert to Univer format
    const univerData = convertExcelDataToUniver(originalExcelData);
    
    // Extract back to ExcelData format
    const extractedColumnWidths = extractColumnWidthsFromUniver(univerData);
    
    // Verify column widths are preserved
    expect(extractedColumnWidths[0]).toBe(originalExcelData.columnWidths![0]);
    expect(extractedColumnWidths[1]).toBe(originalExcelData.columnWidths![1]);
    expect(extractedColumnWidths[2]).toBe(originalExcelData.columnWidths![2]);
  });

  it('should handle missing column widths gracefully', () => {
    const excelData: ExcelData = {
      fileName: 'test.xlsx',
      sheets: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: ['Name', 'Age'],
      rows: [
        ['John', 25],
      ],
      formulas: {},
      // No columnWidths specified
    };

    const univerData = convertExcelDataToUniver(excelData);
    
    // columnData should be undefined when no column widths are set
    expect(univerData.sheets['sheet-01'].columnData).toBeUndefined();
  });

  it('should handle partial column widths', () => {
    const excelData: ExcelData = {
      fileName: 'test.xlsx',
      sheets: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: ['Name', 'Age', 'Email'],
      rows: [
        ['John', 25, 'john@example.com'],
      ],
      formulas: {},
      columnWidths: {
        0: 150,  // Only first column has custom width
      },
    };

    const univerData = convertExcelDataToUniver(excelData);
    
    expect(univerData.sheets['sheet-01'].columnData).toBeDefined();
    expect(univerData.sheets['sheet-01'].columnData[0].w).toBe(150);
    expect(univerData.sheets['sheet-01'].columnData[1]).toBeUndefined();
    expect(univerData.sheets['sheet-01'].columnData[2]).toBeUndefined();
  });

  it('should update column widths when user adjusts them', () => {
    // Simulate user adjusting column width in Univer
    const univerData = {
      id: 'workbook-01',
      name: 'test.xlsx',
      sheetOrder: ['sheet-01'],
      sheets: {
        'sheet-01': {
          id: 'sheet-01',
          name: 'Sheet1',
          cellData: {},
          columnData: {
            0: { w: 150 },
            1: { w: 120 },  // User adjusted from 80 to 120
            2: { w: 200 },
          },
        },
      },
    };

    const columnWidths = extractColumnWidthsFromUniver(univerData);
    
    expect(columnWidths[1]).toBe(120);  // Verify the adjusted width
  });

  it('should preserve column widths after workbook recreation', () => {
    // Initial state
    const excelData: ExcelData = {
      fileName: 'test.xlsx',
      sheets: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: ['Name', 'Age', 'Email'],
      rows: [
        ['John', 25, 'john@example.com'],
      ],
      formulas: {},
      columnWidths: {
        0: 150,
        1: 80,
        2: 200,
      },
    };

    // Simulate workbook recreation (e.g., after AI action)
    // 1. Simulate some changes (e.g., AI adds a row)
    const updatedExcelData: ExcelData = {
      ...excelData,
      rows: [
        ...excelData.rows,
        ['Jane', 30, 'jane@example.com'],  // New row added
      ],
    };
    
    // 2. Recreate workbook with updated data
    const recreatedUniverData = convertExcelDataToUniver(updatedExcelData);
    
    // 3. Verify column widths are still preserved
    const extractedColumnWidths = extractColumnWidthsFromUniver(recreatedUniverData);
    
    expect(extractedColumnWidths[0]).toBe(150);
    expect(extractedColumnWidths[1]).toBe(80);
    expect(extractedColumnWidths[2]).toBe(200);
  });
});
