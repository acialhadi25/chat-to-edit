import { describe, it, expect, vi } from "vitest";
import {
  classifyAIError,
  attemptRecovery,
  sanitizeAIAction,
  createFallbackAction,
  logAIQualityMetrics,
  AIActionErrorType,
} from "./aiErrorRecovery";
import type { AIAction } from "@/types/excel";

describe("aiErrorRecovery", () => {
  describe("classifyAIError", () => {
    it("should classify timeout errors", () => {
      const error = new Error("Request timeout");
      expect(classifyAIError(error)).toBe(AIActionErrorType.TIMEOUT);
    });

    it("should classify network errors", () => {
      const error = new Error("Network connection failed");
      expect(classifyAIError(error)).toBe(AIActionErrorType.NETWORK_ERROR);
    });

    it("should classify invalid action errors", () => {
      const error = new Error("Invalid action validation failed");
      expect(classifyAIError(error)).toBe(AIActionErrorType.INVALID_ACTION);
    });

    it("should classify missing fields errors", () => {
      const error = new Error("Missing required field");
      expect(classifyAIError(error)).toBe(AIActionErrorType.MISSING_REQUIRED_FIELDS);
    });

    it("should classify formula errors", () => {
      const error = new Error("Formula syntax error");
      expect(classifyAIError(error)).toBe(AIActionErrorType.FORMULA_SYNTAX_ERROR);
    });

    it("should classify cell reference errors", () => {
      const error = new Error("Invalid cell reference format");
      expect(classifyAIError(error)).toBe(AIActionErrorType.INVALID_CELL_REFERENCE);
    });

    it("should classify unsupported action errors", () => {
      const error = new Error("Unsupported action type");
      expect(classifyAIError(error)).toBe(AIActionErrorType.UNSUPPORTED_ACTION);
    });

    it("should classify execution errors", () => {
      const error = new Error("Execution failed to apply changes");
      expect(classifyAIError(error)).toBe(AIActionErrorType.EXECUTION_FAILED);
    });

    it("should default to unknown for unclassified errors", () => {
      const error = new Error("Something went wrong");
      expect(classifyAIError(error)).toBe(AIActionErrorType.UNKNOWN);
    });
  });

  describe("attemptRecovery", () => {
    it("should recover from invalid action errors", async () => {
      const error = new Error("Invalid action");
      const action = { type: "EDIT_CELL", status: "pending" } as AIAction;

      const result = await attemptRecovery(error, action);

      expect(result.success).toBe(true);
      expect(result.recoveredAction?.type).toBe("CLARIFY");
      expect(result.fallbackType).toBe("CLARIFY");
    });

    it("should recover from formula syntax errors", async () => {
      const error = new Error("Formula syntax error");
      const action = { type: "INSERT_FORMULA", status: "pending" } as AIAction;

      const result = await attemptRecovery(error, action);

      expect(result.success).toBe(true);
      expect(result.recoveredAction?.type).toBe("INFO");
      expect(result.fallbackType).toBe("INFO");
    });

    it("should recover from network errors with retry suggestion", async () => {
      const error = new Error("Network connection failed");

      const result = await attemptRecovery(error);

      expect(result.success).toBe(false);
      expect(result.fallbackType).toBe("RETRY");
    });

    it("should recover from cell reference errors by fixing references", async () => {
      const error = new Error("Invalid cell reference");
      const action = {
        type: "EDIT_CELL",
        status: "pending",
        changes: [
          { cellRef: "a1", before: "old", after: "new", type: "value" },
          { cellRef: "B2", before: null, after: "data", type: "value" },
        ],
      } as AIAction;

      const result = await attemptRecovery(error, action);

      expect(result.success).toBe(true);
      expect(result.recoveredAction?.changes?.[0].cellRef).toBe("A1");
    });

    it("should return failure when no recovery strategy matches", async () => {
      const error = new Error("Some random error that can't be recovered");

      const result = await attemptRecovery(error);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Unable to recover");
    });
  });

  describe("sanitizeAIAction", () => {
    it("should validate and sanitize valid actions", () => {
      const action = {
        type: "EDIT_CELL",
        status: "pending",
        changes: [
          { cellRef: "a1", before: "old", after: "new", type: "value" },
        ],
      } as AIAction;

      const result = sanitizeAIAction(action);

      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized?.changes?.[0].cellRef).toBe("A1");
    });

    it("should handle actions without changes", () => {
      const action = {
        type: "INFO",
        status: "pending",
      } as AIAction;

      const result = sanitizeAIAction(action);

      expect(result.valid).toBe(true);
    });

    it("should sanitize formulas", () => {
      const action = {
        type: "INSERT_FORMULA",
        status: "pending",
        formula: "  =SUM(A1:A10)  ",
      } as AIAction;

      const result = sanitizeAIAction(action);

      expect(result.valid).toBe(true);
      expect(result.sanitized?.formula).toBe("=SUM(A1:A10)");
    });

    it("should handle null/undefined values in changes", () => {
      const action = {
        type: "EDIT_CELL",
        status: "pending",
        changes: [
          { cellRef: "A1", before: null, after: "new", type: "value" },
        ],
      } as AIAction;

      const result = sanitizeAIAction(action);

      expect(result.valid).toBe(true);
    });
  });

  describe("createFallbackAction", () => {
    it("should create CLARIFY action for invalid action errors", () => {
      const fallback = createFallbackAction(AIActionErrorType.INVALID_ACTION);

      expect(fallback.type).toBe("CLARIFY");
      expect(fallback.status).toBe("pending");
    });

    it("should create CLARIFY action for missing fields errors", () => {
      const fallback = createFallbackAction(AIActionErrorType.MISSING_REQUIRED_FIELDS);

      expect(fallback.type).toBe("CLARIFY");
    });

    it("should create INFO action for timeout errors", () => {
      const fallback = createFallbackAction(AIActionErrorType.TIMEOUT);

      expect(fallback.type).toBe("INFO");
    });

    it("should create INFO action for network errors", () => {
      const fallback = createFallbackAction(AIActionErrorType.NETWORK_ERROR);

      expect(fallback.type).toBe("INFO");
    });

    it("should default to INFO for unknown errors", () => {
      const fallback = createFallbackAction(AIActionErrorType.UNKNOWN);

      expect(fallback.type).toBe("INFO");
    });
  });

  describe("logAIQualityMetrics", () => {
    it("should log metrics successfully", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const action = { type: "EDIT_CELL", status: "pending" } as AIAction;

      logAIQualityMetrics(action, true, undefined, 1500);

      expect(consoleSpy).toHaveBeenCalledWith(
        "AI Quality Metrics:",
        expect.objectContaining({
          actionType: "EDIT_CELL",
          success: true,
          processingTime: 1500,
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle errors in metrics", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const action = { type: "EDIT_CELL", status: "pending" } as AIAction;
      const error = new Error("Test error");

      logAIQualityMetrics(action, false, error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "AI Quality Metrics:",
        expect.objectContaining({
          actionType: "EDIT_CELL",
          success: false,
          errorType: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
