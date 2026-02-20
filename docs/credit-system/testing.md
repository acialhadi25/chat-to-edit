# 🧪 Test Credit Tracking - Verification Guide

## ✅ Fix Applied

Credit tracking telah diperbaiki dengan perubahan berikut:

1. **Endpoint Updated**: `/functions/v1/chat` → `/functions/v1/chat-with-credits`
2. **Auth Token**: Menggunakan user session token (bukan anon key)
3. **Error Handling**: Menangani 402 Payment Required untuk insufficient credits

---

## 🧪 Testing Steps

### Pre-Test: Check Current Credits

```sql
-- Check user subscription and credits
SELECT 
  user_id,
  tier_name,
  credits_limit,
  credits_remaining,
  credits_used,
  status,
  period_start,
  period_end
FROM user_subscriptions
WHERE user_id = 'YOUR_USER_ID';
```

**Note down**: `credits_remaining` value

---

### Test 1: Simple Chat Operation (1 Credit)

**Steps**:
1. Login to application
2. Upload Excel file or use template
3. Send simple chat message: "Apa isi file ini?"
4. Wait for AI response

**Expected Result**:
- ✅ AI responds successfully
- ✅ Credits decrease by 1

**Verification**:
```sql
-- Check credits after operation
SELECT credits_remaining FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Check API usage log
SELECT * FROM api_usage_logs 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**:
- `credits_remaining` = (previous value - 1)
- New entry in `api_usage_logs` with:
  - `provider` = 'deepseek'
  - `action` = 'AI_CHAT'
  - `total_tokens` > 0
  - `cost_idr` > 0

---

### Test 2: Simple Operation (1 Credit)

**Steps**:
1. Send message: "Sort data by column A ascending"
2. Wait for AI response
3. Apply the action

**Expected Result**:
- ✅ AI responds with sort action
- ✅ Credits decrease by 1

**Verification**:
```sql
SELECT credits_remaining FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';

SELECT * FROM api_usage_logs 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**:
- `credits_remaining` decreased by 1
- `action` = 'SIMPLE_OPERATION'

---

### Test 3: Complex Operation (2 Credits)

**Steps**:
1. Send message: "Create a pivot table summarizing sales by region"
2. Wait for AI response

**Expected Result**:
- ✅ AI responds with pivot action
- ✅ Credits decrease by 2

**Verification**:
```sql
SELECT credits_remaining FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';

SELECT * FROM api_usage_logs 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**:
- `credits_remaining` decreased by 2
- `action` = 'COMPLEX_OPERATION'

---

### Test 4: Multiple Operations

**Steps**:
1. Perform 5 simple operations (5 credits)
2. Check total credit usage

**Verification**:
```sql
-- Check total credits used
SELECT 
  credits_limit,
  credits_used,
  credits_remaining
FROM user_subscriptions 
WHERE user_id = 'YOUR_USER_ID';

-- Check operation history
SELECT 
  created_at,
  action,
  total_tokens,
  cost_idr
FROM api_usage_logs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- `credits_used` increased by 5
- `credits_remaining` decreased by 5
- 5 entries in `api_usage_logs`

---

### Test 5: Insufficient Credits (Error Handling)

**Steps**:
1. Set credits to 0:
```sql
UPDATE user_subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'YOUR_USER_ID';
```

2. Try to send chat message
3. Observe error

**Expected Result**:
- ❌ Error message displayed
- ❌ Message: "Insufficient credits. Please upgrade your plan to continue."
- ❌ No AI response
- ❌ Credits remain at 0

**Verification**:
```sql
-- Verify credits still 0
SELECT credits_remaining FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Verify no new API usage log
SELECT COUNT(*) FROM api_usage_logs 
WHERE user_id = 'YOUR_USER_ID' 
AND created_at > NOW() - INTERVAL '1 minute';
```

**Expected**:
- `credits_remaining` = 0
- No new log entry

**Cleanup**:
```sql
-- Restore credits for further testing
UPDATE user_subscriptions 
SET credits_remaining = 50 
WHERE user_id = 'YOUR_USER_ID';
```

---

### Test 6: Credit Refresh on New Period

**Steps**:
1. Check current period:
```sql
SELECT period_start, period_end, credits_remaining 
FROM user_subscriptions 
WHERE user_id = 'YOUR_USER_ID';
```

