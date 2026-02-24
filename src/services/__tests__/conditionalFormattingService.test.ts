/**
 * Tests for ConditionalFormattingService
 * 
 * Tests conditional formatting operations including:
 * - Highlight rules (cell conditions, text conditions, number conditions)
 * - Data bars
 * - Color scales
 * - Icon sets
 * - Rule management (CRUD operations)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConditionalFormattingService,
  createConditionalFormattingService,
  type HighlightRuleOptions,
  type DataBarOptions,
  type ColorScaleOptions,
  type IconSetOptions,
} from '../conditionalFormattingService';
import type { FUniver, FWorkbook, FWorksheet, FRange, IRange } from '../../types/univer.types';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockRange = (rangeStr: string): FRange => {
  const mockRange: Partial<FRange> = {
    getRange: vi.fn(() => ({
      startRow: 0,
      endRow: 9,
      startColumn: 0,
      endColumn: 0,
    } as IRange)),
    getValue: vi.fn(() => 'test'),
    getValues: vi.fn(() => [['test']]),
    setValue: vi.fn(async () => true),
    setValues: vi.fn(async () => true),
    getConditionalFormattingRules: vi.fn(() => []),
    clearConditionalFormatRules: vi.fn(),
  };
  return mockRange as FRange;
};

const createMockRuleBuilder = () => {
  const builder: any = {
    whenCellEmpty: vi.fn(() => builder),
    whenCellNotEmpty: vi.fn(() => builder),
    whenNumberGreaterThan: vi.fn(() => builder),
    whenNumberLessThan: vi.fn(() => builder),
    whenNumberBetween: vi.fn(() => builder),
    whenTextContains: vi.fn(() => builder),
    whenFormulaSatisfied: vi.fn(() => builder),
    setBackground: vi.fn(() => builder),
    setFontColor: vi.fn(() => builder),
    setBold: vi.fn(() => builder),
    setItalic: vi.fn(() => builder),
    setDataBar: vi.fn(() => builder),
    setColorScale: vi.fn(() => builder),
    setIconSet: vi.fn(() => builder),
    setRanges: vi.fn(() => builder),
    build: vi.fn(() => ({
      cfId: 'rule-123',
      ranges: [{ startRow: 0, endRow: 9, startColumn: 0, endColumn: 0 }],
      rule: {},
    })),
  };
  return builder;
};

const createMockWorksheet = (): FWorksheet => {
  const mockBuilder = createMockRuleBuilder();
  
  const mockWorksheet: Partial<FWorksheet> & { 
    newConditionalFormattingRule?: any;
    addConditionalFormattingRule?: any;
    getConditionalFormattingRules?: any;
    deleteConditionalFormattingRule?: any;
    setConditionalFormattingRule?: any;
    moveConditionalFormattingRule?: any;
    clearConditionalFormatRules?: any;
  } = {
    getSheetId: vi.fn(() => 'sheet1'),
    getSheetName: vi.fn(() => 'Sheet1'),
    getRange: vi.fn((range: string) => createMockRange(range)),
    getCellData: vi.fn(() => null),
    getMaxRows: vi.fn(() => 1000),
    getMaxColumns: vi.fn(() => 26),
    activate: vi.fn(),
    newConditionalFormattingRule: vi.fn(() => mockBuilder),
    addConditionalFormattingRule: vi.fn(),
    getConditionalFormattingRules: vi.fn(() => []),
    deleteConditionalFormattingRule: vi.fn(),
    setConditionalFormattingRule: vi.fn(),
    moveConditionalFormattingRule: vi.fn(),
    clearConditionalFormatRules: vi.fn(),
  };
  return mockWorksheet as FWorksheet;
};

const createMockWorkbook = (): FWorkbook => {
  const mockWorksheet = createMockWorksheet();
  
  const mockWorkbook: Partial<FWorkbook> = {
    getId: vi.fn(() => 'workbook1'),
    getName: vi.fn(() => 'Test Workbook'),
    getActiveSheet: vi.fn(() => mockWorksheet),
    getSheetByName: vi.fn(() => mockWorksheet),
    getSheetBySheetId: vi.fn(() => mockWorksheet),
    create: vi.fn(() => mockWorksheet),
    save: vi.fn(() => ({ id: 'workbook1', name: 'Test Workbook', sheets: {} })),
    dispose: vi.fn(),
  };
  return mockWorkbook as FWorkbook;
};

const createMockUniverAPI = (): FUniver => {
  const mockWorkbook = createMockWorkbook();
  
  const mockUniverAPI: Partial<FUniver> = {
    createWorkbook: vi.fn(() => mockWorkbook),
    getActiveWorkbook: vi.fn(() => mockWorkbook),
    getWorkbook: vi.fn(() => mockWorkbook),
    disposeUnit: vi.fn(),
    addEvent: vi.fn(() => ({ dispose: vi.fn() })),
    Enum: {
      ConditionFormatNumberOperatorEnum: {
        greaterThan: 'greaterThan',
        greaterThanOrEqual: 'greaterThanOrEqual',
        lessThan: 'lessThan',
        lessThanOrEqual: 'lessThanOrEqual',
        equal: 'equal',
        notEqual: 'notEqual',
        between: 'between',
        notBetween: 'notBetween',
      },
    } as any,
  };
  return mockUniverAPI as FUniver;
};

// ============================================================================
// Tests
// ============================================================================

describe('ConditionalFormattingService', () => {
  let service: ConditionalFormattingService;
  let mockUniverAPI: FUniver;

  beforeEach(() => {
    mockUniverAPI = createMockUniverAPI();
    service = createConditionalFormattingService(mockUniverAPI, true);
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('createConditionalFormattingService', () => {
    it('should create a service instance', () => {
      const newService = createConditionalFormattingService(mockUniverAPI, true);
      expect(newService).toBeInstanceOf(ConditionalFormattingService);
    });
  });

  // ==========================================================================
  // Highlight Rule Tests
  // ==========================================================================

  describe('createHighlightRule', () => {
    it('should create a highlight rule for empty cells', async () => {
      const options: HighlightRuleOptions = {
        condition: 'empty',
        backgroundColor: '#FF0000',
      };

      const ruleId = await service.createHighlightRule('A1:A10', options);

      expect(ruleId).toBe('rule-123');
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).newConditionalFormattingRule).toHaveBeenCalled();
      expect((worksheet as any).addConditionalFormattingRule).toHaveBeenCalled();
    });

    it('should create a highlight rule for non-empty cells', async () => {
      const options: HighlightRuleOptions = {
        condition: 'notEmpty',
        fontColor: '#00FF00',
        bold: true,
      };

      const ruleId = await service.createHighlightRule('B1:B10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a highlight rule for numbers greater than value', async () => {
      const options: HighlightRuleOptions = {
        condition: 'greaterThan',
        value: 100,
        backgroundColor: '#FFFF00',
        italic: true,
      };

      const ruleId = await service.createHighlightRule('C1:C10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a highlight rule for numbers less than value', async () => {
      const options: HighlightRuleOptions = {
        condition: 'lessThan',
        value: 50,
        backgroundColor: '#FF00FF',
      };

      const ruleId = await service.createHighlightRule('D1:D10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a highlight rule for numbers between values', async () => {
      const options: HighlightRuleOptions = {
        condition: 'between',
        value: 10,
        value2: 90,
        backgroundColor: '#00FFFF',
      };

      const ruleId = await service.createHighlightRule('E1:E10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a highlight rule for text contains', async () => {
      const options: HighlightRuleOptions = {
        condition: 'contains',
        value: 'error',
        backgroundColor: '#FF0000',
        fontColor: '#FFFFFF',
      };

      const ruleId = await service.createHighlightRule('F1:F10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a highlight rule for formula condition', async () => {
      const options: HighlightRuleOptions = {
        condition: 'formula',
        value: '=A1>10',
        backgroundColor: '#00FF00',
      };

      const ruleId = await service.createHighlightRule('G1:G10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should throw error for invalid range', async () => {
      const options: HighlightRuleOptions = {
        condition: 'empty',
        backgroundColor: '#FF0000',
      };

      await expect(service.createHighlightRule('invalid', options)).rejects.toThrow('Invalid range notation');
    });

    it('should throw error for invalid color', async () => {
      const options: HighlightRuleOptions = {
        condition: 'empty',
        backgroundColor: 'red', // Invalid format
      };

      await expect(service.createHighlightRule('A1:A10', options)).rejects.toThrow('Invalid color format');
    });

    it('should throw error for missing value in greaterThan condition', async () => {
      const options: HighlightRuleOptions = {
        condition: 'greaterThan',
        backgroundColor: '#FF0000',
      };

      await expect(service.createHighlightRule('A1:A10', options)).rejects.toThrow('Value must be a number');
    });

    it('should throw error for missing values in between condition', async () => {
      const options: HighlightRuleOptions = {
        condition: 'between',
        value: 10,
        backgroundColor: '#FF0000',
      };

      await expect(service.createHighlightRule('A1:A10', options)).rejects.toThrow('Both value and value2 must be numbers');
    });
  });

  // ==========================================================================
  // Data Bar Tests
  // ==========================================================================

  describe('createDataBarRule', () => {
    it('should create a data bar rule with auto min/max', async () => {
      const options: DataBarOptions = {
        min: { type: 'autoMin' },
        max: { type: 'autoMax' },
        positiveColor: '#00FF00',
        negativeColor: '#FF0000',
        isShowValue: true,
      };

      const ruleId = await service.createDataBarRule('A1:A10', options);

      expect(ruleId).toBe('rule-123');
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).newConditionalFormattingRule).toHaveBeenCalled();
    });

    it('should create a data bar rule with numeric min/max', async () => {
      const options: DataBarOptions = {
        min: { type: 'num', value: 0 },
        max: { type: 'num', value: 100 },
        positiveColor: '#0000FF',
        isGradient: true,
      };

      const ruleId = await service.createDataBarRule('B1:B10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a data bar rule with percentage values', async () => {
      const options: DataBarOptions = {
        min: { type: 'percent', value: 0 },
        max: { type: 'percent', value: 100 },
        positiveColor: '#FFFF00',
        isShowValue: false,
      };

      const ruleId = await service.createDataBarRule('C1:C10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should throw error for invalid color in data bar', async () => {
      const options: DataBarOptions = {
        min: { type: 'autoMin' },
        max: { type: 'autoMax' },
        positiveColor: 'green', // Invalid format
      };

      await expect(service.createDataBarRule('A1:A10', options)).rejects.toThrow('Invalid color format');
    });
  });

  // ==========================================================================
  // Color Scale Tests
  // ==========================================================================

  describe('createColorScaleRule', () => {
    it('should create a 2-color scale rule', async () => {
      const options: ColorScaleOptions = {
        minColor: '#FF0000',
        maxColor: '#00FF00',
      };

      const ruleId = await service.createColorScaleRule('A1:A10', options);

      expect(ruleId).toBe('rule-123');
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).newConditionalFormattingRule).toHaveBeenCalled();
    });

    it('should create a 3-color scale rule', async () => {
      const options: ColorScaleOptions = {
        minColor: '#FF0000',
        midColor: '#FFFF00',
        maxColor: '#00FF00',
      };

      const ruleId = await service.createColorScaleRule('B1:B10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a color scale with custom values', async () => {
      const options: ColorScaleOptions = {
        minColor: '#0000FF',
        maxColor: '#FF0000',
        minValue: { type: 'num', value: 0 },
        maxValue: { type: 'num', value: 100 },
      };

      const ruleId = await service.createColorScaleRule('C1:C10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should throw error for invalid min color', async () => {
      const options: ColorScaleOptions = {
        minColor: 'red', // Invalid format
        maxColor: '#00FF00',
      };

      await expect(service.createColorScaleRule('A1:A10', options)).rejects.toThrow('Invalid color format');
    });

    it('should throw error for invalid max color', async () => {
      const options: ColorScaleOptions = {
        minColor: '#FF0000',
        maxColor: 'green', // Invalid format
      };

      await expect(service.createColorScaleRule('A1:A10', options)).rejects.toThrow('Invalid color format');
    });
  });

  // ==========================================================================
  // Icon Set Tests
  // ==========================================================================

  describe('createIconSetRule', () => {
    it('should create a 3-arrow icon set rule', async () => {
      const options: IconSetOptions = {
        iconType: '3Arrows',
        isShowValue: true,
      };

      const ruleId = await service.createIconSetRule('A1:A10', options);

      expect(ruleId).toBe('rule-123');
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).newConditionalFormattingRule).toHaveBeenCalled();
    });

    it('should create a 4-arrow icon set rule', async () => {
      const options: IconSetOptions = {
        iconType: '4Arrows',
        isShowValue: false,
      };

      const ruleId = await service.createIconSetRule('B1:B10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create a 5-rating icon set rule', async () => {
      const options: IconSetOptions = {
        iconType: '5Rating',
        reverseIconOrder: true,
      };

      const ruleId = await service.createIconSetRule('C1:C10', options);

      expect(ruleId).toBe('rule-123');
    });

    it('should create icon set with traffic lights', async () => {
      const options: IconSetOptions = {
        iconType: '3TrafficLights',
        isShowValue: true,
      };

      const ruleId = await service.createIconSetRule('D1:D10', options);

      expect(ruleId).toBe('rule-123');
    });
  });

  // ==========================================================================
  // Rule Management Tests
  // ==========================================================================

  describe('getRules', () => {
    it('should get rules for a range', async () => {
      const rules = await service.getRules('A1:A10');

      expect(Array.isArray(rules)).toBe(true);
    });

    it('should throw error for invalid range', async () => {
      await expect(service.getRules('invalid')).rejects.toThrow('Invalid range notation');
    });
  });

  describe('getAllRules', () => {
    it('should get all rules for the worksheet', async () => {
      const rules = await service.getAllRules();

      expect(Array.isArray(rules)).toBe(true);
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).getConditionalFormattingRules).toHaveBeenCalled();
    });
  });

  describe('deleteRule', () => {
    it('should delete a rule by ID', async () => {
      const success = await service.deleteRule('rule-123');

      expect(success).toBe(true);
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).deleteConditionalFormattingRule).toHaveBeenCalledWith('rule-123');
    });

    it('should throw error for missing rule ID', async () => {
      await expect(service.deleteRule('')).rejects.toThrow('Rule ID is required');
    });
  });

  describe('updateRule', () => {
    it('should update a rule', async () => {
      const updatedRule = {
        ranges: [{ startRow: 0, endRow: 19, startColumn: 0, endColumn: 0 }],
      };

      const success = await service.updateRule('rule-123', updatedRule);

      expect(success).toBe(true);
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).setConditionalFormattingRule).toHaveBeenCalledWith('rule-123', updatedRule);
    });

    it('should throw error for missing rule ID', async () => {
      await expect(service.updateRule('', {})).rejects.toThrow('Rule ID is required');
    });
  });

  describe('moveRule', () => {
    it('should move a rule before another rule', async () => {
      const success = await service.moveRule('rule-123', 'rule-456', 'before');

      expect(success).toBe(true);
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).moveConditionalFormattingRule).toHaveBeenCalledWith('rule-123', 'rule-456', 'before');
    });

    it('should move a rule after another rule', async () => {
      const success = await service.moveRule('rule-123', 'rule-456', 'after');

      expect(success).toBe(true);
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).moveConditionalFormattingRule).toHaveBeenCalledWith('rule-123', 'rule-456', 'after');
    });

    it('should throw error for missing rule IDs', async () => {
      await expect(service.moveRule('', 'rule-456', 'before')).rejects.toThrow('Both rule IDs are required');
      await expect(service.moveRule('rule-123', '', 'before')).rejects.toThrow('Both rule IDs are required');
    });
  });

  describe('clearRules', () => {
    it('should clear rules from a range', async () => {
      const success = await service.clearRules('A1:A10');

      expect(success).toBe(true);
    });

    it('should throw error for invalid range', async () => {
      await expect(service.clearRules('invalid')).rejects.toThrow('Invalid range notation');
    });
  });

  describe('clearAllRules', () => {
    it('should clear all rules from the worksheet', async () => {
      const success = await service.clearAllRules();

      expect(success).toBe(true);
      const worksheet = mockUniverAPI.getActiveWorkbook()?.getActiveSheet();
      expect((worksheet as any).clearConditionalFormatRules).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle missing univerAPI', async () => {
      const serviceWithoutAPI = createConditionalFormattingService(null, false);
      
      await expect(serviceWithoutAPI.createHighlightRule('A1:A10', {
        condition: 'empty',
        backgroundColor: '#FF0000',
      })).rejects.toThrow('No active worksheet available');
    });

    it('should handle missing workbook', async () => {
      const mockAPI = createMockUniverAPI();
      (mockAPI.getActiveWorkbook as any) = vi.fn(() => null);
      const serviceWithoutWorkbook = createConditionalFormattingService(mockAPI, true);
      
      await expect(serviceWithoutWorkbook.createHighlightRule('A1:A10', {
        condition: 'empty',
        backgroundColor: '#FF0000',
      })).rejects.toThrow('No active worksheet available');
    });

    it('should handle missing worksheet', async () => {
      const mockAPI = createMockUniverAPI();
      const mockWorkbook = mockAPI.getActiveWorkbook();
      if (mockWorkbook) {
        (mockWorkbook.getActiveSheet as any) = vi.fn(() => null);
      }
      const serviceWithoutWorksheet = createConditionalFormattingService(mockAPI, true);
      
      await expect(serviceWithoutWorksheet.createHighlightRule('A1:A10', {
        condition: 'empty',
        backgroundColor: '#FF0000',
      })).rejects.toThrow('No active worksheet available');
    });
  });

  // ==========================================================================
  // Update API Tests
  // ==========================================================================

  describe('updateAPI', () => {
    it('should update the univerAPI instance', () => {
      const newMockAPI = createMockUniverAPI();
      service.updateAPI(newMockAPI, true);
      
      // Verify the API was updated by making a call
      expect(() => service.getAllRules()).not.toThrow();
    });

    it('should handle updating to null API', () => {
      service.updateAPI(null, false);
      
      expect(service.getAllRules()).rejects.toThrow('No active worksheet available');
    });
  });
});
