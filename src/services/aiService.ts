/**
 * AI Service
 * 
 * Service for AI integration with Univer Sheet.
 * Handles natural language commands, AI operations, and data analysis.
 * 
 * Requirements: 2.1, 2.2, 2.3
 * Documentation: docs/univer/features/mcp.md
 */

import type {
  AIConfig,
  AIContext,
  AIResponse,
  ParsedCommand,
  DataAnalysis,
  WorksheetMetadata,
  CellFormat,
  SortOptions,
  FilterCriteria,
  ChartType,
} from '../types/ai.types';
import type { FUniver } from '@univerjs/facade';
import { MCPService } from './mcpService';
import { CommandParser } from './commandParser';

/**
 * AI Service for Univer Sheet integration
 * 
 * Provides AI-powered operations for spreadsheet manipulation:
 * - Natural language command processing
 * - Read/write operations
 * - Data analysis
 * - Formatting and styling
 * - Advanced operations (sort, filter, charts)
 */
export class AIService {
  private config: AIConfig;
  private context: AIContext;
  private mcpService: MCPService | null = null;
  private commandParser: CommandParser;
  private univerAPI: FUniver | null = null;

  constructor(config: AIConfig) {
    this.config = config;
    this.context = {
      currentWorkbook: '',
      currentWorksheet: '',
      currentSelection: '',
      recentOperations: [],
      conversationHistory: [],
    };
    this.commandParser = new CommandParser();
  }

  /**
   * Initialize AI service
   * Sets up MCP connection if enabled
   */
  async initialize(univerAPI: FUniver): Promise<void> {
    this.univerAPI = univerAPI;

    if (this.config.mcpEnabled && this.config.mcpConfig) {
      this.mcpService = new MCPService(this.config.mcpConfig);
      await this.mcpService.connect();
    }
  }

