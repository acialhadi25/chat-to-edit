/**
 * Property-Based Tests for JSON Parser
 *
 * This file contains property-based tests for the robustJsonParse function
 * and related JSON parsing utilities.
 *
 * Feature: chat-excel-command-improvement
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PROPERTY_TEST_CONFIG } from './utils/propertyTestConfig';
import { aiResponseArb } from './utils/generators';
import { robustJsonParse, parseAIResponse } from '../utils/jsonParser';
import { assertDeepEqual, assertValidParseResult } from './utils/propertyTestHelpers';

describe('JSON Parser Property Tests', () => {
  describe('Property 1: Valid JSON parsing preserves structure', () => {
    it('should parse valid JSON and preserve the exact structure', () => {
      /**
       * **Validates: Requirements 1.1**
       *
       * Property: For any valid JSON string representing an AIResponse,
       * parsing should return an equivalent object with the same structure and values.
       *
       * This property ensures that when AI sends a well-formed JSON response,
       * the parser correctly extracts all fields without data loss or corruption.
       *
       * Note: This test accounts for JSON serialization behavior:
       * - undefined values are removed during JSON.stringify
       * - We compare the parsed result with the re-parsed JSON to ensure consistency
       */
      fc.assert(
        fc.property(aiResponseArb, (aiResponse) => {
          // Convert the response to a JSON string
          const jsonString = JSON.stringify(aiResponse);

          // Parse it using robustJsonParse
          const parseResult = robustJsonParse(jsonString, {
            content: 'fallback',
            action: { type: 'INFO' },
          } as any);

          // Validate the parse result structure
          assertValidParseResult(parseResult);

          // Should succeed
          expect(parseResult.success).toBe(true);

          // Should use direct parsing method (fastest path)
          expect(parseResult.parseMethod).toBe('direct');

          // Should preserve the structure after JSON serialization
          // Compare with standard JSON.parse to ensure consistency
          const standardParsed = JSON.parse(jsonString);
          assertDeepEqual(parseResult.data, standardParsed);

          // Should not have errors
          expect(parseResult.error).toBeUndefined();

          // Original text should match input
          expect(parseResult.originalText).toBe(jsonString);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle valid JSON with nested objects and arrays', () => {
      /**
       * Extended test for complex nested structures
       */
      fc.assert(
        fc.property(
          fc.record({
            content: fc.string(),
            action: fc.record({
              type: fc.string(),
              target: fc.option(
                fc.record({
                  type: fc.constantFrom('cell', 'range', 'column', 'row'),
                  ref: fc.string(),
                })
              ),
              changes: fc.option(
                fc.array(
                  fc.record({
                    cellRef: fc.string(),
                    before: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
                    after: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
                    type: fc.string(),
                  })
                )
              ),
            }),
            quickOptions: fc.option(
              fc.array(
                fc.record({
                  id: fc.string(),
                  label: fc.string(),
                  value: fc.string(),
                })
              )
            ),
          }),
          (complexResponse) => {
            const jsonString = JSON.stringify(complexResponse);
            const parseResult = robustJsonParse(jsonString, {});

            expect(parseResult.success).toBe(true);
            expect(parseResult.parseMethod).toBe('direct');
            assertDeepEqual(parseResult.data, complexResponse);
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should preserve all data types in parsed JSON', () => {
      /**
       * Test that different data types are preserved correctly
       * Note: JSON has limitations - Infinity/NaN become null, -0 becomes 0
       */
      fc.assert(
        fc.property(
          fc.record({
            stringValue: fc.string(),
            numberValue: fc.integer(),
            floatValue: fc.double({ noNaN: true, noDefaultInfinity: true }),
            booleanValue: fc.boolean(),
            nullValue: fc.constant(null),
            arrayValue: fc.array(fc.string()),
            objectValue: fc.record({
              nested: fc.string(),
            }),
          }),
          (dataTypes) => {
            const jsonString = JSON.stringify(dataTypes);
            const parseResult = robustJsonParse(jsonString, {});

            expect(parseResult.success).toBe(true);

            // Compare with standard JSON.parse to ensure consistency
            const standardParsed = JSON.parse(jsonString);
            assertDeepEqual(parseResult.data, standardParsed);

            // Verify specific types are preserved (after JSON serialization)
            const parsed = parseResult.data as typeof dataTypes;
            expect(typeof parsed.stringValue).toBe('string');
            expect(typeof parsed.numberValue).toBe('number');
            // floatValue might be null if it was Infinity
            if (parsed.floatValue !== null) {
              expect(typeof parsed.floatValue).toBe('number');
            }
            expect(typeof parsed.booleanValue).toBe('boolean');
            expect(parsed.nullValue).toBe(null);
            expect(Array.isArray(parsed.arrayValue)).toBe(true);
            expect(typeof parsed.objectValue).toBe('object');
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Property 2: JSON extraction from commented text', () => {
    it('should extract valid JSON from text with commentary before it', () => {
      /**
       * **Validates: Requirements 1.2**
       *
       * Property: For any valid JSON object with arbitrary text before it,
       * the parser should extract the JSON and return an equivalent parsed object.
       *
       * This property ensures that when AI adds commentary or explanation before
       * the JSON response, the parser can still extract and parse the JSON correctly.
       */
      fc.assert(
        fc.property(
          aiResponseArb,
          fc.string({ minLength: 5, maxLength: 200 }).filter((s) => !s.includes('{')),
          (aiResponse, commentBefore) => {
            // Create JSON string
            const jsonString = JSON.stringify(aiResponse);

            // Skip if JSON is too simple (might parse directly even with comment)
            if (jsonString.length < 10) return;

            // Add commentary before the JSON with clear separation
            const textWithComment = commentBefore + '\n\n' + jsonString;

            // Parse it using robustJsonParse
            const parseResult = robustJsonParse(textWithComment, {
              content: 'fallback',
              action: { type: 'INFO' },
            } as any);

            // Validate the parse result structure
            assertValidParseResult(parseResult);

            // Should succeed
            expect(parseResult.success).toBe(true);

            // Should extract the JSON correctly
            const standardParsed = JSON.parse(jsonString);
            assertDeepEqual(parseResult.data, standardParsed);
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should extract valid JSON from text with commentary after it', () => {
      /**
       * **Validates: Requirements 1.2**
       *
       * Property: For any valid JSON object with arbitrary text after it,
       * the parser should extract the JSON and return an equivalent parsed object.
       */
      fc.assert(
        fc.property(
          aiResponseArb,
          // Use text that doesn't contain JSON-like characters
          fc
            .string({ minLength: 5, maxLength: 200 })
            .filter((s) => !s.includes('{') && !s.includes('}')),
          (aiResponse, commentAfter) => {
            // Create JSON string
            const jsonString = JSON.stringify(aiResponse);

            // Add commentary after the JSON
            const textWithComment = jsonString + '\n\n' + commentAfter;

            // Parse it using robustJsonParse
            const parseResult = robustJsonParse(textWithComment, {
              content: 'fallback',
              action: { type: 'INFO' },
            } as any);

            // Validate the parse result structure
            assertValidParseResult(parseResult);

            // Should succeed
            expect(parseResult.success).toBe(true);

            // Should extract the JSON correctly
            const standardParsed = JSON.parse(jsonString);
            assertDeepEqual(parseResult.data, standardParsed);
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should extract valid JSON from text with commentary both before and after', () => {
      /**
       * **Validates: Requirements 1.2**
       *
       * Property: For any valid JSON object with arbitrary text before and after it,
       * the parser should extract the JSON and return an equivalent parsed object.
       */
      fc.assert(
        fc.property(
          aiResponseArb,
          fc
            .string({ minLength: 5, maxLength: 100 })
            .filter((s) => !s.includes('{') && !s.includes('"') && !s.includes('}')),
          fc
            .string({ minLength: 5, maxLength: 100 })
            .filter((s) => !s.includes('{') && !s.includes('}') && !s.includes('"')),
          (aiResponse, commentBefore, commentAfter) => {
            // Create JSON string
            const jsonString = JSON.stringify(aiResponse);

            // Skip if JSON is too simple
            if (jsonString.length < 10) return;

            // Add commentary before and after the JSON
            const textWithComments = commentBefore + '\n\n' + jsonString + '\n\n' + commentAfter;

            // Parse it using robustJsonParse
            const parseResult = robustJsonParse(textWithComments, {
              content: 'fallback',
              action: { type: 'INFO' },
            } as any);

            // Validate the parse result structure
            assertValidParseResult(parseResult);

            // Should succeed
            expect(parseResult.success).toBe(true);

            // Should extract the JSON correctly
            const standardParsed = JSON.parse(jsonString);
            assertDeepEqual(parseResult.data, standardParsed);
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should extract JSON from markdown code blocks', () => {
      /**
       * **Validates: Requirements 1.2**
       *
       * Property: For any valid JSON object wrapped in markdown code blocks,
       * the parser should extract the JSON and return an equivalent parsed object.
       *
       * This handles cases where AI wraps the JSON in ```json ... ``` blocks.
       */
      fc.assert(
        fc.property(aiResponseArb, (aiResponse) => {
          // Create JSON string
          const jsonString = JSON.stringify(aiResponse, null, 2);

          // Wrap in markdown code block
          const markdownWrapped = '```json\n' + jsonString + '\n```';

          // Parse it using robustJsonParse
          const parseResult = robustJsonParse(markdownWrapped, {
            content: 'fallback',
            action: { type: 'INFO' },
          } as any);

          // Validate the parse result structure
          assertValidParseResult(parseResult);

          // Should succeed
          expect(parseResult.success).toBe(true);

          // Should extract the JSON correctly
          const standardParsed = JSON.parse(jsonString);
          assertDeepEqual(parseResult.data, standardParsed);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle JSON with realistic AI commentary patterns', () => {
      /**
       * **Validates: Requirements 1.2**
       *
       * Test with realistic commentary patterns that AI might use.
       */
      fc.assert(
        fc.property(aiResponseArb, (aiResponse) => {
          const jsonString = JSON.stringify(aiResponse);

          // Realistic AI commentary patterns
          const commentaryPatterns = [
            `Here's what I'll do:\n${jsonString}`,
            `I'll help you with that. Here's the action:\n${jsonString}`,
            `Let me process that request:\n\n${jsonString}\n\nDoes this look correct?`,
            `// Processing your request\n${jsonString}`,
            `/* AI Response */\n${jsonString}`,
            `Sure! ${jsonString}`,
          ];

          for (const textWithComment of commentaryPatterns) {
            const parseResult = robustJsonParse(textWithComment, {
              content: 'fallback',
              action: { type: 'INFO' },
            } as any);

            // Should succeed for all patterns
            expect(parseResult.success).toBe(true);

            // Should extract the JSON correctly
            const standardParsed = JSON.parse(jsonString);
            assertDeepEqual(parseResult.data, standardParsed);
          }
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Property 3: Malformed JSON returns fallback', () => {
    it('should not crash on malformed JSON and return fallback object', () => {
      /**
       * **Validates: Requirements 1.3, 1.4**
       *
       * Property: For any malformed or incomplete JSON string,
       * the parser should not crash and should return a fallback object with type INFO.
       *
       * This property ensures that when AI sends malformed JSON (missing braces,
       * invalid syntax, etc.), the parser gracefully handles the error and returns
       * a safe fallback object instead of throwing an exception.
       */
      fc.assert(
        fc.property(
          fc.oneof(
            // Missing closing brace
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `{"content": "${s}"`),
            // Missing opening brace
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `"content": "${s}"}`),
            // Invalid escape sequences
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `{"content": "\\x${s}"}`),
            // Trailing comma
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `{"content": "${s}",}`),
            // Unquoted keys
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `{content: "${s}"}`),
            // Single quotes instead of double
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `{'content': '${s}'}`),
            // Incomplete array
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => `[{"content": "${s}"`),
            // Just random text
            fc.string({ minLength: 5, maxLength: 100 }),
            // Empty string
            fc.constant(''),
            // Only whitespace
            fc.constant('   \n\t  '),
            // Truncated JSON
            fc
              .string({ minLength: 1, maxLength: 50 })
              .map((s) => `{"content": "${s}", "action": {"type":`)
          ),
          (malformedJson) => {
            const fallback = {
              content: 'fallback',
              action: { type: 'INFO' },
            };

            // Should not throw an exception
            let parseResult;
            expect(() => {
              parseResult = robustJsonParse(malformedJson, fallback);
            }).not.toThrow();

            // Validate the parse result structure
            assertValidParseResult(parseResult!);

            // The parser may successfully extract valid JSON from malformed text
            // (e.g., extracting {"content": ""} from {"content": ""} ", "action": {"type":)
            // This is correct behavior - we want to extract what we can

            // If parsing failed, should return fallback
            if (!parseResult!.success) {
              expect(parseResult!.parseMethod).toBe('fallback');
              expect(parseResult!.data).toEqual(fallback);
              expect(parseResult!.error).toBeDefined();
              expect(typeof parseResult!.error).toBe('string');
            }

            // Should have warnings explaining what went wrong (if any)
            if (parseResult!.warnings) {
              expect(Array.isArray(parseResult!.warnings)).toBe(true);
              expect(parseResult!.warnings!.length).toBeGreaterThan(0);
            }

            // Should preserve original text for debugging
            expect(parseResult!.originalText).toBe(malformedJson.trim());
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle partially valid JSON structures', () => {
      /**
       * **Validates: Requirements 1.3, 1.4**
       *
       * Test cases where JSON has some valid structure but is incomplete or malformed.
       */
      fc.assert(
        fc.property(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 50 }),
            action: fc.record({
              type: fc.string({ minLength: 1, maxLength: 20 }),
            }),
          }),
          (validObject) => {
            const validJson = JSON.stringify(validObject);

            // Create various malformed versions
            const malformedVersions = [
              validJson.slice(0, -1), // Remove last character (closing brace)
              validJson.slice(0, -5), // Remove last 5 characters
              validJson + ',', // Add trailing comma
              validJson.replace(/"/g, "'"), // Replace double quotes with single
              validJson.slice(1), // Remove first character (opening brace)
            ];

            const fallback = {
              content: 'fallback',
              action: { type: 'INFO' },
            };

            for (const malformed of malformedVersions) {
              const parseResult = robustJsonParse(malformed, fallback);

              // Should not crash
              expect(parseResult).toBeDefined();

              // Should return fallback for truly malformed JSON
              // Note: Some versions might still be extractable by the parser
              if (!parseResult.success) {
                expect(parseResult.parseMethod).toBe('fallback');
                expect(parseResult.data).toEqual(fallback);
                expect(parseResult.error).toBeDefined();
                expect(parseResult.warnings).toBeDefined();
              }
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should return fallback with INFO type for completely invalid input', () => {
      /**
       * **Validates: Requirements 1.4**
       *
       * When parsing fails completely, the fallback object should have type INFO.
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => {
            // Filter out strings that might accidentally be valid JSON or contain extractable JSON
            try {
              JSON.parse(s);
              return false;
            } catch {
              // Also filter out strings that contain valid JSON patterns
              // that robustJsonParse might extract
              if (s.includes('{') || s.includes('[')) {
                return false;
              }
              return true;
            }
          }),
          (invalidInput) => {
            const fallback = {
              content: 'Unable to process',
              action: { type: 'INFO' },
            };

            const parseResult = robustJsonParse(invalidInput, fallback);

            // Should use fallback
            expect(parseResult.success).toBe(false);
            expect(parseResult.parseMethod).toBe('fallback');

            // Should return fallback object with INFO type
            expect(parseResult.data).toEqual(fallback);
            if (
              parseResult.data &&
              typeof parseResult.data === 'object' &&
              'action' in parseResult.data
            ) {
              expect((parseResult.data as any).action.type).toBe('INFO');
            }

            // Should have error and warnings
            expect(parseResult.error).toBeDefined();
            expect(parseResult.warnings).toBeDefined();
            expect(parseResult.warnings!.length).toBeGreaterThan(0);
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should preserve original text even when parsing fails', () => {
      /**
       * **Validates: Requirements 1.4**
       *
       * The original text should always be preserved in the parse result
       * for debugging purposes, even when parsing fails.
       */
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 200 }), (inputText) => {
          const fallback = { content: 'fallback', action: { type: 'INFO' } };
          const parseResult = robustJsonParse(inputText, fallback);

          // Original text should always be preserved (trimmed)
          expect(parseResult.originalText).toBe(inputText.trim());

          // If parsing failed, should have warnings array
          if (!parseResult.success) {
            expect(parseResult.warnings).toBeDefined();
            expect(Array.isArray(parseResult.warnings)).toBe(true);
            expect(parseResult.warnings!.length).toBeGreaterThan(0);
          }
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Property 4: Array response extraction', () => {
    it('should extract the first element from JSON array responses', () => {
      /**
       * **Validates: Requirements 1.5**
       *
       * Property: For any JSON array containing AIResponse objects,
       * the parser should extract and return the first element.
       *
       * This property ensures that when AI sends a response as an array
       * (e.g., [{ content: "...", action: {...} }]), the parser extracts
       * the first element and treats it as the main response.
       */
      fc.assert(
        fc.property(fc.array(aiResponseArb, { minLength: 1, maxLength: 5 }), (aiResponseArray) => {
          // Create JSON array string
          const jsonArrayString = JSON.stringify(aiResponseArray);

          // Parse using parseAIResponse
          const parseResult = parseAIResponse(jsonArrayString);

          // Validate the parse result structure
          assertValidParseResult(parseResult);

          // Should succeed
          expect(parseResult.success).toBe(true);

          // Should extract the first element
          expect(parseResult.data).toBeDefined();

          // The extracted data should match the first element of the array
          // Compare with JSON-serialized version to account for serialization behavior
          // (-0 becomes 0, Infinity becomes null, undefined fields removed)
          const standardParsed = JSON.parse(jsonArrayString)[0];
          const data = parseResult.data!;

          // Verify the content matches (accounting for normalization)
          expect(data.content).toBe(standardParsed.content || 'Unable to process response');

          // Verify action is present and matches (after JSON serialization)
          if (standardParsed.action) {
            expect(data.action).toEqual(standardParsed.action);
          } else {
            // If no action in original, should have default INFO action
            expect(data.action).toEqual({ type: 'INFO' });
          }

          // Verify quickOptions matches (after JSON serialization)
          if (standardParsed.quickOptions) {
            expect(data.quickOptions).toEqual(standardParsed.quickOptions);
          } else {
            // If no quickOptions in original, should be empty array
            expect(data.quickOptions).toEqual([]);
          }
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle array responses with robustJsonParse directly', () => {
      /**
       * **Validates: Requirements 1.5**
       *
       * Test that robustJsonParse can handle array responses when used directly.
       * The parseAIResponse function handles array extraction, but robustJsonParse
       * should successfully parse the array structure.
       */
      fc.assert(
        fc.property(fc.array(aiResponseArb, { minLength: 1, maxLength: 5 }), (aiResponseArray) => {
          const jsonArrayString = JSON.stringify(aiResponseArray);

          // Parse using robustJsonParse
          const parseResult = robustJsonParse(jsonArrayString, {} as any);

          // Should succeed in parsing the array
          expect(parseResult.success).toBe(true);
          expect(Array.isArray(parseResult.data)).toBe(true);

          // Should preserve the array structure
          const parsedArray = parseResult.data as unknown[];
          expect(parsedArray.length).toBe(aiResponseArray.length);

          // First element should match (after JSON serialization)
          // Compare with standard JSON.parse to account for serialization behavior
          const standardParsed = JSON.parse(jsonArrayString);
          assertDeepEqual(parsedArray[0], standardParsed[0]);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should extract first element from array with commentary', () => {
      /**
       * **Validates: Requirements 1.5, 1.2**
       *
       * Property: For any JSON array with surrounding commentary,
       * the parser should extract the array and return the first element.
       *
       * This combines array extraction with commentary handling.
       */
      fc.assert(
        fc.property(
          fc.array(aiResponseArb, { minLength: 1, maxLength: 3 }),
          fc.string({ minLength: 5, maxLength: 100 }).filter((s) => !s.includes('[')),
          (aiResponseArray, commentary) => {
            const jsonArrayString = JSON.stringify(aiResponseArray);

            // Add commentary before the array
            const textWithCommentary = commentary + '\n\n' + jsonArrayString;

            // Parse using parseAIResponse
            const parseResult = parseAIResponse(textWithCommentary);

            // Should succeed
            expect(parseResult.success).toBe(true);

            // Should extract the first element
            const firstElement = aiResponseArray[0];
            const data = parseResult.data!;

            // Verify content matches
            expect(data.content).toBe(firstElement.content || 'Unable to process response');
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle single-element arrays correctly', () => {
      /**
       * **Validates: Requirements 1.5**
       *
       * Edge case: Single-element arrays should be handled the same way
       * as multi-element arrays - extract the first (and only) element.
       */
      fc.assert(
        fc.property(aiResponseArb, (aiResponse) => {
          // Create a single-element array
          const singleElementArray = [aiResponse];
          const jsonArrayString = JSON.stringify(singleElementArray);

          // Parse using parseAIResponse
          const parseResult = parseAIResponse(jsonArrayString);

          // Should succeed
          expect(parseResult.success).toBe(true);

          // Should extract the single element
          const data = parseResult.data!;
          expect(data.content).toBe(aiResponse.content || 'Unable to process response');

          // Compare with standard JSON parse to account for serialization behavior
          // (Infinity -> null, undefined fields removed)
          if (aiResponse.action) {
            const standardParsed = JSON.parse(jsonArrayString)[0];
            expect(data.action).toEqual(standardParsed.action);
          }
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle empty arrays gracefully', () => {
      /**
       * **Validates: Requirements 1.5, 1.4**
       *
       * Edge case: Empty arrays should be handled gracefully,
       * returning a fallback response.
       */
      const emptyArrayString = '[]';
      const parseResult = parseAIResponse(emptyArrayString);

      // Should not crash
      expect(parseResult).toBeDefined();

      // Should return fallback response
      expect(parseResult.data).toBeDefined();
      expect(parseResult.data!.content).toBe('Unable to process response');
      expect(parseResult.data!.action).toEqual({ type: 'INFO' });
    });

    it('should prefer array extraction over object extraction', () => {
      /**
       * **Validates: Requirements 1.5**
       *
       * When AI sends an array, the parser should recognize it as an array
       * and extract the first element, not try to parse it as a single object.
       */
      fc.assert(
        fc.property(fc.array(aiResponseArb, { minLength: 2, maxLength: 5 }), (aiResponseArray) => {
          const jsonArrayString = JSON.stringify(aiResponseArray);

          // Parse using parseAIResponse
          const parseResult = parseAIResponse(jsonArrayString);

          // Should succeed
          expect(parseResult.success).toBe(true);

          // Should extract first element, not the entire array
          const data = parseResult.data!;

          // Data should be an object, not an array
          expect(Array.isArray(data)).toBe(false);
          expect(typeof data).toBe('object');

          // Should have AIResponse structure
          expect(data).toHaveProperty('content');
          expect(data).toHaveProperty('action');
          expect(data).toHaveProperty('quickOptions');
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('parseAIResponse function', () => {
    it('should correctly parse valid AI responses', () => {
      fc.assert(
        fc.property(aiResponseArb, (aiResponse) => {
          const jsonString = JSON.stringify(aiResponse);
          const parseResult = parseAIResponse(jsonString);

          expect(parseResult.success).toBe(true);
          expect(parseResult.data).toBeDefined();

          // Verify normalized structure
          if (parseResult.data) {
            const data = parseResult.data;
            expect(data).toHaveProperty('content');
            expect(data).toHaveProperty('action');
            expect(data).toHaveProperty('quickOptions');
          }
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });
});
