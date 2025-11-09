# Switch to Using `original_price` as Main Price Column

## Problem
The `price` column in the `products` table is not updating correctly in Supabase Dashboard, but `original_price` column updates fine.

## Solution
We've updated the codebase to use `original_price` as the primary price column instead of `price`.

## Changes Made

### 1. Code Updates
All files have been updated to prioritize `original_price` over `price`:

- ✅ `src/hooks/useProducts.ts` - Maps `original_price` to `price` and `current_price`
- ✅ `src/components/CheckoutModal.tsx` - Uses `original_price` for payment calculations
- ✅ `src/components/ProductCard.tsx` - Uses `original_price` for display
- ✅ `src/pages/ProductDetail.tsx` - Uses `original_price` for product details
- ✅ `src/components/SearchResults.tsx` - Uses `original_price` for search results
- ✅ `src/pages/Products.tsx` - Uses `original_price` for product listing
- ✅ `src/contexts/CartContext.tsx` - Uses `original_price` for cart items
- ✅ `src/pages/Index.tsx` - Uses `original_price` for deal products

### 2. Database Migration
Created migration file: `supabase/migrations/20250102_use_original_price_as_main.sql`

## Steps to Complete the Switch

### Step 1: Run the Database Migration
Run this SQL in your Supabase SQL Editor:

```sql
-- Copy all price values to original_price if original_price is NULL
UPDATE products 
SET original_price = price 
WHERE original_price IS NULL;

-- Create a trigger to sync price to original_price when original_price is updated
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
```

### Step 2: Update Existing Products
If you have products where `original_price` is NULL, run:

```sql
UPDATE products 
SET original_price = price 
WHERE original_price IS NULL;
```

### Step 3: Verify
1. Update a product's `original_price` in Supabase Dashboard
2. Check if it updates correctly
3. The website should now display the `original_price` value

## How It Works Now

### Priority Order
The code now uses this priority order for price:
1. `original_price` (primary - this is what you update)
2. `current_price` (calculated/dynamic price)
3. `price` (fallback/legacy)

### Example Usage
```typescript
// All price references now use original_price first
const productPrice = product.original_price || product.current_price || product.price || 0;
```

## Updating Prices

### In Supabase Dashboard
1. Go to Table Editor → products
2. Edit the `original_price` column
3. The trigger will automatically sync it to `price` column for backward compatibility

### Via SQL
```sql
UPDATE products 
SET original_price = 9999.00 
WHERE id = 1;
```

## Notes

- The `price` column is kept for backward compatibility
- A trigger automatically syncs `original_price` → `price` when updated
- All frontend code now prioritizes `original_price`
- The migration ensures existing data is preserved

## Files Modified

1. `src/hooks/useProducts.ts`
2. `src/components/CheckoutModal.tsx`
3. `src/components/ProductCard.tsx`
4. `src/pages/ProductDetail.tsx`
5. `src/components/SearchResults.tsx`
6. `src/pages/Products.tsx`
7. `src/contexts/CartContext.tsx`
8. `src/pages/Index.tsx`
9. `supabase/migrations/20250102_use_original_price_as_main.sql` (new)

## Testing

After running the migration:
1. ✅ Update `original_price` in Supabase Dashboard - should work
2. ✅ Check website - should display `original_price` value
3. ✅ Add to cart - should use `original_price`
4. ✅ Checkout - should calculate using `original_price`

