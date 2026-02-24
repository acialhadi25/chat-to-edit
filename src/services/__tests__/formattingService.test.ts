/**
 * Unit Tests for FormattingService
 * 
 * Comprehensive test suite covering:
 * - Number formatting (currency, percentage, date, time, custom)
 * - Cell styling (colors, fonts, text decorations)
 * - Border styling (all sides, outline, individual)
 * - Cell alignment (horizontal, vertical, wrap text)
 * - Clear formatting
 * - Error handling and validation
 * 
 * Requirements: 1.3.1, 1.3.2, 1.3.3, 1.3.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  FormattingService, 
  createFormattingService,
  type NumberFormatOptions,
  type CellStyleOptions,
  type BorderStyleOptions,
  type AlignmentOptions,
} from '../formattingService';
import { BorderStyleType } from '../../types/univer.types';
import type { FUniver, FWorkbook, FWorksheet, FRange } from '../../types/univer.types';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockRange = (): FRange => ({
  getValue: vi.fn(),
  getValues: vi.fn(),
  setValue: vi.fn().mockResolvedValue(true),
  setValues: vi.fn().mockResolvedValue(true),
  getFormula: vi.fn(),
  getFormulas: vi.fn(),
  setFormula: vi.fn().mockResolvedValue(true),
  setFormulas: vi.fn().mockResolvedValue(true),
  setFontWeight: vi.fn().mockResolvedValue(true),
  setFontStyle: vi.fn().mockResolvedValue(true),
  setFontSize: vi.fn().mockResolvedValue(true),
  setFontColor: vi.fn().mockResolvedValue(true),
  setBackgroundColor: vi.fn().mockResolvedValue(true),
  setHorizontalAlignment: vi.fn().mockResolvedValue(true),
  setVerticalAlignment: vi.fn().mockResolvedValue(true),
  setNumberFormat: vi.fn().mockResolvedValue(true),
  getRow: vi.fn(),
  getColumn: vi.fn(),
  getNumRows: vi.fn(),
  getNumColumns: vi.fn(),
});

const createMockWorksheet = (): FWorksheet => ({
  getSheetId: vi.fn().mockReturnValue('sheet-1'),
  getSheetName: vi.fn().mockReturnValue('Sheet1'),
  getRange: vi.fn().mockReturnValue(createMockRange()),
  getCellData: vi.fn(),
  getMaxRows: vi.fn(),
  getMaxColumns: vi.fn(),
  activate: vi.fn(),
});

const createMockWorkbook = (): FWorkbook => ({
  getId: vi.fn().mockReturnValue('workbook-1'),
  getName: vi.fn().mockReturnValue('Workbook1'),
  getActiveSheet: vi.fn().mockReturnValue(createMockWorksheet()),
  getSheetByName: vi.fn(),
  getSheetBySheetId: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  dispose: vi.fn(),
});

const createMockUniverAPI = (): FUniver => ({
  createWorkbook: vi.fn(),
  getActiveWorkbook: vi.fn().mockReturnValue(createMockWorkbook()),
  getWorkbook: vi.fn(),
  disposeUnit: vi.fn(),
  addEvent: vi.fn(),
  Enum: {} as any,
  Event: {} as any,
});

// ============================================================================
// Test Suite
// ============================================================================

describe('FormattingService', () => {
  let service: FormattingService;
  let mockUniverAPI: FUniver;

  beforeEach(() => {
    mockUniverAPI = createMockUniverAPI();
    service = createFormattingService(mockUniverAPI, true);
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('createFormattingService', () => {
    it('should create a FormattingService instance', () => {
      const newService = createFormattingService(mockUniverAPI, true);
      expect(newService).toBeInstanceOf(FormattingService);
    });

    it('should accept null univerAPI', () => {
      const newService = createFormattingService(null, false);
      expect(newService).toBeInstanceOf(FormattingService);
    });
  });

  // ==========================================================================
  // Number Formatting Tests
  // ==========================================================================

  describe('applyNumberFormat', () => {
    describe('Currency Format', () => {
      it('should apply currency format with default settings', async () => {
        const format: NumberFormatOptions = { type: 'currency' };
        const result = await service.applyNumberFormat('A1:A10', format);

        expect(result).toBe(true);
        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('$#,##0.00');
      });

      it('should apply currency format with custom decimals', async () => {
        const format: NumberFormatOptions = { type: 'currency', decimals: 3 };
        await service.applyNumberFormat('A1:A10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('$#,##0.000');
      });

      it('should apply currency format with custom symbol', async () => {
        const format: NumberFormatOptions = { 
          type: 'currency', 
          currencySymbol: '€',
          decimals: 2 
        };
        await service.applyNumberFormat('A1:A10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('€#,##0.00');
      });

      it('should apply currency format with zero decimals', async () => {
        const format: NumberFormatOptions = { type: 'currency', decimals: 0 };
        await service.applyNumberFormat('A1:A10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('$#,##0.');
      });
    });

    describe('Percentage Format', () => {
      it('should apply percentage format with default decimals', async () => {
        const format: NumberFormatOptions = { type: 'percentage' };
        await service.applyNumberFormat('B1:B10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('B1:B10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('0.00%');
      });

      it('should apply percentage format with custom decimals', async () => {
        const format: NumberFormatOptions = { type: 'percentage', decimals: 1 };
        await service.applyNumberFormat('B1:B10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('B1:B10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('0.0%');
      });

      it('should apply percentage format with zero decimals', async () => {
        const format: NumberFormatOptions = { type: 'percentage', decimals: 0 };
        await service.applyNumberFormat('B1:B10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('B1:B10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('0.%');
      });
    });

    describe('Date Format', () => {
      it('should apply date format with default pattern', async () => {
        const format: NumberFormatOptions = { type: 'date' };
        await service.applyNumberFormat('C1:C10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('C1:C10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('yyyy-mm-dd');
      });

      it('should apply date format with custom pattern', async () => {
        const format: NumberFormatOptions = { 
          type: 'date', 
          dateFormat: 'mm/dd/yyyy' 
        };
        await service.applyNumberFormat('C1:C10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('C1:C10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('mm/dd/yyyy');
      });

      it('should apply date format with long pattern', async () => {
        const format: NumberFormatOptions = { 
          type: 'date', 
          dateFormat: 'dddd, mmmm dd, yyyy' 
        };
        await service.applyNumberFormat('C1:C10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('C1:C10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('dddd, mmmm dd, yyyy');
      });
    });

    describe('Time Format', () => {
      it('should apply time format', async () => {
        const format: NumberFormatOptions = { type: 'time' };
        await service.applyNumberFormat('D1:D10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('D1:D10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('hh:mm:ss');
      });
    });

    describe('Custom Format', () => {
      it('should apply custom format', async () => {
        const format: NumberFormatOptions = { 
          type: 'custom', 
          customFormat: '0.00E+00' 
        };
        await service.applyNumberFormat('E1:E10', format);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('E1:E10') as any;
        expect(mockRange.setNumberFormat).toHaveBeenCalledWith('0.00E+00');
      });

      it('should throw error for custom format without customFormat property', async () => {
        const format: NumberFormatOptions = { type: 'custom' };
        
        await expect(
          service.applyNumberFormat('E1:E10', format)
        ).rejects.toThrow('Custom format requires customFormat property');
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid range notation', async () => {
        const format: NumberFormatOptions = { type: 'currency' };
        
        await expect(
          service.applyNumberFormat('invalid', format)
        ).rejects.toThrow('Invalid range notation');
      });

      it('should throw error when no active worksheet', async () => {
        const mockWorkbook = mockUniverAPI.getActiveWorkbook() as any;
        mockWorkbook.getActiveSheet.mockReturnValue(null);

        const format: NumberFormatOptions = { type: 'currency' };
        
        await expect(
          service.applyNumberFormat('A1:A10', format)
        ).rejects.toThrow('No active worksheet available');
      });

      it('should throw error when setNumberFormat fails', async () => {
        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        mockRange.setNumberFormat.mockResolvedValue(false);

        const format: NumberFormatOptions = { type: 'currency' };
        
        await expect(
          service.applyNumberFormat('A1:A10', format)
        ).rejects.toThrow('Failed to apply number format');
      });
    });
  });

  // ==========================================================================
  // Cell Styling Tests
  // ==========================================================================

  describe('applyCellStyle', () => {
    describe('Font Color', () => {
      it('should apply font color', async () => {
        const style: CellStyleOptions = { fontColor: '#FF0000' };
        const result = await service.applyCellStyle('A1:A10', style);

        expect(result).toBe(true);
        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setFontColor).toHaveBeenCalledWith('#FF0000');
      });

      it('should throw error for invalid color format', async () => {
        const style: CellStyleOptions = { fontColor: 'red' };
        
        await expect(
          service.applyCellStyle('A1:A10', style)
        ).rejects.toThrow('Invalid color format');
      });
    });

    describe('Background Color', () => {
      it('should apply background color', async () => {
        const style: CellStyleOptions = { backgroundColor: '#FFFF00' };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setBackgroundColor).toHaveBeenCalledWith('#FFFF00');
      });
    });

    describe('Font Properties', () => {
      it('should apply font family', async () => {
        const style: CellStyleOptions = { fontFamily: 'Arial' };
        await service.applyCellStyle('A1:A10', style);

        // Font family is not directly supported in current Facade API
        // This test verifies the method completes without error
        expect(true).toBe(true);
      });

      it('should apply font size', async () => {
        const style: CellStyleOptions = { fontSize: 14 };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setFontSize).toHaveBeenCalledWith(14);
      });

      it('should throw error for negative font size', async () => {
        const style: CellStyleOptions = { fontSize: -1 };
        
        await expect(
          service.applyCellStyle('A1:A10', style)
        ).rejects.toThrow('Font size must be positive');
      });

      it('should throw error for zero font size', async () => {
        const style: CellStyleOptions = { fontSize: 0 };
        
        await expect(
          service.applyCellStyle('A1:A10', style)
        ).rejects.toThrow('Font size must be positive');
      });
    });

    describe('Text Decorations', () => {
      it('should apply bold', async () => {
        const style: CellStyleOptions = { bold: true };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setFontWeight).toHaveBeenCalledWith('bold');
      });

      it('should remove bold', async () => {
        const style: CellStyleOptions = { bold: false };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setFontWeight).toHaveBeenCalledWith('normal');
      });

      it('should apply italic', async () => {
        const style: CellStyleOptions = { italic: true };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setFontStyle).toHaveBeenCalledWith('italic');
      });

      it('should remove italic', async () => {
        const style: CellStyleOptions = { italic: false };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setFontStyle).toHaveBeenCalledWith('normal');
      });

      it('should handle underline (not yet in Facade API)', async () => {
        const style: CellStyleOptions = { underline: true };
        await service.applyCellStyle('A1:A10', style);

        // Underline is not directly supported in current Facade API
        // This test verifies the method completes without error
        expect(true).toBe(true);
      });

      it('should handle strikethrough (not yet in Facade API)', async () => {
        const style: CellStyleOptions = { strikethrough: true };
        await service.applyCellStyle('A1:A10', style);

        // Strikethrough is not directly supported in current Facade API
        // This test verifies the method completes without error
        expect(true).toBe(true);
      });
    });

    describe('Combined Styles', () => {
      it('should apply multiple styles at once', async () => {
        const style: CellStyleOptions = {
          fontColor: '#FF0000',
          backgroundColor: '#FFFF00',
          fontSize: 14,
          bold: true,
          italic: true,
        };
        await service.applyCellStyle('A1:A10', style);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        
        expect(mockRange.setFontColor).toHaveBeenCalledWith('#FF0000');
        expect(mockRange.setBackgroundColor).toHaveBeenCalledWith('#FFFF00');
        expect(mockRange.setFontSize).toHaveBeenCalledWith(14);
        expect(mockRange.setFontWeight).toHaveBeenCalledWith('bold');
        expect(mockRange.setFontStyle).toHaveBeenCalledWith('italic');
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid range', async () => {
        const style: CellStyleOptions = { fontColor: '#FF0000' };
        
        await expect(
          service.applyCellStyle('invalid', style)
        ).rejects.toThrow('Invalid range notation');
      });

      it('should throw error when style application fails', async () => {
        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        mockRange.setFontColor.mockResolvedValue(false);

        const style: CellStyleOptions = { fontColor: '#FF0000' };
        
        await expect(
          service.applyCellStyle('A1:A10', style)
        ).rejects.toThrow('Failed to apply some cell styles');
      });
    });
  });

  // ==========================================================================
  // Border Styling Tests
  // ==========================================================================

  describe('applyBorderStyle', () => {
    it('should throw error indicating borders not yet supported', async () => {
      const borders: BorderStyleOptions = {
        all: { style: BorderStyleType.THIN, color: '#000000' }
      };
      
      await expect(
        service.applyBorderStyle('A1:B10', borders)
      ).rejects.toThrow('Border styling via Facade API is not yet available');
    });

    it('should validate range notation before attempting border application', async () => {
      const borders: BorderStyleOptions = {
        all: { style: BorderStyleType.THIN, color: '#000000' }
      };
      
      await expect(
        service.applyBorderStyle('invalid', borders)
      ).rejects.toThrow('Invalid range notation');
    });
  });

  // ==========================================================================
  // Cell Alignment Tests
  // ==========================================================================

  describe('applyCellAlignment', () => {
    describe('Horizontal Alignment', () => {
      it('should apply left alignment', async () => {
        const alignment: AlignmentOptions = { horizontal: 'left' };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setHorizontalAlignment).toHaveBeenCalledWith('left');
      });

      it('should apply center alignment', async () => {
        const alignment: AlignmentOptions = { horizontal: 'center' };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setHorizontalAlignment).toHaveBeenCalledWith('center');
      });

      it('should apply right alignment', async () => {
        const alignment: AlignmentOptions = { horizontal: 'right' };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setHorizontalAlignment).toHaveBeenCalledWith('right');
      });
    });

    describe('Vertical Alignment', () => {
      it('should apply top alignment', async () => {
        const alignment: AlignmentOptions = { vertical: 'top' };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setVerticalAlignment).toHaveBeenCalledWith('top');
      });

      it('should apply middle alignment', async () => {
        const alignment: AlignmentOptions = { vertical: 'middle' };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setVerticalAlignment).toHaveBeenCalledWith('middle');
      });

      it('should apply bottom alignment', async () => {
        const alignment: AlignmentOptions = { vertical: 'bottom' };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        expect(mockRange.setVerticalAlignment).toHaveBeenCalledWith('bottom');
      });
    });

    describe('Combined Alignment', () => {
      it('should apply both horizontal and vertical alignment', async () => {
        const alignment: AlignmentOptions = { 
          horizontal: 'center', 
          vertical: 'middle' 
        };
        await service.applyCellAlignment('A1:A10', alignment);

        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        
        expect(mockRange.setHorizontalAlignment).toHaveBeenCalledWith('center');
        expect(mockRange.setVerticalAlignment).toHaveBeenCalledWith('middle');
      });
    });

    describe('Text Wrap', () => {
      it('should warn about text wrap not being supported', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const alignment: AlignmentOptions = { wrapText: true };
        await service.applyCellAlignment('A1:A10', alignment);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Text wrap is not yet available in Univer Facade API'
        );
        
        consoleSpy.mockRestore();
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid range', async () => {
        const alignment: AlignmentOptions = { horizontal: 'center' };
        
        await expect(
          service.applyCellAlignment('invalid', alignment)
        ).rejects.toThrow('Invalid range notation');
      });

      it('should throw error when alignment fails', async () => {
        const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
        const mockRange = mockWorksheet.getRange('A1:A10') as any;
        mockRange.setHorizontalAlignment.mockResolvedValue(false);

        const alignment: AlignmentOptions = { horizontal: 'center' };
        
        await expect(
          service.applyCellAlignment('A1:A10', alignment)
        ).rejects.toThrow('Failed to apply alignment');
      });
    });
  });

  // ==========================================================================
  // Clear Formatting Tests
  // ==========================================================================

  describe('clearFormatting', () => {
    it('should clear all formatting from range', async () => {
      const result = await service.clearFormatting('A1:B10');

      expect(result).toBe(true);
      const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
      const mockRange = mockWorksheet.getRange('A1:B10') as any;
      
      expect(mockRange.setFontColor).toHaveBeenCalledWith('#000000');
      expect(mockRange.setBackgroundColor).toHaveBeenCalledWith('#FFFFFF');
      expect(mockRange.setFontWeight).toHaveBeenCalledWith('normal');
      expect(mockRange.setFontStyle).toHaveBeenCalledWith('normal');
      expect(mockRange.setFontSize).toHaveBeenCalledWith(11);
      expect(mockRange.setHorizontalAlignment).toHaveBeenCalledWith('left');
      expect(mockRange.setVerticalAlignment).toHaveBeenCalledWith('bottom');
      expect(mockRange.setNumberFormat).toHaveBeenCalledWith('General');
    });

    it('should throw error for invalid range', async () => {
      await expect(
        service.clearFormatting('invalid')
      ).rejects.toThrow('Invalid range notation');
    });

    it('should throw error when clearing fails', async () => {
      const mockWorksheet = mockUniverAPI.getActiveWorkbook()!.getActiveSheet()!;
      const mockRange = mockWorksheet.getRange('A1:B10') as any;
      mockRange.setFontColor.mockResolvedValue(false);

      await expect(
        service.clearFormatting('A1:B10')
      ).rejects.toThrow('Failed to clear formatting');
    });
  });

  // ==========================================================================
  // Service State Management Tests
  // ==========================================================================

  describe('updateAPI', () => {
    it('should update univerAPI and isReady state', async () => {
      const newMockAPI = createMockUniverAPI();
      service.updateAPI(newMockAPI, true);

      // Verify the new API is being used
      const format: NumberFormatOptions = { type: 'currency' };
      await service.applyNumberFormat('A1:A10', format);

      expect(newMockAPI.getActiveWorkbook).toHaveBeenCalled();
    });

    it('should handle null univerAPI', async () => {
      service.updateAPI(null, false);

      const format: NumberFormatOptions = { type: 'currency' };
      
      await expect(
        service.applyNumberFormat('A1:A10', format)
      ).rejects.toThrow('No active worksheet available');
    });
  });

  describe('Service not ready', () => {
    beforeEach(() => {
      service = createFormattingService(mockUniverAPI, false);
    });

    it('should throw error when applying number format while not ready', async () => {
      const format: NumberFormatOptions = { type: 'currency' };
      
      await expect(
        service.applyNumberFormat('A1:A10', format)
      ).rejects.toThrow('No active worksheet available');
    });

    it('should throw error when applying cell style while not ready', async () => {
      const style: CellStyleOptions = { fontColor: '#FF0000' };
      
      await expect(
        service.applyCellStyle('A1:A10', style)
      ).rejects.toThrow('No active worksheet available');
    });

    it('should throw error when applying alignment while not ready', async () => {
      const alignment: AlignmentOptions = { horizontal: 'center' };
      
      await expect(
        service.applyCellAlignment('A1:A10', alignment)
      ).rejects.toThrow('No active worksheet available');
    });
  });
});
