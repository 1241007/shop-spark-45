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
import { Loader2, CreditCard, CheckCircle2 } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { clearCart } = useCart();

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

  const handlePaymentSuccess = async (paymentResponse: any) => {
    setIsPaymentLoading(true);
    
    try {
      const totalAmount = (product.current_price || product.price) * quantity;
      const paymentId = paymentResponse.razorpay_payment_id;

      // Create order with payment_id and status='paid'
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
            status: 'paid',
            payment_id: paymentId
          }
        ])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Create order items
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

      // Refresh product list
      if (refetchProducts) {
        refetchProducts();
      }

      setPaymentSuccess(true);
      onPurchaseComplete();
      clearCart();

      setTimeout(() => {
        toast({
          title: "Payment Successful! 🎉",
          description: `Your order for ${quantity} ${product.name}(s) has been confirmed. Order ID: ${order.id}`,
        });
      }, 0);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setShippingDetails({ name: '', address: '', pincode: '', phone: '' });
        setPaymentSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Payment success handler error:', error);
      toast({ 
        title: "Order Creation Failed", 
        description: error?.message || "Payment was successful but order creation failed. Please contact support.", 
        variant: "destructive" 
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    toast({ 
      title: "Payment Failed", 
      description: error?.error?.description || "Payment could not be processed. Please try again.", 
      variant: "destructive" 
    });
    setIsProcessing(false);
  };

  const handleBuyNow = async () => {
    if (!shippingDetails.name || !shippingDetails.address || !shippingDetails.pincode) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    if (shippingDetails.pincode.length !== 6) {
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

    setIsProcessing(true);

    try {
      const totalAmount = (product.current_price || product.price) * quantity;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;

      if (!razorpayKey) {
        throw new Error('Razorpay key not configured. Please add VITE_RAZORPAY_KEY to your environment variables.');
      }

      const options = {
        key: razorpayKey,
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        name: 'EcommercePro',
        description: `Order for ${product.name} (Qty: ${quantity})`,
        image: '/favicon.ico',
        prefill: {
          name: shippingDetails.name,
          email: user?.email || '',
          contact: shippingDetails.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: handlePaymentSuccess,
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        notes: {
          address: shippingDetails.address,
          pincode: shippingDetails.pincode
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', handlePaymentFailure);
      razorpay.open();
    } catch (error: any) {
      console.error('Error opening Razorpay:', error);
      toast({ 
        title: "Payment Error", 
        description: error?.message || "Failed to initialize payment. Please try again.", 
        variant: "destructive" 
      });
      setIsProcessing(false);
    }
  };

  const totalAmount = (product.current_price || product.price) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Secure Checkout</DialogTitle>
          <DialogDescription>Enter your shipping details and proceed to payment.</DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-500">
            <div className="rounded-full bg-green-100 p-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-green-600">Payment Successful!</h3>
              <p className="text-muted-foreground">Your order has been confirmed.</p>
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
                    disabled={isProcessing || isPaymentLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={shippingDetails.phone} 
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="transition-all focus:ring-2 focus:ring-primary"
                    disabled={isProcessing || isPaymentLoading}
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
                  disabled={isProcessing || isPaymentLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-sm font-medium">Pincode *</Label>
                <Input 
                  id="pincode" 
                  value={shippingDetails.pincode} 
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="transition-all focus:ring-2 focus:ring-primary"
                  disabled={isProcessing || isPaymentLoading}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 transition-all hover:scale-105"
                disabled={isProcessing || isPaymentLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBuyNow}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || isPaymentLoading}
              >
                {isProcessing || isPaymentLoading ? (
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
