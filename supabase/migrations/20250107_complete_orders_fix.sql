-- ============================================
-- COMPLETE FIX: Orders Table Schema + RLS
-- ============================================
-- This migration ensures ALL required columns exist and RLS policies allow inserts
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure all required columns exist
DO $$ 
BEGIN
  -- amount column (REQUIRED - BIGINT NOT NULL)
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

  -- total column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
    RAISE NOTICE '✅ Added total column';
  END IF;

  -- payment_method column (for 'razorpay' or 'cod')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Added payment_method column';
  END IF;

  -- status column (for 'paid', 'pending', 'cod-confirmed')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN status TEXT;
    RAISE NOTICE '✅ Added status column';
  END IF;

  -- customer_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    RAISE NOTICE '✅ Added customer_name column';
  END IF;

  -- phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Added phone column';
  END IF;

  -- address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN address TEXT;
    RAISE NOTICE '✅ Added address column';
  END IF;

  -- currency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'INR';
    RAISE NOTICE '✅ Added currency column';
  END IF;

  -- product_ids column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'product_ids'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN product_ids TEXT[];
    RAISE NOTICE '✅ Added product_ids column';
  END IF;
END $$;

-- Step 2: Update existing orders to have proper amount values
UPDATE public.orders 
SET amount = COALESCE(total, 0) * 100 
WHERE (amount IS NULL OR amount = 0) AND total IS NOT NULL;

-- Step 3: Create sync trigger for amount and total
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

-- Step 4: Fix RLS Policies - Allow inserts for authenticated users AND guests
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders or guest orders" ON public.orders;

-- Create comprehensive INSERT policy
-- Allows: authenticated users inserting their own orders OR anyone inserting guest orders (user_id IS NULL)
CREATE POLICY "Allow order inserts for users and guests"
ON public.orders FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Ensure SELECT policy allows viewing own orders or guest orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or guest orders" ON public.orders;

CREATE POLICY "Allow order selects for users and guests"
ON public.orders FOR SELECT
USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Step 5: Create index for payment_method
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Step 6: Force schema cache refresh
COMMENT ON TABLE public.orders IS 'Complete orders table - fixed 2025-01-07 with all columns and RLS policies';

-- Step 7: Verify all columns and policies
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN (
  'id',
  'user_id',
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
  'product_ids',
  'created_at'
)
ORDER BY column_name;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- ✅ DONE! All columns exist and RLS policies allow inserts.
-- Both Razorpay and COD orders should work now!

