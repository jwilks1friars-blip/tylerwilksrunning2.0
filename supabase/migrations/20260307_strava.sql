-- Strava OAuth connections per user
create table if not exists strava_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  strava_athlete_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table strava_connections enable row level security;
create policy "Users can manage own strava connection" on strava_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activities synced from Strava
create table if not exists activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  strava_id bigint unique,
  name text not null default '',
  distance float not null default 0,
  elapsed_time integer,
  moving_time integer,
  avg_pace float,
  avg_hr float,
  max_hr float,
  elevation_gain float,
  activity_type text not null default 'Run',
  started_at timestamptz not null,
  raw_data jsonb,
  created_at timestamptz default now()
);
alter table activities enable row level security;
create policy "Users can read own activities" on activities
  for select using (auth.uid() = user_id);
create policy "Service role can manage activities" on activities
  for all using (true) with check (true);

create index if not exists activities_user_started on activities(user_id, started_at desc);
