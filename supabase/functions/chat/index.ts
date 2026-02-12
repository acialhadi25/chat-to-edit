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
4. **FIND_REPLACE** - Find and replace text (MUST include findValue & replaceValue)
5. **DATA_CLEANSING** - Clean data (trim excess whitespace, remove double spaces)
6. **DATA_TRANSFORM** - Transform data (MUST include transformType: uppercase/lowercase/titlecase)
7. **ADD_COLUMN** - Add a new column
8. **DELETE_COLUMN** - Delete a column
9. **DELETE_ROW** - Delete specific rows by Excel row number
10. **REMOVE_EMPTY_ROWS** - Remove ALL rows that are 100% empty
11. **SORT_DATA** - Sort data (include sortColumn and sortDirection: asc/desc)
12. **FILTER_DATA** - Filter data by condition (include filterOperator and filterValue)
13. **REMOVE_DUPLICATES** - Remove duplicate rows
14. **FILL_DOWN** - Fill empty cells with value above
15. **SPLIT_COLUMN** - Split a column by delimiter into multiple columns (include delimiter and optionally maxParts)
16. **MERGE_COLUMNS** - Merge multiple columns into one (include mergeColumns array of indices, separator, and newColumnName)
17. **CLARIFY** - If clarification is needed from user
18. **INFO** - Information only, no action

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
14. Use information from dataAnalysis to provide accurate responses
15. For DELETE_ROW, use target.ref with format "row1,row2,row3" (Excel numbers)

## NATURAL LANGUAGE UNDERSTANDING:
You must understand various command variations in everyday language:

**Sorting:**
- "sort descending", "sort A-Z", "order by largest" → SORT_DATA

**Filtering:**
- "show only > 100", "filter values above 50" → FILTER_DATA

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
    "separator": " "
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
        .map((c: {cellRef: string; value: string}) => `${c.cellRef}="${c.value}"`)
        .join(", ") || "none";

      contextMessage = `

CURRENT EXCEL FILE CONTEXT:
File: ${excelContext.fileName}
Sheet: ${excelContext.currentSheet || "Sheet1"}
Headers (Columns): ${headerMapping}
Total Data Rows: ${excelContext.totalRows || excelContext.sampleRows?.length || 0}
Sample Data (first 5 rows, row 2-6 in Excel):
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
- Duplicate row groups: ${excelContext.dataAnalysis.duplicateRows?.length || 0} groups` : ""}`;
    }

    console.log("Sending request to AI with context:", contextMessage.slice(0, 500));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
