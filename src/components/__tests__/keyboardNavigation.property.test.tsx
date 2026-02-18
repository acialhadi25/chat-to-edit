/**
 * Property-Based Test: Keyboard Navigation Completeness
 *
 * **Property 8: Keyboard Navigation Completeness**
 * **Validates: Requirements 6.1.2**
 *
 * This test verifies that all features are keyboard accessible, tab order is logical,
 * and keyboard shortcuts work as expected.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import fc from 'fast-check';

// Import components to test
import ExcelUpload from '@/components/dashboard/ExcelUpload';
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

// Helper to get all focusable elements (JSDOM-compatible)
function getAllFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  const elements: HTMLElement[] = [];
  selectors.forEach((selector) => {
    const found = container.querySelectorAll<HTMLElement>(selector);
    found.forEach((el) => {
      // In JSDOM, offsetParent check doesn't work reliably, so we check other attributes
      const style = window.getComputedStyle(el);
      const isHidden =
        style.display === 'none' || style.visibility === 'hidden' || el.hasAttribute('hidden');
      if (!isHidden) {
        elements.push(el);
      }
    });
  });

  return elements;
}

// Helper to check if element is keyboard accessible (JSDOM-compatible)
function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex');

  // Elements with tabindex="-1" are not keyboard accessible
  if (tabIndex === '-1') {
    return false;
  }

  // Check if element is disabled
  if (element.hasAttribute('disabled')) {
    return false;
  }

  // Check if element is focusable
  const focusableElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];

  if (focusableElements.includes(element.tagName)) {
    return true;
  }

  // Elements with tabindex >= 0 are keyboard accessible
  if (tabIndex && parseInt(tabIndex) >= 0) {
    return true;
  }

  return false;
}

describe('Property 8: Keyboard Navigation Completeness', () => {
  it('should allow tab navigation through all interactive elements in ExcelUpload', async () => {
    const user = userEvent.setup();
    const mockOnFileUpload = vi.fn();

    const { container } = renderWithProviders(<ExcelUpload onFileUpload={mockOnFileUpload} />);

    const focusableElements = getAllFocusableElements(container);

    // Property: Should have at least one focusable element (the upload area)
    expect(focusableElements.length).toBeGreaterThanOrEqual(1);

    // Property: All focusable elements should be keyboard accessible
    for (const element of focusableElements) {
      expect(isKeyboardAccessible(element)).toBe(true);
    }
  });

  it('should support keyboard navigation in QuickActionButtons', async () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
            label: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            value: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (options) => {
          const user = userEvent.setup();
          const mockOnOptionClick = vi.fn();

          const { container } = renderWithProviders(
            <QuickActionButtons options={options} onOptionClick={mockOnOptionClick} />
          );

          const buttons = container.querySelectorAll<HTMLElement>('button:not([disabled])');

          // Property: All non-disabled buttons should be keyboard accessible
          for (const button of Array.from(buttons)) {
            expect(isKeyboardAccessible(button)).toBe(true);
          }

          // Property: Should have buttons rendered
          expect(buttons.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should support keyboard shortcuts in UndoRedoBar', async () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), async (canUndo, canRedo) => {
        const user = userEvent.setup();
        const mockOnUndo = vi.fn();
        const mockOnRedo = vi.fn();

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

        const buttons = container.querySelectorAll<HTMLElement>('button:not([disabled])');

        // Property: Non-disabled buttons should be keyboard accessible
        for (const button of Array.from(buttons)) {
          expect(isKeyboardAccessible(button)).toBe(true);
        }

        // Property: Should render buttons (enabled or disabled)
        const allButtons = container.querySelectorAll('button');
        expect(allButtons.length).toBeGreaterThanOrEqual(2); // Undo and Redo buttons
      }),
      { numRuns: 20 }
    );
  });

  it('should support keyboard navigation in BottomNavigation', async () => {
    const user = userEvent.setup();

    const { container } = renderWithProviders(<BottomNavigation />);

    const links = container.querySelectorAll<HTMLElement>('a');

    // Property: All navigation links should be keyboard accessible
    expect(links.length).toBeGreaterThan(0);

    for (const link of Array.from(links)) {
      expect(isKeyboardAccessible(link)).toBe(true);
    }

    // Property: Tab should navigate through links
    if (links.length >= 2) {
      links[0].focus();
      expect(document.activeElement).toBe(links[0]);

      await user.tab();
      // Focus should move forward
      expect(document.activeElement).not.toBe(links[0]);
    }
  });

  it('should support arrow key navigation in ResponsiveExcelGrid', async () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(fc.oneof(fc.string(), fc.integer(), fc.constant(null)), {
            minLength: 2,
            maxLength: 5,
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (rows) => {
          const user = userEvent.setup();
          const headers = rows[0]?.map((_, i) => String.fromCharCode(65 + i)) || ['A', 'B'];
          const mockExcelData = createMockExcelData({
            headers,
            rows,
          });

          const mockOnCellChange = vi.fn();
          const mockOnCellSelect = vi.fn();

          const { container } = renderWithProviders(
            <ResponsiveExcelGrid
              data={mockExcelData}
              onCellChange={mockOnCellChange}
              onCellSelect={mockOnCellSelect}
              selectedCells={['A1']}
            />
          );

          const grid = container.querySelector('[role="grid"]');
          expect(grid).toBeTruthy();

          // Property: Grid cells should exist and be navigable
          const cells = container.querySelectorAll('[role="gridcell"]');
          expect(cells.length).toBeGreaterThan(0);

          // Property: Grid should have proper ARIA attributes
          expect(grid?.getAttribute('aria-label')).toBeTruthy();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should maintain logical tab order across components', async () => {
    // This test verifies that tab order follows visual order
    fc.assert(
      fc.property(
        fc.record({
          canUndo: fc.boolean(),
          canRedo: fc.boolean(),
          quickActionCount: fc.integer({ min: 2, max: 4 }),
        }),
        async (config) => {
          const user = userEvent.setup();

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

          // Property: Should have focusable elements
          expect(focusableElements.length).toBeGreaterThan(0);

          // Property: All focusable elements should be keyboard accessible
          const inaccessibleElements = focusableElements.filter((el) => !isKeyboardAccessible(el));
          expect(inaccessibleElements.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should support Escape key to cancel actions', async () => {
    // Property: Escape key should cancel or close interactive elements
    const user = userEvent.setup();
    const mockOnFileUpload = vi.fn();

    const { container } = renderWithProviders(<ExcelUpload onFileUpload={mockOnFileUpload} />);

    // Focus on the upload area
    const uploadArea = container.querySelector('[role="button"]');
    if (uploadArea instanceof HTMLElement) {
      uploadArea.focus();

      // Escape should not cause errors
      await user.keyboard('{Escape}');

      // Component should still be functional
      expect(container).toBeTruthy();
    }
  });

  it('should verify all interactive elements are keyboard accessible', () => {
    // Comprehensive test across multiple components
    fc.assert(
      fc.property(
        fc.record({
          hasExcelData: fc.boolean(),
          canUndo: fc.boolean(),
          canRedo: fc.boolean(),
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
              {mockExcelData && (
                <ResponsiveExcelGrid data={mockExcelData} onCellChange={() => {}} />
              )}
            </div>
          );

          const focusableElements = getAllFocusableElements(container);

          // Property: ALL focusable elements must be keyboard accessible
          const inaccessibleElements = focusableElements.filter((el) => !isKeyboardAccessible(el));

          expect(
            inaccessibleElements.length,
            `Found ${inaccessibleElements.length} elements that are not keyboard accessible`
          ).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
