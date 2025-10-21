-- Create table for saved forms
CREATE TABLE IF NOT EXISTS public.saved_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, client_name)
);

-- Enable RLS
ALTER TABLE public.saved_forms ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since this is for agents)
CREATE POLICY "Allow all operations on saved_forms"
  ON public.saved_forms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_forms_updated_at
  BEFORE UPDATE ON public.saved_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_saved_forms_client_id ON public.saved_forms(client_id);
CREATE INDEX idx_saved_forms_client_name ON public.saved_forms(client_name);