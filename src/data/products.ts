import phone1 from "@/assets/phone-1.jpg";
import headphones1 from "@/assets/headphones-1.jpg";
import watch1 from "@/assets/watch-1.jpg";
import laptop1 from "@/assets/laptop-1.jpg";

// Fashion images
import sneakers1 from "@/assets/sneakers-1.jpg";
import jeans1 from "@/assets/jeans-1.jpg";
import hoodie1 from "@/assets/hoodie-1.jpg";
import jacket1 from "@/assets/jacket-1.jpg";
import dress1 from "@/assets/dress-1.jpg";

// Home & Kitchen images
import pressureCooker1 from "@/assets/pressure-cooker-1.jpg";
import mixer1 from "@/assets/mixer-1.jpg";
import vacuum1 from "@/assets/vacuum-1.jpg";
import blender1 from "@/assets/blender-1.jpg";
import skillet1 from "@/assets/skillet-1.jpg";

// Sports images
import yogaMat1 from "@/assets/yoga-mat-1.jpg";
import dumbbells1 from "@/assets/dumbbells-1.jpg";
import football1 from "@/assets/football-1.jpg";
import resistanceBands1 from "@/assets/resistance-bands-1.jpg";
import runningShoes1 from "@/assets/running-shoes-1.jpg";

// Books & Beauty images
import books1 from "@/assets/books-1.jpg";
import lipstick1 from "@/assets/lipstick-1.jpg";
import faceCream1 from "@/assets/face-cream-1.jpg";
import mascara1 from "@/assets/mascara-1.jpg";
import serum1 from "@/assets/serum-1.jpg";
import eyeshadow1 from "@/assets/eyeshadow-1.jpg";

