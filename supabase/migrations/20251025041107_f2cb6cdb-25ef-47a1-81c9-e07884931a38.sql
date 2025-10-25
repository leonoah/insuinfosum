-- Create pension_parsing_logs table
CREATE TABLE IF NOT EXISTS public.pension_parsing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_name TEXT NOT NULL,
  client_name TEXT,
  kod_maslul_hashka TEXT,
  extracted_product_code TEXT,
  parsing_status TEXT NOT NULL,
  error_message TEXT,
  products_found INTEGER DEFAULT 0,
  products_imported INTEGER DEFAULT 0,
  raw_data JSONB
);

-- Enable RLS
ALTER TABLE public.pension_parsing_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (temporary for development)
CREATE POLICY "Allow all operations on pension_parsing_logs"
ON public.pension_parsing_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_pension_parsing_logs_created_at ON public.pension_parsing_logs(created_at DESC);
CREATE INDEX idx_pension_parsing_logs_status ON public.pension_parsing_logs(parsing_status);