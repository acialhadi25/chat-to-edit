import { ExcelData } from '@/types/excel';
import { getCellValueFromRef, expandRange } from './helpers';

/**
 * Evaluates the SUM function to calculate the sum of numbers in a range or list.
 * Supports both range notation (A1:A10) and comma-separated cells (A1,B2,C3).
 *
 * @param args - Cell range (e.g., "A1:A10") or comma-separated cells (e.g., "A1,B2,C3")
 * @param data - The Excel data containing cell values
 * @returns The sum of all numeric values (null values treated as 0)
 * @example
 * evaluateSum("A1:A10", data) // Sums cells A1 through A10
 * evaluateSum("A1,B2,C3", data) // Sums cells A1, B2, and C3
 */
export function evaluateSum(args: string, data: ExcelData): number {
  // Handle range like A2:A10
  if (args.includes(':')) {
    const cells = expandRange(args);
    return cells.reduce((sum, cellRef) => {
      const val = getCellValueFromRef(cellRef, data);
      return sum + (val ?? 0);
    }, 0);
  }

  // Handle comma-separated cells like A1,B2,C3
  const parts = args.split(',').map((s) => s.trim());
  return parts.reduce((sum, part) => {
    const val = getCellValueFromRef(part, data);
    return sum + (val ?? 0);
  }, 0);
}

/**
 * Evaluates the AVERAGE function to calculate the arithmetic mean of numbers.
 * Null values are excluded from the calculation.
 *
 * @param args - Cell range or comma-separated cells
 * @param data - The Excel data containing cell values
 * @returns The average of all non-null numeric values (0 if no values)
 * @example
 * evaluateAverage("A1:A10", data) // Average of cells A1 through A10
 */
export function evaluateAverage(args: string, data: ExcelData): number {
  let cells: string[];

  if (args.includes(':')) {
    cells = expandRange(args);
  } else {
    cells = args.split(',').map((s) => s.trim());
  }

  const values = cells
    .map((ref) => getCellValueFromRef(ref, data))
    .filter((v): v is number => v !== null);

  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Evaluate COUNT function
 */
export function evaluateCount(args: string, data: ExcelData): number {
  let cells: string[];

  if (args.includes(':')) {
    cells = expandRange(args);
  } else {
    cells = args.split(',').map((s) => s.trim());
  }

  return cells.filter((ref) => {
    const val = getCellValueFromRef(ref, data);
    return val !== null;
  }).length;
}

/**
 * Evaluate MIN function
 */
export function evaluateMin(args: string, data: ExcelData): number {
  let cells: string[];

  if (args.includes(':')) {
    cells = expandRange(args);
  } else {
    cells = args.split(',').map((s) => s.trim());
  }

  const values = cells
    .map((ref) => getCellValueFromRef(ref, data))
    .filter((v): v is number => v !== null);

  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Evaluate MAX function
 */
export function evaluateMax(args: string, data: ExcelData): number {
  let cells: string[];

  if (args.includes(':')) {
    cells = expandRange(args);
  } else {
    cells = args.split(',').map((s) => s.trim());
  }

  const values = cells
    .map((ref) => getCellValueFromRef(ref, data))
    .filter((v): v is number => v !== null);

  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Evaluate ROUND function
 */
export function evaluateRound(args: string, data: ExcelData): number {
  const parts = args.split(',').map((s) => s.trim());
  const value = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const decimals = parts[1]
    ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 0)
    : 0;

  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Evaluate ROUNDUP function
 */
export function evaluateRoundUp(args: string, data: ExcelData): number {
  const parts = args.split(',').map((s) => s.trim());
  const value = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const decimals = parts[1]
    ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 0)
    : 0;

  const factor = Math.pow(10, decimals);
  return Math.ceil(value * factor) / factor;
}

/**
 * Evaluate ROUNDDOWN function
 */
export function evaluateRoundDown(args: string, data: ExcelData): number {
  const parts = args.split(',').map((s) => s.trim());
  const value = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const decimals = parts[1]
    ? (getCellValueFromRef(parts[1], data) ?? parseInt(parts[1], 10) ?? 0)
    : 0;

  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

/**
 * Evaluate ABS function
 */
export function evaluateAbs(args: string, data: ExcelData): number {
  const value = getCellValueFromRef(args.trim(), data) ?? parseFloat(args.trim()) ?? 0;
  return Math.abs(value);
}

/**
 * Evaluate SQRT function
 */
export function evaluateSqrt(args: string, data: ExcelData): number | string {
  const value = getCellValueFromRef(args.trim(), data) ?? parseFloat(args.trim()) ?? 0;
  if (value < 0) return '#NUM!';
  return Math.sqrt(value);
}

/**
 * Evaluate POWER function
 */
export function evaluatePower(args: string, data: ExcelData): number {
  const parts = args.split(',').map((s) => s.trim());
  const base = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const exponent = parts[1]
    ? (getCellValueFromRef(parts[1], data) ?? parseFloat(parts[1]) ?? 1)
    : 1;

  return Math.pow(base, exponent);
}

/**
 * Evaluate MOD function
 */
export function evaluateMod(args: string, data: ExcelData): number | string {
  const parts = args.split(',').map((s) => s.trim());
  const number = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const divisor = parts[1] ? (getCellValueFromRef(parts[1], data) ?? parseFloat(parts[1]) ?? 1) : 1;

  if (divisor === 0) return '#DIV/0!';
  return number % divisor;
}

/**
 * Evaluate INT function (rounds down to nearest integer)
 */
export function evaluateInt(args: string, data: ExcelData): number {
  const value = getCellValueFromRef(args.trim(), data) ?? parseFloat(args.trim()) ?? 0;
  return Math.floor(value);
}

/**
 * Evaluate FLOOR function
 */
export function evaluateFloor(args: string, data: ExcelData): number | string {
  const parts = args.split(',').map((s) => s.trim());
  const number = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const significance = parts[1]
    ? (getCellValueFromRef(parts[1], data) ?? parseFloat(parts[1]) ?? 1)
    : 1;

  if (significance === 0) return '#DIV/0!';
  return Math.floor(number / significance) * significance;
}

/**
 * Evaluate CEILING function
 */
export function evaluateCeiling(args: string, data: ExcelData): number | string {
  const parts = args.split(',').map((s) => s.trim());
  const number = getCellValueFromRef(parts[0], data) ?? parseFloat(parts[0]) ?? 0;
  const significance = parts[1]
    ? (getCellValueFromRef(parts[1], data) ?? parseFloat(parts[1]) ?? 1)
    : 1;

  if (significance === 0) return '#DIV/0!';
  return Math.ceil(number / significance) * significance;
}
