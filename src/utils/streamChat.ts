import { supabase } from '@/integrations/supabase/client';

// Default timeout for streaming requests (30 seconds)
const DEFAULT_STREAM_TIMEOUT = 30000;

interface StreamChatParams {
  messages: { role: string; content: string }[];
  excelContext: Record<string, unknown> | null;
  onDelta: (deltaText: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error, status?: number) => void;
  timeout?: number; // Optional timeout in milliseconds
}

/**
 * StreamError interface for classifying stream-related errors
 * Validates: Requirements 6.3, 6.4, 7.4
 */
export interface StreamError {
  type: 'network' | 'parse' | 'timeout' | 'api';
  status?: number;
  message: string;
  context: string;
  recoverable: boolean;
  originalError?: Error;
}

/**
 * Process a single stream line with buffer management for incomplete JSON
 * Validates: Requirements 7.2
 *
 * @param line - The SSE line to process (should start with "data: ")
 * @param buffer - Current buffer of incomplete JSON
 * @returns Object with processed status, remaining buffer, and extracted content
 */
function processStreamLine(
  line: string,
  buffer: string
): {
  processed: boolean;
  remainingBuffer: string;
  content?: string;
} {
  // Skip empty lines, comments, and non-data lines
  if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) {
    return { processed: false, remainingBuffer: buffer, content: undefined };
  }

  const jsonStr = line.slice(6).trim();

  // Handle [DONE] marker
  if (jsonStr === '[DONE]') {
    return { processed: true, remainingBuffer: '', content: undefined };
  }

  // Combine buffer with new line if buffer exists
  const textToParse = buffer ? buffer + jsonStr : jsonStr;

  try {
    const parsed = JSON.parse(textToParse);
    const content = parsed.choices?.[0]?.delta?.content as string | undefined;

    // Successfully parsed, clear buffer
    return {
      processed: true,
      remainingBuffer: '',
      content: content || undefined,
    };
  } catch (parseError) {
    // JSON is incomplete, add to buffer and wait for next chunk
    return {
      processed: false,
      remainingBuffer: textToParse,
      content: undefined,
    };
  }
}

/**
 * Handle stream errors with proper classification and logging
 * Validates: Requirements 6.3, 6.4, 6.5
 */
function handleStreamError(error: StreamError): Error {
  // Log detailed error information for debugging
  console.error('Stream error occurred:', {
    type: error.type,
    status: error.status,
    message: error.message,
    context: error.context,
    recoverable: error.recoverable,
    timestamp: new Date().toISOString(),
    originalError: error.originalError,
  });

  // Create user-friendly error message based on type
  let userMessage = error.message;

  switch (error.type) {
    case 'timeout':
      userMessage = `Request timed out: ${error.message}. The AI is taking longer than expected to respond.`;
      break;
    case 'network':
      userMessage = `Network error: ${error.message}. Please check your connection and try again.`;
      break;
    case 'parse':
      userMessage = `Response parsing error: ${error.message}. The AI response was incomplete or malformed.`;
      break;
    case 'api':
      userMessage = `API error: ${error.message}`;
      break;
  }

  return new Error(userMessage);
}

