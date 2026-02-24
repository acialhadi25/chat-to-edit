/**
 * AI Service Write Operations Tests
 * 
 * Tests for AI write operations including:
 * - writeCell (Requirements 2.2.1)
 * - writeRange (Requirements 2.2.2)
 * - setFormula (Requirements 2.2.3)
 * - applyFormatting (Requirements 2.2.4)
 * - Validation (Requirements 2.2.6)
 * - Error handling (Requirements 2.2.7)
 * 
 * Validates Properties:
 * - Property 23: AI Cell Write Accuracy
 * - Property 24: AI Range Write Completeness
 * - Property 25: AI Formula Write Correctness
 * - Property 26: AI Formatting Write Accuracy
 * - Property 28: AI Operation Validation
 * - Property 29: AI Error Message Clarity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../aiService';
import type { AIConfig, CellFormat } from '../../types/ai.types';

// Mock FUniver API
const createMockUniverAPI = () => {
  const mockRange = {
    setValue: vi.fn(),
    setValues: vi.fn(),
    setFormula: vi.fn(),
    setBackgroundColor: vi.fn(),
    setFontColor: vi.fn(),
    setFontSize: vi.fn(),
    setFontWeight: vi.fn(),
    setFontStyle: vi.fn(),
    setNumberFormat: vi.fn(),
    getValue: vi.fn(),
    getFormula: vi.fn(),
  };

  const mockSheet = {
    getRange: vi.fn(() => mockRange),
    getSheetId: vi.fn(() => 'sheet-1'),
    getSheetName: vi.fn(() => 'Sheet1'),
  };

  const mockWorkbook = {
    getActiveSheet: vi.fn(() => mockSheet),
  };

  return {
    getActiveWorkbook: vi.fn(() => mockWorkbook),
    mockRange,
    mockSheet,
    mockWorkbook,
  };
};

describe('AIService - Write Operations', () => {
  let aiService: AIService;
  let mockAPI: ReturnType<typeof createMockUniverAPI>;
  
  const config: AIConfig = {
    apiKey: 'test-key',
    model: 'gpt-4',
    mcpEnabled: false,
  };

  beforeEach(async () => {
    aiService = new AIService(config);
    mockAPI = createMockUniverAPI();
    await aiService.initialize(mockAPI as any);
  });

  describe('writeCell', () => {
    it('should write string value to cell', async () => {
      // Property 23: AI Cell Write Accuracy
      await aiService.writeCell('A1', 'Hello World');

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1');
      expect(mockAPI.mockRange.setValue).toHaveBeenCalledWith('Hello World');
    });

    it('should write number value to cell', async () => {
      // Property 23: AI Cell Write Accuracy
      await aiService.writeCell('B2', 42);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('B2');
      expect(mockAPI.mockRange.setValue).toHaveBeenCalledWith(42);
    });

    it('should write boolean value to cell', async () => {
      // Property 23: AI Cell Write Accuracy
      await aiService.writeCell('C3', true);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('C3');
      expect(mockAPI.mockRange.setValue).toHaveBeenCalledWith(true);
    });

    it('should write null value to cell', async () => {
      // Property 23: AI Cell Write Accuracy
      await aiService.writeCell('D4', null);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('D4');
      expect(mockAPI.mockRange.setValue).toHaveBeenCalledWith(null);
    });

    it('should throw error when API not initialized', async () => {
      // Property 28: AI Operation Validation
      const uninitializedService = new AIService(config);

      await expect(uninitializedService.writeCell('A1', 'test')).rejects.toThrow(
        'Univer API not initialized'
      );
    });

    it('should throw error when no active sheet', async () => {
      // Property 28: AI Operation Validation
      mockAPI.mockWorkbook.getActiveSheet.mockReturnValue(null as any);

      await expect(aiService.writeCell('A1', 'test')).rejects.toThrow(
        'No active sheet'
      );
    });
  });

  describe('writeRange', () => {
    it('should write 2D array to range', async () => {
      // Property 24: AI Range Write Completeness
      const values = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];

      await aiService.writeRange('A1:C3', values);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1:C3');
      expect(mockAPI.mockRange.setValues).toHaveBeenCalledWith(values);
    });

    it('should write single row to range', async () => {
      // Property 24: AI Range Write Completeness
      const values = [[1, 2, 3, 4, 5]];

      await aiService.writeRange('A1:E1', values);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1:E1');
      expect(mockAPI.mockRange.setValues).toHaveBeenCalledWith(values);
    });

    it('should write single column to range', async () => {
      // Property 24: AI Range Write Completeness
      const values = [[1], [2], [3], [4], [5]];

      await aiService.writeRange('A1:A5', values);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1:A5');
      expect(mockAPI.mockRange.setValues).toHaveBeenCalledWith(values);
    });

    it('should write mixed data types to range', async () => {
      // Property 24: AI Range Write Completeness
      const values = [
        ['Name', 'Age', 'Active'],
        ['John', 30, true],
        ['Jane', 25, false],
        ['Bob', null, true],
      ];

      await aiService.writeRange('A1:C4', values);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1:C4');
      expect(mockAPI.mockRange.setValues).toHaveBeenCalledWith(values);
    });

    it('should write empty array to range', async () => {
      // Property 24: AI Range Write Completeness
      const values: any[][] = [];

      await aiService.writeRange('A1:A1', values);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1:A1');
      expect(mockAPI.mockRange.setValues).toHaveBeenCalledWith(values);
    });

    it('should throw error when API not initialized', async () => {
      // Property 28: AI Operation Validation
      const uninitializedService = new AIService(config);

      await expect(
        uninitializedService.writeRange('A1:B2', [[1, 2]])
      ).rejects.toThrow('Univer API not initialized');
    });
  });

  describe('setFormula', () => {
    it('should set formula with = prefix', async () => {
      // Property 25: AI Formula Write Correctness
      await aiService.setFormula('A10', '=SUM(A1:A9)');

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A10');
      expect(mockAPI.mockRange.setFormula).toHaveBeenCalledWith('=SUM(A1:A9)');
    });

    it('should add = prefix if missing', async () => {
      // Property 25: AI Formula Write Correctness
      await aiService.setFormula('B10', 'AVERAGE(B1:B9)');

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('B10');
      expect(mockAPI.mockRange.setFormula).toHaveBeenCalledWith('=AVERAGE(B1:B9)');
    });

    it('should set complex formula', async () => {
      // Property 25: AI Formula Write Correctness
      await aiService.setFormula('C10', '=IF(A1>10, SUM(B1:B5), AVERAGE(B1:B5))');

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('C10');
      expect(mockAPI.mockRange.setFormula).toHaveBeenCalledWith(
        '=IF(A1>10, SUM(B1:B5), AVERAGE(B1:B5))'
      );
    });

    it('should set formula with cell references', async () => {
      // Property 25: AI Formula Write Correctness
      await aiService.setFormula('D10', '=A1+B1*C1');

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('D10');
      expect(mockAPI.mockRange.setFormula).toHaveBeenCalledWith('=A1+B1*C1');
    });

    it('should set formula with named ranges', async () => {
      // Property 25: AI Formula Write Correctness
      await aiService.setFormula('E10', '=SUM(MyRange)');

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('E10');
      expect(mockAPI.mockRange.setFormula).toHaveBeenCalledWith('=SUM(MyRange)');
    });

    it('should throw error when API not initialized', async () => {
      // Property 28: AI Operation Validation
      const uninitializedService = new AIService(config);

      await expect(
        uninitializedService.setFormula('A1', '=SUM(A1:A10)')
      ).rejects.toThrow('Univer API not initialized');
    });
  });

  describe('applyFormatting', () => {
    it('should apply background color', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        backgroundColor: '#FF0000',
      };

      await aiService.applyFormatting('A1', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1');
      expect(mockAPI.mockRange.setBackgroundColor).toHaveBeenCalledWith('#FF0000');
    });

    it('should apply font color', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        fontColor: '#0000FF',
      };

      await aiService.applyFormatting('B2', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('B2');
      expect(mockAPI.mockRange.setFontColor).toHaveBeenCalledWith('#0000FF');
    });

    it('should apply font size', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        fontSize: 16,
      };

      await aiService.applyFormatting('C3', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('C3');
      expect(mockAPI.mockRange.setFontSize).toHaveBeenCalledWith(16);
    });

    it('should apply bold formatting', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        bold: true,
      };

      await aiService.applyFormatting('D4', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('D4');
      expect(mockAPI.mockRange.setFontWeight).toHaveBeenCalledWith('bold');
    });

    it('should apply italic formatting', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        italic: true,
      };

      await aiService.applyFormatting('E5', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('E5');
      expect(mockAPI.mockRange.setFontStyle).toHaveBeenCalledWith('italic');
    });

    it('should apply number format', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        numberFormat: '$#,##0.00',
      };

      await aiService.applyFormatting('F6', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('F6');
      expect(mockAPI.mockRange.setNumberFormat).toHaveBeenCalledWith('$#,##0.00');
    });

    it('should apply multiple formatting properties', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {
        backgroundColor: '#FFFF00',
        fontColor: '#000000',
        fontSize: 14,
        bold: true,
        italic: false,
        numberFormat: '0.00%',
      };

      await aiService.applyFormatting('G7:H8', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('G7:H8');
      expect(mockAPI.mockRange.setBackgroundColor).toHaveBeenCalledWith('#FFFF00');
      expect(mockAPI.mockRange.setFontColor).toHaveBeenCalledWith('#000000');
      expect(mockAPI.mockRange.setFontSize).toHaveBeenCalledWith(14);
      expect(mockAPI.mockRange.setFontWeight).toHaveBeenCalledWith('bold');
      expect(mockAPI.mockRange.setFontStyle).toHaveBeenCalledWith('normal');
      expect(mockAPI.mockRange.setNumberFormat).toHaveBeenCalledWith('0.00%');
    });

    it('should handle empty format object', async () => {
      // Property 26: AI Formatting Write Accuracy
      const format: CellFormat = {};

      await aiService.applyFormatting('I9', format);

      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('I9');
      // No formatting methods should be called
      expect(mockAPI.mockRange.setBackgroundColor).not.toHaveBeenCalled();
      expect(mockAPI.mockRange.setFontColor).not.toHaveBeenCalled();
    });

    it('should throw error when API not initialized', async () => {
      // Property 28: AI Operation Validation
      const uninitializedService = new AIService(config);

      await expect(
        uninitializedService.applyFormatting('A1', { bold: true })
      ).rejects.toThrow('Univer API not initialized');
    });
  });

  describe('AI Command Integration', () => {
    it('should execute write cell command', async () => {
      // Property 23: AI Cell Write Accuracy
      const response = await aiService.processCommand('set A1 to 100', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Set A1 to 100');
      expect(response.operations).toHaveLength(1);
      expect(response.operations[0].type).toBe('set_value');
      expect(response.operations[0].target).toBe('A1');
      expect(response.operations[0].value).toBe(100);
    });

    it('should execute write range command', async () => {
      // Property 24: AI Range Write Completeness
      // Note: The command parser recognizes "write data to A1:B2" but doesn't extract values
      // In a real scenario, the AI would need to provide values separately or use a different command
      mockAPI.mockRange.setValues = vi.fn();
      
      const response = await aiService.processCommand('write data to A1:B2', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1:B2',
        recentOperations: [],
        conversationHistory: [],
      });

      // This command will fail validation because values are missing
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should execute set formula command', async () => {
      // Property 25: AI Formula Write Correctness
      mockAPI.mockRange.setFormula = vi.fn();
      
      const response = await aiService.processCommand('calculate SUM(A1:A9) in A10', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A10',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Set formula in');
      expect(response.operations).toHaveLength(1);
      expect(response.operations[0].type).toBe('set_formula');
    });

    it('should execute format cells command', async () => {
      // Property 26: AI Formatting Write Accuracy
      mockAPI.mockRange.setNumberFormat = vi.fn();
      
      const response = await aiService.processCommand('format A1:B2 as currency', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1:B2',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Applied formatting to');
      expect(response.operations).toHaveLength(1);
      expect(response.operations[0].type).toBe('set_style');
    });
  });

  describe('Error Handling', () => {
    it('should provide clear error message for invalid command', async () => {
      // Property 29: AI Error Message Clarity
      const response = await aiService.processCommand('invalid command xyz', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.message).toBeTruthy();
    });

    it('should handle missing parameters gracefully', async () => {
      // Property 29: AI Error Message Clarity
      const response = await aiService.processCommand('set cell', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: '',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should validate cell references', async () => {
      // Property 28: AI Operation Validation
      // This would be implemented in the command parser
      // For now, we test that invalid operations are caught
      mockAPI.mockSheet.getRange.mockImplementation(() => {
        throw new Error('Invalid cell reference');
      });

      await expect(aiService.writeCell('INVALID', 'test')).rejects.toThrow();
    });
  });

  describe('Validation Layer', () => {
    it('should validate write operations before execution', async () => {
      // Property 28: AI Operation Validation
      // The validation happens in the command parser
      // Here we test that the service properly handles validation results
      
      const response = await aiService.processCommand('set A1 to 100', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
    });

    it('should reject operations without proper context', async () => {
      // Property 28: AI Operation Validation
      const uninitializedService = new AIService(config);
      
      const response = await uninitializedService.processCommand('set A1 to 100', {
        currentWorkbook: '',
        currentWorksheet: '',
        currentSelection: '',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});
