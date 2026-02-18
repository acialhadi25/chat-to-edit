/**
 * Accessibility Tests for Key Components
 *
 * These tests use axe-core to verify that key components meet WCAG 2.1 Level AA standards.
 * Tests cover ResponsiveExcelGrid and navigation components.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { expectNoA11yViolations } from '@/test/utils/a11yHelpers';

// Import components to test
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

describe('Accessibility Tests', () => {
  describe('Navigation Components', () => {
    it('BottomNavigation should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<BottomNavigation />);

      await expectNoA11yViolations(container);
    });

    it('BottomNavigation should have accessible links', async () => {
      const { container } = renderWithProviders(<BottomNavigation />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);

      // All links should have accessible names
      links.forEach((link) => {
        const hasAccessibleName =
          link.getAttribute('aria-label') || link.textContent?.trim() || link.getAttribute('title');
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('HamburgerMenu should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<HamburgerMenu />);

      await expectNoA11yViolations(container);
    });

    it('HamburgerMenu button should be accessible', async () => {
      const { container } = renderWithProviders(<HamburgerMenu />);

      const button = container.querySelector('button');
      expect(button).toBeTruthy();

      if (button) {
        const hasAccessibleName =
          button.getAttribute('aria-label') ||
          button.textContent?.trim() ||
          button.getAttribute('title');
        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });

  describe('ResponsiveExcelGrid Component', () => {
    it('should have no accessibility violations', async () => {
      const mockExcelData = createMockExcelData({
        headers: ['Column A', 'Column B', 'Column C'],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      });

      const { container } = renderWithProviders(
        <ResponsiveExcelGrid data={mockExcelData} onCellChange={() => {}} />
      );

      await expectNoA11yViolations(container);
    });

    it('should have proper grid structure', async () => {
      const mockExcelData = createMockExcelData({
        headers: ['A', 'B'],
        rows: [
          [1, 2],
          [3, 4],
        ],
      });

      const { container } = renderWithProviders(
        <ResponsiveExcelGrid data={mockExcelData} onCellChange={() => {}} />
      );

      const grid = container.querySelector('[role="grid"]');
      expect(grid).toBeTruthy();
    });

    it('should have accessible cell labels', async () => {
      const mockExcelData = createMockExcelData({
        headers: ['Name', 'Value'],
        rows: [['Test', 123]],
      });

      const { container } = renderWithProviders(
        <ResponsiveExcelGrid data={mockExcelData} onCellChange={() => {}} />
      );

      const cells = container.querySelectorAll('[role="gridcell"]');
      cells.forEach((cell) => {
        const hasAccessibleName = cell.getAttribute('aria-label') || cell.textContent?.trim();
        expect(hasAccessibleName).toBeTruthy();
      });
    });
  });

  describe('Comprehensive Accessibility Test', () => {
    it('should ensure all tested components meet WCAG 2.1 Level AA', async () => {
      const mockExcelData = createMockExcelData({
        headers: ['A', 'B', 'C'],
        rows: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      });

      // Test multiple components together
      const { container } = renderWithProviders(
        <div>
          <BottomNavigation />
          <ResponsiveExcelGrid data={mockExcelData} onCellChange={() => {}} />
        </div>
      );

      await expectNoA11yViolations(container);
    });
  });
});
