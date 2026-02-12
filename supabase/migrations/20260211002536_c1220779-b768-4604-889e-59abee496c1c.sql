-- Create trigger for auto-creating profiles on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also insert profile for existing user who doesn't have one
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;