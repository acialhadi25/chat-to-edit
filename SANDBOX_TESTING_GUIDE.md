# 🧪 Sandbox Testing Guide - Complete Integration Test

**Date:** February 20, 2026  
**Purpose:** Test DeepSeek + Midtrans + Credit System  
**Environment:** SANDBOX

---

## 🎯 Overview

This guide covers complete end-to-end testing of:
1. DeepSeek API integration
2. Credit tracking system
3. Midtrans payment gateway
4. Subscription management

---

## 🔑 Sandbox Credentials

### DeepSeek API
```
API Key: sk-c20aba98ff9c42e8a57a54a392ca1df4
Endpoint: https://api.deepseek.com/v1/chat/completions
```

### Midtrans Sandbox
```
Merchant ID: your-merchant-id
Client Key: your-midtrans-client-key
Server Key: your-midtrans-server-key
Environment: SANDBOX (not production)
```

### Test Credit Cards
```
Success:
- Card: 4811 1111 1111 1114
- CVV: 123
- Exp: 01/25

Failure:
- Card: 4911 1111 1111 1113
- CVV: 123
- Exp: 01/25
```

---

## 📋 Pre-Testing Checklist

- [ ] .env file updated with sandbox credentials
- [ ] Database migrations run
- [ ] Edge functions deployed
- [ ] Supabase secrets configured
- [ ] Test user account created

---

## 🧪 Test Suite

### Test 1: DeepSeek API Integration

**Run:**
```bash
cd chat-to-edit
deno run --allow-net --allow-env test-deepseek-sandbox.ts
```

**Expected Results:**
- ✅ Simple chat works (1 credit cost)
- ✅ Complex operation works (2 credits cost)
- ✅ Streaming works
- ✅ Cost within IDR 3 per credit

**Validation:**
```sql
-- Check API logs
SELECT * FROM api_usage_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### Test 2: Credit System

**Steps:**
1. Create test user
2. Check initial credits (should be 50 for free tier)
3. Perform AI chat
4. Verify credits deducted

**SQL Commands:**
```sql
-- Check user credits
SELECT * FROM get_user_usage('user-id-here');

-- Check usage tracking
SELECT * FROM usage_tracking 
WHERE user_id = 'user-id-here';
```

---

### Test 3: Midtrans Payment

**Steps:**
1. Navigate to pricing page
2. Click "Upgrade to Pro"
3. Use test card: 4811 1111 1111 1114
4. Complete payment
5. Verify subscription upgraded

**Validation:**
```sql
-- Check transaction
SELECT * FROM transactions 
WHERE user_id = 'user-id-here' 
ORDER BY created_at DESC;

-- Check subscription
SELECT * FROM user_subscriptions 
WHERE user_id = 'user-id-here';
```

---

## 📊 Monitoring Queries

```sql
-- Daily API costs
SELECT * FROM get_daily_api_costs(7);

-- User credit usage
SELECT 
  u.email,
  ut.count as credits_used,
  st.limits->>'credits_per_month' as credits_limit
FROM auth.users u
LEFT JOIN usage_tracking ut ON ut.user_id = u.id
LEFT JOIN user_subscriptions us ON us.user_id = u.id
LEFT JOIN subscription_tiers st ON st.id = us.subscription_tier_id
WHERE ut.resource_type = 'credits';

-- Cache hit rate
SELECT 
  SUM(cache_hit_tokens)::FLOAT / 
  NULLIF(SUM(cache_hit_tokens + cache_miss_tokens), 0) * 100 
  as cache_hit_rate
FROM api_usage_logs;
```

---

## ✅ Success Criteria

- [ ] All DeepSeek tests pass
- [ ] Credits tracked correctly
- [ ] Payment flow works
- [ ] Subscription upgraded
- [ ] API costs within budget
- [ ] No errors in logs

---

**Status:** Ready for Testing  
**Next:** Run tests and validate results
