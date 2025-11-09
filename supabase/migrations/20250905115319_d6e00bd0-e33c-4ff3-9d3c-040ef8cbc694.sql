-- Add stock management and dynamic pricing to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_threshold INTEGER NOT NULL DEFAULT 10;

-- Update base_price to current price for existing products
UPDATE products SET base_price = price WHERE base_price IS NULL;

-- Set max_price as 150% of base price for dynamic pricing
UPDATE products SET max_price = base_price * 1.5 WHERE max_price IS NULL;

-- Create function to calculate dynamic price based on stock
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
    base_price DECIMAL,
    max_price DECIMAL,
    current_stock INTEGER,
    min_threshold INTEGER
) RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
BEGIN
    -- If stock is above threshold, use base price
    IF current_stock > min_threshold THEN
        RETURN base_price;
    END IF;
    
    -- Calculate price increase based on stock scarcity
    -- Price increases as stock decreases below threshold
    RETURN LEAST(
        max_price,
        base_price + (base_price * 0.5 * (1 - (current_stock::DECIMAL / min_threshold)))
    );
END;
$$;

-- Create view for products with dynamic pricing
CREATE OR REPLACE VIEW products_with_dynamic_pricing AS
SELECT 
    p.*,
    calculate_dynamic_price(p.base_price, p.max_price, p.stock_quantity, p.min_stock_threshold) as current_price,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.min_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products p;

-- Update sample products with varied stock levels
UPDATE products SET stock_quantity = 5, min_stock_threshold = 10 WHERE id = 1; -- Low stock iPhone
UPDATE products SET stock_quantity = 25, min_stock_threshold = 15 WHERE id = 2; -- Normal stock
UPDATE products SET stock_quantity = 3, min_stock_threshold = 8 WHERE id = 3; -- Very low stock Apple Watch  
UPDATE products SET stock_quantity = 15, min_stock_threshold = 10 WHERE id = 4; -- Normal stock
UPDATE products SET stock_quantity = 0, min_stock_threshold = 10 WHERE id = 5; -- Out of stock
UPDATE products SET stock_quantity = 45, min_stock_threshold = 20 WHERE id = 6; -- High stock
UPDATE products SET stock_quantity = 8, min_stock_threshold = 12 WHERE id = 7; -- Low stock
UPDATE products SET stock_quantity = 30, min_stock_threshold = 15 WHERE id = 8; -- Normal stock