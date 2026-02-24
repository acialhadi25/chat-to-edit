/**
 * AI Service Read Operations Tests
 * 
 * Tests for AI read operations including:
 * - readCell (Requirements 2.1.1, 2.1.3, 2.1.4)
 * - readRange (Requirements 2.1.2, 2.1.3, 2.1.4)
 * - readWorksheet (Requirements 2.1.5)
 * - analyzeData (Requirements 2.1.4, 2.4.4)
 * 
 * Validates Properties:
 * - Property 17: AI Cell Read Accuracy
 * - Property 18: AI Range Read Completeness
 * - Property 19: AI Formula Read Accuracy
 * - Property 20: AI Formatting Read Accuracy
 * - Property 21: AI Worksheet Structure Read Accuracy
 * - Property 22: AI Response Format Consistency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../aiService';
import type { AIConfig } from '../../types/ai.types';

// Mock FUniver API
const createMockUniverAPI = () => {
  const mockRange = {
    getValue: vi.fn(),
    getFormula: vi.fn(),
    getValues: vi.fn(),
    getFormulas: vi.fn(),
    getBackgroundColor: vi.fn(),
    getFontColor: vi.fn(),
    getFontSize: vi.fn(),
    getFontWeight: vi.fn(),
    getFontStyle: vi.fn(),
    getNumberFormat: vi.fn(),
    getA1Notation: vi.fn(),
  };

  const mockSheet = {
    getRange: vi.fn(() => mockRange),
    getSheetId: vi.fn(() => 'sheet-1'),
    getSheetName: vi.fn(() => 'Sheet1'),
    getSheetConfig: vi.fn(() => ({
      rowCount: 1000,
      columnCount: 26,
    })),
    getDataRange: vi.fn(() => mockRange),
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

describe('AIService - Read Operations', () => {
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

  describe('readCell', () => {
    it('should read cell value correctly', async () => {
      // Property 17: AI Cell Read Accuracy
      mockAPI.mockRange.getValue.mockReturnValue(100);
      mockAPI.mockRange.getFormula.mockReturnValue('');

      const result = await aiService.readCell('A1');

      expect(result.value).toBe(100);
      expect(result.type).toBe('number');
      expect(mockAPI.mockSheet.getRange).toHaveBeenCalledWith('A1');
    });

    it('should read cell with formula', async () => {
      // Property 19: AI Formula Read Accuracy
      mockAPI.mockRange.getValue.mockReturnValue(150);
      mockAPI.mockRange.getFormula.mockReturnValue('=SUM(A1:A10)');

      const result = await aiService.readCell('B1');

      expect(result.value).toBe(150);
      expect(result.formula).toBe('=SUM(A1:A10)');
      expect(result.type).toBe('formula');
    });

    it('should read cell with formatting', async () => {
      // Property 20: AI Formatting Read Accuracy
      mockAPI.mockRange.getValue.mockReturnValue('Hello');
      mockAPI.mockRange.getFormula.mockReturnValue('');
      mockAPI.mockRange.getBackgroundColor.mockReturnValue('#FF0000');
      mockAPI.mockRange.getFontColor.mockReturnValue('#FFFFFF');
      mockAPI.mockRange.getFontSize.mockReturnValue(14);

      const result = await aiService.readCell('C1');

      expect(result.value).toBe('Hello');
      expect(result.type).toBe('string');
      expect(result.formatting).toBeDefined();
      expect(result.formatting?.backgroundColor).toBe('#FF0000');
      expect(result.formatting?.fontColor).toBe('#FFFFFF');
      expect(result.formatting?.fontSize).toBe(14);
    });

    it('should handle null/empty cells', async () => {
      mockAPI.mockRange.getValue.mockReturnValue(null);
      mockAPI.mockRange.getFormula.mockReturnValue('');

      const result = await aiService.readCell('D1');

      expect(result.value).toBeNull();
      expect(result.type).toBe('null');
    });

    it('should detect boolean type', async () => {
      mockAPI.mockRange.getValue.mockReturnValue(true);
      mockAPI.mockRange.getFormula.mockReturnValue('');

      const result = await aiService.readCell('E1');

      expect(result.value).toBe(true);
      expect(result.type).toBe('boolean');
    });

    it('should throw error when API not initialized', async () => {
      const uninitializedService = new AIService(config);

      await expect(uninitializedService.readCell('A1')).rejects.toThrow(
        'Univer API not initialized'
      );
    });
  });

  describe('readRange', () => {
    it('should read range values correctly', async () => {
      // Property 18: AI Range Read Completeness
      const mockValues = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.readRange('A1:C3');

      expect(result.values).toEqual(mockValues);
      expect(result.rowCount).toBe(3);
      expect(result.columnCount).toBe(3);
      expect(result.range).toBe('A1:C3');
    });

    it('should read range with formulas', async () => {
      // Property 19: AI Formula Read Accuracy
      const mockValues = [[10], [20], [30]];
      const mockFormulas = [['=A1*2'], ['=A2*2'], ['=SUM(A1:A2)']];
      
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue(mockFormulas);

      const result = await aiService.readRange('B1:B3');

      expect(result.values).toEqual(mockValues);
      expect(result.formulas).toEqual(mockFormulas);
    });

    it('should handle empty range', async () => {
      mockAPI.mockRange.getValues.mockReturnValue([]);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.readRange('A1:A1');

      expect(result.values).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.columnCount).toBe(0);
    });

    it('should handle single cell range', async () => {
      mockAPI.mockRange.getValues.mockReturnValue([[42]]);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.readRange('A1:A1');

      expect(result.values).toEqual([[42]]);
      expect(result.rowCount).toBe(1);
      expect(result.columnCount).toBe(1);
    });
  });

  describe('readWorksheet', () => {
    it('should read worksheet metadata correctly', async () => {
      // Property 21: AI Worksheet Structure Read Accuracy
      mockAPI.mockRange.getFormulas.mockReturnValue([
        ['', '=SUM(A1:A10)'],
        ['', ''],
      ]);
      mockAPI.mockRange.getA1Notation.mockReturnValue('A1:B10');

      const result = await aiService.readWorksheet();

      expect(result.id).toBe('sheet-1');
      expect(result.name).toBe('Sheet1');
      expect(result.rowCount).toBe(1000);
      expect(result.columnCount).toBe(26);
      expect(result.cellCount).toBe(26000);
      expect(result.hasFormulas).toBe(true);
      expect(result.dataRanges).toContain('A1:B10');
    });

    it('should detect worksheet without formulas', async () => {
      mockAPI.mockRange.getFormulas.mockReturnValue([
        ['', ''],
        ['', ''],
      ]);
      mockAPI.mockRange.getA1Notation.mockReturnValue('A1:B2');

      const result = await aiService.readWorksheet();

      expect(result.hasFormulas).toBe(false);
    });
  });

  describe('analyzeData', () => {
    it('should analyze numeric data correctly', async () => {
      // Property 22: AI Response Format Consistency
      // Requirements 2.4.4: AI Summary Statistics Accuracy
      const mockValues = [
        [10, 20, 30],
        [15, 25, 35],
        [20, 30, 40],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:C3');

      expect(result.range).toBe('A1:C3');
      expect(result.rowCount).toBe(3);
      expect(result.columnCount).toBe(3);
      
      // Check statistics
      expect(result.summary.count).toBe(9);
      expect(result.summary.sum).toBe(225); // 10+20+30+15+25+35+20+30+40
      expect(result.summary.mean).toBeCloseTo(25, 2);
      expect(result.summary.min).toBe(10);
      expect(result.summary.max).toBe(40);
      expect(result.summary.median).toBe(25);
    });

    it('should detect data types per column', async () => {
      const mockValues = [
        ['Name', 100, true],
        ['John', 200, false],
        ['Jane', 300, true],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:C3');

      expect(result.dataTypes['Column 1']).toBe('string');
      expect(result.dataTypes['Column 2']).toBe('number');
      expect(result.dataTypes['Column 3']).toBe('boolean');
    });

    it('should detect mixed data types', async () => {
      const mockValues = [
        [1, 'text'],
        ['text', 2],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:B2');

      expect(result.dataTypes['Column 1']).toBe('mixed');
      expect(result.dataTypes['Column 2']).toBe('mixed');
    });

    it('should detect patterns in data', async () => {
      const mockValues = [
        [10, 20, null],
        [15, 25, ''],
        [20, 30, 40],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:C3');

      expect(result.patterns).toBeDefined();
      expect(result.patterns?.some(p => p.includes('empty cells'))).toBe(true);
      expect(result.patterns?.some(p => p.includes('positive'))).toBe(true);
    });

    it('should provide suggestions', async () => {
      const mockValues = Array.from({ length: 15 }, (_, i) => [i + 1, i * 2]);
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:B15');

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
      expect(result.suggestions?.some(s => s.includes('chart'))).toBe(true);
      expect(result.suggestions?.some(s => s.includes('filter'))).toBe(true);
    });

    it('should calculate mode correctly', async () => {
      const mockValues = [
        [5, 5, 5],
        [10, 10, 20],
        [5, 30, 40],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:C3');

      expect(result.summary.mode).toBe(5); // 5 appears 4 times
    });

    it('should handle empty data', async () => {
      mockAPI.mockRange.getValues.mockReturnValue([]);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const result = await aiService.analyzeData('A1:A1');

      expect(result.rowCount).toBe(0);
      expect(result.columnCount).toBe(0);
      expect(Object.keys(result.summary)).toHaveLength(0);
    });
  });

  describe('Response Format Consistency', () => {
    it('should format readCell response for AI consumption', async () => {
      // Property 22: AI Response Format Consistency
      mockAPI.mockRange.getValue.mockReturnValue(42);
      mockAPI.mockRange.getFormula.mockReturnValue('=6*7');
      mockAPI.mockRange.getBackgroundColor.mockReturnValue('#FFFF00');

      const response = await aiService.processCommand('get value of A1', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Cell A1:');
      expect(response.message).toContain('Value: 42');
      expect(response.message).toContain('Type: formula');
      expect(response.message).toContain('Formula: =6*7');
      expect(response.operations).toEqual([]);
      expect(response.requiresConfirmation).toBe(false);
    });

    it('should format readRange response for AI consumption', async () => {
      const mockValues = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const response = await aiService.processCommand('get values of A1:C4', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1:C4',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Range A1:C4:');
      expect(response.message).toContain('4 rows × 3 columns');
      expect(response.message).toContain('Sample data');
      expect(response.message).toContain('Row 1: 1, 2, 3');
      expect(response.message).toContain('and 1 more rows');
    });

    it('should format analyzeData response for AI consumption', async () => {
      const mockValues = [
        [10, 20],
        [15, 25],
        [20, 30],
      ];
      mockAPI.mockRange.getValues.mockReturnValue(mockValues);
      mockAPI.mockRange.getFormulas.mockReturnValue([]);

      const response = await aiService.processCommand('analyze data in A1:B3', {
        currentWorkbook: 'wb1',
        currentWorksheet: 'sheet1',
        currentSelection: 'A1:B3',
        recentOperations: [],
        conversationHistory: [],
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Data Analysis for A1:B3:');
      expect(response.message).toContain('Statistics:');
      expect(response.message).toContain('Count:');
      expect(response.message).toContain('Mean:');
      expect(response.message).toContain('Data Types:');
      expect(response.message).toContain('Suggestions:');
    });
  });
});
