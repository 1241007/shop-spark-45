-- Add payment_method column to orders table for Cash on Delivery support
-- This allows tracking COD orders separately from Razorpay payments

-- Add payment_method column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Added payment_method column';
  ELSE
    RAISE NOTICE '✅ payment_method column already exists';
  END IF;
END $$;

-- Update existing COD orders (if any) to have payment_method='cod'
-- This is for backward compatibility
UPDATE public.orders 
SET payment_method = 'cod'
WHERE payment_id IS NULL 
  AND (status = 'pending' OR order_status = 'pending')
  AND payment_method IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Verify the column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name = 'payment_method';

