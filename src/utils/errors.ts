/**
 * Centralized Error Handling System
 * 
 * Provides comprehensive error types, error codes, and error handling utilities
 * for the Univer integration.
 * 
 * Requirements: Technical Requirements 4 - Security Requirements
 * - Error handling and logging
 * - Graceful degradation
 */

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  // User input errors (4xx)
  INVALID_CELL_REFERENCE = 'INVALID_CELL_REFERENCE',
  INVALID_FORMULA = 'INVALID_FORMULA',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_WORKSHEET = 'INVALID_WORKSHEET',
  
  // AI errors (5xx)
  UNRECOGNIZED_COMMAND = 'UNRECOGNIZED_COMMAND',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  AMBIGUOUS_COMMAND = 'AMBIGUOUS_COMMAND',
  AI_API_ERROR = 'AI_API_ERROR',
  MCP_CONNECTION_ERROR = 'MCP_CONNECTION_ERROR',
  
  // System errors (6xx)
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  MEMORY_ERROR = 'MEMORY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  UNIVER_NOT_READY = 'UNIVER_NOT_READY',
  
  // Permission errors (7xx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  READ_ONLY_VIOLATION = 'READ_ONLY_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Import/Export errors (8xx)
  IMPORT_ERROR = 'IMPORT_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  // Chart errors (9xx)
  CHART_CREATION_ERROR = 'CHART_CREATION_ERROR',
  CHART_UPDATE_ERROR = 'CHART_UPDATE_ERROR',
  INVALID_CHART_TYPE = 'INVALID_CHART_TYPE',
  INVALID_CHART_DATA = 'INVALID_CHART_DATA',
}

// ============================================================================
// Error Classes
// ============================================================================

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
  originalError?: Error;
}

/**
 * Base error class for Univer integration
 */
export class UniverError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly recoverable: boolean;
  public readonly suggestedAction?: string;
  public readonly originalError?: Error;
  public readonly timestamp: Date;

  constructor(errorDetails: ErrorDetails) {
    super(errorDetails.message);
    this.name = 'UniverError';
    this.code = errorDetails.code;
    this.details = errorDetails.details;
    this.recoverable = errorDetails.recoverable;
    this.suggestedAction = errorDetails.suggestedAction;
    this.originalError = errorDetails.originalError;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UniverError);
    }
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      recoverable: this.recoverable,
      suggestedAction: this.suggestedAction,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * User input validation error
 */
export class ValidationError extends UniverError {
  constructor(message: string, code: ErrorCode, suggestedAction?: string, details?: any) {
    super({
      code,
      message,
      details,
      recoverable: true,
      suggestedAction,
    });
    this.name = 'ValidationError';
  }
}

/**
 * AI command processing error
 */
export class AICommandError extends UniverError {
  constructor(message: string, code: ErrorCode, suggestedAction?: string, details?: any) {
    super({
      code,
      message,
      details,
      recoverable: true,
      suggestedAction,
    });
    this.name = 'AICommandError';
  }
}

/**
 * System/infrastructure error
 */
export class SystemError extends UniverError {
  constructor(message: string, code: ErrorCode, originalError?: Error, recoverable = false) {
    super({
      code,
      message,
      originalError,
      recoverable,
      suggestedAction: recoverable ? 'Please try again' : 'Please contact support',
    });
    this.name = 'SystemError';
  }
}

/**
 * Permission/authorization error
 */
