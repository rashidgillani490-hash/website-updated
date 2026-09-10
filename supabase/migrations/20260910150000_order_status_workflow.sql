-- Maison Lumière — order fulfilment workflow
-- Depends on 20260910140000_orders.sql and 20260910130000_admin.sql (is_admin()).
--
-- Widens the order status set to the admin workflow and lets admins move an
-- order along it. Reads were already granted in 20260910140000_orders.sql.

-- Widen the status check: pending → confirmed → processing → shipped → delivered
-- (or cancelled at any point). Any legacy 'fulfilled' rows become 'delivered'.
alter table public.orders drop constraint if exists orders_status_check;

update public.orders set status = 'delivered' where status = 'fulfilled';

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending','confirmed','processing','shipped','delivered','cancelled'
  ));

-- Admins may update an order (status only, in practice). Still gated by
-- is_admin(); anon and non-admin users have no policy and so no access.
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
