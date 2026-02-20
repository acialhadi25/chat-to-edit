/**
 * Chat Function with Credit Tracking
 * 
 * This is the updated chat function that:
 * 1. Uses DeepSeek as primary AI provider
 * 2. Tracks credit usage
 * 3. Logs API costs for monitoring
 * 4. Enforces credit limits
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { callDeepSeek, calculateCost, logApiUsage, estimateCredits } from '../_shared/deepseek.ts';
import { 
  checkCredits, 
  trackCredits, 
  createInsufficientCreditsResponse,
  type CreditAction 
} from '../_shared/credit-tracker.ts';

// System prompt for Excel operations
const SYSTEM_PROMPT = `You are an AI assistant specialized in Excel operations. You help users manipulate Excel data through natural language commands.

IMPORTANT RULES:
1. Always respond in valid JSON format
2. For operations, return: {"type": "operation", "operation": "...", "params": {...}}
3. For questions, return: {"type": "response", "message": "..."}
4. Be precise with cell references and ranges
5. Validate user requests before executing

Available operations:
- sort: Sort data by column
- filter: Filter rows based on conditions
- formula: Add formulas to cells
- format: Format cells (bold, color, etc.)
- pivot: Create pivot tables
- chart: Generate charts
- analyze: Analyze data patterns

Always consider the Excel context provided and give accurate responses.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')!;

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { messages, excelContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine credit action based on request complexity
    let creditAction: CreditAction = 'AI_CHAT';
    
    // Check if this is a complex operation
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

    // Build context message if Excel file is uploaded
    let contextMessage = '';
    if (excelContext) {
      const headerMapping = excelContext.headers
        ?.map((h: string, i: number) => `Col${i}="${h}"`)
        .join(', ') || '';

      const sampleDataStr = excelContext.sampleRows
        ?.map((row: any[], idx: number) =>
          `Row ${idx + 2}: ${row.map((cell, i) => `Col${i}=${JSON.stringify(cell)}`).join(', ')}`
        )
        .join('\n') || 'No sample data';

      contextMessage = `\n\nCURRENT EXCEL FILE CONTEXT:
File: ${excelContext.fileName || 'Unknown'}
Sheet: ${excelContext.currentSheet || 'Sheet1'}
Headers: ${headerMapping}
Total Rows: ${excelContext.totalRows || 0}
Sample Data:
${sampleDataStr}`;
    }

    console.log(`[${user.id}] Making DeepSeek API call (action: ${creditAction})`);

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

    // For streaming responses, we need to track credits after the stream completes
    // We'll track immediately for now (optimistic tracking)
    // In production, you might want to track after stream completes
    
    // Track credits (async, don't wait)
    trackCredits(supabase, user.id, creditAction).catch(err => {
      console.error('Failed to track credits:', err);
    });

    // Note: For streaming responses, we can't easily get usage stats
    // We'll estimate based on message length
    const estimatedCredits = estimateCredits([
      { role: 'system', content: SYSTEM_PROMPT + contextMessage },
      ...messages,
    ]);

    // Log estimated usage (async, don't wait)
    logApiUsage(
      supabase,
      user.id,
      {
        prompt_tokens: estimatedCredits * 200, // Rough estimate
        completion_tokens: 300, // Rough estimate
        total_tokens: estimatedCredits * 200 + 300,
      },
      estimatedCredits * 3, // Rough cost estimate (IDR 3 per credit)
      creditAction
    ).catch(err => {
      console.error('Failed to log API usage:', err);
    });

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Provider': 'deepseek',
        'X-Credits-Remaining': creditCheck.creditsRemaining.toString(),
        'X-Credits-Used': creditAction,
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
