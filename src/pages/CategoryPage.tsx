import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();

  // Filter products by category - handle URL-encoded category names
  const categoryProducts = products.filter(product => {
    const productCategory = typeof product.category === 'string' 
      ? product.category 
      : product.category?.name || '';
    
    // Handle URL encoding for category names with spaces/special chars
    const decodedCategory = decodeURIComponent(category || '').replace(/\+/g, ' ');
    
    return productCategory.toLowerCase() === decodedCategory.toLowerCase();
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-secondary rounded mb-2"></div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold capitalize">
            {decodeURIComponent(category || '').replace(/\+/g, ' ')}
          </h1>
          <p className="text-muted-foreground">
            {categoryProducts.length} products found
          </p>
        </div>
      </div>

      {/* Products Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">No products found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find any products in the {decodeURIComponent(category || '').replace(/\+/g, ' ')} category.
          </p>
          <Button onClick={() => navigate("/")}>
            Continue Shopping
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;