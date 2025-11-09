-- Fix RLS policies for orders table to allow guest orders
-- This allows users to view their own orders OR guest orders (user_id IS NULL)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create new policy that allows:
-- 1. Users to view their own orders (auth.uid() = user_id)
-- 2. Anyone to view guest orders (user_id IS NULL)
-- This is safe because guest orders don't contain sensitive user data
CREATE POLICY "Users can view own orders or guest orders"
ON public.orders FOR SELECT
USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- Also allow inserting orders with null user_id (for guests)
-- The existing policy only allows auth.uid() = user_id, which blocks guest orders
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

CREATE POLICY "Users can insert own orders or guest orders"
ON public.orders FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

