-- Maison Lumière — admin authorization + write access
-- Depends on 20260910120000_content_schema.sql.
--
--   auth.users  ──<  public.admins  (allow-list)
--   public.is_admin()  → true only for a signed-in user in that list
--   write RLS on every content table + the perfume-images Storage bucket
--   is gated by is_admin(). Anonymous and non-admin users still cannot write.

-- ================================================================ admins =====
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A signed-in user may see only their own admin row (used for UI hints; the
-- is_admin() function below is SECURITY DEFINER and does not rely on this).
drop policy if exists "read own admin row" on public.admins;
create policy "read own admin row"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

-- No write policy: the allow-list is managed out-of-band (SQL / dashboard).

-- ============================================================= is_admin() ====
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ==================================== admin read: see unpublished content ====
-- Public read policies (published-only) stay as they are. These add a second,
-- admin-only path so the admin panel can list drafts.
drop policy if exists "admins read all perfumes" on public.perfumes;
create policy "admins read all perfumes"
  on public.perfumes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read all sizes" on public.perfume_sizes;
create policy "admins read all sizes"
  on public.perfume_sizes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read all notes" on public.fragrance_notes;
create policy "admins read all notes"
  on public.fragrance_notes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read all images" on public.perfume_images;
create policy "admins read all images"
  on public.perfume_images for select
  to authenticated
  using (public.is_admin());

-- ================================================= admin write: is_admin() ===
drop policy if exists "admins write settings" on public.site_settings;
create policy "admins write settings"
  on public.site_settings for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins write perfumes" on public.perfumes;
create policy "admins write perfumes"
  on public.perfumes for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins write sizes" on public.perfume_sizes;
create policy "admins write sizes"
  on public.perfume_sizes for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins write notes" on public.fragrance_notes;
create policy "admins write notes"
  on public.fragrance_notes for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins write images" on public.perfume_images;
create policy "admins write images"
  on public.perfume_images for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===================================================== storage: perfume-images
-- Public read, admin-only write/replace/delete. Normal image files only —
-- format is enforced in the application before upload (no 3D model formats).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'perfume-images', 'perfume-images', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "perfume images public read" on storage.objects;
create policy "perfume images public read"
  on storage.objects for select
  using (bucket_id = 'perfume-images');

drop policy if exists "perfume images admin write" on storage.objects;
create policy "perfume images admin write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'perfume-images' and public.is_admin());

drop policy if exists "perfume images admin update" on storage.objects;
create policy "perfume images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'perfume-images' and public.is_admin())
  with check (bucket_id = 'perfume-images' and public.is_admin());

drop policy if exists "perfume images admin delete" on storage.objects;
create policy "perfume images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'perfume-images' and public.is_admin());

-- ============================================================ grant an admin ==
-- Create the auth user in the dashboard (Authentication → Users → Add user),
-- or via the CLI, then:
--
--   insert into public.admins (user_id, note)
--   select id, 'founder' from auth.users where email = 'you@example.com';
--
-- Remove access with:  delete from public.admins where user_id = '<uuid>';
