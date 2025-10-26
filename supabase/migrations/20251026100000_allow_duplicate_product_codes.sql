-- Allow duplicates for product_code in products_information
-- Drops the unique constraint that previously enforced uniqueness

ALTER TABLE public.products_information
  DROP CONSTRAINT IF EXISTS unique_product_code;

-- Keep indexes for performance (already exist from previous migration)
-- No further changes required
