import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, Phone, CreditCard, Home as HomeIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  updated_at?: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface TrackingStep {
  status: string;
  title: string;
  description: string;
  date: Date;
  completed: boolean;
  icon: any;
}

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrder = useCallback(async (orderId: string, showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      
      // Only fetch orders for logged-in users
      // For guests, show error
      if (!user?.id) {
        setError('Please log in to view your orders.');
        setOrder(null);
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      // Fetch order only for the logged-in user
      // Show both paid orders and COD orders
      const query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: orderData, error: orderError } = await query;

      if (orderError) {
        setError(`Failed to load order: ${orderError.message}`);
        setOrder(null);
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      if (!orderData) {
        setError('Order not found. Please check the order ID.');
        setOrder(null);
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      // Verify it's a real order (paid, COD, or cancelled)
      const isRealOrder = orderData.payment_id || 
                         orderData.payment_method === 'cod' || 
                         orderData.payment_status === 'cod-confirmed' ||
                         orderData.status === 'pending' ||
                         orderData.status === 'cod-confirmed' ||
                         orderData.status === 'paid' ||
                         orderData.status === 'cancelled' ||
                         orderData.payment_status === 'cancelled' ||
                         orderData.order_status === 'cancelled';
      
      if (!isRealOrder) {
        setError('Order not found. Please check the order ID.');
        setOrder(null);
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      // Determine status - check all possible status fields
      const orderStatus = orderData.payment_status || orderData.status || orderData.order_status || 'paid';

      const order: Order = {
        id: String(orderData.id),
        payment_id: orderData.payment_id || undefined,
        payment_method: orderData.payment_method || undefined,
        status: orderStatus,
        customer_name: orderData.customer_name || '',
        address: orderData.address || '',
        phone: orderData.phone || '',
        total: Number(orderData.total || (orderData.amount ? orderData.amount / 100 : 0) || 0),
        created_at: orderData.created_at,
        updated_at: orderData.updated_at || undefined,
        order_items: (orderData.order_items || []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image_url: item.image_url || null,
        })) as OrderItem[],
      };

      setOrder(order);
      setError(null);
    } catch (error: any) {
      const message = error?.message || 'Failed to load order. Please try again.';
      setError(message);
      setOrder(null);
      toast({
        title: 'Unable to fetch order details',
        description: message,
        variant: 'destructive',
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [toast, user?.id]);

  useEffect(() => {
    if (id) {
      void fetchOrder(id, true);
    }
  }, [fetchOrder, id]);

  useEffect(() => {
    if (!id || !user?.id) {
      return;
    }

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => {
          void fetchOrder(id, false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrder, id, user?.id]);

  const getTrackingSteps = (order: Order): TrackingStep[] => {
    const orderDate = new Date(order.created_at);
    // Show 2-3 days delivery (use order ID to make it consistent per order)
    const orderIdHash = order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const daysToAdd = 2 + (orderIdHash % 2); // 2 or 3 days (consistent per order)
    const estimatedDelivery = new Date(orderDate);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + daysToAdd);

    // Calculate progress based on time elapsed
    const hoursElapsed = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
    
    const steps: TrackingStep[] = [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and payment received',
        date: orderDate,
        completed: true,
        icon: CheckCircle2,
      },
      {
        status: 'processing',
        title: 'Order Processing',
        description: 'Your order is being prepared for shipment',
        date: new Date(orderDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        completed: hoursElapsed > 2,
        icon: Package,
      },
      {
        status: 'shipped',
        title: 'Shipped',
        description: 'Your order has been shipped and is on the way',
        date: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000), // 1 day later
        completed: hoursElapsed > 24,
        icon: Truck,
      },
      {
        status: 'delivered',
        title: 'Out for Delivery',
        description: `Expected delivery by ${format(estimatedDelivery, 'MMM dd, yyyy')} (${daysToAdd} business days)`,
        date: estimatedDelivery,
        completed: hoursElapsed > (daysToAdd * 24),
        icon: CheckCircle2,
      },
    ];

    return steps;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/4"></div>
          <div className="h-64 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (!order && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/orders', { replace: true })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Home
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
            {error && (
              <p className="text-sm text-destructive mb-4 text-center max-w-md">
                {error}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              {id ? `Order ID: ${id}` : 'Invalid order ID'}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/orders', { replace: true })}>View All Orders</Button>
              <Button variant="outline" onClick={() => navigate('/', { replace: true })}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if order is cancelled - show special UI
  const isCancelled = order.status?.toLowerCase() === 'cancelled';
  
  if (isCancelled) {
    const cancelledDate = order.updated_at || order.created_at;
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/orders', { replace: true })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Home
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Order #{String(order.id).slice(0, 8).toUpperCase()}</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Order Cancelled</h2>
            <p className="text-muted-foreground text-center mb-2">
              Your order was cancelled on{' '}
              {format(new Date(cancelledDate), 'MMM dd, yyyy hh:mm a')}.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-6">
              If you have any questions about this cancellation, please contact our support team.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => navigate('/orders', { replace: true })}
                variant="outline"
              >
                View All Orders
              </Button>
              <Button
                onClick={() => navigate('/', { replace: true })}
                className="bg-gradient-to-r from-primary to-primary/90"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show order details even for cancelled orders */}
        {order.order_items && order.order_items.length > 0 && (
          <Card className="max-w-2xl mx-auto mt-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const trackingSteps = getTrackingSteps(order);
  const currentStep = trackingSteps.filter(s => s.completed).length;
  
  // Calculate estimated delivery for sidebar (consistent with tracking steps)
  const orderDate = new Date(order.created_at);
  const orderIdHash = order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const daysToAdd = 2 + (orderIdHash % 2); // 2 or 3 days (consistent per order)
  const estimatedDeliveryDate = new Date(orderDate);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + daysToAdd);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/orders', { replace: true })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Orders
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/', { replace: true })}
          className="flex items-center gap-2"
        >
          <HomeIcon className="h-4 w-4" />
          Home
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">Order #{String(order.id).slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tracking Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {trackingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === trackingSteps.length - 1;
                  const isActive = index === currentStep;
                  const isCompleted = step.completed;

                  return (
                    <div key={step.status} className="relative flex gap-4 pb-8">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-full ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : isActive
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4
                              className={`font-semibold ${
                                isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {step.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(step.date, 'MMM dd, yyyy hh:mm a')}
                            </p>
                          </div>
                          {isCompleted && (
                            <Badge className="bg-green-500">Completed</Badge>
                          )}
                          {isActive && !isCompleted && (
                            <Badge className="bg-blue-500">In Progress</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          {order.order_items && order.order_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-semibold">{String(order.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-semibold">
                  {format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
              {order.payment_id ? (
                <div>
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-semibold text-xs break-all">{order.payment_id}</p>
                  <p className="text-xs text-green-600 mt-1">✓ Paid via Razorpay</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold text-orange-600">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground mt-1">Pay when order arrives</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">₹{order.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <p className="font-semibold text-green-600">
                  {format(estimatedDeliveryDate, 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({daysToAdd} business {daysToAdd === 1 ? 'day' : 'days'})
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.customer_name && <p className="font-semibold">{order.customer_name}</p>}
              {order.address && <p className="text-sm text-muted-foreground">{order.address}</p>}
              {order.phone && (
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{order.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-500 w-full justify-center py-2">
                Payment Successful
              </Badge>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Paid via Razorpay
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

