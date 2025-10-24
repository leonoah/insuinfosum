-- Drop existing products_information table if exists and create new one
DROP TABLE IF EXISTS public.products_information CASCADE;

-- Create products_information table with all exposure fields
CREATE TABLE public.products_information (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type TEXT NOT NULL, -- סוג מוצר
  track_name TEXT NOT NULL, -- שם קופה (תת קטגוריה)
  company TEXT NOT NULL, -- שם חברה
  product_code TEXT NOT NULL, -- קוד קופה (מזהה ייחודי)
  
  -- Exposure percentages (stored as numeric for calculations)
  exposure_stocks NUMERIC DEFAULT 0, -- חשיפה למניות
  exposure_foreign NUMERIC DEFAULT 0, -- חשיפה לחו"ל
  exposure_foreign_currency NUMERIC DEFAULT 0, -- חשיפה למט"ח
  exposure_government_bonds NUMERIC DEFAULT 0, -- אג"ח ממשלתיות סחירות
  exposure_corporate_bonds_tradable NUMERIC DEFAULT 0, -- אג"ח קונצרני סחיר
  exposure_corporate_bonds_non_tradable NUMERIC DEFAULT 0, -- אג"ח קונצרניות לא סחירות
  exposure_stocks_options NUMERIC DEFAULT 0, -- מניות, אופציות ותעודות סל
  exposure_deposits NUMERIC DEFAULT 0, -- פיקדונות
  exposure_loans NUMERIC DEFAULT 0, -- הלוואות
  exposure_cash NUMERIC DEFAULT 0, -- מזומנים ושווי מזומנים
  exposure_mutual_funds NUMERIC DEFAULT 0, -- קרנות נאמנות
  exposure_other_assets NUMERIC DEFAULT 0, -- נכסים אחרים
  exposure_liquid_assets NUMERIC DEFAULT 0, -- נכסים סחירים ונזילים
  exposure_non_liquid_assets NUMERIC DEFAULT 0, -- נכסים לא סחירים
  exposure_israel NUMERIC DEFAULT 0, -- נכסים בארץ
  exposure_foreign_and_currency NUMERIC DEFAULT 0, -- נכסים בחו"ל ובמט"ח
  
  source TEXT, -- מקור המידע
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Create unique constraint on product_code
  CONSTRAINT unique_product_code UNIQUE (product_code)
);

-- Enable RLS
ALTER TABLE public.products_information ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to products_information"
ON public.products_information
FOR SELECT
USING (true);

-- Allow authenticated admin operations
CREATE POLICY "Allow admin operations on products_information"
ON public.products_information
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index on product_code for faster lookups
CREATE INDEX idx_products_information_product_code ON public.products_information(product_code);
CREATE INDEX idx_products_information_company ON public.products_information(company);
CREATE INDEX idx_products_information_product_type ON public.products_information(product_type);

-- Add trigger for updated_at
CREATE TRIGGER update_products_information_updated_at
BEFORE UPDATE ON public.products_information
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();