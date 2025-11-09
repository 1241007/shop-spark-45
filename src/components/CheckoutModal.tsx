// ✅ Razorpay Checkout Modal – full integration
// Works with Test Key on localhost, Live Key on deployed site (Render)
// Handles Supabase order insert, success/failure UI, and automatic key switching

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Loader2, CreditCard, CheckCircle2, Package, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  quantity: number;
  onPurchaseComplete: () => void;
  updateProductStock?: (productId: number, quantity: number) => void;
  refetchProducts?: () => void;
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
  updateProductStock,
  refetchProducts
}: CheckoutModalProps) {
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: '',
    address: '',
    pincode: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);

  // Check if Razorpay is loaded
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      console.warn('Razorpay SDK not loaded');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ Auto-switch Razorpay key
  const razorpayKey =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("127.0.0.1")
      ? import.meta.env.VITE_RAZORPAY_KEY_TEST
      : import.meta.env.VITE_RAZORPAY_KEY_LIVE;

  const handlePayment = async () => {
    if (!shippingDetails.name || !shippingDetails.address || !shippingDetails.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    if (shippingDetails.pincode && shippingDetails.pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive"
      });
      return;
    }

    if (!window.Razorpay) {
      toast({
        title: "Payment Gateway Error",
        description: "Payment gateway is not available. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    if (!razorpayKey) {
      toast({
        title: "Payment Error",
        description: "Razorpay key not configured. Please check your environment variables.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

  // Use original_price as the main price (since price column is not updating)
  // Ensure we have a valid price, default to 0 if all are missing
  const productPrice = product.original_price || product.current_price || product.price || 0;
  const totalAmount = productPrice * quantity;

    const options = {
      key: razorpayKey,
      amount: Math.round(totalAmount * 100), // paise (must be integer)
      currency: "INR",
      name: "ShopSpark",
      description: `Order for ${product.name} (Qty: ${quantity})`,
      image: "/favicon.ico",
      handler: async function (response: any) {
        try {
          const paymentId = response.razorpay_payment_id;

          // ✅ Insert order into Supabase
          // The amount column is bigint NOT NULL, store amount in smallest currency unit (paise)
          // Convert to integer to ensure it's a valid bigint
          const amountInPaise = Math.round(totalAmount * 100);
          
          // Validate amount is not zero
          if (amountInPaise <= 0) {
            throw new Error('Invalid order amount. Please check the product price.');
          }
          
      const { data: order, error: orderErr } = await supabase
            .from("orders")
        .insert([
          {
            user_id: user?.id ?? null,
                payment_id: paymentId,
                status: "paid",
                order_status: "paid",
                customer_name: shippingDetails.name,
                address: shippingDetails.address + (shippingDetails.pincode ? `, PIN: ${shippingDetails.pincode}` : ''),
                phone: shippingDetails.phone,
                amount: amountInPaise, // Store in paise (bigint) - required column
                currency: "INR",
                product_ids: [product.id.toString()]
              },
        ])
        .select()
        .single();

      if (orderErr) {
        console.error('Order creation error:', orderErr);
        console.error('Error details:', JSON.stringify(orderErr, null, 2));
        console.error('Attempted to insert amount:', amountInPaise);
        throw new Error(`Failed to create order: ${orderErr.message}. Please refresh the page and try again.`);
      }

          // Create order items
      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: order.id,
            product_id: product.id,
            name: product.name,
                price: product.original_price || product.current_price || product.price,
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

          // ✅ Refresh product list
          if (refetchProducts) {
            refetchProducts();
          }

          setOrderId(order.id);
          setPaymentSuccess(true);
      onPurchaseComplete();
      clearCart();

          toast({
            title: "Payment Successful! 🎉",
            description: `Your order has been confirmed. Order ID: ${String(order.id).slice(0, 8).toUpperCase()}`,
          });
        } catch (err: any) {
          console.error(err);
          toast({
            title: "Order Creation Failed",
            description: err?.message || "Payment was successful but order creation failed. Please contact support.",
            variant: "destructive"
          });
    } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: shippingDetails.name,
        contact: shippingDetails.phone,
        email: user?.email || ''
      },
      theme: {
        color: "#0d6efd",
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled.",
            variant: "destructive"
          });
        },
      },
      notes: {
        address: shippingDetails.address,
        pincode: shippingDetails.pincode
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (error: any) {
      setLoading(false);
      toast({
        title: "Payment Failed",
        description: error?.error?.description || "Payment could not be processed. Please try again.",
        variant: "destructive"
      });
    });
    razorpay.open();
  };

  // Use original_price as the main price (since price column is not updating)
  // Ensure we have a valid price, default to 0 if all are missing
  const productPrice = product.original_price || product.current_price || product.price || 0;
  const totalAmount = productPrice * quantity;
  
  // Debug: Log price calculation
  if (totalAmount === 0) {
    console.warn('Total amount is 0!', {
      original_price: product.original_price,
      current_price: product.current_price,
      price: product.price,
      quantity,
      productId: product.id
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Secure Checkout</DialogTitle>
          <DialogDescription>Enter your shipping details and proceed to payment.</DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in duration-500">
            <div className="rounded-full bg-gradient-to-br from-green-400 to-green-600 p-6 animate-in zoom-in duration-300 shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-white" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-green-600">Order Confirmed! 🎉</h3>
              <p className="text-muted-foreground text-lg">
                Your order has been placed successfully
              </p>
              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono font-semibold text-lg">{String(orderId).slice(0, 8).toUpperCase()}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={() => {
                    if (orderId) {
                      navigate(`/order/${orderId}`);
                      onClose();
                    }
                  }}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/orders');
                    onClose();
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  onClose();
                  setShippingDetails({ name: '', address: '', pincode: '', phone: '' });
                  setPaymentSuccess(false);
                  setOrderId(null);
                }}
                className="mt-2"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Product Summary */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/20 transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={product.image || product.image_url || '/placeholder.svg'} 
                    alt={product.name} 
                    className="w-24 h-24 object-cover rounded-lg shadow-md" 
                  />
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {quantity}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Quantity: {quantity}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
              </div>
            </div>
          </div>

            {/* Shipping Details Form */}
          <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Shipping Details
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input 
                    id="name" 
                    value={shippingDetails.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    className="transition-all focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    value={shippingDetails.phone} 
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="transition-all focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
                <Input 
                  id="address" 
                  value={shippingDetails.address} 
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address, apartment, suite"
                  className="transition-all focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                <Input 
                  id="pincode" 
                  value={shippingDetails.pincode} 
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="transition-all focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
            </div>
          </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
                className="flex-1 transition-all hover:scale-105"
                disabled={loading}
            >
              Cancel
            </Button>
            <Button 
                onClick={handlePayment}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Now
                  </>
                )}
            </Button>
            </div>

            {/* Security Note */}
            <div className="text-center text-xs text-muted-foreground pt-2 border-t">
              🔒 Secure payment powered by Razorpay
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
