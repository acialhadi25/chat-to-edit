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
import { EXCEL_SYSTEM_PROMPT } from '../_shared/excel-system-prompt.ts';
import { callDeepSeek, estimateCredits } from '../_shared/deepseek.ts';
import { 
  checkCredits, 
  trackCredits, 
  createInsufficientCreditsResponse,
  type CreditAction 
} from '../_shared/credit-tracker.ts';

// Use shared system prompt for consistency
const SYSTEM_PROMPT = EXCEL_SYSTEM_PROMPT;

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
      
      // Initially check with AI_CHAT (minimum cost)
      // We'll track the actual cost after we know what action AI performs
      const initialCreditCheck = await checkCredits(supabase, user.id, 'AI_CHAT');
      
      if (!initialCreditCheck.allowed) {
        return createInsufficientCreditsResponse(initialCreditCheck, corsHeaders);
      }
      
      console.log(`[${user.id}] Initial credit check passed`);
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

    // Create a custom stream to parse response and track credits
    let fullResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Decode and accumulate response
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        
        // Forward the chunk
        controller.enqueue(chunk);
      },
      flush() {
        // After streaming is complete, track credits based on action type
        if (shouldTrackCredits && user) {
          try {
            // Parse the accumulated response to determine action type
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const actionType = parsed.action?.type;
              
              // Determine credit cost based on action type
              let creditAction: CreditAction = 'AI_CHAT';
              
              if (actionType) {
                // Complex operations (2 credits)
                const complexActions = [
                  'INSERT_FORMULA', 'GENERATE_DATA', 'ADD_COLUMN_WITH_DATA',
                  'PIVOT_SUMMARY', 'VLOOKUP', 'SPLIT_COLUMN', 'MERGE_COLUMNS',
                  'CONDITIONAL_FORMAT', 'CREATE_CHART'
                ];
                
                // Simple operations (1 credit)
                const simpleActions = [
                  'EDIT_CELL', 'EDIT_COLUMN', 'EDIT_ROW', 'FIND_REPLACE',
                  'DATA_CLEANSING', 'DATA_TRANSFORM', 'ADD_COLUMN', 'DELETE_COLUMN',
                  'DELETE_ROW', 'REMOVE_EMPTY_ROWS', 'SORT_DATA', 'FILTER_DATA',
                  'REMOVE_DUPLICATES', 'FILL_DOWN', 'RENAME_COLUMN'
                ];
                
                if (complexActions.includes(actionType)) {
                  creditAction = 'COMPLEX_OPERATION';
                } else if (simpleActions.includes(actionType)) {
                  creditAction = 'SIMPLE_OPERATION';
                } else if (actionType === 'DATA_AUDIT') {
                  creditAction = 'AI_CHAT'; // Audit is just analysis, 1 credit
                }
              }
              
              // Track credits asynchronously
              const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
              trackCredits(supabase, user.id, creditAction).catch(err => {
                console.error('Failed to track credits:', err);
              });
              
              console.log(`[${user.id}] Credits tracked: ${creditAction} for action: ${actionType || 'none'}`);
            }
          } catch (err) {
            console.error('Failed to parse response for credit tracking:', err);
            // Fallback: track as AI_CHAT
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            trackCredits(supabase, user.id, 'AI_CHAT').catch(e => {
              console.error('Failed to track fallback credits:', e);
            });
          }
        }
      }
    });

    // Pipe response through transform stream
    const transformedStream = response.body?.pipeThrough(transformStream);

    // Return streaming response
    return new Response(transformedStream, {
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
        message: error instanceof Error ? error.message : String(error),
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
