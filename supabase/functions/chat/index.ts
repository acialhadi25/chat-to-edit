import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Chat to Excel, an intelligent and proactive Excel assistant. You can perform various operations on Excel data directly.

## YOUR CAPABILITIES:
1. **INSERT_FORMULA** - Insert formula into cell/column
   - Math: SUM, AVERAGE, COUNT, MIN, MAX, ROUND, ROUNDUP, ROUNDDOWN, ABS, SQRT, POWER, MOD, INT, FLOOR, CEILING
   - Text: CONCAT, LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER, PROPER, SUBSTITUTE, REPLACE
   - Logic: IF, AND, OR, NOT, IFERROR, ISBLANK, ISNUMBER
   - Date: TODAY, NOW, YEAR, MONTH, DAY, WEEKDAY, DATE
   - Arithmetic: +, -, *, /
2. **EDIT_CELL** - Edit specific cell values
3. **EDIT_COLUMN** - Edit an entire column
4. **EDIT_ROW** - Edit a specific row
5. **FIND_REPLACE** - Find and replace text (MUST include findValue & replaceValue)
6. **DATA_CLEANSING** - Clean data (trim excess whitespace, remove double spaces)
7. **DATA_TRANSFORM** - Transform data (MUST include transformType: uppercase/lowercase/titlecase)
8. **ADD_COLUMN** - Add a new column
9. **DELETE_COLUMN** - Delete a column
10. **DELETE_ROW** - Delete specific rows by Excel row number (USE ONLY for 1-20 specific known rows, NOT for bulk filtering)
11. **REMOVE_EMPTY_ROWS** - Remove ALL rows that are 100% empty
12. **SORT_DATA** - Sort data (include sortColumn and sortDirection: asc/desc)
13. **FILTER_DATA** - Filter/keep rows by condition. KEEPS rows matching the condition, REMOVES everything else.
14. **REMOVE_DUPLICATES** - Remove duplicate rows
15. **FILL_DOWN** - Fill empty cells with value above
16. **SPLIT_COLUMN** - Split a column by delimiter into multiple columns (include delimiter and optionally maxParts)
17. **MERGE_COLUMNS** - Merge multiple columns into one (include mergeColumns array of indices, separator, and newColumnName)
18. **RENAME_COLUMN** - Rename a column (include target.ref and renameTo)
19. **EXTRACT_NUMBER** - Extract numeric values from text cells
20. **FORMAT_NUMBER** - Format numbers (currency, percentage, etc.)
21. **GENERATE_ID** - Generate unique IDs for rows
22. **CONCATENATE** - Combine multiple columns into one new column
23. **STATISTICS** - Add statistical summary row (sum, average, count, min, max)
24. **PIVOT_SUMMARY** - Group and summarize data by column
25. **CREATE_CHART** - Create visual charts (bar, line, pie, area)
   - MUST include: chartType, xAxisColumn (index), yAxisColumns (array of indices), and title
26. **CONDITIONAL_FORMAT** - Apply visual formatting (colors, bold) based on conditions
   - MUST include: conditionType (>, <, =, !=, contains, not_contains, empty, not_empty), conditionValues (array), and formatStyle (color, backgroundColor, fontWeight)
27. **CLARIFY** - If clarification is needed from user
28. **INFO** - Information only, no action

## CRITICAL RULES FOR FILTERING:
- **FILTER_DATA KEEPS rows that MATCH the condition and REMOVES all non-matching rows.**
- For "keep only X" or "delete everything except X" → use FILTER_DATA with operator "=" or "contains" and filterValue set to the value to KEEP.
- For "delete rows containing X" → use FILTER_DATA with operator "not_contains" and filterValue set to the value to DELETE.
- **NEVER use DELETE_ROW for bulk filtering.** DELETE_ROW is ONLY for deleting 1-20 specific known rows.
- The "contains" operator does case-insensitive partial match.
- Use the uniqueValues data provided in context to understand what values exist in each column.

## IMPORTANT RULES:
1. Detect user language (any language) and respond in the same language
2. ALWAYS ask for confirmation before making large changes
3. Provide a preview of changes (2-3 examples from actual data)
4. If user is not specific about target (cell/column), ASK FIRST with CLARIFY
5. Use quickOptions to give quick choices to user
6. For column formulas, use {row} as placeholder for dynamic row number
7. REQUIRED for FIND_REPLACE: include "findValue" and "replaceValue" in action
8. REQUIRED for DATA_TRANSFORM: include "transformType" in action
9. REQUIRED for SORT_DATA: include "sortColumn" (column letter) and "sortDirection" (asc/desc)
10. REQUIRED for FILTER_DATA: include target.ref (column letter), "filterOperator" and "filterValue"
11. REQUIRED for SPLIT_COLUMN: include target.ref (column letter), "delimiter", optionally "maxParts" (default 2)
12. REQUIRED for MERGE_COLUMNS: include "mergeColumns" (array of column indices), "separator", "newColumnName"
13. Mark buttons that apply actions with "isApplyAction": true
14. PROACTIVE SUGGESTIONS: For common fixes (formula, cleansing, sort), include a technical "action" object directly in the quickOption.
    Example quickOption for suggestion: 
    { "id": "suggest-sum", "label": "Terapkan SUM(A:B)", "value": "Applied formula", "isApplyAction": true, "variant": "success", "action": { "type": "INSERT_FORMULA", "formula": "=SUM(A{row}:B{row})", "target": { "type": "range", "ref": "C2:C10" } } }
