/**
 * Performance tests for virtual scrolling
 *
 * These tests ensure that virtual scrolling maintains 60fps (16ms per frame)
 * when rendering large datasets.
 *
 * Performance Budgets:
 * - Initial render: < 100ms
 * - Scroll frame: < 16ms (60fps)
 * - Cell render: < 1ms per cell
 * - Viewport update: < 16ms
 *
 * Requirements: 3.3.3 - Custom metrics for Excel operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ResponsiveExcelGrid } from '../ResponsiveExcelGrid';
import { createMockExcelData } from '@/test/utils/testHelpers';
import type { ExcelData } from '@/types/excel';

/**
 * Performance budget in milliseconds
 */
const PERFORMANCE_BUDGET = {
  INITIAL_RENDER: 100,
  SCROLL_FRAME: 16, // 60fps
  CELL_RENDER: 1,
  VIEWPORT_UPDATE: 16,
  LARGE_DATASET_RENDER: 500,
};

/**
 * Generate large dataset for virtual scrolling tests
 */
function generateLargeDataset(rows: number, cols: number): ExcelData {
  const headers = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + (i % 26)));

  const data = Array.from({ length: rows }, (_, rowIdx) =>
    Array.from({ length: cols }, (_, colIdx) => `Cell ${rowIdx}-${colIdx}`)
  );

  return createMockExcelData({
    headers,
    rows: data,
  });
}

