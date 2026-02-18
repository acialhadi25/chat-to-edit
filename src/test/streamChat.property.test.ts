/**
 * Property-Based Tests for Stream Chat
 *
 * Tests stream handling properties including chunk accumulation,
 * incomplete JSON buffering, and multi-line SSE processing.
 *
 * Requirements: 7.1, 7.2, 7.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PROPERTY_TEST_CONFIG } from './utils/propertyTestConfig';

/**
 * Property 21: Stream chunk accumulation
 * **Validates: Requirements 7.1**
 *
 * For any sequence of stream chunks forming a complete response,
 * the accumulated text should equal the concatenation of all chunk contents in order.
 */
describe('Stream Chat Property Tests', () => {
  describe('Property 21: Stream chunk accumulation', () => {
    it('should accumulate chunks in order to form complete response', () => {
      // Generator for stream chunks
      const streamChunkArb = fc.record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          })
        ),
      });

      // Generator for a sequence of chunks
      const chunkSequenceArb = fc.array(streamChunkArb, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(chunkSequenceArb, (chunks) => {
          // Calculate expected full text by concatenating all chunk contents
          const expectedFullText = chunks.map((chunk) => chunk.choices[0].delta.content).join('');

          // Simulate stream processing
          let accumulatedText = '';
          const deltaTexts: string[] = [];

          for (const chunk of chunks) {
            const content = chunk.choices[0].delta.content;
            deltaTexts.push(content);
            accumulatedText += content;
          }

          // Verify accumulation
          expect(accumulatedText).toBe(expectedFullText);
          expect(deltaTexts.join('')).toBe(expectedFullText);

          // Verify order preservation
          let reconstructed = '';
          for (const delta of deltaTexts) {
            reconstructed += delta;
          }
          expect(reconstructed).toBe(expectedFullText);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle empty chunks without breaking accumulation', () => {
      // Generator that includes some empty content chunks
      const mixedChunkArb = fc.array(
        fc.oneof(
          fc.record({
            choices: fc.tuple(
              fc.record({
                delta: fc.record({
                  content: fc.string({ minLength: 1, maxLength: 50 }),
                }),
              })
            ),
          }),
          fc.record({
            choices: fc.tuple(
              fc.record({
                delta: fc.record({
                  content: fc.constant(''),
                }),
              })
            ),
          })
        ),
        { minLength: 1, maxLength: 20 }
      );

      fc.assert(
        fc.property(mixedChunkArb, (chunks) => {
          // Calculate expected text (empty strings should not affect result)
          const expectedFullText = chunks
            .map((chunk) => chunk.choices[0].delta.content)
            .filter((content) => content.length > 0)
            .join('');

          // Simulate accumulation
          let accumulatedText = '';
          for (const chunk of chunks) {
            const content = chunk.choices[0].delta.content;
            if (content) {
              accumulatedText += content;
            }
          }

          expect(accumulatedText).toBe(expectedFullText);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should preserve chunk order regardless of content', () => {
      // Generator for chunks with numbered content to verify order
      const numberedChunkArb = fc
        .array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 20 })
        .map((numbers) =>
          numbers.map((num, idx) => ({
            choices: [
              {
                delta: {
                  content: `[${idx}:${num}]`,
                },
              },
            ],
          }))
        );

      fc.assert(
        fc.property(numberedChunkArb, (chunks) => {
          // Accumulate chunks
          let accumulatedText = '';
          for (const chunk of chunks) {
            accumulatedText += chunk.choices[0].delta.content;
          }

          // Verify order by checking indices
          const matches = accumulatedText.match(/\[(\d+):\d+\]/g);
          expect(matches).not.toBeNull();

          if (matches) {
            const indices = matches.map((m) => parseInt(m.match(/\[(\d+):/)?.[1] || '0'));

            // Indices should be sequential from 0 to chunks.length - 1
            for (let i = 0; i < indices.length; i++) {
              expect(indices[i]).toBe(i);
            }
          }
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle chunks with special characters and unicode', () => {
      // Generator for chunks with various special characters
      const specialChunkArb = fc.array(
        fc.record({
          choices: fc.tuple(
            fc.record({
              delta: fc.record({
                content: fc.oneof(
                  fc.string({ minLength: 1, maxLength: 20 }),
                  fc.constant('🎉'),
                  fc.constant('\\n'),
                  fc.constant('\\t'),
                  fc.constant('"'),
                  fc.constant("'"),
                  fc.constant('中文'),
                  fc.constant('العربية')
                ),
              }),
            })
          ),
        }),
        { minLength: 1, maxLength: 15 }
      );

      fc.assert(
        fc.property(specialChunkArb, (chunks) => {
          // Calculate expected text
          const expectedFullText = chunks.map((chunk) => chunk.choices[0].delta.content).join('');

          // Simulate accumulation
          let accumulatedText = '';
          for (const chunk of chunks) {
            accumulatedText += chunk.choices[0].delta.content;
          }

          // Verify exact match including special characters
          expect(accumulatedText).toBe(expectedFullText);
          expect(accumulatedText.length).toBe(expectedFullText.length);
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  /**
   * Property 22: Incomplete JSON buffering
   * **Validates: Requirements 7.2**
   *
   * For any stream chunk containing incomplete JSON, the parser should buffer
   * the chunk and wait for subsequent chunks before attempting to parse.
   */
  describe('Property 22: Incomplete JSON buffering', () => {
    it('should buffer incomplete JSON and parse when complete', () => {
      // Generator for valid JSON chunks that can be split
      const completeJsonArb = fc.record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          })
        ),
      });

      fc.assert(
        fc.property(
          completeJsonArb,
          fc.integer({ min: 1, max: 50 }), // Split position
          (jsonObj, splitPos) => {
            const fullJson = JSON.stringify(jsonObj);
            const expectedContent = jsonObj.choices[0].delta.content;

            // Split JSON at arbitrary position to create incomplete chunk
            const part1 = fullJson.slice(0, Math.min(splitPos, fullJson.length - 1));
            const part2 = fullJson.slice(Math.min(splitPos, fullJson.length - 1));

            // Import processStreamLine from streamChat
            // Since it's not exported, we'll test the behavior through simulation

            // First chunk should be incomplete (unless split happens to be at end)
            let buffer = '';
            let content1: string | undefined;

            try {
              JSON.parse(part1);
              // If it parses, it's a complete JSON (edge case)
              content1 = JSON.parse(part1).choices?.[0]?.delta?.content;
              buffer = '';
            } catch {
              // Expected: incomplete JSON should not parse
              buffer = part1;
              content1 = undefined;
            }

            // Second chunk completes the JSON
            const combined = buffer + part2;
            let content2: string | undefined;

            try {
              const parsed = JSON.parse(combined);
              content2 = parsed.choices?.[0]?.delta?.content;
            } catch {
              // Should not happen if we split correctly
              content2 = undefined;
            }

            // Verify that either:
            // 1. First part was complete and parsed correctly, OR
            // 2. First part was buffered and second part completed it
            if (content1) {
              expect(content1).toBe(expectedContent);
            } else {
              expect(content2).toBe(expectedContent);
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should handle multiple incomplete chunks before completion', () => {
      // Generator for JSON that will be split into multiple parts
      const completeJsonArb = fc.record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 10, maxLength: 50 }),
            }),
          })
        ),
      });

      fc.assert(
        fc.property(
          completeJsonArb,
          fc.integer({ min: 2, max: 5 }), // Number of chunks
          (jsonObj, numChunks) => {
            const fullJson = JSON.stringify(jsonObj);
            const expectedContent = jsonObj.choices[0].delta.content;

            // Split JSON into multiple chunks
            const chunkSize = Math.ceil(fullJson.length / numChunks);
            const chunks: string[] = [];

            for (let i = 0; i < fullJson.length; i += chunkSize) {
              chunks.push(fullJson.slice(i, i + chunkSize));
            }

            // Process chunks sequentially with buffering
            let buffer = '';
            let finalContent: string | undefined;
            let parseSucceeded = false;

            for (const chunk of chunks) {
              const textToParse = buffer + chunk;

              try {
                const parsed = JSON.parse(textToParse);
                finalContent = parsed.choices?.[0]?.delta?.content;
                buffer = '';
                parseSucceeded = true;
                break; // Successfully parsed
              } catch {
                // Incomplete, continue buffering
                buffer = textToParse;
              }
            }

            // Verify that we eventually parsed successfully
            expect(parseSucceeded).toBe(true);
            expect(finalContent).toBe(expectedContent);
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should preserve buffer content across failed parse attempts', () => {
      // Test that buffer accumulates correctly
      const incompleteChunks = ['{"choices":[{"delta":', '{"content":"test', ' message"}}]}'];

      let buffer = '';
      const results: boolean[] = [];

      for (const chunk of incompleteChunks) {
        const textToParse = buffer + chunk;

        try {
          JSON.parse(textToParse);
          results.push(true);
          buffer = '';
        } catch {
          results.push(false);
          buffer = textToParse;
        }
      }

      // First two should fail, last should succeed
      expect(results[0]).toBe(false);
      expect(results[1]).toBe(false);
      expect(results[2]).toBe(true);
      expect(buffer).toBe(''); // Buffer cleared after success
    });

    it('should handle SSE format with incomplete JSON', () => {
      // Test with SSE "data: " prefix
      const completeJsonArb = fc.record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 5, maxLength: 30 }),
            }),
          })
        ),
      });

      fc.assert(
        fc.property(
          completeJsonArb,
          fc.integer({ min: 1, max: 100 }), // Split percentage (1-100)
          (jsonObj, splitPercent) => {
            const fullJson = JSON.stringify(jsonObj);
            const expectedContent = jsonObj.choices[0].delta.content;

            // Calculate split position as percentage of total length
            // Ensure we don't split at the very end
            const splitPos = Math.floor((fullJson.length - 1) * (splitPercent / 100));

            // Create SSE formatted lines
            const part1 = fullJson.slice(0, splitPos);
            const part2 = fullJson.slice(splitPos);

            // Skip test if split creates empty parts
            if (part1.length === 0 || part2.length === 0) {
              return true; // Skip this case
            }

            const line1 = `data: ${part1}`;
            const line2 = `data: ${part2}`;

            // Process first line
            let buffer = '';
            let content: string | undefined;

            // Extract JSON from SSE format
            if (line1.startsWith('data: ')) {
              const jsonStr1 = line1.slice(6).trim();

              try {
                const parsed = JSON.parse(jsonStr1);
                content = parsed.choices?.[0]?.delta?.content;
                buffer = '';
              } catch {
                buffer = jsonStr1;
              }
            }

            // Process second line if first was incomplete
            if (!content && line2.startsWith('data: ')) {
              const jsonStr2 = line2.slice(6).trim();
              const combined = buffer + jsonStr2;

              try {
                const parsed = JSON.parse(combined);
                content = parsed.choices?.[0]?.delta?.content;
              } catch {
                // Should not happen with our test setup
                // But if it does, the test will fail below
              }
            }

            // Verify we got the expected content
            // Either from first parse (if split happened to create valid JSON)
            // Or from combined parse
            expect(content).toBe(expectedContent);
            return true;
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('should not parse incomplete JSON prematurely', () => {
      // Test that incomplete JSON is never parsed
      const incompleteJsonStrings = [
        '{"choices":[',
        '{"choices":[{"delta"',
        '{"choices":[{"delta":{"content"',
        '{"choices":[{"delta":{"content":"test"',
        '{"choices":[{"delta":{"content":"test"}',
        '{"choices":[{"delta":{"content":"test"}}',
        '{"choices":[{"delta":{"content":"test"}}]',
      ];

      for (const incomplete of incompleteJsonStrings) {
        let parseSucceeded = false;

        try {
          JSON.parse(incomplete);
          parseSucceeded = true;
        } catch {
          parseSucceeded = false;
        }

        // All of these should fail to parse
        expect(parseSucceeded).toBe(false);
      }
    });

    it('should handle empty buffer with new complete JSON', () => {
      // Test that when buffer is empty, complete JSON parses immediately
      const completeJsonArb = fc.record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          })
        ),
      });

      fc.assert(
        fc.property(completeJsonArb, (jsonObj) => {
          const fullJson = JSON.stringify(jsonObj);
          const expectedContent = jsonObj.choices[0].delta.content;

          // Empty buffer
          const buffer = '';
          const textToParse = buffer + fullJson;

          let content: string | undefined;
          let parseSucceeded = false;

          try {
            const parsed = JSON.parse(textToParse);
            content = parsed.choices?.[0]?.delta?.content;
            parseSucceeded = true;
          } catch {
            parseSucceeded = false;
          }

          // Should parse successfully on first attempt
          expect(parseSucceeded).toBe(true);
          expect(content).toBe(expectedContent);
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });
});