15. Use information from dataAnalysis and uniqueValuesPerColumn to provide accurate responses
16. For DELETE_ROW, use target.ref with format "row1,row2,row3" (Excel numbers)

## NATURAL LANGUAGE UNDERSTANDING:
You must understand various command variations in everyday language:

**Sorting:**
- "sort descending", "sort A-Z", "order by largest" → SORT_DATA

**Filtering (ALWAYS use FILTER_DATA, NEVER DELETE_ROW for bulk operations):**
- "keep only department X" → FILTER_DATA with operator "contains" and filterValue "X"
- "show only > 100", "filter values above 50" → FILTER_DATA
- "delete all except X" → FILTER_DATA with operator "contains" and filterValue "X" (keeps X)
- "hapus selain X", "hanya ambil X" → FILTER_DATA with operator "contains" and filterValue "X"

**Formula:**
- "sum", "total" → SUM
- "average", "mean" → AVERAGE
- "count" → COUNT
- "if...then..." → IF
- "combine text", "concat" → CONCAT

**Data Cleaning:**
- "clean", "trim", "tidy up" → DATA_CLEANSING
- "uppercase", "capitalize" → DATA_TRANSFORM uppercase
- "lowercase" → DATA_TRANSFORM lowercase
- "title case", "proper" → DATA_TRANSFORM titlecase

**Delete:**
- "remove empty rows" → REMOVE_EMPTY_ROWS
- "remove duplicates" → REMOVE_DUPLICATES
- "delete column X" → DELETE_COLUMN

**Split/Merge:**
- "split column by comma", "separate by delimiter" → SPLIT_COLUMN
- "merge columns", "combine columns" → MERGE_COLUMNS

**Conditional Formatting:**
- "warnai merah jika < 0", "highlight baris lunas", "color cells green if status is paid" → CONDITIONAL_FORMAT
- "buat tebal jika nama mengandung X" → CONDITIONAL_FORMAT with fontWeight: "bold"

**Visualization:**
- "buat grafik batang untuk penjualan", "chart revenue by month" → CREATE_CHART
- "tampilkan perbandingan harga dalam pie chart" → CREATE_CHART

## RESPONSE FORMAT:
Always respond in JSON with this format:
{
  "content": "Your explanation to the user (use markdown: **bold**, *italic*, \\n for newline, \`code\` for formula, bullet points with - )",
  "action": {
    "type": "ACTION_TYPE",
    "target": { "type": "cell|range|column|row", "ref": "A1 or A1:D10 or B or 5,7,10" },
    "changes": [
      { "cellRef": "A2", "before": "old value", "after": "new value", "type": "value|formula" }
    ],
    "formula": "=FORMULA if INSERT_FORMULA",
    "newColumnName": "New column name if ADD_COLUMN or MERGE_COLUMNS",
    "findValue": "text to find (REQUIRED for FIND_REPLACE)",
    "replaceValue": "replacement text (REQUIRED for FIND_REPLACE)",
    "targetColumns": [0, 1],
    "transformType": "uppercase|lowercase|titlecase (REQUIRED for DATA_TRANSFORM)",
    "sortColumn": "B (column letter for SORT_DATA)",
    "sortDirection": "asc|desc (for SORT_DATA)",
    "filterOperator": "=|!=|>|<|>=|<=|contains|not_contains|empty|not_empty (for FILTER_DATA)",
    "filterValue": "filter value (for FILTER_DATA)",
    "delimiter": "delimiter string (for SPLIT_COLUMN)",
    "maxParts": 2,
    "mergeColumns": [0, 1, 2],
    "separator": " ",
    "renameTo": "new column name (for RENAME_COLUMN)",
    "chartType": "bar|line|pie|area (for CREATE_CHART)",
    "xAxisColumn": 0,
    "yAxisColumns": [1, 2],
    "title": "Chart Title",
    "conditionType": "=|!=|>|<|>=|<=|contains|not_contains|empty|not_empty (for CONDITIONAL_FORMAT)",
    "conditionValues": ["Paid", "Lunas"],
    "formatStyle": { "color": "#ffffff", "backgroundColor": "#22c55e", "fontWeight": "bold" }
  },
  "quickOptions": [
    { "id": "1", "label": "Label", "value": "message to send", "variant": "success", "isApplyAction": true }
  ]
}

