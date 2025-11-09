-- ============================================
-- TEST: Verify Order Creation Works
-- ============================================
-- Run this AFTER running 20250107_complete_orders_fix.sql
-- This tests if orders can be inserted successfully
-- ============================================

-- Test 1: Insert a COD order (guest user)
INSERT INTO public.orders (
  user_id, 
  amount, 
  total, 
  payment_method, 
  status, 
  order_status,
  customer_name, 
  phone, 
  address, 
  currency, 
  product_ids
) VALUES (
  NULL, 
  10000,  -- 100 rupees in paise
  100,    -- 100 rupees
  'cod', 
  'cod-confirmed', 
  'cod-confirmed',
  'Test Customer', 
  '9876543210', 
  '123 Test Street, Test City, PIN: 123456', 
  'INR', 
  ARRAY['1']
)
RETURNING id, payment_method, status, amount, total;

-- Test 2: Insert a Razorpay order (authenticated user - replace with actual user_id)
-- Uncomment and replace 'YOUR_USER_ID_HERE' with an actual UUID from auth.users
/*
INSERT INTO public.orders (
  user_id, 
  amount, 
  total, 
  payment_method, 
  status, 
  order_status,
  payment_id,
  customer_name, 
  phone, 
  address, 
  currency, 
  product_ids
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual user_id
  20000,  -- 200 rupees in paise
  200,    -- 200 rupees
  'razorpay', 
  'paid', 
  'paid',
  'pay_test_12345',
  'Test Customer 2', 
  '9876543211', 
  '456 Test Avenue, Test City, PIN: 123456', 
  'INR', 
  ARRAY['2']
)
RETURNING id, payment_method, status, payment_id, amount, total;
*/

-- Test 3: Verify columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN (
  'id',
  'user_id',
  'amount',
  'total',
  'payment_method',
  'status',
  'payment_id',
  'customer_name',
  'phone',
  'address'
)
ORDER BY column_name;

-- Test 4: Check RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- ✅ If all tests pass, order creation should work in the frontend!

