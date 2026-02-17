import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ResponsiveExcelGrid } from "../ResponsiveExcelGrid";
import { ExcelData } from "@/types/excel";

describe("ResponsiveExcelGrid - Freeze Panes", () => {
  const createMockData = (overrides?: Partial<ExcelData>): ExcelData => ({
    fileName: "test.xlsx",
    sheets: ["Sheet1"],
    currentSheet: "Sheet1",
    headers: ["A", "B", "C", "D", "E"],
    rows: [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    frozenRows: 0,
    frozenColumns: 0,
    ...overrides,
  });

  it("should render without frozen panes by default", () => {
    const data = createMockData();
    const onCellChange = vi.fn();

    const { container } = render(<ResponsiveExcelGrid data={data} onCellChange={onCellChange} />);

    // Grid should render
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should accept frozenRows and frozenColumns props", () => {
    const data = createMockData({ frozenRows: 2, frozenColumns: 1 });
    const onCellChange = vi.fn();

    const { container } = render(
      <ResponsiveExcelGrid data={data} onCellChange={onCellChange} />
    );

    // Component should render without errors
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should handle zero frozen rows and columns", () => {
    const data = createMockData({ frozenRows: 0, frozenColumns: 0 });
    const onCellChange = vi.fn();

    const { container } = render(
      <ResponsiveExcelGrid data={data} onCellChange={onCellChange} />
    );

    // Should render without errors
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should handle large number of frozen rows", () => {
    const data = createMockData({ frozenRows: 5 });
    const onCellChange = vi.fn();

    const { container } = render(<ResponsiveExcelGrid data={data} onCellChange={onCellChange} />);

    // Should render without errors
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should handle large number of frozen columns", () => {
    const data = createMockData({ frozenColumns: 5 });
    const onCellChange = vi.fn();

    const { container } = render(<ResponsiveExcelGrid data={data} onCellChange={onCellChange} />);

    // Should render without errors
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should accept onFreezePanesChange callback", () => {
    const data = createMockData();
    const onCellChange = vi.fn();
    const onFreezePanesChange = vi.fn();

    const { container } = render(
      <ResponsiveExcelGrid
        data={data}
        onCellChange={onCellChange}
        onFreezePanesChange={onFreezePanesChange}
      />
    );

    // Component should render (callback is for parent to handle)
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should handle both frozen rows and columns together", () => {
    const data = createMockData({ frozenRows: 2, frozenColumns: 2 });
    const onCellChange = vi.fn();

    const { container } = render(
      <ResponsiveExcelGrid data={data} onCellChange={onCellChange} />
    );

    // Should render without errors
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should not break when frozenRows exceeds data rows", () => {
    const data = createMockData({ frozenRows: 100 });
    const onCellChange = vi.fn();

    const { container } = render(
      <ResponsiveExcelGrid data={data} onCellChange={onCellChange} />
    );

    // Should render without errors (component should handle gracefully)
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });

  it("should not break when frozenColumns exceeds data columns", () => {
    const data = createMockData({ frozenColumns: 100 });
    const onCellChange = vi.fn();

    const { container } = render(
      <ResponsiveExcelGrid data={data} onCellChange={onCellChange} />
    );

    // Should render without errors (component should handle gracefully)
    expect(container.querySelector('.excel-grid')).toBeInTheDocument();
  });
});
