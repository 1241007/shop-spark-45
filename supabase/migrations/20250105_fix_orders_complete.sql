-- Complete fix for orders table schema
-- This ensures amount column exists and works with total column
-- Run this in Supabase SQL Editor

-- Step 1: Ensure amount column exists (required, NOT NULL)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'amount'
  ) THEN
    -- Add amount column (store in paise - smallest currency unit)
    ALTER TABLE public.orders ADD COLUMN amount BIGINT NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added amount column';
  ELSE
    -- Make sure it's NOT NULL
    ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;
    RAISE NOTICE 'Amount column already exists, ensured NOT NULL';
  END IF;
END $$;

-- Step 2: Ensure total column exists (optional, for display)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'total'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
    RAISE NOTICE 'Added total column';
  ELSE
    RAISE NOTICE 'Total column already exists';
  END IF;
END $$;

-- Step 3: Update existing orders that have total but no amount
UPDATE public.orders 
SET amount = COALESCE(total, 0) * 100 
WHERE (amount IS NULL OR amount = 0) AND total IS NOT NULL;

-- Step 4: Create/update trigger to sync amount and total
CREATE OR REPLACE FUNCTION sync_amount_total_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- If total is provided, calculate amount (total in rupees, amount in paise)
  IF NEW.total IS NOT NULL AND (NEW.amount IS NULL OR NEW.amount = 0) THEN
    NEW.amount = NEW.total * 100;
  END IF;
  -- If amount is provided, calculate total (amount in paise, total in rupees)
  IF NEW.amount IS NOT NULL AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total = NEW.amount / 100;
  END IF;
  -- Ensure amount is never NULL (required column)
  IF NEW.amount IS NULL THEN
    NEW.amount = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_amount_total_complete_trigger ON public.orders;

-- Create trigger
CREATE TRIGGER sync_amount_total_complete_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_amount_total_complete();

-- Step 5: Force schema cache refresh
COMMENT ON TABLE public.orders IS 'Orders table - updated 2025-01-05 to fix amount column';

-- Step 6: Verify columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('amount', 'total', 'payment_id', 'status', 'customer_name', 'phone')
ORDER BY column_name;

