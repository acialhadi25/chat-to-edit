

# Fix: AI Tools Intelligence and Data Filtering

## Problem Analysis

The root cause of the filtering failure is a combination of issues:

1. **AI only sees 5 sample rows** -- In `ChatInterface.tsx` line 93, only `excelData.rows.slice(0, 5)` is sent. With hundreds of rows, the AI has no idea what values exist beyond those 5 rows.

2. **AI uses DELETE_ROW instead of FILTER_DATA** -- The AI tries to enumerate specific row numbers to delete, but since it only sees 5 rows, it can only identify 1 matching/non-matching row. The correct approach is `FILTER_DATA` which operates programmatically on ALL rows.

3. **FILTER_DATA logic is inverted for "keep only" requests** -- The current `filterData()` function KEEPS rows matching the condition. When user says "keep only department X, delete the rest", the AI needs to use `operator: "="` with `filterValue: "Sekretariat..."` to keep matching rows. But the system prompt doesn't clearly explain this semantic.

4. **Missing action types in validation** -- `actionValidation.ts` doesn't include `RENAME_COLUMN`, `EXTRACT_NUMBER`, `FORMAT_NUMBER`, `GENERATE_ID`, `CONCATENATE`, `STATISTICS`, `PIVOT_SUMMARY` -- causing valid actions to be rejected.

5. **No column unique values sent to AI** -- The AI has no way to know what unique department names exist in the data.

## Solution (7 files)

### 1. `src/components/dashboard/ChatInterface.tsx` -- Send richer context

- Increase sample rows from 5 to 10
- Add **unique values per column** (top 10 unique values for text columns) so the AI knows what data exists
- Add total row count emphasis

### 2. `supabase/functions/chat/index.ts` -- Improve system prompt

- Add explicit instruction: "For bulk filtering (keep only / delete all except), ALWAYS use FILTER_DATA with contains/= operator, NEVER enumerate rows with DELETE_ROW"
- Add FILTER_DATA semantic explanation: "FILTER_DATA KEEPS rows that match the condition and removes the rest"
- Clarify that `contains` operator does case-insensitive partial match
- Add instruction to use `not_contains` for "delete rows containing X"
- Add section about unique values context

### 3. `src/utils/actionValidation.ts` -- Add missing action types

Add these to the valid types list:
- `RENAME_COLUMN`
- `EXTRACT_NUMBER`
- `FORMAT_NUMBER`
- `GENERATE_ID`
- `CONCATENATE`
- `STATISTICS`
- `PIVOT_SUMMARY`
- `EDIT_ROW`

### 4. `src/utils/excelOperations.ts` -- Add helper for unique values

Add `getColumnUniqueValues()` function that returns top N unique values per column (for sending to AI context).

### 5. `supabase/functions/chat-pdf/index.ts` -- Improve PDF prompt

- Add clearer instructions for multi-file operations
- Add better natural language examples for Indonesian

### 6. `supabase/functions/chat-docs/index.ts` -- Improve Docs prompt

- Send more document content (increase from 1000 to 3000 chars)
- Add clearer WRITE/REWRITE instructions
- Add Indonesian language examples

### 7. `src/pages/ExcelDashboard.tsx` -- Update getDataAnalysis

- Include unique values per column in the data analysis sent to AI

## Technical Details

### Context Enhancement (ChatInterface.tsx)

```text
Before: sampleRows: excelData.rows.slice(0, 5)
After:  sampleRows: excelData.rows.slice(0, 10)
        + uniqueValuesPerColumn: { "Departemen": ["Sekretariat...", "Direktorat..."], ... }
```

### System Prompt Addition (chat/index.ts)

Key additions to IMPORTANT RULES:
- Rule: "For requests like 'keep only X' or 'delete everything except X', ALWAYS use FILTER_DATA with operator '=' or 'contains' and the value to KEEP. FILTER_DATA keeps matching rows and removes non-matching ones."
- Rule: "NEVER use DELETE_ROW for bulk filtering. DELETE_ROW is only for deleting specific known rows (1-20 rows max)."
- Rule: "Use the uniqueValues data to understand what values exist in columns."

### Validation Fix (actionValidation.ts)

```text
Add to validTypes array:
"RENAME_COLUMN", "EXTRACT_NUMBER", "FORMAT_NUMBER",
"GENERATE_ID", "CONCATENATE", "STATISTICS", "PIVOT_SUMMARY", "EDIT_ROW"
```

### Unique Values Helper (excelOperations.ts)

New function `getColumnUniqueValues(data, maxPerColumn=10)` that scans all rows and returns top unique values per column, enabling AI to know what data exists without seeing every row.

