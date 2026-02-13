import { ExcelTemplate } from "@/types/template";

/**
 * Test fixtures for Excel templates
 */

export const basicTemplateFixture: ExcelTemplate = {
  id: "test-basic-001",
  name: "Basic Test Template",
  description: "Simple template for testing",
  category: "business",
  icon: "FileSpreadsheet",
  headers: ["Name", "Age", "City"],
  sampleData: [
    ["Alice", 30, "NYC"],
    ["Bob", 25, "LA"],
    ["Charlie", 35, "Chicago"],
  ],
  tags: ["test", "basic"],
};

export const withFormulasTemplateFixture: ExcelTemplate = {
  id: "test-formula-001",
  name: "Formula Test Template",
  description: "Template with formulas for testing",
  category: "finance",
  icon: "Calculator",
  headers: ["Item", "Price", "Qty", "Total", "Tax", "Grand"],
  sampleData: [
    ["Apple", 100, 5, null, 10, null],
    ["Banana", 200, 3, null, 10, null],
  ],
  formulas: [
    { column: 3, formula: "=B{row}*C{row}", description: "Price * Qty" },
    { column: 5, formula: "=D{row}*E{row}/100", description: "Tax amount" },
  ],
  tags: ["test", "formulas"],
};

export const withStylesTemplateFixture: ExcelTemplate = {
  id: "test-style-001",
  name: "Style Test Template",
  description: "Template with cell styles",
  category: "business",
  icon: "Palette",
  headers: ["A", "B", "C"],
  sampleData: [[1, 2, 3]],
  styles: [
    { cellRef: "A1:C1", backgroundColor: "#2563eb", fontColor: "#ffffff", fontWeight: "bold" },
    { cellRef: "A2", backgroundColor: "#f3f4f6" },
  ],
  tags: ["test", "styles"],
};

export const largeTemplateFixture: ExcelTemplate = {
  id: "test-large-001",
  name: "Large Test Template",
  description: "Template with many rows for performance testing",
  category: "business",
  icon: "Database",
  headers: ["ID", "Name", "Value"],
  sampleData: Array.from({ length: 1000 }, (_, i) => [i, `Item ${i}`, i * 10]),
  tags: ["test", "large", "performance"],
};

export const emptyTemplateFixture: ExcelTemplate = {
  id: "test-empty-001",
  name: "Empty Test Template",
  description: "Template with no data rows",
  category: "business",
  icon: "FileX",
  headers: ["Col1", "Col2", "Col3"],
  sampleData: [],
  tags: ["test", "empty"],
};

export const multiSheetTemplateFixture: ExcelTemplate = {
  id: "test-multi-001",
  name: "Multi-Sheet Test Template",
  description: "Template for multi-sheet testing (simulated via allSheets)",
  category: "business",
  icon: "Layers",
  headers: ["Sheet", "Data"],
  sampleData: [["Sheet1", "Data1"]],
  tags: ["test", "multi-sheet"],
};

export const allTemplateFixtures: ExcelTemplate[] = [
  basicTemplateFixture,
  withFormulasTemplateFixture,
  withStylesTemplateFixture,
  largeTemplateFixture,
  emptyTemplateFixture,
  multiSheetTemplateFixture,
];
