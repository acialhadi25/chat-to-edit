-- Create usage_events table for granular usage tracking
CREATE TABLE public.usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('file_upload', 'ai_request', 'action_applied', 'formula_generated', 'export_download')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_type ON public.usage_events(event_type);
CREATE INDEX idx_usage_events_created_at ON public.usage_events(created_at);
CREATE INDEX idx_usage_events_user_created ON public.usage_events(user_id, created_at);

-- Enable RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Policies for usage_events
CREATE POLICY "Users can view their own usage events"
  ON public.usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage events"
  ON public.usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get usage summary for current month
CREATE OR REPLACE FUNCTION public.get_monthly_usage_summary(p_user_id UUID)
RETURNS TABLE (
  files_uploaded BIGINT,
  ai_requests BIGINT,
  actions_applied BIGINT,
  formulas_generated BIGINT,
  exports_downloaded BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'file_upload') as files_uploaded,
    COUNT(*) FILTER (WHERE event_type = 'ai_request') as ai_requests,
    COUNT(*) FILTER (WHERE event_type = 'action_applied') as actions_applied,
    COUNT(*) FILTER (WHERE event_type = 'formula_generated') as formulas_generated,
    COUNT(*) FILTER (WHERE event_type = 'export_download') as exports_downloaded
  FROM public.usage_events
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now() + interval '1 month');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to log usage event
CREATE OR REPLACE FUNCTION public.log_usage_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.usage_events (user_id, event_type, metadata)
  VALUES (p_user_id, p_event_type, p_metadata)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add usage quotas to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_ai_requests_quota INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS monthly_files_quota INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- Function to check if user has exceeded quota
CREATE OR REPLACE FUNCTION public.check_usage_quota(
  p_user_id UUID,
  p_quota_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage BIGINT;
  quota_limit INTEGER;
  has_quota BOOLEAN;
BEGIN
  -- Get quota limit based on plan
  SELECT 
    CASE p_quota_type
      WHEN 'ai_request' THEN monthly_ai_requests_quota
      WHEN 'file_upload' THEN monthly_files_quota
      ELSE 0
    END INTO quota_limit
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Get current usage for this month
  SELECT COUNT(*) INTO current_usage
  FROM public.usage_events
  WHERE user_id = p_user_id
    AND event_type = CASE p_quota_type
      WHEN 'ai_request' THEN 'ai_request'
      WHEN 'file_upload' THEN 'file_upload'
      ELSE p_quota_type
    END
    AND created_at >= date_trunc('month', now());
  
  has_quota := current_usage < quota_limit;
  
  RETURN has_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
