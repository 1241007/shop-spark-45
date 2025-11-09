-- Fix: Allow updates to products table
-- The issue is that RLS is enabled but there's no UPDATE policy

-- Check current policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'products';

-- Drop existing policies if needed (optional - only if you want to recreate them)
-- DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Create UPDATE policy for products
-- Option 1: Allow service role (admin) to update products
CREATE POLICY IF NOT EXISTS "Service role can update products"
ON public.products
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Option 2: Allow authenticated users to update products (if you have admin users)
-- Uncomment if you want authenticated users to update products
-- CREATE POLICY IF NOT EXISTS "Authenticated users can update products"
-- ON public.products
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- Option 3: Allow everyone to update products (for development/testing)
-- WARNING: This allows anyone to update products. Use with caution!
CREATE POLICY IF NOT EXISTS "Anyone can update products"
ON public.products
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create INSERT policy for products (if needed)
CREATE POLICY IF NOT EXISTS "Service role can insert products"
ON public.products
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow everyone to insert products (for development/testing)
CREATE POLICY IF NOT EXISTS "Anyone can insert products"
ON public.products
FOR INSERT
WITH CHECK (true);

-- Create DELETE policy for products (if needed)
CREATE POLICY IF NOT EXISTS "Service role can delete products"
ON public.products
FOR DELETE
TO service_role
USING (true);

-- Allow everyone to delete products (for development/testing)
CREATE POLICY IF NOT EXISTS "Anyone can delete products"
ON public.products
FOR DELETE
USING (true);

