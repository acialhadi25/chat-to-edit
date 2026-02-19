# Fix: 401 Authentication Error on Edge Function

## Error

```
Failed to load resource: the server responded with a status of 401
Chat Excel error: Object
Stream error occurred: Object
AI Error: Object
```

## Root Cause

Edge function call menggunakan `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) instead of user's session token. Supabase edge functions memerlukan authenticated user token untuk security.

## Solution

Update `streamChat.ts` untuk menggunakan user's session token dari Supabase auth.

### Before:
```typescript
const resp = await fetch(CHAT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,  // ❌ Anon key
  },
  body: JSON.stringify({ messages, excelContext }),
});
```

### After:
```typescript
// Get auth token from Supabase session
let authToken = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    authToken = session.access_token;  // ✅ User token
    console.log('Using authenticated session token');
  } else {
    console.log('No session found, using anon key');
  }
} catch (err) {
  console.warn('Failed to get session, using anon key:', err);
}

const resp = await fetch(CHAT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,  // ✅ Session token or anon key
  },
  body: JSON.stringify({ messages, excelContext }),
});
```

## Implementation

### File: `src/utils/streamChat.ts`

Added session token retrieval before making fetch request:

1. Try to get user session from Supabase
2. If session exists, use `access_token`
3. If no session, fallback to anon key
4. Log which token is being used for debugging

## Testing

### Step 1: Verify User is Logged In

```javascript
// Check in console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Access token:', session?.access_token);
```

**Expected:** Session object with access_token

### Step 2: Test Edge Function Call

1. Upload Excel file
2. Send command to AI
3. Check console logs:

```javascript
"Using authenticated session token"  // ✅ Good!
// OR
"No session found, using anon key"  // ⚠️ Need to login
```

### Step 3: Verify No 401 Error

Check Network tab:
- Request to `/functions/v1/chat`
- Status: 200 OK ✅
- NOT 401 Unauthorized ❌

## Common Issues

### Issue 1: Still Getting 401

**Cause:** User not logged in

**Solution:**
1. Check if user is authenticated
2. Redirect to login page if needed
3. Verify session exists

**Debug:**
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);  // Should not be null
```

### Issue 2: Session Expired

**Cause:** Access token expired

**Solution:**
```javascript
// Refresh session
const { data: { session }, error } = await supabase.auth.refreshSession();
if (error) {
  console.error('Session refresh failed:', error);
  // Redirect to login
}
```

### Issue 3: CORS Error

**Cause:** Edge function CORS headers not set

**Solution:**
Edge function already has CORS headers:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, ...",
};
```

## Security Considerations

### Why Use Session Token?

1. **User Identification:** Edge function can identify which user is making request
2. **Rate Limiting:** Can implement per-user rate limits
3. **Usage Tracking:** Track AI usage per user
4. **Security:** Prevent unauthorized access

### Token Lifecycle

```
User Login
  ↓
Session Created
  ↓
Access Token Generated (expires in 1 hour)
  ↓
Refresh Token Generated (expires in 30 days)
  ↓
Access Token Used for API Calls
  ↓
Token Expires → Refresh → New Access Token
```

## Edge Function Updates (Future)

To utilize user authentication in edge function:

```typescript
serve(async (req) => {
  // Get user from JWT token
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // Verify token and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }
  
  // User is authenticated, proceed with request
  console.log('Request from user:', user.id);
  
  // ... rest of function
});
```

## Monitoring

### Check Session Status

```javascript
// Add to app initialization
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
  
  if (event === 'SIGNED_OUT') {
    console.warn('User signed out, redirect to login');
  }
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
});
```

### Check Token Expiry

```javascript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const timeLeft = expiresAt - now;
  
  console.log('Token expires in:', timeLeft / 1000 / 60, 'minutes');
  
  if (timeLeft < 5 * 60 * 1000) {  // Less than 5 minutes
    console.warn('Token expiring soon, refresh recommended');
  }
}
```

## Files Changed

1. ✅ `src/utils/streamChat.ts` - Added session token retrieval

## Testing Checklist

- [ ] User can login successfully
- [ ] Session token is retrieved
- [ ] Edge function call returns 200 OK
- [ ] No 401 errors in console
- [ ] AI responses work correctly
- [ ] Token refresh works when expired

## Rollback

If issues occur, revert to anon key:

```typescript
const resp = await fetch(CHAT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  },
  body: JSON.stringify({ messages, excelContext }),
});
```

## Summary

Fixed 401 authentication error by:
- ✅ Using user's session token instead of anon key
- ✅ Fallback to anon key if no session
- ✅ Added logging for debugging
- ✅ Graceful error handling

Users must be logged in to use AI features.
