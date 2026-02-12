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

// Define type for recursion
type FormulaEvaluator = (formula: string, data: ExcelData) => string | number | null;

/**
 * Evaluate MATCH(lookup_value, lookup_array, [match_type])
 */
export function evaluateMatch(args: string, data: ExcelData, evaluator?: FormulaEvaluator): number | string {
  const parts = splitTopLevel(args);
  if (parts.length < 2) return "#VALUE!";

  const lookupValRaw = parts[0].trim();
  const lookupRange = parts[1].trim();
  const matchType = parts[2] ? parseInt(parts[2].trim(), 10) : 1;

  // Resolve lookup value
  let lookupValue: string | number | null = null;

  // 1. Try recursive evaluation if it looks like a formula (e.g. MAX(A:A))
  if (evaluator && /^[A-Z_]+\s*\(/.test(lookupValRaw)) {
    const res = evaluator("=" + lookupValRaw, data);
    if (res !== null) lookupValue = res;
  }

  // 2. If not resolved yet, parse as number or string/ref
  if (lookupValue === null) {
    const numVal = parseFloat(lookupValRaw);
    if (!isNaN(numVal) && !lookupValRaw.startsWith('"') && !/^[A-Z]+\d+$/.test(lookupValRaw)) {
      lookupValue = numVal;
    } else {
      const stripped = lookupValRaw.replace(/^["']|["']$/g, "");
      if (/^[A-Z]+\d+$/i.test(lookupValRaw)) {
        const refVal = getCellValueFromRef(lookupValRaw, data);
        lookupValue = refVal !== null ? refVal : getStringValue(lookupValRaw, data);
      } else {
        lookupValue = stripped;
      }
    }
  }

  const cells = expandRange(lookupRange);
  if (cells.length === 0) return "#REF!";

  // 0 = Exact match
  // 1 = Less than (max of) -> array must be sorted ASC
  // -1 = Greater than (min of) -> array must be sorted DESC

  for (let i = 0; i < cells.length; i++) {
    const ref = cells[i];
    const cellNum = getCellValueFromRef(ref, data);
    const cellStr = getStringValue(ref, data);

    // We only support exact match (0) robustly for now, and simple search for others
    // For Match Type 0 (Exact)
    if (matchType === 0) {
      let isMatch = false;
      if (typeof lookupValue === "number" && cellNum !== null) {
        isMatch = cellNum === lookupValue;
      } else {
        isMatch = String(lookupValue).toLowerCase() === cellStr.toLowerCase();
      }
      if (isMatch) return i + 1;
    }
    // For Match Type 1 (default) - find largest value <= lookupValue
    // This requires iterating all and finding best match, because we can't assume sort in this naive impl
    // Actually, Excel requires sort. If not sorted, result is undefined.
    // We will scanning for exact match first? No, default behavior is binary search Approx.
    // If we implement linear search for Approx:
    // We need to find the last value that is <= lookupValue.
    // But since list might not be sorted, we simulate Excel's behavior *if* sorted?
    // Let's stick to EXACT match (0) as it's 99% of use cases.
    // If 1, we return NA if not implementing logic? 
    // Let's implement partial logic for 1: Find largest val <= lookup
  }

  if (matchType === 0) return "#N/A";

  // Implementation for 1 (Less Than)
  if (matchType === 1) {
    // Expects sorted ascending. We return the last value that is <= lookupValue
    // But wait, Excel defaults to returning the generic 'approximate' match based on binary search.
    // In a linear scan of unsorted data, the result is unpredictable.
    // We will try to find the item that is <= lookupValue and closest to it?
    // No, the definition is: "The largest value that is less than or equal to lookup_value".
    let bestIdx = -1;
    let bestDiff = Infinity;
    const target = typeof lookupValue === 'number' ? lookupValue : NaN;

    if (isNaN(target)) return "#N/A";

    for (let i = 0; i < cells.length; i++) {
      const val = getCellValueFromRef(cells[i], data);
      if (val !== null && val <= target) {
        const diff = target - val;
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
    }
    if (bestIdx !== -1) return bestIdx + 1;
  }

  return "#N/A";
}

/**
 * Evaluate INDEX(array, row_num, [column_num])
 */
export function evaluateIndex(args: string, data: ExcelData, evaluator?: FormulaEvaluator): string | number | null {
  const parts = splitTopLevel(args);
  if (parts.length < 2) return "#VALUE!";

  const rangeStr = parts[0].trim();
  const rowNumStr = parts[1].trim();
  const colNumStr = parts[2]?.trim() || "1";

  // Helper to resolve numerical arg (value, ref, or formula)
  const resolveNumArg = (str: string): number => {
    // 1. Recursive func
    if (evaluator && /^[A-Z_]+\s*\(/.test(str)) {
      const res = evaluator("=" + str, data);
      return res !== null ? Number(res) : NaN;
    }
    // 2. Reference
    if (/^[A-Z]+\d+$/i.test(str)) {
      const val = getCellValueFromRef(str, data);
      return val ?? 0;
    }
    // 3. Literal
    return parseFloat(str);
  };

  const rowNum = resolveNumArg(rowNumStr);
  const colNum = resolveNumArg(colNumStr);

  if (isNaN(rowNum) || isNaN(colNum)) return "#VALUE!";


  // Determine range dimensions
  const rangeMatch = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!rangeMatch) {
    // Single cell?
    if (/^[A-Z]+\d+$/i.test(rangeStr) && rowNum === 1 && colNum === 1) {
      const val = getCellValueFromRef(rangeStr, data);
      return val !== null ? val : getStringValue(rangeStr, data);
    }
    return "#REF!";
  }

  const startCol = colLetterToIndex(rangeMatch[1].toUpperCase());
  const endCol = colLetterToIndex(rangeMatch[3].toUpperCase());
  const startRow = parseInt(rangeMatch[2], 10);
  const endRow = parseInt(rangeMatch[4], 10);

  const targetRow = startRow + rowNum - 1;
  const targetCol = startCol + colNum - 1;

  if (targetRow > endRow || targetCol > endCol) return "#REF!";

  const ref = indexToColLetter(targetCol) + targetRow;
  const val = getCellValueFromRef(ref, data);
  return val !== null ? val : getStringValue(ref, data);
}

/**
 * Evaluate SUMIFS(sum_range, criteria_range1, criteria1, ...)
 */
export function evaluateSumIfs(args: string, data: ExcelData): number {
  const parts = splitTopLevel(args);
  if (parts.length < 3 || parts.length % 2 === 0) return 0; // odd number of args required >= 3

  const sumRangeStr = parts[0].trim();
  const sumCells = expandRange(sumRangeStr);

  const criteriaRanges: string[][] = [];
  const criterias: string[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    criteriaRanges.push(expandRange(parts[i].trim()));
    criterias.push(parts[i + 1].trim().replace(/^["']|["']$/g, ""));
  }

  // Validate sizes
  for (const cr of criteriaRanges) {
    if (cr.length !== sumCells.length) return 0; // Size mismatch (#VALUE!)
  }

  let total = 0;
  for (let i = 0; i < sumCells.length; i++) {
    let match = true;
    for (let c = 0; c < criteriaRanges.length; c++) {
      if (!matchesCriteria(criteriaRanges[c][i], criterias[c], data)) {
        match = false;
        break;
      }
    }

    if (match) {
      const val = getCellValueFromRef(sumCells[i], data);
      total += val ?? 0;
    }
  }

  return total;
}

/**
 * Evaluate COUNTIFS(criteria_range1, criteria1, ...)
 */
export function evaluateCountIfs(args: string, data: ExcelData): number {
  const parts = splitTopLevel(args);
  if (parts.length < 2 || parts.length % 2 !== 0) return 0;

  const criteriaRanges: string[][] = [];
  const criterias: string[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    criteriaRanges.push(expandRange(parts[i].trim()));
    criterias.push(parts[i + 1].trim().replace(/^["']|["']$/g, ""));
  }

  const length = criteriaRanges[0].length;
  // Validate sizes
  for (const cr of criteriaRanges) {
    if (cr.length !== length) return 0;
  }

  let count = 0;
  for (let i = 0; i < length; i++) {
    let match = true;
    for (let c = 0; c < criteriaRanges.length; c++) {
      if (!matchesCriteria(criteriaRanges[c][i], criterias[c], data)) {
        match = false;
        break;
      }
    }
    if (match) count++;
  }
  return count;
}

/**
 * Evaluate AVERAGEIFS(avg_range, criteria_range1, criteria1, ...)
 */
export function evaluateAverageIfs(args: string, data: ExcelData): number | string {
  const parts = splitTopLevel(args);
  if (parts.length < 3 || parts.length % 2 === 0) return "#VALUE!";

  const avgRangeStr = parts[0].trim();
  const avgCells = expandRange(avgRangeStr);

  const criteriaRanges: string[][] = [];
  const criterias: string[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    criteriaRanges.push(expandRange(parts[i].trim()));
    criterias.push(parts[i + 1].trim().replace(/^["']|["']$/g, ""));
  }

  for (const cr of criteriaRanges) {
    if (cr.length !== avgCells.length) return "#VALUE!";
  }

  let total = 0;
  let count = 0;
  for (let i = 0; i < avgCells.length; i++) {
    let match = true;
    for (let c = 0; c < criteriaRanges.length; c++) {
      if (!matchesCriteria(criteriaRanges[c][i], criterias[c], data)) {
        match = false;
        break;
      }
    }

    if (match) {
      const val = getCellValueFromRef(avgCells[i], data);
      if (val !== null) {
        total += val;
        count++;
      }
    }
  }

  if (count === 0) return "#DIV/0!";
  return total / count;
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
