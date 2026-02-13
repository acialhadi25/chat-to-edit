import type { AIAction, DataChange } from "@/types/excel";
import { validateExcelAction } from "./actionValidation";

export interface RecoveryStrategy {
  name: string;
  canRecover: (error: Error, action?: AIAction) => boolean;
  recover: (error: Error, action?: AIAction) => Promise<RecoveryResult>;
}

export interface RecoveryResult {
  success: boolean;
  recoveredAction?: AIAction;
  message?: string;
  fallbackType?: string;
}

/**
 * Error types that can occur during AI action processing
 */
export enum AIActionErrorType {
  INVALID_ACTION = "INVALID_ACTION",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_CELL_REFERENCE = "INVALID_CELL_REFERENCE",
  FORMULA_SYNTAX_ERROR = "FORMULA_SYNTAX_ERROR",
  UNSUPPORTED_ACTION = "UNSUPPORTED_ACTION",
  EXECUTION_FAILED = "EXECUTION_FAILED",
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Classify error type based on error message and action
 */
export function classifyAIError(error: Error, action?: AIAction): AIActionErrorType {
  const message = error.message.toLowerCase();

  if (message.includes("timeout") || message.includes("timed out")) {
    return AIActionErrorType.TIMEOUT;
  }

  if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
    return AIActionErrorType.NETWORK_ERROR;
  }

  if (message.includes("invalid action") || message.includes("validation failed")) {
    return AIActionErrorType.INVALID_ACTION;
  }

  if (message.includes("required") || message.includes("missing")) {
    return AIActionErrorType.MISSING_REQUIRED_FIELDS;
  }

  if (message.includes("cell reference") || message.includes("invalid cell")) {
    return AIActionErrorType.INVALID_CELL_REFERENCE;
  }

  if (message.includes("formula") || message.includes("syntax")) {
    return AIActionErrorType.FORMULA_SYNTAX_ERROR;
  }

  if (message.includes("unsupported") || message.includes("not supported")) {
    return AIActionErrorType.UNSUPPORTED_ACTION;
  }

  if (message.includes("execution") || message.includes("failed to apply")) {
    return AIActionErrorType.EXECUTION_FAILED;
  }

  return AIActionErrorType.UNKNOWN;
}

/**
 * Recovery strategy for invalid actions - converts to CLARIFY
 */
const invalidActionRecovery: RecoveryStrategy = {
  name: "InvalidActionRecovery",
  canRecover: (error, action) => {
    const errorType = classifyAIError(error, action);
    return errorType === AIActionErrorType.INVALID_ACTION ||
           errorType === AIActionErrorType.MISSING_REQUIRED_FIELDS ||
           errorType === AIActionErrorType.UNSUPPORTED_ACTION;
  },
  recover: async (error, action) => {
    return {
      success: true,
      recoveredAction: {
        type: "CLARIFY",
        status: "pending",
      } as AIAction,
      message: "The AI action was invalid. Please clarify your request.",
      fallbackType: "CLARIFY",
    };
  },
};

/**
 * Recovery strategy for formula errors - provides INFO response
 */
const formulaErrorRecovery: RecoveryStrategy = {
  name: "FormulaErrorRecovery",
  canRecover: (error, action) => {
    const errorType = classifyAIError(error, action);
    return errorType === AIActionErrorType.FORMULA_SYNTAX_ERROR;
  },
  recover: async (error, action) => {
    return {
      success: true,
      recoveredAction: {
        type: "INFO",
        status: "pending",
      } as AIAction,
      message: "There was an issue with the formula syntax. Please check your formula.",
      fallbackType: "INFO",
    };
  },
};

/**
 * Recovery strategy for network/timeout errors - suggests retry
 */
const networkErrorRecovery: RecoveryStrategy = {
  name: "NetworkErrorRecovery",
  canRecover: (error) => {
    const errorType = classifyAIError(error);
    return errorType === AIActionErrorType.NETWORK_ERROR ||
           errorType === AIActionErrorType.TIMEOUT;
  },
  recover: async (error) => {
    return {
      success: false,
      message: "Network error occurred. Please try again.",
      fallbackType: "RETRY",
    };
  },
};

/**
 * Recovery strategy for cell reference errors - attempts to fix references
 */
