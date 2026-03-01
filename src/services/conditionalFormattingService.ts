// @ts-nocheck
/**
 * Conditional Formatting Service
 * 
 * Handles conditional formatting using Univer's native API.
 * This ensures formatting rules persist through workbook recreation.
 * 
 * @see https://docs.univer.ai/guides/sheets/features/conditional-formatting
 */

import type { FUniver, FWorksheet, IRange } from '@/types/univer.types';

export interface ConditionalFormattingRule {
  condition: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'textContains' | 'textEquals' | 'textStartsWith' | 'textEndsWith';
  value: string;
  format: {
    backgroundColor?: string;
    color?: string;
    bold?: boolean;
    caseSensitive?: boolean;
  };
  formula?: string;
}

export interface ConditionalFormattingParams {
  rules: ConditionalFormattingRule[];
  target: {
    type: 'column' | 'range';
    ref: string;
  };
}

/**
 * Apply conditional formatting rules to a range using Univer's native API
 */
export function applyConditionalFormatting(
  univerAPI: FUniver,
  params: ConditionalFormattingParams
): boolean {
  try {
    const workbook = univerAPI.getActiveWorkbook();
    if (!workbook) {
      console.warn('No active workbook');
      return false;
    }

    const worksheet = workbook.getActiveSheet();
    if (!worksheet) {
      console.warn('No active sheet');
      return false;
    }

    // Parse target range
    const rangeRef = parseTargetRange(params.target, worksheet);
    if (!rangeRef) {
      console.warn('Invalid target range:', params.target);
      return false;
    }

    console.log('Applying conditional formatting to range:', rangeRef);

    // Apply each rule
    params.rules.forEach((rule, index) => {
      try {
        applyRule(worksheet, rangeRef, rule, index);
      } catch (error) {
        console.error(`Failed to apply rule ${index}:`, error);
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to apply conditional formatting:', error);
    return false;
  }
}

/**
 * Parse target range from action params
 */
function parseTargetRange(
  target: { type: 'column' | 'range'; ref: string },
  worksheet: FWorksheet
): string | null {
  let rangeRef = target.ref;

  // If it's a column reference like "G", convert to range like "G:G"
  if (target.type === 'column' && !rangeRef.includes(':')) {
    rangeRef = `${rangeRef}:${rangeRef}`;
  }

  // If it's a range like "G2:G13", use as is
  // If it's just "G", convert to "G:G" (entire column)
  if (!rangeRef.includes(':')) {
    rangeRef = `${rangeRef}:${rangeRef}`;
  }

  return rangeRef;
}

/**
 * Apply a single conditional formatting rule
 */
function applyRule(
  worksheet: FWorksheet,
  rangeRef: string,
  rule: ConditionalFormattingRule,
  index: number
): void {
  console.log(`Applying rule ${index}:`, rule);

  // Get the range
  const fRange = worksheet.getRange(rangeRef);
  if (!fRange) {
    console.warn('Failed to get range:', rangeRef);
    return;
  }

  // Create conditional formatting builder
  const builder = worksheet.newConditionalFormattingRule();

  // Set the range
  builder.setRanges([fRange.getRange()]);

  // Apply condition based on rule type
  const condition = rule.condition;
  const value = rule.value;
  const caseSensitive = rule.format?.caseSensitive === true;

  // Map condition to Univer API method
  switch (condition) {
    case 'contains':
    case 'textContains':
      builder.whenTextContains(value);
      break;

    case 'equals':
    case 'textEquals':
      builder.whenTextEqualTo(value);
      break;

    case 'startsWith':
    case 'textStartsWith':
      builder.whenTextStartsWith(value);
      break;

    case 'endsWith':
    case 'textEndsWith':
      builder.whenTextEndsWith(value);
      break;

    default:
      console.warn('Unsupported condition:', condition);
      return;
  }

  // Apply formatting
  if (rule.format.backgroundColor) {
    builder.setBackground(rule.format.backgroundColor);
  }

  if (rule.format.color) {
    builder.setFontColor(rule.format.color);
  }

  if (rule.format.bold) {
    builder.setBold(true);
  }

  // Build and add the rule
  const cfRule = builder.build();
  worksheet.addConditionalFormattingRule(cfRule);

  console.log(`✅ Applied conditional formatting rule ${index}`);
}

/**
 * Clear all conditional formatting rules from a range
 */
export function clearConditionalFormatting(
  univerAPI: FUniver,
  rangeRef?: string
): boolean {
  try {
    const workbook = univerAPI.getActiveWorkbook();
    if (!workbook) {
      console.warn('No active workbook');
      return false;
    }

    const worksheet = workbook.getActiveSheet();
    if (!worksheet) {
      console.warn('No active sheet');
      return false;
    }

    if (rangeRef) {
      // Clear rules for specific range
      const fRange = worksheet.getRange(rangeRef);
      if (fRange) {
        fRange.clearConditionalFormatRules();
        console.log('✅ Cleared conditional formatting for range:', rangeRef);
      }
    } else {
      // Clear all rules in worksheet
      worksheet.clearConditionalFormatRules();
      console.log('✅ Cleared all conditional formatting rules');
    }

    return true;
  } catch (error) {
    console.error('Failed to clear conditional formatting:', error);
    return false;
  }
}

/**
 * Get all conditional formatting rules from a worksheet
 */
export function getConditionalFormattingRules(univerAPI: FUniver): any[] {
  try {
    const workbook = univerAPI.getActiveWorkbook();
    if (!workbook) {
      return [];
    }

    const worksheet = workbook.getActiveSheet();
    if (!worksheet) {
      return [];
    }

    return worksheet.getConditionalFormattingRules() || [];
  } catch (error) {
    console.error('Failed to get conditional formatting rules:', error);
    return [];
  }
}
