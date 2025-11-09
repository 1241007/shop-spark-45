-- ============================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- ============================================
-- This fixes the "amount column not found" error
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this ENTIRE file
-- 3. Click "Run" button
-- 4. Wait for success messages
-- 5. Try placing an order again - it should work!
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
COMMENT ON TABLE public.orders IS 'Fixed amount column - 2025-01-05';

-- Step 6: Verify (this will show the columns)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('amount', 'total', 'payment_id', 'status')
ORDER BY column_name;

-- ✅ Done! The schema is now fixed.
-- Try making a payment again - it should work!

