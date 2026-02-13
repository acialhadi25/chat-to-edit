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

    case "FILTER_DATA": {
      // Validasi operator dan value
      const validFilterOperators = ["=", "!=", ">", "<", ">=", "<=", "contains", "not_contains", "empty", "not_empty"];
      if (!a.filterOperator || !validFilterOperators.includes(a.filterOperator as string)) {
        errors.push(`FILTER_DATA requires valid 'filterOperator' (${validFilterOperators.join(", ")})`);
      }
      // Validasi target kolom
      const target = a.target as Record<string, unknown>;
      if (!target || (target.type !== "column" && target.type !== "range")) {
        errors.push("FILTER_DATA requires 'target' with type 'column' or 'range'");
      }
      // Validasi value untuk operator yang membutuhkan nilai
      const needsValue = !["empty", "not_empty"].includes(a.filterOperator as string);
      if (needsValue && a.filterValue === undefined) {
        errors.push(`FILTER_DATA with operator '${a.filterOperator}' requires 'filterValue'`);
      }
      break;
    }

    case "ADD_COLUMN":
      if (!a.newColumnName || typeof a.newColumnName !== "string") {
        errors.push("ADD_COLUMN requires 'newColumnName' field");
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

    case "CONDITIONAL_FORMAT": {
      const condTarget = a.target as Record<string, unknown>;
      const condStyle = a.formatStyle as Record<string, unknown>;
      if (!condTarget || !a.conditionType || !condStyle) {
        errors.push("CONDITIONAL_FORMAT requires 'target', 'conditionType', and 'formatStyle' fields");
      } else {
        // Validasi conditionType
        const validConditions = [">", "<", ">=", "<=", "=", "!=", "contains", "not_contains", "between", "empty", "not_empty", "greater_than", "less_than", "equal_to", "not_equal"];
        if (!validConditions.includes(a.conditionType as string)) {
          errors.push(`Invalid conditionType: ${a.conditionType}`);
        }
        // Validasi conditionValues untuk operator yang membutuhkan nilai
        const needsConditionValue = !["empty", "not_empty"].includes(a.conditionType as string);
        if (needsConditionValue && (!Array.isArray(a.conditionValues) || a.conditionValues.length === 0)) {
          errors.push(`CONDITIONAL_FORMAT with '${a.conditionType}' requires 'conditionValues' array`);
        }
        // Validasi between membutuhkan 2 nilai
        if ((a.conditionType === "between" || a.conditionType === ">= <=") && (!Array.isArray(a.conditionValues) || a.conditionValues.length < 2)) {
          errors.push("CONDITIONAL_FORMAT 'between' requires 2 values in 'conditionValues'");
        }
        // Validasi formatStyle minimal punya satu property
        if (!condStyle.color && !condStyle.backgroundColor && !condStyle.fontWeight) {
          warnings.push("formatStyle should specify at least color, backgroundColor, or fontWeight");
        }
      }
      break;
    }

    case "CREATE_CHART":
      if (!a.chartType || a.xAxisColumn === undefined || !Array.isArray(a.yAxisColumns)) {
        errors.push("CREATE_CHART requires 'chartType', 'xAxisColumn', and 'yAxisColumns' fields");
      }
      break;

    case "COPY_COLUMN": {
      const copyTarget = a.target as Record<string, unknown>;
      if (!copyTarget || copyTarget.type !== "column") {
        errors.push("COPY_COLUMN requires 'target' with type 'column'");
      }
      if (!a.newColumnName || typeof a.newColumnName !== "string") {
        errors.push("COPY_COLUMN requires 'newColumnName' for the copied column");
      }
      break;
    }

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
