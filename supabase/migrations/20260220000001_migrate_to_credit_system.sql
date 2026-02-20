-- Migration: Transition from multiple usage metrics to unified credit system
-- Date: 2026-02-20
-- Description: Simplifies pricing by using a single "credits" metric instead of 
--              separate excel_operations, file_uploads, and ai_messages counters

-- Step 1: Update subscription_tiers with new credit-based limits
-- NOTE: Free tier reduced to 50 credits for cost sustainability
UPDATE subscription_tiers 
SET 
  limits = jsonb_build_object(
    'credits_per_month', 50,
    'max_file_size_mb', 5
  ),
  description = 'Try before you buy - perfect for occasional use'
WHERE name = 'free';

UPDATE subscription_tiers 
SET 
  limits = jsonb_build_object(
    'credits_per_month', 2000,
    'max_file_size_mb', 100
  ),
  description = 'For professionals who work with Excel daily'
WHERE name = 'pro';

UPDATE subscription_tiers 
SET 
  limits = jsonb_build_object(
    'credits_per_month', 10000,
    'max_file_size_mb', 500
  ),
  description = 'For teams and power users'
WHERE name = 'enterprise';

-- Step 2: Migrate existing usage_tracking data to credits
-- Convert old metrics to credits using these rules:
-- - excel_operation = 1-2 credits (we'll use average of 1.5)
-- - file_upload = 5 credits
-- - ai_message = 1 credit

-- Create temporary table to store converted data
CREATE TEMP TABLE temp_credit_usage AS
SELECT 
  user_id,
  period_start,
  period_end,
  SUM(
    CASE 
      WHEN resource_type = 'excel_operation' THEN count * 1.5
      WHEN resource_type = 'file_upload' THEN count * 5
      WHEN resource_type = 'ai_message' THEN count * 1
      ELSE 0
    END
  )::INTEGER as total_credits
FROM usage_tracking
GROUP BY user_id, period_start, period_end;

-- Step 3: Drop old constraint and add new one
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_resource_type_check;
ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_resource_type_check 
  CHECK (resource_type IN ('credits'));

-- Step 4: Delete old usage records
DELETE FROM usage_tracking;

-- Step 5: Insert converted credit usage
INSERT INTO usage_tracking (user_id, resource_type, count, period_start, period_end, created_at, updated_at)
SELECT 
  user_id,
  'credits' as resource_type,
  total_credits as count,
  period_start,
  period_end,
  NOW() as created_at,
  NOW() as updated_at
FROM temp_credit_usage
WHERE total_credits > 0;

-- Step 6: Update the unique constraint
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_resource_type_period_start_key;
ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_user_id_resource_type_period_start_key 
  UNIQUE(user_id, resource_type, period_start);

-- Step 7: Update track_usage function to work with credits
CREATE OR REPLACE FUNCTION track_usage(
  p_user_id UUID,
  p_resource_type TEXT,
  p_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Calculate current period (monthly)
  v_period_start := date_trunc('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month';
  
  -- Only accept 'credits' as resource_type
  IF p_resource_type != 'credits' THEN
    RAISE EXCEPTION 'Invalid resource_type. Only "credits" is supported.';
  END IF;
  
  -- Insert or update usage
  INSERT INTO usage_tracking (user_id, resource_type, count, period_start, period_end)
  VALUES (p_user_id, p_resource_type, p_count, v_period_start, v_period_end)
  ON CONFLICT (user_id, resource_type, period_start)
  DO UPDATE SET 
    count = usage_tracking.count + p_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Update check_usage_limit function for credits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_resource_type TEXT DEFAULT 'credits'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_current_usage INTEGER;
  v_period_start TIMESTAMPTZ;
BEGIN
  -- Only accept 'credits' as resource_type
  IF p_resource_type != 'credits' THEN
    RAISE EXCEPTION 'Invalid resource_type. Only "credits" is supported.';
  END IF;

  -- Get user's subscription tier limits
  SELECT (limits->>'credits_per_month')::INTEGER
  INTO v_limit
  FROM subscription_tiers st
  JOIN user_subscriptions us ON us.subscription_tier_id = st.id
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  -- If no subscription, use free tier limits
  IF v_limit IS NULL THEN
    SELECT (limits->>'credits_per_month')::INTEGER
    INTO v_limit
    FROM subscription_tiers
    WHERE name = 'free';
  END IF;
  
  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get current usage
  v_period_start := date_trunc('month', NOW());
  SELECT COALESCE(count, 0)
  INTO v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id 
    AND resource_type = 'credits'
    AND period_start = v_period_start;
  
  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create helper function to get current usage
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

-- Step 10: Add comment for documentation
COMMENT ON TABLE usage_tracking IS 'Tracks user credit usage per monthly period. Credits are the unified metric for all AI actions.';
COMMENT ON FUNCTION track_usage IS 'Tracks credit usage for a user. Only accepts "credits" as resource_type.';
COMMENT ON FUNCTION check_usage_limit IS 'Checks if user has remaining credits. Returns true if user can perform action.';
COMMENT ON FUNCTION get_user_usage IS 'Returns current credit usage, limit, and remaining credits for a user.';

-- Migration complete
-- Users can now use a simple credit system instead of tracking multiple metrics
