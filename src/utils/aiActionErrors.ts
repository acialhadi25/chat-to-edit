import { ExcelData, AIAction } from '@/types/excel';

/**
 * Error codes for AI Actions
 * Following the design document's error code structure
 */
export enum AIActionErrorCode {
  // User input errors (4xx)
  INVALID_CELL_REFERENCE = 'INVALID_CELL_REFERENCE',
  INVALID_COLUMN_REFERENCE = 'INVALID_COLUMN_REFERENCE',
  INVALID_ROW_REFERENCE = 'INVALID_ROW_REFERENCE',
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_FORMULA = 'INVALID_FORMULA',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  MISSING_REQUIRED_PARAM = 'MISSING_REQUIRED_PARAM',
  INVALID_PATTERN = 'INVALID_PATTERN',
  EMPTY_DATA = 'EMPTY_DATA',
  
  // Action-specific errors (5xx)
  NO_COLUMNS_TO_DELETE = 'NO_COLUMNS_TO_DELETE',
  NO_ROWS_TO_DELETE = 'NO_ROWS_TO_DELETE',
  NO_EMPTY_ROWS_FOUND = 'NO_EMPTY_ROWS_FOUND',
  NO_SOURCE_VALUE = 'NO_SOURCE_VALUE',
  COLUMN_NOT_FOUND = 'COLUMN_NOT_FOUND',
  INVALID_TRANSFORM_TYPE = 'INVALID_TRANSFORM_TYPE',
  INVALID_STAT_TYPE = 'INVALID_STAT_TYPE',
  NO_NUMERIC_COLUMNS = 'NO_NUMERIC_COLUMNS',
  
  // System errors (6xx)
  UNKNOWN_ACTION_TYPE = 'UNKNOWN_ACTION_TYPE',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
}

/**
 * Error response structure
 */
export interface AIActionError {
  code: AIActionErrorCode;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction: string;
  actionType?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: AIActionError;
}

/**
 * Create a user-friendly error message
 */
export function createError(
  code: AIActionErrorCode,
  message: string,
  suggestedAction: string,
  recoverable: boolean = true,
  details?: any,
  actionType?: string
): AIActionError {
  return {
    code,
    message,
    details,
    recoverable,
    suggestedAction,
    actionType,
  };
}

/**
 * Validate cell reference (e.g., "A1", "B5")
 */
export function validateCellReference(ref: string): ValidationResult {
  const pattern = /^[A-Z]+\d+$/;
  if (!pattern.test(ref)) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_CELL_REFERENCE,
        `Invalid cell reference: "${ref}". Cell references must be in format like A1, B2, Z99.`,
        'Use a valid cell reference format (column letter + row number, e.g., A1, B2)',
        true,
        { providedRef: ref }
      ),
    };
  }
  return { valid: true };
}

/**
 * Validate column reference (e.g., "A", "B", "AA")
 */
export function validateColumnReference(ref: string): ValidationResult {
  const pattern = /^[A-Z]+$/;
  if (!pattern.test(ref)) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_COLUMN_REFERENCE,
        `Invalid column reference: "${ref}". Column references must be letters only (A, B, C, etc.).`,
        'Use a valid column letter (A, B, C, etc.)',
        true,
        { providedRef: ref }
      ),
    };
  }
  return { valid: true };
}

/**
 * Validate row reference (must be positive integer)
 */
export function validateRowReference(ref: string | number): ValidationResult {
  const rowNum = typeof ref === 'string' ? parseInt(ref) : ref;
  if (isNaN(rowNum) || rowNum < 1) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_ROW_REFERENCE,
        `Invalid row reference: "${ref}". Row numbers must be positive integers (1, 2, 3, etc.).`,
        'Use a valid row number (1, 2, 3, etc.)',
        true,
        { providedRef: ref }
      ),
    };
  }
  return { valid: true };
}

/**
 * Validate range reference (e.g., "A1:B10")
 */
export function validateRangeReference(ref: string): ValidationResult {
  const pattern = /^[A-Z]+\d+:[A-Z]+\d+$/;
  if (!pattern.test(ref)) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_RANGE,
        `Invalid range reference: "${ref}". Ranges must be in format like A1:B10.`,
        'Use a valid range format (start cell:end cell, e.g., A1:B10)',
        true,
        { providedRef: ref }
      ),
    };
  }
  return { valid: true };
}

/**
 * Validate formula syntax
 */
