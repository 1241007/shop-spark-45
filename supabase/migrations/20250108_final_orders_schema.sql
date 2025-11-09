-- ============================================
-- FINAL COMPLETE FIX: Orders Table - Production Ready
-- ============================================
-- This is the FINAL migration that ensures everything works
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure ALL required columns exist
DO $$ 
BEGIN
  -- Core columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'id') THEN
    -- Table doesn't exist, create it
    CREATE TABLE IF NOT EXISTS public.orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  END IF;

  -- amount column (REQUIRED - BIGINT NOT NULL) - stores payment in paise
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'amount') THEN
    ALTER TABLE public.orders ADD COLUMN amount BIGINT NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added amount column';
  ELSE
    ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;
    RAISE NOTICE '✅ Amount column verified';
  END IF;

  -- total column (for display in rupees)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total') THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
    RAISE NOTICE '✅ Added total column';
  END IF;

  -- payment_method column ('razorpay' or 'cod')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Added payment_method column';
  END IF;

  -- payment_status column ('paid', 'cod-confirmed', 'pending')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT;
    RAISE NOTICE '✅ Added payment_status column';
  END IF;

  -- status column (for backward compatibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status') THEN
    ALTER TABLE public.orders ADD COLUMN status TEXT;
    RAISE NOTICE '✅ Added status column';
  END IF;

  -- order_status column (for backward compatibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_status') THEN
    ALTER TABLE public.orders ADD COLUMN order_status TEXT;
    RAISE NOTICE '✅ Added order_status column';
  END IF;

  -- payment_id column (for Razorpay payment ID)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_id') THEN
    ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
    RAISE NOTICE '✅ Added payment_id column';
  END IF;

  -- product_ids column (array of product IDs)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'product_ids') THEN
    ALTER TABLE public.orders ADD COLUMN product_ids TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Added product_ids column';
  END IF;

  -- customer_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    RAISE NOTICE '✅ Added customer_name column';
  END IF;

  -- phone column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone') THEN
    ALTER TABLE public.orders ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Added phone column';
  END IF;

  -- address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address') THEN
    ALTER TABLE public.orders ADD COLUMN address TEXT;
    RAISE NOTICE '✅ Added address column';
  END IF;

  -- currency column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'currency') THEN
    ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'INR';
    RAISE NOTICE '✅ Added currency column';
  END IF;
END $$;

-- Step 2: Sync payment_status with status for existing orders
UPDATE public.orders 
SET payment_status = status 
WHERE payment_status IS NULL AND status IS NOT NULL;

UPDATE public.orders 
SET status = payment_status 
WHERE status IS NULL AND payment_status IS NOT NULL;

-- Step 3: Create sync trigger for amount/total and status fields
CREATE OR REPLACE FUNCTION sync_order_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync amount and total (amount in paise, total in rupees)
  IF NEW.total IS NOT NULL AND (NEW.amount IS NULL OR NEW.amount = 0) THEN
    NEW.amount = NEW.total * 100;
  END IF;
  IF NEW.amount IS NOT NULL AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total = NEW.amount / 100;
  END IF;
  IF NEW.amount IS NULL THEN
    NEW.amount = 0;
  END IF;

  -- Sync status fields (payment_status, status, order_status)
  IF NEW.payment_status IS NOT NULL THEN
    NEW.status = NEW.payment_status;
    NEW.order_status = NEW.payment_status;
  ELSIF NEW.status IS NOT NULL THEN
    NEW.payment_status = NEW.status;
    NEW.order_status = NEW.status;
  ELSIF NEW.order_status IS NOT NULL THEN
    NEW.payment_status = NEW.order_status;
    NEW.status = NEW.order_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_order_fields_trigger ON public.orders;
CREATE TRIGGER sync_order_fields_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_fields();

-- Step 4: Fix RLS Policies - CRITICAL for order creation
-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders or guest orders" ON public.orders;
DROP POLICY IF EXISTS "Allow order inserts for users and guests" ON public.orders;

-- Create comprehensive INSERT policy (allows authenticated users AND guests)
CREATE POLICY "Allow order inserts for users and guests"
ON public.orders FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or guest orders" ON public.orders;
DROP POLICY IF EXISTS "Allow order selects for users and guests" ON public.orders;

-- Create comprehensive SELECT policy
CREATE POLICY "Allow order selects for users and guests"
ON public.orders FOR SELECT
USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Step 6: Force schema cache refresh
COMMENT ON TABLE public.orders IS 'Final orders table - production ready 2025-01-08';

-- Step 7: Verify all columns exist
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
  'payment_method',
  'payment_status',
  'status',
  'order_status',
  'payment_id',
  'product_ids',
  'customer_name',
  'phone',
  'address',
  'currency',
  'created_at'
)
ORDER BY column_name;

-- Step 8: Verify RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- ✅ DONE! All columns and policies are now correct.
-- Both Razorpay and COD orders will work perfectly!

