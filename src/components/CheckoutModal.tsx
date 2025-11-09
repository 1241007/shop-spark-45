import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  quantity: number;
  onPurchaseComplete: () => void;
  updateProductStock?: (productId: number, quantity: number) => void;
}

interface ShippingDetails {
  name: string;
  address: string;
  pincode: string;
  phone: string;
}

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  product, 
  quantity, 
  onPurchaseComplete,
  updateProductStock
}: CheckoutModalProps) {
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: '',
    address: '',
    pincode: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const handleInputChange = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePurchase = async () => {
    if (!shippingDetails.name || !shippingDetails.address || !shippingDetails.pincode) {
      setTimeout(() => toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" }), 0);
      return;
    }
    if (shippingDetails.pincode.length !== 6) {
      setTimeout(() => toast({ title: "Invalid Pincode", description: "Please enter a valid 6-digit pincode", variant: "destructive" }), 0);
      return;
    }

    setIsProcessing(true);

    try {
      const totalAmount = (product.current_price || product.price) * quantity;

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user?.id ?? null,
            shipping_name: shippingDetails.name,
            shipping_address: shippingDetails.address,
            shipping_pincode: shippingDetails.pincode,
            shipping_phone: shippingDetails.phone,
            total_amount: totalAmount,
            status: 'placed'
          }
        ])
        .select()
        .single();

      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: order.id,
            product_id: product.id,
            name: product.name,
            price: product.current_price || product.price,
            image_url: product.image || product.image_url || null,
            quantity: quantity
          }
        ]);

      if (itemsErr) throw itemsErr;

      // Fetch current stock to avoid race conditions, then decrement atomically
      const { data: current, error: fetchErr } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', product.id)
        .single();

      if (fetchErr) throw fetchErr;

      const newStockQty = Math.max(0, ((current?.stock_quantity as number) || 0) - quantity);

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: newStockQty })
        .eq('id', product.id);

      if (stockError) throw stockError;

      // Update local state immediately
      if (updateProductStock) updateProductStock(product.id, quantity);

      onPurchaseComplete();
      clearCart();

      setTimeout(() => toast({
        title: "Order Placed Successfully! 🎉",
        description: `Your order for ${quantity} ${product.name}(s) will be delivered to your address`,
      }), 0);

      onClose();
      setShippingDetails({ name: '', address: '', pincode: '', phone: '' });
    } catch (error: any) {
      setTimeout(() => toast({ title: "Order Failed", description: error?.message || "Something went wrong. Please try again.", variant: "destructive" }), 0);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = (product.current_price || product.price) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Enter your shipping details and confirm your order.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <img src={product.image || product.image_url || '/placeholder.svg'} alt={product.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                <p className="font-semibold">Total: ₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={shippingDetails.name} onChange={(e) => handleInputChange('name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={shippingDetails.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={shippingDetails.address} onChange={(e) => handleInputChange('address', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={shippingDetails.pincode} onChange={(e) => handleInputChange('pincode', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
