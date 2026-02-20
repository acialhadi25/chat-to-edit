# 🤖 DeepSeek Integration Guide

**Date:** February 20, 2026  
**Status:** ✅ READY FOR TESTING  
**API Provider:** DeepSeek V3.2

---

## 📋 Overview

ChaTtoEdit now uses DeepSeek as the primary AI provider with full credit tracking and cost monitoring.

### Key Features
- ✅ DeepSeek V3.2 as primary AI
- ✅ Automatic credit checking before operations
- ✅ Credit tracking after operations
- ✅ API cost logging for monitoring
- ✅ Streaming support
- ✅ Cache optimization (40% hit rate target)

---

## 🏗️ Architecture

```
User Request
    │
    ▼
Check Credits (RPC: check_usage_limit)
    │
    ├─ Insufficient? → Return 402 Error
    │
    ▼
Call DeepSeek API
    │
    ▼
Track Credits (RPC: track_usage)
    │
    ▼
Log API Usage (api_usage_logs table)
    │
    ▼
Return Response
```

---

## 📦 Files Created

### 1. Shared Utilities
```
supabase/functions/_shared/
├── deepseek.ts          - DeepSeek API integration
├── credit-tracker.ts    - Credit checking & tracking
└── cors.ts              - CORS headers (existing)
```

### 2. Edge Functions
```
supabase/functions/
└── chat-with-credits/   - New chat function with credit tracking
    └── index.ts
```

### 3. Database Migrations
```
supabase/migrations/
├── 20260220000001_migrate_to_credit_system.sql  - Credit system
└── 20260220000002_create_api_usage_logs.sql     - API logging
```

### 4. Testing
```
test-deepseek-sandbox.ts - Sandbox testing script
```

---

## 🔧 Configuration

### Environment Variables

**Supabase Secrets:**
```bash
# Set DeepSeek API key
supabase secrets set DEEPSEEK_API_KEY=sk-your-key-here

# Verify
supabase secrets list
```

**Local Development (.env):**
```env
DEEPSEEK_API_KEY=sk-c20aba98ff9c42e8a57a54a392ca1df4
```

---

## 🚀 Deployment Steps

### Step 1: Run Database Migrations

```bash
# Navigate to project
cd chat-to-edit

# Run migrations
supabase db push

# Or manually
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260220000001_migrate_to_credit_system.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260220000002_create_api_usage_logs.sql
```

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('api_usage_logs', 'usage_tracking');

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('track_usage', 'check_usage_limit', 'get_user_usage');
```

### Step 2: Deploy Edge Functions

```bash
# Deploy new chat function
supabase functions deploy chat-with-credits

# Verify deployment
supabase functions list
```

### Step 3: Test in Sandbox

```bash
# Run sandbox tests
deno run --allow-net --allow-env test-deepseek-sandbox.ts
```

**Expected Output:**
```
🚀 Starting DeepSeek API Sandbox Tests

🧪 Test 1: Simple AI Chat (1 credit)
✅ Success!
   Duration: 1234ms
   Tokens: 456 (prompt: 123, completion: 333)
   Cost: IDR 3

🧪 Test 2: Complex Operation with Excel Context (2 credits)
✅ Success!
   Duration: 2345ms
   Tokens: 789 (prompt: 456, completion: 333)
   Cost: IDR 6

🧪 Test 3: Streaming Response
✅ Streaming started...
[response content]
   Duration: 1567ms

🧪 Test 4: Cost Validation
   Average cost per request: IDR 3
   Cost for 100 requests: IDR 300
   Cost for 1,000 requests: IDR 3,000
   
   📊 Cost Analysis:
   Projected: IDR 3 per credit
   Actual: IDR 3 per credit
   ✅ Within budget (100% of projection)

📊 TEST SUMMARY
Total Tests: 4
✅ Passed: 4
❌ Failed: 0

🎉 All tests passed!
```

---

## 💻 Usage Examples

### Frontend - Chat with Credit Check

```typescript
import { supabase } from '@/integrations/supabase/client';

async function sendChatMessage(message: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/chat-with-credits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: message }
          ],
          excelContext: null, // Add Excel context if available
        }),
      }
    );
    
    if (response.status === 402) {
      // Insufficient credits
      const error = await response.json();
      alert(`Insufficient credits: ${error.message}`);
      return;
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Process chunk...
      }
    }
    
  } catch (error) {
    console.error('Chat error:', error);
  }
}
```

### Backend - Direct DeepSeek Call

```typescript
import { callDeepSeek, calculateCost } from '../_shared/deepseek.ts';

const response = await callDeepSeek(DEEPSEEK_API_KEY, {
  model: 'deepseek-chat',
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello!' },
  ],
  temperature: 0.3,
  stream: false,
});

const data = await response.json();
const cost = calculateCost(data.usage);

console.log(`Cost: IDR ${cost}`);
```

---

## 📊 Monitoring

### Check API Usage

```sql
-- Get current month usage for a user
SELECT * FROM get_api_usage_stats('user-id-here');

-- Get daily costs
SELECT * FROM get_daily_api_costs(30);

-- Get all logs for a user
SELECT * FROM api_usage_logs 
WHERE user_id = 'user-id-here' 
ORDER BY created_at DESC 
LIMIT 100;
```

### Monitor Credit Usage

```sql
-- Get user's current credit usage
SELECT * FROM get_user_usage('user-id-here');

