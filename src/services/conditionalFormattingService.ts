/**
 * Conditional Formatting Service for Univer Sheet Integration
 * 
 * Provides conditional formatting capabilities including:
 * - Highlight rules (cell empty/not empty, text conditions, number conditions)
 * - Data bars (visual representation of values)
 * - Color scales (gradient coloring based on values)
 * - Icon sets (visual indicators based on value ranges)
 * - Rule management (create, update, delete, reorder)
 * 
 * Requirements: 1.3.5, 4.2.5
 * @see https://docs.univer.ai/guides/sheets/features/conditional-formatting
 * @see https://reference.univer.ai/classes/FConditionalFormattingBuilder
 */

import type { FUniver, FWorksheet, IRange } from '../types/univer.types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface IConditionFormattingRule {
  cfId: string;
  ranges: IRange[];
  rule: any;
  stopIfTrue?: boolean;
}

export interface ConditionalFormattingRuleBuilder {
  // Condition methods
  whenCellEmpty(): ConditionalFormattingRuleBuilder;
  whenCellNotEmpty(): ConditionalFormattingRuleBuilder;
  whenNumberGreaterThan(value: number): ConditionalFormattingRuleBuilder;
  whenNumberLessThan(value: number): ConditionalFormattingRuleBuilder;
  whenNumberBetween(start: number, end: number): ConditionalFormattingRuleBuilder;
  whenTextContains(text: string): ConditionalFormattingRuleBuilder;
  whenFormulaSatisfied(formula: string): ConditionalFormattingRuleBuilder;
  
  // Formatting methods
  setBackground(color: string): ConditionalFormattingRuleBuilder;
  setFontColor(color: string): ConditionalFormattingRuleBuilder;
  setBold(isBold: boolean): ConditionalFormattingRuleBuilder;
  setItalic(isItalic: boolean): ConditionalFormattingRuleBuilder;
  
  // Build method
  build(): IConditionFormattingRule;
}

export interface HighlightRuleOptions {
  condition: 'empty' | 'notEmpty' | 'greaterThan' | 'lessThan' | 'between' | 'contains' | 'formula';
  value?: number | string;
  value2?: number; // For 'between' condition
  backgroundColor?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface DataBarOptions {
  min: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMin'; value?: number };
  max: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMax'; value?: number };
  positiveColor: string;
  negativeColor?: string;
  isGradient?: boolean;
  isShowValue?: boolean;
}

export interface ColorScaleOptions {
  minColor: string;
  midColor?: string;
  maxColor: string;
  minValue?: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMin'; value?: number };
  midValue?: { type: 'num' | 'percent' | 'formula' | 'percentile'; value?: number };
  maxValue?: { type: 'num' | 'percent' | 'formula' | 'percentile' | 'autoMax'; value?: number };
}

export interface IconSetOptions {
  iconType: '3Arrows' | '3ArrowsGray' | '3Flags' | '3TrafficLights' | '3Signs' | '3Symbols' | '3Stars' | '4Arrows' | '4ArrowsGray' | '4Rating' | '4TrafficLights' | '5Arrows' | '5ArrowsGray' | '5Rating' | '5Quarters';
  isShowValue?: boolean;
  reverseIconOrder?: boolean;
}

// ============================================================================
// Conditional Formatting Service Class
// ============================================================================

export class ConditionalFormattingService {
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

  // ==========================================================================
  // Public API Methods - Create Rules
  // ==========================================================================

  /**
   * Create a highlight rule for conditional formatting
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param options - Highlight rule options
   * @returns Promise<string> - Rule ID
   * 
   * @example
   * // Highlight empty cells in red
   * await createHighlightRule('A1:A10', {
   *   condition: 'empty',
   *   backgroundColor: '#FF0000'
   * });
   * 
   * // Highlight cells greater than 100 in green
   * await createHighlightRule('B1:B10', {
   *   condition: 'greaterThan',
   *   value: 100,
   *   backgroundColor: '#00FF00',
   *   bold: true
   * });
   */
  async createHighlightRule(range: string, options: HighlightRuleOptions): Promise<string> {
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

      // Create rule builder
      const builder = (worksheet as any).newConditionalFormattingRule();
      
      // Apply condition
      switch (options.condition) {
        case 'empty':
          builder.whenCellEmpty();
          break;
        case 'notEmpty':
          builder.whenCellNotEmpty();
          break;
        case 'greaterThan':
          if (typeof options.value !== 'number') {
            throw new Error('Value must be a number for greaterThan condition');
          }
          builder.whenNumberGreaterThan(options.value);
          break;
        case 'lessThan':
          if (typeof options.value !== 'number') {
            throw new Error('Value must be a number for lessThan condition');
          }
          builder.whenNumberLessThan(options.value);
          break;
        case 'between':
          if (typeof options.value !== 'number' || typeof options.value2 !== 'number') {
            throw new Error('Both value and value2 must be numbers for between condition');
          }
          builder.whenNumberBetween(options.value, options.value2);
          break;
        case 'contains':
          if (typeof options.value !== 'string') {
            throw new Error('Value must be a string for contains condition');
          }
          builder.whenTextContains(options.value);
          break;
        case 'formula':
          if (typeof options.value !== 'string') {
            throw new Error('Value must be a formula string for formula condition');
          }
          builder.whenFormulaSatisfied(options.value);
          break;
        default:
          throw new Error(`Unknown condition: ${options.condition}`);
      }

      // Apply formatting
      if (options.backgroundColor) {
        this.validateColor(options.backgroundColor);
        builder.setBackground(options.backgroundColor);
      }

      if (options.fontColor) {
        this.validateColor(options.fontColor);
        builder.setFontColor(options.fontColor);
      }

      if (options.bold !== undefined) {
        builder.setBold(options.bold);
      }

      if (options.italic !== undefined) {
        builder.setItalic(options.italic);
      }

      // Set range and build
      builder.setRanges([rangeObj.getRange()]);
      const rule = builder.build();

      // Add rule to worksheet
      (worksheet as any).addConditionalFormattingRule(rule);

      return rule.cfId;
    } catch (error) {
      console.error('Error creating highlight rule:', error);
      throw error;
    }
  }