export class PermissionError extends UniverError {
  constructor(message: string, code: ErrorCode, suggestedAction?: string) {
    super({
      code,
      message,
      recoverable: false,
      suggestedAction,
    });
    this.name = 'PermissionError';
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

export const createValidationError = {
  invalidCellReference: (ref: string) =>
    new ValidationError(
      `Invalid cell reference: ${ref}`,
      ErrorCode.INVALID_CELL_REFERENCE,
      'Use format like A1, B2, etc.',
      { reference: ref }
    ),

  invalidFormula: (formula: string, reason?: string) =>
    new ValidationError(
      `Invalid formula: ${formula}${reason ? ` - ${reason}` : ''}`,
      ErrorCode.INVALID_FORMULA,
      'Formula must start with = and use valid syntax',
      { formula, reason }
    ),

  invalidDataType: (expected: string, received: string) =>
    new ValidationError(
      `Invalid data type: expected ${expected}, received ${received}`,
      ErrorCode.INVALID_DATA_TYPE,
      `Please provide a ${expected} value`,
      { expected, received }
    ),

  outOfBounds: (row: number, col: number, maxRow: number, maxCol: number) =>
    new ValidationError(
      `Cell position out of bounds: (${row}, ${col})`,
      ErrorCode.OUT_OF_BOUNDS,
      `Valid range is 0-${maxRow} rows and 0-${maxCol} columns`,
      { row, col, maxRow, maxCol }
    ),

  invalidRange: (range: string, reason?: string) =>
    new ValidationError(
      `Invalid range: ${range}${reason ? ` - ${reason}` : ''}`,
      ErrorCode.INVALID_RANGE,
      'Use format like A1:B10',
      { range, reason }
    ),

  invalidWorksheet: (worksheetId: string) =>
    new ValidationError(
      `Invalid worksheet: ${worksheetId}`,
      ErrorCode.INVALID_WORKSHEET,
      'Please select a valid worksheet',
      { worksheetId }
    ),
};

export const createAIError = {
  unrecognizedCommand: (command: string) =>
    new AICommandError(
      `Could not understand command: ${command}`,
      ErrorCode.UNRECOGNIZED_COMMAND,
      'Try rephrasing or use a command suggestion',
      { command }
    ),

  missingParameter: (parameter: string, command: string) =>
    new AICommandError(
      `Missing required parameter: ${parameter}`,
      ErrorCode.MISSING_PARAMETER,
      `Please specify ${parameter} in your command`,
      { parameter, command }
    ),

  invalidParameter: (parameter: string, value: any, reason?: string) =>
    new AICommandError(
      `Invalid parameter ${parameter}: ${value}${reason ? ` - ${reason}` : ''}`,
      ErrorCode.INVALID_PARAMETER,
      `Please provide a valid ${parameter}`,
      { parameter, value, reason }
    ),

  ambiguousCommand: (command: string, possibilities: string[]) =>
    new AICommandError(
      `Ambiguous command: ${command}`,
      ErrorCode.AMBIGUOUS_COMMAND,
      `Did you mean: ${possibilities.join(', ')}?`,
      { command, possibilities }
    ),

  apiError: (message: string, originalError?: Error) =>
    new AICommandError(
      `AI API error: ${message}`,
      ErrorCode.AI_API_ERROR,
      'Please try again or contact support',
      { originalError }
    ),

  mcpConnectionError: (message: string, originalError?: Error) =>
    new AICommandError(
      `MCP connection error: ${message}`,
      ErrorCode.MCP_CONNECTION_ERROR,
      'Check your MCP configuration and try again',
      { originalError }
    ),
};

export const createSystemError = {
  databaseError: (operation: string, originalError?: Error) =>
    new SystemError(
      `Database error during ${operation}`,
      ErrorCode.DATABASE_ERROR,
      originalError,
      true
    ),

  networkError: (operation: string, originalError?: Error) =>
    new SystemError(
      `Network error during ${operation}`,
      ErrorCode.NETWORK_ERROR,
      originalError,
      true
    ),

  apiRateLimit: (retryAfter?: number) =>
    new SystemError(
      'API rate limit exceeded',
      ErrorCode.API_RATE_LIMIT,
      undefined,
      true
    ),

  memoryError: (operation: string) =>
    new SystemError(
      `Memory error during ${operation}`,
      ErrorCode.MEMORY_ERROR,
      undefined,
      false
    ),

  initializationError: (component: string, originalError?: Error) =>
    new SystemError(
      `Failed to initialize ${component}`,
      ErrorCode.INITIALIZATION_ERROR,
      originalError,
      false
    ),

  univerNotReady: () =>
    new SystemError(
      'Univer is not ready',
      ErrorCode.UNIVER_NOT_READY,
      undefined,
      true
    ),
};

export const createPermissionError = {
  unauthorized: () =>
    new PermissionError(
      'User not authenticated',
      ErrorCode.UNAUTHORIZED,
      'Please log in to continue'
    ),

  readOnlyViolation: (operation: string) =>
    new PermissionError(
      `Cannot perform ${operation} in read-only mode`,
      ErrorCode.READ_ONLY_VIOLATION,
      'This workbook is read-only'
    ),

  insufficientPermissions: (operation: string) =>
    new PermissionError(
      `Insufficient permissions for ${operation}`,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      'Contact the workbook owner for access'
    ),
};

// ============================================================================
// Error Response Types
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    recoverable: boolean;
    suggestedAction?: string;
    timestamp: string;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ServiceResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Convert any error to a UniverError
 */
export function toUniverError(error: unknown): UniverError {
  if (error instanceof UniverError) {
    return error;
  }

  if (error instanceof Error) {
    return new SystemError(
      error.message,
      ErrorCode.INITIALIZATION_ERROR,
      error,
      false
    );
  }

  return new SystemError(
    String(error),
    ErrorCode.INITIALIZATION_ERROR,
    undefined,
    false
  );
}

/**
 * Convert error to error response
 */
export function toErrorResponse(error: unknown): ErrorResponse {
  const univerError = toUniverError(error);
  return {
    success: false,
    error: {
      code: univerError.code,
      message: univerError.message,
      details: univerError.details,
      recoverable: univerError.recoverable,
      suggestedAction: univerError.suggestedAction,
      timestamp: univerError.timestamp.toISOString(),
    },
  };
}

/**
 * Create success response
 */
export function toSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Check if response is an error
 */
export function isErrorResponse(response: ServiceResponse): response is ErrorResponse {
  return response.success === false;
}

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(response: ServiceResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}
