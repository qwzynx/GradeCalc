-- Bonus marks support.
-- Run this in the Supabase SQL editor (or via supabase db push).
--
-- A bonus is stored as an ordinary assignment row with is_bonus = true. Its
-- weight is NOT part of the course's 100% — instead the earned portion
-- (weight * mark / 100) is added on top of the calculated final average.

alter table assignments add column if not exists is_bonus boolean not null default false;
