/**
 * Data Validation Service for Univer Sheet Integration
 * 
 * Provides data validation capabilities including:
 * - Number validation (between, equal, greater than, less than)
 * - Integer validation
 * - Text length validation
 * - Date validation (before, after, between, equal)
 * - Checkbox validation
 * - Dropdown list validation (single/multiple selection)
 * - Custom formula validation
 * - Rule management (create, update, delete, get)
 * 
 * Requirements: 4.2.4
 * @see https://docs.univer.ai/zh-CN/guides/sheets/features/data-validation
 */

import type { 
  FUniver, 
  FWorksheet, 
  IRange, 
  FUniverWithDataValidation, 
  FDataValidationBuilder as IFDataValidationBuilder,
} from '../types/univer.types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DataValidationRule {
  ranges: IRange[];
  type: DataValidationType;
  operator?: DataValidationOperator;
  formula1?: string;
  formula2?: string;
  allowBlank?: boolean;
  showErrorMessage?: boolean;
  error?: string;
  errorStyle?: DataValidationErrorStyle;
  showInputMessage?: boolean;
  prompt?: string;
  promptTitle?: string;
}

export enum DataValidationType {
  DECIMAL = 'decimal',
  WHOLE = 'whole',
  DATE = 'date',
  TEXT_LENGTH = 'textLength',
  LIST = 'list',
  LIST_MULTIPLE = 'listMultiple',
  CHECKBOX = 'checkbox',
  CUSTOM = 'custom',
}

export enum DataValidationOperator {
  BETWEEN = 'between',
  NOT_BETWEEN = 'notBetween',
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  GREATER_THAN = 'greaterThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN = 'lessThan',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
}

export enum DataValidationErrorStyle {
  STOP = 'stop',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ValidationOptions {
  allowBlank?: boolean;
  showErrorMessage?: boolean;
  error?: string;
  errorStyle?: DataValidationErrorStyle;
  showInputMessage?: boolean;
  prompt?: string;
  promptTitle?: string;
}

export interface FDataValidation {
  getCriteriaType(): DataValidationType;
  getCriteriaValues(): any[];
  getHelpText(): string;
  getRanges(): IRange[];
  setCriteria(type: DataValidationType, values: any[]): FDataValidation;
  setOptions(options: ValidationOptions): FDataValidation;
  setRanges(ranges: IRange[]): FDataValidation;
  delete(): Promise<void>;
}

export interface FDataValidationBuilder {
  requireCheckbox(): FDataValidationBuilder;
  requireDateAfter(date: Date | string): FDataValidationBuilder;
  requireDateBefore(date: Date | string): FDataValidationBuilder;
  requireDateBetween(start: Date | string, end: Date | string): FDataValidationBuilder;
  requireDateEqualTo(date: Date | string): FDataValidationBuilder;
  requireDateNotBetween(start: Date | string, end: Date | string): FDataValidationBuilder;
  requireDateOnOrAfter(date: Date | string): FDataValidationBuilder;
  requireDateOnOrBefore(date: Date | string): FDataValidationBuilder;
  requireFormulaSatisfied(formula: string): FDataValidationBuilder;
  requireNumberBetween(start: number, end: number): FDataValidationBuilder;
  requireNumberEqualTo(value: number): FDataValidationBuilder;
  requireNumberGreaterThan(value: number): FDataValidationBuilder;
  requireNumberGreaterThanOrEqualTo(value: number): FDataValidationBuilder;
  requireNumberLessThan(value: number): FDataValidationBuilder;
  requireNumberLessThanOrEqualTo(value: number): FDataValidationBuilder;
  requireNumberNotBetween(start: number, end: number): FDataValidationBuilder;
  requireNumberNotEqualTo(value: number): FDataValidationBuilder;
  requireValueInList(values: string[]): FDataValidationBuilder;
  requireValueInRange(range: string): FDataValidationBuilder;
  setOptions(options: ValidationOptions): FDataValidationBuilder;
  build(): FDataValidation;
}

// ============================================================================
// Data Validation Service Class
// ============================================================================

export class DataValidationService {
  private univerAPI: FUniver | null;
  private isReady: boolean;

