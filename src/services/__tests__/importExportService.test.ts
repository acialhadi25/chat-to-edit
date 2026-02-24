/**
 * Unit Tests for Import/Export Service
 * 
 * Tests Excel import/export functionality with format preservation.
 * 
 * @see Requirements 3.1.1, 3.1.2, 3.1.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ExcelJS from 'exceljs';
import {
  importFromExcel,
  exportToExcel,
  downloadExcelFile,
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
      expect(buffer.byteLength || buffer.length).toBeGreaterThan(0);

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