export async function streamChat({
  messages,
  excelContext,
  onDelta,
  onDone,
  onError,
  timeout = DEFAULT_STREAM_TIMEOUT,
}: StreamChatParams) {
  // Setup timeout handling
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeout);

  try {
    // Validate environment variables
    if (!import.meta.env.VITE_SUPABASE_URL) {
      const configError: StreamError = {
        type: 'api',
        message: 'VITE_SUPABASE_URL is not configured',
        context: 'Environment validation',
        recoverable: false,
      };
      throw handleStreamError(configError);
    }
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const configError: StreamError = {
        type: 'api',
        message: 'VITE_SUPABASE_ANON_KEY is not configured',
        context: 'Environment validation',
        recoverable: false,
      };
      throw handleStreamError(configError);
    }

    // Use chat-with-credits endpoint for credit tracking
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-credits`;
    const FALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

    // Get user auth token (required for credit tracking)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      const authError: StreamError = {
        type: 'api',
        status: 401,
        message: 'User not authenticated. Please login to continue.',
        context: 'Authentication check',
        recoverable: false,
      };
      throw handleStreamError(authError);
    }
    
    console.log('Using user auth token for credit tracking');

    let resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ messages, excelContext }),
      signal: timeoutController.signal,
    });

    // Fallback to /chat endpoint if credit tracking fails with 401
    if (resp.status === 401) {
      console.warn('Credit tracking endpoint failed with 401, falling back to /chat endpoint');
      resp = await fetch(FALLBACK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages, excelContext }),
        signal: timeoutController.signal,
      });
    }

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      
      // ✅ FIX: Handle insufficient credits (402 Payment Required)
      if (resp.status === 402) {
        const apiError: StreamError = {
          type: 'api',
          status: 402,
          message: errorData.message || 'Insufficient credits. Please upgrade your plan to continue.',
          context: 'Credit check',
          recoverable: false, // User needs to upgrade
        };
        
        console.error('Insufficient credits:', {
          credits_remaining: errorData.credits_remaining,
          credits_limit: errorData.credits_limit,
          credits_used: errorData.credits_used,
        });
        onError(handleStreamError(apiError), 402);
        return;
      }
      
      const errorMsg = errorData.error || `Request failed with status ${resp.status}`;

      const apiError: StreamError = {
        type: 'api',
        status: resp.status,
        message: errorMsg,
        context: 'API request',
        recoverable: resp.status === 429 || resp.status >= 500,
      };

      console.error('Chat Excel error:', { status: resp.status, error: errorMsg });
      onError(handleStreamError(apiError), resp.status);
      return;
    }

    if (!resp.body) {
      const bodyError: StreamError = {
        type: 'network',
        message: 'No response body received from server',
        context: 'Response validation',
        recoverable: true,
      };
      onError(handleStreamError(bodyError));
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let jsonBuffer = ''; // Buffer for incomplete JSON
    let fullText = '';
    let streamDone = false;
    let lastChunkTime = Date.now();

    while (!streamDone) {
      // Check for timeout between chunks
      if (Date.now() - lastChunkTime > timeout) {
        const timeoutError: StreamError = {
          type: 'timeout',
          message: `No data received for ${timeout}ms`,
          context: 'Stream reading',
          recoverable: true,
        };
        throw handleStreamError(timeoutError);
      }

      const { done, value } = await reader.read();
      if (done) break;

      lastChunkTime = Date.now();
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);

        // Process line with buffer management
        const result = processStreamLine(line, jsonBuffer);

        if (result.processed) {
          // Successfully processed
          jsonBuffer = result.remainingBuffer;

          // Check if this was [DONE] marker
          if (line.includes('[DONE]')) {
            streamDone = true;
            break;
          }

          // Add content if available
          if (result.content) {
            fullText += result.content;
            onDelta(result.content);
          }
        } else {
          // Not processed or incomplete JSON
          jsonBuffer = result.remainingBuffer;
        }
      }
    }

    // Final flush of remaining buffer
    if (textBuffer.trim() || jsonBuffer.trim()) {
      const lines = textBuffer.split('\n');
      for (let raw of lines) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);

        const result = processStreamLine(raw, jsonBuffer);

        if (result.processed && result.content) {
          fullText += result.content;
          onDelta(result.content);
        }

        jsonBuffer = result.remainingBuffer;
      }

      // Log warning if there's still incomplete JSON in buffer
      if (jsonBuffer.trim()) {
        console.warn('Stream ended with incomplete JSON in buffer:', jsonBuffer);
      }
    }

    clearTimeout(timeoutId);
    onDone(fullText);
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError: StreamError = {
        type: 'timeout',
        message: `Request exceeded ${timeout}ms timeout`,
        context: 'Stream request',
        recoverable: true,
        originalError: error,
      };
      onError(handleStreamError(timeoutError));
      return;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError: StreamError = {
        type: 'network',
        message: error.message,
        context: 'Network request',
        recoverable: true,
        originalError: error,
      };
      onError(handleStreamError(networkError));
      return;
    }

    // If already a handled StreamError, just pass through
    if (error instanceof Error) {
      onError(error);
      return;
    }

    // Fallback for unknown errors
    const unknownError: StreamError = {
      type: 'network',
      message: error instanceof Error ? error.message : 'Unknown streaming error',
      context: 'Excel Chat Streaming',
      recoverable: true,
      originalError: error instanceof Error ? error : undefined,
    };

    console.error('Stream Chat Excel error:', {
      message: unknownError.message,
      context: unknownError.context,
      timestamp: new Date().toISOString(),
      error,
    });

    onError(handleStreamError(unknownError));
  }
}
