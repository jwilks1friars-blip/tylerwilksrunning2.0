-- Garmin connections (OAuth 1.0a)
create table public.garmin_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade unique,
  garmin_user_id text not null,
  access_token text not null,
  access_token_secret text not null,
  connected_at timestamptz default now()
);

alter table public.garmin_connections enable row level security;
create policy "Users see own garmin" on public.garmin_connections for all using (auth.uid() = user_id);

-- Coros connections (OAuth 2.0)
create table public.coros_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade unique,
  coros_user_id text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz default now()
);

alter table public.coros_connections enable row level security;
create policy "Users see own coros" on public.coros_connections for all using (auth.uid() = user_id);

-- Post-workout feedback
create table public.workout_feedback (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts on delete cascade unique,
  user_id uuid references public.profiles on delete cascade,
  rpe int check (rpe between 1 and 10),
  felt_like text check (felt_like in ('below', 'as_expected', 'above')),
  notes text,
  created_at timestamptz default now()
);

alter table public.workout_feedback enable row level security;
create policy "Users see own feedback" on public.workout_feedback for all using (auth.uid() = user_id);

-- Per-activity AI insights
create table public.activity_insights (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid references public.activities on delete cascade unique,
  user_id uuid references public.profiles on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.activity_insights enable row level security;
create policy "Users see own activity insights" on public.activity_insights for all using (auth.uid() = user_id);

-- Add new columns to workouts
alter table public.workouts
  add column if not exists target_rpe int check (target_rpe between 1 and 10),
  add column if not exists hr_zone_target text check (hr_zone_target in ('z1', 'z2', 'z3', 'z4', 'z5')),
  add column if not exists workout_segments jsonb,
  add column if not exists race_prep boolean default false;

-- Add source + cadence to activities
alter table public.activities
  add column if not exists source text default 'strava' check (source in ('strava', 'garmin', 'coros', 'manual')),
  add column if not exists cadence int;

-- Coach can read all athlete data
create policy "Coach sees all garmin" on public.garmin_connections for select
  using (auth.uid() = (select id from public.profiles where is_coach = true limit 1));

create policy "Coach sees all coros" on public.coros_connections for select
  using (auth.uid() = (select id from public.profiles where is_coach = true limit 1));

create policy "Coach sees all activity insights" on public.activity_insights for select
  using (auth.uid() = (select id from public.profiles where is_coach = true limit 1));
