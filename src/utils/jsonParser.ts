/**
 * Robust JSON parsing utility with multiple fallback strategies
 * Handles malformed AI responses gracefully
 */

export interface ParseResult<T> {
  success: boolean;
  data: T | null;
  originalText: string;
  parseMethod: "direct" | "extracted" | "regex" | "fallback";
  error?: string;
}

/**
 * Attempt to parse JSON with multiple fallback strategies
 * 1. Direct JSON parsing
 * 2. Extract JSON from text (remove commentary)
 * 3. Use regex to find JSON object patterns
 * 4. Return fallback object
 */
export function robustJsonParse<T>(
  text: string,
  fallback: T
): ParseResult<T> {
  const originalText = text.trim();

  // Strategy 1: Direct parsing
  try {
    const parsed = JSON.parse(originalText);
    return {
      success: true,
      data: parsed,
      originalText,
      parseMethod: "direct",
    };
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: Extract JSON from text (handles AI commentary)
  const extractedJson = extractJsonFromText(originalText);
  if (extractedJson) {
    try {
      const parsed = JSON.parse(extractedJson);
      return {
        success: true,
        data: parsed,
        originalText,
        parseMethod: "extracted",
      };
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 3: Use regex to find JSON object pattern
  const jsonMatch = findJsonObjectInText(originalText);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch);
      return {
        success: true,
        data: parsed,
        originalText,
        parseMethod: "regex",
      };
    } catch (e) {
      // Continue to fallback
    }
  }

  // Strategy 4: Return fallback
  return {
    success: false,
    data: fallback,
    originalText,
    parseMethod: "fallback",
    error: "Could not parse JSON, using fallback",
  };
}

/**
 * Extract JSON string from text that may contain commentary
 * Looks for content between curly braces or square brackets
 */
function extractJsonFromText(text: string): string | null {
  // Try to find JSON object (starts with { and ends with })
  const objectMatch = text.match(/\{[\s\S]*\}(?:\s*$)/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Try to find JSON array (starts with [ and ends with ])
  const arrayMatch = text.match(/\[[\s\S]*\](?:\s*$)/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return null;
}

/**
 * Find JSON object in text using a more robust regex pattern
 * This handles cases where the JSON might not be complete or well-formed
 */
function findJsonObjectInText(text: string): string | null {
  // Look for patterns like `{...}` or `[...]`
  // This is a simple heuristic that finds the longest valid JSON-like structure
  let braceCount = 0;
  let inString = false;
  const escaped = false;
  let startIdx = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : "";

    // Handle string escaping
    if (char === '"' && prevChar !== "\\") {
      inString = !inString;
    }

    if (!inString) {
      if (char === "{") {
        if (braceCount === 0) startIdx = i;
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0 && startIdx !== -1) {
          return text.substring(startIdx, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * Parse AI response that should contain content and optional action
 * Expected format: { "content": "...", "action": {...}, "quickOptions": [...] }
 */
export interface AIResponse {
  content?: string;
  action?: Record<string, unknown>;
  quickOptions?: Array<{ label: string; value: string }>;
}

export function parseAIResponse(
  text: string,
  defaultContent = "Unable to process response"
): ParseResult<AIResponse> {
  const fallbackResponse: AIResponse = {
    content: defaultContent,
    action: { type: "INFO" },
    quickOptions: [],
  };

  const result = robustJsonParse<AIResponse>(text, fallbackResponse);

  // Handle case where AI returns an array of responses [ { content, action, ... } ]
  let data = result.data;
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }

  // Validate and normalize the parsed response
  if (data && typeof data === 'object') {
    const normalized: AIResponse = {
      content: data.content || defaultContent,
      action: data.action || { type: "INFO" },
      quickOptions: Array.isArray(data.quickOptions)
        ? data.quickOptions
        : [],
    };
    return {
      ...result,
      data: normalized,
    };
  }

  return { ...result, data: fallbackResponse };
}

/**
 * Extract action object from text if AI forgot to wrap response in JSON
 * Useful when AI returns something like:
 * "Here's what I'll do: {\"type\": \"INSERT_FORMULA\", ...}"
 */
export function extractActionFromText(text: string): Record<string, unknown> | null {
  const jsonMatch = findJsonObjectInText(text);
  if (!jsonMatch) return null;

  try {
    const parsed: unknown = JSON.parse(jsonMatch);
    // Check if it looks like an action (has a type field)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      typeof (parsed as { type?: unknown }).type === "string"
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch (e) {
    // Ignore parse errors
  }

  return null;
}

/**
 * Log parsing details for debugging
 */
export function logParseResult<T>(
  result: ParseResult<T>,
  context: string
): void {
  if (!result.success) {
    console.warn(`JSON Parse Fallback (${context}):`, {
      method: result.parseMethod,
      error: result.error,
      originalLength: result.originalText.length,
      originalPreview: result.originalText.substring(0, 100),
    });
  } else if (result.parseMethod !== "direct") {
    console.info(`JSON Parse Success with fallback (${context}):`, {
      method: result.parseMethod,
      originalLength: result.originalText.length,
    });
  }
}
