/**
 * Unit Tests for JSON Parser Logging
 *
 * This file contains unit tests for the logParseResult function
 * to ensure proper structured logging of parse results.
 *
 * Feature: chat-excel-command-improvement
 * Task: 2.7 Add logging untuk parse results
 * Requirements: 1.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logParseResult, ParseResult } from '../jsonParser';

describe('logParseResult', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('Fallback logging', () => {
    it('should log warning when parsing fails with fallback', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: 'invalid json {',
        parseMethod: 'fallback',
        error: 'Could not parse JSON, using fallback',
        warnings: ['Direct parse failed: Unexpected end of JSON input'],
      };

      logParseResult(parseResult, 'Test Context');

      // Should call console.warn
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      // Verify the logged data structure
      const loggedData = consoleWarnSpy.mock.calls[0];
      expect(loggedData[0]).toBe('JSON Parse Fallback (Test Context):');
      expect(loggedData[1]).toMatchObject({
        method: 'fallback',
        error: 'Could not parse JSON, using fallback',
        warnings: ['Direct parse failed: Unexpected end of JSON input'],
        originalLength: 14,
      });
      expect((loggedData[1] as any).originalPreview).toBe('invalid json {');
    });

    it('should truncate long original text in preview', () => {
      const longText = 'a'.repeat(200);
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: longText,
        parseMethod: 'fallback',
        error: 'Could not parse JSON',
        warnings: ['Parse failed'],
      };

      logParseResult(parseResult, 'Long Text');

      const loggedData = consoleWarnSpy.mock.calls[0][1] as any;
      expect(loggedData.originalPreview).toBe('a'.repeat(100));
      expect(loggedData.originalPreview.length).toBe(100);
      expect(loggedData.originalLength).toBe(200);
    });

    it('should include all warnings in fallback log', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: 'bad json',
        parseMethod: 'fallback',
        error: 'All strategies failed',
        warnings: [
          'Direct parse failed: Unexpected token',
          'No JSON object or array pattern found',
          'Brace-counting extraction found no valid JSON',
          'All parsing strategies failed, using fallback',
        ],
      };

      logParseResult(parseResult, 'Multiple Warnings');

      const loggedData = consoleWarnSpy.mock.calls[0][1] as any;
      expect(loggedData.warnings).toHaveLength(4);
      expect(loggedData.warnings).toEqual(parseResult.warnings);
    });
  });

  describe('Extracted/Regex method logging', () => {
    it('should log info when parsing succeeds with extracted method', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: 'Here is the JSON: {"content": "test"}',
        parseMethod: 'extracted',
        warnings: ['JSON extracted from text with surrounding commentary'],
      };

      logParseResult(parseResult, 'Extracted JSON');

      // Should call console.info
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Verify the logged data
      const loggedData = consoleInfoSpy.mock.calls[0];
      expect(loggedData[0]).toBe('JSON Parse Success with fallback (Extracted JSON):');
      expect(loggedData[1]).toMatchObject({
        method: 'extracted',
        warnings: ['JSON extracted from text with surrounding commentary'],
        originalLength: 37,
      });
    });

    it('should log info when parsing succeeds with regex method', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: 'Some text {"content": "test"} more text',
        parseMethod: 'regex',
        warnings: ['JSON found using brace-counting extraction'],
      };

      logParseResult(parseResult, 'Regex Extraction');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      const loggedData = consoleInfoSpy.mock.calls[0][1] as any;
      expect(loggedData.method).toBe('regex');
      expect(loggedData.warnings).toEqual(['JSON found using brace-counting extraction']);
    });

    it('should log info even when warnings array is empty', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: '{"content": "test"}',
        parseMethod: 'extracted',
        warnings: [],
      };

      logParseResult(parseResult, 'Empty Warnings');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const loggedData = consoleInfoSpy.mock.calls[0][1] as any;
      expect(loggedData.warnings).toEqual([]);
    });
  });

  describe('Direct parsing (no logging)', () => {
    it('should not log anything when parsing succeeds with direct method', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: '{"content": "test"}',
        parseMethod: 'direct',
      };

      logParseResult(parseResult, 'Direct Parse');

      // Should not log anything for direct successful parsing
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should not log when direct parsing has no warnings', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: '{"content": "test"}',
        parseMethod: 'direct',
        warnings: undefined,
      };

      logParseResult(parseResult, 'Direct No Warnings');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('Context parameter', () => {
    it('should include context in log message', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: 'bad',
        parseMethod: 'fallback',
        error: 'Parse failed',
        warnings: ['Error'],
      };

      logParseResult(parseResult, 'Excel Chat');

      const logMessage = consoleWarnSpy.mock.calls[0][0];
      expect(logMessage).toContain('Excel Chat');
      expect(logMessage).toBe('JSON Parse Fallback (Excel Chat):');
    });

    it('should handle different context strings', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: 'text {"content": "test"}',
        parseMethod: 'extracted',
        warnings: ['Extracted'],
      };

      const contexts = ['API Response', 'User Input', 'Stream Handler', 'Command Executor'];

      contexts.forEach((context) => {
        consoleInfoSpy.mockClear();
        logParseResult(parseResult, context);

        const logMessage = consoleInfoSpy.mock.calls[0][0] as string;
        expect(logMessage).toContain(context);
      });
    });
  });

  describe('Structured logging format', () => {
    it('should include all required fields in fallback log', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: 'invalid',
        parseMethod: 'fallback',
        error: 'Parse error',
        warnings: ['Warning 1', 'Warning 2'],
      };

      logParseResult(parseResult, 'Test');

      const loggedData = consoleWarnSpy.mock.calls[0][1] as any;

      // Verify all required fields are present
      expect(loggedData).toHaveProperty('method');
      expect(loggedData).toHaveProperty('error');
      expect(loggedData).toHaveProperty('warnings');
      expect(loggedData).toHaveProperty('originalLength');
      expect(loggedData).toHaveProperty('originalPreview');

      // Verify field types
      expect(typeof loggedData.method).toBe('string');
      expect(typeof loggedData.error).toBe('string');
      expect(Array.isArray(loggedData.warnings)).toBe(true);
      expect(typeof loggedData.originalLength).toBe('number');
      expect(typeof loggedData.originalPreview).toBe('string');
    });

    it('should include all required fields in success log', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: true,
        data: { content: 'test' },
        originalText: 'text {"content": "test"}',
        parseMethod: 'extracted',
        warnings: ['Extracted from text'],
      };

      logParseResult(parseResult, 'Test');

      const loggedData = consoleInfoSpy.mock.calls[0][1] as any;

      // Verify required fields for success log
      expect(loggedData).toHaveProperty('method');
      expect(loggedData).toHaveProperty('warnings');
      expect(loggedData).toHaveProperty('originalLength');

      expect(loggedData.method).toBe('extracted');
      expect(Array.isArray(loggedData.warnings)).toBe(true);
      expect(typeof loggedData.originalLength).toBe('number');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty original text', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: '',
        parseMethod: 'fallback',
        error: 'Empty input',
        warnings: ['No content'],
      };

      logParseResult(parseResult, 'Empty');

      const loggedData = consoleWarnSpy.mock.calls[0][1] as any;
      expect(loggedData.originalLength).toBe(0);
      expect(loggedData.originalPreview).toBe('');
    });

    it('should handle undefined warnings gracefully', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: 'test',
        parseMethod: 'fallback',
        error: 'Error',
        warnings: undefined,
      };

      logParseResult(parseResult, 'No Warnings');

      const loggedData = consoleWarnSpy.mock.calls[0][1] as any;
      expect(loggedData.warnings).toBeUndefined();
    });

    it('should handle very short text without truncation', () => {
      const parseResult: ParseResult<{ content: string }> = {
        success: false,
        data: { content: 'fallback' },
        originalText: 'abc',
        parseMethod: 'fallback',
        error: 'Error',
        warnings: ['Failed'],
      };

      logParseResult(parseResult, 'Short');

      const loggedData = consoleWarnSpy.mock.calls[0][1] as any;
      expect(loggedData.originalPreview).toBe('abc');
      expect(loggedData.originalLength).toBe(3);
    });
  });
});
