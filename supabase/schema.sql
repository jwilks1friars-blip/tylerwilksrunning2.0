-- =============================================================
-- Tyler Wilks Running — Master Schema
-- Run this in the Supabase SQL editor to set up a fresh database.
-- All incremental migrations are captured here.
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Profiles (extends auth.users)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text,
  email         text,
  goal_race     date,
  goal_time     text,
  experience    text default 'intermediate',
  weekly_miles  integer,
  plan_tier     text not null default 'none',
  stripe_customer_id text,
  is_coach      boolean not null default false,
  -- Notification preferences
  notify_weekly_insight boolean not null default true,
  notify_new_message    boolean not null default true,
  created_at    timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Service role full access" on profiles
  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 2. Strava connections
-- ────────────────────────────────────────────────────────────
create table if not exists strava_connections (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade not null unique,
  strava_athlete_id bigint not null unique,
  access_token      text not null,
  refresh_token     text not null,
  token_expires_at  timestamptz not null,
  last_synced_at    timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table strava_connections enable row level security;

create policy "Users can manage own strava connection" on strava_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 3. Activities (synced from Strava)
-- ────────────────────────────────────────────────────────────
create table if not exists activities (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  strava_id      bigint unique,
  name           text not null default '',
  distance       float not null default 0,
  elapsed_time   integer,
  moving_time    integer,
  avg_pace       float,
  avg_hr         float,
  max_hr         float,
  elevation_gain float,
  activity_type  text not null default 'Run',
  started_at     timestamptz not null,
  raw_data       jsonb,
  created_at     timestamptz default now()
);

alter table activities enable row level security;

create policy "Users can read own activities" on activities
  for select using (auth.uid() = user_id);
create policy "Service role can manage activities" on activities
  for all using (true) with check (true);

create index if not exists activities_user_started on activities(user_id, started_at desc);

-- ────────────────────────────────────────────────────────────
-- 4. Training plans
-- ────────────────────────────────────────────────────────────
create table if not exists training_plans (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  goal_race   text,
  goal_time   text,
  start_date  date not null,
  race_date   date not null,
  total_weeks integer not null default 16,
  status      text not null default 'active',
  created_at  timestamptz default now()
);

alter table training_plans enable row level security;

create policy "Users can read own plans" on training_plans
  for select using (auth.uid() = user_id);
create policy "Service role can manage plans" on training_plans
  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 5. Workouts
-- ────────────────────────────────────────────────────────────
create table if not exists workouts (
  id                    uuid default gen_random_uuid() primary key,
  plan_id               uuid references training_plans(id) on delete cascade not null,
  user_id               uuid references auth.users(id) on delete cascade not null,
  scheduled_date        date not null,
  workout_type          text not null,
  target_distance_miles float,
  target_pace_desc      text,
  description           text,
  completed             boolean not null default false,
  created_at            timestamptz default now()
);

alter table workouts enable row level security;

create policy "Users can read own workouts" on workouts
  for select using (auth.uid() = user_id);
create policy "Users can update own workouts" on workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role can manage workouts" on workouts
  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 6. Insights (weekly coaching notes)
-- ────────────────────────────────────────────────────────────
create table if not exists insights (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  week_start    date not null,
  content       text not null,
  data_snapshot jsonb,
  approved      boolean not null default false,
  sent_at       timestamptz,
  created_at    timestamptz default now()
);

alter table insights enable row level security;

create policy "Users can read own insights" on insights
  for select using (auth.uid() = user_id);
create policy "Service role can manage insights" on insights
  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 7. Messages (athlete ↔ coach)
-- ────────────────────────────────────────────────────────────
create table if not exists messages (
  id           uuid default gen_random_uuid() primary key,
  sender_id    uuid references profiles(id) on delete cascade not null,
  recipient_id uuid references profiles(id) on delete cascade not null,
  content      text not null,
  created_at   timestamptz default now() not null,
  read_at      timestamptz
);

alter table messages enable row level security;

create policy "Users can view their own messages" on messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Users can send messages" on messages
  for insert with check (auth.uid() = sender_id);
create policy "Users can mark messages as read" on messages
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

create index if not exists messages_sender_recipient_idx on messages (sender_id, recipient_id);
create index if not exists messages_recipient_sender_idx on messages (recipient_id, sender_id);
create index if not exists messages_created_at_idx on messages (created_at);

-- ────────────────────────────────────────────────────────────
-- 8. Blog posts
-- ────────────────────────────────────────────────────────────
create table if not exists blog_posts (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  date       date not null default current_date,
  category   text not null default 'Training',
  excerpt    text not null default '',
  sections   jsonb not null default '[]',
  published  boolean not null default true,
  created_at timestamptz default now()
);

alter table blog_posts enable row level security;

create policy "Public can read published posts" on blog_posts
  for select using (published = true);
create policy "Authenticated can manage posts" on blog_posts
  for all using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 9. Weekly notes (coach per-week plan notes)
-- ────────────────────────────────────────────────────────────
create table if not exists weekly_notes (
  id         uuid default gen_random_uuid() primary key,
  plan_id    uuid references training_plans(id) on delete cascade not null,
  week_num   integer not null,
  content    text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (plan_id, week_num)
);

alter table weekly_notes enable row level security;

create policy "Coach can manage all weekly notes" on weekly_notes
  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 10. Race results
-- ────────────────────────────────────────────────────────────
create table if not exists race_results (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  race_name    text not null,
  race_date    date not null,
  distance     text not null,
  finish_time  text not null,
  goal_time    text,
  place_overall integer,
  place_age_group integer,
  notes        text,
  created_at   timestamptz default now()
);

alter table race_results enable row level security;

create policy "Users can manage own race results" on race_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role can read all race results" on race_results
  for select using (true);

create index if not exists race_results_user_date on race_results(user_id, race_date desc);
