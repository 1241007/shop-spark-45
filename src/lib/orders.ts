import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = "razorpay" | "cod";

export interface ShippingDetails {
  name: string;
  address: string;
  phone: string;
  pincode?: string;
}

export interface OrderItemInput {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface CreateOrderParams {
  userId?: string | null;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  shipping: ShippingDetails;
  items: OrderItemInput[];
}

export interface CreatedOrder {
  id: string;
  total: number;
  amount: number;
  status: string;
}

function calculateTotals(items: OrderItemInput[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.price) * Math.max(1, item.quantity),
    0
  );
  const quantity = items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
  return {
    subtotal,
    quantity,
    total: Math.round(subtotal),
    amountInPaise: Math.round(subtotal * 100),
    productIds: items.map((item) => String(item.productId)),
  };
}

export async function createSupabaseOrder({
  userId,
  paymentMethod,
  paymentId,
  shipping,
  items,
}: CreateOrderParams): Promise<CreatedOrder> {
  if (!items.length) {
    throw new Error("There are no items to checkout.");
  }

  const { subtotal, quantity, total, amountInPaise, productIds } = calculateTotals(items);

  if (subtotal <= 0 || total <= 0 || amountInPaise <= 0) {
    throw new Error("Invalid order amount. Please verify the product prices.");
  }

  const paymentStatus = paymentMethod === "cod" ? "cod-confirmed" : "paid";
  const orderData: Record<string, any> = {
    user_id: userId ?? null,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    order_status: paymentStatus,
    status: paymentStatus,
    full_name: shipping.name || null,
    customer_name: shipping.name || null,
    phone: shipping.phone || null,
    address: shipping.address || null,
    pincode: shipping.pincode || null,
    product_name:
      items.length === 1 ? items[0].name : `${items.length} items`,
    quantity,
    price: total,
    amount: amountInPaise,
    total,
    currency: "INR",
    product_ids: productIds,
  };

  if (paymentMethod === "razorpay" && paymentId) {
    orderData.payment_id = paymentId;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders" as any)
    .insert([orderData] as any)
    .select()
    .single();

  if (orderError) {
    throw new Error(orderError.message || "Failed to create order. Please try again.");
  }

  if (!order || !order.id) {
    throw new Error("Order was created but no order ID was returned.");
  }

  const orderId = String(order.id);

  // Fire-and-forget: insert order items
  void supabase
    .from("order_items" as any)
    .insert(
      items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.imageUrl ?? null,
      })) as any
    )
    .select();

  // Fire-and-forget: update stock quantities
  void updateProductStocks(items);

  return {
    id: orderId,
    total,
    amount: amountInPaise,
    status: orderData.status,
  };
}

async function updateProductStocks(items: OrderItemInput[]) {
  for (const item of items) {
    try {
      const { data: current } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.productId)
        .single();

      if (current) {
        const nextStock = Math.max(
          0,
          (current.stock_quantity as number) - Math.max(1, item.quantity)
        );
        await supabase
          .from("products")
          .update({ stock_quantity: nextStock })
          .eq("id", item.productId);
      }
    } catch (error) {
      console.warn("Failed to update stock for product", item.productId, error);
    }
  }
}

