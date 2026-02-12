import { ExcelData } from "@/types/excel";
import { getCellValueFromRef, getStringValue, expandRange } from "./helpers";

/**
 * Evaluate COUNTIF(range, criteria)
 * Counts cells matching a criteria
 */
export function evaluateCountIf(args: string, data: ExcelData): number {
  const commaIdx = findTopLevelComma(args);
  if (commaIdx === -1) return 0;

  const range = args.slice(0, commaIdx).trim();
  const criteria = args.slice(commaIdx + 1).trim().replace(/^["']|["']$/g, "");
  const cells = expandRange(range);

  return cells.filter((ref) => matchesCriteria(ref, criteria, data)).length;
}

/**
 * Evaluate SUMIF(range, criteria, [sum_range])
 */
export function evaluateSumIf(args: string, data: ExcelData): number {
  const parts = splitTopLevel(args);
  if (parts.length < 2) return 0;

  const range = parts[0].trim();
  const criteria = parts[1].trim().replace(/^["']|["']$/g, "");
  const sumRange = parts[2]?.trim() || range;

  const criteriaRefs = expandRange(range);
  const sumRefs = expandRange(sumRange);

  let total = 0;
  for (let i = 0; i < criteriaRefs.length; i++) {
    if (matchesCriteria(criteriaRefs[i], criteria, data)) {
      const val = getCellValueFromRef(sumRefs[i] || criteriaRefs[i], data);
      total += val ?? 0;
    }
  }
  return total;
}

/**
 * Evaluate AVERAGEIF(range, criteria, [average_range])
 */
export function evaluateAverageIf(args: string, data: ExcelData): number | string {
  const parts = splitTopLevel(args);
  if (parts.length < 2) return "#VALUE!";

  const range = parts[0].trim();
  const criteria = parts[1].trim().replace(/^["']|["']$/g, "");
  const avgRange = parts[2]?.trim() || range;

  const criteriaRefs = expandRange(range);
  const avgRefs = expandRange(avgRange);

  const values: number[] = [];
  for (let i = 0; i < criteriaRefs.length; i++) {
    if (matchesCriteria(criteriaRefs[i], criteria, data)) {
      const val = getCellValueFromRef(avgRefs[i] || criteriaRefs[i], data);
      if (val !== null) values.push(val);
    }
  }

  if (values.length === 0) return "#DIV/0!";
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Evaluate COUNTA(range) — counts non-empty cells
 */
export function evaluateCountA(args: string, data: ExcelData): number {
  let cells: string[];
  if (args.includes(":")) {
    cells = expandRange(args.trim());
  } else {
    cells = args.split(",").map((s) => s.trim());
  }

  return cells.filter((ref) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return false;
    const colIndex = data.headers.indexOf(match[1].toUpperCase()) !== -1
      ? data.headers.indexOf(match[1].toUpperCase())
      : (() => {
          let idx = 0;
          for (let i = 0; i < match[1].toUpperCase().length; i++) {
            idx = idx * 26 + (match[1].toUpperCase().charCodeAt(i) - 64);
          }
          return idx - 1;
        })();
    const rowIndex = parseInt(match[2], 10) - 2;
    if (rowIndex < 0 || rowIndex >= data.rows.length) return false;
    if (colIndex < 0 || colIndex >= data.headers.length) return false;
    const val = data.rows[rowIndex][colIndex];
    return val !== null && val !== undefined && val !== "";
  }).length;
}

/**
 * Evaluate UNIQUE(range) — returns count of unique values
 * (In our cell-based system, we return the count since we can't return arrays)
 */
export function evaluateUnique(args: string, data: ExcelData): number {
  let cells: string[];
  if (args.includes(":")) {
    cells = expandRange(args.trim());
  } else {
    cells = args.split(",").map((s) => s.trim());
  }

  const seen = new Set<string>();
  for (const ref of cells) {
    const val = getCellValueFromRef(ref, data);
    const str = getStringValue(ref, data);
    const key = val !== null ? String(val) : str;
    if (key !== "" && key !== "0") {
      seen.add(key);
    }
  }
  return seen.size;
}

/**
 * Evaluate VLOOKUP(lookup_value, table_range, col_index, [range_lookup])
 */
export function evaluateVlookup(args: string, data: ExcelData): string | number | null {
  const parts = splitTopLevel(args);
  if (parts.length < 3) return "#VALUE!";

  const lookupRef = parts[0].trim();
  const tableRange = parts[1].trim();
  const colIdx = parseInt(parts[2].trim(), 10);
  // parts[3] = range_lookup (ignored, we do exact match)

  // Get the lookup value
  let lookupValue: string | number | null;
  if (/^[A-Z]+\d+$/i.test(lookupRef)) {
    const numVal = getCellValueFromRef(lookupRef, data);
    lookupValue = numVal !== null ? numVal : getStringValue(lookupRef, data);
  } else {
    const stripped = lookupRef.replace(/^["']|["']$/g, "");
    const asNum = parseFloat(stripped);
    lookupValue = isNaN(asNum) ? stripped : asNum;
  }

  const cells = expandRange(tableRange);
  if (cells.length === 0) return "#REF!";

  // Determine table dimensions
  const rangeMatch = tableRange.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!rangeMatch) return "#REF!";

  const startColIdx = colLetterToIndex(rangeMatch[1].toUpperCase());
  const endColIdx = colLetterToIndex(rangeMatch[3].toUpperCase());
  const startRow = parseInt(rangeMatch[2], 10);
  const endRow = parseInt(rangeMatch[4], 10);
  const numCols = endColIdx - startColIdx + 1;

  if (colIdx < 1 || colIdx > numCols) return "#REF!";

  // Search first column for lookup value
  for (let row = startRow; row <= endRow; row++) {
    const firstColRef = indexToColLetter(startColIdx) + row;
    const cellNumVal = getCellValueFromRef(firstColRef, data);
    const cellStrVal = getStringValue(firstColRef, data);

    const matches =
      (typeof lookupValue === "number" && cellNumVal === lookupValue) ||
      String(lookupValue).toLowerCase() === cellStrVal.toLowerCase();

    if (matches) {
      const resultRef = indexToColLetter(startColIdx + colIdx - 1) + row;
      const resultNum = getCellValueFromRef(resultRef, data);
      return resultNum !== null ? resultNum : getStringValue(resultRef, data);
    }
  }

  return "#N/A";
}

// ---- Helpers ----

function colLetterToIndex(letter: string): number {
  let idx = 0;
  for (let i = 0; i < letter.length; i++) {
    idx = idx * 26 + (letter.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function indexToColLetter(index: number): string {
  let letter = "";
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

function matchesCriteria(ref: string, criteria: string, data: ExcelData): boolean {
  const numVal = getCellValueFromRef(ref, data);
  const strVal = getStringValue(ref, data);

  // Operator-based criteria
  const opMatch = criteria.match(/^(>=|<=|<>|!=|>|<|=)(.+)$/);
  if (opMatch) {
    const op = opMatch[1];
    const target = parseFloat(opMatch[2]);
    const val = numVal ?? 0;

    if (!isNaN(target)) {
      switch (op) {
        case ">": return val > target;
        case "<": return val < target;
        case ">=": return val >= target;
        case "<=": return val <= target;
        case "<>":
        case "!=": return val !== target;
        case "=": return val === target;
      }
    }
  }

  // Wildcard
  if (criteria.includes("*") || criteria.includes("?")) {
    const pattern = criteria
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${pattern}$`, "i").test(strVal);
  }

  // Exact match (case-insensitive)
  const criteriaNum = parseFloat(criteria);
  if (!isNaN(criteriaNum) && numVal !== null) {
    return numVal === criteriaNum;
  }
  return strVal.toLowerCase() === criteria.toLowerCase();
}

function findTopLevelComma(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === "," && depth === 0) return i;
  }
  return -1;
}

function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let inQuote = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && !inQuote) inQuote = true;
    else if (ch === '"' && inQuote) inQuote = false;
    else if (!inQuote) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) {
        parts.push(s.slice(start, i));
        start = i + 1;
      }
    }
  }
  parts.push(s.slice(start));
  return parts;
}