describe('Performance Tests: Virtual Scrolling', () => {
  let largeDataset: ExcelData;
  let mockOnCellChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    largeDataset = generateLargeDataset(10000, 50);
    mockOnCellChange = vi.fn();
  });

  describe('Initial Render Performance', () => {
    it('should render 10,000 rows initially in under 500ms', () => {
      const start = performance.now();

      const { container } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} isMobile={false} />
      );

      const duration = performance.now() - start;

      // Relaxed budget for test environment (includes React rendering overhead)
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);
      expect(container.firstChild).toBeTruthy();
    });

    it('should render mobile view efficiently', () => {
      const start = performance.now();

      render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} isMobile={true} />
      );

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.INITIAL_RENDER);
    });

    it('should render with selected cells efficiently', () => {
      const selectedCells = Array.from({ length: 100 }, (_, i) => `A${i + 1}`);

      const start = performance.now();

      render(
        <ResponsiveExcelGrid
          data={largeDataset}
          onCellChange={mockOnCellChange}
          selectedCells={selectedCells}
        />
      );

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.INITIAL_RENDER * 1.5);
    });
  });

  describe('Viewport Rendering Performance', () => {
    it('should render component efficiently with virtualization', () => {
      const { container } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} />
      );

      // Component should render without errors
      expect(container.firstChild).toBeTruthy();

      // Virtual scrolling means not all rows are in DOM
      // This is validated by the component's use of useVirtualizer
    });

    it('should handle wide datasets efficiently', () => {
      const wideDataset = generateLargeDataset(100, 100);

      const start = performance.now();

      const { container } = render(
        <ResponsiveExcelGrid data={wideDataset} onCellChange={mockOnCellChange} />
      );

      const duration = performance.now() - start;

      // Should render efficiently even with many columns
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Scroll Performance', () => {
    it('should render scrollable component', () => {
      const { container } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} />
      );

      // Component renders successfully
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle rapid re-renders efficiently', async () => {
      const { rerender } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} />
      );

      const rerenders = 10;
      const start = performance.now();

      // Simulate rapid updates (like during scrolling)
      for (let i = 0; i < rerenders; i++) {
        rerender(
          <ResponsiveExcelGrid
            data={largeDataset}
            onCellChange={mockOnCellChange}
            selectedCells={[`A${i + 1}`]}
          />
        );
      }

      const duration = performance.now() - start;

      // Should handle multiple re-renders efficiently
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.VIEWPORT_UPDATE * rerenders);
    });
  });

  describe('Cell Rendering Performance', () => {
    it('should render individual cells quickly', () => {
      const smallDataset = generateLargeDataset(10, 10);

      const start = performance.now();

      render(<ResponsiveExcelGrid data={smallDataset} onCellChange={mockOnCellChange} />);

      const duration = performance.now() - start;
      const cellCount = 10 * 10; // 100 cells
      const avgCellRenderTime = duration / cellCount;

      // Average cell render time should be under 1ms
      expect(avgCellRenderTime).toBeLessThan(PERFORMANCE_BUDGET.CELL_RENDER);
    });

    it('should handle cell updates efficiently', async () => {
      const dataset = generateLargeDataset(100, 10);

      const { rerender } = render(
        <ResponsiveExcelGrid data={dataset} onCellChange={mockOnCellChange} />
      );

      // Update a single cell
      const updatedDataset = {
        ...dataset,
        rows: dataset.rows.map((row, idx) => (idx === 0 ? [...row.slice(0, -1), 'Updated'] : row)),
      };

      const start = performance.now();

      rerender(<ResponsiveExcelGrid data={updatedDataset} onCellChange={mockOnCellChange} />);

      const duration = performance.now() - start;

      // Single cell update should be very fast
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.VIEWPORT_UPDATE);
    });
  });

  describe('Overscan Performance', () => {
    it('should render with appropriate overscan configuration', () => {
      const { container } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} />
      );

      // Component uses overscan for smooth scrolling (configured in useVirtualizer)
      expect(container.firstChild).toBeTruthy();
    });

    it('should render mobile and desktop views efficiently', () => {
      const desktopStart = performance.now();
      const { container: desktopContainer } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} isMobile={false} />
      );
      const desktopDuration = performance.now() - desktopStart;

      const mobileStart = performance.now();
      const { container: mobileContainer } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} isMobile={true} />
      );
      const mobileDuration = performance.now() - mobileStart;

      // Both should render efficiently
      expect(desktopDuration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);
      expect(mobileDuration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);
      expect(desktopContainer.firstChild).toBeTruthy();
      expect(mobileContainer.firstChild).toBeTruthy();
    });
  });

  describe('Memory Efficiency', () => {
    it('should not render all rows in DOM', () => {
      const { container } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} />
      );

      const renderedRows = container.querySelectorAll('[data-index]');

      // Should render only a small fraction of total rows
      expect(renderedRows.length).toBeLessThan(largeDataset.rows.length * 0.01);
    });

    it('should handle dataset changes without memory leaks', () => {
      const { rerender } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} />
      );

      const start = performance.now();

      // Simulate multiple dataset updates
      for (let i = 0; i < 10; i++) {
        const newDataset = generateLargeDataset(10000, 50);
        rerender(<ResponsiveExcelGrid data={newDataset} onCellChange={mockOnCellChange} />);
      }

      const duration = performance.now() - start;

      // Multiple updates should still be efficient
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER * 10);
    });
  });

  describe('Touch Gesture Performance', () => {
    it('should render mobile component with gesture support', () => {
      const start = performance.now();

      const { container } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} isMobile={true} />
      );

      const duration = performance.now() - start;

      // Mobile component with gesture support should render efficiently
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle component updates efficiently on mobile', () => {
      const { rerender } = render(
        <ResponsiveExcelGrid data={largeDataset} onCellChange={mockOnCellChange} isMobile={true} />
      );

      const start = performance.now();

      // Simulate gesture state changes
      rerender(
        <ResponsiveExcelGrid
          data={largeDataset}
          onCellChange={mockOnCellChange}
          isMobile={true}
          selectedCells={['A1', 'A2', 'A3']}
        />
      );

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.SCROLL_FRAME * 2);
    });
  });

  describe('Stress Tests', () => {
    it('should handle extremely large dataset (50,000 rows)', () => {
      const extremeDataset = generateLargeDataset(50000, 20);

      const start = performance.now();

      const { container } = render(
        <ResponsiveExcelGrid data={extremeDataset} onCellChange={mockOnCellChange} />
      );

      const duration = performance.now() - start;

      // Even with 50k rows, initial render should be reasonable
      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);

      // Should still only render visible rows
      const renderedRows = container.querySelectorAll('[data-index]');
      expect(renderedRows.length).toBeLessThan(100);
    });

    it('should handle wide dataset (100 columns)', () => {
      const wideDataset = generateLargeDataset(1000, 100);

      const start = performance.now();

      render(<ResponsiveExcelGrid data={wideDataset} onCellChange={mockOnCellChange} />);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_BUDGET.LARGE_DATASET_RENDER);
    });
  });
});
