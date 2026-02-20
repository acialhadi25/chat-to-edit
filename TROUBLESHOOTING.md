# Troubleshooting Guide

## Current Issues from Console

### ❌ Issue 1: Database Functions Not Found (404)

**Error Messages:**
```
Failed to load resource: the server responded with a status of 404
/rest/v1/rpc/get_user_usage
/rest/v1/rpc/get_user_subscription_tier
```

**Cause:** Database migrations haven't been applied yet.

**Solution:**

#### Quick Fix (Recommended)
```bash
# Run the setup script
.\deploy-setup.ps1  # Windows PowerShell
# or
./deploy-setup.sh   # Linux/Mac
```

#### Manual Fix
```bash
# 1. Link to Supabase project
supabase link --project-ref iatfkqwwmjohrvdfnmwm

# 2. Apply migrations
supabase db push

# 3. Verify functions exist
supabase db execute "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_user_usage';"
```

#### Alternative: Apply via Dashboard
1. Go to https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/sql
2. Open `supabase/migrations/20260220000001_migrate_to_credit_system.sql`
3. Copy entire content
4. Paste in SQL Editor
5. Click "Run"

---

### ❌ Issue 2: CORS Error on Edge Function

**Error Message:**
```
Access to fetch at 'https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-create-transaction' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

**Cause:** Edge function not deployed or CORS headers not configured.

**Solution:**

#### Deploy Edge Functions
```bash
# Deploy transaction creation function
supabase functions deploy midtrans-create-transaction

# Deploy webhook handler
supabase functions deploy midtrans-webhook

# Set environment variables
supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

#### Verify Deployment
```bash
# Check function status
supabase functions list

# View function logs
supabase functions logs midtrans-create-transaction
```

---

## Common Issues & Solutions

### Issue: "Supabase CLI not found"

**Error:**
```
'supabase' is not recognized as an internal or external command
```

**Solution:**
```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

---

### Issue: "Project not linked"

**Error:**
```
Error: Project not linked
```

**Solution:**
```bash
# Link to project
supabase link --project-ref iatfkqwwmjohrvdfnmwm

# Verify link
supabase status
```

---

### Issue: "Not authenticated"

**Error:**
```
Error: Not authenticated
```

**Solution:**
```bash
# Login to Supabase
supabase login

# Follow browser authentication flow
```

---

### Issue: Migration fails with "relation already exists"

**Error:**
```
ERROR: relation "usage_tracking" already exists
```

**Solution:**

This means migrations were partially applied. You have two options:

#### Option 1: Skip to next migration
```bash
# Check which migrations are applied
supabase migration list

# Apply specific migration
supabase db push --include-all
```

#### Option 2: Reset database (⚠️ WARNING: Deletes all data)
```bash
supabase db reset
```

---

### Issue: Edge function deployment fails

**Error:**
```
Error: Failed to deploy function
```

**Solution:**

1. **Check function syntax:**
   ```bash
   # Verify TypeScript/Deno syntax
   deno check supabase/functions/midtrans-create-transaction/index.ts
   ```

2. **Check project limits:**
   - Free tier: 500K function invocations/month
   - Check if limit reached in dashboard

3. **Redeploy with verbose logging:**
   ```bash
   supabase functions deploy midtrans-create-transaction --debug
   ```

---

### Issue: Payment popup doesn't open

**Symptoms:** Click "Pay" button, nothing happens

**Debugging Steps:**

1. **Check browser console:**
   ```javascript
   // Should see Midtrans script loaded
   console.log(window.snap)  // Should not be undefined
   ```

2. **Verify environment variables:**
   ```bash
   # Check .env file
   VITE_MIDTRANS_CLIENT_KEY=Mid-client-Lpyk1mcchaNy5Wib
   VITE_MIDTRANS_IS_PRODUCTION=false
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

4. **Check Network tab:**
   - Look for Midtrans script load
   - Should see: `https://app.sandbox.midtrans.com/snap/snap.js`

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Try incognito mode

---

### Issue: Payment successful but subscription not activated

**Symptoms:** Payment completes, but user still on free tier

**Debugging Steps:**

1. **Check transaction table:**
   ```sql
   SELECT * FROM transactions 
   WHERE customer_email = 'your-email@example.com'
   ORDER BY created_at DESC LIMIT 1;
   ```
   
   Should show:
   - `status` = 'settlement'
   - `user_id` is not null
   - `subscription_tier_id` is not null

2. **Check webhook logs:**
   ```sql
   SELECT * FROM webhook_logs 
   ORDER BY created_at DESC LIMIT 5;
   ```

