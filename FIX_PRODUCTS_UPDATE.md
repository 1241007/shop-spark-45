# Fix: Cannot Update Product Price in Supabase Dashboard

## Problem
You cannot update the `price` column (or any column) in the `products` table from Supabase Dashboard.

## Root Cause
**Row Level Security (RLS) is enabled** on the `products` table, but there's **only a SELECT policy**. There are **no UPDATE, INSERT, or DELETE policies**, which means:
- ✅ You can READ products
- ❌ You CANNOT UPDATE products
- ❌ You CANNOT INSERT products
- ❌ You CANNOT DELETE products

## Solution

### Option 1: Run the Migration (Recommended)
Run the migration file `supabase/migrations/20250102_fix_products_update_policy.sql` in your Supabase SQL Editor.

### Option 2: Manual Fix - Run These Queries

#### Step 1: Check Current Policies
```sql
-- See what policies exist
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
```

#### Step 2: Create UPDATE Policy
Choose one of these options:

**Option A: Allow Service Role (Admin) to Update** (Recommended for Production)
```sql
CREATE POLICY IF NOT EXISTS "Service role can update products"
ON public.products
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

**Option B: Allow Everyone to Update** (For Development/Testing)
```sql
CREATE POLICY IF NOT EXISTS "Anyone can update products"
ON public.products
FOR UPDATE
USING (true)
WITH CHECK (true);
```

#### Step 3: Create INSERT Policy (if needed)
```sql
CREATE POLICY IF NOT EXISTS "Service role can insert products"
ON public.products
FOR INSERT
TO service_role
WITH CHECK (true);
```

#### Step 4: Create DELETE Policy (if needed)
```sql
CREATE POLICY IF NOT EXISTS "Service role can delete products"
ON public.products
FOR DELETE
TO service_role
USING (true);
```

### Option 3: Disable RLS (Not Recommended)
If you don't need RLS on products table, you can disable it:

```sql
-- Disable RLS on products table
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
```

**⚠️ Warning:** Disabling RLS means anyone with database access can modify products. Only do this if you have other security measures in place.

## Verification

After running the fix:

1. **Test in Supabase Dashboard:**
   - Go to Table Editor → products
   - Try to update a product's price
   - It should work now!

2. **Test with SQL:**
   ```sql
   -- Try updating a product
   UPDATE products 
   SET price = 9999.00 
   WHERE id = 1;
   
   -- Check if it worked
   SELECT id, name, price FROM products WHERE id = 1;
   ```

## Understanding RLS Policies

- **SELECT policy**: Controls who can READ data
- **UPDATE policy**: Controls who can MODIFY existing data
- **INSERT policy**: Controls who can CREATE new data
- **DELETE policy**: Controls who can REMOVE data

Your table currently has:
- ✅ SELECT policy → You can read products
- ❌ No UPDATE policy → You cannot update products
- ❌ No INSERT policy → You cannot insert products
- ❌ No DELETE policy → You cannot delete products

## Quick Fix (Copy & Paste)

Run this complete fix in Supabase SQL Editor:

```sql
-- Allow service role to update products
CREATE POLICY IF NOT EXISTS "Service role can update products"
ON public.products FOR UPDATE
TO service_role
USING (true) WITH CHECK (true);

-- Allow service role to insert products
CREATE POLICY IF NOT EXISTS "Service role can insert products"
ON public.products FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to delete products
CREATE POLICY IF NOT EXISTS "Service role can delete products"
ON public.products FOR DELETE
TO service_role
USING (true);
```

After running this, you should be able to update product prices in the Supabase Dashboard!

