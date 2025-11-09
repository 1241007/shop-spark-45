-- Fix orders table: Add missing amount column if it doesn't exist
-- Run this in Supabase SQL Editor if you get "amount column not found" error

-- Step 1: Check and add amount column if missing
DO $$ 
BEGIN
  -- Check if amount column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'amount'
  ) THEN
    -- Add amount column (store in paise - smallest currency unit)
    ALTER TABLE public.orders ADD COLUMN amount BIGINT;
    
    -- Update existing orders: convert total to amount (total is in rupees, amount in paise)
    UPDATE public.orders 
    SET amount = COALESCE(total, 0) * 100 
    WHERE amount IS NULL;
    
    -- Make it NOT NULL after populating existing data
    ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;
    
    RAISE NOTICE 'Added amount column to orders table';
  ELSE
    RAISE NOTICE 'Amount column already exists';
  END IF;
END $$;

-- Step 2: Ensure total column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'total'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
    RAISE NOTICE 'Added total column to orders table';
  ELSE
    RAISE NOTICE 'Total column already exists';
  END IF;
END $$;

-- Step 3: Create trigger to sync amount and total
CREATE OR REPLACE FUNCTION sync_amount_total()
RETURNS TRIGGER AS $$
BEGIN
  -- If total is set, update amount (total in rupees, amount in paise)
  IF NEW.total IS NOT NULL AND (NEW.amount IS NULL OR NEW.amount = 0) THEN
    NEW.amount = NEW.total * 100;
  END IF;
  -- If amount is set, update total (amount in paise, total in rupees)
  IF NEW.amount IS NOT NULL AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total = NEW.amount / 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_amount_total_trigger ON public.orders;

-- Create trigger
CREATE TRIGGER sync_amount_total_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_amount_total();

-- Step 4: Verify the columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('amount', 'total')
ORDER BY column_name;

