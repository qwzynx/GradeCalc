-- eClass grade sync support
-- Run this in the Supabase SQL editor (or via supabase db push) before using the eClass Sync button.

-- Sync keys so repeated syncs update existing rows instead of duplicating them
alter table courses add column if not exists eclass_course_id text;
alter table assignments add column if not exists eclass_item_name text;

-- History of every sync: what was scraped and what was applied
create table if not exists eclass_syncs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  synced_at timestamptz not null default now(),
  courses_matched int,
  items_updated int,
  items_created int,
  snapshot jsonb
);

alter table eclass_syncs enable row level security;

drop policy if exists "Users manage own eclass syncs" on eclass_syncs;
create policy "Users manage own eclass syncs" on eclass_syncs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
