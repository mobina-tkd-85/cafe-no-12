-- ============================================================================
-- Cafe Menu — Supabase schema
--
-- Run this once in: Supabase Dashboard → your project → SQL Editor → New query
-- Paste this whole file in and click "Run".
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  logo_path text,           -- storage path, kept so we can delete the file later
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  description text,
  image_url text,
  image_path text,          -- storage path, kept so we can delete the file later
  category_id uuid not null references categories(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists items_category_id_idx on items(category_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: anyone can read the menu (it's public), only a signed-in
-- admin (a user you create in Authentication) can add/edit/delete.
-- ---------------------------------------------------------------------------

alter table categories enable row level security;
alter table items enable row level security;

create policy "Public can read categories"
  on categories for select
  using (true);

create policy "Authenticated users can insert categories"
  on categories for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update categories"
  on categories for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete categories"
  on categories for delete
  to authenticated
  using (true);

create policy "Public can read items"
  on items for select
  using (true);

create policy "Authenticated users can insert items"
  on items for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update items"
  on items for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete items"
  on items for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage policies
--
-- Before running this section: create two PUBLIC buckets in the dashboard
-- (Storage → New bucket): "category-logos" and "menu-items". Check "Public
-- bucket" when creating each one. Then run the policies below.
-- ---------------------------------------------------------------------------

create policy "Public can view category logos"
  on storage.objects for select
  using (bucket_id = 'category-logos');

create policy "Authenticated can upload category logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'category-logos');

create policy "Authenticated can delete category logos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'category-logos');

create policy "Public can view menu item images"
  on storage.objects for select
  using (bucket_id = 'menu-items');

create policy "Authenticated can upload menu item images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-items');

create policy "Authenticated can delete menu item images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-items');
