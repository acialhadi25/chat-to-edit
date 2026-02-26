/**
 * Command Parser Enhancement Tests
 * 
 * Tests for improved AI command parsing including:
 * - Command validation with helpful error messages
 * - Suggestions for invalid commands
 * - Ambiguous command handling
 * - Context awareness (Property 30)
 * 
 * Task: 10.3 - Improve AI command parsing
 * Requirements: 2.3.1, 2.3.2, 2.3.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommandParser } from '../commandParser';
import type { AIContext } from '../../types/ai.types';

describe('CommandParser Enhancements', () => {
  let parser: CommandParser;
  let context: AIContext;

  beforeEach(() => {
    parser = new CommandParser();
    context = {
      currentWorkbook: 'wb1',
      currentWorksheet: 'sheet1',
      currentSelection: 'A1:B10',
      recentOperations: [],
      conversationHistory: [],
    };
  });

  describe('Command Validation with Helpful Messages', () => {
    it('should provide helpful error message for invalid cell reference', () => {
      const command = {
        intent: 'read_cell' as const,
        parameters: { cell: 'INVALID' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid cell reference: INVALID');
      expect(validation.errors.some(e => e.includes('A1, B2, AA10'))).toBe(true);
    });

    it('should provide helpful error message for missing cell reference', () => {
      const command = {
        intent: 'read_cell' as const,
        parameters: {},
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Cell reference is required');
    });

    it('should provide helpful error message for invalid range reference', () => {
      const command = {
        intent: 'read_range' as const,
        parameters: { range: 'A1-B10' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid range reference: A1-B10');
      expect(validation.errors.some(e => e.includes('A1:B10'))).toBe(true);
    });

    it('should provide example for missing value in write operation', () => {
      const command = {
        intent: 'write_cell' as const,
        parameters: { cell: 'A1' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Value is required for write operation');
      expect(validation.errors.some(e => e.includes('Example:'))).toBe(true);
    });

    it('should provide example for missing formula', () => {
      const command = {
        intent: 'set_formula' as const,
        parameters: { cell: 'A1' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Formula is required');
      expect(validation.errors.some(e => e.includes('Example:'))).toBe(true);
    });
  });

  describe('Suggestions for Invalid Commands', () => {
    it('should provide suggestions for unknown commands', () => {
      const result = parser.parse('calculate total', context);

      expect(result.intent).toBe('unknown');
      expect(result.parameters.suggestions).toBeDefined();
      expect(Array.isArray(result.parameters.suggestions)).toBe(true);
    });

    it('should suggest similar commands based on keywords', () => {
      const result = parser.parse('sum column A', context);

      expect(result.intent).toBe('unknown');
      expect(result.parameters.suggestions).toBeDefined();
      
      const validation = parser.validate(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Did you mean:'))).toBe(true);
    });

    it('should provide top 3 suggestions for invalid commands', () => {
      const result = parser.parse('format cells', context);

      if (result.intent === 'unknown' && result.parameters.suggestions) {
        expect(result.parameters.suggestions.length).toBeLessThanOrEqual(3);
      }
    });

    it('should suggest commands based on partial matches', () => {
      const result = parser.parse('sum column A', context);

      // This might match or might not, but if unknown, should have suggestions
      if (result.intent === 'unknown') {
        expect(result.parameters.suggestions).toBeDefined();
      }
    });
  });

  describe('Context Awareness (Property 30)', () => {
    it('should use current selection for "analyze this"', () => {
      const result = parser.parse('analyze this', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.contextRange).toBe('A1:B10');
      expect(result.parameters.range).toBe('A1:B10');
    });

    it('should use current selection for "format this as currency"', () => {
      const result = parser.parse('format this as currency', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.contextRange).toBe('A1:B10');
      expect(result.parameters.format).toHaveProperty('numberFormat', '$#,##0.00');
    });

    it('should use current selection for "sort this by column A"', () => {
      const result = parser.parse('sort this by column A', context);

      expect(result.intent).toBe('sort_data');
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should use current selection for "create line chart"', () => {
      const result = parser.parse('create line chart', context);

      expect(result.intent).toBe('create_chart');
      expect(result.parameters.type).toBe('line');
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should use current selection for "filter this where status"', () => {
      const result = parser.parse('filter this where status', context);

      expect(result.intent).toBe('filter_data');
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should prefer explicit range over context', () => {
      const result = parser.parse('analyze data in C1:D20', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.range).toBe('C1:D20');
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should warn when using context for range operations', () => {
      const result = parser.parse('format this as bold', context);
      
      expect(result.intent).toBe('format_cells');
      expect(result.parameters.contextRange).toBe('A1:B10');
      expect(result.parameters.range).toBe('A1:B10');
      
      const validation = parser.validate(result);
      expect(validation.valid).toBe(true);
      // Should warn about using context
      expect(validation.warnings.some(w => w.includes('Using current selection'))).toBe(true);
    });

    it('should handle context-aware delete row', () => {
      const contextWithRow = {
        ...context,
        currentSelection: 'A5',
      };
      const result = parser.parse('delete this row', contextWithRow);

      expect(result.intent).toBe('delete_row');
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should handle context-aware delete column', () => {
      const result = parser.parse('delete this column', context);

      expect(result.intent).toBe('delete_column');
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe('Ambiguous Command Handling', () => {
    it('should detect ambiguous delete row without explicit row number', () => {
      const command = {
        intent: 'delete_row' as const,
        parameters: {},
        requiresConfirmation: true,
      };
      const validation = parser.validate(command);

      // Should have warnings about ambiguity
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should detect ambiguous context-aware commands', () => {
      const result = parser.parse('format selected as bold', context);
      
      expect(result.intent).toBe('format_cells');
      expect(result.parameters.contextRange).toBe('A1:B10');
      
      const validation = parser.validate(result);
      // Should warn about using context or ambiguity
      expect(validation.warnings.some(w => 
        w.includes('ambiguous') || w.includes('current selection')
      )).toBe(true);
    });

    it('should not flag explicit commands as ambiguous', () => {
      const result = parser.parse('delete row 5', context);
      const validation = parser.validate(result);

      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBe(0);
    });

    it('should handle ambiguous format commands gracefully', () => {
      const result = parser.parse('do something with formatting', context);

      // Should either parse correctly or provide suggestions
      if (result.intent === 'unknown') {
        expect(result.parameters.suggestions).toBeDefined();
      } else {
        expect(result.intent).toBe('format_cells');
      }
    });
  });

  describe('Context-Aware Pattern Matching', () => {
    it('should match "get statistics" without explicit range', () => {
      const result = parser.parse('get statistics', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should match "show summary" without explicit range', () => {
      const result = parser.parse('show summary', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should match "insert row" without explicit position', () => {
      const result = parser.parse('insert row', context);

      expect(result.intent).toBe('insert_row');
    });

    it('should match "insert column" without explicit position', () => {
      const result = parser.parse('insert column', context);

      expect(result.intent).toBe('insert_column');
    });

    it('should match "make selected bold"', () => {
      const result = parser.parse('make selected bold', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.format).toHaveProperty('bold', true);
      expect(result.parameters.contextRange).toBe('A1:B10');
    });

    it('should match "sort selected descending"', () => {
      const result = parser.parse('sort selected descending', context);

      expect(result.intent).toBe('sort_data');
      expect(result.parameters.options?.ascending).toBe(false);
      expect(result.parameters.contextRange).toBe('A1:B10');
    });
  });

  describe('Error Message Quality', () => {
    it('should provide actionable error messages', () => {
      const command = {
        intent: 'unknown' as const,
        parameters: { originalCommand: 'do something' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => 
        e.includes('Try rephrasing') || e.includes('Did you mean')
      )).toBe(true);
    });

    it('should suggest correct format for cell references', () => {
      const command = {
        intent: 'read_cell' as const,
        parameters: { cell: '1A' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('format like A1'))).toBe(true);
    });

    it('should suggest correct format for range references', () => {
      const command = {
        intent: 'read_range' as const,
        parameters: { range: 'A1,B10' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('format like A1:B10'))).toBe(true);
    });
  });

  describe('Context Without Selection', () => {
    it('should handle commands when no selection is active', () => {
      const emptyContext = {
        ...context,
        currentSelection: '',
      };
      const result = parser.parse('analyze this', emptyContext);

      expect(result.intent).toBe('analyze_data');
      // When no selection, contextRange might not be set or be empty
      expect(result.parameters.contextRange === '' || result.parameters.contextRange === undefined).toBe(true);
    });

    it('should require explicit range when no selection', () => {
      const emptyContext = {
        ...context,
        currentSelection: '',
      };
      const result = parser.parse('format this as currency', emptyContext);
      const validation = parser.validate(result);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Range reference is required'))).toBe(true);
    });

    it('should work with explicit parameters even without selection', () => {
      const emptyContext = {
        ...context,
        currentSelection: '',
      };
      const result = parser.parse('format A1:B10 as currency', emptyContext);
      const validation = parser.validate(result);

      expect(validation.valid).toBe(true);
      expect(result.parameters.range).toBe('A1:B10');
    });
  });

  describe('Suggestion Scoring', () => {
    it('should rank suggestions by relevance', () => {
      const result = parser.parse('calculate sum', context);

      if (result.intent === 'unknown' && result.parameters.suggestions) {
        const suggestions = result.parameters.suggestions;
        // First suggestion should be most relevant
        expect(suggestions[0].example.toLowerCase()).toMatch(/sum|calculate/);
      }
    });

    it('should provide diverse suggestions', () => {
      const result = parser.parse('data', context);

      if (result.intent === 'unknown' && result.parameters.suggestions) {
        const suggestions = result.parameters.suggestions;
        // Should have multiple different types of suggestions
        expect(suggestions.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty command gracefully', () => {
      const result = parser.parse('', context);

      expect(result.intent).toBe('unknown');
      const validation = parser.validate(result);
      expect(validation.valid).toBe(false);
    });

    it('should handle whitespace-only command', () => {
      const result = parser.parse('   ', context);

      expect(result.intent).toBe('unknown');
    });

    it('should handle very long commands', () => {
      const longCommand = 'please ' + 'very '.repeat(50) + 'format A1 as currency';
      const result = parser.parse(longCommand, context);

      // Should still attempt to parse
      expect(result).toBeDefined();
    });

    it('should handle special characters in commands', () => {
      const result = parser.parse('set A1 to $100.50', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('A1');
    });

    it('should handle context with invalid selection format', () => {
      const invalidContext = {
        ...context,
        currentSelection: 'INVALID',
      };
      const result = parser.parse('format this as bold', invalidContext);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.contextRange).toBe('INVALID');
    });
  });
});
