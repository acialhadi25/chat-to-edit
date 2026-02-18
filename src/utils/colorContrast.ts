/**
 * Color Contrast Utilities
 *
 * Utilities for calculating color contrast ratios according to WCAG 2.1 guidelines.
 * WCAG AA requires:
 * - 4.5:1 for normal text (< 18pt or < 14pt bold)
 * - 3:1 for large text (>= 18pt or >= 14pt bold)
 * - 3:1 for UI components and graphical objects
 */

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const l1 = getRelativeLuminance(...color1);
  const l2 = getRelativeLuminance(...color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse HSL color string to RGB
 */
export function parseHslToRgb(hsl: string): [number, number, number] {
  // Parse "145 63% 32%" format
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) {
    throw new Error(`Invalid HSL format: ${hsl}`);
  }

  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const l = parseInt(match[3], 10);

  return hslToRgb(h, s, l);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
}

/**
 * Audit color combinations from design system
 */
export interface ColorAuditResult {
  name: string;
  foreground: string;
  background: string;
  contrastRatio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendation?: string;
}

/**
 * Audit a color combination
 */
export function auditColorCombination(
  name: string,
  foregroundHsl: string,
  backgroundHsl: string,
  isLargeText: boolean = false
): ColorAuditResult {
  const fg = parseHslToRgb(foregroundHsl);
  const bg = parseHslToRgb(backgroundHsl);
  const ratio = getContrastRatio(fg, bg);

  const result: ColorAuditResult = {
    name,
    foreground: foregroundHsl,
    background: backgroundHsl,
    contrastRatio: ratio,
    meetsAA: meetsWCAGAA(ratio, isLargeText),
    meetsAAA: meetsWCAGAAA(ratio, isLargeText),
  };

  if (!result.meetsAA) {
    result.recommendation = `Increase contrast to at least ${isLargeText ? '3:1' : '4.5:1'} for WCAG AA compliance`;
  }

  return result;
}
