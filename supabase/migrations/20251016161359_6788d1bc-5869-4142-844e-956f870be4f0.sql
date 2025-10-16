-- Create products taxonomy table with exposure data
CREATE TABLE IF NOT EXISTS public.products_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  company TEXT NOT NULL,
  exposure_stocks NUMERIC(5,2) DEFAULT 0,
  exposure_bonds NUMERIC(5,2) DEFAULT 0,
  exposure_foreign_currency NUMERIC(5,2) DEFAULT 0,
  exposure_foreign_investments NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category, sub_category, company)
);

-- Enable RLS
ALTER TABLE public.products_taxonomy ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to products_taxonomy"
ON public.products_taxonomy FOR SELECT
USING (true);

-- Allow authenticated admin operations
CREATE POLICY "Allow authenticated admin operations on products_taxonomy"
ON public.products_taxonomy FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_products_taxonomy_updated_at
BEFORE UPDATE ON public.products_taxonomy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();