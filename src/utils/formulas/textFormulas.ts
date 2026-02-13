import { ExcelData, getColumnIndex } from "@/types/excel";
import { getCellValueFromRef, getStringValue, expandRange } from "./helpers";

/**
 * Evaluate CONCAT function
 */
export function evaluateConcat(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  return parts.map(part => {
    // Check if it's a cell reference
    if (/^[A-Z]+\d+$/i.test(part)) {
      const match = part.match(/^([A-Z]+)(\d+)$/i);
      if (match) {
        const colIndex = getColumnIndex(match[1].toUpperCase());
        const rowIndex = parseInt(match[2], 10) - 2;
        
        if (rowIndex >= 0 && rowIndex < data.rows.length && colIndex >= 0 && colIndex < data.headers.length) {
          const value = data.rows[rowIndex][colIndex];
          return value !== null && value !== undefined ? String(value) : "";
        }
      }
      return "";
    }
    // It's a string literal (may have quotes)
    return part.replace(/^["']|["']$/g, "");
  }).join("");
}

/**
 * Evaluate CONCATENATE function (alias for CONCAT)
 */
export function evaluateConcatenate(args: string, data: ExcelData): string {
  return evaluateConcat(args, data);
}

/**
 * Evaluate LEFT function - returns leftmost characters
 */
export function evaluateLeft(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  const text = getStringValue(parts[0], data);
  const numChars = parts[1] ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 1) : 1;
  
  return text.substring(0, Math.max(0, numChars));
}

/**
 * Evaluate RIGHT function - returns rightmost characters
 */
export function evaluateRight(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  const text = getStringValue(parts[0], data);
  const numChars = parts[1] ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 1) : 1;
  
  return text.substring(Math.max(0, text.length - numChars));
}

/**
 * Evaluate MID function - returns characters from middle
 */
export function evaluateMid(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  const text = getStringValue(parts[0], data);
  const startNum = parts[1] ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 1) : 1;
  const numChars = parts[2] ? (getCellValueFromRef(parts[2], data) ?? parseInt(parts[2], 10) ?? 1) : 1;
  
  // Excel MID is 1-indexed
  return text.substring(Math.max(0, startNum - 1), Math.max(0, startNum - 1 + numChars));
}

/**
 * Evaluate LEN function - returns length of text
 */
export function evaluateLen(args: string, data: ExcelData): number {
  const text = getStringValue(args.trim(), data);
  return text.length;
}

/**
 * Evaluate TRIM function - removes extra spaces
 */
export function evaluateTrim(args: string, data: ExcelData): string {
  const text = getStringValue(args.trim(), data);
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Evaluate UPPER function - converts to uppercase
 */
export function evaluateUpper(args: string, data: ExcelData): string {
  const text = getStringValue(args.trim(), data);
  return text.toUpperCase();
}

/**
 * Evaluate LOWER function - converts to lowercase
 */
export function evaluateLower(args: string, data: ExcelData): string {
  const text = getStringValue(args.trim(), data);
  return text.toLowerCase();
}

/**
 * Evaluate PROPER function - title case
 */
export function evaluateProper(args: string, data: ExcelData): string {
  const text = getStringValue(args.trim(), data);
  return text.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Evaluate SUBSTITUTE function - replaces text
 */
export function evaluateSubstitute(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  const text = getStringValue(parts[0], data);
  const oldText = parts[1]?.replace(/^["']|["']$/g, "") || "";
  const newText = parts[2]?.replace(/^["']|["']$/g, "") || "";
  const instanceNum = parts[3] ? parseInt(parts[3], 10) : undefined;
  
  if (instanceNum !== undefined) {
    let count = 0;
    return text.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
      count++;
      return count === instanceNum ? newText : match;
    });
  }
  
  return text.split(oldText).join(newText);
}

/**
 * Evaluate REPLACE function - replaces part of text by position
 */
export function evaluateReplace(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  const oldText = getStringValue(parts[0], data);
  const startNum = parts[1] ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 1) : 1;
  const numChars = parts[2] ? (getCellValueFromRef(parts[2], data) ?? parseInt(parts[2], 10) ?? 0) : 0;
  const newText = parts[3]?.replace(/^["']|["']$/g, "") || "";
  
  // Excel REPLACE is 1-indexed
  return oldText.substring(0, startNum - 1) + newText + oldText.substring(startNum - 1 + numChars);
}

/**
 * Evaluate TEXT function - formats a value
 */
export function evaluateText(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  const value = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const format = parts[1]?.replace(/^["']|["']$/g, "") || "0";
  
  // Simple format handling
  if (format.includes("#") || format.includes("0")) {
    const decimals = (format.split(".")[1] || "").length;
    return typeof value === "number" ? value.toFixed(decimals) : String(value);
  }
  
  return String(value);
}
