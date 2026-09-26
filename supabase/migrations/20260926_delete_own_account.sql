-- Self-service account deletion (Privacy Policy: right to delete).
-- Run this in the Supabase SQL editor (or via supabase db push).
--
-- Deleting from auth.users needs elevated rights the browser's anon key
-- doesn't have, so this SECURITY DEFINER function does it — but only ever
-- for the caller's own id, taken from their verified JWT via auth.uid().
-- Child rows are deleted explicitly rather than relying on each table's
-- foreign-key cascade settings.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.assignments
    where course_id in (select id from public.courses where user_id = uid);
  delete from public.courses where user_id = uid;
  delete from public.eclass_syncs where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
