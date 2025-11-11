import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Home, Package, ShoppingBag, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@/lib/orders";

interface LocationState {
  orderId?: string;
  paymentMethod?: PaymentMethod;
  total?: number;
}

interface OrderSummary {
  id: string;
  status: string;
  payment_method: string;
  created_at: string;
  total: number;
}

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = (location.state as LocationState) || {};

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.orderId) {
      setLoading(false);
      toast({
        title: "Order details not found",
        description: "Redirecting you back to the home page.",
        variant: "destructive",
      });
      const timer = setTimeout(
        () => navigate("/", { replace: true }),
        1500
      );
      return () => clearTimeout(timer);
    }

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, status, payment_method, created_at, total")
          .eq("id", state.orderId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setOrder({
            id: String(data.id),
            status: data.status || "processing",
            payment_method: data.payment_method || state.paymentMethod || "cod",
            created_at: data.created_at,
            total: Number(data.total ?? state.total ?? 0),
          });
        } else {
          setOrder(null);
        }
      } catch (error: any) {
        toast({
          title: "Unable to load order",
          description: error?.message || "Please check your orders page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [navigate, state.orderId, state.paymentMethod, state.total, toast]);

  const orderIdDisplay = order?.id ?? state.orderId ?? "";
  const paymentDisplay = (order?.payment_method || state.paymentMethod || "cod")
    .toString()
    .toUpperCase();

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            Order Confirmed <Sparkles className="h-6 w-6 text-yellow-500" />
          </CardTitle>
          <p className="text-muted-foreground">
            Thank you for shopping with ShopSpark. Your order has been placed successfully.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/40">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
              <p className="font-mono font-semibold text-lg mt-1">
                {orderIdDisplay ? orderIdDisplay.slice(0, 8).toUpperCase() : "Pending"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Payment Method
              </p>
              <p className="font-semibold text-lg mt-1">{paymentDisplay}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount Paid</p>
              <p className="font-semibold text-lg mt-1">
                ₹{(order?.total ?? state.total ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <p className="text-lg font-semibold capitalize">
                  {order?.status.replaceAll("-", " ") || "Processing"}
                </p>
              </div>
              <Badge className="bg-green-600">{order?.status || "processing"}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              className="w-full"
              onClick={() => {
                if (!orderIdDisplay) return;
                navigate(`/order/${orderIdDisplay}`, {
                  replace: true,
                  state: { from: "order-success" },
                });
              }}
              disabled={!orderIdDisplay || loading}
            >
              <Package className="h-4 w-4 mr-2" />
              Track Order
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/orders", { replace: true })}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              View My Orders
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/", { replace: true })}
            >
              <Home className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            A confirmation email has been sent with your order details. We&apos;ll notify you when
            your order is on the way.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;

