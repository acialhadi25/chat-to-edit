import { ExcelData } from "@/types/excel";
import { getCellValueFromRef } from "./helpers";

/**
 * Evaluate TODAY function - returns current date as string
 */
export function evaluateToday(): string {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
}

/**
 * Evaluate NOW function - returns current date and time as string
 */
export function evaluateNow(): string {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

/**
 * Evaluate YEAR function - extracts year from date
 */
export function evaluateYear(args: string, data: ExcelData): number {
  const ref = args.trim();
  let dateValue: string | number | null = null;
  
  if (/^[A-Z]+\d+$/i.test(ref)) {
    dateValue = getCellValueFromRef(ref, data);
  } else {
    dateValue = ref.replace(/^["']|["']$/g, "");
  }
  
  if (dateValue === null) return 0;
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 0;
  
  return date.getFullYear();
}

/**
 * Evaluate MONTH function - extracts month from date (1-12)
 */
export function evaluateMonth(args: string, data: ExcelData): number {
  const ref = args.trim();
  let dateValue: string | number | null = null;
  
  if (/^[A-Z]+\d+$/i.test(ref)) {
    dateValue = getCellValueFromRef(ref, data);
  } else {
    dateValue = ref.replace(/^["']|["']$/g, "");
  }
  
  if (dateValue === null) return 0;
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 0;
  
  return date.getMonth() + 1; // JavaScript months are 0-indexed
}

/**
 * Evaluate DAY function - extracts day from date (1-31)
 */
export function evaluateDay(args: string, data: ExcelData): number {
  const ref = args.trim();
  let dateValue: string | number | null = null;
  
  if (/^[A-Z]+\d+$/i.test(ref)) {
    dateValue = getCellValueFromRef(ref, data);
  } else {
    dateValue = ref.replace(/^["']|["']$/g, "");
  }
  
  if (dateValue === null) return 0;
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 0;
  
  return date.getDate();
}

/**
 * Evaluate WEEKDAY function - returns day of week (1=Sunday, 7=Saturday by default)
 */
export function evaluateWeekday(args: string, data: ExcelData): number {
  const parts = args.split(",").map(s => s.trim());
  const ref = parts[0];
  const returnType = parts[1] ? parseInt(parts[1], 10) : 1;
  
  let dateValue: string | number | null = null;
  
  if (/^[A-Z]+\d+$/i.test(ref)) {
    dateValue = getCellValueFromRef(ref, data);
  } else {
    dateValue = ref.replace(/^["']|["']$/g, "");
  }
  
  if (dateValue === null) return 0;
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 0;
  
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  switch (returnType) {
    case 1: return dayOfWeek + 1; // 1 = Sunday, 7 = Saturday
    case 2: return dayOfWeek === 0 ? 7 : dayOfWeek; // 1 = Monday, 7 = Sunday
    case 3: return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = Monday, 6 = Sunday
    default: return dayOfWeek + 1;
  }
}

/**
 * Evaluate DATE function - creates a date from year, month, day
 */
export function evaluateDate(args: string, data: ExcelData): string {
  const parts = args.split(",").map(s => s.trim());
  
  const year = getCellValueFromRef(parts[0], data) ?? parseInt(parts[0], 10) ?? new Date().getFullYear();
  const month = parts[1] ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 1) : 1;
  const day = parts[2] ? (getCellValueFromRef(parts[2], data) ?? parseInt(parts[2], 10) ?? 1) : 1;
  
  const date = new Date(year, month - 1, day);
  return date.toISOString().split("T")[0];
}

/**
 * Evaluate DATEDIF function - calculates difference between dates
 */
export function evaluateDateDif(args: string, data: ExcelData): number | string {
  const parts = args.split(",").map(s => s.trim());
  
  if (parts.length < 3) return "#VALUE!";
  
  let startDate: string | number | null = null;
  let endDate: string | number | null = null;
  
  if (/^[A-Z]+\d+$/i.test(parts[0])) {
    startDate = getCellValueFromRef(parts[0], data);
  } else {
    startDate = parts[0].replace(/^["']|["']$/g, "");
  }
  
  if (/^[A-Z]+\d+$/i.test(parts[1])) {
    endDate = getCellValueFromRef(parts[1], data);
  } else {
    endDate = parts[1].replace(/^["']|["']$/g, "");
  }
  
  const unit = parts[2].replace(/^["']|["']$/g, "").toUpperCase();
  
  if (startDate === null || endDate === null) return "#VALUE!";
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "#VALUE!";
  
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  switch (unit) {
    case "D": return diffDays;
    case "M": return Math.floor(diffDays / 30);
    case "Y": return Math.floor(diffDays / 365);
    default: return diffDays;
  }
}
