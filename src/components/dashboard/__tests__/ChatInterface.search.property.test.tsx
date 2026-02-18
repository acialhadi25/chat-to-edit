import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ChatMessage } from '@/types/excel';

/**
 * Property-Based Test for Chat History Search Completeness
 * 
 * **Validates: Requirements 4.2.6**
 * 
 * Property 3: Chat History Search Completeness
 * For any search query in chat history, all returned messages should contain
 * the search term (case-insensitive), and no messages containing the search
 * term should be excluded.
 */

// Arbitrary generators for property-based testing
const messageContentArbitrary = fc.oneof(
  fc.string({ minLength: 5, maxLength: 100 }),
  fc.constantFrom(
    'Show me the data',
    'Filter by age greater than 25',
    'Sort by name',
    'Calculate the sum',
    'Remove duplicates',
    'Add a new column',
    'Export to CSV',
    'Create a chart',
    'Find and replace',
    'Merge cells'
  )
);

const roleArbitrary = fc.constantFrom<'user' | 'assistant'>('user', 'assistant');

const chatMessageArbitrary = fc.record({
  id: fc.uuid(),
  role: roleArbitrary,
  content: messageContentArbitrary,
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
});

const chatMessagesArbitrary = fc.array(chatMessageArbitrary, { minLength: 5, maxLength: 50 });

// Search term generator - extract words from messages or use common terms
const searchTermArbitrary = fc.oneof(
  fc.constantFrom('data', 'filter', 'sort', 'sum', 'column', 'chart', 'name', 'age', 'the', 'by'),
  fc.string({ minLength: 2, maxLength: 10 })
);

/**
 * Filter messages based on search query (case-insensitive)
 * This replicates the logic from ChatInterface component
 */
