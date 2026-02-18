/**
 * Accessibility Testing Utilities
 *
 * Utilities for testing accessibility compliance using axe-core.
 * These helpers integrate jest-axe with our testing setup.
 */

import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Configure axe-core with custom rules
 *
 * This configuration:
 * - Enables all WCAG 2.1 Level A and AA rules
 * - Disables some rules that may cause false positives in test environments
 */
export const axe = configureAxe({
  rules: {
    // Enable WCAG 2.1 Level A and AA rules
    'color-contrast': { enabled: true },
    'valid-lang': { enabled: true },
    'html-has-lang': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    region: { enabled: true },

    // Disable rules that may cause false positives in test environments
    'document-title': { enabled: false }, // Not applicable in component tests
    'html-lang-valid': { enabled: false }, // Not applicable in component tests
  },
});

/**
 * Run accessibility tests on a container element
 *
 * @param container - The HTML element to test
 * @param options - Optional axe configuration
 * @returns Promise resolving to axe results
 *
 * @example
 * ```ts
 * const { container } = render(<MyComponent />);
 * const results = await runA11yTests(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function runA11yTests(container: Element, options?: Parameters<typeof axe>[1]) {
  return await axe(container, options);
}

/**
 * Assert that a component has no accessibility violations
 *
 * @param container - The HTML element to test
 * @param options - Optional axe configuration
 *
 * @example
 * ```ts
 * const { container } = render(<MyComponent />);
 * await expectNoA11yViolations(container);
 * ```
 */
export async function expectNoA11yViolations(
  container: Element,
  options?: Parameters<typeof axe>[1]
) {
  const results = await axe(container, options);
  expect(results).toHaveNoViolations();
}

/**
 * Get a summary of accessibility violations
 *
 * @param container - The HTML element to test
 * @returns Promise resolving to a summary of violations
 *
 * @example
 * ```ts
 * const { container } = render(<MyComponent />);
 * const summary = await getA11yViolationsSummary(container);
 * console.log(summary);
 * ```
 */
export async function getA11yViolationsSummary(container: Element) {
  const results = await axe(container);

  if (results.violations.length === 0) {
    return 'No accessibility violations found!';
  }

  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    nodes: violation.nodes.length,
    helpUrl: violation.helpUrl,
  }));
}

/**
 * Check if a specific accessibility rule passes
 *
 * @param container - The HTML element to test
 * @param ruleId - The axe rule ID to check
 * @returns Promise resolving to true if the rule passes
 *
 * @example
 * ```ts
 * const { container } = render(<MyComponent />);
 * const passes = await checkA11yRule(container, "color-contrast");
 * expect(passes).toBe(true);
 * ```
 */
export async function checkA11yRule(container: Element, ruleId: string): Promise<boolean> {
  const results = await axe(container, {
    rules: {
      [ruleId]: { enabled: true },
    },
  });

  const violation = results.violations.find((v) => v.id === ruleId);
  return !violation;
}