-- Get all users' credit usage
SELECT 
  u.email,
  ut.count as credits_used,
  st.limits->>'credits_per_month' as credits_limit
FROM auth.users u
LEFT JOIN usage_tracking ut ON ut.user_id = u.id
LEFT JOIN user_subscriptions us ON us.user_id = u.id
LEFT JOIN subscription_tiers st ON st.id = us.subscription_tier_id
WHERE ut.resource_type = 'credits'
ORDER BY ut.count DESC;
```

---

## 🎯 Credit Costs

| Action | Credits | Typical API Cost | Notes |
|--------|---------|------------------|-------|
| AI Chat | 1 | IDR 2-4 | Simple questions |
| Simple Operation | 1 | IDR 2-4 | Sort, filter, format |
| Complex Operation | 2 | IDR 5-8 | Pivot, VLOOKUP, formulas |
| File Upload | 5 | IDR 10-15 | Includes parsing |
| Template Generation | 3 | IDR 8-12 | AI-generated templates |

---

## 💰 Cost Monitoring

### Daily Monitoring

```bash
# Check today's API costs
psql -c "SELECT * FROM get_daily_api_costs(1);"

# Check this week's costs
psql -c "SELECT SUM(total_cost_idr) as weekly_cost 
         FROM get_daily_api_costs(7);"
```

### Monthly Monitoring

```bash
# Check this month's total costs
psql -c "SELECT 
  COUNT(*) as total_requests,
  SUM(cost_idr) as total_cost,
  AVG(cost_idr) as avg_cost_per_request,
  SUM(cache_hit_tokens)::FLOAT / NULLIF(SUM(cache_hit_tokens + cache_miss_tokens), 0) * 100 as cache_hit_rate
FROM api_usage_logs 
WHERE created_at >= date_trunc('month', NOW());"
```

---

## 🚨 Alerts & Thresholds

### Cost Alerts

Set up alerts for:
- Daily cost > IDR 100,000
- Monthly cost > IDR 1,000,000
- Cache hit rate < 30%
- Average cost per request > IDR 5

### Credit Alerts

Monitor:
- Users hitting 80% of credits
- Users hitting 95% of credits
- Users with 0 credits remaining
- Conversion rate from free to paid

---

## 🧪 Testing Checklist

### Sandbox Testing
- [ ] Run `test-deepseek-sandbox.ts`
- [ ] Verify all tests pass
- [ ] Check cost estimates match projections
- [ ] Verify streaming works

### Integration Testing
- [ ] Test credit checking
- [ ] Test credit tracking
- [ ] Test insufficient credits error
- [ ] Test API logging
- [ ] Test with real user account

### Load Testing
- [ ] Test with 10 concurrent requests
- [ ] Test with 100 concurrent requests
- [ ] Monitor response times
- [ ] Monitor error rates

---

## 📈 Performance Optimization

### Cache Optimization

**Current:** 40% cache hit rate (estimated)  
**Target:** 60% cache hit rate

**Strategies:**
1. Reuse system prompts
2. Cache Excel context
3. Use consistent message formatting
4. Implement prompt templates

### Cost Optimization

**Current:** IDR 3 per credit (average)  
**Target:** IDR 2.5 per credit

**Strategies:**
1. Improve cache hit rate
2. Optimize prompt length
3. Use shorter system prompts
4. Batch similar requests

---

## 🔒 Security

### API Key Management
- ✅ Store in Supabase secrets
- ✅ Never expose in frontend
- ✅ Rotate keys quarterly
- ✅ Monitor for unauthorized usage

### Rate Limiting
- ✅ Credit system provides natural rate limiting
- ✅ Monitor for abuse patterns
- ✅ Implement IP-based rate limiting if needed

---

## 🐛 Troubleshooting

### Issue: API calls failing

**Check:**
```bash
# Verify API key is set
supabase secrets list | grep DEEPSEEK

# Test API key directly
curl https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

### Issue: Credits not tracking

**Check:**
```sql
-- Verify function exists
SELECT * FROM pg_proc WHERE proname = 'track_usage';

-- Test function manually
SELECT track_usage('user-id', 'credits', 1);

-- Check usage_tracking table
SELECT * FROM usage_tracking WHERE user_id = 'user-id';
```

### Issue: High costs

**Check:**
```sql
-- Find expensive requests
SELECT * FROM api_usage_logs 
WHERE cost_idr > 10 
ORDER BY cost_idr DESC 
LIMIT 10;

-- Check cache hit rate
SELECT 
  SUM(cache_hit_tokens)::FLOAT / NULLIF(SUM(cache_hit_tokens + cache_miss_tokens), 0) * 100 as cache_hit_rate
FROM api_usage_logs;
```

---

## ✅ Go-Live Checklist

### Pre-Launch
- [ ] All migrations run successfully
- [ ] Edge functions deployed
- [ ] Sandbox tests passing
- [ ] API key configured
- [ ] Monitoring set up
- [ ] Alerts configured

### Launch
- [ ] Deploy to production
- [ ] Monitor first 100 requests
- [ ] Check cost per request
- [ ] Verify credit tracking
- [ ] Monitor error rates

### Post-Launch
- [ ] Daily cost monitoring
- [ ] Weekly performance review
- [ ] Monthly cost analysis
- [ ] Optimize based on data

---

**Prepared by:** Kiro AI Assistant  
**Date:** February 20, 2026  
**Status:** ✅ READY FOR TESTING
