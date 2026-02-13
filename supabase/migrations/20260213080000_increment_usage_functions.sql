-- Create atomic increment function for file usage tracking
CREATE OR REPLACE FUNCTION public.increment_files_used_this_month(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Reset if needed (new month), then increment atomically
  UPDATE public.profiles
  SET 
    files_used_this_month = CASE 
      WHEN updated_at < date_trunc('month', now()) THEN 1
      ELSE files_used_this_month + 1
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING files_used_this_month INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get current usage
CREATE OR REPLACE FUNCTION public.get_monthly_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- First reset if needed
  UPDATE public.profiles
  SET files_used_this_month = 0,
      updated_at = now()
  WHERE user_id = p_user_id
    AND updated_at < date_trunc('month', now());
  
  -- Then get current count
  SELECT files_used_this_month INTO usage_count
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
