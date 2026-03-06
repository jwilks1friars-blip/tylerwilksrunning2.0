-- Weekly notes written by the coach for each week of a training plan
create table if not exists weekly_notes (
  id          uuid default gen_random_uuid() primary key,
  plan_id     uuid references training_plans(id) on delete cascade not null,
  week_num    integer not null,
  content     text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (plan_id, week_num)
);

-- Only the service role (coach API routes) writes to this table;
-- athletes can read their own plan's notes.
alter table weekly_notes enable row level security;

create policy "Coach can manage all weekly notes"
  on weekly_notes for all
  using (true)
  with check (true);
