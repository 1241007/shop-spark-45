import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  product_id?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: number; name: string; price: number; image: string }, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`id, product_id, quantity, products:product_id ( id, name, price, image )`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          const mapped: CartItem[] = data.map((row: any) => ({
            id: row.products?.id ?? row.product_id,
            name: row.products?.name ?? 'Unknown',
            price: Number(row.products?.price ?? 0),
            image: row.products?.image || '/placeholder.svg',
            quantity: row.quantity,
            product_id: row.product_id,
          }));
          setItems(mapped);
          localStorage.setItem('cart', JSON.stringify(mapped));
          return;
        }
      }
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setItems(JSON.parse(savedCart));
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: { id: number; name: string; price: number; image: string }, quantity: number = 1) => {
    if (quantity <= 0) return;
    setItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        const next = prev.map(item => (item.id === product.id ? { ...item, quantity: newQty } : item));
        void upsertQuantity(user?.id, product.id, newQty);
        setTimeout(() => toast({ title: "Updated cart", description: `Set ${product.name} to ${newQty}` }), 0);
        return next;
      } else {
        const next = [...prev, { ...product, quantity }];
        void upsertQuantity(user?.id, product.id, quantity);
        setTimeout(() => toast({ title: "Added to cart", description: `${product.name} × ${quantity}` }), 0);
        return next;
      }
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (user?.id) void supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', id);
    setTimeout(() => toast({ title: "Removed from cart", description: "Item has been removed from your cart" }), 0);
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
    void upsertQuantity(user?.id, id, quantity);
  };

  const clearCart = () => {
    setItems([]);
    if (user?.id) void supabase.from('cart_items').delete().eq('user_id', user.id);
    setTimeout(() => toast({ title: "Cart cleared", description: "All items have been removed from your cart" }), 0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

async function upsertQuantity(userId?: string | null, productId?: number, quantity?: number) {
  if (!userId || !productId || typeof quantity !== 'number') return;
  // Upsert semantics: set exact quantity
  const { data: existing, error } = await supabase
    .from('cart_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  if (!error && existing) {
    await supabase.from('cart_items').update({ quantity }).eq('id', existing.id);
  } else {
    await supabase.from('cart_items').insert([{ user_id: userId, product_id: productId, quantity }]);
  }
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}