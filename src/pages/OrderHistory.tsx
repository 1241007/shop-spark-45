import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, Clock, MapPin, Loader2, Home as HomeIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Order {
  id: string;
  payment_id?: string;
  payment_method?: string;
  status: string;
  customer_name: string;
  address: string;
  phone: string;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchOrders = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      
      // Only show orders for logged-in users
      // For guests, show empty state (no orders)
      if (!user?.id) {
        setOrders([]);
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      // Fetch orders only for the logged-in user
      // Show both paid orders (with payment_id) and COD orders (with payment_method='cod' or status='pending')
      // First get all orders, then filter in code to show real orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      // Filter to show only real orders (paid orders with payment_id OR COD orders)
      // COD orders have payment_method='cod' or payment_status='cod-confirmed'
      const realOrders = ordersData.filter((order: any) => {
        return order.payment_id || 
               order.payment_method === 'cod' || 
               order.payment_status === 'cod-confirmed' ||
               order.status === 'cod-confirmed' ||
               order.order_status === 'cod-confirmed';
      });

      if (realOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const ordersWithItems: Order[] = realOrders.map((order: any) => {
        const orderItems = (order.order_items || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image_url: item.image_url || null,
        })) as OrderItem[];

        return {
          id: String(order.id),
          payment_id: order.payment_id || undefined,
          payment_method: order.payment_method || undefined,
          status: order.payment_status || order.status || order.order_status || 'paid',
          customer_name: order.full_name || order.customer_name || '',
          address: order.address || '',
          phone: order.phone || '',
          total: Number(order.total || (order.amount ? order.amount / 100 : 0) || 0),
          created_at: order.created_at,
          order_items: orderItems,
        } as Order;
      });

      setOrders(ordersWithItems);
    } catch (error: any) {
      toast({
        title: 'Unable to fetch orders',
        description: error?.message || 'Please try again later.',
        variant: 'destructive',
      });
      setOrders([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [toast, user?.id]);

  useEffect(() => {
    void fetchOrders(true);
  }, [fetchOrders]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          void fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'cod-confirmed':
        return <Badge className="bg-orange-500">COD Confirmed</Badge>;
      case 'pending':
      case 'cod':
        return <Badge className="bg-orange-500">Pending (COD)</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-600">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Pending'}</Badge>;
    }
  };

  const getEstimatedDelivery = (createdAt: string, orderId: string) => {
    const orderDate = new Date(createdAt);
    const deliveryDate = new Date(orderDate);
    // Show 2-3 days delivery (consistent per order based on order ID)
    const orderIdHash = orderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const daysToAdd = 2 + (orderIdHash % 2); // 2 or 3 days (consistent per order)
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return { date: deliveryDate, days: daysToAdd };
  };

  const canCancelOrder = (status: string) => {
    const normalized = status?.toLowerCase() || '';
    return ['pending', 'processing', 'cod', 'cod-confirmed'].includes(normalized);
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId || !user?.id) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          order_status: 'cancelled',
        })
        .eq('id', cancelOrderId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Order cancelled',
        description: `Order ${cancelOrderId.slice(0, 8).toUpperCase()} has been cancelled.`,
      });
      setCancelOrderId(null);
      void fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Unable to cancel order',
        description: error?.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-secondary rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/", { replace: true })}
          className="flex items-center gap-2"
        >
          <HomeIcon className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      {!user ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Please log in to view your orders</h3>
            <p className="text-muted-foreground mb-4">You need to be logged in to see your order history</p>
            <Button onClick={() => navigate('/auth')}>Log In</Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{String(order.id).slice(0, 8).toUpperCase()}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    {order.payment_method === 'cod' && (
                      <p className="text-xs text-orange-600 font-medium mt-1">💰 Cash on Delivery</p>
                    )}
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                          <img
                            src={item.image_url || '/placeholder.svg'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shipping Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Delivery Address</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.address}</p>
                      <p className="text-sm text-muted-foreground">Phone: {order.phone}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Estimated Delivery</span>
                      </div>
                      {(() => {
                        const delivery = getEstimatedDelivery(order.created_at, order.id);
                        return (
                          <>
                            <p className="text-sm font-semibold text-green-600">
                              {format(delivery.date, 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ({delivery.days} business {delivery.days === 1 ? 'day' : 'days'})
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Total and Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">₹{order.total.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => navigate(`/order/${String(order.id)}`)}
                        variant="outline"
                      >
                        Track Order
                      </Button>
                      {canCancelOrder(order.status) && (
                        <Button
                          variant="destructive"
                          onClick={() => setCancelOrderId(order.id)}
                          disabled={isCancelling && cancelOrderId === order.id}
                        >
                          {isCancelling && cancelOrderId === order.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            'Cancel Order'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
      <AlertDialog
        open={!!cancelOrderId}
        onOpenChange={(open) => {
          if (!open && !isCancelling) {
            setCancelOrderId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone once confirmed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderHistory;

