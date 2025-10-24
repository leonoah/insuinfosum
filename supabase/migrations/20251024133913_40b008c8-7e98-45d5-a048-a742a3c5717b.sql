-- Create products_information table for all pension products
CREATE TABLE IF NOT EXISTS public.products_information (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_number text NOT NULL, -- מספר הקרן המזהה
  track_name text NOT NULL, -- שם הקרן/מסלול
  company text NOT NULL, -- שם החברה
  product_type text NOT NULL, -- סוג המוצר
  exposure_data jsonb DEFAULT '{}'::jsonb, -- נתוני חשיפות
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index on product_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_information_product_number 
  ON public.products_information(product_number);

-- Create index on product_type and company for filtering
CREATE INDEX IF NOT EXISTS idx_products_information_type_company 
  ON public.products_information(product_type, company);

-- Enable RLS
ALTER TABLE public.products_information ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to products_information"
  ON public.products_information
  FOR SELECT
  USING (true);

-- Allow admin operations
CREATE POLICY "Allow admin operations on products_information"
  ON public.products_information
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_products_information_updated_at
  BEFORE UPDATE ON public.products_information
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();