export function validateFormula(formula: string): ValidationResult {
  if (!formula.startsWith('=')) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_FORMULA,
        `Invalid formula: "${formula}". Formulas must start with "=".`,
        'Add "=" at the beginning of the formula',
        true,
        { providedFormula: formula }
      ),
    };
  }
  
  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of formula) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return {
        valid: false,
        error: createError(
          AIActionErrorCode.INVALID_FORMULA,
          `Invalid formula: "${formula}". Unbalanced parentheses detected.`,
          'Check that all opening parentheses "(" have matching closing parentheses ")"',
          true,
          { providedFormula: formula }
        ),
      };
    }
  }
  
  if (parenCount !== 0) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_FORMULA,
        `Invalid formula: "${formula}". Unbalanced parentheses detected.`,
        'Check that all opening parentheses "(" have matching closing parentheses ")"',
        true,
        { providedFormula: formula }
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate column index is within bounds
 */
export function validateColumnIndex(colIndex: number, data: ExcelData): ValidationResult {
  if (colIndex < 0 || colIndex >= data.headers.length) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.OUT_OF_BOUNDS,
        `Column index ${colIndex} is out of bounds. Valid range is 0 to ${data.headers.length - 1}.`,
        `Use a column index between 0 and ${data.headers.length - 1}, or use a column letter (A-${String.fromCharCode(65 + data.headers.length - 1)})`,
        true,
        { colIndex, maxColumns: data.headers.length }
      ),
    };
  }
  return { valid: true };
}

/**
 * Validate row index is within bounds
 */
export function validateRowIndex(rowIndex: number, data: ExcelData): ValidationResult {
  if (rowIndex < 0 || rowIndex >= data.rows.length) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.OUT_OF_BOUNDS,
        `Row index ${rowIndex} is out of bounds. Valid range is 0 to ${data.rows.length - 1}.`,
        `Use a row index between 0 and ${data.rows.length - 1}`,
        true,
        { rowIndex, maxRows: data.rows.length }
      ),
    };
  }
  return { valid: true };
}

/**
 * Validate EDIT_CELL action
 */
export function validateEditCellAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target;
  if (!target) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'EDIT_CELL action requires a "target" parameter specifying which cell to edit.',
        'Provide a target cell reference (e.g., { target: { ref: "A1" } })',
        true,
        undefined,
        'EDIT_CELL'
      ),
    };
  }
  
  const value = action.params?.value;
  if (value === undefined) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'EDIT_CELL action requires a "value" parameter specifying the new cell value.',
        'Provide a value to set in the cell (e.g., { value: "Hello" })',
        true,
        undefined,
        'EDIT_CELL'
      ),
    };
  }
  
  // Validate cell reference if provided
  if (target.ref) {
    const refValidation = validateCellReference(target.ref);
    if (!refValidation.valid) {
      return refValidation;
    }
  }
  
  return { valid: true };
}

/**
 * Validate INSERT_FORMULA action
 */
export function validateInsertFormulaAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'INSERT_FORMULA action requires a "target" parameter with a "ref" property specifying where to insert the formula.',
        'Provide a target range (e.g., { target: { ref: "F2:F12" } })',
        true,
        undefined,
        'INSERT_FORMULA'
      ),
    };
  }
  
  const formula = (action as any).formula || action.params?.formula;
  if (!formula) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'INSERT_FORMULA action requires a "formula" parameter specifying the formula to insert.',
        'Provide a formula string (e.g., { formula: "=SUM(A1:A10)" })',
        true,
        undefined,
        'INSERT_FORMULA'
      ),
    };
  }
  
  // Validate formula syntax
  const formulaValidation = validateFormula(formula);
  if (!formulaValidation.valid) {
    return formulaValidation;
  }
  
  return { valid: true };
}

/**
 * Validate EDIT_ROW action
 */
export function validateEditRowAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'EDIT_ROW action requires a "target" parameter with a "ref" property specifying which row to edit.',
        'Provide a target row number (e.g., { target: { ref: "8" } })',
        true,
        undefined,
        'EDIT_ROW'
      ),
    };
  }
  
  const rowData = action.params?.rowData || (action as any).rowData;
  if (!rowData || typeof rowData !== 'object') {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'EDIT_ROW action requires a "rowData" parameter with column-value pairs.',
        'Provide row data as an object (e.g., { rowData: { "Name": "John", "Age": 30 } })',
        true,
        undefined,
        'EDIT_ROW'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate DELETE_ROW action
 */
export function validateDeleteRowAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'DELETE_ROW action requires a "target" parameter with a "ref" property specifying which row(s) to delete.',
        'Provide a target row number or comma-separated list (e.g., { target: { ref: "5" } } or { target: { ref: "5,7,10" } })',
        true,
        undefined,
        'DELETE_ROW'
      ),
    };
  }
  
  // Check if there are rows to delete
  if (data.rows.length === 0) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.EMPTY_DATA,
        'Cannot delete rows: the spreadsheet has no data rows.',
        'Add data to the spreadsheet before attempting to delete rows',
        false,
        undefined,
        'DELETE_ROW'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate EDIT_COLUMN action
 */