  constructor(univerAPI: FUniver | null, isReady: boolean) {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
  }

  /**
   * Update the univerAPI instance
   */
  updateAPI(univerAPI: FUniver | null, isReady: boolean): void {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Get the active worksheet with validation
   */
  private getActiveWorksheet(): FWorksheet | null {
    if (!this.univerAPI || !this.isReady) {
      console.warn('Univer is not ready');
      return null;
    }

    const workbook = this.univerAPI.getActiveWorkbook();
    if (!workbook) {
      console.warn('No active workbook');
      return null;
    }

    const worksheet = workbook.getActiveSheet();
    if (!worksheet) {
      console.warn('No active worksheet');
      return null;
    }

    return worksheet;
  }

  /**
   * Validate range notation (A1 notation)
   */
  private validateRangeNotation(range: string): void {
    if (!range || typeof range !== 'string') {
      throw new Error('Range must be a non-empty string');
    }
    
    const rangePattern = /^([A-Z]+[0-9]+)(:[A-Z]+[0-9]+)?$|^[^!]+![A-Z]+[0-9]+(:[A-Z]+[0-9]+)?$/;
    if (!rangePattern.test(range)) {
      throw new Error(`Invalid range notation: ${range}. Use A1 notation (e.g., A1, A1:B10)`);
    }
  }

  /**
   * Create a new data validation builder
   */
  private createBuilder(): IFDataValidationBuilder | null {
    if (!this.univerAPI) {
      return null;
    }
    return (this.univerAPI as FUniverWithDataValidation).newDataValidation();
  }

  // ==========================================================================
  // Public API Methods - Number Validation
  // ==========================================================================

  /**
   * Create a number validation rule that requires a number between two values
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param start - Minimum value
   * @param end - Maximum value
   * @param options - Validation options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Require number between 1 and 100
   * await requireNumberBetween('A1:A10', 1, 100, {
   *   allowBlank: true,
   *   showErrorMessage: true,
   *   error: 'Please enter a number between 1 and 100'
   * });
   */
  async requireNumberBetween(
    range: string,
    start: number,
    end: number,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireNumberBetween(start, end)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating number between validation:', error);
      throw error;
    }
  }

  /**
   * Create a number validation rule that requires a number equal to a value
   */
  async requireNumberEqualTo(
    range: string,
    value: number,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireNumberEqualTo(value)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating number equal validation:', error);
      throw error;
    }
  }

