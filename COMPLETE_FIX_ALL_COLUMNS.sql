-- ============================================
-- COMPLETE FIX: All Required Columns for Orders
-- ============================================
-- This fixes ALL missing columns in the orders table
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add amount column (REQUIRED - for payment amount in paise)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN amount BIGINT NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added amount column';
  ELSE
    ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;
    RAISE NOTICE '✅ Amount column exists, ensured NOT NULL';
  END IF;
END $$;

-- Step 2: Add total column (for display in rupees)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
    RAISE NOTICE '✅ Added total column';
  ELSE
    RAISE NOTICE '✅ Total column already exists';
  END IF;
END $$;

-- Step 3: Add payment_method column (for Cash on Delivery)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Added payment_method column';
  ELSE
    RAISE NOTICE '✅ payment_method column already exists';
  END IF;
END $$;

-- Step 4: Add customer_name column (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    RAISE NOTICE '✅ Added customer_name column';
  ELSE
    RAISE NOTICE '✅ customer_name column already exists';
  END IF;
END $$;

-- Step 5: Add phone column (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Added phone column';
  ELSE
    RAISE NOTICE '✅ phone column already exists';
  END IF;
END $$;

-- Step 6: Add address column (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN address TEXT;
    RAISE NOTICE '✅ Added address column';
  ELSE
    RAISE NOTICE '✅ address column already exists';
  END IF;
END $$;

-- Step 7: Add currency column (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'INR';
    RAISE NOTICE '✅ Added currency column';
  ELSE
    RAISE NOTICE '✅ currency column already exists';
  END IF;
END $$;

-- Step 8: Add product_ids column (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'product_ids'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN product_ids TEXT[];
    RAISE NOTICE '✅ Added product_ids column';
  ELSE
    RAISE NOTICE '✅ product_ids column already exists';
  END IF;
END $$;

-- Step 9: Update existing orders
UPDATE public.orders 
SET amount = COALESCE(total, 0) * 100 
WHERE (amount IS NULL OR amount = 0) AND total IS NOT NULL;

-- Step 10: Create sync trigger for amount and total
CREATE OR REPLACE FUNCTION sync_amount_total_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total IS NOT NULL AND (NEW.amount IS NULL OR NEW.amount = 0) THEN
    NEW.amount = NEW.total * 100;
  END IF;
  IF NEW.amount IS NOT NULL AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total = NEW.amount / 100;
  END IF;
  IF NEW.amount IS NULL THEN
    NEW.amount = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_amount_total_complete_trigger ON public.orders;
CREATE TRIGGER sync_amount_total_complete_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_amount_total_complete();

-- Step 11: Create index for payment_method (for faster queries)
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Step 12: Force schema refresh
COMMENT ON TABLE public.orders IS 'Complete orders table - all columns added 2025-01-06';

-- Step 13: Verify all columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN (
  'amount', 
  'total', 
  'payment_id', 
  'payment_method', 
  'status', 
  'order_status',
  'customer_name', 
  'phone', 
  'address',
  'currency',
  'product_ids'
)
ORDER BY column_name;

-- ✅ DONE! All required columns are now in place.
-- Try placing an order again - both Razorpay and COD should work!





