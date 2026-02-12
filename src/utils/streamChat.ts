const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface StreamChatParams {
  messages: { role: string; content: string }[];
  excelContext: Record<string, unknown> | null;
  onDelta: (deltaText: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error, status?: number) => void;
}

export async function streamChat({
  messages,
  excelContext,
  onDelta,
  onDone,
  onError,
}: StreamChatParams) {
  try {
    // Validate environment variables
    if (!import.meta.env.VITE_SUPABASE_URL) {
      throw new Error("VITE_SUPABASE_URL is not configured");
    }
    if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY is not configured");
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, excelContext }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMsg = errorData.error || `Request failed with status ${resp.status}`;
      console.error("Chat Excel error:", { status: resp.status, error: errorMsg });
      onError(new Error(errorMsg), resp.status);
      return;
    }

    if (!resp.body) {
      onError(new Error("No response body"));
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullText = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullText += content;
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, put back and wait
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullText += content;
            onDelta(content);
          }
        } catch { /* ignore */ }
      }
    }

    onDone(fullText);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown streaming error";
    const errorContext = `Excel Chat Streaming (URL: ${CHAT_URL})`;

    console.error("Stream Chat Excel error:", {
      message: errorMsg,
      context: errorContext,
      timestamp: new Date().toISOString(),
      error,
    });

    // Import error mapper
    const { mapAIError } = await import("@/utils/errorMessages");
    const errorResponse = mapAIError(undefined, error, errorContext);

    onError(new Error(`${errorResponse.title}: ${errorResponse.message}`));
  }
}
