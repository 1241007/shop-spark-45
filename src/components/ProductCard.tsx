import { useState } from "react";
import { Star, ShoppingCart, Heart, Zap, Minus, Plus, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price?: number;
    current_price?: number;
    base_price?: number;
    original_price?: number;
    stock_quantity?: number;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    image?: string;
    image_url?: string;
    rating: number;
    reviews?: number;
    reviews_count?: number;
    category?: string | { name: string };
    is_featured?: boolean;
    originalPrice?: number;
    discount?: number;
    badge?: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Use original_price as the main price (since price column is not updating)
  const productPrice = product.original_price || product.current_price || product.price || 0;
  const productBasePrice = product.base_price || product.originalPrice;
  const productImage = product.image_url || product.image || '';
  const productReviews = product.reviews_count || product.reviews || 0;
  const categoryName = typeof product.category === 'string' 
    ? product.category 
    : product.category?.name || 'Electronics';
  
  const discountPercentage = productBasePrice 
    ? Math.round(((productBasePrice - productPrice) / productBasePrice) * 100)
    : 0;

  const isPriceIncreased = productBasePrice && productPrice > productBasePrice;
  const stockQuantity = product.stock_quantity || 50;
  const stockStatus = product.stock_status || 'in_stock';

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: productPrice,
      image: productImage
    }, quantity);
  };

  const handleBuyNow = () => {
    // Navigate to product detail page which has the checkout modal
    navigate(`/product/${product.id}`);
  };

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistToggle = () => {
    const newWishlistState = !isWishlisted;
    setIsWishlisted(newWishlistState);
    
    // Show toast notification
    toast({
      title: newWishlistState ? "Added to Wishlist" : "Removed from Wishlist",
      description: newWishlistState 
        ? `${product.name} has been added to your wishlist`
        : `${product.name} has been removed from your wishlist`,
      variant: "default",
    });
    
    // TODO: Add wishlist functionality with Supabase to persist state
    // For now, just toggle the visual state
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'destructive';
      case 'low_stock': return 'secondary';
      default: return 'default';
    }
  };

  const getStockStatusText = (status: string, quantity: number) => {
    switch (status) {
      case 'out_of_stock': return 'Out of Stock';
      case 'low_stock': return `Only ${quantity} left!`;
      default: return `${quantity} available`;
    }
  };

  return (
    <Card className="product-card group cursor-pointer">
      <CardContent className="p-4" onClick={handleProductClick}>
        {/* Product Image */}
        <div className="relative mb-3 overflow-hidden rounded-lg">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.indexOf('/placeholder.svg') === -1) {
                target.src = '/placeholder.svg';
              }
            }}
          />
          
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {(product.badge || product.is_featured) && (
                <Badge className="bg-green-600 text-white text-xs">
                  {product.badge || 'Featured'}
                </Badge>
              )}
            {discountPercentage > 0 && (
              <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
                {discountPercentage}% OFF
              </Badge>
            )}
            {isPriceIncreased && (
              <Badge className="bg-orange-500 text-white text-xs font-semibold">
                Price Up!
              </Badge>
            )}
          </div>

          {/* Wishlist and Buy Now buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/90 hover:bg-white shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 w-9 h-9"
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle();
              }}
              title="Add to Wishlist"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            {stockStatus !== 'out_of_stock' && (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs px-2 py-1 h-8 shadow-md hover:shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyNow();
                }}
                title="Buy Now"
              >
                <Zap className="h-3 w-3 mr-1" />
                Buy
              </Button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {categoryName}
          </p>
          
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= product.rating
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({productReviews})
            </span>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                ₹{productPrice.toLocaleString()}
              </span>
              {productBasePrice && productBasePrice !== productPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{productBasePrice.toLocaleString()}
                </span>
              )}
            </div>
            {isPriceIncreased && (
              <p className="text-xs text-orange-600">Price increased due to low stock</p>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <Badge 
              variant={getStockStatusColor(stockStatus)} 
              className="text-xs"
            >
              {getStockStatusText(stockStatus, stockQuantity)}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
        {stockStatus === 'out_of_stock' ? (
          <Button disabled className="w-full" size="sm">
            Out of Stock
          </Button>
        ) : (
          <div className="w-full space-y-3">
            {/* Quantity Selector */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                disabled={quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-semibold min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.min(stockQuantity, quantity + 1));
                }}
                disabled={quantity >= stockQuantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <Button 
              variant="outline"
              className="w-full"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add {quantity} to Cart
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;