-- Blog posts table
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/quzqamodxpvfspmqepgp/sql/new

create table if not exists blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  date        date not null default current_date,
  category    text not null default 'Training',
  excerpt     text not null default '',
  sections    jsonb not null default '[]',
  published   boolean not null default true,
  created_at  timestamptz default now()
);

-- Row-level security
alter table blog_posts enable row level security;

-- Anyone can read published posts (for the public blog)
create policy "Public can read published posts"
  on blog_posts for select
  using (published = true);

-- Only authenticated users can insert/update/delete
-- (the API routes use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)
create policy "Authenticated can manage posts"
  on blog_posts for all
  using (auth.role() = 'authenticated');