export function validateEditColumnAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'EDIT_COLUMN action requires a "target" parameter with a "ref" property specifying which column to edit.',
        'Provide a target column letter or range (e.g., { target: { ref: "G" } } or { target: { ref: "G2:G13" } })',
        true,
        undefined,
        'EDIT_COLUMN'
      ),
    };
  }
  
  const values = action.params?.values;
  if (!values || !Array.isArray(values)) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'EDIT_COLUMN action requires a "values" parameter with an array of values to fill the column.',
        'Provide an array of values (e.g., { values: ["Value1", "Value2", "Value3"] })',
        true,
        undefined,
        'EDIT_COLUMN'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate DELETE_COLUMN action
 */
export function validateDeleteColumnAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = (action as any).target || {};
  const columnName = action.params?.columnName || target.columnName || target.ref;
  const columnIndex = action.params?.columnIndex !== undefined ? action.params.columnIndex : (target.columnIndex !== undefined ? target.columnIndex : target.col);
  
  if (!columnName && columnIndex === undefined) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'DELETE_COLUMN action requires either a "columnName" or "columnIndex" parameter.',
        'Provide a column name or index (e.g., { columnName: "Status" } or { columnIndex: 3 })',
        true,
        undefined,
        'DELETE_COLUMN'
      ),
    };
  }
  
  // Check if there are columns to delete
  if (data.headers.length === 0) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.NO_COLUMNS_TO_DELETE,
        'Cannot delete column: the spreadsheet has no columns.',
        'Add columns to the spreadsheet before attempting to delete them',
        false,
        undefined,
        'DELETE_COLUMN'
      ),
    };
  }
  
  // Validate column exists
  if (columnName) {
    const colIndex = data.headers.findIndex(h => h === columnName);
    if (colIndex < 0) {
      return {
        valid: false,
        error: createError(
          AIActionErrorCode.COLUMN_NOT_FOUND,
          `Column "${columnName}" not found. Available columns: ${data.headers.join(', ')}`,
          `Use one of the existing column names: ${data.headers.join(', ')}`,
          true,
          { columnName, availableColumns: data.headers },
          'DELETE_COLUMN'
        ),
      };
    }
  }
  
  if (columnIndex !== undefined && columnIndex !== null) {
    const validation = validateColumnIndex(columnIndex, data);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Validate DATA_TRANSFORM action
 */
export function validateDataTransformAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'DATA_TRANSFORM action requires a "target" parameter specifying which column to transform.',
        'Provide a target column letter (e.g., { target: { ref: "B" } })',
        true,
        undefined,
        'DATA_TRANSFORM'
      ),
    };
  }
  
  const transformType = action.params?.transformType || action.params?.transform;
  if (!transformType) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'DATA_TRANSFORM action requires a "transformType" parameter.',
        'Provide a transform type: "uppercase", "lowercase", or "titlecase"',
        true,
        undefined,
        'DATA_TRANSFORM'
      ),
    };
  }
  
  const validTransforms = ['uppercase', 'lowercase', 'titlecase'];
  if (!validTransforms.includes(transformType)) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_TRANSFORM_TYPE,
        `Invalid transform type: "${transformType}". Valid types are: ${validTransforms.join(', ')}`,
        `Use one of: ${validTransforms.join(', ')}`,
        true,
        { transformType, validTransforms },
        'DATA_TRANSFORM'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate FILL_DOWN action
 */
export function validateFillDownAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'FILL_DOWN action requires a "target" parameter specifying which column to fill down.',
        'Provide a target column letter (e.g., { target: { ref: "F" } })',
        true,
        undefined,
        'FILL_DOWN'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate ADD_COLUMN action
 */
export function validateAddColumnAction(action: AIAction, data: ExcelData): ValidationResult {
  const columnName = action.params?.newColumnName || (action as any).newColumnName;
  
  if (!columnName && !action.description) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'ADD_COLUMN action requires a "newColumnName" parameter or a description with the column name.',
        'Provide a column name (e.g., { newColumnName: "Status" })',
        true,
        undefined,
        'ADD_COLUMN'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate GENERATE_DATA action
 */
export function validateGenerateDataAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = (action as any).target || action.params?.target;
  const patterns = (action as any).patterns || action.params?.patterns;
  
  // Allow fallback to description parsing
  if (!target && !patterns && !action.description) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'GENERATE_DATA action requires either "target" and "patterns" parameters, or a description with generation instructions.',
        'Provide target range and patterns, or describe what data to generate (e.g., "fill data to row 20")',
        true,
        undefined,
        'GENERATE_DATA'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate REMOVE_EMPTY_ROWS action
 */
export function validateRemoveEmptyRowsAction(action: AIAction, data: ExcelData): ValidationResult {
  // Check if there are any rows
  if (data.rows.length === 0) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.EMPTY_DATA,
        'Cannot remove empty rows: the spreadsheet has no data rows.',
        'Add data to the spreadsheet first',
        false,
        undefined,
        'REMOVE_EMPTY_ROWS'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate STATISTICS action
 */
export function validateStatisticsAction(action: AIAction, data: ExcelData): ValidationResult {
  const statType = action.params?.statType || 'sum';
  const validStatTypes = ['sum', 'avg', 'average', 'count', 'min', 'max'];
  
  if (!validStatTypes.includes(statType.toLowerCase())) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.INVALID_STAT_TYPE,
        `Invalid statistic type: "${statType}". Valid types are: ${validStatTypes.join(', ')}`,
        `Use one of: ${validStatTypes.join(', ')}`,
        true,
        { statType, validStatTypes },
        'STATISTICS'
      ),
    };
  }
  
  // Check if there are numeric columns
  const hasNumericColumns = data.headers.some((_, colIdx) => {
    return data.rows.some(row => {
      const val = row[colIdx];
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
    });
  });
  
  if (!hasNumericColumns) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.NO_NUMERIC_COLUMNS,
        'Cannot calculate statistics: no numeric columns found in the spreadsheet.',
        'Ensure the spreadsheet has at least one column with numeric data',
        false,
        undefined,
        'STATISTICS'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Validate CONDITIONAL_FORMAT action
 */
