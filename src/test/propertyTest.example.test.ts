/**
 * Example Property-Based Test
 *
 * This file demonstrates how to write property-based tests using
 * the testing infrastructure and utilities we've set up.
 *
 * This example can be used as a template for writing actual property tests
 * for the chat-excel-command-improvement feature.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PROPERTY_TEST_CONFIG } from './utils/propertyTestConfig';
import {
  actionObjectArb,
  aiResponseArb,
  validJsonArb,
  dataTransformActionArb,
  findReplaceActionArb,
} from './utils/generators';
import {
  assertValidJson,
  assertDeepEqual,
  assertHasProperties,
  assertValidActionObject,
} from './utils/propertyTestHelpers';

describe('Property-Based Testing Examples', () => {
  describe('JSON Parsing Properties', () => {
    it('Property: Valid JSON can be parsed and stringified back', () => {
      fc.assert(
        fc.property(aiResponseArb, (response) => {
          // Stringify the response
          const jsonString = JSON.stringify(response);

          // Parse it back
          const parsed = JSON.parse(jsonString);

          // JSON.stringify removes undefined values and doesn't distinguish -0 from 0
          // So we normalize the original response the same way
          const normalized = JSON.parse(JSON.stringify(response));

          // Should be equal to normalized original
          assertDeepEqual(parsed, normalized);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property: Valid JSON strings can be parsed without errors', () => {
      fc.assert(
        fc.property(validJsonArb, (jsonString) => {
          // Should not throw
          expect(() => JSON.parse(jsonString)).not.toThrow();

          // Should return an object
          const parsed = JSON.parse(jsonString);
          expect(typeof parsed).toBe('object');
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Action Object Properties', () => {
    it('Property: All action objects have a type field', () => {
      fc.assert(
        fc.property(actionObjectArb, (action) => {
          assertValidActionObject(action);
          expect(action.type).toBeDefined();
          expect(typeof action.type).toBe('string');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property: DATA_TRANSFORM actions have required fields', () => {
      fc.assert(
        fc.property(dataTransformActionArb, (action) => {
          assertHasProperties(action, ['type', 'transformType', 'target']);
          expect(action.type).toBe('DATA_TRANSFORM');
          expect(['uppercase', 'lowercase', 'titlecase']).toContain(action.transformType);
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property: FIND_REPLACE actions have required fields', () => {
      fc.assert(
        fc.property(findReplaceActionArb, (action) => {
          assertHasProperties(action, ['type', 'findValue', 'replaceValue']);
          expect(action.type).toBe('FIND_REPLACE');
          expect(typeof action.findValue).toBe('string');
          expect(typeof action.replaceValue).toBe('string');
        }),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Generator Validation', () => {
    it('Generators produce valid data structures', () => {
      // Test that generators don't throw errors
      expect(() => fc.sample(actionObjectArb, 10)).not.toThrow();
      expect(() => fc.sample(aiResponseArb, 10)).not.toThrow();
      expect(() => fc.sample(validJsonArb, 10)).not.toThrow();
    });

    it('Generated JSON is always valid', () => {
      const samples = fc.sample(validJsonArb, 100);

      for (const jsonString of samples) {
        assertValidJson(jsonString);
      }
    });
  });
});
