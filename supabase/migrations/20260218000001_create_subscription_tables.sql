-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_idr INTEGER NOT NULL,
  price_usd INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_tier_id UUID REFERENCES subscription_tiers(id),
  order_id TEXT NOT NULL UNIQUE,
  snap_token TEXT,
  transaction_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'IDR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'settlement', 'denied', 'expired', 'cancelled')),
  payment_type TEXT,
  settlement_time TIMESTAMPTZ,
  fraud_status TEXT,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_logs table for audit trail
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  order_id TEXT,
  transaction_id TEXT,
  status TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('excel_operation', 'file_upload', 'ai_message')),
  count INTEGER DEFAULT 1,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, period_start)
);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, display_name, description, price_idr, price_usd, features, limits, sort_order) VALUES
  (
    'free',
    'Free',
    'Perfect for trying out ChaTtoEdit',
    0,
    0,
    '{"basic_excel_operations": true, "ai_chat": true, "templates": true}',
    '{"excel_operations_per_month": 50, "file_uploads_per_month": 10, "ai_messages_per_month": 20, "max_file_size_mb": 10}',
    1
  ),
  (
    'pro',
    'Pro',
    'For professionals who need more power',
    99000,
    7,
    '{"basic_excel_operations": true, "advanced_excel_operations": true, "ai_chat": true, "templates": true, "priority_support": true, "custom_templates": true}',
    '{"excel_operations_per_month": 1000, "file_uploads_per_month": 100, "ai_messages_per_month": 500, "max_file_size_mb": 100}',
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'For teams and organizations',
    499000,
    35,
    '{"basic_excel_operations": true, "advanced_excel_operations": true, "ai_chat": true, "templates": true, "priority_support": true, "custom_templates": true, "team_collaboration": true, "api_access": true, "dedicated_support": true}',
    '{"excel_operations_per_month": -1, "file_uploads_per_month": -1, "ai_messages_per_month": -1, "max_file_size_mb": 500}',
    3
  );

-- Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_webhook_logs_order_id ON webhook_logs(order_id);

-- Enable Row Level Security
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers (public read)
CREATE POLICY "Anyone can view subscription tiers"
  ON subscription_tiers FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
  ON transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage tracking"
  ON usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for webhook_logs (service role only)
CREATE POLICY "Service role can manage webhook logs"
  ON webhook_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to check user subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TABLE (
  tier_name TEXT,
  tier_display_name TEXT,
  features JSONB,
  limits JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.name,
    st.display_name,
    st.features,
    st.limits,
    COALESCE(us.status, 'none') as status
  FROM subscription_tiers st
  LEFT JOIN user_subscriptions us ON us.subscription_tier_id = st.id AND us.user_id = p_user_id
  WHERE (us.user_id = p_user_id AND us.status = 'active')
     OR (us.user_id IS NULL AND st.name = 'free')
  ORDER BY st.sort_order DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track usage
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
  
  -- Insert or update usage
  INSERT INTO usage_tracking (user_id, resource_type, count, period_start, period_end)
  VALUES (p_user_id, p_resource_type, p_count, v_period_start, v_period_end)
  ON CONFLICT (user_id, resource_type, period_start)
  DO UPDATE SET 
    count = usage_tracking.count + p_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_resource_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_current_usage INTEGER;
  v_period_start TIMESTAMPTZ;
BEGIN
  -- Get user's subscription tier limits
  SELECT (limits->>p_resource_type || '_per_month')::INTEGER
  INTO v_limit
  FROM subscription_tiers st
  JOIN user_subscriptions us ON us.subscription_tier_id = st.id
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  -- If no subscription, use free tier limits
  IF v_limit IS NULL THEN
    SELECT (limits->>p_resource_type || '_per_month')::INTEGER
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
    AND resource_type = p_resource_type
    AND period_start = v_period_start;
  
  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
