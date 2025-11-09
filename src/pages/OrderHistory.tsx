import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  payment_id: string;
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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Only show orders for logged-in users
      // For guests, show empty state (no orders)
      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders only for the logged-in user
      // Only show orders with payment_id (real paid orders, not test/fake orders)
      const query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .not('payment_id', 'is', null) // Only orders with payment_id (real orders)
        .order('created_at', { ascending: false });

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch order_items for each order separately
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order: any) => {
          let orderItems: OrderItem[] = [];
          try {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);

            if (!itemsError && itemsData) {
              orderItems = itemsData as OrderItem[];
            }
          } catch (itemsErr) {
            console.warn(`Could not fetch order items for order ${order.id}:`, itemsErr);
          }

          return {
            id: String(order.id),
            payment_id: order.payment_id || '',
            status: order.status || order.order_status || 'paid',
            customer_name: order.customer_name || '',
            address: order.address || '',
            phone: order.phone || '',
            total: Number(order.total || order.amount || 0),
            created_at: order.created_at,
            order_items: orderItems,
          } as Order;
        })
      );

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-600">Delivered</Badge>;
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
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

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
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">₹{order.total.toLocaleString()}</p>
                    </div>
                    <Button
                      onClick={() => navigate(`/order/${String(order.id)}`)}
                      variant="outline"
                    >
                      Track Order
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

