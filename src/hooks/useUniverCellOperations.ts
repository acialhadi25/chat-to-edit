/**
 * useUniverCellOperations Hook
 * 
 * Provides type-safe cell operations for Univer spreadsheet.
 * Implements getCellValue, setCellValue, getRangeValues, and setRangeValues
 * with validation and error handling.
 * 
 * Requirements: 1.1.3, 1.1.4
 * @see https://docs.univer.ai/guides/sheets/getting-started/cell-data
 */

import { useCallback } from 'react';
import type { FUniver, FWorkbook, FWorksheet, FRange } from '../types/univer.types';

interface UseUniverCellOperationsOptions {
  univerAPI: FUniver | null;
  isReady: boolean;
}

interface UseUniverCellOperationsReturn {
  getCellValue: (row: number, col: number) => any;
  setCellValue: (row: number, col: number, value: any) => Promise<void>;
  getRangeValues: (range: string) => any[][];
  setRangeValues: (range: string, values: any[][]) => Promise<void>;
  getFormula: (row: number, col: number) => string | null;
  setFormula: (row: number, col: number, formula: string) => Promise<void>;
}

/**
 * Custom hook for cell operations with type safety and validation
 */
export function useUniverCellOperations({
  univerAPI,
  isReady,
}: UseUniverCellOperationsOptions): UseUniverCellOperationsReturn {
  
  /**
   * Get the active worksheet with validation
   */
  const getActiveWorksheet = useCallback((): FWorksheet | null => {
    if (!univerAPI || !isReady) {
      console.warn('Univer is not ready');
      return null;
    }

    const workbook = univerAPI.getActiveWorkbook();
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
  }, [univerAPI, isReady]);

  /**
   * Validate cell coordinates
   */
  const validateCellCoordinates = useCallback((row: number, col: number): void => {
    if (!Number.isInteger(row) || row < 0) {
      throw new Error(`Invalid row index: ${row}. Row must be a non-negative integer.`);
    }
    if (!Number.isInteger(col) || col < 0) {
      throw new Error(`Invalid column index: ${col}. Column must be a non-negative integer.`);
    }
  }, []);

  /**
   * Validate range notation (A1 notation)
   */
  const validateRangeNotation = useCallback((range: string): void => {
    if (!range || typeof range !== 'string') {
      throw new Error('Range must be a non-empty string');
    }
    
    // Basic A1 notation validation (e.g., A1, A1:B10, Sheet1!A1:B10)
    const rangePattern = /^([A-Z]+[0-9]+)(:[A-Z]+[0-9]+)?$|^[^!]+![A-Z]+[0-9]+(:[A-Z]+[0-9]+)?$/;
    if (!rangePattern.test(range)) {
      throw new Error(`Invalid range notation: ${range}. Use A1 notation (e.g., A1, A1:B10)`);
    }
  }, []);

  /**
   * Get cell value with type safety
   * 
   * @param row - Zero-based row index
   * @param col - Zero-based column index
   * @returns Cell value (string, number, boolean, or undefined)
   */
  const getCellValue = useCallback((row: number, col: number): any => {
    try {
      validateCellCoordinates(row, col);
      
      const worksheet = getActiveWorksheet();
      if (!worksheet) {
        return undefined;
      }

      const range = worksheet.getRange(row, col);
      if (!range) {
        return undefined;
      }

      return range.getValue();
    } catch (error) {
      console.error('Error getting cell value:', error);
      throw error;
    }
  }, [getActiveWorksheet, validateCellCoordinates]);

  /**
   * Set cell value with validation
   * 
   * @param row - Zero-based row index
   * @param col - Zero-based column index
   * @param value - Value to set (string, number, boolean, or null)
   */
  const setCellValue = useCallback(async (row: number, col: number, value: any): Promise<void> => {
    try {
      validateCellCoordinates(row, col);
      
      const worksheet = getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const range = worksheet.getRange(row, col);
      if (!range) {
        throw new Error(`Failed to get range for cell (${row}, ${col})`);
      }

      const success = await range.setValue(value);
      if (!success) {
        throw new Error(`Failed to set value for cell (${row}, ${col})`);
      }
    } catch (error) {
      console.error('Error setting cell value:', error);
      throw error;
    }
  }, [getActiveWorksheet, validateCellCoordinates]);

  /**
   * Get range values for batch reads
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns 2D array of values
   */
  const getRangeValues = useCallback((range: string): any[][] => {
    try {
      validateRangeNotation(range);
      
      const worksheet = getActiveWorksheet();
      if (!worksheet) {
        return [];
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        return [];
      }

      const values = rangeObj.getValues();
      return values || [];
    } catch (error) {
      console.error('Error getting range values:', error);
      throw error;
    }
  }, [getActiveWorksheet, validateRangeNotation]);

  /**
   * Set range values for batch writes
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param values - 2D array of values to set
   */
  const setRangeValues = useCallback(async (range: string, values: any[][]): Promise<void> => {
    try {
      validateRangeNotation(range);
      
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Values must be a non-empty 2D array');
      }

      // Validate that all rows are arrays
      if (!values.every(row => Array.isArray(row))) {
        throw new Error('Values must be a 2D array (array of arrays)');
      }

      const worksheet = getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      // Validate dimensions match
      const numRows = rangeObj.getNumRows();
      const numCols = rangeObj.getNumColumns();
      
      if (values.length !== numRows) {
        throw new Error(
          `Row count mismatch: range has ${numRows} rows but values has ${values.length} rows`
        );
      }

      const maxCols = Math.max(...values.map(row => row.length));
      if (maxCols > numCols) {
        throw new Error(
          `Column count mismatch: range has ${numCols} columns but values has ${maxCols} columns`
        );
      }

      const success = await rangeObj.setValues(values);
      if (!success) {
        throw new Error(`Failed to set values for range: ${range}`);
      }
    } catch (error) {
      console.error('Error setting range values:', error);
      throw error;
    }
  }, [getActiveWorksheet, validateRangeNotation]);

  /**
   * Validate formula syntax
   */
  const validateFormula = useCallback((formula: string): void => {
    if (!formula || typeof formula !== 'string') {
      throw new Error('Formula must be a non-empty string');
    }

    if (!formula.startsWith('=')) {
      throw new Error('Formula must start with = (e.g., =SUM(A1:A10))');
    }

    // Check for common formula errors
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      throw new Error('Formula has mismatched parentheses');
    }
  }, []);

  /**
   * Get formula from a cell
   * 
   * @param row - Zero-based row index
   * @param col - Zero-based column index
   * @returns Formula string (with =) or null if cell has no formula
   */
  const getFormula = useCallback((row: number, col: number): string | null => {
    try {
      validateCellCoordinates(row, col);
      
      const worksheet = getActiveWorksheet();
      if (!worksheet) {
        return null;
      }

      const range = worksheet.getRange(row, col);
      if (!range) {
        return null;
      }

      const formula = range.getFormula();
      return formula || null;
    } catch (error) {
      console.error('Error getting formula:', error);
      throw error;
    }
  }, [getActiveWorksheet, validateCellCoordinates]);

  /**
   * Set formula for a cell
   * 
   * @param row - Zero-based row index
   * @param col - Zero-based column index
   * @param formula - Formula string (must start with =)
   */
  const setFormula = useCallback(async (row: number, col: number, formula: string): Promise<void> => {
    try {
      validateCellCoordinates(row, col);
      validateFormula(formula);
      
      const worksheet = getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const range = worksheet.getRange(row, col);
      if (!range) {
        throw new Error(`Failed to get range for cell (${row}, ${col})`);
      }

      const success = await range.setFormula(formula);
      if (!success) {
        throw new Error(`Failed to set formula for cell (${row}, ${col})`);
      }
    } catch (error) {
      console.error('Error setting formula:', error);
      throw error;
    }
  }, [getActiveWorksheet, validateCellCoordinates, validateFormula]);

  return {
    getCellValue,
    setCellValue,
    getRangeValues,
    setRangeValues,
    getFormula,
    setFormula,
  };
}
