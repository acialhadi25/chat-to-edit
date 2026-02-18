/**
 * Command Validator Module
 *
 * Provides comprehensive validation for AI action commands before execution.
 * Validates required parameters, parameter types, and value constraints for each action type.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type { AIAction, ActionType } from '../types/excel';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  missingParams?: string[];
  warnings?: string[];
}

/**
 * Validation rule definition for an action type
 */
export interface ValidationRule {
  actionType: ActionType;
  requiredParams: string[];
  optionalParams: string[];
  validator: (action: AIAction) => ValidationResult;
}

/**
 * Validation rules for all action types
 * Each rule defines required parameters and custom validation logic
 */
export const VALIDATION_RULES: Record<string, ValidationRule> = {
  DATA_TRANSFORM: {
    actionType: 'DATA_TRANSFORM',
    requiredParams: ['transformType', 'target'],
    optionalParams: ['targetColumns'],
    validator: (action: AIAction): ValidationResult => {
      const validTransformTypes = ['uppercase', 'lowercase', 'titlecase'];

      if (!action.transformType) {
        return {
          valid: false,
          error: 'Missing required parameter: transformType',
          missingParams: ['transformType'],
        };
      }

      if (!validTransformTypes.includes(action.transformType)) {
        return {
          valid: false,
          error: `transformType must be one of: ${validTransformTypes.join(', ')}`,
        };
      }

      if (!action.target) {
        return {
          valid: false,
          error: 'Missing required parameter: target',
          missingParams: ['target'],
        };
      }

      return { valid: true };
    },
  },

  FIND_REPLACE: {
    actionType: 'FIND_REPLACE',
    requiredParams: ['findValue', 'replaceValue'],
    optionalParams: ['target'],
    validator: (action: AIAction): ValidationResult => {
      const missingParams: string[] = [];

      if (action.findValue === undefined || action.findValue === null) {
        missingParams.push('findValue');
      }

      if (action.replaceValue === undefined || action.replaceValue === null) {
        missingParams.push('replaceValue');
      }

      if (missingParams.length > 0) {
        return {
          valid: false,
          error: `Missing required parameter(s): ${missingParams.join(', ')}`,
          missingParams,
        };
      }

      if (typeof action.findValue !== 'string') {
        return {
          valid: false,
          error: 'findValue must be a string',
        };
      }

      if (typeof action.replaceValue !== 'string') {
        return {
          valid: false,
          error: 'replaceValue must be a string',
        };
      }

      return { valid: true };
    },
  },

  CONDITIONAL_FORMAT: {
    actionType: 'CONDITIONAL_FORMAT',
    requiredParams: ['conditionType', 'formatStyle', 'target'],
    optionalParams: ['conditionValues'],
    validator: (action: AIAction): ValidationResult => {
      const missingParams: string[] = [];

      if (!action.conditionType) {
        missingParams.push('conditionType');
      }

      if (!action.formatStyle) {
        missingParams.push('formatStyle');
      }

      if (!action.target) {
        missingParams.push('target');
      }

      if (missingParams.length > 0) {
        return {
          valid: false,
          error: `Missing required parameter(s): ${missingParams.join(', ')}`,
          missingParams,
        };
      }

      const validConditions = [
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

      if (action.conditionType && !validConditions.includes(action.conditionType)) {
        return {
          valid: false,
          error: `conditionType must be one of: ${validConditions.join(', ')}`,
        };
      }

      if (!action.formatStyle || typeof action.formatStyle !== 'object') {
        return {
          valid: false,
          error:
            'formatStyle must be an object with color, backgroundColor, or fontWeight properties',
        };
      }

      // Validate hex color codes if present
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (action.formatStyle.color && !hexColorRegex.test(action.formatStyle.color)) {
        return {
          valid: false,
          error: 'formatStyle.color must be a valid hex color code (e.g., #ff0000)',
        };
      }

      if (
        action.formatStyle.backgroundColor &&
        !hexColorRegex.test(action.formatStyle.backgroundColor)
      ) {
        return {
          valid: false,
          error: 'formatStyle.backgroundColor must be a valid hex color code (e.g., #ff0000)',
        };
      }

      return { valid: true };
    },
  },

  SORT_DATA: {
    actionType: 'SORT_DATA',
    requiredParams: ['sortColumn', 'sortDirection'],
    optionalParams: [],
    validator: (action: AIAction): ValidationResult => {
      const missingParams: string[] = [];

      if (!action.sortColumn) {
        missingParams.push('sortColumn');
      }

      if (!action.sortDirection) {
        missingParams.push('sortDirection');
      }

      if (missingParams.length > 0) {
        return {
          valid: false,
          error: `Missing required parameter(s): ${missingParams.join(', ')}`,
          missingParams,
        };
      }

      const validDirections = ['asc', 'desc'];
      if (action.sortDirection && !validDirections.includes(action.sortDirection)) {
        return {
          valid: false,
          error: "sortDirection must be 'asc' or 'desc'",
        };
      }

      // Validate column reference format (should be letter like A, B, C)
      if (typeof action.sortColumn === 'string' && !/^[A-Z]+$/.test(action.sortColumn)) {
        return {
          valid: false,
          error: 'sortColumn must be a valid column letter (e.g., A, B, C)',
          warnings: ['Column reference should use letters, not numbers'],
        };
      }

      return { valid: true };
    },
  },

  FILTER_DATA: {
    actionType: 'FILTER_DATA',
    requiredParams: ['filterOperator', 'filterValue', 'target'],
    optionalParams: [],
    validator: (action: AIAction): ValidationResult => {
      const missingParams: string[] = [];

      if (!action.filterOperator) {
        missingParams.push('filterOperator');
      }

      if (action.filterValue === undefined || action.filterValue === null) {
        missingParams.push('filterValue');
      }

      if (!action.target) {
        missingParams.push('target');
      }

      if (missingParams.length > 0) {
        return {
          valid: false,
          error: `Missing required parameter(s): ${missingParams.join(', ')}`,
          missingParams,
        };
      }

      const validOperators = [
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

      if (action.filterOperator && !validOperators.includes(action.filterOperator)) {
        return {
          valid: false,
          error: `filterOperator must be one of: ${validOperators.join(', ')}`,
        };
      }

      return { valid: true };
    },
  },
};

/**
 * Validate an action object against its validation rules
 *
 * @param action - The action object to validate
 * @returns ValidationResult with valid flag, error message, and missing parameters
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function validateAction(action: AIAction): ValidationResult {
  // Check if action has a type
  if (!action.type) {
    return {
      valid: false,
      error: 'Action must have a type field',
      missingParams: ['type'],
    };
  }

  // Get validation rule for this action type
  const rule = VALIDATION_RULES[action.type];

  // If no specific rule exists, allow the action (unknown types pass through)
  if (!rule) {
    return { valid: true };
  }

  // Check for required parameters
  const missingParams: string[] = [];
  for (const param of rule.requiredParams) {
    if (
      !(param in action) ||
      action[param as keyof AIAction] === undefined ||
      action[param as keyof AIAction] === null
    ) {
      missingParams.push(param);
    }
  }

  if (missingParams.length > 0) {
    return {
      valid: false,
      error: `Missing required parameter(s): ${missingParams.join(', ')}`,
      missingParams,
    };
  }

  // Run custom validator for this action type
  return rule.validator(action);
}

/**
 * Get a user-friendly error message from validation result
 *
 * @param result - The validation result
 * @returns A formatted error message for display to users
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.valid) {
    return '';
  }

  return result.error || 'Validation failed';
}

/**
 * Log validation result for debugging
 *
 * @param result - The validation result
 * @param action - The action that was validated
 * @param context - Additional context for logging
 */
export function logValidationResult(
  result: ValidationResult,
  action: AIAction,
  context?: string
): void {
  const prefix = context ? `[${context}]` : '';

  if (!result.valid) {
    console.error(`${prefix} Validation failed for action type ${action.type}:`, {
      error: result.error,
      missingParams: result.missingParams,
      action,
    });
  } else if (result.warnings && result.warnings.length > 0) {
    console.warn(`${prefix} Validation warnings for action type ${action.type}:`, {
      warnings: result.warnings,
      action,
    });
  }
}