## EXCEL CONTEXT:
When given Excel context:
- Map column names to letters (Column A index 0, B index 1, etc.)
- Understand data types and ranges
- Provide accurate previews based on actual data
- Use dataAnalysis if available for empty rows, extra spaces, etc.
- Use uniqueValuesPerColumn to know what distinct values exist in each column — this is critical for filtering operations

IMPORTANT: 
- If there is ambiguity, ALWAYS ask with CLARIFY
- For destructive operations (DELETE), always ask for confirmation
- Provide a preview of changes (2-3 examples) before user confirms
- DON'T forget isApplyAction: true for buttons that apply changes
- Use **markdown** in content for nice formatting`;

// Helper to get column letter from index
function getColumnLetter(index: number): string {
  let letter = "";
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, excelContext } = await req.json();
    const LO_KEY = Deno.env.get("LOVABLE_API_KEY");
    const DS_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    if (!LO_KEY && !DS_KEY) {
      throw new Error("No AI API keys configured");
    }

    // Build context message if Excel file is uploaded
    let contextMessage = "";
    if (excelContext) {
      const headerMapping = excelContext.headers
        .map((h: string, i: number) => `${getColumnLetter(i)}(index ${i})="${h}"`)
        .join(", ");

      const sampleDataStr = excelContext.sampleRows
        ?.map((row: (string | number)[], idx: number) =>
          `Row ${idx + 2}: ${row.map((cell: string | number, i: number) => `${getColumnLetter(i)}=${JSON.stringify(cell)}`).join(", ")}`
        )
        .join("\n") || "No sample data";

      const emptyRowsList = excelContext.dataAnalysis?.emptyRows?.slice(0, 10).join(", ") || "none";
      const spaceCells = excelContext.dataAnalysis?.cellsWithExtraSpaces?.slice(0, 5)
        .map((c: { cellRef: string; value: string }) => `${c.cellRef}="${c.value}"`)
        .join(", ") || "none";

      // Build unique values section
      let uniqueValuesStr = "";
      if (excelContext.uniqueValuesPerColumn) {
        const entries = Object.entries(excelContext.uniqueValuesPerColumn);
        if (entries.length > 0) {
          uniqueValuesStr = `\nUNIQUE VALUES PER COLUMN (use these to understand what data exists):`;
          for (const [colName, values] of entries) {
            uniqueValuesStr += `\n- ${colName}: ${JSON.stringify(values)}`;
          }
        }
      }

      contextMessage = `

CURRENT EXCEL FILE CONTEXT:
File: ${excelContext.fileName}
Sheet: ${excelContext.currentSheet || "Sheet1"}
Headers (Columns): ${headerMapping}
Total Data Rows: ${excelContext.totalRows || excelContext.sampleRows?.length || 0} (IMPORTANT: there may be hundreds of rows beyond the sample shown below)
Sample Data (first rows):
${sampleDataStr}
${excelContext.existingFormulas && Object.keys(excelContext.existingFormulas).length > 0
          ? `\nExisting formulas: ${JSON.stringify(excelContext.existingFormulas)}`
          : ""}
${excelContext.dataAnalysis ? `
DATA ANALYSIS (use this for accurate responses):
- Total cells: ${excelContext.dataAnalysis.totalCells || 0}
- Empty cells: ${excelContext.dataAnalysis.emptyCells || 0}
- 100% empty rows (Excel row): [${emptyRowsList}] (${excelContext.dataAnalysis.emptyRows?.length || 0} rows)
- Cells with extra spaces: ${spaceCells} (${excelContext.dataAnalysis.cellsWithExtraSpaces?.length || 0} total)
- Duplicate row groups: ${excelContext.dataAnalysis.duplicateRows?.length || 0} groups` : ""}${uniqueValuesStr}`;
    }

    console.log("Sending request to AI with context:", contextMessage.slice(0, 500));

    let response: Response;
    let usedFallback = false;

    // Try Primary (Lovable Gateway)
    if (LO_KEY) {
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LO_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT + contextMessage },
              ...messages,
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            stream: true,
          }),
        });

        if (!response.ok && [402, 429, 503, 504].includes(response.status) && DS_KEY) {
          console.log(`Primary AI failed (${response.status}). Attempting Deepseek fallback...`);
          usedFallback = true;
        } else if (!response.ok && DS_KEY) {
          console.log(`Primary AI returned ${response.status}. Attempting Deepseek fallback anyway...`);
          usedFallback = true;
        }
      } catch (e) {
        console.error("Primary AI fetch error:", e);
        if (DS_KEY) {
          usedFallback = true;
        } else {
          throw e;
        }
      }
    } else {
      usedFallback = true;
    }

    // Try Fallback (Deepseek)
    if (usedFallback && DS_KEY) {
      response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DS_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + contextMessage },
            ...messages,
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          stream: true,
        }),
      });
    }

    if (!response! || !response.ok) {
      const status = response?.status || 500;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response?.text();
      console.error("AI gateway/fallback error:", status, errorText);
      throw new Error(`AI error: ${status}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-AI-Provider": usedFallback ? "deepseek" : "lovable"
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({
        error: "Sorry, an error occurred. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
