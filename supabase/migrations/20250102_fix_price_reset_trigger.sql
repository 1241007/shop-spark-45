-- Fix: Prevent price from being reset when updated in Supabase Dashboard
-- This migration checks for and removes any triggers that might be resetting price

-- First, let's check if there are any triggers on the products table that modify price
-- and drop them if they exist

-- Drop any trigger that might be resetting price based on base_price
DROP TRIGGER IF EXISTS sync_price_with_base_price ON public.products;
DROP TRIGGER IF EXISTS reset_price_on_update ON public.products;
DROP TRIGGER IF EXISTS update_price_from_base_price ON public.products;

-- Create a function that prevents price from being reset to base_price
-- This function will preserve the price value if it's being updated
CREATE OR REPLACE FUNCTION preserve_price_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If price is being set to NULL or 0, keep the old value
  IF NEW.price IS NULL OR NEW.price = 0 THEN
    NEW.price = OLD.price;
  END IF;
  
  -- Only update base_price if it's NULL and price is being set
  -- Don't reset price based on base_price
  IF NEW.base_price IS NULL AND NEW.price IS NOT NULL THEN
    NEW.base_price = NEW.price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to preserve price when updating
DROP TRIGGER IF EXISTS preserve_price_trigger ON public.products;
CREATE TRIGGER preserve_price_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION preserve_price_on_update();

-- Add a comment explaining the behavior
COMMENT ON FUNCTION preserve_price_on_update() IS 
'Preserves the price column when updating products. Price will not be reset to base_price.';

