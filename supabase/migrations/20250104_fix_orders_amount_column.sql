-- Fix orders table to ensure amount column exists and is properly configured
-- This migration ensures the amount column is present and handles the schema cache issue

-- Check if amount column exists, if not add it
DO $$ 
BEGIN
  -- Check if amount column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'amount'
  ) THEN
    -- Add amount column if it doesn't exist
    ALTER TABLE public.orders ADD COLUMN amount BIGINT NOT NULL DEFAULT 0;
  ELSE
    -- Ensure amount column is NOT NULL
    ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    -- Set default if not exists
    ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;
  END IF;
END $$;

-- Ensure total column exists (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'total'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
  END IF;
END $$;

-- Update existing orders to have amount if they don't have it
UPDATE public.orders 
SET amount = COALESCE(total * 100, 0) 
WHERE amount IS NULL OR amount = 0;

-- Create or replace trigger to sync total with amount
CREATE OR REPLACE FUNCTION sync_amount_and_total()
RETURNS TRIGGER AS $$
BEGIN
  -- If amount is set, update total (amount is in paise, total in rupees)
  IF NEW.amount IS NOT NULL THEN
    NEW.total = NEW.amount / 100;
  END IF;
  -- If total is set, update amount (total in rupees, amount in paise)
  IF NEW.total IS NOT NULL AND (NEW.amount IS NULL OR NEW.amount = 0) THEN
    NEW.amount = NEW.total * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_amount_total_trigger ON public.orders;

-- Create trigger to sync columns
CREATE TRIGGER sync_amount_total_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_amount_and_total();

-- Refresh schema cache (this is a note, actual refresh happens in Supabase dashboard)
-- Go to Supabase Dashboard > Settings > API > Refresh Schema Cache

