import type { SheetData } from "@/types/excel";

export interface MergeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileCompatibilityResult {
  compatible: boolean;
  headerMatch: boolean;
  commonHeaders: string[];
  missingHeaders: string[];
  extraHeaders: string[];
}

/**
 * Validate if multiple files can be merged
 */
export function validateMergeOperation(
  files: { name: string; data: { [sheetName: string]: SheetData } }[],
  mode: "sheets" | "single"
): MergeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if files exist
  if (!files || files.length === 0) {
    errors.push("No files selected for merging");
    return { valid: false, errors, warnings };
  }

  // Check if at least 2 files for merge
  if (files.length < 2) {
    errors.push("At least 2 files are required for merging");
    return { valid: false, errors, warnings };
  }

  // Check file count limit (e.g., 10 files max)
  if (files.length > 10) {
    errors.push("Maximum 10 files can be merged at once");
  }

  // Check for empty files
  files.forEach((file) => {
    const sheetNames = Object.keys(file.data);
    if (sheetNames.length === 0) {
      errors.push(`${file.name} has no sheets`);
    }

    sheetNames.forEach((sheetName) => {
      const sheet = file.data[sheetName];
      if (!sheet.headers || sheet.headers.length === 0) {
        warnings.push(`${file.name} - ${sheetName} has no headers`);
      }
      if (!sheet.rows || sheet.rows.length === 0) {
        warnings.push(`${file.name} - ${sheetName} has no data rows`);
      }
    });
  });

  // For single sheet merge, check header compatibility
  if (mode === "single") {
    const firstFile = files[0];
    const firstSheetName = Object.keys(firstFile.data)[0];
    const firstHeaders = firstFile.data[firstSheetName]?.headers || [];

    if (firstHeaders.length === 0) {
      errors.push("First file has no headers to use as reference");
    }

    files.slice(1).forEach((file) => {
      const sheetNames = Object.keys(file.data);
      sheetNames.forEach((sheetName) => {
        const sheet = file.data[sheetName];
        const compatibility = checkHeaderCompatibility(firstHeaders, sheet.headers);

        if (!compatibility.headerMatch) {
          warnings.push(
            `${file.name} - ${sheetName}: Headers don't match. Missing: ${compatibility.missingHeaders.join(", ")}, Extra: ${compatibility.extraHeaders.join(", ")}`
          );
        }
      });
    });
  }

  // Check total data size (rough estimate)
  const totalRows = files.reduce((sum, file) => {
    return sum + Object.values(file.data).reduce((sheetSum, sheet) => {
      return sheetSum + (sheet.rows?.length || 0);
    }, 0);
  }, 0);

  if (totalRows > 100000) {
    warnings.push("Large dataset (>100k rows) - merge may take longer");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check header compatibility between two header arrays
 */
export function checkHeaderCompatibility(
  referenceHeaders: string[],
  compareHeaders: string[]
): FileCompatibilityResult {
  const normalizedRef = referenceHeaders.map((h) => h.toLowerCase().trim());
  const normalizedComp = compareHeaders.map((h) => h.toLowerCase().trim());

  const commonHeaders = normalizedRef.filter((h) => normalizedComp.includes(h));
  const missingHeaders = normalizedRef.filter((h) => !normalizedComp.includes(h));
  const extraHeaders = normalizedComp.filter((h) => !normalizedRef.includes(h));

  // Headers match if at least 80% of reference headers are present
  const headerMatch = commonHeaders.length / referenceHeaders.length >= 0.8;

  return {
    compatible: commonHeaders.length > 0,
    headerMatch,
    commonHeaders,
    missingHeaders,
    extraHeaders,
  };
}

/**
 * Validate sheet name for Excel compatibility
 */
export function validateSheetName(name: string): { valid: boolean; error?: string } {
  // Excel sheet names must be <= 31 characters
  if (name.length > 31) {
    return { valid: false, error: "Sheet name exceeds 31 character limit" };
  }

  // Excel sheet names cannot contain: : \ / ? * [ ]
  const invalidChars = /[:\\/?*\[\]]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: "Sheet name contains invalid characters (: \\ / ? * [ ])" };
  }

  // Sheet name cannot be empty
  if (name.trim().length === 0) {
    return { valid: false, error: "Sheet name cannot be empty" };
  }

  return { valid: true };
}

/**
 * Sanitize sheet name for Excel compatibility
 */
export function sanitizeSheetName(name: string, maxLength = 31): string {
  // Remove invalid characters
  let sanitized = name.replace(/[:\\/?*\[\]]/g, "_");

  // Trim to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Check for duplicate sheet names
 */
export function checkDuplicateSheetNames(
  files: { name: string; data: { [sheetName: string]: SheetData } }[]
): { duplicates: string[]; uniqueNames: string[] } {
  const nameCount = new Map<string, number>();

  files.forEach((file) => {
    Object.keys(file.data).forEach((sheetName) => {
      const fullName = `${file.name.replace(/\.[^/.]+$/, "")}_${sheetName}`;
      const sanitized = sanitizeSheetName(fullName);
      nameCount.set(sanitized, (nameCount.get(sanitized) || 0) + 1);
    });
  });

  const duplicates: string[] = [];
  const uniqueNames: string[] = [];

  nameCount.forEach((count, name) => {
    if (count > 1) {
      duplicates.push(name);
    } else {
      uniqueNames.push(name);
    }
  });

  return { duplicates, uniqueNames };
}

/**
 * Generate unique sheet name
 */
export function generateUniqueSheetName(
  baseName: string,
  existingNames: string[],
  maxLength = 31
): string {
  let name = sanitizeSheetName(baseName, maxLength);

  if (!existingNames.includes(name)) {
    return name;
  }

  // Add counter suffix
  let counter = 1;
  let newName = name;

  while (existingNames.includes(newName)) {
    const suffix = `_${counter}`;
    const maxBaseLength = maxLength - suffix.length;
    newName = name.substring(0, maxBaseLength) + suffix;
    counter++;
  }

  return newName;
}
