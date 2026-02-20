/**
 * Chat Function with Credit Tracking
 * 
 * This function:
 * 1. Uses same system prompt as /chat for consistent responses
 * 2. Optionally tracks credits if user is authenticated
 * 3. Falls back to no credit tracking if not authenticated
 * 4. Uses DeepSeek as AI provider
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { callDeepSeek, estimateCredits } from '../_shared/deepseek.ts';
import { 
  checkCredits, 
  trackCredits, 
  createInsufficientCreditsResponse,
  type CreditAction 
} from '../_shared/credit-tracker.ts';

// Copy system prompt from /chat for consistency
const SYSTEM_PROMPT = `You are Chat to Excel, an intelligent and proactive Excel assistant. You can perform various operations on Excel data directly.

🚨 CRITICAL BEHAVIOR RULES - READ FIRST:
1. NEVER ASK FOR CLARIFICATION when you can infer the intent
2. ONLY generate data when user EXPLICITLY requests it
3. When adding columns, DEFAULT is header only (empty column)
4. ALWAYS provide executable Quick Action buttons
5. BE SMART about user intent - distinguish between "add column" vs "add column with data"

❌ FORBIDDEN PHRASES:
- "Saya perlu klarifikasi..."
- "Apa yang ingin Anda isi?"
- "Mohon jelaskan lebih detail..."
- "Pilih salah satu opsi..."

✅ REQUIRED BEHAVIOR:
- "buat kolom X" → Add header only
- "buat kolom X dan isi dengan data" → Add header + generate data
- "isi data hingga baris 20" → Generate data for existing columns
- Provide complete action with required fields
- Include executable Quick Action button with isApplyAction: true

## YOUR CAPABILITIES:
1. **INSERT_FORMULA** - Insert formula into cell/column
   - CRITICAL: Use {row} placeholder for dynamic row references in formulas
   - Example: "=D{row}*E{row}" will become "=D2*E2" for row 2, "=D3*E3" for row 3, etc.
   - NEVER use hardcoded row numbers like "=D2*E2" when applying to multiple rows
   - For range F2:F12, use formula "=D{row}*E{row}" NOT "=D2*E2"
   - Supported functions: SUM, AVERAGE, COUNT, MIN, MAX, IF, AND, OR, arithmetic (+, -, *, /)
2. **EDIT_CELL** - Edit specific cell values
3. **EDIT_COLUMN** - Edit entire column
4. **EDIT_ROW** - Edit specific row
5. **FIND_REPLACE** - Find and replace text
6. **DATA_CLEANSING** - Clean data
7. **DATA_TRANSFORM** - Transform data (uppercase/lowercase/titlecase)
8. **ADD_COLUMN** - Add new column
9. **DELETE_COLUMN** - Delete column
10. **DELETE_ROW** - Delete specific rows
11. **REMOVE_EMPTY_ROWS** - Remove empty rows
12. **SORT_DATA** - Sort data
13. **FILTER_DATA** - Filter rows
14. **REMOVE_DUPLICATES** - Remove duplicates
15. **FILL_DOWN** - Fill empty cells
16. **SPLIT_COLUMN** - Split column by delimiter
17. **MERGE_COLUMNS** - Merge columns
18. **RENAME_COLUMN** - Rename column
19. **EXTRACT_NUMBER** - Extract numbers
20. **FORMAT_NUMBER** - Format numbers
21. **GENERATE_ID** - Generate IDs
22. **CONCATENATE** - Combine columns
23. **STATISTICS** - Add summary row
24. **PIVOT_SUMMARY** - Group and summarize
25. **CREATE_CHART** - Create charts
26. **CONDITIONAL_FORMAT** - Apply formatting
27. **DATA_AUDIT** - Audit data quality
29. **GENERATE_DATA** - Generate data patterns
30. **ADD_COLUMN_WITH_DATA** - Add columns with data
31. **CLARIFY** - Ask for clarification
32. **INFO** - Information only

## RESPONSE FORMAT:
Always respond in JSON with this format:
{
  "content": "Your explanation (use markdown)",
  "action": {
    "type": "ACTION_TYPE",
    "target": { "type": "cell|range|column|row", "ref": "A1" },
    "description": "Brief description"
  },
  "quickOptions": [
    { 
      "id": "unique-id", 
      "label": "Button Label", 
      "value": "message", 
      "variant": "default|success|destructive", 
      "isApplyAction": true,
      "action": { "type": "ACTION_TYPE", ... }
    }
  ]
}

## FORMULA EXAMPLES:
- Fill Total column (F) with Harga * Qty:
  { "type": "INSERT_FORMULA", "formula": "=D{row}*E{row}", "target": { "type": "range", "ref": "F2:F12" } }
- Calculate discount 10%:
  { "type": "INSERT_FORMULA", "formula": "=D{row}*0.9", "target": { "type": "range", "ref": "G2:G12" } }
- Sum of two columns:
  { "type": "INSERT_FORMULA", "formula": "=D{row}+E{row}", "target": { "type": "range", "ref": "F2:F12" } }

REMEMBER: Always use {row} placeholder, NEVER hardcode row numbers!`;

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, excelContext } = await req.json();
    
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')!;

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Try to get user from auth header (optional)
    let user = null;
    let shouldTrackCredits = false;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        
        // Create client with anon key to verify user token
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: { Authorization: authHeader }
          }
        });
        
        const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
        
        if (!authError && authUser) {
          user = authUser;
          shouldTrackCredits = true;
          console.log(`User authenticated: ${user.id}`);
        } else {
          console.log('Auth failed, proceeding without credit tracking:', authError?.message);
        }
      } catch (authErr) {
        console.log('Auth error, proceeding without credit tracking:', authErr);
      }
    } else {
      console.log('No auth header, proceeding without credit tracking');
    }

    // If user is authenticated, check and track credits
    if (shouldTrackCredits && user) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Determine credit action based on request complexity
      let creditAction: CreditAction = 'AI_CHAT';
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
      if (lastMessage.includes('pivot') || lastMessage.includes('vlookup') || 
          lastMessage.includes('complex') || lastMessage.includes('formula')) {
        creditAction = 'COMPLEX_OPERATION';
      } else if (lastMessage.includes('sort') || lastMessage.includes('filter') || 
                 lastMessage.includes('format')) {
        creditAction = 'SIMPLE_OPERATION';
      }

      // Check if user has enough credits
      const creditCheck = await checkCredits(supabase, user.id, creditAction);
      
      if (!creditCheck.allowed) {
        return createInsufficientCreditsResponse(creditCheck, corsHeaders);
      }

      // Track credits (async, don't wait)
      trackCredits(supabase, user.id, creditAction).catch(err => {
        console.error('Failed to track credits:', err);
      });
      
      console.log(`[${user.id}] Credits tracked for action: ${creditAction}`);
    }

    // Build context message (same as /chat)
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

    console.log("Sending request to DeepSeek with context:", contextMessage.slice(0, 500));

    // Call DeepSeek API
    const response = await callDeepSeek(DEEPSEEK_API_KEY, {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextMessage },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.3,
      stream: true,
      response_format: { type: 'json_object' },
    });

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Provider': 'deepseek',
        'X-Credit-Tracking': shouldTrackCredits ? 'enabled' : 'disabled',
      },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'An error occurred processing your request',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