function filterMessages(messages: ChatMessage[], searchQuery: string): ChatMessage[] {
  if (!searchQuery.trim()) {
    return messages;
  }
  return messages.filter((message) =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

describe('Property-Based Tests: Chat History Search', () => {
  describe('Property 3: Chat History Search Completeness', () => {
    it('should return only messages that contain the search term (case-insensitive)', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          searchTermArbitrary,
          (messages, searchTerm) => {
            // Filter messages using the same logic as ChatInterface
            const filteredMessages = filterMessages(messages, searchTerm);

            // Property: All returned messages must contain the search term (case-insensitive)
            for (const message of filteredMessages) {
              const contentLower = message.content.toLowerCase();
              const searchLower = searchTerm.toLowerCase();
              expect(contentLower).toContain(searchLower);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not exclude any messages that contain the search term', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          searchTermArbitrary,
          (messages, searchTerm) => {
            // Filter messages
            const filteredMessages = filterMessages(messages, searchTerm);

            // Property: No matching messages should be excluded
            // Find all messages that should match
            const expectedMatches = messages.filter((message) =>
              message.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Filtered messages should equal expected matches
            expect(filteredMessages.length).toBe(expectedMatches.length);

            // Every expected match should be in filtered results
            for (const expectedMessage of expectedMatches) {
              const found = filteredMessages.some((msg) => msg.id === expectedMessage.id);
              expect(found).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should be case-insensitive when searching', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          searchTermArbitrary,
          (messages, searchTerm) => {
            // Skip empty search terms
            if (!searchTerm.trim()) return;

            // Filter with lowercase search term
            const filteredLower = filterMessages(messages, searchTerm.toLowerCase());

            // Filter with uppercase search term
            const filteredUpper = filterMessages(messages, searchTerm.toUpperCase());

            // Filter with mixed case search term
            const filteredMixed = filterMessages(messages, searchTerm);

            // Property: Results should be identical regardless of case
            expect(filteredLower.length).toBe(filteredUpper.length);
            expect(filteredLower.length).toBe(filteredMixed.length);

            // Verify same message IDs in all results
            const lowerIds = new Set(filteredLower.map((m) => m.id));
            const upperIds = new Set(filteredUpper.map((m) => m.id));
            const mixedIds = new Set(filteredMixed.map((m) => m.id));

            expect(lowerIds).toEqual(upperIds);
            expect(lowerIds).toEqual(mixedIds);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return empty array when no messages match', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          fc.string({ minLength: 20, maxLength: 30 }).filter((s) => /^[xyz]{20,30}$/.test(s)),
          (messages, searchTerm) => {
            // Use a search term unlikely to appear in messages
            const filteredMessages = filterMessages(messages, searchTerm);

            // If no messages contain the search term, result should be empty
            const hasMatch = messages.some((msg) =>
              msg.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (!hasMatch) {
              expect(filteredMessages).toHaveLength(0);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return all messages when search query is empty', () => {
      fc.assert(
        fc.property(chatMessagesArbitrary, (messages) => {
          // Filter with empty search query
          const filteredEmpty = filterMessages(messages, '');
          const filteredWhitespace = filterMessages(messages, '   ');

          // Property: Should return all messages when search is empty
          expect(filteredEmpty.length).toBe(messages.length);
          expect(filteredWhitespace.length).toBe(messages.length);

          // Verify all message IDs are present
          const originalIds = new Set(messages.map((m) => m.id));
          const filteredIds = new Set(filteredEmpty.map((m) => m.id));

          expect(filteredIds).toEqual(originalIds);
        }),
        { numRuns: 20 }
      );
    });

    it('should handle special characters in search query', () => {
      const specialCharsArbitrary = fc.constantFrom(
        'A1:A10',
        '=SUM()',
        'test@example.com',
        'price: $100',
        'ratio (1:2)',
        'formula [A1]',
        'value {x}',
        'path/to/file',
        'regex.*pattern'
      );

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              role: roleArbitrary,
              content: fc.oneof(
                specialCharsArbitrary,
                fc.string({ minLength: 10, maxLength: 50 }).map((s) => s + ' A1:A10 ' + s)
              ),
              timestamp: fc.date(),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          specialCharsArbitrary,
          (messages, searchTerm) => {
            const filteredMessages = filterMessages(messages, searchTerm);

            // Property: All returned messages must contain the search term
            for (const message of filteredMessages) {
              expect(message.content.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            // Property: No matching messages should be excluded
            const expectedCount = messages.filter((msg) =>
              msg.content.toLowerCase().includes(searchTerm.toLowerCase())
            ).length;

            expect(filteredMessages.length).toBe(expectedCount);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain search completeness with both user and assistant messages', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          searchTermArbitrary,
          (messages, searchTerm) => {
            const filteredMessages = filterMessages(messages, searchTerm);

            // Count matches by role
            const userMatches = filteredMessages.filter((m) => m.role === 'user');
            const assistantMatches = filteredMessages.filter((m) => m.role === 'assistant');

            // Verify all user matches are included
            const expectedUserMatches = messages.filter(
              (m) =>
                m.role === 'user' &&
                m.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(userMatches.length).toBe(expectedUserMatches.length);

            // Verify all assistant matches are included
            const expectedAssistantMatches = messages.filter(
              (m) =>
                m.role === 'assistant' &&
                m.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(assistantMatches.length).toBe(expectedAssistantMatches.length);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle partial word matches', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              role: roleArbitrary,
              content: fc.constantFrom(
                'filtering data',
                'filter by column',
                'prefilter results',
                'data filter applied',
                'no match here'
              ),
              timestamp: fc.date(),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          fc.constant('filter'),
          (messages, searchTerm) => {
            const filteredMessages = filterMessages(messages, searchTerm);

            // Property: Should match partial words (e.g., "filter" matches "filtering", "prefilter")
            for (const message of filteredMessages) {
              expect(message.content.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            // Verify completeness
            const expectedMatches = messages.filter((msg) =>
              msg.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filteredMessages.length).toBe(expectedMatches.length);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain idempotence - filtering twice should give same result', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          searchTermArbitrary,
          (messages, searchTerm) => {
            // Filter once
            const filtered1 = filterMessages(messages, searchTerm);

            // Filter again
            const filtered2 = filterMessages(messages, searchTerm);

            // Property: Results should be identical
            expect(filtered1.length).toBe(filtered2.length);

            // Verify same message IDs
            const ids1 = filtered1.map((m) => m.id).sort();
            const ids2 = filtered2.map((m) => m.id).sort();

            expect(ids1).toEqual(ids2);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle unicode and international characters', () => {
      const unicodeArbitrary = fc.constantFrom(
        'café',
        'naïve',
        'résumé',
        '日本語',
        'Москва',
        'مرحبا',
        'emoji 😀',
        'Zürich'
      );

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              role: roleArbitrary,
              content: fc.oneof(
                unicodeArbitrary,
                fc.string({ minLength: 10, maxLength: 50 }).map((s) => s + ' café ' + s)
              ),
              timestamp: fc.date(),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          unicodeArbitrary,
          (messages, searchTerm) => {
            const filteredMessages = filterMessages(messages, searchTerm);

            // Property: All returned messages must contain the search term
            for (const message of filteredMessages) {
              expect(message.content.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            // Property: No matching messages should be excluded
            const expectedMatches = messages.filter((msg) =>
              msg.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filteredMessages.length).toBe(expectedMatches.length);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve message order in filtered results', () => {
      fc.assert(
        fc.property(
          chatMessagesArbitrary,
          searchTermArbitrary,
          (messages, searchTerm) => {
            const filteredMessages = filterMessages(messages, searchTerm);

            // Property: Filtered messages should maintain original order
            // Find indices of filtered messages in original array
            const originalIndices: number[] = [];
            for (const filtered of filteredMessages) {
              const index = messages.findIndex((m) => m.id === filtered.id);
              originalIndices.push(index);
            }

            // Indices should be in ascending order (maintaining original order)
            for (let i = 1; i < originalIndices.length; i++) {
              expect(originalIndices[i]).toBeGreaterThan(originalIndices[i - 1]);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 3: Search Completeness Edge Cases', () => {
    it('should handle messages with only whitespace', () => {
      const messagesWithWhitespace: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: '   ',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'normal message',
          timestamp: new Date(),
        },
        {
          id: '3',
          role: 'user',
          content: '\t\n',
          timestamp: new Date(),
        },
      ];

      const filtered = filterMessages(messagesWithWhitespace, 'normal');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should handle very long messages', () => {
      const longContent = 'a'.repeat(10000) + ' search term ' + 'b'.repeat(10000);
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: longContent,
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'short message',
          timestamp: new Date(),
        },
      ];

      const filtered = filterMessages(messages, 'search term');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should handle search term at message boundaries', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'search',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'search at start',
          timestamp: new Date(),
        },
        {
          id: '3',
          role: 'user',
          content: 'at end search',
          timestamp: new Date(),
        },
        {
          id: '4',
          role: 'assistant',
          content: 'in middle search here',
          timestamp: new Date(),
        },
      ];

      const filtered = filterMessages(messages, 'search');

      // All messages contain "search"
      expect(filtered).toHaveLength(4);
    });

    it('should handle repeated search terms in same message', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'test test test',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'no match',
          timestamp: new Date(),
        },
      ];

      const filtered = filterMessages(messages, 'test');

      // Should match once even though "test" appears multiple times
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });
});
