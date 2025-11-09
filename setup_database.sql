-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  base_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  image_url TEXT,
  category_id INTEGER REFERENCES public.categories(id),
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  badge VARCHAR(50),
  stock_quantity INTEGER NOT NULL DEFAULT 50,
  min_stock_threshold INTEGER NOT NULL DEFAULT 10,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read access)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Create policies for products (public read access)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert categories
INSERT INTO public.categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Fashion', 'Clothing, shoes, and accessories'),
('Home & Kitchen', 'Home improvement and kitchen appliances'),
('Sports', 'Sports equipment and fitness gear'),
('Books', 'Books and educational materials'),
('Beauty', 'Beauty and personal care products')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, description, price, original_price, image_url, category_id, rating, reviews, badge, stock_quantity) VALUES
-- Electronics category products (assuming category_id 1 is Electronics)
('iPhone 15 Pro Max - 256GB', 'Latest iPhone with 256GB storage, Pro camera system, and A17 Pro chip', 79999.00, 99999.00, '/src/assets/phone-1.jpg', 1, 4.5, 1250, 'Bestseller', 50),
('Sony WH-1000XM5 Wireless Headphones', 'Industry-leading noise canceling headphones with premium sound quality', 24999.00, 29999.00, '/src/assets/headphones-1.jpg', 1, 4.7, 890, 'New', 30),
('Apple Watch Series 9 GPS', 'Advanced fitness and health tracking with GPS, ECG, and Always-On Retina display', 45999.00, 54999.00, '/src/assets/watch-1.jpg', 1, 4.4, 567, 'Limited', 25),
('MacBook Air M2 - 256GB SSD', 'Thin and light laptop with M2 chip, 13-inch display, and all-day battery life', 114999.00, 124999.00, '/src/assets/laptop-1.jpg', 1, 4.8, 432, 'Featured', 15),
('Samsung Galaxy S24 Ultra', 'Pro-grade camera with S Pen functionality. Advanced Galaxy AI features for productivity and creativity', 79999.00, 89999.00, '/src/assets/phone-1.jpg', 1, 4.6, 980, NULL, 40),

-- Fashion category products (assuming category_id 2 is Fashion)
('Nike Air Max 270 Sneakers', 'Comfortable and stylish sneakers with Max Air cushioning. Perfect for everyday wear and casual outfits', 12999.00, 14999.00, '/src/assets/sneakers-1.jpg', 2, 4.3, 567, 'Popular', 35),
('Levi''s 501 Original Jeans', 'Classic straight-leg jeans made from premium denim. Timeless style that never goes out of fashion', 3999.00, 4999.00, '/src/assets/jeans-1.jpg', 2, 4.4, 890, NULL, 45),
('Adidas Essential Hoodie', 'Comfortable cotton-blend hoodie with the iconic three stripes. Perfect for casual wear and workouts', 2999.00, 3999.00, '/src/assets/hoodie-1.jpg', 2, 4.2, 456, NULL, 40),
('Zara Leather Jacket', 'Premium leather jacket with modern cut. Perfect for adding edge to any outfit', 8999.00, 10999.00, '/src/assets/jacket-1.jpg', 2, 4.5, 234, 'Trending', 20),
('H&M Summer Dress', 'Light and breezy summer dress in floral print. Perfect for warm weather and casual occasions', 1999.00, 2499.00, '/src/assets/dress-1.jpg', 2, 4.1, 678, NULL, 30),

-- Home & Kitchen category products (assuming category_id 3 is Home & Kitchen)
('Instant Pot Duo 7-in-1 Pressure Cooker', 'Multi-functional pressure cooker that replaces 7 kitchen appliances. Cook meals 70% faster with perfect results', 8999.00, 10999.00, '/src/assets/pressure-cooker-1.jpg', 3, 4.6, 1200, 'Bestseller', 25),
('KitchenAid Artisan Stand Mixer', 'Professional-grade stand mixer for all your baking needs. Durable design with multiple attachments included', 15999.00, 18999.00, '/src/assets/mixer-1.jpg', 3, 4.8, 789, NULL, 15),
('Dyson V15 Detect Vacuum', 'Advanced cordless vacuum with laser dust detection. Deep cleans carpets and hard floors effortlessly', 45999.00, 49999.00, '/src/assets/vacuum-1.jpg', 3, 4.7, 654, NULL, 10),
('Ninja Professional Blender', 'High-performance blender perfect for smoothies, soups, and ice crushing. BPA-free pitcher included', 6999.00, 8999.00, '/src/assets/blender-1.jpg', 3, 4.4, 890, NULL, 35),
('Lodge Cast Iron Skillet Set', 'Pre-seasoned cast iron skillets for superior heat retention. Perfect for searing, baking, and frying', 4999.00, 5999.00, '/src/assets/skillet-1.jpg', 3, 4.6, 567, NULL, 20),