  /**
   * Process natural language command
   * 
   * @param command - Natural language command from user
   * @param context - Current context (optional, uses stored context if not provided)
   * @returns AI response with operations to execute
   * 
   * @example
   * ```typescript
   * const response = await aiService.processCommand('Set A1 to 100');
   * if (response.success) {
   *   console.log('Command executed:', response.message);
   * }
   * ```
   */
  async processCommand(command: string, context?: Partial<AIContext>): Promise<AIResponse> {
    // Update context if provided
    if (context) {
      this.updateContext(context);
    }

    // Parse command
    const parsedCommand = this.commandParser.parse(command, this.context);

    // Validate command
    const validation = this.commandParser.validate(parsedCommand);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join(', '),
        operations: [],
        requiresConfirmation: false,
        error: validation.errors[0],
      };
    }

    // Execute command based on intent
    try {
      const result = await this.executeCommand(parsedCommand);
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to execute command',
        operations: [],
        requiresConfirmation: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute parsed command
   * @private
   */
  private async executeCommand(command: ParsedCommand): Promise<AIResponse> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const { intent, parameters } = command;

    switch (intent) {
      case 'read_cell':
        return await this.handleReadCell(parameters);
      case 'write_cell':
        return await this.handleWriteCell(parameters);
      case 'read_range':
        return await this.handleReadRange(parameters);
      case 'write_range':
        return await this.handleWriteRange(parameters);
      case 'set_formula':
        return await this.handleSetFormula(parameters);
      case 'format_cells':
        return await this.handleFormatCells(parameters);
      case 'sort_data':
        return await this.handleSortData(parameters);
      case 'filter_data':
        return await this.handleFilterData(parameters);
      case 'create_chart':
        return await this.handleCreateChart(parameters);
      case 'analyze_data':
        return await this.handleAnalyzeData(parameters);
      case 'find_replace':
        return await this.handleFindReplace(parameters);
      default:
        return {
          success: false,
          message: `Unknown command intent: ${intent}`,
          operations: [],
          requiresConfirmation: false,
          error: 'UNRECOGNIZED_COMMAND',
        };
    }
  }

  // ============================================================================
  // Read Operations (Requirements 2.1.1 - 2.1.6)
  // ============================================================================

  /**
   * Read cell value with metadata
   * Validates: Requirements 2.1.1, 2.1.3, 2.1.4
   * 
   * @param cell - Cell reference (e.g., 'A1')
   * @returns Cell data including value, formula, and formatting
   */
  async readCell(cell: string): Promise<{
    value: any;
    formula?: string;
    type: 'string' | 'number' | 'boolean' | 'null' | 'formula';
    formatting?: any;
  }> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const range = activeSheet.getRange(cell);
    const value = range.getValue();
    const formula = range.getFormula();
    
    // Determine type
    let type: 'string' | 'number' | 'boolean' | 'null' | 'formula' = 'null';
    if (formula) {
      type = 'formula';
    } else if (value === null || value === undefined) {
      type = 'null';
    } else if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else {
      type = 'string';
    }

    return {
      value,
      formula: formula || undefined,
      type,
      formatting: this.extractFormatting(range),
    };
  }

  /**
   * Extract formatting from range
   * @private
   */
  private extractFormatting(range: any): any {
    try {
      return {
        backgroundColor: range.getBackgroundColor?.() || undefined,
        fontColor: range.getFontColor?.() || undefined,
        fontSize: range.getFontSize?.() || undefined,
        fontWeight: range.getFontWeight?.() || undefined,
        fontStyle: range.getFontStyle?.() || undefined,
        numberFormat: range.getNumberFormat?.() || undefined,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Read range values with metadata
   * Validates: Requirements 2.1.2, 2.1.3, 2.1.4
   * 
   * @param range - Range reference (e.g., 'A1:B10')
   * @returns Range data including values, formulas, and formatting
   */
  async readRange(range: string): Promise<{
    values: any[][];
    formulas?: string[][];
    formatting?: any[][];
    range: string;
    rowCount: number;
    columnCount: number;
  }> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const rangeObj = activeSheet.getRange(range);
    const values = rangeObj.getValues();
    const formulas = rangeObj.getFormulas();
    
    return {
      values,
      formulas: formulas && formulas.length > 0 ? formulas : undefined,
      formatting: undefined, // TODO: Implement range formatting extraction
      range,
      rowCount: values.length,
      columnCount: values[0]?.length || 0,
    };
  }

  /**
   * Read worksheet metadata
   * Validates: Requirements 2.1.5
   * 
   * @returns Comprehensive worksheet metadata
   */
  async readWorksheet(): Promise<WorksheetMetadata> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const config = activeSheet.getSheetConfig();
    const dataRange = activeSheet.getDataRange();
    
    // Detect if worksheet has formulas
    let hasFormulas = false;
    let hasFormatting = false;
    const dataRanges: string[] = [];
    
    if (dataRange) {
      const formulas = dataRange.getFormulas();
      hasFormulas = formulas.some((row: any) => row.some((cell: any) => cell && cell.length > 0));
      dataRanges.push(dataRange.getA1Notation());
    }
    
    return {
      id: activeSheet.getSheetId(),
      name: activeSheet.getSheetName(),
      rowCount: config.rowCount || 0,
      columnCount: config.columnCount || 0,
      cellCount: (config.rowCount || 0) * (config.columnCount || 0),
      hasFormulas,
      hasFormatting,
      dataRanges,
    };
  }

  /**
   * Analyze data in range
   * Validates: Requirements 2.1.4, 2.4.4
   * 
   * @param range - Range reference to analyze
   * @returns Comprehensive data analysis including statistics, types, and patterns
   */
  async analyzeData(range: string): Promise<DataAnalysis> {
    const rangeData = await this.readRange(range);
    const values = rangeData.values;
    
    // Flatten all values for overall statistics
    const allValues = values.flat();
    const numericValues = allValues.filter(v => typeof v === 'number' && !isNaN(v));
    
    // Calculate summary statistics
    const summary: DataAnalysis['summary'] = {};
    
    if (numericValues.length > 0) {
      summary.count = numericValues.length;
      summary.sum = numericValues.reduce((a, b) => a + b, 0);
      summary.mean = summary.sum / summary.count;
      summary.min = Math.min(...numericValues);
      summary.max = Math.max(...numericValues);
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      summary.median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      
      // Calculate mode
      const frequency: { [key: number]: number } = {};
      let maxFreq = 0;
      let mode: number | undefined;
      
      numericValues.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1;
        if (frequency[val] > maxFreq) {
          maxFreq = frequency[val];
          mode = val;
        }
      });
      
      if (maxFreq > 1) {
        summary.mode = mode;
      }
    }

    // Detect data types per column
    const dataTypes: DataAnalysis['dataTypes'] = {};
    const columnCount = values[0]?.length || 0;
    
    for (let col = 0; col < columnCount; col++) {
      const columnValues = values.map(row => row[col]).filter(v => v !== null && v !== undefined);
      
      if (columnValues.length === 0) {
        dataTypes[`Column ${col + 1}`] = 'mixed';
        continue;
      }
      
      const types = new Set(columnValues.map(v => {
        if (typeof v === 'number') return 'number';
        if (typeof v === 'boolean') return 'boolean';
        if (v instanceof Date) return 'date';
        return 'string';
      }));
      
      if (types.size === 1) {
        dataTypes[`Column ${col + 1}`] = Array.from(types)[0] as any;
      } else {
        dataTypes[`Column ${col + 1}`] = 'mixed';
      }
    }

    // Detect patterns
    const patterns: string[] = [];
    
    // Check for empty cells
    const emptyCells = allValues.filter(v => v === null || v === undefined || v === '').length;
    if (emptyCells > 0) {
      patterns.push(`Contains ${emptyCells} empty cells`);
    }
    
    // Check for numeric patterns
    if (numericValues.length > 0) {
      const allPositive = numericValues.every(v => v > 0);
      const allNegative = numericValues.every(v => v < 0);
      
      if (allPositive) patterns.push('All numeric values are positive');
      if (allNegative) patterns.push('All numeric values are negative');
    }

    // Generate suggestions
    const suggestions: string[] = [];
    
    if (numericValues.length > 0) {
      suggestions.push('Consider using SUM, AVERAGE, or statistical formulas');
      
      if (columnCount > 1) {
        suggestions.push('Data suitable for chart visualization');
      }
    }
    
    if (values.length > 10) {
      suggestions.push('Consider using filters or sorting for better data management');
    }

    return {
      range,
      rowCount: values.length,
      columnCount,
      summary,
      dataTypes,
      patterns,
      suggestions,
    };
  }

  // ============================================================================
  // Write Operations (Requirements 2.2.1 - 2.2.7)
  // ============================================================================

  /**
   * Write cell value
   * Validates: Requirements 2.2.1
   */
  async writeCell(cell: string, value: any): Promise<void> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const range = activeSheet.getRange(cell);
    range.setValue(value);
  }

  /**
   * Write range values
   * Validates: Requirements 2.2.2
   */
  async writeRange(range: string, values: any[][]): Promise<void> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const rangeObj = activeSheet.getRange(range);
    rangeObj.setValues(values);
  }

  /**
   * Set formula
   * Validates: Requirements 2.2.3
   */
  async setFormula(cell: string, formula: string): Promise<void> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    // Ensure formula starts with =
    const normalizedFormula = formula.startsWith('=') ? formula : `=${formula}`;

    const range = activeSheet.getRange(cell);
    range.setFormula(normalizedFormula);
  }

  /**
   * Apply formatting
   * Validates: Requirements 2.2.4
   */
  async applyFormatting(range: string, format: CellFormat): Promise<void> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const rangeObj = activeSheet.getRange(range);

    // Apply formatting properties
    if (format.backgroundColor) {
      rangeObj.setBackgroundColor(format.backgroundColor);
    }
    if (format.fontColor) {
      rangeObj.setFontColor(format.fontColor);
    }
    if (format.fontSize) {
      rangeObj.setFontSize(format.fontSize);
    }
    if (format.bold !== undefined) {
      rangeObj.setFontWeight(format.bold ? 'bold' : 'normal');
    }
    if (format.italic !== undefined) {
      rangeObj.setFontStyle(format.italic ? 'italic' : 'normal');
    }
    if (format.numberFormat) {
      rangeObj.setNumberFormat(format.numberFormat);
    }
  }

  // ============================================================================
  // Advanced Operations
  // ============================================================================

  /**
   * Sort data
   * Validates: Requirements 4.2.1
   */
  async sortData(_range: string, _options: SortOptions): Promise<void> {
    // TODO: Implement sort operation
    throw new Error('Sort operation not yet implemented');
  }

  /**
   * Filter data
   * Validates: Requirements 4.2.2
   */
  async filterData(_range: string, _criteria: FilterCriteria): Promise<void> {
    // TODO: Implement filter operation
    throw new Error('Filter operation not yet implemented');
  }

  /**
   * Create chart
   * Validates: Requirements 4.1.1 - 4.1.5
   */
  async createChart(_range: string, _type: ChartType): Promise<string> {
    // TODO: Implement chart creation
    throw new Error('Chart creation not yet implemented');
  }
  /**
   * Find text in sheet or range
   * Validates: Requirements 4.2.3
   */
  async findText(
    searchText: string,
    range?: string,
    options?: { matchCase?: boolean; matchEntireCell?: boolean; matchFormula?: boolean }
  ): Promise<Array<{ cell: string; value: any; row: number; column: number }>> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    const textFinder = await this.univerAPI.createTextFinderAsync(searchText);

    // Apply options
    if (options?.matchCase) {
      await textFinder.matchCaseAsync(true);
    }
    if (options?.matchEntireCell) {
      await textFinder.matchEntireCellAsync(true);
    }
    if (options?.matchFormula) {
      await textFinder.matchFormulaTextAsync(true);
    }

    // Find all matches
    const matches = textFinder.findAll();

    // Convert to result format
    const results = matches.map(cell => ({
      cell: cell.getA1Notation(),
      value: cell.getValue(),
      row: cell.getRow(),
      column: cell.getColumn(),
    }));

    // Filter by range if specified
    if (range) {
      const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
      if (!activeSheet) {
        throw new Error('No active sheet');
      }

      const rangeObj = activeSheet.getRange(range);
      const rangeRow = rangeObj.getRow();
      const rangeCol = rangeObj.getColumn();
      const rangeHeight = rangeObj.getHeight();
      const rangeWidth = rangeObj.getWidth();

      return results.filter(result => {
        return result.row >= rangeRow &&
               result.row < rangeRow + rangeHeight &&
               result.column >= rangeCol &&
               result.column < rangeCol + rangeWidth;
      });
    }

    return results;
  }

  /**
   * Replace text in sheet or range
   * Validates: Requirements 4.2.3
   */
  async replaceText(
    searchText: string,
    replaceText: string,
    range?: string,
    options?: { matchCase?: boolean; matchEntireCell?: boolean }
  ): Promise<{ count: number; replacedCells: Array<{ cell: string; oldValue: any; newValue: any }> }> {
    if (!this.univerAPI) {
      throw new Error('Univer API not initialized');
    }

    // First find all matches
    const matches = await this.findText(searchText, range, options);

    if (matches.length === 0) {
      return { count: 0, replacedCells: [] };
    }

    const activeSheet = this.univerAPI.getActiveWorkbook()?.getActiveSheet();
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const replacedCells: Array<{ cell: string; oldValue: any; newValue: any }> = [];

    // Replace each match
    for (const match of matches) {
      const cellRange = activeSheet.getRange(match.cell);
      const oldValue = match.value;
      let newValue: string;

      if (options?.matchEntireCell) {
        newValue = replaceText;
      } else {
        // Replace all occurrences in the cell value
        const currentValue = String(oldValue);
        if (options?.matchCase) {
          newValue = currentValue.replace(new RegExp(this.escapeRegExp(searchText), 'g'), replaceText);
        } else {
          newValue = currentValue.replace(new RegExp(this.escapeRegExp(searchText), 'gi'), replaceText);
        }
      }

      cellRange.setValue(newValue);
      replacedCells.push({ cell: match.cell, oldValue, newValue });
    }

    return { count: replacedCells.length, replacedCells };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }


  // ============================================================================
  // Context Management
  // ============================================================================

  /**
   * Update AI context
   */
  updateContext(context: Partial<AIContext>): void {
    this.context = {
      ...this.context,
      ...context,
    };
  }

  /**
   * Get current context
   */
  getContext(): AIContext {
    return { ...this.context };
  }

  // ============================================================================
  // Command Handlers (Private)
  // ============================================================================

  private async handleReadCell(params: any): Promise<AIResponse> {
    const cellData = await this.readCell(params.cell);
    
    // Format response for AI consumption
    let message = `Cell ${params.cell}:`;
    message += `\n- Value: ${cellData.value}`;
    message += `\n- Type: ${cellData.type}`;
    
    if (cellData.formula) {
      message += `\n- Formula: ${cellData.formula}`;
    }
    
    if (cellData.formatting) {
      const formatting = Object.entries(cellData.formatting)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      if (formatting) {
        message += `\n- Formatting: ${formatting}`;
      }
    }
    
    return {
      success: true,
      message,
      operations: [],
      requiresConfirmation: false,
    };
  }

  private async handleReadRange(params: any): Promise<AIResponse> {
    const rangeData = await this.readRange(params.range);
    
    // Format response for AI consumption
    let message = `Range ${params.range}:`;
    message += `\n- Dimensions: ${rangeData.rowCount} rows × ${rangeData.columnCount} columns`;
    message += `\n- Total cells: ${rangeData.rowCount * rangeData.columnCount}`;
    
    // Show sample of data (first 3 rows)
    if (rangeData.values.length > 0) {
      message += `\n- Sample data (first ${Math.min(3, rangeData.values.length)} rows):`;
      rangeData.values.slice(0, 3).forEach((row, i) => {
        message += `\n  Row ${i + 1}: ${row.join(', ')}`;
      });
      
      if (rangeData.values.length > 3) {
        message += `\n  ... and ${rangeData.values.length - 3} more rows`;
      }
    }
    
    // Show formulas if present
    if (rangeData.formulas && rangeData.formulas.some(row => row.some(f => f))) {
      const formulaCount = rangeData.formulas.flat().filter(f => f).length;
      message += `\n- Contains ${formulaCount} formula(s)`;
    }
    
    return {
      success: true,
      message,
      operations: [],
      requiresConfirmation: false,
    };
  }

  private async handleWriteCell(params: any): Promise<AIResponse> {
    await this.writeCell(params.cell, params.value);
    return {
      success: true,
      message: `Set ${params.cell} to ${params.value}`,
      operations: [{
        type: 'set_value',
        target: params.cell,
        value: params.value,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleWriteRange(params: any): Promise<AIResponse> {
    await this.writeRange(params.range, params.values);
    return {
      success: true,
      message: `Wrote data to ${params.range}`,
      operations: [{
        type: 'set_value',
        target: params.range,
        value: params.values,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleSetFormula(params: any): Promise<AIResponse> {
    await this.setFormula(params.cell, params.formula);
    return {
      success: true,
      message: `Set formula in ${params.cell}`,
      operations: [{
        type: 'set_formula',
        target: params.cell,
        value: params.formula,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleFormatCells(params: any): Promise<AIResponse> {
    await this.applyFormatting(params.range, params.format);
    return {
      success: true,
      message: `Applied formatting to ${params.range}`,
      operations: [{
        type: 'set_style',
        target: params.range,
        value: params.format,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleSortData(params: any): Promise<AIResponse> {
    await this.sortData(params.range, params.options);
    return {
      success: true,
      message: `Sorted data in ${params.range}`,
      operations: [{
        type: 'sort',
        target: params.range,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleFilterData(params: any): Promise<AIResponse> {
    await this.filterData(params.range, params.criteria);
    return {
      success: true,
      message: `Filtered data in ${params.range}`,
      operations: [{
        type: 'filter',
        target: params.range,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleCreateChart(params: any): Promise<AIResponse> {
    const chartId = await this.createChart(params.range, params.type);
    return {
      success: true,
      message: `Created ${params.type} chart from ${params.range}`,
      operations: [{
        type: 'create_chart',
        target: params.range,
        value: chartId,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };
  }

  private async handleAnalyzeData(params: any): Promise<AIResponse> {
    const analysis = await this.analyzeData(params.range);
    
    // Format response for AI consumption
    let message = `Data Analysis for ${params.range}:`;
    message += `\n- Dimensions: ${analysis.rowCount} rows × ${analysis.columnCount} columns`;
    
    // Summary statistics
    if (Object.keys(analysis.summary).length > 0) {
      message += `\n\nStatistics:`;
      if (analysis.summary.count) message += `\n- Count: ${analysis.summary.count}`;
      if (analysis.summary.sum !== undefined) message += `\n- Sum: ${analysis.summary.sum}`;
      if (analysis.summary.mean !== undefined) message += `\n- Mean: ${analysis.summary.mean.toFixed(2)}`;
      if (analysis.summary.median !== undefined) message += `\n- Median: ${analysis.summary.median}`;
      if (analysis.summary.mode !== undefined) message += `\n- Mode: ${analysis.summary.mode}`;
      if (analysis.summary.min !== undefined) message += `\n- Min: ${analysis.summary.min}`;
      if (analysis.summary.max !== undefined) message += `\n- Max: ${analysis.summary.max}`;
    }
    
    // Data types
    if (Object.keys(analysis.dataTypes).length > 0) {
      message += `\n\nData Types:`;
      Object.entries(analysis.dataTypes).forEach(([col, type]) => {
        message += `\n- ${col}: ${type}`;
      });
    }
    
    // Patterns
    if (analysis.patterns && analysis.patterns.length > 0) {
      message += `\n\nPatterns:`;
      analysis.patterns.forEach(pattern => {
        message += `\n- ${pattern}`;
      });
    }
    
    // Suggestions
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      message += `\n\nSuggestions:`;
      analysis.suggestions.forEach(suggestion => {
        message += `\n- ${suggestion}`;
      });
    }
    
    return {
      success: true,
      message,
      operations: [],
      requiresConfirmation: false,
    };
  }
  private async handleFindReplace(params: any): Promise<AIResponse> {
    const result = await this.replaceText(
      params.find,
      params.replace,
      params.range,
      {
        matchCase: params.matchCase,
        matchEntireCell: params.matchEntireCell
      }
    );

    return {
      success: true,
      message: `Replaced ${result.count} occurrence(s) of "${params.find}" with "${params.replace}" in ${params.range}`,
      operations: result.replacedCells.map(cell => ({
        type: 'set_value' as const,
        target: cell.cell,
        oldValue: cell.oldValue,
        value: cell.newValue,
        timestamp: new Date(),
      })),
      requiresConfirmation: true,
    };
  }


  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.mcpService) {
      await this.mcpService.disconnect();
    }
  }
}
