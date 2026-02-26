/**
 * Command Parser
 * 
 * Parser for natural language commands to Univer operations.
 * Extracts intent, parameters, and validates commands.
 * 
 * Requirements: 2.3.1 - 2.3.7
 * Documentation: docs/univer/features/mcp.md
 */

import type {
  AIContext,
  ParsedCommand,
  CommandIntent,
  CommandParameters,
  CommandSuggestion,
  ValidationResult,
} from '../types/ai.types';

/**
 * Command Parser for natural language processing
 * 
 * Parses user commands and maps them to spreadsheet operations:
 * - Intent recognition
 * - Parameter extraction
 * - Command validation
 * - Suggestion generation
 * - Context awareness
 * - Ambiguity handling
 */
export class CommandParser {
  private commandPatterns: Map<CommandIntent, RegExp[]>;
  private destructiveCommands: Set<CommandIntent>;
  private contextAwareCommands: Set<CommandIntent>;

  constructor() {
    this.commandPatterns = this.initializePatterns();
    this.destructiveCommands = new Set([
      'delete_row',
      'delete_column',
      'find_replace',
    ]);
    this.contextAwareCommands = new Set([
      'read_range',
      'write_range',
      'format_cells',
      'sort_data',
      'filter_data',
      'create_chart',
      'analyze_data',
    ]);
  }

  /**
   * Parse natural language command
   * 
   * @param command - Natural language command from user
   * @param context - Current AI context
   * @returns Parsed command with intent and parameters
   * 
   * @example
   * ```typescript
   * const parsed = parser.parse('Set A1 to 100', context);
   * // { intent: 'write_cell', parameters: { cell: 'A1', value: 100 }, ... }
   * ```
   */
  parse(command: string, context: AIContext): ParsedCommand {
    const normalizedCommand = command.trim().replace(/\s+/g, ' ').toLowerCase();

    // Try to match command patterns
    for (const [intent, patterns] of this.commandPatterns.entries()) {
      for (const pattern of patterns) {
        const match = normalizedCommand.match(pattern);
        if (match) {
          const parameters = this.extractParameters(intent, match, context, command);
          
          // Apply context awareness for commands that support it
          if (this.contextAwareCommands.has(intent) && context.currentSelection) {
            parameters.contextRange = context.currentSelection;
            
            // If no explicit range provided, use context
            if (!parameters.range && !parameters.cell) {
              parameters.range = context.currentSelection;
            }
          }
          
          return {
            intent,
            parameters,
            targetRange: parameters.range || parameters.cell,
            requiresConfirmation: this.destructiveCommands.has(intent),
          };
        }
      }
    }

    // No pattern matched - try to provide helpful suggestions
    const suggestions = this.findSimilarCommands(normalizedCommand);
    
    return {
      intent: 'unknown',
      parameters: { 
        originalCommand: command,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      },
      requiresConfirmation: false,
    };
  }

  /**
   * Validate parsed command
   * 
   * @param command - Parsed command to validate
   * @returns Validation result with errors and warnings
   */
  validate(command: ParsedCommand): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if intent is recognized
    if (command.intent === 'unknown') {
      errors.push('Could not understand the command');
      
      // Provide suggestions if available
      if (command.parameters.suggestions && Array.isArray(command.parameters.suggestions)) {
        const suggestionList = command.parameters.suggestions
          .slice(0, 3)
          .map(s => `"${s.example}"`)
          .join(', ');
        errors.push(`Did you mean: ${suggestionList}?`);
      } else {
        errors.push('Try rephrasing or use a command suggestion');
      }
      
      return { valid: false, errors, warnings };
    }

    // Validate parameters based on intent
    switch (command.intent) {
      case 'read_cell':
      case 'write_cell':
      case 'set_formula':
        if (!command.parameters.cell) {
          errors.push('Cell reference is required');
          if (command.parameters.contextRange) {
            warnings.push(`Using current selection: ${command.parameters.contextRange}`);
          }
        } else if (!this.isValidCellReference(command.parameters.cell)) {
          errors.push(`Invalid cell reference: ${command.parameters.cell}`);
          errors.push('Cell references should be in format like A1, B2, AA10');
        }
        break;

      case 'read_range':
      case 'write_range':
      case 'format_cells':
      case 'sort_data':
      case 'filter_data':
      case 'create_chart':
      case 'analyze_data':
        if (!command.parameters.range) {
          if (command.parameters.contextRange) {
            // Using context - this is valid but warn user
            warnings.push(`Using current selection: ${command.parameters.contextRange}`);
          } else {
            errors.push('Range reference is required');
            errors.push('Range references should be in format like A1:B10');
          }
        } else {
          // Check if range is valid
          if (!this.isValidRangeReference(command.parameters.range)) {
            errors.push(`Invalid range reference: ${command.parameters.range}`);
            errors.push('Range references should be in format like A1:B10, C5:D20');
          }
          // Warn if range came from context
          if (command.parameters.contextRange && command.parameters.range === command.parameters.contextRange) {
            warnings.push(`Using current selection: ${command.parameters.contextRange}`);
          }
        }
        break;
    }

