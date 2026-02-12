ALTER TABLE public.file_history ADD COLUMN tool_type TEXT NOT NULL DEFAULT 'excel';
ALTER TABLE public.chat_history ADD COLUMN tool_type TEXT NOT NULL DEFAULT 'excel';