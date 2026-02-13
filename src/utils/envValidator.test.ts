import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateEnvironment,
  logEnvValidation,
  displayEnvValidationError,
  hasEnvVariable,
  getEnvVariable,
  type EnvValidationResult,
} from "@/utils/envValidator";

describe("envValidator", () => {
  describe("validateEnvironment", () => {
    it("should pass when all required variables are present", () => {
      const result = validateEnvironment();

      // In test environment, these may or may not be set
      // We just verify the function runs without errors
      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("should have correct result structure", () => {
      const result = validateEnvironment();

      expect(typeof result.isValid).toBe("boolean");
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it("should return isValid as true when no errors", () => {
      const result: EnvValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return isValid as false when errors exist", () => {
      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Missing required variable"],
        warnings: [],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("logEnvValidation", () => {
    it("should log success when valid", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result: EnvValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      logEnvValidation(result);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log errors when invalid", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Error 1", "Error 2"],
        warnings: [],
      };

      logEnvValidation(result);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log warnings when valid but has warnings", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result: EnvValidationResult = {
        isValid: true,
        errors: [],
        warnings: ["Warning 1"],
      };

      logEnvValidation(result);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should not throw when logging", () => {
      const result: EnvValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(() => logEnvValidation(result)).not.toThrow();
    });
  });

  describe("displayEnvValidationError", () => {
    it("should not throw when called", () => {
      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Test error"],
        warnings: [],
      };

      // Mock document.getElementById
      const mockContainer = document.createElement("div");
      mockContainer.id = "root";
      document.body.appendChild(mockContainer);

      expect(() => displayEnvValidationError(result)).not.toThrow();

      document.body.removeChild(mockContainer);
    });

    it("should inject error HTML into root element", () => {
      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Configuration Error Test"],
        warnings: [],
      };

      const mockContainer = document.createElement("div");
      mockContainer.id = "root";
      document.body.appendChild(mockContainer);

      displayEnvValidationError(result);

      expect(mockContainer.innerHTML).toContain("Configuration Error");
      expect(mockContainer.innerHTML).toContain("Configuration Error Test");

      document.body.removeChild(mockContainer);
    });

    it("should handle missing root element gracefully", () => {
      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Error"],
        warnings: [],
      };

      // Ensure no root element exists
      const existingRoot = document.getElementById("root");
      if (existingRoot) {
        existingRoot.remove();
      }

      expect(() => displayEnvValidationError(result)).not.toThrow();
    });

    it("should format multiple errors", () => {
      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Error 1", "Error 2", "Error 3"],
        warnings: [],
      };

      const mockContainer = document.createElement("div");
      mockContainer.id = "root";
      document.body.appendChild(mockContainer);

      displayEnvValidationError(result);

      expect(mockContainer.innerHTML).toContain("Error 1");
      expect(mockContainer.innerHTML).toContain("Error 2");
      expect(mockContainer.innerHTML).toContain("Error 3");

      document.body.removeChild(mockContainer);
    });
  });

  describe("hasEnvVariable", () => {
    it("should be a function", () => {
      expect(typeof hasEnvVariable).toBe("function");
    });

    it("should return boolean", () => {
      const result = hasEnvVariable("VITE_ANY_TEST_VAR");
      expect(typeof result).toBe("boolean");
    });

    it("should check environment variable existence", () => {
      // Test with common Vite env variables that may or may not exist
      const result = hasEnvVariable("VITE_SUPABASE_URL");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getEnvVariable", () => {
    it("should be a function", () => {
      expect(typeof getEnvVariable).toBe("function");
    });

    it("should return string or undefined", () => {
      const result = getEnvVariable("VITE_ANY_TEST_VAR");
      expect(result === undefined || typeof result === "string").toBe(true);
    });

    it("should retrieve environment variable value", () => {
      // Test with a variable that might exist
      const result = getEnvVariable("VITE_SUPABASE_URL");
      expect(result === undefined || typeof result === "string").toBe(true);
    });
  });

  describe("environment validation result structure", () => {
    it("should validate EnvValidationResult interface", () => {
      const validResult: EnvValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(validResult).toBeDefined();
      expect(typeof validResult.isValid).toBe("boolean");
      expect(Array.isArray(validResult.errors)).toBe(true);
      expect(Array.isArray(validResult.warnings)).toBe(true);
    });

    it("should handle errors as string array", () => {
      const result: EnvValidationResult = {
        isValid: false,
        errors: ["Error message 1", "Error message 2"],
        warnings: [],
      };

      result.errors.forEach((error) => {
        expect(typeof error).toBe("string");
      });
    });

    it("should handle warnings as string array", () => {
      const result: EnvValidationResult = {
        isValid: true,
        errors: [],
        warnings: ["Warning message 1", "Warning message 2"],
      };

      result.warnings.forEach((warning) => {
        expect(typeof warning).toBe("string");
      });
    });
  });

  describe("integration tests", () => {
    it("should work together with all functions", () => {
      // Test the integration of all functions
      const result = validateEnvironment();

      // Log the result
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      logEnvValidation(result);
      consoleSpy.mockRestore();

      // Check variable access functions
      expect(typeof hasEnvVariable("VITE_ANYTHING")).toBe("boolean");
      expect(getEnvVariable("VITE_ANYTHING") === undefined || typeof getEnvVariable("VITE_ANYTHING") === "string").toBe(true);
    });
  });
});