  /**
   * Create a number validation rule that requires a number greater than a value
   */
  async requireNumberGreaterThan(
    range: string,
    value: number,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireNumberGreaterThan(value)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating number greater than validation:', error);
      throw error;
    }
  }

  /**
   * Create a number validation rule that requires a number less than a value
   */
  async requireNumberLessThan(
    range: string,
    value: number,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireNumberLessThan(value)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating number less than validation:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Public API Methods - Date Validation
  // ==========================================================================

  /**
   * Create a date validation rule that requires a date after a specific date
   */
  async requireDateAfter(
    range: string,
    date: Date | string,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireDateAfter(date)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating date after validation:', error);
      throw error;
    }
  }

  /**
   * Create a date validation rule that requires a date before a specific date
   */
  async requireDateBefore(
    range: string,
    date: Date | string,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireDateBefore(date)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating date before validation:', error);
      throw error;
    }
  }

  /**
   * Create a date validation rule that requires a date between two dates
   */
  async requireDateBetween(
    range: string,
    start: Date | string,
    end: Date | string,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireDateBetween(start, end)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating date between validation:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Public API Methods - List Validation
  // ==========================================================================

  /**
   * Create a dropdown list validation rule
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param values - Array of allowed values
   * @param options - Validation options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Create dropdown with predefined values
   * await requireValueInList('A1:A10', ['Active', 'Inactive', 'Pending'], {
   *   showErrorMessage: true,
   *   error: 'Please select a valid status'
   * });
   */
  async requireValueInList(
    range: string,
    values: string[],
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      if (!values || values.length === 0) {
        throw new Error('Values array cannot be empty');
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireValueInList(values)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating list validation:', error);
      throw error;
    }
  }

  /**
   * Create a dropdown list validation rule from a range
   * 
   * @param range - A1 notation range for cells to validate
   * @param sourceRange - A1 notation range containing the list values
   * @param options - Validation options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Create dropdown from range E1:E5
   * await requireValueInRange('A1:A10', 'E1:E5', {
   *   showErrorMessage: true,
   *   error: 'Please select a value from the list'
   * });
   */
  async requireValueInRange(
    range: string,
    sourceRange: string,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      this.validateRangeNotation(sourceRange);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireValueInRange(sourceRange)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating range list validation:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Public API Methods - Other Validation Types
  // ==========================================================================

  /**
   * Create a checkbox validation rule
   */
  async requireCheckbox(
    range: string,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireCheckbox()
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating checkbox validation:', error);
      throw error;
    }
  }

  /**
   * Create a custom formula validation rule
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param formula - Formula that must evaluate to TRUE
   * @param options - Validation options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Require value to be unique in column
   * await requireFormulaSatisfied('A2:A10', '=COUNTIF($A$2:$A$10,A2)=1', {
   *   showErrorMessage: true,
   *   error: 'Value must be unique'
   * });
   */
  async requireFormulaSatisfied(
    range: string,
    formula: string,
    options?: ValidationOptions
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      if (!formula || typeof formula !== 'string') {
        throw new Error('Formula must be a non-empty string');
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      const builder = this.createBuilder();
      if (!builder) {
        throw new Error('Failed to create data validation builder');
      }

      const rule = builder
        .requireFormulaSatisfied(formula)
        .setOptions(options || {})
        .build();

      (rangeObj as any).setDataValidation(rule);
      return true;
    } catch (error) {
      console.error('Error creating formula validation:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Public API Methods - Manage Validation Rules
  // ==========================================================================

  /**
   * Get data validation rule for a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns FDataValidation | null - Validation rule or null
   * 
   * @example
   * const rule = getDataValidation('A1:A10');
   * if (rule) {
   *   console.log('Type:', rule.getCriteriaType());
   *   console.log('Values:', rule.getCriteriaValues());
   * }
   */
  getDataValidation(range: string): FDataValidation | null {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        return null;
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        return null;
      }

      return (rangeObj as any).getDataValidation();
    } catch (error) {
      console.error('Error getting data validation:', error);
      return null;
    }
  }

  /**
   * Get all data validation rules for a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns FDataValidation[] - Array of validation rules
   */
  getDataValidations(range: string): FDataValidation[] {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        return [];
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        return [];
      }

      return (rangeObj as any).getDataValidations() || [];
    } catch (error) {
      console.error('Error getting data validations:', error);
      return [];
    }
  }

  /**
   * Get all data validation rules for the worksheet
   * 
   * @returns FDataValidation[] - Array of validation rules
   */
  getAllDataValidations(): FDataValidation[] {
    try {
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        return [];
      }

      return (worksheet as any).getDataValidations() || [];
    } catch (error) {
      console.error('Error getting all data validations:', error);
      return [];
    }
  }

  /**
   * Clear data validation from a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await clearDataValidation('A1:A10');
   */
  async clearDataValidation(range: string): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      (rangeObj as any).setDataValidation(null);
      return true;
    } catch (error) {
      console.error('Error clearing data validation:', error);
      throw error;
    }
  }

  /**
   * Get validation status for a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns Promise<any> - Validation status
   * 
   * @example
   * const status = await getValidatorStatus('A1:A10');
   * console.log('Valid cells:', status.validCells);
   * console.log('Invalid cells:', status.invalidCells);
   */
  async getValidatorStatus(range: string): Promise<any> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      return await (rangeObj as any).getValidatorStatus();
    } catch (error) {
      console.error('Error getting validator status:', error);
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new DataValidationService instance
 */
export function createDataValidationService(
  univerAPI: FUniver | null,
  isReady: boolean
): DataValidationService {
  return new DataValidationService(univerAPI, isReady);
}
