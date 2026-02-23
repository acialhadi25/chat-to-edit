import { LucideIcon } from "lucide-react";

export interface CellStyle {
  cellRef: string;
  backgroundColor?: string;
  fontColor?: string;
  fontWeight?: "bold" | "normal";
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  border?: boolean;
}

export interface ColumnFormula {
  column: number;
  formula: string;
  description?: string;
}

export interface ConditionalFormattingRule {
  condition: "equals" | "contains" | "greaterThan" | "lessThan";
  value: string | number;
  style: {
    backgroundColor?: string;
    fontColor?: string;
    fontWeight?: "bold" | "normal";
  };
}

export interface ConditionalFormatting {
  column: number;
  rules: ConditionalFormattingRule[];
}

export interface TestScenario {
  name: string;
  description: string;
  expectedBehavior: string;
}

export interface ExcelTemplate {
  id: string;
  name: string;
  description: string;
  category: "business" | "finance" | "hr" | "personal" | "sales" | "inventory" | "testing";
  icon: string; // Icon name from lucide-react
  headers: string[];
  sampleData: (string | number | null)[][];
  formulas?: ColumnFormula[];
  styles?: CellStyle[];
  conditionalFormatting?: ConditionalFormatting[];
  testScenarios?: TestScenario[];
  tags?: string[];
}

export const TEMPLATE_CATEGORIES = {
  business: { label: "Business", color: "blue" },
  finance: { label: "Finance", color: "green" },
  hr: { label: "HR & People", color: "purple" },
  personal: { label: "Personal", color: "orange" },
  sales: { label: "Sales & Marketing", color: "red" },
  inventory: { label: "Inventory & Stock", color: "cyan" },
  testing: { label: "Testing & QA", color: "gray" },
} as const;
