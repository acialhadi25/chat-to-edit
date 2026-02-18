/**
 * Property-Based Testing Configuration
 *
 * This file contains configuration and utilities for property-based testing
 * using fast-check library. All property tests should use these configurations
 * to ensure consistency across the test suite.
 */

import fc from 'fast-check';

/**
 * Standard configuration for property-based tests
 * Minimum 100 iterations as per requirements 9.1, 9.2
 */
export const PROPERTY_TEST_CONFIG: fc.Parameters<unknown> = {
  numRuns: 100,
  verbose: true,
  seed: undefined, // Random seed for reproducibility
  path: undefined, // Path for shrinking
  endOnFailure: false, // Continue running all tests even if one fails
};

/**
 * Extended configuration for more thorough testing
 * Use this for critical functionality that needs extra validation
 */
export const EXTENDED_PROPERTY_TEST_CONFIG: fc.Parameters<unknown> = {
  numRuns: 500,
  verbose: true,
  seed: undefined,
  path: undefined,
  endOnFailure: false,
};

/**
 * Quick configuration for development/debugging
 * Fewer iterations for faster feedback during development
 */
export const QUICK_PROPERTY_TEST_CONFIG: fc.Parameters<unknown> = {
  numRuns: 20,
  verbose: true,
  seed: undefined,
  path: undefined,
  endOnFailure: true,
};
