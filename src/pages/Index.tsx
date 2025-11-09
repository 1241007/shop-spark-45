
import HeroCarousel from "@/components/HeroCarousel";
import CategorySection from "@/components/CategorySection";
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Zap } from 'lucide-react';

const Index = () => {
  const { products, loading } = useProducts();
  
  const trendingProducts = products.slice(0, 4);
  const dealProducts = products.filter(p => p.originalPrice && p.originalPrice > (p.original_price || p.current_price || p.price));
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-secondary rounded-lg"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-secondary rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-primary/5">
      {/* Hero Carousel */}
      <section className="container mx-auto px-4 py-6">
        <HeroCarousel />
      </section>

      {/* Categories */}
      <CategorySection />

      {/* Trending Products */}
      <section className="py-8 bg-gradient-to-r from-secondary/30 via-transparent to-accent/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Trending Now</h2>
            </div>
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Deal Products */}
      <section className="py-8 bg-gradient-to-l from-accent/5 via-transparent to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              <h2 className="text-2xl font-bold">Deal of the Day</h2>
              <span className="bg-accent text-accent-foreground text-sm px-2 py-1 rounded-full font-semibold">
                Limited Time
              </span>
            </div>
            <Button variant="outline" size="sm">
              All Deals <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="py-8 bg-gradient-to-r from-secondary/30 via-transparent to-background/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Products</h2>
            <Button variant="outline" size="sm">
              Filter & Sort <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;


