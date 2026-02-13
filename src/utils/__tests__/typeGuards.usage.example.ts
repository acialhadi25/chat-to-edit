/**
 * Usage Examples for Type Guards
 * 
 * This file demonstrates how to use type guards for runtime validation
 * in real-world scenarios like API responses, file parsing, and user input.
 * 
 * **Validates: Requirements 5.1.4**
 */

import {
  isExcelData,
  isAIResponse,
  validateAIResponse,
  safeValidateExcelData,
  isActionType,
  isCellReference,
} from "../typeGuards";
import type { ExcelData, AIResponse } from "@/types/excel";

// ============================================================================
// Example 1: Validating API Response
// ============================================================================

/**
 * Example: Safely parse and validate AI response from API
 */
async function fetchAIResponse(prompt: string): Promise<AIResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  const data: unknown = await response.json();

  // Use type guard to validate response structure
  if (!isAIResponse(data)) {
    throw new Error("Invalid AI response format from API");
  }

  return data;
}

/**
 * Example: Using validateAIResponse with try-catch
 */
async function fetchAIResponseWithValidation(prompt: string): Promise<AIResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  const data: unknown = await response.json();

  try {
    // Throws error if invalid, returns typed data if valid
    return validateAIResponse(data);
  } catch (error) {
    console.error("Invalid AI response:", error);
    // Return fallback response
    return {
      content: "Sorry, I couldn't process that request.",
      action: { type: "INFO" },
    };
  }
}

// ============================================================================
// Example 2: Validating Excel Data from File Upload
// ============================================================================

/**
 * Example: Validate Excel data after parsing uploaded file
 */
async function handleExcelUpload(file: File): Promise<ExcelData | null> {
  try {
    // Parse file (implementation details omitted)
    const parsedData: unknown = await parseExcelFile(file);

    // Use safe validation that returns null instead of throwing
    const validData = safeValidateExcelData(parsedData);

    if (!validData) {
      console.error("Invalid Excel data structure");
      return null;
    }

    return validData;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return null;
  }
}

/**
 * Example: Validate Excel data with detailed error handling
 */
function processExcelData(data: unknown): ExcelData {
  if (!isExcelData(data)) {
    // Provide specific error messages based on what's missing
    if (typeof data !== "object" || data === null) {
      throw new Error("Excel data must be an object");
    }

    const obj = data as Record<string, unknown>;

    if (!obj.fileName) {
      throw new Error("Excel data missing fileName");
    }

    if (!Array.isArray(obj.headers)) {
      throw new Error("Excel data missing or invalid headers array");
    }

    if (!Array.isArray(obj.rows)) {
      throw new Error("Excel data missing or invalid rows array");
    }

    throw new Error("Excel data structure is invalid");
  }

  return data;
}

// ============================================================================
// Example 3: Validating User Input
// ============================================================================

/**
 * Example: Validate action type from user selection
 */
function handleUserActionSelection(actionType: string): void {
  if (!isActionType(actionType)) {
    console.error(`Invalid action type: ${actionType}`);
    return;
  }

  // Now TypeScript knows actionType is a valid ActionType
  console.log(`Executing action: ${actionType}`);
  executeAction(actionType);
}

/**
 * Example: Validate cell reference from user input
 */
function handleCellSelection(cellRef: string): void {
  if (!isCellReference(cellRef)) {
    console.error(`Invalid cell reference: ${cellRef}`);
    alert("Please enter a valid cell reference (e.g., A1, B10)");
    return;
  }

  // Now TypeScript knows cellRef is a valid cell reference
  console.log(`Selected cell: ${cellRef}`);
  selectCell(cellRef);
}

// ============================================================================
// Example 4: Validating Data from LocalStorage
// ============================================================================

/**
 * Example: Safely load Excel data from localStorage
 */
function loadExcelDataFromStorage(key: string): ExcelData | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);

    // Validate before using
    return safeValidateExcelData(parsed);
  } catch (error) {
    console.error("Error loading Excel data from storage:", error);
    return null;
  }
}

/**
 * Example: Save Excel data to localStorage with validation
 */
function saveExcelDataToStorage(key: string, data: unknown): boolean {
  try {
    // Validate before saving
    if (!isExcelData(data)) {
      console.error("Cannot save invalid Excel data");
      return false;
    }

    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving Excel data to storage:", error);
    return false;
  }
}

// ============================================================================
// Example 5: Validating WebSocket Messages
// ============================================================================

/**
 * Example: Validate real-time updates from WebSocket
 */
function handleWebSocketMessage(event: MessageEvent): void {
  try {
    const data: unknown = JSON.parse(event.data);

    // Check if it's an AI response
    if (isAIResponse(data)) {
      handleAIResponse(data);
      return;
    }

    // Check if it's Excel data update
    if (isExcelData(data)) {
      handleExcelDataUpdate(data);
      return;
    }

    console.warn("Unknown message type from WebSocket");
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
}

// ============================================================================
// Example 6: Type Narrowing in Conditional Logic
// ============================================================================

/**
 * Example: Use type guards for type narrowing
 */
function processUnknownData(data: unknown): string {
  // Type guard narrows the type
  if (isExcelData(data)) {
    // TypeScript knows data is ExcelData here
    return `Excel file: ${data.fileName} with ${data.rows.length} rows`;
  }

  if (isAIResponse(data)) {
    // TypeScript knows data is AIResponse here
    return `AI response: ${data.content}`;
  }

  return "Unknown data type";
}

// ============================================================================
// Helper Functions (stubs for examples)
// ============================================================================

async function parseExcelFile(file: File): Promise<unknown> {
  // Implementation would parse the Excel file
  return {};
}

function executeAction(actionType: string): void {
  // Implementation would execute the action
}

function selectCell(cellRef: string): void {
  // Implementation would select the cell
}

function handleAIResponse(response: AIResponse): void {
  // Implementation would handle the AI response
}

function handleExcelDataUpdate(data: ExcelData): void {
  // Implementation would update the Excel data
}

// ============================================================================
// Export examples for documentation
// ============================================================================

export {
  fetchAIResponse,
  fetchAIResponseWithValidation,
  handleExcelUpload,
  processExcelData,
  handleUserActionSelection,
  handleCellSelection,
  loadExcelDataFromStorage,
  saveExcelDataToStorage,
  handleWebSocketMessage,
  processUnknownData,
};