export const sampleProducts = [
  // Electronics Category
  {
    id: 1,
    name: "iPhone 15 Pro Max - 256GB",
    price: 89999,
    originalPrice: 99999,
    image: phone1,
    rating: 4.5,
    reviews: 1250,
    category: "Electronics",
    badge: "Bestseller",
    description: "Latest iPhone with advanced camera system, A17 Pro chip, and titanium design. Perfect for photography and professional use."
  },
  {
    id: 2,
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 24999,
    originalPrice: 29999,
    image: headphones1,
    rating: 4.7,
    reviews: 890,
    category: "Electronics",
    badge: "New",
    description: "Industry-leading noise cancellation with premium sound quality. Perfect for travel and work from home."
  },
  {
    id: 3,
    name: "Apple Watch Series 9 GPS",
    price: 45999,
    originalPrice: 54999,
    image: watch1,
    rating: 4.4,
    reviews: 567,
    category: "Electronics",
    badge: "Limited",
    description: "Advanced health monitoring, fitness tracking, and seamless iPhone integration. Stay connected and healthy."
  },
  {
    id: 4,
    name: "MacBook Air M2 - 256GB SSD",
    price: 114999,
    originalPrice: 124999,
    image: laptop1,
    rating: 4.8,
    reviews: 432,
    category: "Electronics",
    badge: "Featured",
    description: "Powerful M2 chip with all-day battery life. Perfect for work, creativity, and entertainment."
  },
  {
    id: 5,
    name: "Samsung Galaxy S24 Ultra",
    price: 79999,
    originalPrice: 89999,
    image: phone1,
    rating: 4.6,
    reviews: 980,
    category: "Electronics",
    description: "Pro-grade camera with S Pen functionality. Advanced Galaxy AI features for productivity and creativity."
  },
  // Fashion Category
  {
    id: 6,
    name: "Nike Air Max 270 Sneakers",
    price: 12999,
    originalPrice: 14999,
    image: sneakers1,
    rating: 4.3,
    reviews: 567,
    category: "Fashion",
    badge: "Popular",
    description: "Comfortable and stylish sneakers with Max Air cushioning. Perfect for everyday wear and casual outfits."
  },
  {
    id: 7,
    name: "Levi's 501 Original Jeans",
    price: 3999,
    originalPrice: 4999,
    image: jeans1,
    rating: 4.4,
    reviews: 890,
    category: "Fashion",
    description: "Classic straight-leg jeans made from premium denim. Timeless style that never goes out of fashion."
  },
  {
    id: 8,
    name: "Adidas Essential Hoodie",
    price: 2999,
    originalPrice: 3999,
    image: hoodie1,
    rating: 4.2,
    reviews: 456,
    category: "Fashion",
    description: "Comfortable cotton-blend hoodie with the iconic three stripes. Perfect for casual wear and workouts."
  },
  {
    id: 9,
    name: "Zara Leather Jacket",
    price: 8999,
    originalPrice: 10999,
    image: jacket1,
    rating: 4.5,
    reviews: 234,
    category: "Fashion",
    badge: "Trending",
    description: "Premium leather jacket with modern cut. Perfect for adding edge to any outfit."
  },
  {
    id: 10,
    name: "H&M Summer Dress",
    price: 1999,
    originalPrice: 2499,
    image: dress1,
    rating: 4.1,
    reviews: 678,
    category: "Fashion",
    description: "Light and breezy summer dress in floral print. Perfect for warm weather and casual occasions."
  },
  // Home & Kitchen Category
  {
    id: 11,
    name: "Instant Pot Duo 7-in-1 Pressure Cooker",
    price: 8999,
    originalPrice: 10999,
    image: pressureCooker1,
    rating: 4.6,
    reviews: 1200,
    category: "Home & Kitchen",
    badge: "Bestseller",
    description: "Multi-functional pressure cooker that replaces 7 kitchen appliances. Cook meals 70% faster with perfect results."
  },
  {
    id: 12,
    name: "KitchenAid Artisan Stand Mixer",
    price: 15999,
    originalPrice: 18999,
    image: mixer1,
    rating: 4.8,
    reviews: 789,
    category: "Home & Kitchen",
    description: "Professional-grade stand mixer for all your baking needs. Durable design with multiple attachments included."
  },
  {
    id: 13,
    name: "Dyson V15 Detect Vacuum",
    price: 45999,
    originalPrice: 49999,
    image: vacuum1,
    rating: 4.7,
    reviews: 654,
    category: "Home & Kitchen",
    description: "Advanced cordless vacuum with laser dust detection. Deep cleans carpets and hard floors effortlessly."
  },
  {
    id: 14,
    name: "Ninja Professional Blender",
    price: 6999,
    originalPrice: 8999,
    image: blender1,
    rating: 4.4,
    reviews: 890,
    category: "Home & Kitchen",
    description: "High-performance blender perfect for smoothies, soups, and ice crushing. BPA-free pitcher included."
  },
  {
    id: 15,
    name: "Lodge Cast Iron Skillet Set",
    price: 4999,
    originalPrice: 5999,
    image: skillet1,
    rating: 4.6,
    reviews: 567,
    category: "Home & Kitchen",
    description: "Pre-seasoned cast iron skillets for superior heat retention. Perfect for searing, baking, and frying."
  },
  // Sports Category
  {
    id: 16,
    name: "Premium Yoga Mat with Strap",
    price: 2499,
    originalPrice: 2999,
    image: yogaMat1,
    rating: 4.4,
    reviews: 345,
    category: "Sports",
    description: "Non-slip yoga mat with extra cushioning. Includes carrying strap for easy transport to classes."
  },
  {
    id: 17,
    name: "Adjustable Dumbbells Set 20kg",
    price: 4999,
    originalPrice: 5999,
    image: dumbbells1,
    rating: 4.5,
    reviews: 567,
    category: "Sports",
    description: "Space-saving adjustable dumbbells perfect for home workouts. Quick weight changes from 2.5kg to 20kg."
  },
  {
    id: 18,
    name: "Nike Official Football",
    price: 1999,
    originalPrice: 2499,
    image: football1,
    rating: 4.3,
    reviews: 234,
    category: "Sports",
    description: "Official size football with durable construction. Perfect for training and recreational play."
  },
  {
    id: 19,
    name: "Resistance Bands Set",
    price: 1299,
    originalPrice: 1599,
    image: resistanceBands1,
    rating: 4.2,
    reviews: 456,
    category: "Sports",
    description: "Complete resistance training system with multiple resistance levels. Includes door anchor and handles."
  },
  {
    id: 20,
    name: "Running Shoes - Adidas UltraBoost",
    price: 15999,
    originalPrice: 17999,
    image: runningShoes1,
    rating: 4.7,
    reviews: 1234,
    category: "Sports",
    badge: "Featured",
    description: "Energy-returning running shoes with Boost midsole technology. Perfect for long-distance running."
  },
  // Books Category
  {
    id: 21,
    name: "The Psychology of Money",
    price: 399,
    originalPrice: 499,
    image: books1,
    rating: 4.7,
    reviews: 1100,
    category: "Books",
    badge: "Bestseller",
    description: "Timeless lessons on wealth, greed, and happiness. Learn how psychology affects our financial decisions."
  },
  {
    id: 22,
    name: "Atomic Habits by James Clear",
    price: 349,
    originalPrice: 449,
    image: books1,
    rating: 4.8,
    reviews: 2300,
    category: "Books",
    description: "Easy and proven way to build good habits and break bad ones. Transform your life with small changes."
  },
  {
    id: 23,
    name: "Rich Dad Poor Dad",
    price: 299,
    originalPrice: 399,
    image: books1,
    rating: 4.6,
    reviews: 1800,
    category: "Books",
    description: "Financial education classic that challenges conventional wisdom about money and investing."
  },
  {
    id: 24,
    name: "Think and Grow Rich",
    price: 279,
    originalPrice: 349,
    image: books1,
    rating: 4.5,
    reviews: 1567,
    category: "Books",
    description: "Napoleon Hill's masterpiece on success principles. Learn the secrets of wealthy and successful people."
  },
  {
    id: 25,
    name: "The 7 Habits of Highly Effective People",
    price: 399,
    originalPrice: 499,
    image: books1,
    rating: 4.6,
    reviews: 2100,
    category: "Books",
    description: "Stephen Covey's timeless principles for personal and professional effectiveness."
  },
  // Beauty Category
  {
    id: 26,
    name: "Lakme Enrich Lipstick Set",
    price: 1299,
    originalPrice: 1599,
    image: lipstick1,
    rating: 4.2,
    reviews: 456,
    category: "Beauty",
    description: "Rich and creamy lipsticks in 5 trending shades. Long-lasting formula with vitamin E for nourished lips."
  },
  {
    id: 27,
    name: "L'Oreal Anti-Aging Face Cream",
    price: 899,
    originalPrice: 1199,
    image: faceCream1,
    rating: 4.4,
    reviews: 678,
    category: "Beauty",
    description: "Advanced anti-aging formula with hyaluronic acid. Reduces fine lines and keeps skin hydrated all day."
  },
  {
    id: 28,
    name: "Maybelline Lash Sensational Mascara",
    price: 599,
    originalPrice: 799,
    image: mascara1,
    rating: 4.3,
    reviews: 543,
    category: "Beauty",
    description: "Volumizing mascara that separates and defines each lash. Waterproof formula for all-day wear."
  },
  {
    id: 29,
    name: "The Ordinary Niacinamide Serum",
    price: 699,
    originalPrice: 899,
    image: serum1,
    rating: 4.6,
    reviews: 1234,
    category: "Beauty",
    badge: "Popular",
    description: "High-strength vitamin and zinc serum. Reduces appearance of blemishes and improves skin texture."
  },
  {
    id: 30,
    name: "Urban Decay Eyeshadow Palette",
    price: 2999,
    originalPrice: 3499,
    image: eyeshadow1,
    rating: 4.7,
    reviews: 789,
    category: "Beauty",
    description: "12 highly pigmented eyeshadows in neutral and bold shades. Blendable formula for stunning eye looks."
  }
];

export const trendingProducts = sampleProducts.slice(0, 4);
export const dealProducts = sampleProducts.filter(p => p.originalPrice && p.originalPrice > p.price);



