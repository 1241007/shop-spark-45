import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/hooks/useProducts";

interface SearchResultsProps {
  query: string;
  results: Product[];
  isSearching: boolean;
  onResultClick?: () => void;
}

const SearchResults = ({ query, results, isSearching, onResultClick }: SearchResultsProps) => {
  const navigate = useNavigate();
  
  if (!query.trim()) return null;

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
    onResultClick?.();
  };

  return (
    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto">
      {isSearching ? (
        <div className="p-4 text-center text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2 animate-pulse" />
          Searching...
        </div>
      ) : results.length > 0 ? (
        <div className="p-2">
          <div className="text-sm text-muted-foreground mb-2 px-2">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          <div className="grid gap-2">
            {results.slice(0, 4).map((product) => (
              <div 
                key={product.id} 
                className="border rounded p-2 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={product.image_url || product.image || ''}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {typeof product.category === 'string' 
                        ? product.category 
                        : product.category?.name || 'Electronics'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold text-primary">
                        ₹{(product.current_price || product.price || 0).toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {results.length > 4 && (
              <div className="text-center text-xs text-muted-foreground py-2 border-t">
                And {results.length - 4} more results...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2" />
          No products found for "{query}"
        </div>
      )}
    </div>
  );
};

export default SearchResults;