-- ============================================
-- COPY THIS ENTIRE FILE TO SUPABASE SQL EDITOR
-- ============================================
-- This fixes the "amount column not found" error
-- 
-- STEPS:
-- 1. Copy everything below this line (from "-- Step 1" to the end)
-- 2. Go to Supabase Dashboard → Your Project → SQL Editor
-- 3. Paste the copied SQL
-- 4. Click "Run" button
-- 5. Wait for success messages
-- 6. Try ordering again - it will work!
-- ============================================

-- Step 1: Add amount column if missing
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

-- Step 2: Add total column if missing
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

-- Step 2.5: Add payment_method column if missing (for Cash on Delivery)
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

-- Step 3: Update existing orders
UPDATE public.orders 
SET amount = COALESCE(total, 0) * 100 
WHERE (amount IS NULL OR amount = 0) AND total IS NOT NULL;

-- Step 4: Create sync trigger
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

-- Step 5: Force schema refresh
COMMENT ON TABLE public.orders IS 'Fixed amount column - 2025-01-06';

-- Step 6: Verify (this will show the columns)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('amount', 'total', 'payment_id', 'payment_method', 'status', 'customer_name', 'phone', 'address')
ORDER BY column_name;

-- ✅ DONE! Now try placing an order - it should work!

