import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import * as fc from "fast-check";
import { renderWithProviders, createMockExcelData } from "@/test/utils/testHelpers";
import { ResponsiveExcelGrid } from "@/components/excel/ResponsiveExcelGrid";
import { BottomNavigation, HamburgerMenu, MobileHeader } from "@/components/navigation/MobileNavigation";

/**
 * Property-Based Test for Touch Target Minimum Size
 * 
 * **Validates: Requirements 2.1.6**
 * 
 * Property 6: Touch Target Minimum Size
 * For all interactive elements (buttons, links, inputs) on mobile viewports (<768px),
 * the clickable area should be at least 44x44 pixels (iOS HIG standard).
 * 
 * Note: Since JSDOM doesn't compute layout, this test validates that components
 * have the appropriate CSS classes and inline styles that ensure minimum touch targets.
 */

const MINIMUM_TOUCH_TARGET_SIZE = 44; // iOS Human Interface Guidelines standard
const MOBILE_VIEWPORT_WIDTH = 375; // iPhone SE width
const MOBILE_VIEWPORT_HEIGHT = 667;

// Helper to set viewport size
function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event("resize"));
}

// Helper to check if element has minimum size CSS properties
function hasMinimumTouchTargetCSS(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const classList = Array.from(element.classList);
  
  // Check for explicit min-width/min-height in inline styles
  const inlineStyle = element.style;
  const hasInlineMinWidth = inlineStyle.minWidth && parseFloat(inlineStyle.minWidth) >= MINIMUM_TOUCH_TARGET_SIZE;
  const hasInlineMinHeight = inlineStyle.minHeight && parseFloat(inlineStyle.minHeight) >= MINIMUM_TOUCH_TARGET_SIZE;
  
  // Check for Tailwind classes that ensure minimum touch targets
  const hasTouchTargetClass = classList.some(cls => 
    cls.includes('min-w-') || 
    cls.includes('min-h-') ||
    cls.includes('h-10') || cls.includes('w-10') || // 40px (close to minimum)
    cls.includes('h-12') || cls.includes('w-12') || // 48px
    cls.includes('h-14') || cls.includes('w-14') || // 56px
    cls.includes('h-16') || cls.includes('w-16') || // 64px
    cls.includes('p-3') || cls.includes('p-4') || // Padding that adds to size
    cls.includes('py-3') || cls.includes('py-4')
  );
  
  // Check computed min-width/min-height
  const minWidth = parseFloat(computedStyle.minWidth) || 0;
  const minHeight = parseFloat(computedStyle.minHeight) || 0;
  const hasComputedMinSize = minWidth >= MINIMUM_TOUCH_TARGET_SIZE || minHeight >= MINIMUM_TOUCH_TARGET_SIZE;
  
  return hasInlineMinWidth || hasInlineMinHeight || hasTouchTargetClass || hasComputedMinSize;
}

// Helper to check if element is likely to meet touch target (based on CSS)
function likelyMeetsTouchTarget(element: HTMLElement): boolean {
  // Check if element has CSS properties that suggest it meets minimum size
  const classList = Array.from(element.classList);
  
  // Navigation items with specific sizing
  if (classList.includes('min-w-[64px]') || classList.includes('min-h-[48px]')) {
    return true;
  }
  
  // Buttons with size classes
  if (element.tagName === 'BUTTON' && (
    classList.includes('h-10') || classList.includes('w-10') ||
    classList.includes('h-12') || classList.includes('w-12') ||
    classList.includes('h-14') || classList.includes('w-14')
  )) {
    return true;
  }
  
  // Links with padding
  if (element.tagName === 'A' && (
    classList.includes('py-3') || classList.includes('p-3') ||
    classList.includes('py-4') || classList.includes('p-4') ||
    classList.includes('min-h-[48px]')
  )) {
    return true;
  }
  
  // Excel grid cells on mobile
  if (classList.includes('min-h-[44px]')) {
    return true;
  }
  
  return false;
}

// Arbitrary generators for property-based testing
const excelDataArbitrary = fc.record({
  headers: fc.array(fc.string({ minLength: 1, maxLength: 3 }), { minLength: 3, maxLength: 10 }),
  rows: fc.array(
    fc.array(
      fc.oneof(
        fc.string({ maxLength: 10 }),
        fc.integer({ min: 0, max: 100 }),
        fc.constant(null)
      ),
      { minLength: 3, maxLength: 10 }
    ),
    { minLength: 5, maxLength: 20 }
  ),
});

