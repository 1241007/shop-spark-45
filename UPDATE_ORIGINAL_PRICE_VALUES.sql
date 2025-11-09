-- IMPORTANT: Run this SQL to copy price values to original_price
-- This ensures original_price has values so the website can use it

-- Step 1: Copy all price values to original_price where original_price is NULL
UPDATE products 
SET original_price = price 
WHERE original_price IS NULL;

-- Step 2: Verify the update
SELECT 
  id, 
  name, 
  price, 
  original_price,
  CASE 
    WHEN original_price IS NULL THEN '⚠️ MISSING - needs update'
    WHEN original_price = price THEN '✅ Synced'
    ELSE '⚠️ Different values'
  END as status
FROM products
ORDER BY id;

-- Step 3: If you want to make original_price the same as price for all products:
-- UPDATE products SET original_price = price;

