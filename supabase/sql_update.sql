-- Fixes for the live database. Run in the Supabase SQL editor after sql_delete.sql; safe to run again.
-- After the clean slate there is no old data to fix. This only makes sure the 6-month clean-up
-- function is the current version, so the empty tables are ready for your own entries.

create or replace function public.fm_prune(keep_months int default 6)
returns void
language plpgsql
set search_path = ''
as $$
declare
  cutoff date := (current_date - make_interval(months => keep_months))::date;
begin
  with old as (
    delete from public.fm_transactions where date < cutoff
    returning from_node, to_node, amount, fee, status
  ), moves as (
    select from_node as node, -(amount + fee) as delta from old where status = 'posted'
    union all
    select to_node, amount from old where status = 'posted'
  )
  insert into public.fm_carryover (node, amount)
  select node, sum(delta) from moves group by node
  on conflict (node) do update
    set amount = public.fm_carryover.amount + excluded.amount, updated_at = now();
end;
$$;

revoke execute on function public.fm_prune(int) from public, anon, authenticated;
grant execute on function public.fm_prune(int) to service_role;
