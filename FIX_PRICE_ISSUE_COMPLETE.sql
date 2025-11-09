-- ============================================
-- COMPLETE FIX: Use original_price as main price
-- ============================================

-- Step 1: Copy all price values to original_price (if original_price is NULL)
UPDATE products 
SET original_price = price 
WHERE original_price IS NULL;

-- Step 2: Verify the data
SELECT 
  id, 
  name, 
  price as "Old Price (not updating)",
  original_price as "New Price (use this)",
  CASE 
    WHEN original_price IS NULL THEN '❌ MISSING - will use price'
    WHEN original_price = price THEN '✅ Ready'
    ELSE '⚠️ Different - original_price will be used'
  END as status
FROM products
ORDER BY id
LIMIT 10;

-- Step 3: Optional - Make original_price NOT NULL and set default
-- ALTER TABLE products ALTER COLUMN original_price SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN original_price SET DEFAULT 0;

-- Step 4: Create trigger to sync original_price → price (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_price_from_original()
RETURNS TRIGGER AS $$
BEGIN
  -- When original_price is updated, also update price for backward compatibility
  IF NEW.original_price IS NOT NULL AND NEW.original_price != OLD.original_price THEN
    NEW.price = NEW.original_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_price_from_original_trigger ON public.products;
CREATE TRIGGER sync_price_from_original_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
WHEN (NEW.original_price IS DISTINCT FROM OLD.original_price)
EXECUTE FUNCTION sync_price_from_original();

-- Step 5: Test - Update a product's original_price
-- UPDATE products SET original_price = 9999.00 WHERE id = 1;
-- SELECT id, name, price, original_price FROM products WHERE id = 1;

