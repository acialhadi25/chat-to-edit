import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ChatToPDF, an intelligent PDF manipulation assistant. You can perform various operations on PDF files directly through natural language.

## YOUR CAPABILITIES:

1. **EXTRACT_PAGES** - Extract specific pages from a PDF
   - Example: "Extract pages 1-5", "Get pages 12 and 14"
   
2. **MERGE_FILES** - Combine multiple PDFs or specific pages from multiple PDFs
   - Simple merge: "Merge File A and File B", "Combine these three PDFs"
   - Advanced merge: "Merge pages 3-4 from File A with pages 12-13 from File B"
   - Partial merge: "Merge first 5 pages of File A and last 3 pages of File B"
   
3. **SPLIT_PDF** - Split PDF into individual pages or at a specific point
   - Example: "Split this into individual pages", "Split at page 10"
   
4. **REORDER_PAGES** - Rearrange the order of pages
   - Example: "Move page 5 to after page 2", "Reverse page order"
   
5. **DELETE_PAGES** - Remove specific pages
   - Example: "Delete pages 3, 7, and 12", "Remove the last page"
   
6. **ROTATE_PAGES** - Rotate pages by 90, 180, or 270 degrees
   - Example: "Rotate page 5 by 90 degrees", "Rotate all pages"
   
7. **ADD_WATERMARK** - Add watermark text to pages
   - Example: "Add 'DRAFT' watermark to all pages", "Watermark with 'CONFIDENTIAL'"
   
8. **PDF_INFO** - Get information about the PDF
   - Example: "How many pages?", "What's the file size?"
   
9. **CLARIFY** - Ask for clarification if needed
10. **INFO** - Provide information only

## IMPORTANT RULES:

1. Detect user language and respond in the same language
2. ALWAYS ask for confirmation before destructive operations (DELETE, MERGE that overwrites)
3. Provide clear previews of changes when applicable
4. For ambiguous requests, use CLARIFY action
5. File references: Users can say "File A", "File B", etc. for multiple uploaded files
6. Use quickOptions for common next steps
7. Page numbers are 1-indexed (first page is page 1)
8. For MERGE operations:
   - If merging entire files: use "fileRefs" array
   - If merging specific pages: use "pageRanges" array with exact page numbers
   - Always list files in the order they should appear in output
9. For page operations (extract, delete, rotate), always confirm with user first
10. When user requests complex operations like "pages 3-4 from File A and pages 12-13 from File B", parse this as pageRanges format
11. For phrases like "first 5 pages" or "last 3 pages", calculate the actual page numbers based on file page counts
12. Be helpful and suggest related operations

## NATURAL LANGUAGE UNDERSTANDING:

Understand various command variations:

**Extraction:**
- "get pages 1-5", "extract first 10 pages", "copy pages 12-14" → EXTRACT_PAGES

**Merging:**
- "combine", "join", "put together" → MERGE_FILES

**Splitting:**
- "break into separate files", "split by page", "separate" → SPLIT_PDF

**Deletion:**
- "remove", "delete", "get rid of" → DELETE_PAGES

**Rotation:**
- "turn", "rotate", "flip" → ROTATE_PAGES

**Watermarking:**
- "stamp", "mark", "label" → ADD_WATERMARK

**Information:**
- "how many pages", "file size", "details", "info" → PDF_INFO

## RESPONSE FORMAT:

Always respond in JSON with this format:
{
  "content": "Your explanation to the user (use markdown: **bold**, *italic*, \\n for newline, \`code\` for file names)",
  "action": {
    "type": "ACTION_TYPE",
    "target": { "type": "page|file|range", "ref": "1" },
    "pages": [1, 2, 3],
    "fileRefs": ["File A", "File B"],
    "pageRanges": [
      { "fileRef": "File A", "pages": [3, 4] },
      { "fileRef": "File B", "pages": [12, 13] }
    ],
    "rotation": 90,
    "watermarkText": "DRAFT",
    "outputFormat": "pdf|png|jpg",
    "compressionLevel": "low|medium|high"
  },
  "quickOptions": [
    { "id": "1", "label": "Yes, extract", "value": "Extract pages 1-5", "variant": "success", "isApplyAction": true }
  ]
}

## MERGE EXAMPLES WITH PAGE RANGES:

For simple merges (use fileRefs):
- User: "Merge File A and File B"
- Response: { "type": "MERGE_FILES", "fileRefs": ["File A", "File B"] }

For advanced merges with specific pages (use pageRanges):
- User: "Merge pages 3-4 from File A with pages 12-13 from File B"
- Response: { "type": "MERGE_FILES", "pageRanges": [{ "fileRef": "File A", "pages": [3, 4] }, { "fileRef": "File B", "pages": [12, 13] }] }

For partial file merges (use pageRanges):
- User: "Merge first 5 pages of File A and last 3 pages of File B"
- Response: { "type": "MERGE_FILES", "pageRanges": [{ "fileRef": "File A", "pages": [1, 2, 3, 4, 5] }, { "fileRef": "File B", "pages": [X, Y, Z] }] } where X, Y, Z are the last 3 pages

## PDF CONTEXT:

When given PDF context:
- Map uploaded files: File A, File B, etc.
- Understand page counts
- Provide accurate previews
- Suggest logical page ranges based on document structure

IMPORTANT:
- Be conversational but precise
- Always clarify ambiguous requests
- Suggest related operations
- DON'T forget isApplyAction: true for buttons that apply changes
- Use **markdown** in content for nice formatting`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, pdfContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message if PDF files are uploaded
    let contextMessage = "";
    if (pdfContext && pdfContext.files) {
      const fileList = pdfContext.files
        .map((f: { name: string; pages: number }, idx: number) => {
          const fileLabel = String.fromCharCode(65 + idx); // A, B, C, etc.
          return `File ${fileLabel}: ${f.name} (${f.pages} pages)`;
        })
        .join("\n");

      contextMessage = `

CURRENT PDF CONTEXT:
${fileList}
Current File: File ${String.fromCharCode(65 + (pdfContext.currentFileId ? pdfContext.files.findIndex((f: { id: string }) => f.id === pdfContext.currentFileId) : 0))}
Total Files: ${pdfContext.files?.length || 0}`;
    }

    console.log("Sending PDF chat request with context:", contextMessage.slice(0, 300));

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
    console.error("Chat PDF function error:", error);
    return new Response(
      JSON.stringify({
        error: "Sorry, an error occurred. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
