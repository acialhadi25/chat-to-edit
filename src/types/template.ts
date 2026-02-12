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

export interface ExcelTemplate {
  id: string;
  name: string;
  description: string;
  category: "business" | "finance" | "hr" | "personal" | "sales" | "inventory";
  icon: string; // Icon name from lucide-react
  headers: string[];
  sampleData: (string | number | null)[][];
  formulas?: ColumnFormula[];
  styles?: CellStyle[];
  tags?: string[];
}

export const TEMPLATE_CATEGORIES = {
  business: { label: "Business", color: "blue" },
  finance: { label: "Finance", color: "green" },
  hr: { label: "HR & People", color: "purple" },
  personal: { label: "Personal", color: "orange" },
  sales: { label: "Sales & Marketing", color: "red" },
  inventory: { label: "Inventory & Stock", color: "cyan" },
} as const;