  /**
   * Create a data bar rule for conditional formatting
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param options - Data bar options
   * @returns Promise<string> - Rule ID
   * 
   * @example
   * // Create data bar with auto min/max
   * await createDataBarRule('A1:A10', {
   *   min: { type: 'autoMin' },
   *   max: { type: 'autoMax' },
   *   positiveColor: '#00FF00',
   *   negativeColor: '#FF0000',
   *   isShowValue: true
   * });
   */
  async createDataBarRule(range: string, options: DataBarOptions): Promise<string> {
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

      // Validate colors
      this.validateColor(options.positiveColor);
      if (options.negativeColor) {
        this.validateColor(options.negativeColor);
      }

      // Create rule builder
      const builder = (worksheet as any).newConditionalFormattingRule();
      
      // Set data bar configuration
      builder.setDataBar({
        min: options.min,
        max: options.max,
        positiveColor: options.positiveColor,
        nativeColor: options.negativeColor || options.positiveColor,
        isShowValue: options.isShowValue ?? true,
        isGradient: options.isGradient ?? false,
      });

      // Set range and build
      builder.setRanges([rangeObj.getRange()]);
      const rule = builder.build();

      // Add rule to worksheet
      (worksheet as any).addConditionalFormattingRule(rule);

      return rule.cfId;
    } catch (error) {
      console.error('Error creating data bar rule:', error);
      throw error;
    }
  }

  /**
   * Create a color scale rule for conditional formatting
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param options - Color scale options
   * @returns Promise<string> - Rule ID
   * 
   * @example
   * // Create 2-color scale (red to green)
   * await createColorScaleRule('A1:A10', {
   *   minColor: '#FF0000',
   *   maxColor: '#00FF00'
   * });
   * 
   * // Create 3-color scale (red to yellow to green)
   * await createColorScaleRule('B1:B10', {
   *   minColor: '#FF0000',
   *   midColor: '#FFFF00',
   *   maxColor: '#00FF00'
   * });
   */
  async createColorScaleRule(range: string, options: ColorScaleOptions): Promise<string> {
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

      // Validate colors
      this.validateColor(options.minColor);
      this.validateColor(options.maxColor);
      if (options.midColor) {
        this.validateColor(options.midColor);
      }

      // Create rule builder
      const builder = (worksheet as any).newConditionalFormattingRule();
      
      // Build color scale configuration
      const colorScaleConfig: any[] = [
        {
          index: 0,
          color: options.minColor,
          value: options.minValue || { type: 'autoMin' },
        },
      ];

      if (options.midColor) {
        colorScaleConfig.push({
          index: 1,
          color: options.midColor,
          value: options.midValue || { type: 'percentile', value: 50 },
        });
      }

      colorScaleConfig.push({
        index: options.midColor ? 2 : 1,
        color: options.maxColor,
        value: options.maxValue || { type: 'autoMax' },
      });

      // Set color scale
      builder.setColorScale(colorScaleConfig);

      // Set range and build
      builder.setRanges([rangeObj.getRange()]);
      const rule = builder.build();

      // Add rule to worksheet
      (worksheet as any).addConditionalFormattingRule(rule);

      return rule.cfId;
    } catch (error) {
      console.error('Error creating color scale rule:', error);
      throw error;
    }
  }

  /**
   * Create an icon set rule for conditional formatting
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @param options - Icon set options
   * @returns Promise<string> - Rule ID
   * 
   * @example
   * // Create 3-arrow icon set
   * await createIconSetRule('A1:A10', {
   *   iconType: '3Arrows',
   *   isShowValue: true
   * });
   */
  async createIconSetRule(range: string, options: IconSetOptions): Promise<string> {
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

      // Create rule builder
      const builder = (worksheet as any).newConditionalFormattingRule();
      
      // Get icon count from icon type
      const iconCount = options.iconType.startsWith('3') ? 3 : 
                       options.iconType.startsWith('4') ? 4 : 5;

      // Build icon configurations
      const iconConfigs: any[] = [];
      const percentPerIcon = 100 / iconCount;

      for (let i = 0; i < iconCount; i++) {
        const iconId = options.reverseIconOrder ? (iconCount - 1 - i).toString() : i.toString();
        const percentile = options.reverseIconOrder ? 
          (i * percentPerIcon) : 
          ((iconCount - 1 - i) * percentPerIcon);

        iconConfigs.push({
          iconType: options.iconType,
          iconId,
          operator: this.univerAPI?.Enum?.ConditionFormatNumberOperatorEnum?.greaterThanOrEqual || 'greaterThanOrEqual',
          value: { type: 'percentile', value: percentile },
        });
      }

      // Set icon set
      builder.setIconSet({
        iconConfigs,
        isShowValue: options.isShowValue ?? true,
      });

      // Set range and build
      builder.setRanges([rangeObj.getRange()]);
      const rule = builder.build();

      // Add rule to worksheet
      (worksheet as any).addConditionalFormattingRule(rule);

      return rule.cfId;
    } catch (error) {
      console.error('Error creating icon set rule:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Public API Methods - Manage Rules
  // ==========================================================================

  /**
   * Get all conditional formatting rules for a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns IConditionFormattingRule[] - Array of rules
   * 
   * @example
   * const rules = await getRules('A1:A10');
   * console.log(`Found ${rules.length} rules`);
   */
  async getRules(range: string): Promise<IConditionFormattingRule[]> {
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

      const rules = (rangeObj as any).getConditionalFormattingRules();
      return rules || [];
    } catch (error) {
      console.error('Error getting rules:', error);
      throw error;
    }
  }

  /**
   * Get all conditional formatting rules for the worksheet
   * 
   * @returns IConditionFormattingRule[] - Array of rules
   * 
   * @example
   * const rules = await getAllRules();
   * console.log(`Found ${rules.length} rules in worksheet`);
   */
  async getAllRules(): Promise<IConditionFormattingRule[]> {
    try {
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rules = (worksheet as any).getConditionalFormattingRules();
      return rules || [];
    } catch (error) {
      console.error('Error getting all rules:', error);
      throw error;
    }
  }

  /**
   * Delete a conditional formatting rule
   * 
   * @param cfId - Rule ID
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await deleteRule('rule-id-123');
   */
  async deleteRule(cfId: string): Promise<boolean> {
    try {
      if (!cfId) {
        throw new Error('Rule ID is required');
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      (worksheet as any).deleteConditionalFormattingRule(cfId);
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw error;
    }
  }

  /**
   * Update a conditional formatting rule
   * 
   * @param cfId - Rule ID
   * @param rule - Updated rule
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * const rules = await getAllRules();
   * const updatedRule = { ...rules[0], ranges: [newRange] };
   * await updateRule(rules[0].cfId, updatedRule);
   */
  async updateRule(cfId: string, rule: Partial<IConditionFormattingRule>): Promise<boolean> {
    try {
      if (!cfId) {
        throw new Error('Rule ID is required');
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      (worksheet as any).setConditionalFormattingRule(cfId, rule);
      return true;
    } catch (error) {
      console.error('Error updating rule:', error);
      throw error;
    }
  }

  /**
   * Move a conditional formatting rule (change priority)
   * 
   * @param cfId - Rule ID to move
   * @param targetCfId - Target rule ID
   * @param position - Position relative to target ('before' or 'after')
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * const rules = await getAllRules();
   * // Move rule 2 before rule 0
   * await moveRule(rules[2].cfId, rules[0].cfId, 'before');
   */
  async moveRule(cfId: string, targetCfId: string, position: 'before' | 'after'): Promise<boolean> {
    try {
      if (!cfId || !targetCfId) {
        throw new Error('Both rule IDs are required');
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      (worksheet as any).moveConditionalFormattingRule(cfId, targetCfId, position);
      return true;
    } catch (error) {
      console.error('Error moving rule:', error);
      throw error;
    }
  }

  /**
   * Clear all conditional formatting rules from a range
   * 
   * @param range - A1 notation range (e.g., "A1:B10")
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await clearRules('A1:A10');
   */
  async clearRules(range: string): Promise<boolean> {
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

      (rangeObj as any).clearConditionalFormatRules();
      return true;
    } catch (error) {
      console.error('Error clearing rules:', error);
      throw error;
    }
  }

  /**
   * Clear all conditional formatting rules from the worksheet
   * 
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await clearAllRules();
   */
  async clearAllRules(): Promise<boolean> {
    try {
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      (worksheet as any).clearConditionalFormatRules();
      return true;
    } catch (error) {
      console.error('Error clearing all rules:', error);
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new ConditionalFormattingService instance
 */
export function createConditionalFormattingService(
  univerAPI: FUniver | null,
  isReady: boolean
): ConditionalFormattingService {
  return new ConditionalFormattingService(univerAPI, isReady);
}