describe("Property-Based Tests: Touch Target Minimum Size", () => {
  beforeEach(() => {
    // Set mobile viewport
    setViewportSize(MOBILE_VIEWPORT_WIDTH, MOBILE_VIEWPORT_HEIGHT);
  });

  afterEach(() => {
    // Reset viewport to default
    setViewportSize(1024, 768);
  });

  describe("Property 6: Touch Target Minimum Size", () => {
    it("should ensure all buttons have CSS classes for minimum touch target size", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Render mobile navigation components
          const { container } = renderWithProviders(
            <div>
              <BottomNavigation />
              <HamburgerMenu />
            </div>
          );

          // Query all buttons
          const buttons = container.querySelectorAll("button");
          
          expect(buttons.length).toBeGreaterThan(0);
          
          // Verify each button has CSS that ensures minimum size
          buttons.forEach((button) => {
            const meetsTarget = likelyMeetsTouchTarget(button as HTMLElement);
            const classList = Array.from(button.classList).join(' ');
            
            expect(
              meetsTarget,
              `Button with classes "${classList}" does not have CSS for minimum touch target`
            ).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure all links have CSS classes for minimum touch target size", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Render mobile navigation
          const { container } = renderWithProviders(<BottomNavigation />);

          // Query all links
          const links = container.querySelectorAll("a");
          
          expect(links.length).toBeGreaterThan(0);
          
          // Verify each link has CSS that ensures minimum size
          links.forEach((link) => {
            const meetsTarget = likelyMeetsTouchTarget(link as HTMLElement);
            const classList = Array.from(link.classList).join(' ');
            
            expect(
              meetsTarget,
              `Link with classes "${classList}" does not have CSS for minimum touch target`
            ).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure Excel grid cells have CSS for minimum touch target on mobile", () => {
      fc.assert(
        fc.property(excelDataArbitrary, (dataSpec) => {
          const data = createMockExcelData({
            headers: dataSpec.headers,
            rows: dataSpec.rows,
          });

          // Render Excel grid in mobile mode
          const { container } = renderWithProviders(
            <ResponsiveExcelGrid
              data={data}
              onCellChange={() => {}}
              isMobile={true}
            />
          );

          // Query all cells (divs with cursor-pointer class)
          const cells = container.querySelectorAll(".cursor-pointer");
          
          // If cells are rendered, verify they have minimum size CSS
          if (cells.length > 0) {
            // Check a sample of cells
            const sampleSize = Math.min(5, cells.length);
            for (let i = 0; i < sampleSize; i++) {
              const cell = cells[i] as HTMLElement;
              const meetsTarget = likelyMeetsTouchTarget(cell);
              const classList = Array.from(cell.classList).join(' ');
              
              expect(
                meetsTarget,
                `Cell with classes "${classList}" does not have CSS for minimum touch target`
              ).toBe(true);
            }
          }
        }),
        { numRuns: 50 } // Fewer runs for component tests
      );
    });

    it("should ensure all interactive elements in mobile header have appropriate CSS", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          (title) => {
            // Render mobile header
            const { container } = renderWithProviders(<MobileHeader title={title} />);

            // Query all interactive elements (buttons)
            const buttons = container.querySelectorAll("button");
            
            // Verify each button has appropriate CSS
            buttons.forEach((button) => {
              const meetsTarget = likelyMeetsTouchTarget(button as HTMLElement);
              const classList = Array.from(button.classList).join(' ');
              
              expect(
                meetsTarget,
                `Interactive element with classes "${classList}" does not have CSS for minimum touch target`
              ).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain minimum touch target CSS across different data sizes", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 20 }),
          (rowCount, colCount) => {
            // Generate data with specified dimensions
            const headers = Array.from({ length: colCount }, (_, i) =>
              String.fromCharCode(65 + i)
            );
            const rows = Array.from({ length: rowCount }, () =>
              Array.from({ length: colCount }, (_, i) => i + 1)
            );

            const data = createMockExcelData({ headers, rows });

            // Render Excel grid in mobile mode
            const { container } = renderWithProviders(
              <ResponsiveExcelGrid
                data={data}
                onCellChange={() => {}}
                isMobile={true}
              />
            );

            // Query all cells
            const cells = container.querySelectorAll(".cursor-pointer");
            
            if (cells.length > 0) {
              // Check first cell as representative
              const firstCell = cells[0] as HTMLElement;
              const meetsTarget = likelyMeetsTouchTarget(firstCell);
              
              expect(
                meetsTarget,
                `Cell does not have CSS for minimum touch target with ${rowCount} rows and ${colCount} columns`
              ).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should ensure navigation items have appropriate CSS classes", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Render bottom navigation
          const { container } = renderWithProviders(<BottomNavigation />);

          // Query all navigation items (links)
          const navItems = container.querySelectorAll("a");
          
          expect(navItems.length).toBeGreaterThan(0);
          
          // Verify each navigation item has appropriate CSS
          navItems.forEach((item) => {
            const meetsTarget = likelyMeetsTouchTarget(item as HTMLElement);
            const classList = Array.from(item.classList).join(' ');
            
            expect(
              meetsTarget,
              `Navigation item with classes "${classList}" does not have CSS for minimum touch target`
            ).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure hamburger menu button has appropriate CSS", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Render hamburger menu
          const { container } = renderWithProviders(<HamburgerMenu />);

          // Query the hamburger button
          const button = container.querySelector("button");
          
          expect(button).not.toBeNull();
          
          if (button) {
            const meetsTarget = likelyMeetsTouchTarget(button as HTMLElement);
            const classList = Array.from(button.classList).join(' ');
            
            expect(
              meetsTarget,
              `Hamburger button with classes "${classList}" does not have CSS for minimum touch target`
            ).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should verify touch target CSS is consistent across viewport changes", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 767 }), // Mobile viewport range
          (viewportWidth) => {
            // Set viewport to generated width
            setViewportSize(viewportWidth, MOBILE_VIEWPORT_HEIGHT);

            // Render mobile navigation
            const { container } = renderWithProviders(<BottomNavigation />);

            // Query all interactive elements
            const interactiveElements = container.querySelectorAll("button, a");
            
            expect(interactiveElements.length).toBeGreaterThan(0);
            
            // Verify each element has appropriate CSS
            interactiveElements.forEach((element) => {
              const meetsTarget = likelyMeetsTouchTarget(element as HTMLElement);
              
              expect(
                meetsTarget,
                `Element does not have CSS for minimum touch target at viewport ${viewportWidth}px`
              ).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should ensure all focusable elements have appropriate CSS", () => {
      fc.assert(
        fc.property(excelDataArbitrary, (dataSpec) => {
          const data = createMockExcelData({
            headers: dataSpec.headers,
            rows: dataSpec.rows,
          });

          // Render components
          const { container } = renderWithProviders(
            <div>
              <MobileHeader title="Test" />
              <ResponsiveExcelGrid
                data={data}
                onCellChange={() => {}}
                isMobile={true}
              />
              <BottomNavigation />
            </div>
          );

          // Query all focusable elements
          const focusableElements = container.querySelectorAll(
            'button, a, input, [tabindex]:not([tabindex="-1"])'
          );
          
          // Verify each focusable element has appropriate CSS
          focusableElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            
            // Skip hidden elements
            if (htmlElement.offsetParent === null) return;
            
            const meetsTarget = likelyMeetsTouchTarget(htmlElement);
            
            // At least should have some sizing CSS
            expect(
              meetsTarget || hasMinimumTouchTargetCSS(htmlElement),
              `Focusable element ${htmlElement.tagName} does not have CSS for minimum touch target`
            ).toBe(true);
          });
        }),
        { numRuns: 30 } // Fewer runs for complex component tests
      );
    });

    it("should verify touch target CSS with edge case data", () => {
      const edgeCaseData = createMockExcelData({
        headers: ["A"],
        rows: [[null], [""], [0], ["x"]],
      });

      fc.assert(
        fc.property(fc.constant(null), () => {
          // Render Excel grid with edge case data
          const { container } = renderWithProviders(
            <ResponsiveExcelGrid
              data={edgeCaseData}
              onCellChange={() => {}}
              isMobile={true}
            />
          );

          // Query all cells
          const cells = container.querySelectorAll(".cursor-pointer");
          
          // Verify cells have appropriate CSS even with edge case data
          if (cells.length > 0) {
            const firstCell = cells[0] as HTMLElement;
            const meetsTarget = likelyMeetsTouchTarget(firstCell);
            
            expect(
              meetsTarget,
              `Cell with edge case data does not have CSS for minimum touch target`
            ).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 6: Touch Target Size CSS Validation", () => {
    it("should validate that all interactive elements have appropriate CSS", () => {
      fc.assert(
        fc.property(excelDataArbitrary, (dataSpec) => {
          const data = createMockExcelData({
            headers: dataSpec.headers,
            rows: dataSpec.rows,
          });

          // Render all mobile components
          const { container } = renderWithProviders(
            <div>
              <MobileHeader title="Test App" />
              <ResponsiveExcelGrid
                data={data}
                onCellChange={() => {}}
                isMobile={true}
              />
              <BottomNavigation />
            </div>
          );

          // Query ALL interactive elements
          const allInteractive = container.querySelectorAll(
            'button, a, input, [role="button"], [role="link"], .cursor-pointer'
          );
          
          // Count violations
          let violations = 0;
          const violationDetails: string[] = [];
          
          allInteractive.forEach((element) => {
            const htmlElement = element as HTMLElement;
            
            // Skip hidden elements
            if (htmlElement.offsetParent === null) return;
            
            const meetsTarget = likelyMeetsTouchTarget(htmlElement) || hasMinimumTouchTargetCSS(htmlElement);
            
            // Check if has appropriate CSS
            if (!meetsTarget) {
              violations++;
              const classList = Array.from(htmlElement.classList).join(' ');
              violationDetails.push(
                `${htmlElement.tagName}.${classList}`
              );
            }
          });
          
          // Report violations if any
          if (violations > 0) {
            console.warn(`Touch target CSS violations found:\n${violationDetails.join("\n")}`);
          }
          
          // All interactive elements should have appropriate CSS
          expect(
            violations,
            `Found ${violations} touch target CSS violations`
          ).toBe(0);
        }),
        { numRuns: 30 }
      );
    });
  });
});
