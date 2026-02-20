# 🐛 Credit Tracking Fix - Issue Found!

## ❌ Problem Identified

Credit tidak berkurang saat melakukan operasi Excel karena:

1. **Frontend menggunakan endpoint yang salah**:
   - File: `src/utils/streamChat.ts`
   - Endpoint saat ini: `/functions/v1/chat` ❌
   - Endpoint yang benar: `/functions/v1/chat-with-credits` ✅

2. **Edge function `chat` tidak memiliki credit tracking**:
   - File: `supabase/functions/chat/index.ts`
   - Tidak ada pemanggilan `checkCredits()` ❌
   - Tidak ada pemanggilan `trackCredits()` ❌
   - Tidak ada logging ke `api_usage_logs` ❌

3. **Edge function `chat-with-credits` sudah lengkap tapi tidak digunakan**:
   - File: `supabase/functions/chat-with-credits/index.ts`
   - Sudah ada `checkCredits()` ✅
   - Sudah ada `trackCredits()` ✅
   - Sudah ada logging ✅
   - **TAPI TIDAK PERNAH DIPANGGIL!** ❌

---

## ✅ Solution Options

### Option 1: Update Frontend (RECOMMENDED)
Update `streamChat.ts` untuk menggunakan endpoint yang benar.

**Pros**:
- Menggunakan edge function yang sudah lengkap
- Credit tracking sudah terimplementasi
- API usage logging sudah ada
- Minimal changes

**Cons**:
- Perlu update frontend dan deploy ulang

---

### Option 2: Update Edge Function `chat`
Tambahkan credit tracking ke edge function `chat` yang sudah ada.

**Pros**:
- Tidak perlu update frontend
- Backward compatible

**Cons**:
- Duplikasi code
- Maintain 2 edge functions yang sama
- Lebih banyak code changes

---

## 🔧 Implementation - Option 1 (RECOMMENDED)

### Step 1: Update `streamChat.ts`

**File**: `src/utils/streamChat.ts`

**Change**:
```typescript
// OLD (Line ~67):
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// NEW:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-credits`;
```

### Step 2: Update Authentication

**File**: `src/utils/streamChat.ts`

**Change** (Line ~70-72):
```typescript
// OLD:
const authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log('Using correct anon key for edge function');

// NEW:
// Get user token from Supabase auth
import { supabase } from '@/integrations/supabase/client';
const { data: { session } } = await supabase.auth.getSession();
const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log('Using user auth token for credit tracking');
```

### Step 3: Handle Credit Errors

**File**: `src/utils/streamChat.ts`

**Add after line ~80** (after checking `!resp.ok`):
```typescript
// Handle insufficient credits (402 Payment Required)
if (resp.status === 402) {
  const errorData = await resp.json().catch(() => ({}));
  const apiError: StreamError = {
    type: 'api',
    status: 402,
    message: errorData.message || 'Insufficient credits',
    context: 'Credit check',
    recoverable: false, // User needs to upgrade
  };
  
  console.error('Insufficient credits:', errorData);
  onError(handleStreamError(apiError), 402);
  return;
}
```

---

## 📝 Complete Fix Code

### File: `src/utils/streamChat.ts`

```typescript
// Add import at top
import { supabase } from '@/integrations/supabase/client';

// ... existing code ...

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

    // ✅ FIX: Use chat-with-credits endpoint
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-credits`;

    // ✅ FIX: Get user auth token for credit tracking
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!session?.access_token) {
      console.warn('No user session found, using anon key (credit tracking may not work)');
    } else {
      console.log('Using user auth token for credit tracking');
    }

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ messages, excelContext }),
      signal: timeoutController.signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      
      // ✅ FIX: Handle insufficient credits
      if (resp.status === 402) {
        const apiError: StreamError = {
          type: 'api',
          status: 402,
          message: errorData.message || 'Insufficient credits. Please upgrade your plan.',
          context: 'Credit check',
          recoverable: false,
        };
        
        console.error('Insufficient credits:', errorData);
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

    // ... rest of the code remains the same ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

---

## 🧪 Testing

### Test 1: Verify Credit Deduction

1. Check current credits:
```sql
SELECT credits_remaining FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

2. Perform Excel operation (send chat message)

3. Check credits again:
```sql
SELECT credits_remaining FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

**Expected**: Credits should decrease by 1-2 depending on operation complexity.

### Test 2: Verify API Usage Logging

```sql
SELECT * FROM api_usage_logs 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: New log entry with:
- provider: 'deepseek'
- action: 'AI_CHAT' or 'SIMPLE_OPERATION' or 'COMPLEX_OPERATION'
- token counts
- cost in IDR

### Test 3: Insufficient Credits

1. Set credits to 0:
```sql
UPDATE user_subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'YOUR_USER_ID';
```

2. Try to perform operation

**Expected**: Error message "Insufficient credits"

---

## 📊 Verification Queries

### Check Credit Usage
```sql
SELECT 
  u.email,
  us.tier_name,
  us.credits_limit,
  us.credits_remaining,
  us.credits_used,
  us.period_start,
  us.period_end
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE us.user_id = 'YOUR_USER_ID';
```

### Check API Usage History
```sql
SELECT 
  created_at,
  provider,
  action,
  prompt_tokens,
  completion_tokens,
  total_tokens,
  cost_idr
FROM api_usage_logs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Total Cost This Month
```sql
SELECT 
  COUNT(*) as total_operations,
  SUM(total_tokens) as total_tokens,
  SUM(cost_idr) as total_cost_idr,
  AVG(cost_idr) as avg_cost_per_operation
FROM api_usage_logs
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= date_trunc('month', CURRENT_DATE);
```

---

## 🚀 Deployment Steps

### 1. Update Frontend Code
```bash
# Edit src/utils/streamChat.ts with the changes above
```

### 2. Test Locally
```bash
npm run dev
# Test Excel operations
# Verify credits decrease
```

### 3. Deploy to Production
```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

### 4. Verify Edge Function is Deployed
```bash
npx supabase functions list
```

**Expected output should include**:
- `chat-with-credits` (deployed)

### 5. Test in Production
- Login to production site
- Check current credits
- Perform Excel operation
- Verify credits decreased
- Check API usage logs

---

## 🔍 Troubleshooting

### Issue: Credits still not decreasing

**Check 1**: Verify endpoint is correct
```bash
# Check browser network tab
# Should see request to: /functions/v1/chat-with-credits
```

**Check 2**: Verify auth token is sent
```bash
# Check request headers in network tab
# Should have: Authorization: Bearer <user_token>
```

**Check 3**: Check edge function logs
```bash
npx supabase functions logs chat-with-credits --tail
```

**Check 4**: Verify user has subscription
```sql
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

### Issue: 401 Unauthorized

**Solution**: User token not being sent correctly.
- Check if user is logged in
- Check if session is valid
- Verify auth token extraction in streamChat.ts

### Issue: 402 Payment Required immediately

**Solution**: User has no credits or no subscription.
- Check user_subscriptions table
- Verify credits_remaining > 0
- Check subscription status is 'active'

---

## 📋 Checklist

- [ ] Update `streamChat.ts` endpoint to `/chat-with-credits`
- [ ] Add user auth token extraction
- [ ] Add 402 error handling
- [ ] Test locally
- [ ] Verify credits decrease
- [ ] Check API usage logs
- [ ] Deploy to production
- [ ] Test in production
- [ ] Update documentation

---

**Created**: February 20, 2025  
**Status**: Fix Ready - Needs Implementation  
**Priority**: HIGH - Core functionality broken
