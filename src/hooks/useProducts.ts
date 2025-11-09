import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  image?: string | null;
  image_url?: string | null;
  category?: string | null;
  rating: number;
  reviews?: number | null;
  badge?: string | null;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
  current_price?: number;
  stock_status?: 'in_stock' | 'out_of_stock';
}

const STORAGE_BUCKET = 'product-images';

function isAbsoluteUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('data:');
}

function isLikelyPlaceholder(value: string): boolean {
  return value.includes('<') || value.includes('>');
}

function resolveImageUrl(imageValue?: string | null): string {
  if (!imageValue) return '';
  const trimmed = imageValue.trim();
  if (!trimmed || isLikelyPlaceholder(trimmed)) return '';

  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  let path = trimmed.replace(/^\/+/, '');
  path = path.startsWith(`${STORAGE_BUCKET}/`) ? path.slice(STORAGE_BUCKET.length + 1) : path;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transform = (rows: Product[]): Product[] => {
    return rows.map((row) => {
      // Prefer the `image` column (filename) we standardized; only use image_url if valid
      const preferred = row.image && !isLikelyPlaceholder(row.image) ? row.image : undefined;
      const fallback = row.image_url && !isLikelyPlaceholder(row.image_url) ? row.image_url : undefined;
      const image = resolveImageUrl(preferred ?? fallback);

      const rating = Number(row.rating || 0);
      const reviews = row.reviews ?? null;
      const category = row.category ?? null;
      const stockQty = typeof row.stock_quantity === 'number' ? row.stock_quantity : 0;

      // Use original_price as the main price (since price column is not updating)
      const mainPrice = row.original_price ?? row.price ?? 0;
      
      return {
        ...row,
        image,
        rating,
        reviews,
        category,
        stock_quantity: stockQty,
        // Override price with original_price (original_price takes priority)
        price: mainPrice,
        original_price: row.original_price ?? row.price ?? null,
        current_price: mainPrice,
        stock_status: stockQty === 0 ? 'out_of_stock' : 'in_stock',
      } as Product;
    });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      setProducts(transform((data as Product[]) || []));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching products:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          setProducts((prev) => {
            if (payload.eventType === 'INSERT') {
              const newRow = transform([payload.new as Product])[0];
              return [newRow, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              const updated = transform([payload.new as Product])[0];
              return prev.map((p) => (p.id === updated.id ? updated : p));
            }
            if (payload.eventType === 'DELETE') {
              const removedId = (payload.old as Product).id;
              return prev.filter((p) => p.id !== removedId);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getProductById = (id: number) => {
    return products.find((product) => product.id === id);
  };

  const getProductsByCategory = (category: string) => {
    return products.filter((product) => (product.category || '').toLowerCase() === category.toLowerCase());
  };

  const getSimilarProducts = (productId: number, category: string, limit = 4) => {
    return products
      .filter((product) => product.id !== productId && (product.category || '') === category)
      .slice(0, limit);
  };

  const searchProducts = (query: string) => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    return products.filter((product) => {
      const categoryName = product.category || '';
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description?.toLowerCase() || '').includes(searchTerm) ||
        categoryName.toLowerCase().includes(searchTerm)
      );
    });
  };

  const updateProductStock = (productId: number, quantityPurchased: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          const newStock = Math.max(0, (product.stock_quantity || 0) - quantityPurchased);
          return {
            ...product,
            stock_quantity: newStock,
            stock_status: newStock === 0 ? 'out_of_stock' : 'in_stock',
          };
        }
        return product;
      })
    );
  };

  return {
    products,
    loading,
    error,
    getProductById,
    getProductsByCategory,
    getSimilarProducts,
    searchProducts,
    updateProductStock,
    refetch: fetchProducts,
  };
}