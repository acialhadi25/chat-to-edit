# Fix Database Setup - Quick Guide

## Issue

The console shows 404 errors for database functions:
- `get_user_usage` - 404
- `get_user_subscription_tier` - 404

This means the database migrations haven't been applied yet.

## Solution: Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project directory
cd chat-to-edit

# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref iatfkqwwmjohrvdfnmwm

# Apply all pending migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the migration files in order:

#### Step 1: Apply Credit System Migration

Copy contents from: `supabase/migrations/20260220000001_migrate_to_credit_system.sql`

Click "Run" to execute.

#### Step 2: Apply API Usage Logs Migration

Copy contents from: `supabase/migrations/20260220000002_create_api_usage_logs.sql`

Click "Run" to execute.

### Option 3: Manual Function Creation

If migrations fail, create functions manually:

```sql
-- 1. Create get_user_usage function
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE (
  credits_used INTEGER,
  credits_limit INTEGER,
  credits_remaining INTEGER,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_credits_used INTEGER;
  v_credits_limit INTEGER;
BEGIN
  -- Calculate current period
  v_period_start := date_trunc('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month';
  
  -- Get current usage
  SELECT COALESCE(count, 0)
  INTO v_credits_used
  FROM usage_tracking
  WHERE user_id = p_user_id 
    AND resource_type = 'credits'
    AND period_start = v_period_start;
  
  -- Get user's limit
  SELECT (limits->>'credits_per_month')::INTEGER
  INTO v_credits_limit
  FROM subscription_tiers st
  JOIN user_subscriptions us ON us.subscription_tier_id = st.id
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  -- If no subscription, use free tier
  IF v_credits_limit IS NULL THEN
    SELECT (limits->>'credits_per_month')::INTEGER
    INTO v_credits_limit
    FROM subscription_tiers
    WHERE name = 'free';
  END IF;
  
  RETURN QUERY SELECT 
    v_credits_used,
    v_credits_limit,
    GREATEST(v_credits_limit - v_credits_used, 0) as credits_remaining,
    v_period_start,
    v_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_user_usage';
```

## Verify Setup

After applying migrations, test in SQL Editor:

```sql
-- Test get_user_usage function
SELECT * FROM get_user_usage('your-user-id-here');

-- Should return:
-- credits_used | credits_limit | credits_remaining | period_start | period_end
-- 0            | 50            | 50                | 2026-02-01   | 2026-03-01

-- Test get_user_subscription_tier function
SELECT * FROM get_user_subscription_tier('your-user-id-here');

-- Should return tier information
```

## Fix CORS Error

The CORS error on `midtrans-create-transaction` means the edge function needs to be deployed.

### Deploy Edge Functions

```bash
# Deploy Midtrans transaction creation
supabase functions deploy midtrans-create-transaction

# Deploy Midtrans webhook handler
supabase functions deploy midtrans-webhook

# Deploy chat with credits (if needed)
supabase functions deploy chat-with-credits
```

### Set Environment Variables for Edge Functions

```bash
# Set Midtrans credentials
supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

Or via Supabase Dashboard:
1. Go to Project Settings > Edge Functions
2. Click "Manage secrets"
3. Add:
   - `MIDTRANS_SERVER_KEY` = `your-midtrans-server-key`
   - `MIDTRANS_IS_PRODUCTION` = `false`

## Complete Setup Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Migrations applied (`supabase db push`)
- [ ] Functions verified (SQL query test)
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] Test payment flow

## Quick Test After Setup

```bash
# 1. Restart dev server
npm run dev

# 2. Open browser console (F12)
# 3. Navigate to http://localhost:8080/pricing
# 4. Check console - should see NO 404 errors

# 5. Try checkout flow
# Should work without CORS errors
```

## Still Having Issues?

### Check Supabase Project Status

```bash
supabase status
```

Should show:
- API URL: https://iatfkqwwmjohrvdfnmwm.supabase.co
- DB URL: Connected
- Functions: Deployed

### Check Function Logs

```bash
# View edge function logs
supabase functions logs midtrans-create-transaction

# Should show deployment success
```

### Verify Database Connection

```sql
-- In Supabase SQL Editor
SELECT current_database();
SELECT version();

-- Should return database name and PostgreSQL version
```

## Alternative: Reset and Reapply

If migrations are corrupted:

```bash
# WARNING: This will reset your database
supabase db reset

# This will:
# 1. Drop all tables
# 2. Reapply all migrations in order
# 3. Recreate all functions
```

## Need Help?

Common issues:
1. **"Project not linked"** → Run `supabase link --project-ref iatfkqwwmjohrvdfnmwm`
2. **"Permission denied"** → Check you're logged in with correct account
3. **"Migration failed"** → Check SQL syntax in migration files
4. **"CORS error persists"** → Verify edge functions deployed successfully

---

**Next**: After fixing, test with `QUICK_START_PAYMENT.md`
