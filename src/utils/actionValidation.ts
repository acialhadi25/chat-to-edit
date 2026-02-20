/**
 * Validation schemas for AI actions
 * Ensures that AI responses contain valid action objects before applying them
 */

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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
      "EDIT_ROW",
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
      "RENAME_COLUMN",
      "EXTRACT_NUMBER",
      "FORMAT_NUMBER",
      "GENERATE_ID",
      "DATE_CALCULATION",
      "CONCATENATE",
      "STATISTICS",
      "PIVOT_SUMMARY",
      "DATA_VALIDATION",
      "TEXT_EXTRACTION",
      "CREATE_CHART",
      "CONDITIONAL_FORMAT",
      "DATA_AUDIT",
      "INSIGHTS",
      "CLARIFY",
      "INFO",
      "REMOVE_FORMULA",
      "COPY_COLUMN",
      "GENERATE_DATA",
      "ADD_COLUMN_WITH_DATA",
    ];

    if (!validTypes.includes(a.type as string)) {
      errors.push(`Invalid action type: ${a.type}`);
    }
  }

  // Validate type-specific required fields
  const type = a.type as string;

  switch (type) {
    case "INSERT_FORMULA":
      // Check in both root level and params
      const formula = a.formula || (a.params && (a.params as any).formula);
      if (!formula || typeof formula !== "string") {
        errors.push("INSERT_FORMULA requires 'formula' field");
      }
      break;

    case "FIND_REPLACE":
      if (!a.findValue || !a.replaceValue) {
        errors.push("FIND_REPLACE requires 'findValue' and 'replaceValue' fields");
      }
      break;

    case "DATA_TRANSFORM":
      // Check in both root level and params
      const transformType = a.transformType || (a.params && (a.params as any).transformType);
      if (
        !transformType ||
        !["uppercase", "lowercase", "titlecase"].includes(transformType as string)
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
      // Check in both root level and params
      const hasNewColumnName = a.newColumnName || (a.params && (a.params as any).newColumnName);
      if (!hasNewColumnName) {
        // More lenient - only warn if missing, allow to proceed
        warnings.push("ADD_COLUMN should have 'newColumnName' field");
      }
      break;

    case "DATA_VALIDATION":
      if (!a.validationType || (a.validationType === "list" && !Array.isArray(a.validationOptions))) {
        errors.push("DATA_VALIDATION requires 'validationType' and 'validationOptions' for list type");
      }
      break;

    case "TEXT_EXTRACTION":
      if (!a.extractionPattern) {
        errors.push("TEXT_EXTRACTION requires 'extractionPattern' field");
      }
      break;

    case "DATE_CALCULATION":
      if (!a.dateOperation) {
        errors.push("DATE_CALCULATION requires 'dateOperation' field");
      }
      break;

    case "PIVOT_SUMMARY":
      if (a.groupByColumn === undefined || a.aggregateColumn === undefined) {
        errors.push("PIVOT_SUMMARY requires 'groupByColumn' and 'aggregateColumn' fields");
      }
      break;

    case "CONDITIONAL_FORMAT":
      // Support both old format (conditionType, formatStyle) and new format (params.rules)
      const hasOldFormat = a.target && a.conditionType && a.formatStyle;
      const hasNewFormat = a.params && (a.params as any).rules && (a.params as any).target;
      
      if (!hasOldFormat && !hasNewFormat) {
        errors.push("CONDITIONAL_FORMAT requires either 'target', 'conditionType', 'formatStyle' OR 'params.rules' and 'params.target'");
      }
      break;

    case "CREATE_CHART":
      if (!a.chartType || a.xAxisColumn === undefined || !Array.isArray(a.yAxisColumns)) {
        errors.push("CREATE_CHART requires 'chartType', 'xAxisColumn', and 'yAxisColumns' fields");
      }
      break;

    case "GENERATE_DATA":
      // Check in both root level and params
      const hasTarget = a.target || (a.params && (a.params as any).target);
      const hasPatterns = a.patterns || (a.params && (a.params as any).patterns);
      if (!hasTarget && !hasPatterns) {
        // More lenient - only warn if BOTH are missing
        warnings.push("GENERATE_DATA should have 'target' and 'patterns' fields");
      }
      break;

    case "ADD_COLUMN_WITH_DATA":
      // Check in both root level and params
      const columns = a.columns || (a.params && (a.params as any).columns);
      if (!columns) {
        // More lenient - only warn if missing
        warnings.push("ADD_COLUMN_WITH_DATA should have 'columns' array field");
      } else if (!Array.isArray(columns)) {
        errors.push("ADD_COLUMN_WITH_DATA 'columns' must be an array");
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
