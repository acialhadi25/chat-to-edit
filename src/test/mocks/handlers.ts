// @ts-nocheck
import { http, HttpResponse } from "msw";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://test.supabase.co";

/**
 * MSW handlers for mocking API requests in tests
 */
export const handlers = [
  // Mock Supabase Edge Function - Chat
  http.post(`${SUPABASE_URL}/functions/v1/chat`, async ({ request }) => {
    const body = await request.json();
    const { messages } = body as { messages: Array<{ role: string; content: string }> };
    
    // Simulate streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send mock AI response
        const response = {
          choices: [
            {
              delta: {
                content: "Mock AI response for testing",
              },
            },
          ],
        };
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(response)}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    
    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),

  // Mock Supabase - Profiles table
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([
      {
        user_id: "test-user-id",
        plan: "free",
        files_used_this_month: 5,
        email: "test@example.com",
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/profiles`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 201 });
  }),

  // Mock Supabase - File history table
  http.get(`${SUPABASE_URL}/rest/v1/file_history`, () => {
    return HttpResponse.json([
      {
        id: "test-file-1",
        user_id: "test-user-id",
        file_name: "test.xlsx",
        operation_type: "chat_to_excel",
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/file_history`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        ...body,
        id: "test-file-id",
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Mock Supabase - Chat history table
  http.get(`${SUPABASE_URL}/rest/v1/chat_history`, () => {
    return HttpResponse.json([
      {
        id: "test-chat-1",
        user_id: "test-user-id",
        file_history_id: "test-file-1",
        role: "user",
        content: "Test message",
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/chat_history`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        ...body,
        id: "test-chat-id",
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Mock Supabase Auth
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json();
    const grantType = (body as any).grant_type;
    
    if (grantType === "password") {
      return HttpResponse.json({
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      });
    }
    
    return HttpResponse.json(
      { error: "invalid_grant" },
      { status: 400 }
    );
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: "test-user-id",
      email: "test@example.com",
      created_at: new Date().toISOString(),
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),
];

/**
 * Error handlers for testing error scenarios
 */
export const errorHandlers = [
  // Network error
  http.post(`${SUPABASE_URL}/functions/v1/chat`, () => {
    return HttpResponse.error();
  }),

  // Rate limit error
  http.post(`${SUPABASE_URL}/functions/v1/chat-rate-limit`, () => {
    return HttpResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }),

  // Insufficient credits error
  http.post(`${SUPABASE_URL}/functions/v1/chat-no-credits`, () => {
    return HttpResponse.json(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }),

  // Auth error
  http.post(`${SUPABASE_URL}/functions/v1/chat-auth-error`, () => {
    return HttpResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }),
];
