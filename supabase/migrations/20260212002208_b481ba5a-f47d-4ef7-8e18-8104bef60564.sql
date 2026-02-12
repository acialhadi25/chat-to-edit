
-- Create contact_messages table for contact form
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can read (for admin purposes)
CREATE POLICY "Authenticated users can view contact messages"
ON public.contact_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);