2. Simulate period end (manual test):
```sql
-- Simulate new period
UPDATE user_subscriptions 
SET 
  period_start = CURRENT_DATE,
  period_end = CURRENT_DATE + INTERVAL '1 month',
  credits_remaining = credits_limit,
  credits_used = 0
WHERE user_id = 'YOUR_USER_ID';
```

3. Perform operation
4. Verify credits reset

**Expected**:
- ✅ Credits reset to `credits_limit`
- ✅ `credits_used` = 0
- ✅ New period started

---

## 📊 Monitoring Queries

### Daily Credit Usage
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as operations,
  SUM(total_tokens) as total_tokens,
  SUM(cost_idr) as total_cost_idr
FROM api_usage_logs
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Credit Usage by Action Type
```sql
SELECT 
  action,
  COUNT(*) as count,
  AVG(total_tokens) as avg_tokens,
  AVG(cost_idr) as avg_cost_idr
FROM api_usage_logs
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY action
ORDER BY count DESC;
```

### Users Running Low on Credits
```sql
SELECT 
  u.email,
  us.tier_name,
  us.credits_limit,
  us.credits_remaining,
  us.credits_used,
  ROUND((us.credits_remaining::numeric / us.credits_limit::numeric) * 100, 2) as remaining_percentage
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE us.credits_remaining < (us.credits_limit * 0.2) -- Less than 20%
  AND us.status = 'active'
ORDER BY remaining_percentage ASC;
```

### Top Credit Users
```sql
SELECT 
  u.email,
  us.tier_name,
  us.credits_used,
  us.credits_limit,
  COUNT(aul.id) as total_operations,
  SUM(aul.cost_idr) as total_cost_idr
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
LEFT JOIN api_usage_logs aul ON aul.user_id = us.user_id
  AND aul.created_at >= us.period_start
WHERE us.status = 'active'
GROUP BY u.email, us.tier_name, us.credits_used, us.credits_limit
ORDER BY us.credits_used DESC
LIMIT 10;
```

---

## 🔍 Troubleshooting

### Issue: Credits not decreasing

**Check 1**: Verify endpoint
```javascript
// Open browser console
// Check Network tab
// Look for request to: /functions/v1/chat-with-credits
```

**Check 2**: Verify auth token
```javascript
// In browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Access token:', session?.access_token);
```

**Check 3**: Check edge function logs
```bash
npx supabase functions logs chat-with-credits --tail
```

**Check 4**: Verify RPC functions exist
```sql
-- Check if track_usage function exists
SELECT proname FROM pg_proc WHERE proname = 'track_usage';

-- Check if get_user_usage function exists
SELECT proname FROM pg_proc WHERE proname = 'get_user_usage';
```

---

### Issue: 401 Unauthorized

**Cause**: User not authenticated or session expired

**Solution**:
1. Check if user is logged in
2. Refresh page to get new session
3. Verify auth token in request headers

---

### Issue: 402 Payment Required immediately

**Cause**: User has no credits or no subscription

**Solution**:
```sql
-- Check subscription
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';

-- If no subscription, create one
INSERT INTO user_subscriptions (
  user_id,
  tier_name,
  status,
  credits_limit,
  credits_remaining,
  period_start,
  period_end
) VALUES (
  'YOUR_USER_ID',
  'free',
  'active',
  50,
  50,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month'
);
```

---

### Issue: API usage not logged

**Check 1**: Verify table exists
```sql
SELECT * FROM api_usage_logs LIMIT 1;
```

**Check 2**: Check edge function logs
```bash
npx supabase functions logs chat-with-credits --tail
```

**Check 3**: Verify logging code
- Check `supabase/functions/_shared/deepseek.ts`
- Function `logApiUsage` should be called

---

## ✅ Success Criteria

Credit tracking dianggap berhasil jika:

- [x] Credits berkurang setelah setiap operasi
- [x] API usage ter-log di database
- [x] Error 402 muncul saat credits habis
- [x] Credits reset setiap period baru
- [x] Monitoring queries berfungsi
- [x] Edge function logs menunjukkan credit tracking

---

## 📝 Test Results Template

| Test | Expected Credits Used | Actual Credits Used | Status | Notes |
|------|----------------------|---------------------|--------|-------|
| Simple Chat | 1 | | | |
| Simple Operation | 1 | | | |
| Complex Operation | 2 | | | |
| Multiple Operations (5x) | 5 | | | |
| Insufficient Credits | 0 (error) | | | |
| Credit Refresh | Reset to limit | | | |

---

**Created**: February 20, 2025  
**Status**: Ready for Testing  
**Priority**: HIGH
