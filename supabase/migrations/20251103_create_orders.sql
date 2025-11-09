-- Create orders table for payment + tracking
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_ids text[] not null default '{}',
  amount bigint not null,
  currency text not null default 'INR',
  payment_id text,
  payment_gateway_order_id text,
  order_status text not null default 'Processing',
  address text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Ensure pgcrypto for gen_random_uuid in case it's not enabled
-- extension might already be enabled in your project
create extension if not exists pgcrypto;

-- Row Level Security
alter table public.orders enable row level security;

-- Policy: users can view their own orders
create policy if not exists "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Policy: users can insert their own orders (Edge function can also insert)
create policy if not exists "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Admin/Service role can manage all orders (handled via service role key)

-- Trigger to update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();


