/**
 * Unit Tests for Import/Export Service
 * 
 * Tests Excel import/export functionality with format preservation.
 * 
 * @see Requirements 3.1.1, 3.1.2, 3.1.7
 */

import { describe, it, expect, vi } from 'vitest';
import ExcelJS from 'exceljs';
import {
  importFromExcel,
  exportToExcel,
  downloadExcelFile,
  importFromCSV,
  exportToCSV,
  downloadCSVFile,
  importFromJSON,
  exportToJSON,
  downloadJSONFile,
} from '../importExportService';
import type { IWorkbookData } from '@/types/univer.types';
import { CellValueType, HorizontalAlign, VerticalAlign, BorderStyleType } from '@/types/univer.types';

// Mock URL.createObjectURL for browser APIs
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('importExportService', () => {
  describe('importFromExcel', () => {
    it('should import basic Excel file with values', async () => {
      // Create a simple Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.getCell('A1').value = 'Name';
      worksheet.getCell('B1').value = 'Age';
      worksheet.getCell('A2').value = 'John';
      worksheet.getCell('B2').value = 30;
      worksheet.getCell('A3').value = 'Jane';
      worksheet.getCell('B3').value = 25;

      const buffer = await workbook.xlsx.writeBuffer();

      // Import
      const result = await importFromExcel(buffer);

      // Verify structure
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Imported Workbook');
      expect(Object.keys(result.sheets)).toHaveLength(1);

      // Verify sheet data
      const sheet = Object.values(result.sheets)[0];
      expect(sheet.name).toBe('Sheet1');
      expect(sheet.cellData[0][0].v).toBe('Name');
      expect(sheet.cellData[0][1].v).toBe('Age');
      expect(sheet.cellData[1][0].v).toBe('John');
      expect(sheet.cellData[1][1].v).toBe(30);
      expect(sheet.cellData[2][0].v).toBe('Jane');
      expect(sheet.cellData[2][1].v).toBe(25);
    });

    it('should import Excel file with formulas', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.getCell('A1').value = 10;
      worksheet.getCell('A2').value = 20;
      worksheet.getCell('A3').value = { formula: 'A1+A2', result: 30 };

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer, { preserveFormulas: true });

      const sheet = Object.values(result.sheets)[0];
      expect(sheet.cellData[2][0].f).toBe('=A1+A2');
      expect(sheet.cellData[2][0].v).toBe(30);
    });

    it('should import Excel file with cell formatting', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      const cell = worksheet.getCell('A1');
      cell.value = 'Formatted';
      cell.font = {
        bold: true,
        italic: true,
        size: 14,
        name: 'Arial',
        color: { argb: 'FFFF0000' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00FF00' },
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer, { preserveFormatting: true });

      const sheet = Object.values(result.sheets)[0];
      const importedCell = sheet.cellData[0][0];
      
      expect(importedCell.s?.bl).toBe(1); // bold
      expect(importedCell.s?.it).toBe(1); // italic
      expect(importedCell.s?.fs).toBe(14); // font size
      expect(importedCell.s?.ff).toBe('Arial'); // font family
      expect(importedCell.s?.fc?.rgb).toBe('FF0000'); // font color
      expect(importedCell.s?.bg?.rgb).toBe('00FF00'); // background color
      expect(importedCell.s?.ht).toBe(1); // center align
      expect(importedCell.s?.vt).toBe(1); // middle align
      expect(importedCell.s?.tb).toBe(1); // wrap text
    });

    it('should import Excel file with borders', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      const cell = worksheet.getCell('A1');
      cell.value = 'Bordered';
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thick', color: { argb: 'FF000000' } },
        right: { style: 'dashed', color: { argb: 'FF000000' } },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer, { preserveFormatting: true });

      const sheet = Object.values(result.sheets)[0];
      const importedCell = sheet.cellData[0][0];
      
      expect(importedCell.s?.bd?.t).toBeDefined();
      expect(importedCell.s?.bd?.b).toBeDefined();
      expect(importedCell.s?.bd?.l).toBeDefined();
      expect(importedCell.s?.bd?.r).toBeDefined();
    });

    it('should import Excel file with merged cells', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.mergeCells('A1:B2');
      worksheet.getCell('A1').value = 'Merged';

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer);

      const sheet = Object.values(result.sheets)[0];
      expect(sheet.mergeData).toBeDefined();
      expect(sheet.mergeData).toHaveLength(1);
      expect(sheet.mergeData![0]).toEqual({
        startRow: 0,
        endRow: 1,
        startColumn: 0,
        endColumn: 1,
      });
    });

    it('should import Excel file with multiple sheets', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet1 = workbook.addWorksheet('Sheet1');
      const sheet2 = workbook.addWorksheet('Sheet2');
      const sheet3 = workbook.addWorksheet('Sheet3');
      
      // Add at least one cell to each sheet to avoid empty sheet issues
      sheet1.getCell('A1').value = 'Sheet1';
      sheet2.getCell('A1').value = 'Sheet2';
      sheet3.getCell('A1').value = 'Sheet3';

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer);

      expect(Object.keys(result.sheets)).toHaveLength(3);
      const sheetNames = Object.values(result.sheets).map(s => s.name);
      expect(sheetNames).toContain('Sheet1');
      expect(sheetNames).toContain('Sheet2');
      expect(sheetNames).toContain('Sheet3');
    });

    it('should import Excel file with column widths', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 30;

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer);

      const sheet = Object.values(result.sheets)[0];
      expect(sheet.columnData).toBeDefined();
      expect(sheet.columnData![0].w).toBe(200); // 20 * 10
      expect(sheet.columnData![1].w).toBe(300); // 30 * 10
    });

    it('should import Excel file with row heights', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.getRow(1).height = 30;
      worksheet.getRow(2).height = 40;
      
      // Add cells to ensure rows are processed
      worksheet.getCell('A1').value = 'Row1';
      worksheet.getCell('A2').value = 'Row2';

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer);

      const sheet = Object.values(result.sheets)[0];
      expect(sheet.rowData).toBeDefined();
      expect(sheet.rowData![0].h).toBe(30);
      expect(sheet.rowData![1].h).toBe(40);
    });

    it('should handle empty cells correctly', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.getCell('A1').value = 'A1';
      worksheet.getCell('C1').value = 'C1'; // Skip B1

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer);

      const sheet = Object.values(result.sheets)[0];
      expect(sheet.cellData[0][0].v).toBe('A1');
      expect(sheet.cellData[0][1]).toBeUndefined(); // B1 should not exist
      expect(sheet.cellData[0][2].v).toBe('C1');
    });

    it('should handle different cell value types', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheet.getCell('A1').value = 'String';
      worksheet.getCell('A2').value = 123;
      worksheet.getCell('A3').value = true;
      worksheet.getCell('A4').value = new Date('2024-01-01');

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await importFromExcel(buffer);

      const sheet = Object.values(result.sheets)[0];
      expect(sheet.cellData[0][0].t).toBe(CellValueType.STRING);
      expect(sheet.cellData[1][0].t).toBe(CellValueType.NUMBER);
      expect(sheet.cellData[2][0].t).toBe(CellValueType.BOOLEAN);
      expect(sheet.cellData[3][0].v).toContain('2024-01-01'); // Date converted to ISO string
    });

    it('should throw error for invalid Excel file', async () => {
      const invalidBuffer = new ArrayBuffer(10);
      
      await expect(importFromExcel(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('exportToExcel', () => {
    it('should export basic workbook to Excel', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {
              0: {
                0: { v: 'Name', t: CellValueType.STRING },
                1: { v: 'Age', t: CellValueType.STRING },
              },
              1: {
                0: { v: 'John', t: CellValueType.STRING },
                1: { v: 30, t: CellValueType.NUMBER },
              },
            },
          },
        },
      };

      const buffer = await exportToExcel(workbookData);
      expect(buffer).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);

      // Verify by re-importing
      const reimported = await importFromExcel(buffer);
      const sheet = Object.values(reimported.sheets)[0];
      expect(sheet.cellData[0][0].v).toBe('Name');
      expect(sheet.cellData[1][1].v).toBe(30);
    });

    it('should export workbook with formulas', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {
              0: { 0: { v: 10, t: CellValueType.NUMBER } },
              1: { 0: { v: 20, t: CellValueType.NUMBER } },
              2: { 0: { v: 30, f: '=A1+A2', t: CellValueType.NUMBER } },
            },
          },
        },
      };

      const buffer = await exportToExcel(workbookData, { preserveFormulas: true });
      const reimported = await importFromExcel(buffer, { preserveFormulas: true });
      
      const sheet = Object.values(reimported.sheets)[0];
      expect(sheet.cellData[2][0].f).toBe('=A1+A2');
    });

    it('should export workbook with cell formatting', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {
              0: {
                0: {
                  v: 'Formatted',
                  t: CellValueType.STRING,
                  s: {
                    bl: 1,
                    it: 1,
                    fs: 14,
                    ff: 'Arial',
                    fc: { rgb: 'FF0000' },
                    bg: { rgb: '00FF00' },
                    ht: HorizontalAlign.CENTER,
                    vt: VerticalAlign.MIDDLE,
                    tb: 1,
                  },
                },
              },
            },
          },
        },
      };

      const buffer = await exportToExcel(workbookData, { preserveFormatting: true });
      const reimported = await importFromExcel(buffer, { preserveFormatting: true });
      
      const sheet = Object.values(reimported.sheets)[0];
      const cell = sheet.cellData[0][0];
      expect(cell.s?.bl).toBe(1);
      expect(cell.s?.it).toBe(1);
      expect(cell.s?.fs).toBe(14);
      expect(cell.s?.fc?.rgb).toBe('FF0000');
      expect(cell.s?.bg?.rgb).toBe('00FF00');
    });

    it('should export workbook with borders', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {
              0: {
                0: {
                  v: 'Bordered',
                  t: CellValueType.STRING,
                  s: {
                    bd: {
                      t: { s: BorderStyleType.THIN, cl: { rgb: '000000' } },
                      b: { s: BorderStyleType.MEDIUM, cl: { rgb: '000000' } },
                      l: { s: BorderStyleType.THICK, cl: { rgb: '000000' } },
                      r: { s: BorderStyleType.DASHED, cl: { rgb: '000000' } },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const buffer = await exportToExcel(workbookData, { preserveFormatting: true });
      const reimported = await importFromExcel(buffer, { preserveFormatting: true });
      
      const sheet = Object.values(reimported.sheets)[0];
      const cell = sheet.cellData[0][0];
      expect(cell.s?.bd?.t).toBeDefined();
      expect(cell.s?.bd?.b).toBeDefined();
      expect(cell.s?.bd?.l).toBeDefined();
      expect(cell.s?.bd?.r).toBeDefined();
    });

    it('should export workbook with merged cells', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {
              0: { 0: { v: 'Merged', t: CellValueType.STRING } },
            },
            mergeData: [
              {
                startRow: 0,
                endRow: 1,
                startColumn: 0,
                endColumn: 1,
              },
            ],
          },
        },
      };

      const buffer = await exportToExcel(workbookData);
      const reimported = await importFromExcel(buffer);
      
      const sheet = Object.values(reimported.sheets)[0];
      expect(sheet.mergeData).toHaveLength(1);
      expect(sheet.mergeData![0]).toEqual({
        startRow: 0,
        endRow: 1,
        startColumn: 0,
        endColumn: 1,
      });
    });

    it('should export workbook with multiple sheets', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: { 0: { 0: { v: 'Sheet1', t: CellValueType.STRING } } },
          },
          'sheet-2': {
            id: 'sheet-2',
            name: 'Sheet2',
            cellData: { 0: { 0: { v: 'Sheet2', t: CellValueType.STRING } } },
          },
        },
      };

      const buffer = await exportToExcel(workbookData);
      const reimported = await importFromExcel(buffer);
      
      expect(Object.keys(reimported.sheets)).toHaveLength(2);
    });

    it('should export specific sheet when sheetName option provided', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: { 0: { 0: { v: 'Sheet1', t: CellValueType.STRING } } },
          },
          'sheet-2': {
            id: 'sheet-2',
            name: 'Sheet2',
            cellData: { 0: { 0: { v: 'Sheet2', t: CellValueType.STRING } } },
          },
        },
      };

      const buffer = await exportToExcel(workbookData, { sheetName: 'Sheet1' });
      const reimported = await importFromExcel(buffer);
      
      expect(Object.keys(reimported.sheets)).toHaveLength(1);
      expect(Object.values(reimported.sheets)[0].name).toBe('Sheet1');
    });

    it('should export workbook with column widths', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {},
            columnData: {
              0: { w: 200 },
              1: { w: 300 },
            },
          },
        },
      };

      const buffer = await exportToExcel(workbookData);
      const reimported = await importFromExcel(buffer);
      
      const sheet = Object.values(reimported.sheets)[0];
      expect(sheet.columnData![0].w).toBe(200);
      expect(sheet.columnData![1].w).toBe(300);
    });

    it('should export workbook with row heights', async () => {
      const workbookData: IWorkbookData = {
        id: 'test-workbook',
        name: 'Test Workbook',
        sheets: {
          'sheet-1': {
            id: 'sheet-1',
            name: 'Sheet1',
            cellData: {
              0: { 0: { v: 'Row1', t: CellValueType.STRING } },
              1: { 0: { v: 'Row2', t: CellValueType.STRING } },
            },
            rowData: {
              0: { h: 30 },
              1: { h: 40 },
            },
          },
        },
      };

      const buffer = await exportToExcel(workbookData);
      const reimported = await importFromExcel(buffer);
      
      const sheet = Object.values(reimported.sheets)[0];
      expect(sheet.rowData![0].h).toBe(30);
      expect(sheet.rowData![1].h).toBe(40);
    });
  });

  describe('Round-trip import/export', () => {
    it('should preserve data through import-export-import cycle', async () => {
      // Create original Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test');
      
      worksheet.getCell('A1').value = 'Name';
      worksheet.getCell('B1').value = 'Score';
      worksheet.getCell('A2').value = 'Alice';
      worksheet.getCell('B2').value = 95;
      worksheet.getCell('A3').value = 'Bob';
      worksheet.getCell('B3').value = 87;
      
      const cell = worksheet.getCell('A1');
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' },
      };

      const originalBuffer = await workbook.xlsx.writeBuffer();

      // Import
      const imported = await importFromExcel(originalBuffer);

      // Export
      const exported = await exportToExcel(imported);

      // Re-import
      const reimported = await importFromExcel(exported);

      // Verify data preserved
      const sheet = Object.values(reimported.sheets)[0];
      expect(sheet.cellData[0][0].v).toBe('Name');
      expect(sheet.cellData[0][1].v).toBe('Score');
      expect(sheet.cellData[1][0].v).toBe('Alice');
      expect(sheet.cellData[1][1].v).toBe(95);
      expect(sheet.cellData[2][0].v).toBe('Bob');
      expect(sheet.cellData[2][1].v).toBe(87);
      
      // Verify formatting preserved
      expect(sheet.cellData[0][0].s?.bl).toBe(1);
      expect(sheet.cellData[0][0].s?.bg?.rgb).toBe('CCCCCC');
    });
  });

  describe('downloadExcelFile', () => {
    it('should create download link with correct attributes', () => {
      const buffer = new ArrayBuffer(100);
      const filename = 'test.xlsx';

      // Mock DOM methods
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as any;
      
      createElementSpy.mockReturnValue(mockLink);

      downloadExcelFile(buffer, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should add .xlsx extension if not present', () => {
      const buffer = new ArrayBuffer(100);
      const filename = 'test';

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as any;
      
      createElementSpy.mockReturnValue(mockLink);

      downloadExcelFile(buffer, filename);

      expect(mockLink.download).toBe('test.xlsx');

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});

  describe('CSV Import/Export', () => {
    describe('importFromCSV', () => {
      it('should import basic CSV data', async () => {
        const csvData = `Name,Age,City
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;

        const result = await importFromCSV(csvData);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe('CSV Import');
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.name).toBe('Sheet1');
        expect(sheet.cellData[0][0].v).toBe('Name');
        expect(sheet.cellData[0][1].v).toBe('Age');
        expect(sheet.cellData[0][2].v).toBe('City');
        expect(sheet.cellData[1][0].v).toBe('John');
        expect(sheet.cellData[1][1].v).toBe(30); // Number
        expect(sheet.cellData[1][2].v).toBe('New York');
        expect(sheet.cellData[2][0].v).toBe('Jane');
        expect(sheet.cellData[2][1].v).toBe(25); // Number
      });

      it('should handle CSV with quoted strings containing commas', async () => {
        const csvData = `Name,Address,Phone
"Smith, John","123 Main St, Apt 4","555-1234"
"Doe, Jane","456 Oak Ave","555-5678"`;

        const result = await importFromCSV(csvData);
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.cellData[1][0].v).toBe('Smith, John');
        expect(sheet.cellData[1][1].v).toBe('123 Main St, Apt 4');
        expect(sheet.cellData[2][0].v).toBe('Doe, Jane');
      });

      it('should handle CSV with escaped quotes', async () => {
        const csvData = `Name,Quote
John,"He said ""Hello"""
Jane,"She replied ""Hi"""`;

        const result = await importFromCSV(csvData);
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.cellData[1][1].v).toBe('He said "Hello"');
        expect(sheet.cellData[2][1].v).toBe('She replied "Hi"');
      });

      it('should infer number types correctly', async () => {
        const csvData = `Name,Score,Grade
Alice,95.5,A
Bob,87,B
Charlie,92.3,A`;

        const result = await importFromCSV(csvData);
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.cellData[1][1].v).toBe(95.5);
        expect(sheet.cellData[1][1].t).toBe(CellValueType.NUMBER);
        expect(sheet.cellData[2][1].v).toBe(87);
        expect(sheet.cellData[2][1].t).toBe(CellValueType.NUMBER);
      });

      it('should infer boolean types correctly', async () => {
        const csvData = `Name,Active,Premium
Alice,true,false
Bob,false,true`;

        const result = await importFromCSV(csvData);
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.cellData[1][1].v).toBe(true);
        expect(sheet.cellData[1][1].t).toBe(CellValueType.BOOLEAN);
        expect(sheet.cellData[1][2].v).toBe(false);
        expect(sheet.cellData[1][2].t).toBe(CellValueType.BOOLEAN);
      });

      it('should handle empty cells', async () => {
        const csvData = `Name,Age,City
John,,New York
,25,
Bob,35,Chicago`;

        const result = await importFromCSV(csvData);
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.cellData[1][1].v).toBeNull();
        expect(sheet.cellData[2][0].v).toBeNull();
        expect(sheet.cellData[2][2].v).toBeNull();
      });

      it('should handle custom delimiter', async () => {
        const csvData = `Name;Age;City
John;30;New York
Jane;25;Los Angeles`;

        const result = await importFromCSV(csvData, { delimiter: ';' });
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.cellData[0][0].v).toBe('Name');
        expect(sheet.cellData[1][0].v).toBe('John');
        expect(sheet.cellData[1][1].v).toBe(30);
      });

      it('should handle custom sheet name', async () => {
        const csvData = `A,B,C
1,2,3`;

        const result = await importFromCSV(csvData, { sheetName: 'CustomSheet' });
        
        const sheet = Object.values(result.sheets)[0];
        expect(sheet.name).toBe('CustomSheet');
      });

      it('should throw error for empty CSV', async () => {
        const csvData = '';
        
        await expect(importFromCSV(csvData)).rejects.toThrow('CSV file is empty');
      });
    });

    describe('exportToCSV', () => {
      it('should export basic workbook to CSV', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'Name', t: CellValueType.STRING },
                  1: { v: 'Age', t: CellValueType.STRING },
                  2: { v: 'City', t: CellValueType.STRING },
                },
                1: {
                  0: { v: 'John', t: CellValueType.STRING },
                  1: { v: 30, t: CellValueType.NUMBER },
                  2: { v: 'New York', t: CellValueType.STRING },
                },
                2: {
                  0: { v: 'Jane', t: CellValueType.STRING },
                  1: { v: 25, t: CellValueType.NUMBER },
                  2: { v: 'Los Angeles', t: CellValueType.STRING },
                },
              },
            },
          },
        };

        const csv = exportToCSV(workbookData);
        
        expect(csv).toBeDefined();
        const lines = csv.split('\n');
        expect(lines).toHaveLength(3);
        expect(lines[0]).toBe('Name,Age,City');
        expect(lines[1]).toBe('John,30,New York');
        expect(lines[2]).toBe('Jane,25,Los Angeles');
      });

      it('should quote strings containing commas', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'Name', t: CellValueType.STRING },
                  1: { v: 'Address', t: CellValueType.STRING },
                },
                1: {
                  0: { v: 'Smith, John', t: CellValueType.STRING },
                  1: { v: '123 Main St, Apt 4', t: CellValueType.STRING },
                },
              },
            },
          },
        };

        const csv = exportToCSV(workbookData);
        
        const lines = csv.split('\n');
        expect(lines[1]).toBe('"Smith, John","123 Main St, Apt 4"');
      });

      it('should escape quotes in strings', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'Name', t: CellValueType.STRING },
                  1: { v: 'Quote', t: CellValueType.STRING },
                },
                1: {
                  0: { v: 'John', t: CellValueType.STRING },
                  1: { v: 'He said "Hello"', t: CellValueType.STRING },
                },
              },
            },
          },
        };

        const csv = exportToCSV(workbookData);
        
        const lines = csv.split('\n');
        expect(lines[1]).toBe('John,"He said ""Hello"""');
      });

      it('should handle empty cells', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'A', t: CellValueType.STRING },
                  2: { v: 'C', t: CellValueType.STRING },
                },
                1: {
                  1: { v: 'B', t: CellValueType.STRING },
                },
              },
            },
          },
        };

        const csv = exportToCSV(workbookData);
        
        const lines = csv.split('\n');
        expect(lines[0]).toBe('A,,C');
        expect(lines[1]).toBe(',B,');
      });

      it('should export specific sheet by name', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: { 0: { v: 'Sheet1 Data', t: CellValueType.STRING } },
              },
            },
            'sheet-2': {
              id: 'sheet-2',
              name: 'Sheet2',
              cellData: {
                0: { 0: { v: 'Sheet2 Data', t: CellValueType.STRING } },
              },
            },
          },
        };

        const csv = exportToCSV(workbookData, { sheetName: 'Sheet2' });
        
        expect(csv).toBe('Sheet2 Data');
      });

      it('should use custom delimiter', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'A', t: CellValueType.STRING },
                  1: { v: 'B', t: CellValueType.STRING },
                },
              },
            },
          },
        };

        const csv = exportToCSV(workbookData, { delimiter: ';' });
        
        expect(csv).toBe('A;B');
      });

      it('should return empty string for empty sheet', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
            },
          },
        };

        const csv = exportToCSV(workbookData);
        
        expect(csv).toBe('');
      });

      it('should throw error if sheet not found', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
            },
          },
        };

        expect(() => exportToCSV(workbookData, { sheetName: 'NonExistent' }))
          .toThrow('Sheet "NonExistent" not found');
      });

      it('should throw error if no sheets in workbook', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {},
        };

        expect(() => exportToCSV(workbookData))
          .toThrow('No sheets found in workbook');
      });
    });

    describe('CSV Round-trip', () => {
      it('should preserve data through CSV import-export-import cycle', async () => {
        const originalCSV = `Name,Age,Score,Active
Alice,30,95.5,true
Bob,25,87,false
Charlie,35,92.3,true`;

        // Import
        const imported = await importFromCSV(originalCSV);

        // Export
        const exported = exportToCSV(imported);

        // Re-import
        const reimported = await importFromCSV(exported);

        // Verify data preserved
        const sheet = Object.values(reimported.sheets)[0];
        expect(sheet.cellData[0][0].v).toBe('Name');
        expect(sheet.cellData[1][0].v).toBe('Alice');
        expect(sheet.cellData[1][1].v).toBe(30);
        expect(sheet.cellData[1][2].v).toBe(95.5);
        expect(sheet.cellData[1][3].v).toBe(true);
        expect(sheet.cellData[2][0].v).toBe('Bob');
        expect(sheet.cellData[2][3].v).toBe(false);
      });
    });
  });

  describe('JSON Import/Export', () => {
    describe('importFromJSON', () => {
      it('should import valid JSON workbook data', async () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'Name', t: CellValueType.STRING },
                  1: { v: 'Age', t: CellValueType.NUMBER },
                },
                1: {
                  0: { v: 'John', t: CellValueType.STRING },
                  1: { v: 30, t: CellValueType.NUMBER },
                },
              },
            },
          },
        };

        const jsonString = JSON.stringify(workbookData);
        const result = await importFromJSON(jsonString);

        expect(result).toEqual(workbookData);
        expect(result.id).toBe('test-workbook');
        expect(result.name).toBe('Test Workbook');
        expect(Object.keys(result.sheets)).toHaveLength(1);
      });

      it('should import JSON with multiple sheets', async () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: { 0: { 0: { v: 'Sheet1', t: CellValueType.STRING } } },
            },
            'sheet-2': {
              id: 'sheet-2',
              name: 'Sheet2',
              cellData: { 0: { 0: { v: 'Sheet2', t: CellValueType.STRING } } },
            },
          },
        };

        const jsonString = JSON.stringify(workbookData);
        const result = await importFromJSON(jsonString);

        expect(Object.keys(result.sheets)).toHaveLength(2);
        expect(result.sheets['sheet-1'].name).toBe('Sheet1');
        expect(result.sheets['sheet-2'].name).toBe('Sheet2');
      });

      it('should import JSON with formulas and formatting', async () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 10, t: CellValueType.NUMBER },
                  1: { v: 20, t: CellValueType.NUMBER },
                  2: {
                    v: 30,
                    f: '=A1+B1',
                    t: CellValueType.NUMBER,
                    s: {
                      bl: 1,
                      fc: { rgb: 'FF0000' },
                    },
                  },
                },
              },
            },
          },
        };

        const jsonString = JSON.stringify(workbookData);
        const result = await importFromJSON(jsonString);

        const cell = result.sheets['sheet-1'].cellData[0][2];
        expect(cell.f).toBe('=A1+B1');
        expect(cell.s?.bl).toBe(1);
        expect(cell.s?.fc?.rgb).toBe('FF0000');
      });

      it('should import JSON with merged cells and metadata', async () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
              mergeData: [
                {
                  startRow: 0,
                  endRow: 1,
                  startColumn: 0,
                  endColumn: 1,
                },
              ],
              rowData: {
                0: { h: 30 },
              },
              columnData: {
                0: { w: 200 },
              },
            },
          },
        };

        const jsonString = JSON.stringify(workbookData);
        const result = await importFromJSON(jsonString);

        expect(result.sheets['sheet-1'].mergeData).toHaveLength(1);
        expect(result.sheets['sheet-1'].rowData![0].h).toBe(30);
        expect(result.sheets['sheet-1'].columnData![0].w).toBe(200);
      });

      it('should accept already parsed object', async () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
            },
          },
        };

        const result = await importFromJSON(workbookData);

        expect(result).toEqual(workbookData);
      });

      it('should throw error for invalid JSON structure', async () => {
        const invalidJSON = JSON.stringify({ invalid: 'structure' });
        
        await expect(importFromJSON(invalidJSON)).rejects.toThrow('Invalid workbook JSON structure');
      });

      it('should throw error for workbook without sheets', async () => {
        const invalidJSON = JSON.stringify({
          id: 'test',
          name: 'Test',
          sheets: {},
        });
        
        await expect(importFromJSON(invalidJSON)).rejects.toThrow('Workbook must have at least one sheet');
      });

      it('should throw error for malformed JSON', async () => {
        const malformedJSON = '{ invalid json }';
        
        await expect(importFromJSON(malformedJSON)).rejects.toThrow();
      });
    });

    describe('exportToJSON', () => {
      it('should export workbook to pretty JSON', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'Name', t: CellValueType.STRING },
                },
              },
            },
          },
        };

        const json = exportToJSON(workbookData);

        expect(json).toBeDefined();
        expect(json).toContain('\n'); // Pretty formatted
        expect(json).toContain('test-workbook');
        expect(json).toContain('Sheet1');
        
        // Verify it's valid JSON
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(workbookData);
      });

      it('should export workbook to compact JSON', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
            },
          },
        };

        const json = exportToJSON(workbookData, { pretty: false });

        expect(json).toBeDefined();
        expect(json).not.toContain('\n'); // Compact format
        
        // Verify it's valid JSON
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(workbookData);
      });

      it('should export workbook with custom indent', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
            },
          },
        };

        const json = exportToJSON(workbookData, { pretty: true, indent: 4 });

        expect(json).toBeDefined();
        expect(json).toContain('    '); // 4-space indent
      });

      it('should preserve all workbook metadata', () => {
        const workbookData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {},
              rowCount: 100,
              columnCount: 26,
              defaultRowHeight: 25,
              defaultColumnWidth: 120,
            },
          },
        };

        const json = exportToJSON(workbookData);
        const parsed = JSON.parse(json);

        expect(parsed.sheets['sheet-1'].rowCount).toBe(100);
        expect(parsed.sheets['sheet-1'].columnCount).toBe(26);
        expect(parsed.sheets['sheet-1'].defaultRowHeight).toBe(25);
        expect(parsed.sheets['sheet-1'].defaultColumnWidth).toBe(120);
      });
    });

    describe('JSON Round-trip', () => {
      it('should preserve all data through JSON import-export-import cycle', async () => {
        const originalData: IWorkbookData = {
          id: 'test-workbook',
          name: 'Test Workbook',
          sheets: {
            'sheet-1': {
              id: 'sheet-1',
              name: 'Sheet1',
              cellData: {
                0: {
                  0: { v: 'Name', t: CellValueType.STRING },
                  1: { v: 'Age', t: CellValueType.NUMBER },
                },
                1: {
                  0: { v: 'John', t: CellValueType.STRING },
                  1: { v: 30, f: '=B1', t: CellValueType.NUMBER, s: { bl: 1 } },
                },
              },
              mergeData: [
                { startRow: 0, endRow: 0, startColumn: 0, endColumn: 1 },
              ],
              rowData: { 0: { h: 30 } },
              columnData: { 0: { w: 200 } },
            },
            'sheet-2': {
              id: 'sheet-2',
              name: 'Sheet2',
              cellData: {},
            },
          },
        };

        // Export
        const exported = exportToJSON(originalData);

        // Import
        const imported = await importFromJSON(exported);

        // Export again
        const reexported = exportToJSON(imported);

        // Import again
        const reimported = await importFromJSON(reexported);

        // Verify complete preservation
        expect(reimported).toEqual(originalData);
        expect(Object.keys(reimported.sheets)).toHaveLength(2);
        expect(reimported.sheets['sheet-1'].cellData[1][1].f).toBe('=B1');
        expect(reimported.sheets['sheet-1'].cellData[1][1].s?.bl).toBe(1);
        expect(reimported.sheets['sheet-1'].mergeData).toHaveLength(1);
      });
    });
  });

  describe('Download functions', () => {
    describe('downloadCSVFile', () => {
      it('should create download link for CSV', () => {
        const csvData = 'Name,Age\nJohn,30';
        const filename = 'test.csv';

        const createElementSpy = vi.spyOn(document, 'createElement');
        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
        
        const mockLink = {
          href: '',
          download: '',
          click: vi.fn(),
        } as any;
        
        createElementSpy.mockReturnValue(mockLink);

        downloadCSVFile(csvData, filename);

        expect(mockLink.download).toBe(filename);
        expect(mockLink.click).toHaveBeenCalled();

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      });

      it('should add .csv extension if not present', () => {
        const csvData = 'Name,Age\nJohn,30';
        const filename = 'test';

        const createElementSpy = vi.spyOn(document, 'createElement');
        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
        
        const mockLink = {
          href: '',
          download: '',
          click: vi.fn(),
        } as any;
        
        createElementSpy.mockReturnValue(mockLink);

        downloadCSVFile(csvData, filename);

        expect(mockLink.download).toBe('test.csv');

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      });
    });

    describe('downloadJSONFile', () => {
      it('should create download link for JSON', () => {
        const jsonData = '{"test": "data"}';
        const filename = 'test.json';

        const createElementSpy = vi.spyOn(document, 'createElement');
        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
        
        const mockLink = {
          href: '',
          download: '',
          click: vi.fn(),
        } as any;
        
        createElementSpy.mockReturnValue(mockLink);

        downloadJSONFile(jsonData, filename);

        expect(mockLink.download).toBe(filename);
        expect(mockLink.click).toHaveBeenCalled();

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      });

      it('should add .json extension if not present', () => {
        const jsonData = '{"test": "data"}';
        const filename = 'test';

        const createElementSpy = vi.spyOn(document, 'createElement');
        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
        
        const mockLink = {
          href: '',
          download: '',
          click: vi.fn(),
        } as any;
        
        createElementSpy.mockReturnValue(mockLink);

        downloadJSONFile(jsonData, filename);

        expect(mockLink.download).toBe('test.json');

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      });
    });
  });
