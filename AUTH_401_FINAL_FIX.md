# 401 Authentication Error - Final Fix

## Problem
Edge function was returning 401 Unauthorized error when called from frontend.

## Root Cause
The code was using `VITE_SUPABASE_PUBLISHABLE_KEY` which has format `sb_publishable_...` instead of the correct `VITE_SUPABASE_ANON_KEY` which is a JWT token.

Supabase edge functions require the anon key (JWT format) for authorization, not the publishable key.

## Environment Variables
```env
# WRONG - This is NOT the anon key
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KSKq2a3SNjQe913c3MTQxg_LiRZVuG_

# CORRECT - This is the anon key (JWT format)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Solution
Changed `streamChat.ts` to use `VITE_SUPABASE_ANON_KEY` instead of `VITE_SUPABASE_PUBLISHABLE_KEY`:

```typescript
// Before (WRONG)
const authToken = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// After (CORRECT)
const authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Files Changed
- `src/utils/streamChat.ts` - Updated to use correct anon key

## Testing
1. Hard refresh browser: `Ctrl + F5`
2. Try sending a message to AI
3. Check console - should see "Using correct anon key for edge function"
4. Should no longer see 401 error
5. AI should respond successfully

## Status
✅ Fixed - Using correct anon key for edge function authorization
