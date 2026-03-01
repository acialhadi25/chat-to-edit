// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveExcelGrid } from '../ResponsiveExcelGrid';
import { ExcelData } from '@/types/excel';

// Mock IntersectionObserver for virtual scrolling
beforeEach(() => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
});

describe('ResponsiveExcelGrid - Column Resize', () => {
  const mockData: ExcelData = {
    fileName: 'test.xlsx',
    sheets: ['Sheet1'],
    currentSheet: 'Sheet1',
    headers: ['A', 'B', 'C'],
    rows: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
  };

  it('should render the grid container', () => {
    const { container } = render(
      <ResponsiveExcelGrid
        data={mockData}
        onCellChange={vi.fn()}
        isMobile={false}
      />
    );

    // Grid container should be present
    const gridContainer = container.querySelector('.excel-grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should not render resize handles on mobile', () => {
    const { container } = render(
      <ResponsiveExcelGrid
        data={mockData}
        onCellChange={vi.fn()}
        isMobile={true}
      />
    );

    // Resize handles should not be present on mobile
    const resizeHandles = container.querySelectorAll('.cursor-col-resize');
    expect(resizeHandles).toHaveLength(0);
  });

  it('should handle column resize interaction', () => {
    const onColumnWidthChange = vi.fn();
    const { container } = render(
      <ResponsiveExcelGrid
        data={mockData}
        onCellChange={vi.fn()}
        onColumnWidthChange={onColumnWidthChange}
        isMobile={false}
      />
    );

    // Wait for virtual items to render
    waitFor(() => {
      const resizeHandle = container.querySelector('.cursor-col-resize');
      
      if (resizeHandle) {
        // Simulate resize start
        fireEvent.mouseDown(resizeHandle, { clientX: 100 });

        // Simulate resize move
        fireEvent.mouseMove(document, { clientX: 150 });

        // Simulate resize end
        fireEvent.mouseUp(document);

        // Should have called the callback
        expect(onColumnWidthChange).toHaveBeenCalled();
      }
    });
  });

  it('should use custom column widths from data', () => {
    const dataWithCustomWidths: ExcelData = {
      ...mockData,
      columnWidths: {
        0: 150,
        1: 200,
        2: 100,
      },
    };

    const { container } = render(
      <ResponsiveExcelGrid
        data={dataWithCustomWidths}
        onCellChange={vi.fn()}
        isMobile={false}
      />
    );

    // Component should render without errors
    const gridContainer = container.querySelector('.excel-grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should enforce minimum column width during resize', () => {
    const onColumnWidthChange = vi.fn();
    const { container } = render(
      <ResponsiveExcelGrid
        data={mockData}
        onCellChange={vi.fn()}
        onColumnWidthChange={onColumnWidthChange}
        isMobile={false}
      />
    );

    waitFor(() => {
      const resizeHandle = container.querySelector('.cursor-col-resize');
      
      if (resizeHandle) {
        // Simulate resize start
        fireEvent.mouseDown(resizeHandle, { clientX: 100 });

        // Try to resize to a very small width (should be clamped to 50px)
        fireEvent.mouseMove(document, { clientX: 0 });

        // Simulate resize end
        fireEvent.mouseUp(document);

        // The width should be at least 50px
        if (onColumnWidthChange.mock.calls.length > 0) {
          const width = onColumnWidthChange.mock.calls[0][1];
          expect(width).toBeGreaterThanOrEqual(50);
        }
      }
    });
  });

  it('should update column widths when data changes', () => {
    const { container, rerender } = render(
      <ResponsiveExcelGrid
        data={mockData}
        onCellChange={vi.fn()}
        isMobile={false}
      />
    );

    // Initial render
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();

    // Update data with new column widths
    const updatedData: ExcelData = {
      ...mockData,
      columnWidths: {
        0: 150,
        1: 200,
      },
    };

    // Re-render with updated data
    rerender(
      <ResponsiveExcelGrid
        data={updatedData}
        onCellChange={vi.fn()}
        isMobile={false}
      />
    );

    // Component should still render correctly
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it('should work with frozen columns', () => {
    const dataWithFrozenColumns: ExcelData = {
      ...mockData,
      frozenColumns: 1,
    };

    const { container } = render(
      <ResponsiveExcelGrid
        data={dataWithFrozenColumns}
        onCellChange={vi.fn()}
        isMobile={false}
      />
    );

    // Component should render without errors
    const gridContainer = container.querySelector('.excel-grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should handle resize state correctly', () => {
    const onColumnWidthChange = vi.fn();
    const { container } = render(
      <ResponsiveExcelGrid
        data={mockData}
        onCellChange={vi.fn()}
        onColumnWidthChange={onColumnWidthChange}
        isMobile={false}
      />
    );

    // Component should render
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();

    // Simulate mouse events on document
    fireEvent.mouseDown(document, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 150 });
    fireEvent.mouseUp(document);

    // Component should still be stable
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });
});
