-- Update orders table to include required columns
-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add customer_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'orders' 
                 AND column_name = 'customer_name') THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'orders' 
                 AND column_name = 'phone') THEN
    ALTER TABLE public.orders ADD COLUMN phone TEXT;
  END IF;

  -- Add status column if it doesn't exist (as alias for order_status)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'orders' 
                 AND column_name = 'status') THEN
    ALTER TABLE public.orders ADD COLUMN status TEXT;
  END IF;

  -- Add total column if it doesn't exist (as alias for amount)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'orders' 
                 AND column_name = 'total') THEN
    ALTER TABLE public.orders ADD COLUMN total BIGINT;
  END IF;
END $$;

-- Create a view or trigger to sync status with order_status
CREATE OR REPLACE FUNCTION sync_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync status with order_status
  IF NEW.status IS NOT NULL THEN
    NEW.order_status = NEW.status;
  ELSIF NEW.order_status IS NOT NULL THEN
    NEW.status = NEW.order_status;
  END IF;
  
  -- Sync total with amount
  IF NEW.total IS NOT NULL THEN
    NEW.amount = NEW.total;
  ELSIF NEW.amount IS NOT NULL THEN
    NEW.total = NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_order_status_trigger ON public.orders;

-- Create trigger to sync columns
CREATE TRIGGER sync_order_status_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_status();

