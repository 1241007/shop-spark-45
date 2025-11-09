# Fix: Order Tracking Blank Page Error

## Problem
Clicking on an order shows a blank page with console errors.

## Possible Causes
1. **RLS (Row Level Security) blocking access** - Orders table has RLS enabled
2. **Missing order_items table** - The table might not exist
3. **Missing columns** - Some required columns might not exist
4. **Query errors** - The Supabase query might be failing

## Solution Applied

### 1. Enhanced Error Handling
- Added console logging to debug issues
- Separated order and order_items fetching
- Added fallbacks for missing data

### 2. Fixed Data Fetching
- Fetch orders first, then order_items separately
- Handle cases where order_items table doesn't exist
- Convert all IDs to strings to prevent `.slice()` errors

### 3. Added Null Checks
- Check for missing fields before rendering
- Show empty states gracefully
- Handle optional fields (payment_id, phone, etc.)

## If Still Not Working

### Check Console Errors
Open browser console (F12) and check for:
- Supabase query errors
- RLS policy errors
- Missing table errors

### Verify Database Setup

Run these SQL queries in Supabase to check:

```sql
-- Check if orders table exists and has data
SELECT COUNT(*) FROM orders;

-- Check if order_items table exists
SELECT COUNT(*) FROM order_items;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Check if you can read orders (test query)
SELECT id, customer_name, total FROM orders LIMIT 1;
```

### Fix RLS Policies

If RLS is blocking access, run:

```sql
-- Allow service role to read all orders
CREATE POLICY IF NOT EXISTS "Service role can read all orders"
ON public.orders FOR SELECT
TO service_role
USING (true);

-- Allow everyone to read orders (for testing)
CREATE POLICY IF NOT EXISTS "Anyone can read orders"
ON public.orders FOR SELECT
USING (true);
```

### Create order_items Table (if missing)

```sql
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read order_items
CREATE POLICY IF NOT EXISTS "Anyone can read order_items"
ON public.order_items FOR SELECT
USING (true);
```

## Testing

1. Open browser console (F12)
2. Click on an order
3. Check console for errors
4. Look for messages like:
   - "Fetching order with ID: ..."
   - "Error fetching order: ..."
   - "Could not fetch order items: ..."

The enhanced error handling will now show what's wrong in the console.