const cellReferenceRecovery: RecoveryStrategy = {
  name: "CellReferenceRecovery",
  canRecover: (error, action) => {
    const errorType = classifyAIError(error, action);
    return errorType === AIActionErrorType.INVALID_CELL_REFERENCE;
  },
  recover: async (error, action) => {
    if (!action?.changes) {
      return { success: false, message: "No changes to recover" };
    }

    // Try to fix invalid cell references
    const fixedChanges = action.changes.map((change: DataChange) => {
      // Ensure cellRef follows proper format (e.g., A1, B2)
      const cellRef = change.cellRef?.toUpperCase().replace(/[^A-Z0-9]/g, "");
      return {
        ...change,
        cellRef: cellRef || "A1",
      };
    });

    return {
      success: true,
      recoveredAction: {
        ...action,
        changes: fixedChanges,
        status: "pending",
      } as AIAction,
      message: "Fixed cell references and recovered action.",
    };
  },
};

// Default recovery strategies
const defaultStrategies: RecoveryStrategy[] = [
  invalidActionRecovery,
  formulaErrorRecovery,
  cellReferenceRecovery,
  networkErrorRecovery,
];

/**
 * Attempt to recover from an AI action error
 */
export async function attemptRecovery(
  error: Error,
  action?: AIAction,
  strategies: RecoveryStrategy[] = defaultStrategies
): Promise<RecoveryResult> {
  // Log error for monitoring
  console.error("AI Action Error:", {
    error: error.message,
    actionType: action?.type,
    errorType: classifyAIError(error, action),
    timestamp: new Date().toISOString(),
  });

  // Try each strategy
  for (const strategy of strategies) {
    if (strategy.canRecover(error, action)) {
      try {
        const result = await strategy.recover(error, action);
        if (result.success) {
          console.info(`Recovered using strategy: ${strategy.name}`);
          return result;
        }
        // Return result even if not successful (may contain fallbackType)
        return result;
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError);
      }
    }
  }

  // No recovery possible
  return {
    success: false,
    message: "Unable to recover from error. Please try a different request.",
  };
}

/**
 * Validate and sanitize AI action before execution
 */
export function sanitizeAIAction(action: AIAction): { valid: boolean; sanitized?: AIAction; errors?: string[] } {
  // Run validation
  const validation = validateExcelAction(action);

  if (validation.isValid) {
    // Sanitize the action
    const sanitized: AIAction = {
      ...action,
      status: "pending",
    };

    // Sanitize changes if present
    if (sanitized.changes) {
      sanitized.changes = sanitized.changes.map((change) => ({
        ...change,
        cellRef: change.cellRef?.toUpperCase(),
        before: change.before ?? null,
        after: change.after ?? null,
      }));
    }

    // Sanitize formula if present
    if (sanitized.formula) {
      sanitized.formula = sanitized.formula.trim();
    }

    return { valid: true, sanitized };
  }

  return { valid: false, errors: validation.errors };
}

/**
 * Create a safe fallback action when AI response fails
 */
export function createFallbackAction(errorType: AIActionErrorType): AIAction {
  switch (errorType) {
    case AIActionErrorType.INVALID_ACTION:
    case AIActionErrorType.MISSING_REQUIRED_FIELDS:
      return {
        type: "CLARIFY",
        status: "pending",
      } as AIAction;

    case AIActionErrorType.TIMEOUT:
    case AIActionErrorType.NETWORK_ERROR:
      return {
        type: "INFO",
        status: "pending",
      } as AIAction;

    default:
      return {
        type: "INFO",
        status: "pending",
      } as AIAction;
  }
}

/**
 * Monitor AI action quality and log metrics
 */
export function logAIQualityMetrics(
  action: AIAction,
  success: boolean,
  error?: Error,
  processingTime?: number
): void {
  const metrics = {
    actionType: action.type,
    success,
    errorType: error ? classifyAIError(error, action) : null,
    processingTime,
    timestamp: new Date().toISOString(),
  };

  // Log to console (can be sent to analytics service)
  console.info("AI Quality Metrics:", metrics);

  // Store in localStorage for debugging
  try {
    const history = JSON.parse(localStorage.getItem("aiQualityMetrics") || "[]");
    history.push(metrics);
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
    localStorage.setItem("aiQualityMetrics", JSON.stringify(history));
  } catch {
    // Ignore localStorage errors
  }
}
