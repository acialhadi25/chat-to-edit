/**
 * Formatting Service for Univer Sheet Integration
 * 
 * Provides comprehensive formatting capabilities including:
 * - Number formatting (currency, percentage, date, custom)
 * - Cell styling (colors, fonts, text decorations)
 * - Border styling (all sides, outline, inside)
 * - Cell alignment (horizontal, vertical, text wrap)
 * 
 * Requirements: 1.3.1, 1.3.2, 1.3.3, 1.3.4
 * @see https://docs.univer.ai/guides/sheets/getting-started/cell-data
 */

import type { FUniver, FWorksheet, ICellStyle, IBorderData, IBorderStyle } from '../types/univer.types';
import { BorderStyleType, HorizontalAlign, VerticalAlign } from '../types/univer.types';

// ============================================================================
// Type Definitions
// ============================================================================

export type NumberFormatType = 'currency' | 'percentage' | 'date' | 'time' | 'custom';

export interface NumberFormatOptions {
  type: NumberFormatType;
  decimals?: number;
  currencySymbol?: string;
  dateFormat?: string;
  customFormat?: string;
}

export interface CellStyleOptions {
  fontColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export interface BorderStyleOptions {
  top?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
  right?: BorderStyle;
  all?: BorderStyle;
  outline?: BorderStyle;
  inside?: BorderStyle;
}

export interface BorderStyle {
  style: BorderStyleType;
  color: string;
}

export interface AlignmentOptions {
  horizontal?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
}

// ============================================================================
// Formatting Service Class
// ============================================================================

export class FormattingService {
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
   * Validate color format (hex color)
   */
  private validateColor(color: string): void {
    if (!color || typeof color !== 'string') {
      throw new Error('Color must be a non-empty string');
    }

    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(color)) {
      throw new Error(`Invalid color format: ${color}. Use hex format (e.g., #FF0000)`);
    }
  }

  /**
   * Convert number format options to Univer format string
   */
  private convertNumberFormat(options: NumberFormatOptions): string {
    switch (options.type) {
      case 'currency': {
        const symbol = options.currencySymbol || '$';
        const decimals = options.decimals ?? 2;
        const zeros = '0'.repeat(decimals);
        return `${symbol}#,##0.${zeros}`;
      }
      
      case 'percentage': {
        const decimals = options.decimals ?? 2;
        const zeros = '0'.repeat(decimals);
        return `0.${zeros}%`;
      }
      
      case 'date': {
        return options.dateFormat || 'yyyy-mm-dd';
      }
      
      case 'time': {
        return 'hh:mm:ss';
      }
      
      case 'custom': {
        if (!options.customFormat) {
          throw new Error('Custom format requires customFormat property');
        }
        return options.customFormat;
      }
      
      default:
        throw new Error(`Unknown number format type: ${options.type}`);
    }
  }

  /**
   * Convert cell style options to Univer ICellStyle
   */
  private convertCellStyle(options: CellStyleOptions): Partial<ICellStyle> {
    const style: Partial<ICellStyle> = {};

    if (options.fontColor) {
      this.validateColor(options.fontColor);
      style.fc = { rgb: options.fontColor };
    }

    if (options.backgroundColor) {
      this.validateColor(options.backgroundColor);
      style.bg = { rgb: options.backgroundColor };
    }

    if (options.fontFamily) {
      style.ff = options.fontFamily;
    }

    if (options.fontSize !== undefined) {
      if (options.fontSize <= 0) {
        throw new Error('Font size must be positive');
      }
      style.fs = options.fontSize;
    }

    if (options.bold !== undefined) {
      style.bl = options.bold ? 1 : 0;
    }

    if (options.italic !== undefined) {
      style.it = options.italic ? 1 : 0;
    }

    if (options.underline !== undefined) {
      style.ul = { s: options.underline ? 1 : 0 };
    }

    if (options.strikethrough !== undefined) {
      style.st = { s: options.strikethrough ? 1 : 0 };
    }

    return style;
  }

