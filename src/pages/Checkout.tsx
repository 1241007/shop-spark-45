import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, Package, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createSupabaseOrder,
  OrderItemInput,
  PaymentMethod,
  ShippingDetails,
} from "@/lib/orders";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const INITIAL_SHIPPING: ShippingDetails = {
  name: "",
  address: "",
  phone: "",
  pincode: "",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [shipping, setShipping] = useState<ShippingDetails>(INITIAL_SHIPPING);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setShipping((prev) => ({
        ...prev,
        name: prev.name || user.user_metadata.full_name || "",
        phone: prev.phone || user.user_metadata.phone || "",
      }));
    }
  }, [user?.user_metadata]);

  const orderItems: OrderItemInput[] = useMemo(
    () =>
      items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.image,
      })),
    [items]
  );

  const subtotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) => sum + Math.max(0, item.price) * Math.max(1, item.quantity),
        0
      ),
    [orderItems]
  );

  const deliveryCharge = subtotal > 0 ? 0 : 0;
  const grandTotal = subtotal + deliveryCharge;

  const isCheckoutDisabled = !items.length || isProcessing;

  const validateShipping = () => {
    if (!shipping.name || !shipping.address || !shipping.phone) {
      toast({
        title: "Missing details",
        description: "Please complete name, address, and phone number.",
        variant: "destructive",
      });
      return false;
    }

    if (shipping.pincode && shipping.pincode.length !== 6) {
      toast({
        title: "Invalid pincode",
        description: "Pincode must be 6 digits.",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Log in required",
        description: "Please log in to place an order.",
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }

    return true;
  };

  const handleCashOnDelivery = async () => {
    if (!validateShipping()) return;
    setIsProcessing(true);

    try {
      const order = await createSupabaseOrder({
        userId: user?.id,
        paymentMethod: "cod",
        shipping,
        items: orderItems,
      });

      clearCart();
      toast({
        title: "Order placed successfully! 🎉",
        description: `Your COD order is confirmed. Order ID: ${order.id.slice(0, 8).toUpperCase()}`,
      });

      navigate("/order-success", {
        replace: true,
        state: {
          orderId: order.id,
          paymentMethod: "cod",
          total: grandTotal,
        },
      });
    } catch (error: any) {
      toast({
        title: "Unable to place order",
        description: error?.message || "Please try again or switch payment method.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpay = async () => {
    if (!validateShipping()) return;

    if (!window.Razorpay) {
      toast({
        title: "Payment unavailable",
        description: "Razorpay SDK is not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const razorpayKey =
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1")
        ? import.meta.env.VITE_RAZORPAY_KEY_TEST
        : import.meta.env.VITE_RAZORPAY_KEY_LIVE;

    if (!razorpayKey) {
      toast({
        title: "Payment configuration missing",
        description: "Razorpay key is not configured. Contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const amountInPaise = Math.round(grandTotal * 100);

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "ShopSpark",
      description: `Order for ${orderItems.length} item(s)`,
      handler: async (response: any) => {
        try {
          const order = await createSupabaseOrder({
            userId: user?.id,
            paymentMethod: "razorpay",
            paymentId: response.razorpay_payment_id,
            shipping,
            items: orderItems,
          });

          clearCart();
          toast({
            title: "Order placed successfully! 🎉",
            description: `Payment received. Order ID: ${order.id.slice(0, 8).toUpperCase()}`,
          });

          navigate("/order-success", {
            replace: true,
            state: {
              orderId: order.id,
              paymentMethod: "razorpay",
              total: grandTotal,
            },
          });
        } catch (error: any) {
          toast({
            title: "Order confirmation failed",
            description:
              error?.message ||
              "Payment succeeded but order confirmation failed. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: shipping.name,
        contact: shipping.phone,
        email: user?.email || "",
      },
      notes: {
        address: shipping.address,
        pincode: shipping.pincode,
      },
      theme: {
        color: "#0d6efd",
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window.",
            variant: "destructive",
          });
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (error: any) => {
        setIsProcessing(false);
        toast({
          title: "Payment failed",
          description: error?.error?.description || "Payment could not be completed.",
          variant: "destructive",
        });
      });
      razorpay.open();
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        title: "Payment error",
        description: error?.message || "Unable to initialize Razorpay.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === "cod") {
      void handleCashOnDelivery();
    } else {
      void handleRazorpay();
    }
  };

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-xl mx-auto text-center">
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Add some products to your cart to continue to checkout.
            </p>
            <Button onClick={() => navigate("/")}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    value={shipping.name}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={shipping.phone}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="+91 9876543210"
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={shipping.address}
                  onChange={(event) =>
                    setShipping((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="House number, street, area"
                  disabled={isProcessing}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={shipping.pincode ?? ""}
                  onChange={(event) =>
                    setShipping((prev) => ({ ...prev, pincode: event.target.value }))
                  }
                  maxLength={6}
                  placeholder="123456"
                  disabled={isProcessing}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-4 border-2 rounded-lg flex items-start gap-3 text-left transition ${
                  paymentMethod === "razorpay"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setPaymentMethod("razorpay")}
                disabled={isProcessing}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                    paymentMethod === "razorpay" ? "border-primary" : "border-muted-foreground"
                  }`}
                >
                  {paymentMethod === "razorpay" && <span className="w-3 h-3 rounded-full bg-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Pay Securely (Card/UPI/Net Banking)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Powered by Razorpay with 100% secure payment.
                  </p>
                </div>
              </button>
              <button
                type="button"
                className={`p-4 border-2 rounded-lg flex items-start gap-3 text-left transition ${
                  paymentMethod === "cod"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setPaymentMethod("cod")}
                disabled={isProcessing}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                    paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"
                  }`}
                >
                  {paymentMethod === "cod" && <span className="w-3 h-3 rounded-full bg-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="font-semibold">Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay with cash or UPI when the order arrives.
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/40"
                  >
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      onError={(event) => {
                        const target = event.currentTarget as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                      className="w-14 h-14 rounded-md object-cover border"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        <span>₹{item.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Delivery</span>
                  <span>{deliveryCharge === 0 ? "Free" : `₹${deliveryCharge.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleSubmit}
                disabled={isCheckoutDisabled}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "cod" ? (
                  <>
                    <Wallet className="h-5 w-5 mr-2" />
                    Place Order (Cash on Delivery)
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay Securely
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={isProcessing}
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By placing this order you agree to ShopSpark&apos;s Terms & Conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

