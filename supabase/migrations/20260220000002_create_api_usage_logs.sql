-- Create API usage logs table for monitoring and cost tracking
-- This helps us monitor actual API costs vs projections

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('deepseek', 'lovable', 'other')),
  action TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cache_hit_tokens INTEGER DEFAULT 0,
  cache_miss_tokens INTEGER DEFAULT 0,
  cost_idr INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_provider ON api_usage_logs(provider);

-- Enable Row Level Security
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own API usage logs"
  ON api_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage API usage logs"
  ON api_usage_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to get API usage statistics
CREATE OR REPLACE FUNCTION get_api_usage_stats(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost_idr BIGINT,
  avg_tokens_per_request NUMERIC,
  avg_cost_per_request NUMERIC,
  cache_hit_rate NUMERIC,
  provider_breakdown JSONB
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Default to current month if not specified
  v_start_date := COALESCE(p_start_date, date_trunc('month', NOW()));
  v_end_date := COALESCE(p_end_date, NOW());
  
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as req_count,
      SUM(total_tokens) as tok_sum,
      SUM(cost_idr) as cost_sum,
      SUM(cache_hit_tokens) as cache_hits,
      SUM(cache_miss_tokens) as cache_misses,
      jsonb_object_agg(
        provider,
        jsonb_build_object(
          'requests', COUNT(*),
          'tokens', SUM(total_tokens),
          'cost_idr', SUM(cost_idr)
        )
      ) as providers
    FROM api_usage_logs
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND created_at >= v_start_date
      AND created_at <= v_end_date
  )
  SELECT
    req_count,
    tok_sum,
    cost_sum,
    CASE WHEN req_count > 0 THEN ROUND(tok_sum::NUMERIC / req_count, 2) ELSE 0 END,
    CASE WHEN req_count > 0 THEN ROUND(cost_sum::NUMERIC / req_count, 2) ELSE 0 END,
    CASE 
      WHEN (cache_hits + cache_misses) > 0 
      THEN ROUND((cache_hits::NUMERIC / (cache_hits + cache_misses)) * 100, 2)
      ELSE 0 
    END,
    providers
  FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get daily API costs (for monitoring)
CREATE OR REPLACE FUNCTION get_daily_api_costs(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_requests BIGINT,
  total_cost_idr BIGINT,
  avg_cost_per_request NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    SUM(cost_idr) as total_cost_idr,
    ROUND(AVG(cost_idr), 2) as avg_cost_per_request
  FROM api_usage_logs
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE api_usage_logs IS 'Logs all API calls for cost monitoring and optimization';
COMMENT ON FUNCTION get_api_usage_stats IS 'Get aggregated API usage statistics for a user or all users';
COMMENT ON FUNCTION get_daily_api_costs IS 'Get daily API cost breakdown for monitoring';

-- Grant necessary permissions
GRANT SELECT ON api_usage_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_api_costs TO authenticated;
