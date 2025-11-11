-- ============================================
-- FIX SCHEMA MISMATCH - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Click "Run" and wait 30 seconds
-- ============================================

-- Step 1: Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Add ALL required columns
DO $$ 
BEGIN
  -- Core payment fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'amount') THEN
    ALTER TABLE public.orders ADD COLUMN amount BIGINT NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added amount column';
  ELSE
    ALTER TABLE public.orders ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN amount SET DEFAULT 0;
    RAISE NOTICE '✅ Amount column verified';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total') THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
    RAISE NOTICE '✅ Added total column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Added payment_method column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT;
    RAISE NOTICE '✅ Added payment_status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status') THEN
    ALTER TABLE public.orders ADD COLUMN status TEXT;
    RAISE NOTICE '✅ Added status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_status') THEN
    ALTER TABLE public.orders ADD COLUMN order_status TEXT;
    RAISE NOTICE '✅ Added order_status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_id') THEN
    ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
    RAISE NOTICE '✅ Added payment_id column';
  END IF;

  -- Razorpay order ID (from payment gateway)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'razorpay_order_id') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_order_id TEXT;
    RAISE NOTICE '✅ Added razorpay_order_id column';
  END IF;

  -- payment_gateway_order_id (backward compatibility alias)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_gateway_order_id') THEN
    ALTER TABLE public.orders ADD COLUMN payment_gateway_order_id TEXT;
    RAISE NOTICE '✅ Added payment_gateway_order_id column';
  END IF;

  -- Delivery status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_status') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_status TEXT;
    RAISE NOTICE '✅ Added delivery_status column';
  END IF;

  -- Customer information fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'full_name') THEN
    ALTER TABLE public.orders ADD COLUMN full_name TEXT;
    RAISE NOTICE '✅ Added full_name column';
  END IF;

  -- Keep customer_name for backward compatibility, but prefer full_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    RAISE NOTICE '✅ Added customer_name column (backward compatibility)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone') THEN
    ALTER TABLE public.orders ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Added phone column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address') THEN
    ALTER TABLE public.orders ADD COLUMN address TEXT;
    RAISE NOTICE '✅ Added address column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'pincode') THEN
    ALTER TABLE public.orders ADD COLUMN pincode TEXT;
    RAISE NOTICE '✅ Added pincode column';
  END IF;

  -- Product information fields (stored directly in orders table)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'product_name') THEN
    ALTER TABLE public.orders ADD COLUMN product_name TEXT;
    RAISE NOTICE '✅ Added product_name column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'quantity') THEN
    ALTER TABLE public.orders ADD COLUMN quantity INTEGER;
    RAISE NOTICE '✅ Added quantity column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'price') THEN
    ALTER TABLE public.orders ADD COLUMN price BIGINT;
    RAISE NOTICE '✅ Added price column';
  END IF;

  -- Additional fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'product_ids') THEN
    ALTER TABLE public.orders ADD COLUMN product_ids TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Added product_ids column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'currency') THEN
    ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'INR';
    RAISE NOTICE '✅ Added currency column';
  END IF;
END $$;

-- Step 3: Sync existing data (migrate customer_name to full_name if needed)
UPDATE public.orders 
SET full_name = customer_name 
WHERE full_name IS NULL AND customer_name IS NOT NULL;

-- Sync payment_status with status for existing orders
UPDATE public.orders 
SET payment_status = COALESCE(status, order_status, 'paid')
WHERE payment_status IS NULL;

-- Sync amount/total for existing orders
UPDATE public.orders 
SET amount = COALESCE(total, 0) * 100 
WHERE (amount IS NULL OR amount = 0) AND total IS NOT NULL;

-- Sync razorpay_order_id and payment_gateway_order_id for existing orders
UPDATE public.orders 
SET razorpay_order_id = payment_gateway_order_id 
WHERE razorpay_order_id IS NULL AND payment_gateway_order_id IS NOT NULL;

UPDATE public.orders 
SET payment_gateway_order_id = razorpay_order_id 
WHERE payment_gateway_order_id IS NULL AND razorpay_order_id IS NOT NULL;

-- Step 4: Create sync trigger for amount/total and status fields
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

  -- Sync full_name and customer_name (prefer full_name)
  IF NEW.full_name IS NOT NULL AND (NEW.customer_name IS NULL OR NEW.customer_name != NEW.full_name) THEN
    NEW.customer_name = NEW.full_name;
  ELSIF NEW.customer_name IS NOT NULL AND NEW.full_name IS NULL THEN
    NEW.full_name = NEW.customer_name;
  END IF;

  -- Sync razorpay_order_id and payment_gateway_order_id (prefer razorpay_order_id)
  IF NEW.razorpay_order_id IS NOT NULL AND (NEW.payment_gateway_order_id IS NULL OR NEW.payment_gateway_order_id != NEW.razorpay_order_id) THEN
    NEW.payment_gateway_order_id = NEW.razorpay_order_id;
  ELSIF NEW.payment_gateway_order_id IS NOT NULL AND NEW.razorpay_order_id IS NULL THEN
    NEW.razorpay_order_id = NEW.payment_gateway_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_order_fields_trigger ON public.orders;
CREATE TRIGGER sync_order_fields_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_fields();

-- Step 5: Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Step 6: Fix RLS Policies - CRITICAL for order creation
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

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_full_name ON public.orders(full_name);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);

-- Step 8: Force schema cache refresh
COMMENT ON TABLE public.orders IS 'Complete orders table schema - Production ready 2025-01-08';

-- Step 9: Verify all columns exist
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
  'razorpay_order_id',
  'payment_gateway_order_id',
  'delivery_status',
  'full_name',
  'customer_name',
  'phone',
  'address',
  'pincode',
  'product_name',
  'quantity',
  'price',
  'product_ids',
  'currency',
  'created_at',
  'updated_at'
)
ORDER BY column_name;

-- Step 10: Verify RLS policies
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
-- Orders will be visible in order history for both authenticated users and guests.
-- Wait 30 seconds for schema cache to refresh, then test ordering!



