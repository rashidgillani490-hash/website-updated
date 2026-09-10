-- Maison Lumière — content schema
-- Storefront-readable perfume catalogue + site settings.
-- Applied with `supabase db push` / `supabase migration up`, or pasted into the
-- Supabase SQL editor. Idempotent-friendly: guarded creates where practical.

create extension if not exists "pgcrypto";

-- Touch updated_at on every UPDATE ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================ site_settings ====
-- Single row, addressed by the fixed id 'default'.
create table if not exists public.site_settings (
  id            text primary key default 'default' check (id = 'default'),
  brand_name    text        not null default 'Maison Lumière',
  tagline       text        not null default '',
  description   text        not null default '',
  announcement  text        not null default '',
  primary_nav   jsonb       not null default '[]'::jsonb,
  footer_nav    jsonb       not null default '[]'::jsonb,
  social        jsonb       not null default '[]'::jsonb,
  contact_email text        not null default '',
  address_lines text[]      not null default '{}',
  currency      text        not null default 'USD',
  logo_url      text,
  favicon_url   text,
  hero_headline text,
  hero_intro    text,
  homepage_intro text,
  brand_story   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ================================================================= perfumes ====
create table if not exists public.perfumes (
  id            uuid primary key default gen_random_uuid(),
  slug          text        not null unique,
  name          text        not null,
  concentration text        not null default '',
  family        text        not null default 'Aromatic',
  tagline       text        not null default '',
  description   text        not null default '',
  perfumer      text        not null default '',
  year          int         not null default (extract(year from now())::int),
  accent        text        not null default '#c7ac7c',
  featured      boolean     not null default false,
  availability  text        not null default 'available'
                  check (availability in ('available','coming-soon','sold-out','archived')),
  display_order int         not null default 0,
  is_published  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists perfumes_published_order_idx
  on public.perfumes (is_published, display_order);
create index if not exists perfumes_featured_idx
  on public.perfumes (featured) where is_published;

drop trigger if exists perfumes_set_updated_at on public.perfumes;
create trigger perfumes_set_updated_at
  before update on public.perfumes
  for each row execute function public.set_updated_at();

-- =========================================================== perfume_sizes ====
create table if not exists public.perfume_sizes (
  id            uuid primary key default gen_random_uuid(),
  perfume_id    uuid not null references public.perfumes(id) on delete cascade,
  ml            int  not null check (ml > 0),
  price         numeric(10,2) not null check (price >= 0),
  display_order int  not null default 0
);
create index if not exists perfume_sizes_perfume_idx
  on public.perfume_sizes (perfume_id, display_order);

-- ========================================================= fragrance_notes ====
create table if not exists public.fragrance_notes (
  id            uuid primary key default gen_random_uuid(),
  perfume_id    uuid not null references public.perfumes(id) on delete cascade,
  name          text not null,
  tier          text not null check (tier in ('top','heart','base')),
  description   text,
  display_order int  not null default 0
);
create index if not exists fragrance_notes_perfume_idx
  on public.fragrance_notes (perfume_id, tier, display_order);

-- ========================================================== perfume_images ====
-- Stores an image REFERENCE only — never binary. `path` is a Supabase Storage
-- object key (bucket "perfume-images"), or an absolute URL / local /public path.
create table if not exists public.perfume_images (
  id            uuid primary key default gen_random_uuid(),
  perfume_id    uuid not null references public.perfumes(id) on delete cascade,
  role          text not null check (role in ('hero','gallery')),
  path          text not null,
  alt           text not null default '',
  display_order int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists perfume_images_perfume_idx
  on public.perfume_images (perfume_id, role, display_order);

-- ==================================================== row level security ======
alter table public.site_settings   enable row level security;
alter table public.perfumes        enable row level security;
alter table public.perfume_sizes   enable row level security;
alter table public.fragrance_notes enable row level security;
alter table public.perfume_images  enable row level security;

-- Public site: read published content only. -----------------------------------
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings"
  on public.site_settings for select
  using (true);

drop policy if exists "public read published perfumes" on public.perfumes;
create policy "public read published perfumes"
  on public.perfumes for select
  using (is_published);

drop policy if exists "public read sizes of published perfumes" on public.perfume_sizes;
create policy "public read sizes of published perfumes"
  on public.perfume_sizes for select
  using (exists (
    select 1 from public.perfumes p
    where p.id = perfume_sizes.perfume_id and p.is_published
  ));

drop policy if exists "public read notes of published perfumes" on public.fragrance_notes;
create policy "public read notes of published perfumes"
  on public.fragrance_notes for select
  using (exists (
    select 1 from public.perfumes p
    where p.id = fragrance_notes.perfume_id and p.is_published
  ));

drop policy if exists "public read images of published perfumes" on public.perfume_images;
create policy "public read images of published perfumes"
  on public.perfume_images for select
  using (exists (
    select 1 from public.perfumes p
    where p.id = perfume_images.perfume_id and p.is_published
  ));

-- Writes: no INSERT / UPDATE / DELETE policy is defined, so with RLS enabled
-- the anon and authenticated roles cannot write to any of these tables. The
-- service_role key (server-only, never shipped to the browser) bypasses RLS
-- and is the only write path today.
--
-- The Admin phase adds authenticated-writer policies here — e.g. an allow-list
-- table `public.admins(user_id uuid primary key)` plus a SECURITY DEFINER
-- `public.is_admin()` helper, then, per table:
--
--   create policy "admins write perfumes" on public.perfumes
--     for all to authenticated
--     using      (public.is_admin())
--     with check (public.is_admin());
--
-- Do not enable those until the Admin auth work lands.
