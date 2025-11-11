import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Loader2, CreditCard, Package, Wallet } from 'lucide-react';
import { createSupabaseOrder, ShippingDetails, OrderItemInput } from '@/lib/orders';

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
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const { toast } = useToast();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && !window.Razorpay && paymentMethod === 'razorpay') {
      console.warn('Razorpay SDK not loaded');
    }
  }, [isOpen, paymentMethod]);

  const handleInputChange = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const razorpayKey =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("127.0.0.1")
      ? import.meta.env.VITE_RAZORPAY_KEY_TEST
      : import.meta.env.VITE_RAZORPAY_KEY_LIVE;

  const productPrice = product.original_price || product.current_price || product.price || 0;
  const totalAmount = productPrice * quantity;
  const amountInPaise = Math.round(totalAmount * 100);
  const totalInRupees = Math.round(totalAmount);

  const orderItems: OrderItemInput[] = [
    {
      productId: product.id,
      name: product.name,
      price: productPrice,
      quantity,
      imageUrl: product.image || product.image_url || null,
    },
  ];

  const handleCashOnDelivery = async () => {
    // Validate required fields
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

    setLoading(true);

    try {
      const order = await createSupabaseOrder({
        userId: user?.id,
        paymentMethod: 'cod',
        shipping: shippingDetails,
        items: orderItems,
      });

      onPurchaseComplete();
      clearCart();

      if (updateProductStock) updateProductStock(product.id, quantity);
      if (refetchProducts) refetchProducts();

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Your COD order has been confirmed. Order ID: ${String(order.id).slice(0, 8).toUpperCase()}`,
      });

      navigate("/order-success", {
        replace: true,
        state: {
          orderId: order.id,
          paymentMethod: 'cod',
          total: totalInRupees,
        },
      });
      onClose();
    } catch (err: any) {
      console.error('COD order creation failed:', err);
      
      toast({
        title: "Order Creation Failed",
        description: err?.message || "Failed to create order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // Validate required fields
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

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "ShopSpark",
      description: `Order for ${product.name} (Qty: ${quantity})`,
      image: "/favicon.ico",
      handler: async function (response: any) {
        try {
          const paymentId = response.razorpay_payment_id;
          const order = await createSupabaseOrder({
            userId: user?.id,
            paymentMethod: 'razorpay',
            paymentId,
            shipping: shippingDetails,
            items: orderItems,
          });

          onPurchaseComplete();
          clearCart();

          if (updateProductStock) updateProductStock(product.id, quantity);
          if (refetchProducts) refetchProducts();

          toast({
            title: "Order Placed Successfully! 🎉",
            description: `Your order has been confirmed. Order ID: ${String(order.id).slice(0, 8).toUpperCase()}`,
          });

          navigate("/order-success", {
            replace: true,
            state: {
              orderId: order.id,
              paymentMethod: 'razorpay',
              total: totalInRupees,
            },
          });
          onClose();
        } catch (err: any) {
          console.error('Payment success but order creation failed:', err);
          
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

    try {
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
    } catch (err: any) {
      setLoading(false);
      console.error('Error opening Razorpay:', err);
      toast({
        title: "Payment Error",
        description: err?.message || "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Secure Checkout</DialogTitle>
          <DialogDescription>Enter your shipping details and proceed to payment.</DialogDescription>
        </DialogHeader>

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

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'razorpay' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentMethod === 'razorpay' && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-semibold">Pay Now</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Credit/Debit Card, UPI, Net Banking
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {paymentMethod === 'cod' && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="font-semibold">Cash on Delivery</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pay when you receive
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Shipping Details Form */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
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
            <div className="flex flex-col gap-3 pt-4">
              {paymentMethod === 'razorpay' ? (
                <Button 
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleCashOnDelivery}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 transition-all hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Place Order (Cash on Delivery)
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full transition-all hover:scale-105"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            {/* Security Note */}
            {paymentMethod === 'razorpay' && (
              <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                🔒 Secure payment powered by Razorpay
              </div>
            )}
            {paymentMethod === 'cod' && (
              <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                💰 Pay cash when your order arrives. No advance payment required.
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}
