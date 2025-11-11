import { ShoppingCart, Minus, Plus, Trash2, X, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CartProps {
  showLabel?: boolean;
}

const STORAGE_BUCKET = 'products';

function resolveImageUrl(imageValue?: string | null): string {
  if (!imageValue) return '/placeholder.svg';
  const trimmed = imageValue.trim();
  if (!trimmed || trimmed === '/placeholder.svg' || trimmed === 'placeholder.svg') {
    return '/placeholder.svg';
  }

  // If it's already an absolute URL, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's a storage path, get public URL
  let path = trimmed.replace(/^\/+/, '');
  path = path.startsWith(`${STORAGE_BUCKET}/`) ? path.slice(STORAGE_BUCKET.length + 1) : path;
  
  try {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl || '/placeholder.svg';
  } catch {
    return '/placeholder.svg';
  }
}

const Cart = ({ showLabel = false }: CartProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleImageError = (itemId: number) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${showLabel ? 'flex flex-col items-center p-2 h-auto w-full' : ''}`}>
          <ShoppingCart className={`h-5 w-5 ${showLabel ? 'mb-1' : ''}`} />
          {showLabel && <span className="text-xs text-muted-foreground">Cart</span>}
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block">Your Cart</span>
              <span className="text-sm font-normal text-muted-foreground">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Looks like you haven't added anything to your cart yet
                  </p>
                  <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-primary to-primary/90">
                    Start Shopping
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {items.map((item) => {
                  const imageUrl = imageErrors[item.id] 
                    ? '/placeholder.svg' 
                    : resolveImageUrl(item.image);
                  
                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center border">
                              {imageErrors[item.id] ? (
                                <Package className="h-8 w-8 text-muted-foreground" />
                              ) : (
                                <img
                                  src={imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={() => handleImageError(item.id)}
                                />
                              )}
                            </div>
                            {item.quantity > 1 && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                {item.quantity}
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                              {item.name}
                            </h4>
                            <p className="text-sm font-bold text-primary mb-3">
                              ₹{item.price.toLocaleString()}
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 border rounded-md">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-muted"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-muted"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="flex flex-col items-end justify-between">
                            <p className="text-sm font-bold text-foreground">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Cart Summary */}
              <div className="border-t pt-4 mt-4 space-y-4 bg-background">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Delivery</span>
                    <span className="text-sm font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary h-11 text-base font-semibold" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                    disabled={items.length === 0}
                  >
                    Clear Cart
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Checkout now supports the entire cart for quick payment</span>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
