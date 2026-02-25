/**
 * Tests for Conditional Formatting Service
 * 
 * Validates that conditional formatting rules are correctly applied using Univer's native API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  applyConditionalFormatting,
  clearConditionalFormatting,
  getConditionalFormattingRules,
  type ConditionalFormattingParams,
} from '../conditionalFormattingService';
import type { FUniver, FWorkbook, FWorksheet, FRange } from '@/types/univer.types';

describe('conditionalFormattingService', () => {
  let mockUniverAPI: Partial<FUniver>;
  let mockWorkbook: Partial<FWorkbook>;
  let mockWorksheet: Partial<FWorksheet>;
  let mockRange: Partial<FRange>;
  let mockBuilder: any;
  let addedRules: any[];

  beforeEach(() => {
    addedRules = [];

    // Mock builder
    mockBuilder = {
      setRanges: vi.fn().mockReturnThis(),
      whenTextContains: vi.fn().mockReturnThis(),
      whenTextEqualTo: vi.fn().mockReturnThis(),
      whenTextStartsWith: vi.fn().mockReturnThis(),
      whenTextEndsWith: vi.fn().mockReturnThis(),
      setBackground: vi.fn().mockReturnThis(),
      setFontColor: vi.fn().mockReturnThis(),
      setBold: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({ cfId: 'rule-1', type: 'test' }),
    };

    // Mock range
    mockRange = {
      getRange: vi.fn().mockReturnValue({ startRow: 0, startColumn: 0, endRow: 10, endColumn: 0 }),
      clearConditionalFormatRules: vi.fn(),
    };

    // Mock worksheet
    mockWorksheet = {
      getRange: vi.fn().mockReturnValue(mockRange),
      newConditionalFormattingRule: vi.fn().mockReturnValue(mockBuilder),
      addConditionalFormattingRule: vi.fn((rule) => {
        addedRules.push(rule);
      }),
      getConditionalFormattingRules: vi.fn().mockReturnValue(addedRules),
      clearConditionalFormatRules: vi.fn(),
    };

    // Mock workbook
    mockWorkbook = {
      getActiveSheet: vi.fn().mockReturnValue(mockWorksheet),
    };

    // Mock univerAPI
    mockUniverAPI = {
      getActiveWorkbook: vi.fn().mockReturnValue(mockWorkbook),
    };
  });

  describe('applyConditionalFormatting', () => {
    it('should apply text contains rule', () => {
      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'contains',
            value: 'test',
            format: {
              backgroundColor: '#ff0000',
              color: '#ffffff',
            },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(true);
      expect(mockWorksheet.getRange).toHaveBeenCalledWith('G:G');
      expect(mockBuilder.whenTextContains).toHaveBeenCalledWith('test');
      expect(mockBuilder.setBackground).toHaveBeenCalledWith('#ff0000');
      expect(mockBuilder.setFontColor).toHaveBeenCalledWith('#ffffff');
      expect(mockWorksheet.addConditionalFormattingRule).toHaveBeenCalled();
      expect(addedRules).toHaveLength(1);
    });

    it('should apply text equals rule', () => {
      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'equals',
            value: 'exact',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(true);
      expect(mockBuilder.whenTextEqualTo).toHaveBeenCalledWith('exact');
      expect(mockBuilder.setBackground).toHaveBeenCalledWith('#00ff00');
      expect(addedRules).toHaveLength(1);
    });

    it('should apply text starts with rule', () => {
      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'startsWith',
            value: 'prefix',
            format: {
              bold: true,
            },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(true);
      expect(mockBuilder.whenTextStartsWith).toHaveBeenCalledWith('prefix');
      expect(mockBuilder.setBold).toHaveBeenCalledWith(true);
      expect(addedRules).toHaveLength(1);
    });

    it('should apply text ends with rule', () => {
      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'endsWith',
            value: 'suffix',
            format: {
              color: '#0000ff',
            },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(true);
      expect(mockBuilder.whenTextEndsWith).toHaveBeenCalledWith('suffix');
      expect(mockBuilder.setFontColor).toHaveBeenCalledWith('#0000ff');
      expect(addedRules).toHaveLength(1);
    });

    it('should apply multiple rules', () => {
      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'equals',
            value: 'lunas',
            format: { backgroundColor: '#00ff00' },
          },
          {
            condition: 'equals',
            value: 'pending',
            format: { backgroundColor: '#ffff00' },
          },
          {
            condition: 'equals',
            value: 'belum bayar',
            format: { backgroundColor: '#ff0000' },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(true);
      expect(addedRules).toHaveLength(3);
    });

    it('should handle range notation', () => {
      const params: ConditionalFormattingParams = {
        target: { type: 'range', ref: 'G2:G13' },
        rules: [
          {
            condition: 'contains',
            value: 'test',
            format: { backgroundColor: '#ff0000' },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(true);
      expect(mockWorksheet.getRange).toHaveBeenCalledWith('G2:G13');
    });

    it('should return false when no workbook', () => {
      mockUniverAPI.getActiveWorkbook = vi.fn().mockReturnValue(null);

      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'contains',
            value: 'test',
            format: { backgroundColor: '#ff0000' },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(false);
    });

    it('should return false when no worksheet', () => {
      mockWorkbook.getActiveSheet = vi.fn().mockReturnValue(null);

      const params: ConditionalFormattingParams = {
        target: { type: 'column', ref: 'G' },
        rules: [
          {
            condition: 'contains',
            value: 'test',
            format: { backgroundColor: '#ff0000' },
          },
        ],
      };

      const result = applyConditionalFormatting(mockUniverAPI as FUniver, params);

      expect(result).toBe(false);
    });
  });

  describe('clearConditionalFormatting', () => {
    it('should clear all rules when no range specified', () => {
      const result = clearConditionalFormatting(mockUniverAPI as FUniver);

      expect(result).toBe(true);
      expect(mockWorksheet.clearConditionalFormatRules).toHaveBeenCalled();
    });

    it('should clear rules for specific range', () => {
      const result = clearConditionalFormatting(mockUniverAPI as FUniver, 'G:G');

      expect(result).toBe(true);
      expect(mockWorksheet.getRange).toHaveBeenCalledWith('G:G');
      expect(mockRange.clearConditionalFormatRules).toHaveBeenCalled();
    });

    it('should return false when no workbook', () => {
      mockUniverAPI.getActiveWorkbook = vi.fn().mockReturnValue(null);

      const result = clearConditionalFormatting(mockUniverAPI as FUniver);

      expect(result).toBe(false);
    });
  });

  describe('getConditionalFormattingRules', () => {
    it('should return all rules', () => {
      addedRules.push({ cfId: 'rule-1' }, { cfId: 'rule-2' });

      const rules = getConditionalFormattingRules(mockUniverAPI as FUniver);

      expect(rules).toHaveLength(2);
      expect(rules[0].cfId).toBe('rule-1');
      expect(rules[1].cfId).toBe('rule-2');
    });

    it('should return empty array when no workbook', () => {
      mockUniverAPI.getActiveWorkbook = vi.fn().mockReturnValue(null);

      const rules = getConditionalFormattingRules(mockUniverAPI as FUniver);

      expect(rules).toEqual([]);
    });

    it('should return empty array when no worksheet', () => {
      mockWorkbook.getActiveSheet = vi.fn().mockReturnValue(null);

      const rules = getConditionalFormattingRules(mockUniverAPI as FUniver);

      expect(rules).toEqual([]);
    });
  });
});
