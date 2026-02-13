/**
 * Type Guards for Runtime Validation
 * 
 * Provides runtime type checking for ExcelData, API responses, and action types.
 * These guards ensure data integrity when receiving data from external sources
 * (API responses, file parsing, user input).
 * 
 * **Validates: Requirements 5.1.4**
 */

import type {
  ExcelData,
  SheetData,
  AIAction,
  AIResponse,
  ActionType,
  CellTarget,
  DataChange,
  QuickOption,
  ChatMessage,
} from "@/types/excel";

// ============================================================================
// Primitive Type Guards
// ============================================================================

/**
 * Check if value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Check if value is a valid cell value (string, number, or null)
 */
function isCellValue(value: unknown): value is string | number | null {
  return value === null || isString(value) || isNumber(value);
}

// ============================================================================
// ActionType Discriminated Union Guards
// ============================================================================

const VALID_ACTION_TYPES: readonly ActionType[] = [
  "INSERT_FORMULA",
  "REMOVE_FORMULA",
  "EDIT_CELL",
  "EDIT_COLUMN",
  "EDIT_ROW",
  "FIND_REPLACE",
  "DATA_CLEANSING",
  "DATA_TRANSFORM",
  "ADD_COLUMN",
  "DELETE_COLUMN",
  "DELETE_ROW",
  "SORT_DATA",
  "FILTER_DATA",
  "REMOVE_DUPLICATES",
  "FILL_DOWN",
  "SPLIT_COLUMN",
  "MERGE_COLUMNS",
  "CLARIFY",
  "INFO",
  "REMOVE_EMPTY_ROWS",
  "RENAME_COLUMN",
  "FORMAT_NUMBER",
  "EXTRACT_NUMBER",
  "CONDITIONAL_FORMAT",
  "GENERATE_ID",
  "DATE_CALCULATION",
  "CONCATENATE",
  "STATISTICS",
  "PIVOT_SUMMARY",
  "DATA_VALIDATION",
  "TEXT_EXTRACTION",
  "CREATE_CHART",
  "DATA_AUDIT",
  "INSIGHTS",
  "COPY_COLUMN",
] as const;

/**
 * Type guard for ActionType discriminated union
 */
export function isActionType(value: unknown): value is ActionType {
  return isString(value) && VALID_ACTION_TYPES.includes(value as ActionType);
}

// ============================================================================
// CellTarget Type Guard
// ============================================================================

/**
 * Type guard for CellTarget
 */
export function isCellTarget(value: unknown): value is CellTarget {
  if (!isObject(value)) return false;

  const { type, ref } = value;

  // Validate type field
  if (!isString(type)) return false;
  if (!["cell", "range", "column", "row"].includes(type)) return false;

  // Validate ref field
  if (!isString(ref)) return false;

  return true;
}

// ============================================================================
// DataChange Type Guard
// ============================================================================

/**
 * Type guard for DataChange
 */
export function isDataChange(value: unknown): value is DataChange {
  if (!isObject(value)) return false;

  const { cellRef, before, after, type } = value;

  // Validate cellRef
  if (!isString(cellRef)) return false;

  // Validate before and after (must be cell values)
  if (!isCellValue(before)) return false;
  if (!isCellValue(after)) return false;

  // Validate type
  if (!isString(type)) return false;
  if (!["value", "formula"].includes(type)) return false;

  return true;
}

/**
 * Type guard for array of DataChange
 */
export function isDataChangeArray(value: unknown): value is DataChange[] {
  return Array.isArray(value) && value.every(isDataChange);
}

// ============================================================================
// QuickOption Type Guard
// ============================================================================

/**
 * Type guard for QuickOption
 */
