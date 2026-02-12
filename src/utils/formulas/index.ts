import { ExcelData } from "@/types/excel";
import { getCellValueFromRef, expandRange } from "./helpers";
import { safeEvaluateMath } from "@/utils/safeMathParser";
import {
  evaluateSum,
  evaluateAverage,
  evaluateCount,
  evaluateMin,
  evaluateMax,
  evaluateRound,
  evaluateRoundUp,
  evaluateRoundDown,
  evaluateAbs,
  evaluateSqrt,
  evaluatePower,
  evaluateMod,
  evaluateInt,
  evaluateFloor,
  evaluateCeiling,
} from "./mathFormulas";
import {
  evaluateConcat,
  evaluateConcatenate,
  evaluateLeft,
  evaluateRight,
  evaluateMid,
  evaluateLen,
  evaluateTrim,
  evaluateUpper,
  evaluateLower,
  evaluateProper,
  evaluateSubstitute,
  evaluateReplace,
  evaluateText,
} from "./textFormulas";
import {
  evaluateIf,
  evaluateAnd,
  evaluateOr,
  evaluateNot,
  evaluateIfError,
  evaluateIsBlank,
  evaluateIsNumber,
  evaluateIsText,
} from "./logicalFormulas";
import {
  evaluateToday,
  evaluateNow,
  evaluateYear,
  evaluateMonth,
  evaluateDay,
  evaluateWeekday,
  evaluateDate,
  evaluateDateDif,
} from "./dateFormulas";
import {
  evaluateCountIf,
  evaluateSumIf,
  evaluateAverageIf,
  evaluateCountA,
  evaluateUnique,
  evaluateVlookup,
} from "./lookupFormulas";

/**
 * Evaluate a formula and return the result
 * Supports: 36+ Excel functions + safe arithmetic
 */
export function evaluateFormula(
  formula: string,
  data: ExcelData
): string | number | null {
  if (!formula.startsWith("=")) return formula;
  
  let expr = formula.slice(1); // Remove "="
  
  try {
    // Handle Excel functions (case-insensitive)
    const funcMatch = expr.match(/^([A-Z_]+)\((.+)\)$/i);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const args = funcMatch[2];
      
      switch (funcName) {
        // Math functions
        case "SUM": return evaluateSum(args, data);
        case "AVERAGE":
        case "AVG": return evaluateAverage(args, data);
        case "COUNT": return evaluateCount(args, data);
        case "MIN": return evaluateMin(args, data);
        case "MAX": return evaluateMax(args, data);
        case "ROUND": return evaluateRound(args, data);
        case "ROUNDUP": return evaluateRoundUp(args, data);
        case "ROUNDDOWN": return evaluateRoundDown(args, data);
        case "ABS": return evaluateAbs(args, data);
        case "SQRT": return evaluateSqrt(args, data);
        case "POWER": return evaluatePower(args, data);
        case "MOD": return evaluateMod(args, data);
        case "INT": return evaluateInt(args, data);
        case "FLOOR": return evaluateFloor(args, data);
        case "CEILING": return evaluateCeiling(args, data);
        
        // Text functions
        case "CONCAT": return evaluateConcat(args, data);
        case "CONCATENATE": return evaluateConcatenate(args, data);
        case "LEFT": return evaluateLeft(args, data);
        case "RIGHT": return evaluateRight(args, data);
        case "MID": return evaluateMid(args, data);
        case "LEN": return evaluateLen(args, data);
        case "TRIM": return evaluateTrim(args, data);
        case "UPPER": return evaluateUpper(args, data);
        case "LOWER": return evaluateLower(args, data);
        case "PROPER": return evaluateProper(args, data);
        case "SUBSTITUTE": return evaluateSubstitute(args, data);
        case "REPLACE": return evaluateReplace(args, data);
        case "TEXT": return evaluateText(args, data);
        
        // Logical functions
        case "IF": return evaluateIf(args, data);
        case "AND": return evaluateAnd(args, data) ? 1 : 0;
        case "OR": return evaluateOr(args, data) ? 1 : 0;
        case "NOT": return evaluateNot(args, data) ? 1 : 0;
        case "IFERROR": return evaluateIfError(args, data, evaluateFormula);
        case "ISBLANK": return evaluateIsBlank(args, data) ? 1 : 0;
        case "ISNUMBER": return evaluateIsNumber(args, data) ? 1 : 0;
        case "ISTEXT": return evaluateIsText(args, data) ? 1 : 0;
        
        // Date functions
        case "TODAY": return evaluateToday();
        case "NOW": return evaluateNow();
        case "YEAR": return evaluateYear(args, data);
        case "MONTH": return evaluateMonth(args, data);
        case "DAY": return evaluateDay(args, data);
        case "WEEKDAY": return evaluateWeekday(args, data);
        case "DATE": return evaluateDate(args, data);
        case "DATEDIF": return evaluateDateDif(args, data);

        // Lookup & aggregate functions
        case "COUNTIF": return evaluateCountIf(args, data);
        case "SUMIF": return evaluateSumIf(args, data);
        case "AVERAGEIF": return evaluateAverageIf(args, data);
        case "COUNTA": return evaluateCountA(args, data);
        case "UNIQUE": return evaluateUnique(args, data);
        case "VLOOKUP": return evaluateVlookup(args, data);
      }
    }
    
    // Handle basic arithmetic with cell references
    // Replace cell references with their values
    let exprUpper = expr.toUpperCase();
    exprUpper = exprUpper.replace(/[A-Z]+\d+/g, (ref) => {
      const value = getCellValueFromRef(ref, data);
      return value !== null ? String(value) : "0";
    });
    
    // Safety check: only allow numbers and basic operators
    if (!/^[\d+\-*/().\s]+$/.test(exprUpper)) {
      return null;
    }
    
    // Evaluate using safe recursive descent parser (no eval/new Function)
    const result = safeEvaluateMath(exprUpper);
    
    if (result !== null) {
      // Round to 2 decimal places for display
      return Math.round(result * 100) / 100;
    }
    
    return null;
  } catch {
    return null; // Failed to evaluate
  }
}

/**
 * Check if a cell has a formula
 */
export function hasFormula(data: ExcelData, cellRef: string): boolean {
  return !!data.formulas[cellRef];
}

/**
 * Get the formula for a cell
 */
export function getFormula(data: ExcelData, cellRef: string): string | null {
  return data.formulas[cellRef] || null;
}

// Re-export helpers for use in other modules
export { getCellValueFromRef, expandRange };
