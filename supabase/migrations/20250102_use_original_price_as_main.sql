-- Migration: Use original_price as the main price column
-- Since the price column is not updating correctly, we'll use original_price as the primary price

-- Step 1: Copy all price values to original_price if original_price is NULL
UPDATE products 
SET original_price = price 
WHERE original_price IS NULL;

-- Step 2: Make original_price NOT NULL (optional - only if you want to enforce it)
-- ALTER TABLE products ALTER COLUMN original_price SET NOT NULL;

-- Step 3: Create a view that uses original_price as the main price
-- This ensures the application always uses original_price
CREATE OR REPLACE VIEW products_with_price AS
SELECT 
  p.*,
  COALESCE(p.original_price, p.price) as display_price,
  p.original_price as main_price,
  p.price as legacy_price
FROM products p;

-- Step 4: Add comment to clarify column usage
COMMENT ON COLUMN products.original_price IS 'Main price column - use this for displaying and updating prices';
COMMENT ON COLUMN products.price IS 'Legacy price column - kept for backward compatibility';

-- Step 5: Optional - Create a trigger to sync price to original_price when original_price is updated
-- This keeps both columns in sync if needed
CREATE OR REPLACE FUNCTION sync_price_to_original()
RETURNS TRIGGER AS $$
BEGIN
  -- When original_price is updated, also update price for backward compatibility
  IF NEW.original_price IS NOT NULL AND NEW.original_price != OLD.original_price THEN
    NEW.price = NEW.original_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_price_to_original_trigger ON public.products;
CREATE TRIGGER sync_price_to_original_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
WHEN (NEW.original_price IS DISTINCT FROM OLD.original_price)
EXECUTE FUNCTION sync_price_to_original();

