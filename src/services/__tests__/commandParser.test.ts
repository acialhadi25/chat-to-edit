/**
 * Command Parser Unit Tests
 * 
 * Tests for natural language command parsing including:
 * - Intent recognition (Requirements 2.3.1, 2.3.2)
 * - Parameter extraction (Requirements 2.3.3)
 * - Command validation (Requirements 2.3.4, 2.3.5)
 * - Command suggestions
 * 
 * Documentation: docs/univer/features/mcp.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommandParser } from '../commandParser';
import type { AIContext } from '../../types/ai.types';

describe('CommandParser', () => {
  let parser: CommandParser;
  let context: AIContext;

  beforeEach(() => {
    parser = new CommandParser();
    context = {
      currentWorkbook: 'wb1',
      currentWorksheet: 'sheet1',
      currentSelection: 'A1',
      recentOperations: [],
      conversationHistory: [],
    };
  });

  describe('Read Cell Commands', () => {
    it('should parse "get value of A1"', () => {
      const result = parser.parse('get value of A1', context);

      expect(result.intent).toBe('read_cell');
      expect(result.parameters.cell).toBe('A1');
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should parse "read B2"', () => {
      const result = parser.parse('read B2', context);

      expect(result.intent).toBe('read_cell');
      expect(result.parameters.cell).toBe('B2');
    });

    it('should parse "show C3"', () => {
      const result = parser.parse('show C3', context);

      expect(result.intent).toBe('read_cell');
      expect(result.parameters.cell).toBe('C3');
    });

    it('should parse "what is D4"', () => {
      const result = parser.parse("what's D4", context);

      expect(result.intent).toBe('read_cell');
      expect(result.parameters.cell).toBe('D4');
    });

    it('should normalize cell references to uppercase', () => {
      const result = parser.parse('get value of a1', context);

      expect(result.parameters.cell).toBe('A1');
    });
  });

  describe('Write Cell Commands', () => {
    it('should parse "set A1 to 100"', () => {
      const result = parser.parse('set A1 to 100', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('A1');
      expect(result.parameters.value).toBe(100);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should parse "write hello to B2"', () => {
      const result = parser.parse('write hello to B2', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('B2');
      expect(result.parameters.value).toBe('hello');
    });

    it('should parse "put test in C3"', () => {
      const result = parser.parse('put test in C3', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('C3');
      expect(result.parameters.value).toBe('test');
    });

    it('should parse numeric values correctly', () => {
      const result = parser.parse('set D4 to 42.5', context);

      expect(result.parameters.value).toBe(42.5);
      expect(typeof result.parameters.value).toBe('number');
    });

    it('should parse boolean values correctly', () => {
      const result1 = parser.parse('set E5 to true', context);
      const result2 = parser.parse('set F6 to false', context);

      expect(result1.parameters.value).toBe(true);
      expect(result2.parameters.value).toBe(false);
    });

    it('should parse string values correctly', () => {
      const result = parser.parse('set G7 to hello world', context);

      expect(result.parameters.value).toBe('hello world');
      expect(typeof result.parameters.value).toBe('string');
    });
  });

  describe('Read Range Commands', () => {
    it('should parse "get values of A1:B10"', () => {
      const result = parser.parse('get values of A1:B10', context);

      expect(result.intent).toBe('read_range');
      expect(result.parameters.range).toBe('A1:B10');
    });

    it('should parse "read A1:C5"', () => {
      const result = parser.parse('read A1:C5', context);

      expect(result.intent).toBe('read_range');
      expect(result.parameters.range).toBe('A1:C5');
    });

    it('should parse "show B2:D8"', () => {
      const result = parser.parse('show B2:D8', context);

      expect(result.intent).toBe('read_range');
      expect(result.parameters.range).toBe('B2:D8');
    });

    it('should normalize range references to uppercase', () => {
      const result = parser.parse('get values of a1:b10', context);

      expect(result.parameters.range).toBe('A1:B10');
    });
  });

  describe('Write Range Commands', () => {
    it('should parse "write data to A1:B2"', () => {
      const result = parser.parse('write data to A1:B2', context);

      expect(result.intent).toBe('write_range');
      expect(result.parameters.range).toBe('A1:B2');
    });

    it('should parse "fill C3:D5 with test"', () => {
      const result = parser.parse('fill C3:D5 with test', context);

      expect(result.intent).toBe('write_range');
      expect(result.parameters.range).toBe('C3:D5');
    });
  });

  describe('Formula Commands', () => {
    it('should parse "calculate SUM(A1:A10) in A11"', () => {
      const result = parser.parse('calculate SUM(A1:A10) in A11', context);

      expect(result.intent).toBe('set_formula');
      expect(result.parameters.formula).toBe('SUM(A1:A10)');
      expect(result.parameters.cell).toBe('A11');
    });

    it('should parse "A11 = SUM(A1:A10)"', () => {
      const result = parser.parse('A11 = SUM(A1:A10)', context);

      expect(result.intent).toBe('set_formula');
      expect(result.parameters.cell).toBe('A11');
      expect(result.parameters.formula).toBe('SUM(A1:A10)');
    });

    it('should parse "formula AVERAGE(B1:B5) in B6"', () => {
      const result = parser.parse('formula AVERAGE(B1:B5) in B6', context);

      expect(result.intent).toBe('set_formula');
      expect(result.parameters.formula).toBe('AVERAGE(B1:B5)');
      expect(result.parameters.cell).toBe('B6');
    });

    it('should parse complex formulas', () => {
      const result = parser.parse('calculate IF(A1>10, SUM(B1:B5), 0) in C1', context);

      expect(result.intent).toBe('set_formula');
      expect(result.parameters.formula).toBe('IF(A1>10, SUM(B1:B5), 0)');
      expect(result.parameters.cell).toBe('C1');
    });
  });

  describe('Format Commands', () => {
    it('should parse "format A1:B10 as currency"', () => {
      const result = parser.parse('format A1:B10 as currency', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('A1:B10');
      expect(result.parameters.format).toHaveProperty('numberFormat', '$#,##0.00');
    });

    it('should parse "format C1:C5 as percentage"', () => {
      const result = parser.parse('format C1:C5 as percentage', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('C1:C5');
      expect(result.parameters.format).toHaveProperty('numberFormat', '0.00%');
    });

    it('should parse "format D1:D10 as date"', () => {
      const result = parser.parse('format D1:D10 as date', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('D1:D10');
      expect(result.parameters.format).toHaveProperty('numberFormat', 'yyyy-mm-dd');
    });

    it('should parse "make E1:E5 bold"', () => {
      const result = parser.parse('make E1:E5 bold', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('E1:E5');
      expect(result.parameters.format).toHaveProperty('bold', true);
    });

    it('should parse "make F1:F5 italic"', () => {
      const result = parser.parse('make F1:F5 italic', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('F1:F5');
      expect(result.parameters.format).toHaveProperty('italic', true);
    });

    it('should parse "make G1:G5 red"', () => {
      const result = parser.parse('make G1:G5 red', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('G1:G5');
      expect(result.parameters.format).toHaveProperty('fontColor', '#FF0000');
    });

    it('should parse "apply bold format to H1:H5"', () => {
      const result = parser.parse('apply bold formatting to H1:H5', context);

      expect(result.intent).toBe('format_cells');
      expect(result.parameters.range).toBe('H1:H5');
      expect(result.parameters.format).toHaveProperty('bold', true);
    });
  });

  describe('Sort Commands', () => {
    it('should parse "sort A1:C10 by column A"', () => {
      const result = parser.parse('sort A1:C10 by column A', context);

      expect(result.intent).toBe('sort_data');
      expect(result.parameters.range).toBe('A1:C10');
      expect(result.parameters.options).toHaveProperty('column', 0);
      expect(result.parameters.options).toHaveProperty('ascending', true);
    });

    it('should parse "sort B1:D20 by B"', () => {
      const result = parser.parse('sort B1:D20 by B', context);

      expect(result.intent).toBe('sort_data');
      expect(result.parameters.range).toBe('B1:D20');
      expect(result.parameters.options).toHaveProperty('column', 1);
    });

    it('should parse "sort A1:C10 descending"', () => {
      const result = parser.parse('sort A1:C10 descending', context);

      expect(result.intent).toBe('sort_data');
      expect(result.parameters.range).toBe('A1:C10');
      expect(result.parameters.options).toHaveProperty('ascending', false);
    });

    it('should parse "sort A1:C10 ascending"', () => {
      const result = parser.parse('sort A1:C10 ascending', context);

      expect(result.intent).toBe('sort_data');
      expect(result.parameters.range).toBe('A1:C10');
      expect(result.parameters.options).toHaveProperty('ascending', true);
    });
  });

  describe('Filter Commands', () => {
    it('should parse "filter A1:C10 where status"', () => {
      const result = parser.parse('filter A1:C10 where status', context);

      expect(result.intent).toBe('filter_data');
      expect(result.parameters.range).toBe('A1:C10');
      expect(result.parameters.criteria).toBeDefined();
    });

    it('should parse "show only active in B1:D20"', () => {
      const result = parser.parse('show only active in B1:D20', context);

      expect(result.intent).toBe('filter_data');
      expect(result.parameters.range).toBe('B1:D20');
      expect(result.parameters.criteria).toBeDefined();
    });
  });

  describe('Chart Commands', () => {
    it('should parse "create line chart from A1:B10"', () => {
      const result = parser.parse('create line chart from A1:B10', context);

      expect(result.intent).toBe('create_chart');
      expect(result.parameters.type).toBe('line');
      expect(result.parameters.range).toBe('A1:B10');
    });

    it('should parse "create column chart from C1:D20"', () => {
      const result = parser.parse('create column chart from C1:D20', context);

      expect(result.intent).toBe('create_chart');
      expect(result.parameters.type).toBe('column');
      expect(result.parameters.range).toBe('C1:D20');
    });

    it('should parse "create pie chart from E1:F5"', () => {
      const result = parser.parse('create pie chart from E1:F5', context);

      expect(result.intent).toBe('create_chart');
      expect(result.parameters.type).toBe('pie');
      expect(result.parameters.range).toBe('E1:F5');
    });

    it('should parse "chart B1:C10 as bar"', () => {
      const result = parser.parse('chart B1:C10 as bar', context);

      expect(result.intent).toBe('create_chart');
      expect(result.parameters.range).toBe('B1:C10');
      expect(result.parameters.type).toBe('bar');
    });
  });

  describe('Analyze Commands', () => {
    it('should parse "analyze data in A1:C10"', () => {
      const result = parser.parse('analyze data in A1:C10', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.range).toBe('A1:C10');
    });

    it('should parse "analyze A1:B20"', () => {
      const result = parser.parse('analyze A1:B20', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.range).toBe('A1:B20');
    });

    it('should parse "get statistics for C1:D50"', () => {
      const result = parser.parse('get statistics for C1:D50', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.range).toBe('C1:D50');
    });

    it('should parse "show summary of E1:F100"', () => {
      const result = parser.parse('show summary of E1:F100', context);

      expect(result.intent).toBe('analyze_data');
      expect(result.parameters.range).toBe('E1:F100');
    });
  });

  describe('Row Operations', () => {
    it('should parse "insert row at 5"', () => {
      const result = parser.parse('insert row at 5', context);

      expect(result.intent).toBe('insert_row');
      expect(result.parameters.row).toBe(5);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should parse "add row before 10"', () => {
      const result = parser.parse('add row before 10', context);

      expect(result.intent).toBe('insert_row');
      expect(result.parameters.row).toBe(10);
    });

    it('should parse "delete row 7"', () => {
      const result = parser.parse('delete row 7', context);

      expect(result.intent).toBe('delete_row');
      expect(result.parameters.row).toBe(7);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should parse "remove row 15"', () => {
      const result = parser.parse('remove row 15', context);

      expect(result.intent).toBe('delete_row');
      expect(result.parameters.row).toBe(15);
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe('Column Operations', () => {
    it('should parse "insert column at A"', () => {
      const result = parser.parse('insert column at A', context);

      expect(result.intent).toBe('insert_column');
      expect(result.parameters.column).toBe(0);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should parse "add column before C"', () => {
      const result = parser.parse('add column before C', context);

      expect(result.intent).toBe('insert_column');
      expect(result.parameters.column).toBe(2);
    });

    it('should parse "delete column B"', () => {
      const result = parser.parse('delete column B', context);

      expect(result.intent).toBe('delete_column');
      expect(result.parameters.column).toBe(1);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should parse "remove column D"', () => {
      const result = parser.parse('remove column D', context);

      expect(result.intent).toBe('delete_column');
      expect(result.parameters.column).toBe(3);
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe('Find and Replace Commands', () => {
    it('should parse "find old replace with new in A1:C10"', () => {
      const result = parser.parse('find old replace with new in A1:C10', context);

      expect(result.intent).toBe('find_replace');
      expect(result.parameters.find).toBe('old');
      expect(result.parameters.replace).toBe('new');
      expect(result.parameters.range).toBe('A1:C10');
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should parse "replace test with demo in B1:D20"', () => {
      const result = parser.parse('replace test with demo in B1:D20', context);

      expect(result.intent).toBe('find_replace');
      expect(result.parameters.find).toBe('test');
      expect(result.parameters.replace).toBe('demo');
      expect(result.parameters.range).toBe('B1:D20');
    });
  });

  describe('Unknown Commands', () => {
    it('should return unknown intent for unrecognized commands', () => {
      const result = parser.parse('do something random', context);

      expect(result.intent).toBe('unknown');
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should return unknown intent for empty commands', () => {
      const result = parser.parse('', context);

      expect(result.intent).toBe('unknown');
    });

    it('should return unknown intent for gibberish', () => {
      const result = parser.parse('asdfghjkl qwerty', context);

      expect(result.intent).toBe('unknown');
    });
  });

  describe('Validation', () => {
    it('should validate read_cell command with valid cell', () => {
      const command = parser.parse('get value of A1', context);
      const validation = parser.validate(command);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject read_cell command with invalid cell', () => {
      const command = {
        intent: 'read_cell' as const,
        parameters: { cell: 'INVALID' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid cell reference: INVALID');
    });

    it('should reject read_cell command without cell parameter', () => {
      const command = {
        intent: 'read_cell' as const,
        parameters: {},
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Cell reference is required');
    });

    it('should validate write_cell command with value', () => {
      const command = parser.parse('set A1 to 100', context);
      const validation = parser.validate(command);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject write_cell command without value', () => {
      const command = {
        intent: 'write_cell' as const,
        parameters: { cell: 'A1' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Value is required for write operation');
    });

    it('should validate read_range command with valid range', () => {
      const command = parser.parse('get values of A1:B10', context);
      const validation = parser.validate(command);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject read_range command with invalid range', () => {
      const command = {
        intent: 'read_range' as const,
        parameters: { range: 'A1-B10' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid range reference: A1-B10');
    });

    it('should reject set_formula command without formula', () => {
      const command = {
        intent: 'set_formula' as const,
        parameters: { cell: 'A1' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Formula is required');
    });

    it('should reject write_range command without values', () => {
      const command = {
        intent: 'write_range' as const,
        parameters: { range: 'A1:B2' },
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Values are required for range write operation');
    });

    it('should reject unknown commands', () => {
      const command = {
        intent: 'unknown' as const,
        parameters: {},
        requiresConfirmation: false,
      };
      const validation = parser.validate(command);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Could not understand the command');
    });
  });

  describe('Command Suggestions', () => {
    it('should return all suggestions for empty input', () => {
      const suggestions = parser.getSuggestions('');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('command');
      expect(suggestions[0]).toHaveProperty('description');
      expect(suggestions[0]).toHaveProperty('example');
    });

    it('should filter suggestions by partial input', () => {
      const suggestions = parser.getSuggestions('set');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.command.toLowerCase().includes('set'))).toBe(true);
    });

    it('should filter suggestions by description', () => {
      const suggestions = parser.getSuggestions('formula');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => 
        s.description.toLowerCase().includes('formula') ||
        s.command.toLowerCase().includes('formula')
      )).toBe(true);
    });

    it('should filter suggestions by example', () => {
      const suggestions = parser.getSuggestions('A1');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.example.includes('A1'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const suggestions = parser.getSuggestions('xyzabc123notfound');

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Destructive Commands', () => {
    it('should mark delete_row as requiring confirmation', () => {
      const result = parser.parse('delete row 5', context);

      expect(result.requiresConfirmation).toBe(true);
    });

    it('should mark delete_column as requiring confirmation', () => {
      const result = parser.parse('delete column A', context);

      expect(result.requiresConfirmation).toBe(true);
    });

    it('should mark find_replace as requiring confirmation', () => {
      const result = parser.parse('replace old with new in A1:B10', context);

      expect(result.requiresConfirmation).toBe(true);
    });

    it('should not mark read operations as requiring confirmation', () => {
      const result = parser.parse('get value of A1', context);

      expect(result.requiresConfirmation).toBe(false);
    });

    it('should not mark write_cell as requiring confirmation', () => {
      const result = parser.parse('set A1 to 100', context);

      expect(result.requiresConfirmation).toBe(false);
    });
  });

  describe('Case Insensitivity', () => {
    it('should parse commands in lowercase', () => {
      const result = parser.parse('set a1 to 100', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('A1');
    });

    it('should parse commands in uppercase', () => {
      const result = parser.parse('SET A1 TO 100', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('A1');
    });

    it('should parse commands in mixed case', () => {
      const result = parser.parse('Set A1 To 100', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('A1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extra whitespace', () => {
      const result = parser.parse('  set   A1   to   100  ', context);

      expect(result.intent).toBe('write_cell');
      expect(result.parameters.cell).toBe('A1');
      expect(result.parameters.value).toBe(100);
    });

    it('should handle cell references with large numbers', () => {
      const result = parser.parse('get value of Z999', context);

      expect(result.intent).toBe('read_cell');
      expect(result.parameters.cell).toBe('Z999');
    });

    it('should handle multi-letter column references', () => {
      const result = parser.parse('get value of AA1', context);

      expect(result.intent).toBe('read_cell');
      expect(result.parameters.cell).toBe('AA1');
    });

    it('should handle large range references', () => {
      const result = parser.parse('get values of A1:ZZ1000', context);

      expect(result.intent).toBe('read_range');
      expect(result.parameters.range).toBe('A1:ZZ1000');
    });

    it('should handle negative numbers', () => {
      const result = parser.parse('set A1 to -42', context);

      expect(result.parameters.value).toBe(-42);
    });

    it('should handle decimal numbers', () => {
      const result = parser.parse('set A1 to 3.14159', context);

      expect(result.parameters.value).toBe(3.14159);
    });

    it('should handle column letter conversion for A', () => {
      const result = parser.parse('insert column at A', context);

      expect(result.parameters.column).toBe(0);
    });

    it('should handle column letter conversion for Z', () => {
      const result = parser.parse('insert column at Z', context);

      expect(result.parameters.column).toBe(25);
    });

    it('should handle column letter conversion for AA', () => {
      const result = parser.parse('insert column at AA', context);

      expect(result.parameters.column).toBe(26);
    });
  });
});
