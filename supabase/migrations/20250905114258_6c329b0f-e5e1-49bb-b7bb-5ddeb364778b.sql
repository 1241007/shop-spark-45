-- Insert sample products from the existing data
INSERT INTO public.products (name, description, price, original_price, image_url, category_id, rating, reviews, badge, stock_quantity) VALUES
-- Electronics category products (assuming category_id 1 is Electronics)
('iPhone 15 Pro Max - 256GB', 'Latest iPhone with 256GB storage, Pro camera system, and A17 Pro chip', 89999.00, 99999.00, '/src/assets/phone-1.jpg', 1, 4.5, 1250, 'Bestseller', 50),
('Sony WH-1000XM5 Wireless Headphones', 'Industry-leading noise canceling headphones with premium sound quality', 24999.00, 29999.00, '/src/assets/headphones-1.jpg', 1, 4.7, 890, 'New', 30),
('Apple Watch Series 9 GPS', 'Advanced fitness and health tracking with GPS, ECG, and Always-On Retina display', 45999.00, 54999.00, '/src/assets/watch-1.jpg', 1, 4.4, 567, 'Limited', 25),
('MacBook Air M2 - 256GB SSD', 'Thin and light laptop with M2 chip, 13-inch display, and all-day battery life', 114999.00, 124999.00, '/src/assets/laptop-1.jpg', 1, 4.8, 432, 'Featured', 15),
('iPhone 14 - 128GB', 'Powerful iPhone with A15 Bionic chip, advanced camera system, and 128GB storage', 59999.00, 69999.00, '/src/assets/phone-1.jpg', 1, 4.3, 980, NULL, 40),
('Bose QuietComfort Earbuds', 'True wireless earbuds with world-class noise cancellation', 18999.00, 22999.00, '/src/assets/headphones-1.jpg', 1, 4.6, 345, NULL, 20),
('Samsung Galaxy Watch 6', 'Advanced smartwatch with health monitoring and fitness tracking', 28999.00, 32999.00, '/src/assets/watch-1.jpg', 1, 4.2, 678, NULL, 35),
('Dell XPS 13 Laptop', 'Premium ultrabook with InfinityEdge display and powerful performance', 89999.00, 99999.00, '/src/assets/laptop-1.jpg', 1, 4.5, 234, NULL, 18);