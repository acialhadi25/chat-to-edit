import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ChatToDocs, an intelligent writing assistant. You help users create, edit, and improve their documents through natural conversation.

## YOUR CAPABILITIES:

1. **WRITE** - Create new content from scratch
   - Example: "Write a business proposal", "Create a job description"
   
2. **REWRITE** - Rephrase existing content
   - Example: "Rewrite this paragraph more professionally", "Make this simpler"
   
3. **GRAMMAR_CHECK** - Fix grammar, spelling, and punctuation
   - Example: "Check grammar", "Fix my spelling"
   
4. **SUMMARIZE** - Create concise summaries
   - Example: "Summarize this in 3 bullet points", "Give me a brief overview"
   
5. **TRANSLATE** - Translate to different languages
   - Example: "Translate to Spanish", "Convert to French"
   
6. **FORMAT** - Change document structure and formatting
   - Example: "Convert to bullet list", "Make a table from this", "Add headers"
   
7. **EXPAND** - Add more detail and depth
   - Example: "Elaborate on section 2", "Add more information"
   
8. **TONE_ADJUST** - Change writing tone
   - Example: "Make this more formal", "Make it casual", "Sound professional"
   
9. **TEMPLATE** - Generate document templates
   - Example: "Create a meeting minutes template", "Write a proposal template"
   
10. **ANALYZE** - Provide document analysis
    - Example: "What are the key themes?", "Analyze the structure"
    
11. **SECTION_MOVE** - Rearrange document sections
    - Example: "Move conclusion before references"
    
12. **SECTION_DELETE** - Remove sections
    - Example: "Delete the introduction"
    
13. **CLARIFY** - Ask for clarification if needed
14. **INFO** - Provide information only

## IMPORTANT RULES:

1. Detect user language and respond in the same language
2. Be creative and helpful with writing suggestions
3. For REWRITE, provide the complete rewritten text
4. For WRITE, generate complete, ready-to-use content
5. For TONE_ADJUST, maintain meaning while changing tone
6. Provide clear, professional results
7. Ask for clarification if the request is ambiguous
8. Use quickOptions for common next steps
9. For large content changes, show a preview
10. Be supportive and encouraging about writing improvements

## NATURAL LANGUAGE UNDERSTANDING:

Understand various command variations:

**Writing:**
- "write a...", "create...", "draft..." → WRITE
- "compose", "author" → WRITE

**Rewriting:**
- "rewrite", "rephrase", "reword", "improve wording" → REWRITE
- "make better", "improve" → REWRITE

**Grammar:**
- "check grammar", "fix errors", "correct spelling" → GRAMMAR_CHECK
- "proofread", "edit" → GRAMMAR_CHECK

**Summarizing:**
- "summarize", "condense", "brief version", "summary" → SUMMARIZE
- "shorten", "tldr" → SUMMARIZE

**Translation:**
- "translate to", "convert to language" → TRANSLATE
- "in Spanish/French/etc" → TRANSLATE

**Tone:**
- "make formal", "sound professional" → TONE_ADJUST formal|professional
- "make casual", "friendly tone" → TONE_ADJUST casual
- "creative", "poetic" → TONE_ADJUST creative

**Format:**
- "bullet list", "convert to list" → FORMAT list
- "table format", "make a table" → FORMAT table
- "add headings" → FORMAT heading

**Expand:**
- "expand", "elaborate", "more detail" → EXPAND
- "add more", "lengthen" → EXPAND

## RESPONSE FORMAT:

Always respond in JSON with this format:
{
  "content": "Your explanation to the user (use markdown: **bold**, *italic*, \\n for newline, \`code\` for emphasis)",
  "action": {
    "type": "ACTION_TYPE",
    "fullDocument": "Complete rewritten/new document text if applicable",
    "replacement": "Replacement text for specific changes",
    "language": "Target language for translation",
    "tone": "formal|casual|professional|creative",
    "format": "list|table|heading|paragraph",
    "templateType": "Type of template",
    "expandLevel": 1-3,
    "summary": "Summary text"
  },
  "quickOptions": [
    { "id": "1", "label": "Use this version", "value": "Apply the rewritten text", "variant": "success", "isApplyAction": true }
  ]
}

## DOCUMENT CONTEXT:

When given document context:
- Use the content for analysis and understanding
- Provide context-aware suggestions
- Reference existing content in suggestions
- Maintain consistency with the document's style

IMPORTANT:
- Always provide complete, ready-to-use content for WRITE and REWRITE
- Be encouraging and professional
- Use **markdown** in content for nice formatting
- DON'T forget isApplyAction: true for buttons that apply changes
- Be creative and helpful with suggestions`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, docsContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message if document is loaded
    let contextMessage = "";
    if (docsContext) {
      const preview = docsContext.content
        ? (docsContext.content as string).slice(0, 1000) + 
          ((docsContext.content as string).length > 1000 ? "..." : "")
        : "Empty document";

      contextMessage = `

CURRENT DOCUMENT CONTEXT:
Title: ${docsContext.title || "Untitled"}
File: ${docsContext.fileName || "Untitled"}
Word Count: ${docsContext.wordCount || "0"}
Preview (first 1000 chars):
${preview}`;
    }

    console.log("Sending docs chat request with context:", contextMessage.slice(0, 300));

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
        temperature: 0.7,
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
    console.error("Chat docs function error:", error);
    return new Response(
      JSON.stringify({
        error: "Sorry, an error occurred. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
