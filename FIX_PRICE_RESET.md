# Fix: Price Column Resetting Issue

## Problem
When you update the `price` column in Supabase Dashboard, it resets to the old value. However, `original_price` updates correctly.

## Root Cause
There might be a database trigger or function that's automatically resetting `price` based on `base_price` or recalculating it from dynamic pricing logic.

## Solution

### Option 1: Run the Migration (Recommended)
Run the migration file `supabase/migrations/20250102_fix_price_reset_trigger.sql` in your Supabase SQL Editor.

This migration:
1. Removes any triggers that might be resetting price
2. Creates a new trigger that preserves price when updating
3. Only updates `base_price` if it's NULL (doesn't reset price)

### Option 2: Manual Fix in Supabase Dashboard

1. **Check for Triggers:**
   - Go to Supabase Dashboard → Database → Functions
   - Look for any triggers on the `products` table
   - Check if any trigger modifies the `price` column

2. **Check for Views:**
   - Go to Database → Tables → products
   - Make sure you're editing the actual `products` table, not a view
   - The view `products_with_dynamic_pricing` calculates `current_price` but shouldn't affect the base `price` column

3. **Update Both Columns:**
   When updating price in Supabase Dashboard:
   - Update `price` column
   - Also update `base_price` to match (if you want them to be the same)
   - Update `original_price` if needed

### Option 3: Direct SQL Update

Instead of using the Dashboard, use SQL directly:

```sql
-- Update price and base_price together
UPDATE products 
SET 
  price = 9999.00,
  base_price = 9999.00,
  original_price = 12999.00  -- if you want to update this too
WHERE id = 1;
```

## Understanding the Columns

- **`price`**: The displayed price on your website (this is what you want to update)
- **`base_price`**: Used for dynamic pricing calculations (should match price for static pricing)
- **`original_price`**: Reference/backup column (for showing "was" prices)
- **`current_price`**: Calculated dynamically in the view based on stock levels

## Verification

After running the migration, test by:
1. Updating `price` in Supabase Dashboard
2. Refreshing the page
3. Verifying the price stays updated

If the issue persists, check:
- Are you editing the correct table (not a view)?
- Are there any other triggers or functions modifying price?
- Is there any application code that's resetting price?

