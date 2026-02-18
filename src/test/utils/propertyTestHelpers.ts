/**
 * Property Test Helper Functions
 *
 * This file contains helper functions and utilities for writing
 * property-based tests. These helpers make it easier to write
 * consistent and readable property tests.
 *
 * Requirements: 9.3, 9.4
 */

import { expect } from 'vitest';

/**
 * Assert that a value is a valid JSON string
 */
export function assertValidJson(value: string): void {
  expect(() => JSON.parse(value)).not.toThrow();
}

/**
 * Assert that two objects are deeply equal
 */
export function assertDeepEqual<T>(actual: T, expected: T): void {
  expect(actual).toEqual(expected);
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined): asserts value is T {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
}

/**
 * Assert that an object has all required properties
 */
export function assertHasProperties<T extends object>(obj: T, properties: (keyof T)[]): void {
  for (const prop of properties) {
    expect(obj).toHaveProperty(String(prop));
  }
}

/**
 * Assert that a string contains a substring
 */
export function assertContains(haystack: string, needle: string): void {
  expect(haystack).toContain(needle);
}

/**
 * Assert that a string matches a regex pattern
 */
export function assertMatches(value: string, pattern: RegExp): void {
  expect(value).toMatch(pattern);
}

/**
 * Assert that an array contains an element
 */
export function assertArrayContains<T>(array: T[], element: T): void {
  expect(array).toContain(element);
}

/**
 * Assert that an array has a specific length
 */
export function assertArrayLength<T>(array: T[], length: number): void {
  expect(array).toHaveLength(length);
}

/**
 * Assert that a value is within a range
 */
export function assertInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that a function throws an error
 */
export function assertThrows(fn: () => void, errorMessage?: string): void {
  if (errorMessage) {
    expect(fn).toThrow(errorMessage);
  } else {
    expect(fn).toThrow();
  }
}

/**
 * Assert that a function does not throw an error
 */
export function assertDoesNotThrow(fn: () => void): void {
  expect(fn).not.toThrow();
}

/**
 * Assert that a value is truthy
 */
export function assertTruthy(value: unknown): void {
  expect(value).toBeTruthy();
}

/**
 * Assert that a value is falsy
 */
export function assertFalsy(value: unknown): void {
  expect(value).toBeFalsy();
}

/**
 * Assert that an object matches a partial structure
 */
export function assertMatchesPartial<T extends object>(actual: T, expected: Partial<T>): void {
  expect(actual).toMatchObject(expected);
}

/**
 * Assert that a string is a valid hex color code
 */
export function assertValidHexColor(color: string): void {
  assertMatches(color, /^#[0-9A-Fa-f]{6}$/);
}

/**
 * Assert that a string is a valid cell reference (e.g., A1, B5, AA100)
 */
export function assertValidCellRef(ref: string): void {
  assertMatches(ref, /^[A-Z]+\d+$/);
}

/**
 * Assert that a string is a valid range reference (e.g., A1:B10)
 */
export function assertValidRangeRef(ref: string): void {
  assertMatches(ref, /^[A-Z]+\d+:[A-Z]+\d+$/);
}

/**
 * Assert that a string is a valid column reference (e.g., A, B, AA)
 */
export function assertValidColumnRef(ref: string): void {
  assertMatches(ref, /^[A-Z]+$/);
}

/**
 * Assert that a value is one of the allowed values
 */
export function assertOneOf<T>(value: T, allowedValues: T[]): void {
  expect(allowedValues).toContain(value);
}

/**
 * Assert that an action object has the required structure
 */
export function assertValidActionObject(action: unknown): void {
  expect(action).toBeDefined();
  expect(typeof action).toBe('object');
  expect(action).not.toBeNull();
  expect(action).toHaveProperty('type');
}

/**
 * Assert that a target object has the required structure
 */
export function assertValidTarget(target: unknown): void {
  expect(target).toBeDefined();
  expect(typeof target).toBe('object');
  expect(target).not.toBeNull();
  expect(target).toHaveProperty('type');
  expect(target).toHaveProperty('ref');
}

/**
 * Assert that a changes array has the required structure
 */
export function assertValidChanges(changes: unknown): void {
  expect(Array.isArray(changes)).toBe(true);
  const changesArray = changes as unknown[];

  for (const change of changesArray) {
    expect(typeof change).toBe('object');
    expect(change).not.toBeNull();
    expect(change).toHaveProperty('cellRef');
    expect(change).toHaveProperty('before');
    expect(change).toHaveProperty('after');
    expect(change).toHaveProperty('type');
  }
}

/**
 * Assert that a parse result has the expected structure
 */
export function assertValidParseResult<T>(result: unknown): void {
  expect(result).toBeDefined();
  expect(typeof result).toBe('object');
  expect(result).not.toBeNull();
  expect(result).toHaveProperty('success');
  expect(result).toHaveProperty('data');
  expect(result).toHaveProperty('originalText');
  expect(result).toHaveProperty('parseMethod');
}

/**
 * Assert that a validation result has the expected structure
 */
export function assertValidValidationResult(result: unknown): void {
  expect(result).toBeDefined();
  expect(typeof result).toBe('object');
  expect(result).not.toBeNull();
  expect(result).toHaveProperty('valid');
}

/**
 * Helper to run a property test with custom configuration
 * @deprecated Use fc.assert directly instead
 */
export function runPropertyTest<T>(
  _name: string,
  _arbitrary: any,
  _predicate: (value: T) => void | boolean,
  _config?: any
): void {
  // This is a helper function for documentation purposes
  // Actual usage should directly use fc.assert
}

/**
 * Helper to create a property test that should always pass
 * @deprecated Use fc.property directly instead
 */
export function createInvariantTest<T>(
  _arbitrary: any,
  _invariant: (value: T) => boolean,
  _errorMessage?: string
): any {
  // This is a helper function for documentation purposes
  // Actual usage should directly use fc.property
  return null;
}

/**
 * Helper to create a property test that checks for exceptions
 * @deprecated Use fc.property directly instead
 */
export function createExceptionTest<T>(
  _arbitrary: any,
  _fn: (value: any) => void,
  _shouldThrow: boolean = false
): any {
  // This is a helper function for documentation purposes
  // Actual usage should directly use fc.property
  return null;
}
