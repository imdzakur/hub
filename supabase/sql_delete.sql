-- Removals for the live database. Run in the Supabase SQL editor; safe to run again.
-- Deleted data can't be brought back, so check before running.

-- Every Finance Management entry, so you can start entering your own from a clean slate.
-- Also clears the carried-over balances and restarts the entry numbering.
-- Sign-in attempts (login_attempts) are kept.
truncate table public.fm_transactions, public.fm_carryover restart identity;

-- Old system map tables: the maps now live in public/systems/*/data.js
drop view if exists public.map_summary;
drop function if exists public.map_json(text);
drop table if exists
  public.map_route_steps,
  public.map_routes,
  public.map_connections,
  public.map_systems,
  public.map_sections,
  public.maps
cascade;

-- Check: both should be 0
select (select count(*) from public.fm_transactions) as entries, (select count(*) from public.fm_carryover) as carryover;