  /**
   * Convert border style options to Univer IBorderData
   * Note: This method is prepared for future use when Univer Facade API supports borders
   * @private
   */
  private _convertBorderStyle(options: BorderStyleOptions): Partial<IBorderData> {
    const borders: Partial<IBorderData> = {};

    const createBorderStyle = (border: BorderStyle): IBorderStyle => {
      this.validateColor(border.color);
      return {
        s: border.style,
        cl: { rgb: border.color },
      };
    };

    // Handle 'all' option - applies to all sides
    if (options.all) {
      const borderStyle = createBorderStyle(options.all);
      borders.t = borderStyle;
      borders.b = borderStyle;
      borders.l = borderStyle;
      borders.r = borderStyle;
      return borders;
    }

    // Handle 'outline' option - applies to outer edges only
    if (options.outline) {
      const borderStyle = createBorderStyle(options.outline);
      borders.t = borderStyle;
      borders.b = borderStyle;
      borders.l = borderStyle;
      borders.r = borderStyle;
      // Note: For multi-cell ranges, this will be applied to outer edges
      // Inner borders are not affected
    }

    // Handle individual sides
    if (options.top) {
      borders.t = createBorderStyle(options.top);
    }

    if (options.bottom) {
      borders.b = createBorderStyle(options.bottom);
    }

    if (options.left) {
      borders.l = createBorderStyle(options.left);
    }

    if (options.right) {
      borders.r = createBorderStyle(options.right);
    }

    // Note: 'inside' option requires special handling for multi-cell ranges
    // This is handled in the applyBorderStyle method

    return borders;
  }

  /**
   * Convert alignment options to Univer style properties
   * Note: This method is prepared for future use when more alignment options are available
   * @private
   */
  private _convertAlignment(options: AlignmentOptions): Partial<ICellStyle> {
    const style: Partial<ICellStyle> = {};

    if (options.horizontal) {
      switch (options.horizontal) {
        case 'left':
          style.ht = HorizontalAlign.LEFT;
          break;
        case 'center':
          style.ht = HorizontalAlign.CENTER;
          break;
        case 'right':
          style.ht = HorizontalAlign.RIGHT;
          break;
      }
    }

    if (options.vertical) {
      switch (options.vertical) {
        case 'top':
          style.vt = VerticalAlign.TOP;
          break;
        case 'middle':
          style.vt = VerticalAlign.MIDDLE;
          break;
        case 'bottom':
          style.vt = VerticalAlign.BOTTOM;
          break;
      }
    }

    if (options.wrapText !== undefined) {
      style.tb = options.wrapText ? 1 : 0;
    }

    return style;
  }

  // ==========================================================================
  // Public API Methods
  // ==========================================================================

