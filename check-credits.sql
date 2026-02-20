-- Check user credits and usage
SELECT 
  id,
  email,
  credits_remaining,
  credits_limit,
  credits_used,
  subscription_tier,
  updated_at
FROM user_profiles
ORDER BY updated_at DESC
LIMIT 5;

-- Check recent API usage logs
SELECT 
  user_id,
  operation_type,
  credits_used,
  credits_before,
  credits_after,
  created_at
FROM api_usage_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check webhook logs for any errors
SELECT 
  event_type,
  status,
  error_message,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;
