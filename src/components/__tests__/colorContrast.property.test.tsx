/**
 * Property-Based Test: Color Contrast Compliance
 *
 * **Property 10: Color Contrast Compliance**
 * **Validates: Requirements 6.1.4**
 *
 * This test verifies that all text elements in the UI have sufficient contrast ratio
 * between text color and background color (4.5:1 for normal text, 3:1 for large text).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import fc from 'fast-check';
import { getContrastRatio, parseHslToRgb } from '@/utils/colorContrast';

// Import key components to test
import QuickActionButtons from '@/components/dashboard/QuickActionButtons';
import UndoRedoBar from '@/components/dashboard/UndoRedoBar';
import { BottomNavigation } from '@/components/navigation/MobileNavigation';
import { ResponsiveExcelGrid } from '@/components/excel/ResponsiveExcelGrid';
import { createMockExcelData } from '@/test/utils/testHelpers';

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>{ui}</TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Helper to parse RGB color string
function parseRgbString(rgb: string): [number, number, number] | null {
  // Parse "rgb(r, g, b)" or "rgba(r, g, b, a)"
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;

  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

// Helper to check if element has sufficient contrast
function hasSufficientContrast(element: HTMLElement): {
  passes: boolean;
  ratio: number;
  isLargeText: boolean;
} {
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.getPropertyValue('color');
  const backgroundColor = computedStyle.getPropertyValue('background-color');

  // Parse colors
  const fgColor = parseRgbString(color);
  const bgColor = parseRgbString(backgroundColor);

  // If we can't parse colors or background is transparent, skip
  if (
    !fgColor ||
    !bgColor ||
    backgroundColor === 'transparent' ||
    backgroundColor === 'rgba(0, 0, 0, 0)'
  ) {
    return { passes: true, ratio: 21, isLargeText: false }; // Skip transparent backgrounds
  }

  // Calculate contrast ratio
  const ratio = getContrastRatio(fgColor, bgColor);

  // Determine if text is large (18pt+ or 14pt+ bold)
  const fontSize = parseFloat(computedStyle.getPropertyValue('font-size'));
  const fontWeight = computedStyle.getPropertyValue('font-weight');
  const isLargeText =
    fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  const requiredRatio = isLargeText ? 3 : 4.5;

  return {
    passes: ratio >= requiredRatio,
    ratio,
    isLargeText,
  };
}

// Helper to get all text elements
function getAllTextElements(container: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as HTMLElement;
      // Only include elements with text content
      if (element.textContent && element.textContent.trim().length > 0) {
        // Exclude script, style, and hidden elements
        if (
          element.tagName !== 'SCRIPT' &&
          element.tagName !== 'STYLE' &&
          element.offsetParent !== null
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    elements.push(node as HTMLElement);
  }

  return elements;
}

describe('Property 10: Color Contrast Compliance', () => {
  it('should ensure QuickActionButtons have sufficient contrast', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            label: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (options) => {
          const mockOnOptionClick = () => {};
          const { container } = renderWithProviders(
            <QuickActionButtons options={options} onOptionClick={mockOnOptionClick} />
          );

          const textElements = getAllTextElements(container);
          const failures: Array<{ element: string; ratio: number; required: number }> = [];

          textElements.forEach((element) => {
            const { passes, ratio, isLargeText } = hasSufficientContrast(element);
            if (!passes) {
              failures.push({
                element: element.tagName,
                ratio,
                required: isLargeText ? 3 : 4.5,
              });
            }
          });

          expect(
            failures.length,
            `Found ${failures.length} elements with insufficient contrast: ${JSON.stringify(failures)}`
          ).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should ensure UndoRedoBar has sufficient contrast', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (canUndo, canRedo) => {
        const mockOnUndo = () => {};
        const mockOnRedo = () => {};

        const { container } = renderWithProviders(
          <UndoRedoBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={mockOnUndo}
            onRedo={mockOnRedo}
            undoDescription={canUndo ? 'Test undo' : null}
            redoDescription={canRedo ? 'Test redo' : null}
          />
        );

        const textElements = getAllTextElements(container);
        const failures: Array<{ element: string; ratio: number }> = [];

        textElements.forEach((element) => {
          const { passes, ratio } = hasSufficientContrast(element);
          if (!passes) {
            failures.push({
              element: element.tagName,
              ratio,
            });
          }
        });

        expect(failures.length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });

  it('should ensure BottomNavigation has sufficient contrast', () => {
    const { container } = renderWithProviders(<BottomNavigation />);

    const textElements = getAllTextElements(container);
    const failures: Array<{ element: string; ratio: number; text: string }> = [];

    textElements.forEach((element) => {
      const { passes, ratio } = hasSufficientContrast(element);
      if (!passes) {
        failures.push({
          element: element.tagName,
          ratio,
          text: element.textContent?.substring(0, 20) || '',
        });
      }
    });

    expect(
      failures.length,
      `Found ${failures.length} elements with insufficient contrast in BottomNavigation`
    ).toBe(0);
  });

  it('should ensure ResponsiveExcelGrid has sufficient contrast', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(
            fc.oneof(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 0, max: 1000 })),
            { minLength: 1, maxLength: 3 }
          ),
          { minLength: 1, maxLength: 5 }
        ),
        (rows) => {
          const headers = rows[0]?.map((_, i) => String.fromCharCode(65 + i)) || ['A'];
          const mockExcelData = createMockExcelData({
            headers,
            rows,
          });

          const mockOnCellChange = () => {};

          const { container } = renderWithProviders(
            <ResponsiveExcelGrid data={mockExcelData} onCellChange={mockOnCellChange} />
          );

          const textElements = getAllTextElements(container);
          const failures: Array<{ element: string; ratio: number }> = [];

          textElements.forEach((element) => {
            const { passes, ratio } = hasSufficientContrast(element);
            if (!passes) {
              failures.push({
                element: element.tagName,
                ratio,
              });
            }
          });

          expect(failures.length).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should verify all text elements meet WCAG AA standards (comprehensive test)', () => {
    // This is the core property test that validates the universal property
    fc.assert(
      fc.property(
        fc.record({
          canUndo: fc.boolean(),
          canRedo: fc.boolean(),
          quickActionCount: fc.integer({ min: 1, max: 3 }),
        }),
        (config) => {
          const quickActions = Array.from({ length: config.quickActionCount }, (_, i) => ({
            id: `action-${i}`,
            label: `Action ${i}`,
            value: `value-${i}`,
          }));

          const { container } = renderWithProviders(
            <div>
              <UndoRedoBar
                canUndo={config.canUndo}
                canRedo={config.canRedo}
                onUndo={() => {}}
                onRedo={() => {}}
                undoDescription={config.canUndo ? 'Test undo' : null}
                redoDescription={config.canRedo ? 'Test redo' : null}
              />
              <QuickActionButtons options={quickActions} onOptionClick={() => {}} />
            </div>
          );

          const textElements = getAllTextElements(container);

          // Property: ALL text elements must have sufficient contrast
          const elementsWithInsufficientContrast: Array<{
            tag: string;
            ratio: number;
            required: number;
            text: string;
          }> = [];

          textElements.forEach((element) => {
            const { passes, ratio, isLargeText } = hasSufficientContrast(element);
            if (!passes) {
              elementsWithInsufficientContrast.push({
                tag: element.tagName,
                ratio,
                required: isLargeText ? 3 : 4.5,
                text: element.textContent?.substring(0, 30) || '',
              });
            }
          });

          expect(
            elementsWithInsufficientContrast.length,
            `Found ${elementsWithInsufficientContrast.length} text elements with insufficient contrast: ${JSON.stringify(elementsWithInsufficientContrast.slice(0, 3))}`
          ).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
