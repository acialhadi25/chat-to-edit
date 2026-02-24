/**
 * AI Service Type Definitions
 * 
 * Type definitions for AI integration with Univer Sheet.
 * Supports natural language commands, MCP protocol, and AI operations.
 */

import type { IWorkbookData, IRange } from '@univerjs/core';

// ============================================================================
// AI Configuration
// ============================================================================

export interface AIConfig {
  apiKey: string;
  model: 'gpt-4' | 'claude-3' | string;
  mcpEnabled: boolean;
  mcpConfig?: MCPConfig;
}

export interface MCPConfig {
  sessionId: string;
  ticketServerUrl: string;
  mcpServerUrl: string;
  apiKey: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// ============================================================================
// AI Context
// ============================================================================

export interface AIContext {
  currentWorkbook: string;
  currentWorksheet: string;
  currentSelection: string;
  recentOperations: Operation[];
  conversationHistory: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// ============================================================================
// AI Commands
// ============================================================================

export type CommandIntent =
  | 'read_cell'
  | 'write_cell'
  | 'read_range'
  | 'write_range'
  | 'set_formula'
  | 'format_cells'
  | 'sort_data'
  | 'filter_data'
  | 'create_chart'
  | 'find_replace'
  | 'insert_row'
  | 'delete_row'
  | 'insert_column'
  | 'delete_column'
  | 'analyze_data'
  | 'unknown';

export interface ParsedCommand {
  intent: CommandIntent;
  parameters: CommandParameters;
  targetRange?: string;
  requiresConfirmation: boolean;
}

export interface CommandParameters {
  [key: string]: any;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  example: string;
}

// ============================================================================
// AI Operations
// ============================================================================

export type OperationType =
  | 'set_value'
  | 'set_formula'
  | 'set_style'
  | 'insert_row'
  | 'delete_row'
  | 'insert_column'
  | 'delete_column'
  | 'sort'
  | 'filter'
  | 'create_chart';

export interface Operation {
  type: OperationType;
  target: string; // cell/range reference
  value?: any;
  oldValue?: any;
  timestamp: Date;
}

// ============================================================================
// AI Responses
// ============================================================================

export interface AIResponse {
  success: boolean;
  message: string;
  operations: Operation[];
  requiresConfirmation: boolean;
  error?: string;
}

export interface AICommandResult {
  commandId: string;
  success: boolean;
  operations: Operation[];
  message: string;
  error?: string;
  executionTime: number;
}

// ============================================================================
// Data Analysis
// ============================================================================

export interface DataAnalysis {
  range: string;
  rowCount: number;
  columnCount: number;
  summary: {
    mean?: number;
    median?: number;
    mode?: number;
    min?: number;
    max?: number;
    sum?: number;
    count?: number;
  };
  dataTypes: {
    [column: string]: 'number' | 'string' | 'boolean' | 'date' | 'mixed';
  };
  patterns?: string[];
  suggestions?: string[];
}

// ============================================================================
// Worksheet Metadata
// ============================================================================

export interface WorksheetMetadata {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  cellCount: number;
  hasFormulas: boolean;
  hasFormatting: boolean;
  dataRanges: string[];
}

// ============================================================================
// Cell Formatting
// ============================================================================

export interface CellFormat {
  backgroundColor?: string;
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  numberFormat?: string;
  borders?: BorderFormat;
}

export interface BorderFormat {
  top?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
  right?: BorderStyle;
}

export interface BorderStyle {
  style: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted';
  color: string;
}

// ============================================================================
// Sort & Filter
// ============================================================================

export interface SortOptions {
  column: number;
  ascending: boolean;
  caseSensitive?: boolean;
}

export interface FilterCriteria {
  column: number;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

// ============================================================================
// Chart Types
// ============================================================================

export type ChartType = 'line' | 'column' | 'bar' | 'pie' | 'area' | 'scatter';

export interface ChartConfig {
  type: ChartType;
  dataRange: string;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// MCP Tools
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  category: 'read' | 'write' | 'format' | 'analyze';
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

// ============================================================================
// Error Handling
// ============================================================================

export enum ErrorCode {
  // User input errors (4xx)
  INVALID_CELL_REFERENCE = 'INVALID_CELL_REFERENCE',
  INVALID_FORMULA = 'INVALID_FORMULA',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  
  // AI errors (5xx)
  UNRECOGNIZED_COMMAND = 'UNRECOGNIZED_COMMAND',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  AMBIGUOUS_COMMAND = 'AMBIGUOUS_COMMAND',
  
  // System errors (6xx)
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  MEMORY_ERROR = 'MEMORY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Permission errors (7xx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  READ_ONLY_VIOLATION = 'READ_ONLY_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    recoverable: boolean;
    suggestedAction?: string;
  };
}