3. **Check user subscription:**
   ```sql
   SELECT * FROM user_subscriptions 
   WHERE user_id = 'your-user-id';
   ```

**Solutions:**

#### If transaction missing user_id:
```sql
-- Update transaction with user_id
UPDATE transactions 
SET user_id = 'your-user-id',
    subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name = 'pro')
WHERE order_id = 'ORDER-xxx';
```

#### If webhook not received:
1. Check Midtrans dashboard for webhook delivery status
2. Verify webhook URL configured: `https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook`
3. Manually trigger webhook from Midtrans dashboard

#### Manual subscription activation:
```sql
INSERT INTO user_subscriptions (
  user_id, 
  subscription_tier_id, 
  status, 
  current_period_start, 
  current_period_end
)
SELECT 
  'your-user-id',
  id,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM subscription_tiers 
WHERE name = 'pro'
ON CONFLICT (user_id) 
DO UPDATE SET
  subscription_tier_id = EXCLUDED.subscription_tier_id,
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days';
```

---

### Issue: Credit limit not updating

**Symptoms:** Subscription active but still shows 50 credits

**Debugging Steps:**

1. **Check subscription status:**
   ```sql
   SELECT 
     us.status,
     st.name,
     st.limits
   FROM user_subscriptions us
   JOIN subscription_tiers st ON st.id = us.subscription_tier_id
   WHERE us.user_id = 'your-user-id';
   ```

2. **Test get_user_usage function:**
   ```sql
   SELECT * FROM get_user_usage('your-user-id');
   ```

**Solutions:**

1. **Refresh page:** React Query cache needs refresh
2. **Clear cache:** 
   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```
3. **Check tier limits:**
   ```sql
   SELECT name, limits FROM subscription_tiers;
   ```

---

### Issue: "Failed to fetch" error

**Error:**
```
TypeError: Failed to fetch
```

**Causes & Solutions:**

1. **Network issue:**
   - Check internet connection
   - Try different network

2. **CORS issue:**
   - Deploy edge functions
   - Check CORS headers in function

3. **Function not deployed:**
   ```bash
   supabase functions deploy midtrans-create-transaction
   ```

4. **Wrong URL:**
   - Check `VITE_SUPABASE_URL` in `.env`
   - Should be: `https://iatfkqwwmjohrvdfnmwm.supabase.co`

---

## Verification Checklist

After fixing issues, verify everything works:

### ✅ Database Setup
```sql
-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_user_usage',
  'get_user_subscription_tier',
  'track_usage',
  'check_usage_limit'
);

-- Should return 4 rows
```

### ✅ Edge Functions
```bash
# List deployed functions
supabase functions list

# Should show:
# - midtrans-create-transaction
# - midtrans-webhook
# - chat-with-credits
```

### ✅ Environment Variables
```bash
# Check secrets
supabase secrets list

# Should show:
# - MIDTRANS_SERVER_KEY
# - MIDTRANS_IS_PRODUCTION
# - DEEPSEEK_API_KEY
```

### ✅ Frontend
1. Visit `http://localhost:8080/pricing`
2. Open browser console (F12)
3. Should see NO 404 errors
4. Should see NO CORS errors

### ✅ Payment Flow
1. Click "Upgrade to Pro"
2. Midtrans popup opens
3. Complete test payment
4. Subscription activated
5. Credit limit updated

---

## Getting Help

### Check Logs

**Edge Function Logs:**
```bash
supabase functions logs midtrans-create-transaction --tail
supabase functions logs midtrans-webhook --tail
```

**Database Logs:**
```sql
-- Check recent errors
SELECT * FROM pg_stat_statements 
ORDER BY calls DESC LIMIT 10;
```

### Useful Commands

```bash
# Project status
supabase status

# Database status
supabase db status

# List migrations
supabase migration list

# List functions
supabase functions list

# List secrets
supabase secrets list
```

### Documentation References

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Midtrans Docs](https://docs.midtrans.com/)
- Project Docs:
  - `FIX_DATABASE_SETUP.md`
  - `PAYMENT_IMPLEMENTATION_GUIDE.md`
  - `test-payment-flow.md`

---

## Still Stuck?

1. **Reset everything:**
   ```bash
   # ⚠️ WARNING: Deletes all data
   supabase db reset
   ./deploy-setup.sh
   ```

2. **Check Supabase Dashboard:**
   - https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm
   - Look for errors in logs
   - Check table data

3. **Verify credentials:**
   - Midtrans sandbox credentials correct
   - Supabase project ID correct
   - API keys valid

4. **Test in isolation:**
   - Test database functions directly in SQL Editor
   - Test edge functions with curl
   - Test Midtrans API separately

---

**Last Updated:** February 20, 2026