export function validateConditionalFormatAction(action: AIAction, data: ExcelData): ValidationResult {
  const target = action.params?.target || (action as any).target;
  if (!target || !target.ref) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'CONDITIONAL_FORMAT action requires a "target" parameter specifying which range to format.',
        'Provide a target range (e.g., { target: { ref: "B2:B10" } })',
        true,
        undefined,
        'CONDITIONAL_FORMAT'
      ),
    };
  }
  
  const rules = action.params?.rules;
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.MISSING_REQUIRED_PARAM,
        'CONDITIONAL_FORMAT action requires a "rules" parameter with at least one formatting rule.',
        'Provide formatting rules (e.g., { rules: [{ condition: "contains", value: "Active", style: { bg: "#00FF00" } }] })',
        true,
        undefined,
        'CONDITIONAL_FORMAT'
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Main validation function - validates any AI Action
 */
export function validateAIAction(action: AIAction, data: ExcelData): ValidationResult {
  // Check if action type is provided
  if (!action.type) {
    return {
      valid: false,
      error: createError(
        AIActionErrorCode.UNKNOWN_ACTION_TYPE,
        'Action type is missing. Cannot validate action without knowing its type.',
        'Provide an action type (e.g., EDIT_CELL, INSERT_FORMULA, etc.)',
        false
      ),
    };
  }
  
  // Validate based on action type
  switch (action.type) {
    case 'EDIT_CELL':
      return validateEditCellAction(action, data);
    case 'INSERT_FORMULA':
      return validateInsertFormulaAction(action, data);
    case 'EDIT_ROW':
      return validateEditRowAction(action, data);
    case 'DELETE_ROW':
      return validateDeleteRowAction(action, data);
    case 'EDIT_COLUMN':
      return validateEditColumnAction(action, data);
    case 'DELETE_COLUMN':
      return validateDeleteColumnAction(action, data);
    case 'DATA_TRANSFORM':
      return validateDataTransformAction(action, data);
    case 'FILL_DOWN':
      return validateFillDownAction(action, data);
    case 'ADD_COLUMN':
    case 'ADD_COLUMN_WITH_DATA':
      return validateAddColumnAction(action, data);
    case 'GENERATE_DATA':
      return validateGenerateDataAction(action, data);
    case 'REMOVE_EMPTY_ROWS':
      return validateRemoveEmptyRowsAction(action, data);
    case 'STATISTICS':
      return validateStatisticsAction(action, data);
    case 'CONDITIONAL_FORMAT':
      return validateConditionalFormatAction(action, data);
    
    // Informational actions don't need validation
    case 'DATA_AUDIT':
    case 'INSIGHTS':
    case 'CLARIFY':
    case 'INFO':
      return { valid: true };
    
    default:
      return {
        valid: false,
        error: createError(
          AIActionErrorCode.UNKNOWN_ACTION_TYPE,
          `Unknown action type: "${action.type}". This action type is not supported.`,
          'Use a supported action type (EDIT_CELL, INSERT_FORMULA, EDIT_ROW, DELETE_ROW, etc.)',
          false,
          { actionType: action.type }
        ),
      };
  }
}

/**
 * Format error for display to user
 */
export function formatErrorMessage(error: AIActionError): string {
  let message = `❌ ${error.message}\n\n`;
  message += `💡 Suggested action: ${error.suggestedAction}`;
  
  if (error.actionType) {
    message += `\n\n📋 Action type: ${error.actionType}`;
  }
  
  if (error.details) {
    message += `\n\n🔍 Details: ${JSON.stringify(error.details, null, 2)}`;
  }
  
  return message;
}
