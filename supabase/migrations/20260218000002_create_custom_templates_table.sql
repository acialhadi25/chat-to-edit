-- Create custom_templates table
CREATE TABLE IF NOT EXISTS public.custom_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('business', 'finance', 'hr', 'personal', 'sales', 'inventory')),
    icon TEXT DEFAULT 'FileSpreadsheet',
    headers TEXT[] NOT NULL,
    sample_data JSONB NOT NULL,
    formulas JSONB,
    styles JSONB,
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_custom_templates_user_id ON public.custom_templates(user_id);

-- Create index on category for filtering
CREATE INDEX idx_custom_templates_category ON public.custom_templates(category);

-- Create index on is_public for public template queries
CREATE INDEX idx_custom_templates_is_public ON public.custom_templates(is_public);

-- Enable Row Level Security
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own templates"
    ON public.custom_templates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can view public templates
CREATE POLICY "Users can view public templates"
    ON public.custom_templates
    FOR SELECT
    USING (is_public = TRUE);

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates"
    ON public.custom_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates"
    ON public.custom_templates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates"
    ON public.custom_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_custom_templates_updated_at_trigger
    BEFORE UPDATE ON public.custom_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_templates_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_templates TO authenticated;
GRANT SELECT ON public.custom_templates TO anon;
