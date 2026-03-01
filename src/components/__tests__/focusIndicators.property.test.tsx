// @ts-nocheck
/**
 * Property-Based Test: Focus Indicator Visibility
 *
 * **Property 9: Focus Indicator Visibility**
 * **Validates: Requirements 6.1.3**
 *
 * This test verifies that all focusable elements have a visible focus indicator
 * with at least 2px outline or equivalent visual distinction when focused via keyboard.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import fc from 'fast-check';

// Import key components to test
import ExcelUpload from '@/components/dashboard/ExcelUpload';
import QuickActionButtons from '@/components/dashboard/QuickActionButtons';
import UndoRedoBar from '@/components/dashboard/UndoRedoBar';
import { BottomNavigation, HamburgerMenu } from '@/components/navigation/MobileNavigation';
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

// Helper to get computed outline width in pixels
function getOutlineWidth(element: HTMLElement): number {
  const computedStyle = window.getComputedStyle(element);
  const outlineWidth = computedStyle.getPropertyValue('outline-width');

  // Parse outline width (e.g., "2px" -> 2)
  const match = outlineWidth.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// Helper to check if element has visible focus indicator
function hasVisibleFocusIndicator(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);

  // Check outline
  const outlineWidth = computedStyle.getPropertyValue('outline-width');
  const outlineStyle = computedStyle.getPropertyValue('outline-style');
  const outlineColor = computedStyle.getPropertyValue('outline-color');

  // Parse outline width
  const widthMatch = outlineWidth.match(/^(\d+(?:\.\d+)?)/);
  const width = widthMatch ? parseFloat(widthMatch[1]) : 0;

  // Check if outline is visible (width >= 2px, style is not 'none', color is not transparent)
  const hasOutline = width >= 2 && outlineStyle !== 'none' && outlineColor !== 'transparent';

  // Check box-shadow (alternative focus indicator)
  const boxShadow = computedStyle.getPropertyValue('box-shadow');
  const hasBoxShadow = boxShadow !== 'none' && boxShadow.length > 0;

  // Check border (some components use border as focus indicator)
  const borderWidth = computedStyle.getPropertyValue('border-width');
  const borderStyle = computedStyle.getPropertyValue('border-style');
  const borderMatch = borderWidth.match(/^(\d+(?:\.\d+)?)/);
  const borderWidthNum = borderMatch ? parseFloat(borderMatch[1]) : 0;
  const hasBorder = borderWidthNum >= 2 && borderStyle !== 'none';

  return hasOutline || hasBoxShadow || hasBorder;
}

// Helper to get all focusable elements
function getAllFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[role="gridcell"]',
    '[role="tab"]',
    '[tabindex]:not([tabindex="-1"])',
  ];

  const elements: HTMLElement[] = [];
  selectors.forEach((selector) => {
    const found = container.querySelectorAll(selector);
    found.forEach((el) => {
      // Only include visible elements
      if (el instanceof HTMLElement && el.offsetParent !== null) {
        elements.push(el);
      }
    });
  });

  // Remove duplicates
  return Array.from(new Set(elements));
}

describe('Property 9: Focus Indicator Visibility', () => {
  it('should ensure all buttons in ExcelUpload have visible focus indicators when focused', () => {
    const mockOnFileUpload = () => {};
    const { container } = renderWithProviders(<ExcelUpload onFileUpload={mockOnFileUpload} />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      if (button instanceof HTMLElement && button.offsetParent !== null) {
        // Simulate focus
        button.focus();

        // Check for focus indicator
        const hasFocusIndicator = hasVisibleFocusIndicator(button);
        expect(
          hasFocusIndicator,
          `Button without visible focus indicator: ${button.outerHTML.substring(0, 100)}`
        ).toBe(true);

        button.blur();
      }
    });
  });

  it('should ensure QuickActionButtons have focus indicators with property-based testing', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            label: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (options) => {
          const mockOnOptionClick = () => {};
          const { container } = renderWithProviders(
            <QuickActionButtons options={options} onOptionClick={mockOnOptionClick} />
          );

          const buttons = container.querySelectorAll('button');
          buttons.forEach((button) => {
            if (button instanceof HTMLElement && button.offsetParent !== null) {
              button.focus();
              expect(hasVisibleFocusIndicator(button)).toBe(true);
              button.blur();
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should ensure UndoRedoBar buttons have focus indicators', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (canUndo, canRedo, undoDesc, redoDesc) => {
          const mockOnUndo = () => {};
          const mockOnRedo = () => {};

          const { container } = renderWithProviders(
            <UndoRedoBar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={mockOnUndo}
              onRedo={mockOnRedo}
              undoDescription={canUndo ? undoDesc : null}
              redoDescription={canRedo ? redoDesc : null}
            />
          );

          const buttons = container.querySelectorAll('button');
          buttons.forEach((button) => {
            if (button instanceof HTMLElement && button.offsetParent !== null) {
              button.focus();
              expect(hasVisibleFocusIndicator(button)).toBe(true);
              button.blur();
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should ensure BottomNavigation links have focus indicators', () => {
    const { container } = renderWithProviders(<BottomNavigation />);

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      if (link instanceof HTMLElement && link.offsetParent !== null) {
        link.focus();
        expect(
          hasVisibleFocusIndicator(link),
          `Link without visible focus indicator: ${link.outerHTML.substring(0, 100)}`
        ).toBe(true);
        link.blur();
      }
    });
  });

  it('should ensure HamburgerMenu button has focus indicator', () => {
    const { container } = renderWithProviders(<HamburgerMenu />);

    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    if (button instanceof HTMLElement) {
      button.focus();
      expect(hasVisibleFocusIndicator(button)).toBe(true);
      button.blur();
    }
  });

  it('should ensure ResponsiveExcelGrid cells have focus indicators', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(fc.oneof(fc.string(), fc.integer(), fc.constant(null)), {
            minLength: 1,
            maxLength: 5,
          }),
          { minLength: 1, maxLength: 10 }
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

          // Check gridcells have focus indicators
          const cells = container.querySelectorAll('[role="gridcell"]');
          cells.forEach((cell) => {
            if (cell instanceof HTMLElement && cell.offsetParent !== null) {
              cell.focus();
              expect(hasVisibleFocusIndicator(cell)).toBe(true);
              cell.blur();
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should verify focus indicator width is at least 2px', () => {
    fc.assert(
      fc.property(
        fc.record({
          canUndo: fc.boolean(),
          canRedo: fc.boolean(),
          quickActionCount: fc.integer({ min: 1, max: 5 }),
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

          const focusableElements = getAllFocusableElements(container);

          focusableElements.forEach((element) => {
            element.focus();

            // Check outline width
            const outlineWidth = getOutlineWidth(element);
            const computedStyle = window.getComputedStyle(element);
            const outlineStyle = computedStyle.getPropertyValue('outline-style');

            // If element has an outline, it should be at least 2px
            if (outlineStyle !== 'none') {
              expect(
                outlineWidth,
                `Element has outline but width is less than 2px: ${element.tagName}`
              ).toBeGreaterThanOrEqual(2);
            }

            element.blur();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all focusable elements have visible focus indicators (comprehensive test)', () => {
    // This is the core property test that validates the universal property
    fc.assert(
      fc.property(
        fc.record({
          hasExcelData: fc.boolean(),
          canUndo: fc.boolean(),
          canRedo: fc.boolean(),
          quickActionCount: fc.integer({ min: 1, max: 5 }),
        }),
        (config) => {
          const mockExcelData = config.hasExcelData
            ? createMockExcelData({
                headers: ['A', 'B'],
                rows: [
                  [1, 2],
                  [3, 4],
                ],
              })
            : null;

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
              {config.hasExcelData && mockExcelData && (
                <ResponsiveExcelGrid data={mockExcelData} onCellChange={() => {}} />
              )}
            </div>
          );

          const focusableElements = getAllFocusableElements(container);

          // Property: ALL focusable elements must have visible focus indicators when focused
          const elementsWithoutFocusIndicators: HTMLElement[] = [];

          focusableElements.forEach((element) => {
            element.focus();
            if (!hasVisibleFocusIndicator(element)) {
              elementsWithoutFocusIndicators.push(element);
            }
            element.blur();
          });

          expect(
            elementsWithoutFocusIndicators.length,
            `Found ${elementsWithoutFocusIndicators.length} focusable elements without visible focus indicators: ${elementsWithoutFocusIndicators.map((el) => el.tagName).join(', ')}`
          ).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
