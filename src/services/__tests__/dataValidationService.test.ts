/**
 * Data Validation Service Tests
 * 
 * Tests for data validation functionality including:
 * - Number validation (between, equal, greater than, less than)
 * - Date validation (before, after, between)
 * - List validation (dropdown, range-based)
 * - Checkbox validation
 * - Custom formula validation
 * - Rule management (get, clear, status)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DataValidationService,
  createDataValidationService,
  DataValidationType,
  DataValidationOperator,
  DataValidationErrorStyle,
} from '../dataValidationService';
import type { 
  FWorksheet, 
  FWorkbook, 
  FUniverWithDataValidation,
  FRangeWithDataValidation,
} from '../../types/univer.types';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockDataValidationBuilder = () => {
  const builder = {
    requireCheckbox: vi.fn().mockReturnThis(),
    requireDateAfter: vi.fn().mockReturnThis(),
    requireDateBefore: vi.fn().mockReturnThis(),
    requireDateBetween: vi.fn().mockReturnThis(),
    requireDateEqualTo: vi.fn().mockReturnThis(),
    requireDateNotBetween: vi.fn().mockReturnThis(),
    requireDateOnOrAfter: vi.fn().mockReturnThis(),
    requireDateOnOrBefore: vi.fn().mockReturnThis(),
    requireFormulaSatisfied: vi.fn().mockReturnThis(),
    requireNumberBetween: vi.fn().mockReturnThis(),
    requireNumberEqualTo: vi.fn().mockReturnThis(),
    requireNumberGreaterThan: vi.fn().mockReturnThis(),
    requireNumberGreaterThanOrEqualTo: vi.fn().mockReturnThis(),
    requireNumberLessThan: vi.fn().mockReturnThis(),
    requireNumberLessThanOrEqualTo: vi.fn().mockReturnThis(),
    requireNumberNotBetween: vi.fn().mockReturnThis(),
    requireNumberNotEqualTo: vi.fn().mockReturnThis(),
    requireValueInList: vi.fn().mockReturnThis(),
    requireValueInRange: vi.fn().mockReturnThis(),
    setOptions: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({
      type: DataValidationType.DECIMAL,
      operator: DataValidationOperator.BETWEEN,
    }),
  };
  return builder;
};

const createMockDataValidation = () => ({
  getCriteriaType: vi.fn().mockReturnValue(DataValidationType.DECIMAL),
  getCriteriaValues: vi.fn().mockReturnValue([1, 10]),
  getHelpText: vi.fn().mockReturnValue('Enter a number between 1 and 10'),
  getRanges: vi.fn().mockReturnValue([{ startRow: 0, startColumn: 0, endRow: 9, endColumn: 0 }]),
  setCriteria: vi.fn().mockReturnThis(),
  setOptions: vi.fn().mockReturnThis(),
  setRanges: vi.fn().mockReturnThis(),
  delete: vi.fn().mockResolvedValue(undefined),
});

const createMockRange = (): FRangeWithDataValidation => ({
  getRange: vi.fn().mockReturnValue({ startRow: 0, startColumn: 0, endRow: 9, endColumn: 0 }),
  getValues: vi.fn().mockReturnValue([[1], [2], [3]]),
  setDataValidation: vi.fn(),
  getDataValidation: vi.fn().mockReturnValue(createMockDataValidation()),
  getDataValidations: vi.fn().mockReturnValue([createMockDataValidation()]),
  getValidatorStatus: vi.fn().mockResolvedValue({
    validCells: 8,
    invalidCells: 2,
    totalCells: 10,
  }),
} as any);

const createMockWorksheet = (): FWorksheet => ({
  getRange: vi.fn().mockReturnValue(createMockRange()),
  getDataValidations: vi.fn().mockReturnValue([createMockDataValidation()]),
} as any);

const createMockWorkbook = (): FWorkbook => ({
  getActiveSheet: vi.fn().mockReturnValue(createMockWorksheet()),
} as any);

const createMockUniverAPI = (): FUniverWithDataValidation => ({
  getActiveWorkbook: vi.fn().mockReturnValue(createMockWorkbook()),
  newDataValidation: vi.fn().mockReturnValue(createMockDataValidationBuilder()),
  Enum: {
    DataValidationType,
    DataValidationOperator,
    DataValidationErrorStyle,
  },
} as any);

// ============================================================================
// Test Suite
// ============================================================================

describe('DataValidationService', () => {
  let service: DataValidationService;
  let mockAPI: FUniverWithDataValidation;

  beforeEach(() => {
    mockAPI = createMockUniverAPI();
    service = createDataValidationService(mockAPI, true);
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('Initialization', () => {
    it('should create service with factory function', () => {
      const newService = createDataValidationService(mockAPI, true);
      expect(newService).toBeInstanceOf(DataValidationService);
    });

    it('should update API instance', () => {
      const newAPI = createMockUniverAPI();
      service.updateAPI(newAPI, true);
      
      // Should use new API
      service.requireNumberBetween('A1:A10', 1, 10);
      expect(newAPI.getActiveWorkbook).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Number Validation Tests
  // ==========================================================================

  describe('Number Validation', () => {
    it('should create number between validation', async () => {
      const result = await service.requireNumberBetween('A1:A10', 1, 100);
      
      expect(result).toBe(true);
      expect(mockAPI.newDataValidation).toHaveBeenCalled();
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireNumberBetween).toHaveBeenCalledWith(1, 100);
      expect(builder.build).toHaveBeenCalled();
    });

    it('should create number between validation with options', async () => {
      const options = {
        allowBlank: true,
        showErrorMessage: true,
        error: 'Please enter a number between 1 and 100',
        errorStyle: DataValidationErrorStyle.STOP,
      };

      await service.requireNumberBetween('A1:A10', 1, 100, options);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.setOptions).toHaveBeenCalledWith(options);
    });

    it('should create number equal to validation', async () => {
      const result = await service.requireNumberEqualTo('A1:A10', 50);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireNumberEqualTo).toHaveBeenCalledWith(50);
    });

    it('should create number greater than validation', async () => {
      const result = await service.requireNumberGreaterThan('A1:A10', 0);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireNumberGreaterThan).toHaveBeenCalledWith(0);
    });

    it('should create number less than validation', async () => {
      const result = await service.requireNumberLessThan('A1:A10', 100);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireNumberLessThan).toHaveBeenCalledWith(100);
    });

    it('should throw error for invalid range', async () => {
      await expect(
        service.requireNumberBetween('invalid', 1, 10)
      ).rejects.toThrow('Invalid range notation');
    });
  });

  // ==========================================================================
  // Date Validation Tests
  // ==========================================================================

  describe('Date Validation', () => {
    it('should create date after validation', async () => {
      const date = new Date('2024-01-01');
      const result = await service.requireDateAfter('A1:A10', date);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireDateAfter).toHaveBeenCalledWith(date);
    });

    it('should create date before validation', async () => {
      const date = '2024-12-31';
      const result = await service.requireDateBefore('A1:A10', date);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireDateBefore).toHaveBeenCalledWith(date);
    });

    it('should create date between validation', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = await service.requireDateBetween('A1:A10', start, end);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireDateBetween).toHaveBeenCalledWith(start, end);
    });

    it('should create date validation with options', async () => {
      const date = new Date('2024-01-01');
      const options = {
        showErrorMessage: true,
        error: 'Date must be after 2024-01-01',
      };

      await service.requireDateAfter('A1:A10', date, options);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.setOptions).toHaveBeenCalledWith(options);
    });
  });

  // ==========================================================================
  // List Validation Tests
  // ==========================================================================

  describe('List Validation', () => {
    it('should create dropdown list validation', async () => {
      const values = ['Active', 'Inactive', 'Pending'];
      const result = await service.requireValueInList('A1:A10', values);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireValueInList).toHaveBeenCalledWith(values);
    });

    it('should create dropdown list with options', async () => {
      const values = ['Yes', 'No', 'Maybe'];
      const options = {
        showErrorMessage: true,
        error: 'Please select a valid option',
      };

      await service.requireValueInList('A1:A10', values, options);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.setOptions).toHaveBeenCalledWith(options);
    });

    it('should throw error for empty values array', async () => {
      await expect(
        service.requireValueInList('A1:A10', [])
      ).rejects.toThrow('Values array cannot be empty');
    });

    it('should create range-based dropdown validation', async () => {
      const result = await service.requireValueInRange('A1:A10', 'E1:E5');
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireValueInRange).toHaveBeenCalledWith('E1:E5');
    });

    it('should validate source range notation', async () => {
      await expect(
        service.requireValueInRange('A1:A10', 'invalid')
      ).rejects.toThrow('Invalid range notation');
    });
  });

  // ==========================================================================
  // Other Validation Types Tests
  // ==========================================================================

  describe('Other Validation Types', () => {
    it('should create checkbox validation', async () => {
      const result = await service.requireCheckbox('A1:A10');
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireCheckbox).toHaveBeenCalled();
    });

    it('should create custom formula validation', async () => {
      const formula = '=COUNTIF($A$2:$A$10,A2)=1';
      const result = await service.requireFormulaSatisfied('A2:A10', formula);
      
      expect(result).toBe(true);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.requireFormulaSatisfied).toHaveBeenCalledWith(formula);
    });

    it('should throw error for empty formula', async () => {
      await expect(
        service.requireFormulaSatisfied('A1:A10', '')
      ).rejects.toThrow('Formula must be a non-empty string');
    });

    it('should create formula validation with options', async () => {
      const formula = '=A1>0';
      const options = {
        showErrorMessage: true,
        error: 'Value must be positive',
      };

      await service.requireFormulaSatisfied('A1:A10', formula, options);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.setOptions).toHaveBeenCalledWith(options);
    });
  });

  // ==========================================================================
  // Rule Management Tests
  // ==========================================================================

  describe('Rule Management', () => {
    it('should get data validation for range', () => {
      const rule = service.getDataValidation('A1:A10');
      
      expect(rule).not.toBeNull();
      expect(rule?.getCriteriaType).toBeDefined();
    });

    it('should get all data validations for range', () => {
      const rules = service.getDataValidations('A1:A10');
      
      expect(rules).toHaveLength(1);
      expect(rules[0].getCriteriaType).toBeDefined();
    });

    it('should get all data validations for worksheet', () => {
      const rules = service.getAllDataValidations();
      
      expect(rules).toHaveLength(1);
      expect(rules[0].getCriteriaType).toBeDefined();
    });

    it('should clear data validation from range', async () => {
      const result = await service.clearDataValidation('A1:A10');
      
      expect(result).toBe(true);
      
      const mockWorksheet = mockAPI.getActiveWorkbook()?.getActiveSheet();
      const mockRange = mockWorksheet?.getRange('A1:A10') as FRangeWithDataValidation;
      expect(mockRange?.setDataValidation).toHaveBeenCalledWith(null);
    });

    it('should get validator status', async () => {
      const status = await service.getValidatorStatus('A1:A10');
      
      expect(status).toEqual({
        validCells: 8,
        invalidCells: 2,
        totalCells: 10,
      });
    });

    it('should return null when getting validation without active worksheet', () => {
      const noWorksheetAPI = {
        ...mockAPI,
        getActiveWorkbook: vi.fn().mockReturnValue(null),
      } as any;

      service.updateAPI(noWorksheetAPI, true);
      
      const rule = service.getDataValidation('A1:A10');
      expect(rule).toBeNull();
    });

    it('should return empty array when getting validations without active worksheet', () => {
      const noWorksheetAPI = {
        ...mockAPI,
        getActiveWorkbook: vi.fn().mockReturnValue(null),
      } as any;

      service.updateAPI(noWorksheetAPI, true);
      
      const rules = service.getDataValidations('A1:A10');
      expect(rules).toEqual([]);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle errors when Univer is not ready', async () => {
      service.updateAPI(null, false);
      
      await expect(
        service.requireNumberBetween('A1:A10', 1, 10)
      ).rejects.toThrow('No active worksheet available');
    });

    it('should handle errors when no active workbook', async () => {
      const noWorkbookAPI = {
        ...mockAPI,
        getActiveWorkbook: vi.fn().mockReturnValue(null),
      } as any;

      service.updateAPI(noWorkbookAPI, true);
      
      await expect(
        service.requireNumberBetween('A1:A10', 1, 10)
      ).rejects.toThrow('No active worksheet available');
    });

    it('should handle errors when range is invalid', async () => {
      await expect(
        service.requireNumberBetween('', 1, 10)
      ).rejects.toThrow('Range must be a non-empty string');
    });

    it('should handle errors when builder creation fails', async () => {
      const noBuilderAPI = {
        ...mockAPI,
        newDataValidation: vi.fn().mockReturnValue(null),
      } as any;

      service.updateAPI(noBuilderAPI, true);
      
      await expect(
        service.requireNumberBetween('A1:A10', 1, 10)
      ).rejects.toThrow('Failed to create data validation builder');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration Tests', () => {
    it('should create multiple validation rules on different ranges', async () => {
      await service.requireNumberBetween('A1:A10', 1, 100);
      await service.requireValueInList('B1:B10', ['Yes', 'No']);
      await service.requireDateAfter('C1:C10', new Date('2024-01-01'));
      
      expect(mockAPI.newDataValidation).toHaveBeenCalledTimes(3);
    });

    it('should create validation with all option types', async () => {
      const options = {
        allowBlank: true,
        showErrorMessage: true,
        error: 'Invalid value',
        errorStyle: DataValidationErrorStyle.WARNING,
        showInputMessage: true,
        prompt: 'Enter a value',
        promptTitle: 'Input Required',
      };

      await service.requireNumberBetween('A1:A10', 1, 10, options);
      
      const builder = (mockAPI as any).newDataValidation();
      expect(builder.setOptions).toHaveBeenCalledWith(options);
    });

    it('should handle validation workflow: create, get, clear', async () => {
      // Create validation
      await service.requireNumberBetween('A1:A10', 1, 100);
      
      // Get validation
      const rule = service.getDataValidation('A1:A10');
      expect(rule).not.toBeNull();
      
      // Clear validation
      const cleared = await service.clearDataValidation('A1:A10');
      expect(cleared).toBe(true);
    });

    it('should get validation status after creating rule', async () => {
      await service.requireNumberBetween('A1:A10', 1, 100);
      
      const status = await service.getValidatorStatus('A1:A10');
      expect(status.totalCells).toBe(10);
      expect(status.validCells).toBeGreaterThan(0);
    });
  });
});
