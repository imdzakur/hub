-- Removals for the live database. Run FIRST, then sql_update.sql.
-- Clears every Finance Management entry, carried-over balance, and saved budget change,
-- so sql_update.sql can enter the position of 22 Oct 2026 from a clean start.
-- The budgets go back to the app's defaults (Plan > Edit amounts still works afterwards).

delete from public.fm_transactions;
delete from public.fm_carryover;
delete from public.fm_budget_versions;

-- Check: all three are 0
select
  (select count(*) from public.fm_transactions) as entries,
  (select count(*) from public.fm_carryover) as carryover,
  (select count(*) from public.fm_budget_versions) as saved_budgets;
