/**
 * Example usage of the Freeze Panes feature
 * 
 * This file demonstrates how to integrate the FreezePanesControl
 * with ResponsiveExcelGrid to provide freeze panes functionality.
 */

import { useState } from "react";
import { ResponsiveExcelGrid } from "./ResponsiveExcelGrid";
import { FreezePanesControl } from "./FreezePanesControl";
import { ExcelData } from "@/types/excel";

export function FreezePanesExample() {
  const [excelData, setExcelData] = useState<ExcelData>({
    fileName: "example.xlsx",
    sheets: ["Sheet1"],
    currentSheet: "Sheet1",
    headers: ["Name", "Age", "City", "Country", "Salary"],
    rows: [
      ["John Doe", 30, "New York", "USA", 75000],
      ["Jane Smith", 25, "London", "UK", 65000],
      ["Bob Johnson", 35, "Toronto", "Canada", 80000],
      ["Alice Williams", 28, "Sydney", "Australia", 70000],
      ["Charlie Brown", 32, "Berlin", "Germany", 72000],
      ["Diana Prince", 29, "Paris", "France", 68000],
      ["Eve Adams", 31, "Tokyo", "Japan", 85000],
      ["Frank Miller", 27, "Seoul", "South Korea", 67000],
      ["Grace Lee", 33, "Singapore", "Singapore", 90000],
      ["Henry Ford", 26, "Dubai", "UAE", 95000],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    frozenRows: 0,
    frozenColumns: 0,
  });

  const handleFreezePanesChange = (frozenRows: number, frozenColumns: number) => {
    setExcelData((prev) => ({
      ...prev,
      frozenRows,
      frozenColumns,
    }));
  };

  const handleCellChange = (col: number, row: number, value: string | number | null) => {
    setExcelData((prev) => {
      const newRows = [...prev.rows];
      newRows[row] = [...newRows[row]];
      newRows[row][col] = value;
      return { ...prev, rows: newRows };
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Freeze Panes Example</h2>
        <FreezePanesControl
          frozenRows={excelData.frozenRows || 0}
          frozenColumns={excelData.frozenColumns || 0}
          onFreeze={handleFreezePanesChange}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          Use the "Freeze Panes" button to freeze rows and columns. Frozen cells will stay
          visible when scrolling.
        </p>
        <p className="mt-1">
          Current: {excelData.frozenRows || 0} frozen rows, {excelData.frozenColumns || 0} frozen columns
        </p>
      </div>

      <ResponsiveExcelGrid
        data={excelData}
        onCellChange={handleCellChange}
        onFreezePanesChange={handleFreezePanesChange}
      />
    </div>
  );
}
