-- Enable Realtime for user_profiles table
-- This allows frontend to receive instant updates when credits change

-- Enable realtime on user_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- Add comment
COMMENT ON TABLE user_profiles IS 'User profiles with credit tracking. Realtime enabled for instant credit updates.';