export function isQuickOption(value: unknown): value is QuickOption {
  if (!isObject(value)) return false;

  const { id, label, value: optionValue, variant } = value;

  // Validate required fields
  if (!isString(id)) return false;
  if (!isString(label)) return false;
  if (!isString(optionValue)) return false;
  if (!isString(variant)) return false;

  // Validate variant enum
  const validVariants = ["default", "success", "destructive", "outline"];
  if (!validVariants.includes(variant)) return false;

  // Optional fields
  if ("icon" in value && value.icon !== undefined && !isString(value.icon)) {
    return false;
  }

  if (
    "isApplyAction" in value &&
    value.isApplyAction !== undefined &&
    typeof value.isApplyAction !== "boolean"
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for array of QuickOption
 */
export function isQuickOptionArray(value: unknown): value is QuickOption[] {
  return Array.isArray(value) && value.every(isQuickOption);
}

// ============================================================================
// AIAction Type Guard
// ============================================================================

/**
 * Type guard for AIAction
 * Validates the discriminated union based on action type
 */
export function isAIAction(value: unknown): value is AIAction {
  if (!isObject(value)) return false;

  const { type, status } = value;

  // Validate required type field
  if (!isActionType(type)) return false;

  // Validate required status field
  if (!isString(status)) return false;
  if (!["pending", "applied", "rejected"].includes(status)) return false;

  // Validate optional fields based on their presence
  if ("target" in value && value.target !== undefined) {
    if (!isCellTarget(value.target)) return false;
  }

  if ("changes" in value && value.changes !== undefined) {
    if (!isDataChangeArray(value.changes)) return false;
  }

  if ("formula" in value && value.formula !== undefined) {
    if (!isString(value.formula)) return false;
  }

  if ("newColumnName" in value && value.newColumnName !== undefined) {
    if (!isString(value.newColumnName)) return false;
  }

  if ("findValue" in value && value.findValue !== undefined) {
    if (!isString(value.findValue)) return false;
  }

  if ("replaceValue" in value && value.replaceValue !== undefined) {
    if (!isString(value.replaceValue)) return false;
  }

  if ("targetColumns" in value && value.targetColumns !== undefined) {
    if (!Array.isArray(value.targetColumns)) return false;
    if (!value.targetColumns.every(isNumber)) return false;
  }

  if ("sortColumn" in value && value.sortColumn !== undefined) {
    if (!isString(value.sortColumn)) return false;
  }

  if ("sortDirection" in value && value.sortDirection !== undefined) {
    if (!isString(value.sortDirection)) return false;
    if (!["asc", "desc"].includes(value.sortDirection)) return false;
  }

  // Additional validation for specific action types can be added here
  // For now, we validate the common fields

  return true;
}

// ============================================================================
// SheetData Type Guard
// ============================================================================

/**
 * Type guard for SheetData
 */
export function isSheetData(value: unknown): value is SheetData {
  if (!isObject(value)) return false;

  const { headers, rows } = value;

  // Validate headers
  if (!Array.isArray(headers)) return false;
  if (!headers.every(isString)) return false;

  // Validate rows
  if (!Array.isArray(rows)) return false;
  if (!rows.every((row) => Array.isArray(row) && row.every(isCellValue))) {
    return false;
  }

  return true;
}

// ============================================================================
// ExcelData Type Guard
// ============================================================================

/**
 * Type guard for ExcelData
 * Validates the complete Excel data structure
 */
export function isExcelData(value: unknown): value is ExcelData {
  if (!isObject(value)) return false;

  const {
    fileName,
    sheets,
    currentSheet,
    headers,
    rows,
    formulas,
    selectedCells,
    pendingChanges,
    cellStyles,
  } = value;

  // Validate required fields
  if (!isString(fileName)) return false;

  if (!Array.isArray(sheets)) return false;
  if (!sheets.every(isString)) return false;

  if (!isString(currentSheet)) return false;

  if (!Array.isArray(headers)) return false;
  if (!headers.every(isString)) return false;

  if (!Array.isArray(rows)) return false;
  if (!rows.every((row) => Array.isArray(row) && row.every(isCellValue))) {
    return false;
  }

  if (!isObject(formulas)) return false;
  // Validate formulas object has string keys and string values
  for (const [key, val] of Object.entries(formulas)) {
    if (!isString(key) || !isString(val)) return false;
  }

  if (!Array.isArray(selectedCells)) return false;
  if (!selectedCells.every(isString)) return false;

  if (!Array.isArray(pendingChanges)) return false;
  if (!pendingChanges.every(isDataChange)) return false;

  if (!isObject(cellStyles)) return false;

  // Validate optional fields
  if ("isSelecting" in value && value.isSelecting !== undefined) {
    if (typeof value.isSelecting !== "boolean") return false;
  }

  if ("allSheets" in value && value.allSheets !== undefined) {
    if (!isObject(value.allSheets)) return false;
    for (const [key, val] of Object.entries(value.allSheets)) {
      if (!isString(key) || !isSheetData(val)) return false;
    }
  }

  if ("validationRules" in value && value.validationRules !== undefined) {
    if (!isObject(value.validationRules)) return false;
  }

  return true;
}

// ============================================================================
// AIResponse Type Guard
// ============================================================================

/**
 * Type guard for AIResponse from API
 */
export function isAIResponse(value: unknown): value is AIResponse {
  if (!isObject(value)) return false;

  const { content } = value;

  // Content is required
  if (!isString(content)) return false;

  // Validate optional action field
  if ("action" in value && value.action !== undefined) {
    // Action can be a partial AIAction from API, so we check basic structure
    if (!isObject(value.action)) return false;
    if ("type" in value.action && !isActionType(value.action.type)) {
      return false;
    }
  }

  // Validate optional quickOptions field
  if ("quickOptions" in value && value.quickOptions !== undefined) {
    if (!isQuickOptionArray(value.quickOptions)) return false;
  }

  return true;
}

// ============================================================================
// ChatMessage Type Guard
// ============================================================================

/**
 * Type guard for ChatMessage
 */
export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isObject(value)) return false;

  const { id, role, content, timestamp } = value;

  // Validate required fields
  if (!isString(id)) return false;

  if (!isString(role)) return false;
  if (!["user", "assistant"].includes(role)) return false;

  if (!isString(content)) return false;

  if (!(timestamp instanceof Date)) {
    // Try to parse as date string
    if (!isString(timestamp) && !isNumber(timestamp)) return false;
  }

  // Validate optional fields
  if ("action" in value && value.action !== undefined) {
    if (!isAIAction(value.action)) return false;
  }

  if ("quickOptions" in value && value.quickOptions !== undefined) {
    if (!isQuickOptionArray(value.quickOptions)) return false;
  }

  return true;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate and sanitize ExcelData from untrusted source
 * Returns validated data or throws error with details
 */
export function validateExcelData(data: unknown): ExcelData {
  if (!isExcelData(data)) {
    throw new Error(
      "Invalid ExcelData structure: missing or invalid required fields"
    );
  }
  return data;
}

/**
 * Validate and sanitize AIResponse from API
 * Returns validated response or throws error with details
 */
export function validateAIResponse(data: unknown): AIResponse {
  if (!isAIResponse(data)) {
    throw new Error(
      "Invalid AIResponse structure: missing or invalid required fields"
    );
  }
  return data;
}

/**
 * Safely parse and validate API response
 * Returns validated data or null if invalid
 */
export function safeValidateAIResponse(data: unknown): AIResponse | null {
  try {
    return validateAIResponse(data);
  } catch {
    return null;
  }
}

/**
 * Safely parse and validate ExcelData
 * Returns validated data or null if invalid
 */
export function safeValidateExcelData(data: unknown): ExcelData | null {
  try {
    return validateExcelData(data);
  } catch {
    return null;
  }
}

/**
 * Type guard for checking if a value is a valid Excel cell reference
 * Examples: A1, B10, AA100
 */
export function isCellReference(value: unknown): value is string {
  if (!isString(value)) return false;
  return /^[A-Z]+\d+$/.test(value);
}

/**
 * Type guard for checking if a value is a valid column reference
 * Examples: A, B, AA, ZZ
 */
export function isColumnReference(value: unknown): value is string {
  if (!isString(value)) return false;
  return /^[A-Z]+$/.test(value);
}

/**
 * Type guard for checking if a value is a valid row reference
 * Examples: 1, 10, 100
 */
export function isRowReference(value: unknown): value is string {
  if (!isString(value)) return false;
  return /^\d+$/.test(value);
}

/**
 * Type guard for checking if a value is a valid range reference
 * Examples: A1:B10, C5:D20
 */
export function isRangeReference(value: unknown): value is string {
  if (!isString(value)) return false;
  return /^[A-Z]+\d+:[A-Z]+\d+$/.test(value);
}
