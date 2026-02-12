/**
 * Validation schemas for AI actions
 * Ensures that AI responses contain valid action objects before applying them
 */

import { PDFActionType } from "@/types/pdf";
import type { AIAction as PDFAction } from "@/types/pdf";

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate PDF action object
 */
export function validatePDFAction(action: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!action || typeof action !== "object") {
    errors.push("Action must be an object");
    return { isValid: false, errors, warnings };
  }

  const a = action as Record<string, unknown>;

  // Check type field
  if (!a.type || typeof a.type !== "string") {
    errors.push("Action must have a 'type' field");
  } else {
    const validTypes: PDFActionType[] = [
      "EXTRACT_PAGES",
      "MERGE_FILES",
      "SPLIT_PDF",
      "DELETE_PAGES",
      "ROTATE_PAGES",
      "ADD_WATERMARK",
      "PDF_INFO",
      "CONVERT_TO_IMAGE",
      "CLARIFY",
      "INFO",
    ];

    if (!validTypes.includes(a.type as PDFActionType)) {
      errors.push(`Invalid action type: ${a.type}`);
    }
  }

  // Validate type-specific required fields
  const type = a.type as PDFActionType;

  switch (type) {
    case "EXTRACT_PAGES":
    case "DELETE_PAGES":
    case "ROTATE_PAGES":
      if (!Array.isArray(a.pages) || a.pages.length === 0) {
        errors.push(`${type} requires 'pages' array with at least one page`);
      }
      break;

    case "ROTATE_PAGES":
      if (a.rotation && ![0, 90, 180, 270].includes(a.rotation as number)) {
        errors.push("Rotation must be 0, 90, 180, or 270 degrees");
      }
      break;

    case "ADD_WATERMARK":
      if (!a.watermarkText || typeof a.watermarkText !== "string") {
        errors.push("ADD_WATERMARK requires 'watermarkText' field");
      }
      break;

    case "MERGE_FILES":
      if (
        (!Array.isArray(a.fileRefs) || a.fileRefs.length === 0) &&
        (!Array.isArray(a.pageRanges) || a.pageRanges.length === 0)
      ) {
        errors.push(
          "MERGE_FILES requires either 'fileRefs' or 'pageRanges' array"
        );
      }
      break;

    case "CONVERT_TO_IMAGE":
      if (a.outputFormat && !["png", "jpg"].includes(a.outputFormat as string)) {
        warnings.push(
          `Unknown output format: ${a.outputFormat}, defaulting to PNG`
        );
      }
      break;

    default:
      // INFO, CLARIFY, PDF_INFO don't require additional fields
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Excel action object
 */
export function validateExcelAction(action: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!action || typeof action !== "object") {
    errors.push("Action must be an object");
    return { isValid: false, errors, warnings };
  }

  const a = action as Record<string, unknown>;

  // Check type field
  if (!a.type || typeof a.type !== "string") {
    errors.push("Action must have a 'type' field");
  } else {
    const validTypes = [
      "INSERT_FORMULA",
      "EDIT_CELL",
      "EDIT_COLUMN",
      "FIND_REPLACE",
      "DATA_CLEANSING",
      "DATA_TRANSFORM",
      "ADD_COLUMN",
      "DELETE_COLUMN",
      "DELETE_ROW",
      "REMOVE_EMPTY_ROWS",
      "SORT_DATA",
      "FILTER_DATA",
      "REMOVE_DUPLICATES",
      "FILL_DOWN",
      "SPLIT_COLUMN",
      "MERGE_COLUMNS",
      "CLARIFY",
      "INFO",
    ];

    if (!validTypes.includes(a.type as string)) {
      errors.push(`Invalid action type: ${a.type}`);
    }
  }

  // Validate type-specific required fields
  const type = a.type as string;

  switch (type) {
    case "INSERT_FORMULA":
      if (!a.formula || typeof a.formula !== "string") {
        errors.push("INSERT_FORMULA requires 'formula' field");
      }
      break;

    case "FIND_REPLACE":
      if (!a.findValue || !a.replaceValue) {
        errors.push("FIND_REPLACE requires 'findValue' and 'replaceValue' fields");
      }
      break;

    case "DATA_TRANSFORM":
      if (
        !a.transformType ||
        !["uppercase", "lowercase", "titlecase"].includes(a.transformType as string)
      ) {
        errors.push(
          "DATA_TRANSFORM requires 'transformType' (uppercase, lowercase, or titlecase)"
        );
      }
      break;

    case "SORT_DATA":
      if (!a.sortColumn || !a.sortDirection) {
        errors.push("SORT_DATA requires 'sortColumn' and 'sortDirection' fields");
      }
      break;

    case "FILTER_DATA":
      if (!a.filterOperator || a.filterValue === undefined) {
        errors.push("FILTER_DATA requires 'filterOperator' and 'filterValue' fields");
      }
      break;

    case "ADD_COLUMN":
      if (!a.newColumnName || typeof a.newColumnName !== "string") {
        errors.push("ADD_COLUMN requires 'newColumnName' field");
      }
      break;

    default:
      // Other actions don't require specific fields
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Docs action object
 */
export function validateDocsAction(action: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!action || typeof action !== "object") {
    errors.push("Action must be an object");
    return { isValid: false, errors, warnings };
  }

  const a = action as Record<string, unknown>;

  // Check type field
  if (!a.type || typeof a.type !== "string") {
    errors.push("Action must have a 'type' field");
  } else {
    const validTypes = [
      "WRITE",
      "REWRITE",
      "GRAMMAR_CHECK",
      "SUMMARIZE",
      "TRANSLATE",
      "FORMAT",
      "EXPAND",
      "TONE_ADJUST",
      "TEMPLATE",
      "ANALYZE",
      "SECTION_MOVE",
      "SECTION_DELETE",
      "CLARIFY",
      "INFO",
    ];

    if (!validTypes.includes(a.type as string)) {
      errors.push(`Invalid action type: ${a.type}`);
    }
  }

  // Validate type-specific required fields
  const type = a.type as string;

  switch (type) {
    case "WRITE":
    case "REWRITE":
      if (!a.fullDocument || typeof a.fullDocument !== "string") {
        errors.push(`${type} requires 'fullDocument' field with content`);
      }
      break;

    case "TRANSLATE":
      if (!a.language || typeof a.language !== "string") {
        errors.push("TRANSLATE requires 'language' field");
      }
      break;

    case "TONE_ADJUST":
      if (
        !a.tone ||
        !["formal", "casual", "professional", "creative"].includes(a.tone as string)
      ) {
        errors.push(
          "TONE_ADJUST requires 'tone' (formal, casual, professional, or creative)"
        );
      }
      break;

    case "FORMAT":
      if (!a.format || !["list", "table", "heading", "paragraph"].includes(a.format as string)) {
        errors.push("FORMAT requires valid 'format' field");
      }
      break;

    case "EXPAND":
      if (a.expandLevel && ((a.expandLevel as number) < 1 || (a.expandLevel as number) > 3)) {
        warnings.push("expandLevel should be 1-3, defaulting to 2");
      }
      break;

    default:
      // Other actions don't require specific fields
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation result
 */
export function logValidationResult(
  result: ValidationResult,
  context: string
): void {
  if (!result.isValid) {
    console.error(`Validation failed for ${context}:`, {
      errors: result.errors,
      warnings: result.warnings,
    });
  } else if (result.warnings.length > 0) {
    console.warn(`Validation warnings for ${context}:`, {
      warnings: result.warnings,
    });
  }
}

/**
 * Get user-friendly error message from validation result
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.errors.length === 0) {
    return "";
  }

  if (result.errors.length === 1) {
    return result.errors[0];
  }

  return `Multiple validation errors: ${result.errors.join(", ")}`;
}
