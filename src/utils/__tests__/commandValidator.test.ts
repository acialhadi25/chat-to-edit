/**
 * Unit Tests for Command Validator
 *
 * This file contains unit tests for validation rules to ensure
 * proper parameter validation for all action types.
 *
 * Feature: chat-excel-command-improvement
 * Task: 3.2 Write unit tests untuk validation rules
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import {
  validateAction,
  getValidationErrorMessage,
  type ValidationResult,
} from '../commandValidator';
import type { AIAction } from '../../types/excel';

describe('Command Validator', () => {
  describe('DATA_TRANSFORM validation', () => {
    it('should reject action with missing transformType', () => {
      const action: AIAction = {
        type: 'DATA_TRANSFORM',
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('transformType');
      expect(result.missingParams).toContain('transformType');
    });

    it('should reject action with missing target', () => {
      const action: AIAction = {
        type: 'DATA_TRANSFORM',
        transformType: 'uppercase',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('target');
      expect(result.missingParams).toContain('target');
    });

    it('should reject action with invalid transformType', () => {
      const action: AIAction = {
        type: 'DATA_TRANSFORM',
        transformType: 'invalid' as any,
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('transformType must be one of');
    });

    it('should accept valid DATA_TRANSFORM action', () => {
      const action: AIAction = {
        type: 'DATA_TRANSFORM',
        transformType: 'uppercase',
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept all valid transformType values', () => {
      const transformTypes: Array<'uppercase' | 'lowercase' | 'titlecase'> = [
        'uppercase',
        'lowercase',
        'titlecase',
      ];

      transformTypes.forEach((transformType) => {
        const action: AIAction = {
          type: 'DATA_TRANSFORM',
          transformType,
          target: { type: 'column', ref: 'A' },
          status: 'pending',
        };

        const result = validateAction(action);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('FIND_REPLACE validation', () => {
    it('should reject action with missing findValue', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        replaceValue: 'new',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('findValue');
      expect(result.missingParams).toContain('findValue');
    });

    it('should reject action with missing replaceValue', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        findValue: 'old',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('replaceValue');
      expect(result.missingParams).toContain('replaceValue');
    });

    it('should reject action with both findValue and replaceValue missing', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('findValue');
      expect(result.error).toContain('replaceValue');
      expect(result.missingParams).toContain('findValue');
      expect(result.missingParams).toContain('replaceValue');
    });

    it('should reject action with non-string findValue', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        findValue: 123 as any,
        replaceValue: 'new',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('findValue must be a string');
    });

    it('should reject action with non-string replaceValue', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        findValue: 'old',
        replaceValue: 123 as any,
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('replaceValue must be a string');
    });

    it('should accept valid FIND_REPLACE action', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        findValue: 'old',
        replaceValue: 'new',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept empty strings as valid values', () => {
      const action: AIAction = {
        type: 'FIND_REPLACE',
        findValue: '',
        replaceValue: '',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
    });
  });

  describe('CONDITIONAL_FORMAT validation', () => {
    it('should reject action with missing conditionType', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        formatStyle: { backgroundColor: '#ff0000' },
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('conditionType');
      expect(result.missingParams).toContain('conditionType');
    });

    it('should reject action with missing formatStyle', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('formatStyle');
      expect(result.missingParams).toContain('formatStyle');
    });

    it('should reject action with missing target', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        formatStyle: { backgroundColor: '#ff0000' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('target');
      expect(result.missingParams).toContain('target');
    });

    it('should reject action with all required params missing', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.missingParams).toContain('conditionType');
      expect(result.missingParams).toContain('formatStyle');
      expect(result.missingParams).toContain('target');
    });

    it('should reject action with invalid conditionType', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: 'invalid' as any,
        formatStyle: { backgroundColor: '#ff0000' },
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('conditionType must be one of');
    });

    it('should reject action with non-object formatStyle', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        formatStyle: 'invalid' as any,
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('formatStyle must be an object');
    });

    it('should reject action with invalid hex color in formatStyle.color', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        formatStyle: { color: 'red' },
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('formatStyle.color must be a valid hex color code');
    });

    it('should reject action with invalid hex color in formatStyle.backgroundColor', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        formatStyle: { backgroundColor: '#ff00' },
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('formatStyle.backgroundColor must be a valid hex color code');
    });

    it('should accept valid CONDITIONAL_FORMAT action', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        formatStyle: { backgroundColor: '#ff0000', color: '#ffffff' },
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept all valid conditionType values', () => {
      const conditionTypes = [
        '=',
        '!=',
        '>',
        '<',
        '>=',
        '<=',
        'contains',
        'not_contains',
        'empty',
        'not_empty',
        'equal_to',
        'not_equal',
        'greater_than',
        'less_than',
        'between',
      ];

      conditionTypes.forEach((conditionType) => {
        const action: AIAction = {
          type: 'CONDITIONAL_FORMAT',
          conditionType: conditionType as any,
          formatStyle: { backgroundColor: '#ff0000' },
          target: { type: 'column', ref: 'A' },
          status: 'pending',
        };

        const result = validateAction(action);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept formatStyle with only fontWeight', () => {
      const action: AIAction = {
        type: 'CONDITIONAL_FORMAT',
        conditionType: '>',
        formatStyle: { fontWeight: 'bold' },
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
    });
  });

  describe('SORT_DATA validation', () => {
    it('should reject action with missing sortColumn', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortDirection: 'asc',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('sortColumn');
      expect(result.missingParams).toContain('sortColumn');
    });

    it('should reject action with missing sortDirection', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortColumn: 'A',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('sortDirection');
      expect(result.missingParams).toContain('sortDirection');
    });

    it('should reject action with both sortColumn and sortDirection missing', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.missingParams).toContain('sortColumn');
      expect(result.missingParams).toContain('sortDirection');
    });

    it('should reject action with invalid sortDirection', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortColumn: 'A',
        sortDirection: 'invalid' as any,
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("sortDirection must be 'asc' or 'desc'");
    });

    it('should reject action with invalid sortColumn format', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortColumn: '123',
        sortDirection: 'asc',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('sortColumn must be a valid column letter');
      expect(result.warnings).toBeDefined();
    });

    it('should accept valid SORT_DATA action with asc direction', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortColumn: 'A',
        sortDirection: 'asc',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid SORT_DATA action with desc direction', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortColumn: 'B',
        sortDirection: 'desc',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept multi-letter column references', () => {
      const action: AIAction = {
        type: 'SORT_DATA',
        sortColumn: 'AA',
        sortDirection: 'asc',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
    });
  });

  describe('FILTER_DATA validation', () => {
    it('should reject action with missing filterOperator', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterValue: 100,
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('filterOperator');
      expect(result.missingParams).toContain('filterOperator');
    });

    it('should reject action with missing filterValue', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterOperator: '>',
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('filterValue');
      expect(result.missingParams).toContain('filterValue');
    });

    it('should reject action with missing target', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterOperator: '>',
        filterValue: 100,
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('target');
      expect(result.missingParams).toContain('target');
    });

    it('should reject action with all required params missing', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.missingParams).toContain('filterOperator');
      expect(result.missingParams).toContain('filterValue');
      expect(result.missingParams).toContain('target');
    });

    it('should reject action with invalid filterOperator', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterOperator: 'invalid' as any,
        filterValue: 100,
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('filterOperator must be one of');
    });

    it('should accept valid FILTER_DATA action with numeric filterValue', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterOperator: '>',
        filterValue: 100,
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid FILTER_DATA action with string filterValue', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterOperator: 'contains',
        filterValue: 'test',
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept all valid filterOperator values', () => {
      const operators = [
        '=',
        '!=',
        '>',
        '<',
        '>=',
        '<=',
        'contains',
        'not_contains',
        'empty',
        'not_empty',
      ];

      operators.forEach((filterOperator) => {
        const action: AIAction = {
          type: 'FILTER_DATA',
          filterOperator: filterOperator as any,
          filterValue: 'test',
          target: { type: 'column', ref: 'A' },
          status: 'pending',
        };

        const result = validateAction(action);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept filterValue of 0', () => {
      const action: AIAction = {
        type: 'FILTER_DATA',
        filterOperator: '=',
        filterValue: 0,
        target: { type: 'column', ref: 'A' },
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return empty string for valid result', () => {
      const result: ValidationResult = { valid: true };
      const message = getValidationErrorMessage(result);
      expect(message).toBe('');
    });

    it('should return error message for invalid result', () => {
      const result: ValidationResult = {
        valid: false,
        error: 'Missing required parameter: transformType',
      };
      const message = getValidationErrorMessage(result);
      expect(message).toBe('Missing required parameter: transformType');
    });

    it('should return default message when error is undefined', () => {
      const result: ValidationResult = { valid: false };
      const message = getValidationErrorMessage(result);
      expect(message).toBe('Validation failed');
    });
  });

  describe('Unknown action types', () => {
    it('should pass through unknown action types', () => {
      const action: AIAction = {
        type: 'INFO',
        status: 'pending',
      };

      const result = validateAction(action);

      expect(result.valid).toBe(true);
    });

    it('should reject action without type field', () => {
      const action = {
        status: 'pending',
      } as any;

      const result = validateAction(action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Action must have a type field');
      expect(result.missingParams).toContain('type');
    });
  });
});
