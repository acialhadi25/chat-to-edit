import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ResponsiveExcelGrid } from '../ResponsiveExcelGrid';
import { ExcelData } from '@/types/excel';

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { key: 0, index: 0, start: 0, size: 32 },
      { key: 1, index: 1, start: 32, size: 32 },
      { key: 2, index: 2, start: 64, size: 32 },
    ],
    getTotalSize: () => 1000,
  }),
}));

// Mock @use-gesture/react
vi.mock('@use-gesture/react', () => ({
  useGesture: () => () => ({}),
}));

describe('ResponsiveExcelGrid - Virtual Scrolling Optimization', () => {
  const mockData: ExcelData = {
    headers: ['A', 'B', 'C'],
    rows: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    selectedCells: [],
    pendingChanges: [],
    formulas: {},
    cellStyles: {},
  };

  const mockOnCellChange = vi.fn();
  const mockOnCellSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render Excel grid with virtual scrolling', () => {
      const { container } = render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
          onCellSelect={mockOnCellSelect}
        />
      );

      const grid = container.querySelector('.excel-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should render headers', () => {
      render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render cell values', () => {
      render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
    });
  });

  describe('Loading Indicators', () => {
    it('should not show loading indicator initially', () => {
      render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
        />
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should show loading indicator during scroll', async () => {
      const { container } = render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
        />
      );

      const scrollContainer = container.querySelector('.excel-grid');
      expect(scrollContainer).toBeInTheDocument();

      // Simulate scroll event
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer);
      }

      // Loading indicator should appear
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should hide loading indicator after scroll stops', async () => {
      const { container } = render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
        />
      );

      const scrollContainer = container.querySelector('.excel-grid');

      // Simulate scroll event
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer);
      }

      // Loading indicator should appear
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Loading indicator should disappear after debounce timeout (150ms)
      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        },
        { timeout: 250 }
      );
    });
  });

  describe('Mobile Optimization', () => {
    it('should apply mobile-specific classes on mobile', () => {
      const { container } = render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
          isMobile={true}
        />
      );

      const grid = container.querySelector('.excel-grid');
      expect(grid).toHaveClass('touch-pan-y');
      expect(grid).toHaveClass('touch-pan-x');
    });

    it('should use minimum touch target size on mobile', () => {
      const { container } = render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
          isMobile={true}
        />
      );

      // Mobile cells should have minimum 44px height for touch targets
      const cells = container.querySelectorAll('.min-h-\\[44px\\]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Cell Interaction', () => {
    it('should handle cell click', () => {
      render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
          onCellSelect={mockOnCellSelect}
        />
      );

      const cellWithValue1 = screen.getByText('1').closest('div');
      if (cellWithValue1) {
        fireEvent.click(cellWithValue1);
        expect(mockOnCellSelect).toHaveBeenCalled();
      }
    });

    it('should handle cell double click for editing', () => {
      render(
        <ResponsiveExcelGrid
          data={mockData}
          onCellChange={mockOnCellChange}
        />
      );

      const cellWithValue1 = screen.getByText('1').closest('div');
      if (cellWithValue1) {
        fireEvent.doubleClick(cellWithValue1);
        
        // Should show input field for editing
        const input = screen.getByDisplayValue('1');
        expect(input).toBeInTheDocument();
      }
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData: ExcelData = {
        headers: Array.from({ length: 50 }, (_, i) => `Col${i}`),
        rows: Array.from({ length: 1000 }, (_, i) =>
          Array.from({ length: 50 }, (_, j) => i * 50 + j)
        ),
        selectedCells: [],
        pendingChanges: [],
        formulas: {},
        cellStyles: {},
      };

      const startTime = performance.now();
      
      render(
        <ResponsiveExcelGrid
          data={largeData}
          onCellChange={mockOnCellChange}
        />
      );

      const renderTime = performance.now() - startTime;

      // Rendering should be fast even with large dataset (< 200ms)
      // Virtual scrolling ensures only visible rows are rendered
      expect(renderTime).toBeLessThan(200);
    });

    it('should only render visible rows due to virtualization', () => {
      const largeData: ExcelData = {
        headers: ['A', 'B', 'C'],
        rows: Array.from({ length: 1000 }, (_, i) => [i, i + 1, i + 2]),
        selectedCells: [],
        pendingChanges: [],
        formulas: {},
        cellStyles: {},
      };

      const { container } = render(
        <ResponsiveExcelGrid
          data={largeData}
          onCellChange={mockOnCellChange}
        />
      );

      // Due to mocked virtualizer, only 3 rows should be rendered
      const rows = container.querySelectorAll('.flex[style*="translateY"]');
      expect(rows.length).toBe(3); // Only virtual items are rendered
    });
  });
});
