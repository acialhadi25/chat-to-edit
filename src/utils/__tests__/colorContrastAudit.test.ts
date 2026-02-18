/**
 * Color Contrast Audit
 *
 * This test audits all color combinations in the design system
 * to ensure they meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
 */

import { describe, it, expect } from 'vitest';
import { auditColorCombination, type ColorAuditResult } from '../colorContrast';

describe('Color Contrast Audit', () => {
  // Light theme colors from index.css
  const lightTheme = {
    background: '0 0% 100%',
    foreground: '150 10% 15%',
    card: '0 0% 100%',
    cardForeground: '150 10% 15%',
    primary: '145 63% 32%',
    primaryForeground: '0 0% 100%',
    secondary: '145 10% 96%',
    secondaryForeground: '145 10% 15%',
    muted: '145 10% 96%',
    mutedForeground: '145 10% 38%',
    accent: '145 50% 95%',
    accentForeground: '145 63% 28%',
    destructive: '0 84% 50%',
    destructiveForeground: '0 0% 100%',
    success: '142 76% 30%',
    successForeground: '0 0% 100%',
    warning: '38 92% 33%',
    warningForeground: '0 0% 100%',
    border: '145 10% 89%',
    input: '145 10% 89%',
  };

  // Dark theme colors from index.css
  const darkTheme = {
    background: '145 10% 10%',
    foreground: '145 10% 93%',
    card: '145 10% 13%',
    cardForeground: '145 10% 93%',
    primary: '145 63% 65%',
    primaryForeground: '145 10% 10%',
    secondary: '145 10% 18%',
    secondaryForeground: '145 10% 93%',
    muted: '145 10% 18%',
    mutedForeground: '145 10% 60%',
    accent: '145 15% 20%',
    accentForeground: '145 63% 65%',
    destructive: '0 62% 50%',
    destructiveForeground: '0 0% 100%',
    success: '142 69% 70%',
    successForeground: '145 10% 10%',
    warning: '38 92% 70%',
    warningForeground: '145 10% 10%',
    border: '145 10% 20%',
    input: '145 10% 20%',
  };

  it('should audit light theme color combinations', () => {
    const results: ColorAuditResult[] = [
      auditColorCombination('Body text', lightTheme.foreground, lightTheme.background),
      auditColorCombination('Card text', lightTheme.cardForeground, lightTheme.card),
      auditColorCombination('Primary button', lightTheme.primaryForeground, lightTheme.primary),
      auditColorCombination('Secondary text', lightTheme.secondaryForeground, lightTheme.secondary),
      auditColorCombination('Muted text', lightTheme.mutedForeground, lightTheme.muted),
      auditColorCombination('Accent text', lightTheme.accentForeground, lightTheme.accent),
      auditColorCombination(
        'Destructive button',
        lightTheme.destructiveForeground,
        lightTheme.destructive
      ),
      auditColorCombination('Success button', lightTheme.successForeground, lightTheme.success),
      auditColorCombination('Warning button', lightTheme.warningForeground, lightTheme.warning),
    ];

    console.log('\n=== Light Theme Color Contrast Audit ===');
    results.forEach((result) => {
      const status = result.meetsAA ? '✓ PASS' : '✗ FAIL';
      console.log(
        `${status} ${result.name}: ${result.contrastRatio.toFixed(2)}:1 ${
          result.recommendation ? `(${result.recommendation})` : ''
        }`
      );
    });

    // Check that all combinations meet WCAG AA
    const failures = results.filter((r) => !r.meetsAA);
    expect(
      failures.length,
      `${failures.length} color combinations fail WCAG AA: ${failures.map((f) => f.name).join(', ')}`
    ).toBe(0);
  });

  it('should audit dark theme color combinations', () => {
    const results: ColorAuditResult[] = [
      auditColorCombination('Body text', darkTheme.foreground, darkTheme.background),
      auditColorCombination('Card text', darkTheme.cardForeground, darkTheme.card),
      auditColorCombination('Primary button', darkTheme.primaryForeground, darkTheme.primary),
      auditColorCombination('Secondary text', darkTheme.secondaryForeground, darkTheme.secondary),
      auditColorCombination('Muted text', darkTheme.mutedForeground, darkTheme.muted),
      auditColorCombination('Accent text', darkTheme.accentForeground, darkTheme.accent),
      auditColorCombination(
        'Destructive button',
        darkTheme.destructiveForeground,
        darkTheme.destructive
      ),
      auditColorCombination('Success button', darkTheme.successForeground, darkTheme.success),
      auditColorCombination('Warning button', darkTheme.warningForeground, darkTheme.warning),
    ];

    console.log('\n=== Dark Theme Color Contrast Audit ===');
    results.forEach((result) => {
      const status = result.meetsAA ? '✓ PASS' : '✗ FAIL';
      console.log(
        `${status} ${result.name}: ${result.contrastRatio.toFixed(2)}:1 ${
          result.recommendation ? `(${result.recommendation})` : ''
        }`
      );
    });

    // Check that all combinations meet WCAG AA
    const failures = results.filter((r) => !r.meetsAA);
    expect(
      failures.length,
      `${failures.length} color combinations fail WCAG AA: ${failures.map((f) => f.name).join(', ')}`
    ).toBe(0);
  });

  it('should verify primary color has sufficient contrast', () => {
    const lightResult = auditColorCombination(
      'Primary button (light)',
      lightTheme.primaryForeground,
      lightTheme.primary
    );
    expect(lightResult.meetsAA).toBe(true);
    expect(lightResult.contrastRatio).toBeGreaterThanOrEqual(4.5);

    const darkResult = auditColorCombination(
      'Primary button (dark)',
      darkTheme.primaryForeground,
      darkTheme.primary
    );
    expect(darkResult.meetsAA).toBe(true);
    expect(darkResult.contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should verify destructive color has sufficient contrast', () => {
    const lightResult = auditColorCombination(
      'Destructive button (light)',
      lightTheme.destructiveForeground,
      lightTheme.destructive
    );
    expect(lightResult.meetsAA).toBe(true);

    const darkResult = auditColorCombination(
      'Destructive button (dark)',
      darkTheme.destructiveForeground,
      darkTheme.destructive
    );
    expect(darkResult.meetsAA).toBe(true);
  });

  it('should verify success color has sufficient contrast', () => {
    const lightResult = auditColorCombination(
      'Success button (light)',
      lightTheme.successForeground,
      lightTheme.success
    );
    expect(lightResult.meetsAA).toBe(true);

    const darkResult = auditColorCombination(
      'Success button (dark)',
      darkTheme.successForeground,
      darkTheme.success
    );
    expect(darkResult.meetsAA).toBe(true);
  });

  it('should verify warning color has sufficient contrast', () => {
    const lightResult = auditColorCombination(
      'Warning button (light)',
      lightTheme.warningForeground,
      lightTheme.warning
    );
    expect(lightResult.meetsAA).toBe(true);

    const darkResult = auditColorCombination(
      'Warning button (dark)',
      darkTheme.warningForeground,
      darkTheme.warning
    );
    expect(darkResult.meetsAA).toBe(true);
  });
});