    // Validate specific parameters
    if (command.intent === 'write_cell' && command.parameters.value === undefined) {
      errors.push('Value is required for write operation');
      errors.push('Example: "set A1 to 100" or "write hello to B2"');
    }

    if (command.intent === 'set_formula' && !command.parameters.formula) {
      errors.push('Formula is required');
      errors.push('Example: "calculate SUM(A1:A10) in A11"');
    }

    if (command.intent === 'write_range' && !command.parameters.values) {
      errors.push('Values are required for range write operation');
    }

    // Check for ambiguous commands
    if (this.isAmbiguous(command)) {
      warnings.push('This command may be ambiguous. Please be more specific.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get command suggestions based on partial input
   * 
   * @param partial - Partial command text
   * @returns Array of command suggestions
   */
  getSuggestions(partial: string): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [
      {
        command: 'Set [cell] to [value]',
        description: 'Set a cell value',
        example: 'Set A1 to 100',
      },
      {
        command: 'Get value of [cell]',
        description: 'Read a cell value',
        example: 'Get value of B2',
      },
      {
        command: 'Calculate [formula] in [cell]',
        description: 'Set a formula',
        example: 'Calculate sum of A1:A10 in A11',
      },
      {
        command: 'Format [range] as [format]',
        description: 'Apply formatting',
        example: 'Format B1:B10 as currency',
      },
      {
        command: 'Sort [range] by column [column]',
        description: 'Sort data',
        example: 'Sort A1:C10 by column A',
      },
      {
        command: 'Create [chart type] chart from [range]',
        description: 'Create a chart',
        example: 'Create line chart from A1:B10',
      },
      {
        command: 'Analyze data in [range]',
        description: 'Analyze data',
        example: 'Analyze data in A1:D100',
      },
    ];

    // Filter suggestions based on partial input
    if (partial.trim()) {
      const normalized = partial.toLowerCase();
      return suggestions.filter(s =>
        s.command.toLowerCase().includes(normalized) ||
        s.description.toLowerCase().includes(normalized) ||
        s.example.toLowerCase().includes(normalized)
      );
    }

    return suggestions;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Initialize command patterns
   * @private
   */
  private initializePatterns(): Map<CommandIntent, RegExp[]> {
    const patterns = new Map<CommandIntent, RegExp[]>();

    // Read range patterns (check before read cell)
    patterns.set('read_range', [
      /(?:get|read|show) (?:the )?(?:values? (?:of|in|from) )?([a-z]+\d+:[a-z]+\d+)/i,
      /([a-z]+\d+:[a-z]+\d+) values?/i,
    ]);

    // Read cell patterns
    patterns.set('read_cell', [
      /(?:get|read|show|what(?:'s| is)) (?:the )?(?:value (?:of|in|at) )?([a-z]+\d+)/i,
      /([a-z]+\d+) value/i,
    ]);

    // Write range patterns (check before write cell)
    patterns.set('write_range', [
      /write (?:data|values) to ([a-z]+\d+:[a-z]+\d+)/i,
      /fill ([a-z]+\d+:[a-z]+\d+) with (.+)/i,
    ]);

    // Write cell patterns
    patterns.set('write_cell', [
      /set ([a-z]+\d+) to (.+)/i,
      /write (.+?) (?:to|in|at) ([a-z]+\d+)/i,
      /put (.+?) in ([a-z]+\d+)/i,
    ]);

    // Formula patterns
    patterns.set('set_formula', [
      /(?:calculate|compute|set formula) (.+?) in ([a-z]+\d+)/i,
      /([a-z]+\d+) (?:=|equals) (.+)/i,
      /formula (.+?) in ([a-z]+\d+)/i,
    ]);

    // Format patterns
    patterns.set('format_cells', [
      /format ([a-z]+\d+(?::[a-z]+\d+)?) as (.+)/i,
      /apply (.+?) format(?:ting)? to ([a-z]+\d+(?::[a-z]+\d+)?)/i,
      /make ([a-z]+\d+(?::[a-z]+\d+)?) (.+)/i,
      /format (?:this|current|selected) as (.+)/i, // Context-aware
      /make (?:this|current|selected) (.+)/i, // Context-aware
    ]);

    // Sort patterns
    patterns.set('sort_data', [
      /sort ([a-z]+\d+:[a-z]+\d+) by (?:column )?([a-z]+)/i,
      /sort ([a-z]+\d+:[a-z]+\d+) (?:in )?(ascending|descending)/i,
      /sort (?:this|current|selected) by (?:column )?([a-z]+)/i, // Context-aware
      /sort (?:this|current|selected) (?:in )?(ascending|descending)/i, // Context-aware
    ]);

    // Filter patterns
    patterns.set('filter_data', [
      /filter ([a-z]+\d+:[a-z]+\d+) (?:where|by) (.+)/i,
      /show (?:only )?(.+?) in ([a-z]+\d+:[a-z]+\d+)/i,
      /filter (?:this|current|selected) (?:where|by) (.+)/i, // Context-aware
    ]);

    // Chart patterns
    patterns.set('create_chart', [
      /create (?:a )?(\w+?) chart (?:from|of|using) ([a-z]+\d+:[a-z]+\d+)/i,
      /chart ([a-z]+\d+:[a-z]+\d+) as (\w+)/i,
      /create (?:a )?(\w+?) chart/i, // Context-aware
    ]);

    // Analyze patterns
    patterns.set('analyze_data', [
      /analyze (?:data (?:in|from) )?([a-z]+\d+:[a-z]+\d+)/i,
      /(?:get|show) (?:statistics|summary) (?:of|for) ([a-z]+\d+:[a-z]+\d+)/i,
      /analyze (?:this|current|selected)/i, // Context-aware
      /(?:get|show) (?:statistics|summary)/i, // Context-aware
    ]);

    // Row/column operations
    patterns.set('insert_row', [
      /insert (?:a )?row (?:at|before) (?:row )?(\d+)/i,
      /add (?:a )?row (?:at|before) (?:row )?(\d+)/i,
      /insert (?:a )?row/i, // Context-aware
    ]);

    patterns.set('delete_row', [
      /delete row (\d+)/i,
      /remove row (\d+)/i,
      /delete (?:this|current|selected) row/i, // Context-aware
    ]);

    patterns.set('insert_column', [
      /insert (?:a )?column (?:at|before) (?:column )?([a-z]+)/i,
      /add (?:a )?column (?:at|before) (?:column )?([a-z]+)/i,
      /insert (?:a )?column/i, // Context-aware
    ]);

    patterns.set('delete_column', [
      /delete column ([a-z]+)/i,
      /remove column ([a-z]+)/i,
      /delete (?:this|current|selected) column/i, // Context-aware
    ]);

    // Find/replace patterns
    patterns.set('find_replace', [
      /(?:find|search for) (.+) (?:and )?replace (?:with|by) (.+) in ([a-z]+\d+:[a-z]+\d+)/i,
      /replace (.+) with (.+) in ([a-z]+\d+:[a-z]+\d+)/i,
    ]);

    // Comment patterns
    patterns.set('add_comment', [
      /(?:add|create) (?:a )?comment (?:to|on|at) ([a-z]+\d+) (?:saying|with|:) (.+)/i,
      /comment (?:on|at) ([a-z]+\d+): (.+)/i,
    ]);

    patterns.set('reply_comment', [
      /reply to comment ([a-z0-9-]+) (?:with|saying|:) (.+)/i,
      /add reply to ([a-z0-9-]+): (.+)/i,
    ]);

    patterns.set('resolve_comment', [
      /resolve comment ([a-z0-9-]+)/i,
      /mark comment ([a-z0-9-]+) as resolved/i,
    ]);

    patterns.set('delete_comment', [
      /delete comment ([a-z0-9-]+)/i,
      /remove comment ([a-z0-9-]+)/i,
    ]);

    patterns.set('get_comments', [
      /(?:get|show|list) (?:all )?comments/i,
      /what comments (?:are there|exist)/i,
    ]);

    return patterns;
  }

  /**
   * Extract parameters from regex match
   * @private
   */
  private extractParameters(
    intent: CommandIntent,
    match: RegExpMatchArray,
    _context: AIContext,
    originalCommand: string
  ): CommandParameters {
    const params: CommandParameters = {};

    switch (intent) {
      case 'read_cell':
        params.cell = this.normalizeCellReference(match[1]);
        break;

      case 'write_cell':
        // Handle both "set A1 to value" and "write value to A1" patterns
        // Check if first match is a cell reference
        if (/^[a-z]+\d+$/i.test(match[1])) {
          params.cell = this.normalizeCellReference(match[1]);
          params.value = this.parseValue(match[2]);
        } else {
          params.value = this.parseValue(match[1]);
          params.cell = this.normalizeCellReference(match[2]);
        }
        break;

      case 'read_range':
      case 'write_range':
      case 'analyze_data':
        if (match[1]) {
          params.range = this.normalizeRangeReference(match[1]);
        }
        // else: context-aware pattern, will use currentSelection
        break;

      case 'set_formula':
        // Check if first match is a cell reference (for "A1 = formula" pattern)
        if (/^[a-z]+\d+$/i.test(match[1])) {
          params.cell = this.normalizeCellReference(match[1]);
          params.formula = this.extractOriginalFormula(originalCommand, match[2]);
        } else {
          params.formula = this.extractOriginalFormula(originalCommand, match[1]);
          params.cell = this.normalizeCellReference(match[2]);
        }
        break;

      case 'format_cells':
        // Check if first match is a range/cell reference
        if (match[1] && /^[a-z]+\d+(?::[a-z]+\d+)?$/i.test(match[1])) {
          params.range = this.normalizeRangeReference(match[1]);
          params.format = this.parseFormat(match[2]);
        } else if (match[1]) {
          params.format = this.parseFormat(match[1]);
          if (match[2]) {
            params.range = this.normalizeRangeReference(match[2]);
          }
          // else: context-aware, will use currentSelection
        } else {
          // Context-aware pattern matched (no explicit range)
          // Will use context.currentSelection
        }
        break;

      case 'sort_data':
        if (match[1] && /^[a-z]+\d+:[a-z]+\d+$/i.test(match[1])) {
          params.range = this.normalizeRangeReference(match[1]);
          // Check if match[2] is a column letter or ascending/descending
          if (match[2] && /^[a-z]+$/i.test(match[2]) && match[2].toLowerCase() !== 'ascending' && match[2].toLowerCase() !== 'descending') {
            params.options = {
              column: this.columnLetterToNumber(match[2]),
              ascending: true,
            };
          } else {
            params.options = {
              column: 0,
              ascending: !match[2] || match[2].toLowerCase() !== 'descending',
            };
          }
        } else {
          // Context-aware pattern
          if (match[1] && /^[a-z]+$/i.test(match[1]) && match[1].toLowerCase() !== 'ascending' && match[1].toLowerCase() !== 'descending') {
            params.options = {
              column: this.columnLetterToNumber(match[1]),
              ascending: true,
            };
          } else {
            params.options = {
              column: 0,
              ascending: !match[1] || match[1].toLowerCase() !== 'descending',
            };
          }
        }
        break;

      case 'filter_data':
        // Check if first match is a range reference
        if (match[1] && /^[a-z]+\d+:[a-z]+\d+$/i.test(match[1])) {
          params.range = this.normalizeRangeReference(match[1]);
          params.criteria = this.parseFilterCriteria(match[2]);
        } else if (match[1]) {
          params.criteria = this.parseFilterCriteria(match[1]);
          if (match[2]) {
            params.range = this.normalizeRangeReference(match[2]);
          }
          // else: context-aware
        } else {
          // Context-aware pattern
        }
        break;

      case 'create_chart':
        // Check if first match is a range reference (for "chart A1:B10 as type" pattern)
        if (match[1] && /^[a-z]+\d+:[a-z]+\d+$/i.test(match[1])) {
          params.range = this.normalizeRangeReference(match[1]);
          params.type = match[2].toLowerCase();
        } else if (match[1]) {
          params.type = match[1].toLowerCase();
          if (match[2]) {
            params.range = this.normalizeRangeReference(match[2]);
          }
          // else: context-aware
        } else {
          // Context-aware pattern
        }
        break;

      case 'insert_row':
      case 'delete_row':
        if (match[1]) {
          params.row = parseInt(match[1], 10);
        }
        // else: context-aware, will need to determine from selection
        break;

      case 'insert_column':
      case 'delete_column':
        if (match[1]) {
          params.column = this.columnLetterToNumber(match[1]);
        }
        // else: context-aware, will need to determine from selection
        break;

      case 'find_replace':
        params.find = match[1];
        params.replace = match[2];
        params.range = this.normalizeRangeReference(match[3]);
        break;

      case 'add_comment':
        params.cell = this.normalizeCellReference(match[1]);
        params.content = match[2];
        break;

      case 'reply_comment':
        params.commentId = match[1];
        params.content = match[2];
        break;

      case 'resolve_comment':
      case 'delete_comment':
        params.commentId = match[1];
        break;

      case 'get_comments':
        // No parameters needed
        break;
    }

    return params;
  }

  /**
   * Extract original formula from command (preserving case)
   * @private
   */
  private extractOriginalFormula(originalCommand: string, lowercaseFormula: string): string {
    // Find the formula in the original command by looking for the pattern
    const formulaPattern = new RegExp(lowercaseFormula.replace(/[()]/g, '\\$&'), 'i');
    const match = originalCommand.match(formulaPattern);
    return match ? match[0] : lowercaseFormula;
  }

  /**
   * Validate cell reference format
   * @private
   */
  private isValidCellReference(ref: string): boolean {
    return /^[A-Z]+\d+$/.test(ref);
  }

  /**
   * Validate range reference format
   * @private
   */
  private isValidRangeReference(ref: string): boolean {
    return /^[A-Z]+\d+:[A-Z]+\d+$/.test(ref);
  }

  /**
   * Normalize cell reference to uppercase
   * @private
   */
  private normalizeCellReference(ref: string): string {
    return ref.toUpperCase();
  }

  /**
   * Normalize range reference to uppercase
   * @private
   */
  private normalizeRangeReference(ref: string): string {
    return ref.toUpperCase();
  }

  /**
   * Parse value from string
   * @private
   */
  private parseValue(value: string): any {
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }

  /**
   * Parse format specification
   * @private
   */
  private parseFormat(format: string): any {
    const normalized = format.toLowerCase();

    // Number formats
    if (normalized.includes('currency')) {
      return { numberFormat: '$#,##0.00' };
    }
    if (normalized.includes('percentage') || normalized.includes('percent')) {
      return { numberFormat: '0.00%' };
    }
    if (normalized.includes('date')) {
      return { numberFormat: 'yyyy-mm-dd' };
    }

    // Text formats
    if (normalized.includes('bold')) {
      return { bold: true };
    }
    if (normalized.includes('italic')) {
      return { italic: true };
    }

    // Colors
    if (normalized.includes('red')) {
      return { fontColor: '#FF0000' };
    }
    if (normalized.includes('blue')) {
      return { fontColor: '#0000FF' };
    }
    if (normalized.includes('green')) {
      return { fontColor: '#00FF00' };
    }

    return {};
  }

  /**
   * Parse filter criteria
   * @private
   */
  private parseFilterCriteria(criteria: string): any {
    // Simple criteria parsing
    // TODO: Implement more sophisticated parsing
    return {
      column: 0,
      operator: 'contains',
      value: criteria,
    };
  }

  /**
   * Convert column letter to number (A=0, B=1, etc.)
   * @private
   */
  private columnLetterToNumber(letter: string): number {
    const upperLetter = letter.toUpperCase();
    let result = 0;
    for (let i = 0; i < upperLetter.length; i++) {
      result = result * 26 + (upperLetter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result - 1;
  }

  /**
   * Find similar commands based on partial match
   * @private
   */
  private findSimilarCommands(normalizedCommand: string): CommandSuggestion[] {
    const suggestions = this.getSuggestions('');
    const keywords = normalizedCommand.split(' ');
    
    // Score each suggestion based on keyword matches
    const scored = suggestions.map(suggestion => {
      let score = 0;
      const suggestionText = `${suggestion.command} ${suggestion.description} ${suggestion.example}`.toLowerCase();
      
      for (const keyword of keywords) {
        if (suggestionText.includes(keyword)) {
          score += keyword.length;
        }
      }
      
      return { suggestion, score };
    });
    
    // Return top 3 suggestions with score > 0
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.suggestion);
  }

  /**
   * Check if command is ambiguous
   * @private
   */
  private isAmbiguous(command: ParsedCommand): boolean {
    // Check for ambiguous references without context
    if (command.intent === 'delete_row' || command.intent === 'delete_column') {
      // Deleting without explicit reference could be ambiguous
      if (!command.parameters.row && !command.parameters.column) {
        return true;
      }
    }
    
    // Check for ambiguous range operations
    if (this.contextAwareCommands.has(command.intent)) {
      // If using context but context might be unclear
      if (command.parameters.contextRange && !command.parameters.range) {
        return true;
      }
    }
    
    return false;
  }
}