-- Sports category products (assuming category_id 4 is Sports)
('Premium Yoga Mat with Strap', 'Non-slip yoga mat with extra cushioning. Includes carrying strap for easy transport to classes', 2499.00, 2999.00, '/src/assets/yoga-mat-1.jpg', 4, 4.4, 345, NULL, 40),
('Adjustable Dumbbells Set 20kg', 'Space-saving adjustable dumbbells perfect for home workouts. Quick weight changes from 2.5kg to 20kg', 4999.00, 5999.00, '/src/assets/dumbbells-1.jpg', 4, 4.5, 567, NULL, 25),
('Nike Official Football', 'Official size football with durable construction. Perfect for training and recreational play', 1999.00, 2499.00, '/src/assets/football-1.jpg', 4, 4.3, 234, NULL, 50),
('Resistance Bands Set', 'Complete resistance training system with multiple resistance levels. Includes door anchor and handles', 1299.00, 1599.00, '/src/assets/resistance-bands-1.jpg', 4, 4.2, 456, NULL, 60),
('Running Shoes - Adidas UltraBoost', 'Energy-returning running shoes with Boost midsole technology. Perfect for long-distance running', 15999.00, 17999.00, '/src/assets/running-shoes-1.jpg', 4, 4.7, 1234, 'Featured', 30),

-- Books category products (assuming category_id 5 is Books)
('The Psychology of Money', 'Timeless lessons on wealth, greed, and happiness. Learn how psychology affects our financial decisions', 399.00, 499.00, '/src/assets/books-1.jpg', 5, 4.7, 1100, 'Bestseller', 100),
('Atomic Habits by James Clear', 'Easy and proven way to build good habits and break bad ones. Transform your life with small changes', 349.00, 449.00, '/src/assets/books-1.jpg', 5, 4.8, 2300, NULL, 80),
('Rich Dad Poor Dad', 'Financial education classic that challenges conventional wisdom about money and investing', 299.00, 399.00, '/src/assets/books-1.jpg', 5, 4.6, 1800, NULL, 90),
('Think and Grow Rich', 'Napoleon Hill''s masterpiece on success principles. Learn the secrets of wealthy and successful people', 279.00, 349.00, '/src/assets/books-1.jpg', 5, 4.5, 1567, NULL, 75),
('The 7 Habits of Highly Effective People', 'Stephen Covey''s timeless principles for personal and professional effectiveness', 399.00, 499.00, '/src/assets/books-1.jpg', 5, 4.6, 2100, NULL, 85),

-- Beauty category products (assuming category_id 6 is Beauty)
('Lakme Enrich Lipstick Set', 'Rich and creamy lipsticks in 5 trending shades. Long-lasting formula with vitamin E for nourished lips', 1299.00, 1599.00, '/src/assets/lipstick-1.jpg', 6, 4.2, 456, NULL, 50),
('L''Oreal Anti-Aging Face Cream', 'Advanced anti-aging formula with hyaluronic acid. Reduces fine lines and keeps skin hydrated all day', 899.00, 1199.00, '/src/assets/face-cream-1.jpg', 6, 4.4, 678, NULL, 40),
('Maybelline Lash Sensational Mascara', 'Volumizing mascara that separates and defines each lash. Waterproof formula for all-day wear', 599.00, 799.00, '/src/assets/mascara-1.jpg', 6, 4.3, 543, NULL, 60),
('The Ordinary Niacinamide Serum', 'High-strength vitamin and zinc serum. Reduces appearance of blemishes and improves skin texture', 699.00, 899.00, '/src/assets/serum-1.jpg', 6, 4.6, 1234, 'Popular', 35),
('Urban Decay Eyeshadow Palette', '12 highly pigmented eyeshadows in neutral and bold shades. Blendable formula for stunning eye looks', 2999.00, 3499.00, '/src/assets/eyeshadow-1.jpg', 6, 4.7, 789, NULL, 25);

-- Update base_price and max_price for dynamic pricing
UPDATE products SET base_price = price WHERE base_price IS NULL;
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