  /**
   * Apply number format to a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param format - Number format options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Currency format
   * await applyNumberFormat('A1:A10', { type: 'currency', decimals: 2, currencySymbol: '$' });
   * 
   * // Percentage format
   * await applyNumberFormat('B1:B10', { type: 'percentage', decimals: 1 });
   * 
   * // Date format
   * await applyNumberFormat('C1:C10', { type: 'date', dateFormat: 'yyyy-mm-dd' });
   */
  async applyNumberFormat(range: string, format: NumberFormatOptions): Promise<boolean> {
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

      const formatString = this.convertNumberFormat(format);
      const success = await rangeObj.setNumberFormat(formatString);
      
      if (!success) {
        throw new Error(`Failed to apply number format to range: ${range}`);
      }

      return true;
    } catch (error) {
      console.error('Error applying number format:', error);
      throw error;
    }
  }

  /**
   * Apply cell style to a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param style - Cell style options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Apply font color and background
   * await applyCellStyle('A1:A10', { 
   *   fontColor: '#FF0000', 
   *   backgroundColor: '#FFFF00',
   *   bold: true 
   * });
   * 
   * // Apply font styling
   * await applyCellStyle('B1:B10', { 
   *   fontFamily: 'Arial', 
   *   fontSize: 14,
   *   italic: true 
   * });
   */
  async applyCellStyle(range: string, style: CellStyleOptions): Promise<boolean> {
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

      const cellStyle = this.convertCellStyle(style);
      
      // Apply each style property individually
      const promises: Promise<boolean>[] = [];

      if (cellStyle.fc) {
        promises.push(rangeObj.setFontColor(cellStyle.fc.rgb));
      }

      if (cellStyle.bg) {
        promises.push(rangeObj.setBackgroundColor(cellStyle.bg.rgb));
      }

      if (cellStyle.fs) {
        promises.push(rangeObj.setFontSize(cellStyle.fs));
      }

      if (cellStyle.bl !== undefined) {
        promises.push(rangeObj.setFontWeight(cellStyle.bl === 1 ? 'bold' : 'normal'));
      }

      if (cellStyle.it !== undefined) {
        promises.push(rangeObj.setFontStyle(cellStyle.it === 1 ? 'italic' : 'normal'));
      }

      const results = await Promise.all(promises);
      
      if (results.some(result => !result)) {
        throw new Error(`Failed to apply some cell styles to range: ${range}`);
      }

      return true;
    } catch (error) {
      console.error('Error applying cell style:', error);
      throw error;
    }
  }

  /**
   * Apply border style to a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param _borders - Border style options (not yet supported)
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Apply border to all sides
   * await applyBorderStyle('A1:B10', { 
   *   all: { style: BorderStyleType.THIN, color: '#000000' } 
   * });
   * 
   * // Apply outline border
   * await applyBorderStyle('A1:B10', { 
   *   outline: { style: BorderStyleType.MEDIUM, color: '#FF0000' } 
   * });
   * 
   * // Apply individual borders
   * await applyBorderStyle('A1:B10', { 
   *   top: { style: BorderStyleType.THICK, color: '#0000FF' },
   *   bottom: { style: BorderStyleType.THIN, color: '#00FF00' }
   * });
   */
  async applyBorderStyle(range: string, _borders: BorderStyleOptions): Promise<boolean> {
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

      // Note: Univer's Facade API doesn't have direct border methods yet
      // This is a placeholder for when the API is available
      // For now, we'll throw an informative error
      
      throw new Error(
        'Border styling via Facade API is not yet available in Univer. ' +
        'Use the underlying command system or wait for API updates.'
      );

      // TODO: Implement when Univer Facade API supports borders
      // const borderData = this.convertBorderStyle(borders);
      // const success = await rangeObj.setBorders(borderData);
      // return success;
    } catch (error) {
      console.error('Error applying border style:', error);
      throw error;
    }
  }

  /**
   * Apply cell alignment to a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param alignment - Alignment options
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Center align
   * await applyCellAlignment('A1:A10', { 
   *   horizontal: 'center', 
   *   vertical: 'middle' 
   * });
   * 
   * // Right align with wrap text
   * await applyCellAlignment('B1:B10', { 
   *   horizontal: 'right',
   *   wrapText: true 
   * });
   */
  async applyCellAlignment(range: string, alignment: AlignmentOptions): Promise<boolean> {
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

      const promises: Promise<boolean>[] = [];

      if (alignment.horizontal) {
        promises.push(rangeObj.setHorizontalAlignment(alignment.horizontal));
      }

      if (alignment.vertical) {
        promises.push(rangeObj.setVerticalAlignment(alignment.vertical));
      }

      // Note: wrapText is not yet available in Facade API
      if (alignment.wrapText !== undefined) {
        console.warn('Text wrap is not yet available in Univer Facade API');
      }

      const results = await Promise.all(promises);
      
      if (results.some(result => !result)) {
        throw new Error(`Failed to apply alignment to range: ${range}`);
      }

      return true;
    } catch (error) {
      console.error('Error applying cell alignment:', error);
      throw error;
    }
  }

  /**
   * Clear all formatting from a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await clearFormatting('A1:B10');
   */
  async clearFormatting(range: string): Promise<boolean> {
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

      // Clear all formatting by applying default styles
      const promises: Promise<boolean>[] = [
        rangeObj.setFontColor('#000000'),
        rangeObj.setBackgroundColor('#FFFFFF'),
        rangeObj.setFontWeight('normal'),
        rangeObj.setFontStyle('normal'),
        rangeObj.setFontSize(11),
        rangeObj.setHorizontalAlignment('left'),
        rangeObj.setVerticalAlignment('bottom'),
        rangeObj.setNumberFormat('General'),
      ];

      const results = await Promise.all(promises);
      
      if (results.some(result => !result)) {
        throw new Error(`Failed to clear formatting from range: ${range}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing formatting:', error);
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new FormattingService instance
 */
export function createFormattingService(
  univerAPI: FUniver | null,
  isReady: boolean
): FormattingService {
  return new FormattingService(univerAPI, isReady);
}
