/**
 * Robust JSON parsing utility with multiple fallback strategies
 * Handles malformed AI responses gracefully
 */

export interface ParseResult<T> {
  success: boolean;
  data: T | null;
  originalText: string;
  parseMethod: 'direct' | 'extracted' | 'regex' | 'fallback';
  error?: string;
  warnings?: string[];
}

/**
 * Attempt to parse JSON with multiple fallback strategies
 * 1. Direct JSON parsing
 * 2. Extract JSON from text (remove commentary)
 * 3. Use regex to find JSON object patterns
 * 4. Return fallback object
 */
export function robustJsonParse<T extends Record<string, unknown>>(
  text: string,
  fallback: T
): ParseResult<T> {
  const originalText = text.trim();
  const warnings: string[] = [];

  // Strategy 1: Direct parsing
  try {
    const parsed = JSON.parse(originalText);
    return {
      success: true,
      data: parsed,
      originalText,
      parseMethod: 'direct',
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (e) {
    warnings.push(`Direct parse failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Strategy 2: Extract JSON from text (handles AI commentary)
  const extractedJson = extractJsonFromText(originalText);
  if (extractedJson) {
    try {
      const parsed = JSON.parse(extractedJson);
      if (extractedJson !== originalText) {
        warnings.push('JSON extracted from text with surrounding commentary');
      }
      return {
        success: true,
        data: parsed,
        originalText,
        parseMethod: 'extracted',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (e) {
      warnings.push(`Extracted JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    warnings.push('No JSON object or array pattern found in text');
  }

  // Strategy 3: Use regex to find JSON object pattern
  const jsonMatch = findJsonObjectInText(originalText);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch);
      warnings.push('JSON found using brace-counting extraction');
      return {
        success: true,
        data: parsed,
        originalText,
        parseMethod: 'regex',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (e) {
      warnings.push(
        `Regex-extracted JSON parse failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  } else {
    warnings.push('Brace-counting extraction found no valid JSON structure');
  }

  // Strategy 4: Return fallback
  warnings.push('All parsing strategies failed, using fallback object');
  return {
    success: false,
    data: fallback,
    originalText,
    parseMethod: 'fallback',
    error: 'Could not parse JSON, using fallback',
    warnings,
  };
}

/**
 * Extract JSON string from text that may contain commentary
 * Looks for content between curly braces or square brackets
 * Handles nested braces, escaped quotes, and markdown code blocks
 */
function extractJsonFromText(text: string): string | null {
  // First, try to extract from markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (markdownMatch) {
    const extracted = markdownMatch[1].trim();
    // Verify it looks like JSON
    if (extracted.startsWith('{') || extracted.startsWith('[')) {
      return extracted;
    }
  }

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
 * Find JSON object in text using brace-counting extraction
 * Handles nested braces, escaped quotes, and complex string content
 */
function findJsonObjectInText(text: string): string | null {
  // Look for patterns like `{...}` or `[...]`
  // This is a robust heuristic that finds valid JSON-like structures
  let braceCount = 0;
  let inString = false;
  let startIdx = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Handle escape sequences in strings
    if (inString) {
      // Check if this is an escape character
      if (char === '\\') {
        // Skip the next character (it's escaped)
        i++;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    // Not in string - check for string start or braces
    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      if (braceCount === 0) startIdx = i;
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && startIdx !== -1) {
        return text.substring(startIdx, i + 1);
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
  defaultContent = 'Unable to process response'
): ParseResult<AIResponse> {
  const fallbackResponse: AIResponse = {
    content: defaultContent,
    action: { type: 'INFO' },
    quickOptions: [],
  };

  const result = robustJsonParse<Record<string, unknown>>(
    text,
    fallbackResponse as Record<string, unknown>
  );

  // Handle case where AI returns an array of responses [ { content, action, ... } ]
  let data = result.data;
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }

  // Validate and normalize the parsed response
  if (data && typeof data === 'object') {
    const normalized: AIResponse = {
      content: (data.content as string) || defaultContent,
      action: (data.action as Record<string, unknown>) || { type: 'INFO' },
      quickOptions: Array.isArray(data.quickOptions)
        ? (data.quickOptions as Array<{ label: string; value: string }>)
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
    const parsed = JSON.parse(jsonMatch);
    // Check if it looks like an action (has a type field)
    if (parsed.type && typeof parsed.type === 'string') {
      return parsed;
    }
  } catch (e) {
    // Ignore parse errors
  }

  return null;
}

/**
 * Log parsing details for debugging
 */
export function logParseResult<T>(result: ParseResult<T>, context: string): void {
  if (!result.success) {
    console.warn(`JSON Parse Fallback (${context}):`, {
      method: result.parseMethod,
      error: result.error,
      warnings: result.warnings,
      originalLength: result.originalText.length,
      originalPreview: result.originalText.substring(0, 100),
    });
  } else if (result.parseMethod !== 'direct') {
    console.info(`JSON Parse Success with fallback (${context}):`, {
      method: result.parseMethod,
      warnings: result.warnings,
      originalLength: result.originalText.length,
    });
  }
}
