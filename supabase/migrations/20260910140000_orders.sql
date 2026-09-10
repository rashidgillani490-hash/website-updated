-- Maison Lumière — orders (cash on delivery)
-- Depends on 20260910120000_content_schema.sql (set_updated_at, perfumes)
--        and 20260910130000_admin.sql (is_admin()).
--
--   public.orders        1 row per checkout, status defaults to 'pending'
--   public.order_items   the priced lines, server-authoritative
--
-- Customers are anonymous. RLS grants NO access to anon or authenticated, so
-- the only write path is the server-side service-role client
-- (SUPABASE_SERVICE_ROLE_KEY, never shipped to the browser). Admins get a
-- read-only view via is_admin().

-- ================================================================= orders =====
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text        not null unique,
  status         text        not null default 'pending'
                   check (status in ('pending','confirmed','fulfilled','cancelled')),
  payment_method text        not null default 'cod'
                   check (payment_method in ('cod')),
  customer_name  text        not null,
  customer_phone text        not null,
  customer_email text,
  address_line   text        not null,
  city           text        not null,
  notes          text,
  currency       text        not null default 'USD',
  subtotal       numeric(10,2) not null check (subtotal >= 0),
  total          numeric(10,2) not null check (total >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_created_idx
  on public.orders (created_at desc);
create index if not exists orders_status_idx
  on public.orders (status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================ order_items =====
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  -- Keep the line even if the perfume is later removed from the catalogue.
  perfume_id    uuid references public.perfumes(id) on delete set null,
  slug          text not null,
  name          text not null,
  concentration text not null default '',
  ml            int  not null check (ml > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  qty           int  not null check (qty > 0 and qty <= 99),
  line_total    numeric(10,2) not null check (line_total >= 0)
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

-- ==================================================== row level security ======
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- No policy for anon / authenticated writers or readers: with RLS enabled and
-- no permissive policy, PostgREST denies all access. The service_role key
-- bypasses RLS and is the sole writer (server-side only).

-- Admins may review orders (read-only) — for a future admin orders screen.
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());
