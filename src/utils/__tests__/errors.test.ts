// @ts-nocheck
/**
 * Error Handling Tests
 * 
 * Tests for centralized error handling system including error types,
 * error codes, and error utilities.
 * 
 * Requirements: Technical Requirements 4 - Error handling and logging
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  UniverError,
  ValidationError,
  AICommandError,
  SystemError,
  PermissionError,
  createValidationError,
  createAIError,
  createSystemError,
  createPermissionError,
  toUniverError,
  toErrorResponse,
  toSuccessResponse,
  isErrorResponse,
  isSuccessResponse,
} from '../errors';

describe('Error Classes', () => {
  describe('UniverError', () => {
    it('should create error with all properties', () => {
      const error = new UniverError({
        code: ErrorCode.INVALID_CELL_REFERENCE,
        message: 'Invalid cell reference',
        details: { ref: 'ZZZ999' },
        recoverable: true,
        suggestedAction: 'Use format like A1',
      });

      expect(error.code).toBe(ErrorCode.INVALID_CELL_REFERENCE);
      expect(error.message).toBe('Invalid cell reference');
      expect(error.details).toEqual({ ref: 'ZZZ999' });
      expect(error.recoverable).toBe(true);
      expect(error.suggestedAction).toBe('Use format like A1');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should convert to JSON', () => {
      const error = new UniverError({
        code: ErrorCode.INVALID_FORMULA,
        message: 'Invalid formula',
        recoverable: true,
      });

      const json = error.toJSON();
      expect(json.name).toBe('UniverError');
      expect(json.code).toBe(ErrorCode.INVALID_FORMULA);
      expect(json.message).toBe('Invalid formula');
      expect(json.recoverable).toBe(true);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError(
        'Invalid cell reference: ZZZ999',
        ErrorCode.INVALID_CELL_REFERENCE,
        'Use format like A1'
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(UniverError);
      expect(error.name).toBe('ValidationError');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('AICommandError', () => {
    it('should create AI command error', () => {
      const error = new AICommandError(
        'Unrecognized command',
        ErrorCode.UNRECOGNIZED_COMMAND,
        'Try rephrasing'
      );

      expect(error).toBeInstanceOf(AICommandError);
      expect(error.name).toBe('AICommandError');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('SystemError', () => {
    it('should create system error', () => {
      const originalError = new Error('Database connection failed');
      const error = new SystemError(
        'Database error',
        ErrorCode.DATABASE_ERROR,
        originalError,
        true
      );

      expect(error).toBeInstanceOf(SystemError);
      expect(error.name).toBe('SystemError');
      expect(error.originalError).toBe(originalError);
      expect(error.recoverable).toBe(true);
    });
  });

  describe('PermissionError', () => {
    it('should create permission error', () => {
      const error = new PermissionError(
        'User not authenticated',
        ErrorCode.UNAUTHORIZED,
        'Please log in'
      );

      expect(error).toBeInstanceOf(PermissionError);
      expect(error.name).toBe('PermissionError');
      expect(error.recoverable).toBe(false);
    });
  });
});

describe('Error Factory Functions', () => {
  describe('createValidationError', () => {
    it('should create invalid cell reference error', () => {
      const error = createValidationError.invalidCellReference('ZZZ999');
      
      expect(error.code).toBe(ErrorCode.INVALID_CELL_REFERENCE);
      expect(error.message).toContain('ZZZ999');
      expect(error.suggestedAction).toContain('A1');
    });

    it('should create invalid formula error', () => {
      const error = createValidationError.invalidFormula('INVALID', 'missing =');
      
      expect(error.code).toBe(ErrorCode.INVALID_FORMULA);
      expect(error.message).toContain('INVALID');
      expect(error.message).toContain('missing =');
    });

    it('should create out of bounds error', () => {
      const error = createValidationError.outOfBounds(1000, 1000, 100, 100);
      
      expect(error.code).toBe(ErrorCode.OUT_OF_BOUNDS);
      expect(error.details).toEqual({ row: 1000, col: 1000, maxRow: 100, maxCol: 100 });
    });
  });

  describe('createAIError', () => {
    it('should create unrecognized command error', () => {
      const error = createAIError.unrecognizedCommand('do something');
      
      expect(error.code).toBe(ErrorCode.UNRECOGNIZED_COMMAND);
      expect(error.message).toContain('do something');
    });

    it('should create missing parameter error', () => {
      const error = createAIError.missingParameter('range', 'sort data');
      
      expect(error.code).toBe(ErrorCode.MISSING_PARAMETER);
      expect(error.message).toContain('range');
    });

    it('should create ambiguous command error', () => {
      const error = createAIError.ambiguousCommand('sort', ['sort ascending', 'sort descending']);
      
      expect(error.code).toBe(ErrorCode.AMBIGUOUS_COMMAND);
      expect(error.details.possibilities).toEqual(['sort ascending', 'sort descending']);
    });
  });

  describe('createSystemError', () => {
    it('should create database error', () => {
      const originalError = new Error('Connection failed');
      const error = createSystemError.databaseError('save workbook', originalError);
      
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.message).toContain('save workbook');
      expect(error.originalError).toBe(originalError);
      expect(error.recoverable).toBe(true);
    });

    it('should create network error', () => {
      const error = createSystemError.networkError('fetch data');
      
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.recoverable).toBe(true);
    });

    it('should create univer not ready error', () => {
      const error = createSystemError.univerNotReady();
      
      expect(error.code).toBe(ErrorCode.UNIVER_NOT_READY);
      expect(error.recoverable).toBe(true);
    });
  });

  describe('createPermissionError', () => {
    it('should create unauthorized error', () => {
      const error = createPermissionError.unauthorized();
      
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.suggestedAction).toContain('log in');
    });

    it('should create read-only violation error', () => {
      const error = createPermissionError.readOnlyViolation('delete row');
      
      expect(error.code).toBe(ErrorCode.READ_ONLY_VIOLATION);
      expect(error.message).toContain('delete row');
    });
  });
});

describe('Error Utilities', () => {
  describe('toUniverError', () => {
    it('should return UniverError as-is', () => {
      const error = new ValidationError('test', ErrorCode.INVALID_CELL_REFERENCE);
      const result = toUniverError(error);
      
      expect(result).toBe(error);
    });

    it('should convert Error to SystemError', () => {
      const error = new Error('Something went wrong');
      const result = toUniverError(error);
      
      expect(result).toBeInstanceOf(SystemError);
      expect(result.message).toBe('Something went wrong');
    });

    it('should convert unknown to SystemError', () => {
      const result = toUniverError('string error');
      
      expect(result).toBeInstanceOf(SystemError);
      expect(result.message).toBe('string error');
    });
  });

  describe('toErrorResponse', () => {
    it('should convert error to error response', () => {
      const error = createValidationError.invalidCellReference('ZZZ999');
      const response = toErrorResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.INVALID_CELL_REFERENCE);
      expect(response.error.message).toContain('ZZZ999');
      expect(response.error.recoverable).toBe(true);
      expect(response.error.timestamp).toBeDefined();
    });
  });

  describe('toSuccessResponse', () => {
    it('should create success response with data', () => {
      const response = toSuccessResponse({ value: 42 }, 'Operation successful');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ value: 42 });
      expect(response.message).toBe('Operation successful');
    });

    it('should create success response without message', () => {
      const response = toSuccessResponse('result');
      
      expect(response.success).toBe(true);
      expect(response.data).toBe('result');
      expect(response.message).toBeUndefined();
    });
  });

  describe('isErrorResponse', () => {
    it('should identify error response', () => {
      const response = toErrorResponse(new ValidationError('test', ErrorCode.INVALID_CELL_REFERENCE));
      
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should identify success response', () => {
      const response = toSuccessResponse('data');
      
      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe('isSuccessResponse', () => {
    it('should identify success response', () => {
      const response = toSuccessResponse('data');
      
      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should identify error response', () => {
      const response = toErrorResponse(new ValidationError('test', ErrorCode.INVALID_CELL_REFERENCE));
      
      expect(isSuccessResponse(response)).toBe(false);
    });
  });
});

describe('Error Scenarios', () => {
  it('should handle invalid cell reference scenario', () => {
    const error = createValidationError.invalidCellReference('ABC123456');
    
    expect(error.code).toBe(ErrorCode.INVALID_CELL_REFERENCE);
    expect(error.recoverable).toBe(true);
    expect(error.suggestedAction).toBeDefined();
  });

  it('should handle database connection failure scenario', () => {
    const originalError = new Error('ECONNREFUSED');
    const error = createSystemError.databaseError('save', originalError);
    
    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.recoverable).toBe(true);
    expect(error.originalError).toBe(originalError);
  });

  it('should handle unauthorized access scenario', () => {
    const error = createPermissionError.unauthorized();
    
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.recoverable).toBe(false);
    expect(error.suggestedAction).toContain('log in');
  });

  it('should handle AI command parsing failure scenario', () => {
    const error = createAIError.unrecognizedCommand('do magic');
    
    expect(error.code).toBe(ErrorCode.UNRECOGNIZED_COMMAND);
    expect(error.recoverable).toBe(true);
    expect(error.suggestedAction).toBeDefined();
  });

  it('should handle formula validation failure scenario', () => {
    const error = createValidationError.invalidFormula('SUM(A1:A10', 'missing closing parenthesis');
    
    expect(error.code).toBe(ErrorCode.INVALID_FORMULA);
    expect(error.recoverable).toBe(true);
    expect(error.details.reason).toBe('missing closing parenthesis');
  });
});
