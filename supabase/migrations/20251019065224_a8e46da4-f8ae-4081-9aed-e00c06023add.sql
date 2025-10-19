-- Add product_number column to products_taxonomy table
ALTER TABLE products_taxonomy 
ADD COLUMN product_number text;

-- Add comment to explain the column
COMMENT ON COLUMN products_taxonomy.product_number IS 'מספר הקופה/קרן - מספר ייחודי של המוצר';

-- Update existing records to extract product number from sub_category if it's purely numeric
UPDATE products_taxonomy 
SET product_number = sub_category 
WHERE sub_category ~ '^\d+$';