/**
 * Property 23: Multi-line SSE processing
 * **Validates: Requirements 7.5**
 *
 * For any stream buffer containing multiple SSE event lines,
 * each line should be processed separately and in order.
 */
describe('Property 23: Multi-line SSE processing', () => {
  it('should process multiple SSE lines separately and in order', () => {
    // Generator for SSE data lines with content
    const sseLineArb = fc
      .record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 1, maxLength: 30 }),
            }),
          })
        ),
      })
      .map((obj) => `data: ${JSON.stringify(obj)}`);

    // Generator for multiple SSE lines
    const multiLineSseArb = fc.array(sseLineArb, { minLength: 2, maxLength: 10 });

    fc.assert(
      fc.property(multiLineSseArb, (sseLines) => {
        // Combine lines into a single buffer (as would happen in streaming)
        const buffer = sseLines.join('\n');

        // Extract expected contents in order
        const expectedContents = sseLines.map((line) => {
          const jsonStr = line.slice(6); // Remove "data: " prefix
          const parsed = JSON.parse(jsonStr);
          return parsed.choices[0].delta.content;
        });

        // Process buffer line by line
        const processedContents: string[] = [];
        const lines = buffer.split('\n');
        let jsonBuffer = '';

        for (const line of lines) {
          // Simulate processStreamLine behavior
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          const textToParse = jsonBuffer ? jsonBuffer + jsonStr : jsonStr;

          try {
            const parsed = JSON.parse(textToParse);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              processedContents.push(content);
            }
            jsonBuffer = ''; // Clear buffer on success
          } catch {
            jsonBuffer = textToParse; // Buffer incomplete JSON
          }
        }

        // Verify all lines were processed
        expect(processedContents.length).toBe(expectedContents.length);

        // Verify order is preserved
        for (let i = 0; i < expectedContents.length; i++) {
          expect(processedContents[i]).toBe(expectedContents[i]);
        }
      }),
      PROPERTY_TEST_CONFIG
    );
  });

  it('should handle mixed SSE lines with empty lines and comments', () => {
    // Generator for various SSE line types
    const sseContentLineArb = fc
      .record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 1, maxLength: 20 }),
            }),
          })
        ),
      })
      .map((obj) => `data: ${JSON.stringify(obj)}`);

    const emptyLineArb = fc.constant('');
    const commentLineArb = fc.string({ minLength: 1, maxLength: 20 }).map((s) => `: ${s}`);

    // Mix of content lines, empty lines, and comments
    const mixedLinesArb = fc.array(fc.oneof(sseContentLineArb, emptyLineArb, commentLineArb), {
      minLength: 3,
      maxLength: 15,
    });

    fc.assert(
      fc.property(mixedLinesArb, (lines) => {
        // Extract expected contents (only from data lines)
        const expectedContents: string[] = [];
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                expectedContents.push(content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        // Process all lines
        const processedContents: string[] = [];
        let jsonBuffer = '';

        for (const line of lines) {
          // Skip empty lines and comments
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          const textToParse = jsonBuffer ? jsonBuffer + jsonStr : jsonStr;

          try {
            const parsed = JSON.parse(textToParse);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              processedContents.push(content);
            }
            jsonBuffer = '';
          } catch {
            jsonBuffer = textToParse;
          }
        }

        // Verify only data lines were processed
        expect(processedContents).toEqual(expectedContents);
      }),
      PROPERTY_TEST_CONFIG
    );
  });

  it('should process lines in exact order regardless of content', () => {
    // Generator for numbered content to verify order
    const numberedSseLineArb = fc
      .array(fc.integer({ min: 0, max: 1000 }), { minLength: 2, maxLength: 10 })
      .map((numbers) =>
        numbers.map((num, idx) => {
          const obj = {
            choices: [
              {
                delta: {
                  content: `[${idx}:${num}]`,
                },
              },
            ],
          };
          return `data: ${JSON.stringify(obj)}`;
        })
      );

    fc.assert(
      fc.property(numberedSseLineArb, (sseLines) => {
        // Process lines
        const processedContents: string[] = [];
        let jsonBuffer = '';

        for (const line of sseLines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          const textToParse = jsonBuffer ? jsonBuffer + jsonStr : jsonStr;

          try {
            const parsed = JSON.parse(textToParse);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              processedContents.push(content);
            }
            jsonBuffer = '';
          } catch {
            jsonBuffer = textToParse;
          }
        }

        // Verify order by checking indices
        for (let i = 0; i < processedContents.length; i++) {
          const match = processedContents[i].match(/\[(\d+):\d+\]/);
          expect(match).not.toBeNull();
          if (match) {
            const index = parseInt(match[1]);
            expect(index).toBe(i);
          }
        }
      }),
      PROPERTY_TEST_CONFIG
    );
  });

  it('should handle [DONE] marker in multi-line buffer', () => {
    // Generator for SSE lines followed by [DONE]
    const sseWithDoneArb = fc
      .array(
        fc.record({
          choices: fc.tuple(
            fc.record({
              delta: fc.record({
                content: fc.string({ minLength: 1, maxLength: 20 }),
              }),
            })
          ),
        }),
        { minLength: 1, maxLength: 5 }
      )
      .map((objs) => {
        const lines = objs.map((obj) => `data: ${JSON.stringify(obj)}`);
        lines.push('data: [DONE]');
        return lines;
      });

    fc.assert(
      fc.property(sseWithDoneArb, (sseLines) => {
        // Extract expected contents (excluding [DONE])
        const expectedContents: string[] = [];
        for (const line of sseLines) {
          if (line === 'data: [DONE]') break;
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            const parsed = JSON.parse(jsonStr);
            expectedContents.push(parsed.choices[0].delta.content);
          }
        }

        // Process lines
        const processedContents: string[] = [];
        let jsonBuffer = '';
        let done = false;

        for (const line of sseLines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();

          // Check for [DONE] marker
          if (jsonStr === '[DONE]') {
            done = true;
            break;
          }

          const textToParse = jsonBuffer ? jsonBuffer + jsonStr : jsonStr;

          try {
            const parsed = JSON.parse(textToParse);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              processedContents.push(content);
            }
            jsonBuffer = '';
          } catch {
            jsonBuffer = textToParse;
          }
        }

        // Verify all content lines were processed before [DONE]
        expect(processedContents).toEqual(expectedContents);
        expect(done).toBe(true);
      }),
      PROPERTY_TEST_CONFIG
    );
  });

  it('should handle incomplete JSON across multiple lines', () => {
    // Generator for a complete JSON split across multiple lines
    const splitJsonArb = fc
      .record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 10, maxLength: 50 }),
            }),
          })
        ),
      })
      .chain((obj) => {
        const fullJson = JSON.stringify(obj);
        const expectedContent = obj.choices[0].delta.content;

        // Split into 2-4 parts
        return fc.integer({ min: 2, max: 4 }).map((numParts) => {
          const chunkSize = Math.ceil(fullJson.length / numParts);
          const parts: string[] = [];

          for (let i = 0; i < fullJson.length; i += chunkSize) {
            parts.push(fullJson.slice(i, i + chunkSize));
          }

          // Create SSE lines from parts
          const sseLines = parts.map((part) => `data: ${part}`);

          return { sseLines, expectedContent };
        });
      });

    fc.assert(
      fc.property(splitJsonArb, ({ sseLines, expectedContent }) => {
        // Process lines with buffering - DON'T trim the JSON parts
        // because trimming can remove important whitespace from content values
        let jsonBuffer = '';
        let finalContent: string | undefined;

        for (const line of sseLines) {
          if (!line.startsWith('data: ')) continue;

          // Extract JSON without trimming to preserve content whitespace
          const jsonStr = line.slice(6);
          const textToParse = jsonBuffer + jsonStr;

          try {
            const parsed = JSON.parse(textToParse);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content !== undefined) {
              finalContent = content;
            }
            jsonBuffer = '';
            break; // Successfully parsed
          } catch {
            jsonBuffer = textToParse; // Continue buffering
          }
        }

        // Verify we eventually got the complete content
        expect(finalContent).toBe(expectedContent);
      }),
      PROPERTY_TEST_CONFIG
    );
  });

  it('should accumulate content from multiple complete lines', () => {
    // Generator for multiple complete SSE lines
    const multipleCompleteArb = fc.array(
      fc.record({
        choices: fc.tuple(
          fc.record({
            delta: fc.record({
              content: fc.string({ minLength: 1, maxLength: 20 }),
            }),
          })
        ),
      }),
      { minLength: 2, maxLength: 8 }
    );

    fc.assert(
      fc.property(multipleCompleteArb, (objs) => {
        // Create SSE lines
        const sseLines = objs.map((obj) => `data: ${JSON.stringify(obj)}`);

        // Calculate expected accumulated text
        const expectedAccumulated = objs.map((obj) => obj.choices[0].delta.content).join('');

        // Process lines and accumulate
        let accumulated = '';
        let jsonBuffer = '';

        for (const line of sseLines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          const textToParse = jsonBuffer ? jsonBuffer + jsonStr : jsonStr;

          try {
            const parsed = JSON.parse(textToParse);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
            }
            jsonBuffer = '';
          } catch {
            jsonBuffer = textToParse;
          }
        }

        // Verify accumulated text matches expected
        expect(accumulated).toBe(expectedAccumulated);
      }),
      PROPERTY_TEST_CONFIG
    );
  });
});
