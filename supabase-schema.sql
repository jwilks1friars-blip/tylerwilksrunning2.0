-- Extend auth.users with a profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  goal_race text,
  goal_time text,
  experience text check (experience in ('beginner', 'intermediate', 'advanced')),
  weekly_miles int default 0,
  stripe_customer_id text,
  plan_tier text default 'none' check (plan_tier in ('none', 'plan', 'coaching', 'elite')),
  is_coach boolean default false,
  created_at timestamptz default now()
);

-- Strava connections
create table public.strava_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade,
  strava_athlete_id bigint unique not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  connected_at timestamptz default now()
);

-- Activities synced from Strava
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade,
  strava_id bigint unique not null,
  name text,
  distance float,
  elapsed_time int,
  moving_time int,
  avg_pace float,
  avg_hr int,
  max_hr int,
  elevation_gain float,
  activity_type text,
  started_at timestamptz,
  raw_data jsonb,
  created_at timestamptz default now()
);

-- Training plans
create table public.training_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade,
  goal_race text,
  goal_time text,
  start_date date,
  race_date date,
  total_weeks int,
  status text default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz default now()
);

-- Individual workouts
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.training_plans on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  scheduled_date date not null,
  workout_type text check (workout_type in ('easy', 'tempo', 'intervals', 'long', 'recovery', 'rest', 'race')),
  target_distance_miles float,
  target_pace_desc text,
  description text,
  completed boolean default false,
  linked_activity_id uuid references public.activities,
  created_at timestamptz default now()
);

-- Weekly coaching insights
create table public.insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade,
  week_start date not null,
  content text not null,
  data_snapshot jsonb,
  approved boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.strava_connections enable row level security;
alter table public.activities enable row level security;
alter table public.training_plans enable row level security;
alter table public.workouts enable row level security;
alter table public.insights enable row level security;

-- Policies
create policy "Users see own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users see own strava" on public.strava_connections for all using (auth.uid() = user_id);
create policy "Users see own activities" on public.activities for all using (auth.uid() = user_id);
create policy "Users see own plans" on public.training_plans for all using (auth.uid() = user_id);
create policy "Users see own workouts" on public.workouts for all using (auth.uid() = user_id);
create policy "Users see own insights" on public.insights for all using (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
