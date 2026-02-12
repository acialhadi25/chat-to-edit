import { ExcelData } from "@/types/excel";
import { getCellValueFromRef, getStringValue } from "./helpers";

/**
 * Parse a comparison expression like "A2>100" or "B2=5"
 */
function parseCondition(condition: string, data: ExcelData): boolean {
  // Handle various operators
  const operators = [">=", "<=", "<>", "!=", "=", ">", "<"];
  
  for (const op of operators) {
    if (condition.includes(op)) {
      const [left, right] = condition.split(op).map(s => s.trim());
      
      // Get values
      let leftVal: string | number | null = getCellValueFromRef(left, data);
      if (leftVal === null) leftVal = parseFloat(left) || left.replace(/^["']|["']$/g, "");
      
      let rightVal: string | number | null = getCellValueFromRef(right, data);
      if (rightVal === null) rightVal = parseFloat(right) || right.replace(/^["']|["']$/g, "");
      
      // Compare
      switch (op) {
        case ">=": return Number(leftVal) >= Number(rightVal);
        case "<=": return Number(leftVal) <= Number(rightVal);
        case "<>":
        case "!=": return leftVal !== rightVal;
        case "=": return leftVal === rightVal || String(leftVal) === String(rightVal);
        case ">": return Number(leftVal) > Number(rightVal);
        case "<": return Number(leftVal) < Number(rightVal);
      }
    }
  }
  
  // If no operator, treat as truthy check
  const val = getCellValueFromRef(condition, data);
  return val !== null && val !== 0;
}

/**
 * Evaluate IF function
 */
export function evaluateIf(args: string, data: ExcelData): string | number | null {
  // Parse arguments carefully - need to handle nested functions and quoted strings
  const parsedArgs = parseIfArguments(args);
  
  if (parsedArgs.length < 2) return null;
  
  const [condition, trueValue, falseValue = ""] = parsedArgs;
  
  const result = parseCondition(condition.trim(), data);
  const selectedValue = result ? trueValue : falseValue;
  
  // Return the appropriate value
  if (/^[A-Z]+\d+$/i.test(selectedValue.trim())) {
    return getCellValueFromRef(selectedValue.trim(), data);
  }
  
  // Check if it's a number
  const numVal = parseFloat(selectedValue);
  if (!isNaN(numVal)) return numVal;
  
  // Return as string (remove quotes)
  return selectedValue.replace(/^["']|["']$/g, "");
}

/**
 * Parse IF arguments handling nested functions
 */
function parseIfArguments(args: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  let inQuotes = false;
  let quoteChar = "";
  
  for (let i = 0; i < args.length; i++) {
    const char = args[i];
    
    if ((char === '"' || char === "'") && (i === 0 || args[i-1] !== "\\")) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
      current += char;
    } else if (char === "(" && !inQuotes) {
      depth++;
      current += char;
    } else if (char === ")" && !inQuotes) {
      depth--;
      current += char;
    } else if (char === "," && depth === 0 && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    result.push(current.trim());
  }
  
  return result;
}

/**
 * Evaluate AND function
 */
export function evaluateAnd(args: string, data: ExcelData): boolean {
  const conditions = args.split(",").map(s => s.trim());
  return conditions.every(condition => parseCondition(condition, data));
}

/**
 * Evaluate OR function
 */
export function evaluateOr(args: string, data: ExcelData): boolean {
  const conditions = args.split(",").map(s => s.trim());
  return conditions.some(condition => parseCondition(condition, data));
}

/**
 * Evaluate NOT function
 */
export function evaluateNot(args: string, data: ExcelData): boolean {
  return !parseCondition(args.trim(), data);
}

/**
 * Evaluate IFERROR function
 */
export function evaluateIfError(args: string, data: ExcelData, evaluator: (formula: string, data: ExcelData) => string | number | null): string | number | null {
  const parsedArgs = parseIfArguments(args);
  if (parsedArgs.length < 2) return null;
  
  const [valueExpr, errorValue] = parsedArgs;
  
  try {
    // Try to evaluate the value expression
    const result = evaluator("=" + valueExpr.trim(), data);
    if (result === null || String(result).startsWith("#")) {
      // It's an error, return error value
      if (/^[A-Z]+\d+$/i.test(errorValue.trim())) {
        return getCellValueFromRef(errorValue.trim(), data);
      }
      const numVal = parseFloat(errorValue);
      if (!isNaN(numVal)) return numVal;
      return errorValue.replace(/^["']|["']$/g, "");
    }
    return result;
  } catch {
    // Error occurred, return error value
    if (/^[A-Z]+\d+$/i.test(errorValue.trim())) {
      return getCellValueFromRef(errorValue.trim(), data);
    }
    const numVal = parseFloat(errorValue);
    if (!isNaN(numVal)) return numVal;
    return errorValue.replace(/^["']|["']$/g, "");
  }
}

/**
 * Evaluate ISBLANK function
 */
export function evaluateIsBlank(args: string, data: ExcelData): boolean {
  const ref = args.trim();
  if (/^[A-Z]+\d+$/i.test(ref)) {
    const value = getCellValueFromRef(ref, data);
    return value === null || value === 0;
  }
  return false;
}

/**
 * Evaluate ISNUMBER function
 */
export function evaluateIsNumber(args: string, data: ExcelData): boolean {
  const ref = args.trim();
  if (/^[A-Z]+\d+$/i.test(ref)) {
    const value = getCellValueFromRef(ref, data);
    return value !== null;
  }
  return !isNaN(parseFloat(ref));
}

/**
 * Evaluate ISTEXT function
 */
export function evaluateIsText(args: string, data: ExcelData): boolean {
  const ref = args.trim();
  if (/^[A-Z]+\d+$/i.test(ref)) {
    const value = getStringValue(ref, data);
    return typeof value === "string" && isNaN(parseFloat(value));
  }
  return false;
}
