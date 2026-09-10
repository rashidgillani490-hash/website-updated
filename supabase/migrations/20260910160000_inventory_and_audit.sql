-- Maison Lumière — opt-in inventory + order-status audit log
-- Depends on 20260910120000_content_schema.sql (perfume_sizes, orders, order_items,
--            set_updated_at) and 20260910130000_admin.sql (is_admin()).
--
-- Risk 8 (inventory): per-size stock, decremented atomically at checkout inside
--   one transaction so concurrent checkouts cannot oversell. `stock IS NULL`
--   means "not tracked" — the existing availability-only behaviour is unchanged
--   for every row until an admin sets a number.
-- Risk 7 (audit): every status change (incl. the initial 'pending') is recorded
--   in order_status_history with the actor, not just a bumped updated_at.

-- ============================================================ inventory =======
alter table public.perfume_sizes
  add column if not exists stock int check (stock is null or stock >= 0);

-- ==================================================== order_status_history ====
create table if not exists public.order_status_history (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  from_status  text,                             -- null for the initial 'pending'
  to_status    text not null,
  actor_type   text not null default 'admin'
                 check (actor_type in ('system','admin','customer')),
  actor_id     uuid,                             -- auth.uid() when an admin did it
  actor_label  text,                             -- admin email, or 'checkout' / 'system'
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists order_status_history_order_idx
  on public.order_status_history (order_id, created_at);

alter table public.order_status_history enable row level security;

-- Admins may read the trail. No INSERT/UPDATE/DELETE policy: rows are written
-- only by the functions below (SECURITY DEFINER, or via the service_role client),
-- so the log cannot be forged or edited through PostgREST.
drop policy if exists "admins read status history" on public.order_status_history;
create policy "admins read status history"
  on public.order_status_history for select
  to authenticated
  using (public.is_admin());

-- ================================================== restock_order(order_id) ===
-- Return stock for every line of an order whose size is stock-tracked.
create or replace function public.restock_order(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update perfume_sizes ps
    set stock = ps.stock + oi.qty
  from order_items oi
  where oi.order_id = p_order_id
    and oi.perfume_id = ps.perfume_id
    and oi.ml = ps.ml
    and ps.stock is not null;
end;
$$;

-- ============================= place_order(reference, customer, currency, items)
-- Server-authoritative order creation. Runs as one PostgREST transaction, so a
-- failure anywhere (insufficient stock included) rolls the whole thing back.
-- `p_items` elements: { perfume_id, slug, name, concentration, ml, unit_price,
--                       qty, line_total }
create or replace function public.place_order(
  p_reference text,
  p_customer  jsonb,
  p_currency  text,
  p_items     jsonb
)
returns table (order_id uuid, order_reference text)
language plpgsql
security invoker            -- called only by service_role (see grants); its own
set search_path = public    -- privileges are used, no escalation
as $$
declare
  v_order_id uuid;
  v_item     jsonb;
  v_subtotal numeric(10,2);
  v_updated  int;
  v_pid      uuid;
  v_ml       int;
  v_qty      int;
begin
  select coalesce(sum((elem->>'line_total')::numeric), 0)
    into v_subtotal
  from jsonb_array_elements(p_items) as elem;

  insert into orders (
    reference, status, payment_method,
    customer_name, customer_phone, customer_email,
    address_line, city, notes, currency, subtotal, total
  ) values (
    p_reference, 'pending', 'cod',
    p_customer->>'name', p_customer->>'phone', nullif(p_customer->>'email', ''),
    p_customer->>'address', p_customer->>'city', nullif(p_customer->>'notes', ''),
    coalesce(nullif(p_currency, ''), 'USD'), v_subtotal, v_subtotal
  )
  returning id into v_order_id;

  for v_item in select jsonb_array_elements(p_items)
  loop
    v_pid := nullif(v_item->>'perfume_id', '')::uuid;
    v_ml  := (v_item->>'ml')::int;
    v_qty := (v_item->>'qty')::int;

    -- Guarded, row-locking decrement. A concurrent checkout for the last unit
    -- waits here, then re-checks `stock >= qty` against the committed value.
    update perfume_sizes
      set stock = stock - v_qty
      where perfume_id = v_pid
        and ml = v_ml
        and stock is not null
        and stock >= v_qty;
    get diagnostics v_updated = row_count;

    if v_updated = 0
       and exists (
         select 1 from perfume_sizes
         where perfume_id = v_pid and ml = v_ml and stock is not null
       )
    then
      raise exception 'insufficient_stock:%', v_item->>'slug'
        using errcode = 'P0001';
    end if;

    insert into order_items (
      order_id, perfume_id, slug, name, concentration,
      ml, unit_price, qty, line_total
    ) values (
      v_order_id, v_pid,
      v_item->>'slug', v_item->>'name', coalesce(v_item->>'concentration', ''),
      v_ml, (v_item->>'unit_price')::numeric, v_qty,
      (v_item->>'line_total')::numeric
    );
  end loop;

  insert into order_status_history (order_id, from_status, to_status, actor_type, actor_label)
  values (v_order_id, null, 'pending', 'system', 'checkout');

  return query select v_order_id, p_reference;
end;
$$;

revoke all on function public.place_order(text, jsonb, text, jsonb) from public, anon, authenticated;
grant  execute on function public.place_order(text, jsonb, text, jsonb) to service_role;
revoke all on function public.restock_order(uuid) from public, anon;
grant  execute on function public.restock_order(uuid) to service_role;

-- ============= set_order_status(order_id, status, actor_id, actor_label, note)
-- The single write path for an admin status change: re-checks is_admin(),
-- records history, and returns stock when an order is cancelled — all in one
-- transaction. SECURITY DEFINER so it can write the tamper-resistant history.
create or replace function public.set_order_status(
  p_order_id    uuid,
  p_status      text,
  p_actor_id    uuid  default null,
  p_actor_label text  default null,
  p_note        text  default null
)
returns table (changed boolean, from_status text, to_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_status not in ('pending','confirmed','processing','shipped','delivered','cancelled') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  select status into v_old from orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_old = p_status then
    return query select false, v_old, v_old;
    return;
  end if;

  update orders set status = p_status where id = p_order_id;

  insert into order_status_history (order_id, from_status, to_status, actor_type, actor_id, actor_label, note)
  values (p_order_id, v_old, p_status, 'admin', p_actor_id, p_actor_label, p_note);

  if p_status = 'cancelled' and v_old not in ('cancelled','delivered') then
    perform public.restock_order(p_order_id);
  end if;

  return query select true, v_old, p_status;
end;
$$;

revoke all on function public.set_order_status(uuid, text, uuid, text, text) from public, anon;
grant  execute on function public.set_order_status(uuid, text, uuid, text, text) to authenticated, service_role;
