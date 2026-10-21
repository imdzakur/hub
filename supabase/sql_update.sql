-- Fixes for the live database. Run AFTER sql_delete.sql. Safe to run again.

-- ===== New: budget amounts you can change in Plan =====
-- Budget amounts you change in Plan (salary, bills, food, and the rest). Each row starts on from_date and
-- lasts until the next row; the app's built-in budgets fill in where there is none. Empty = all defaults.
create table if not exists public.fm_budget_versions (
  from_date date primary key,
  salary bigint not null check (salary >= 0),
  amounts jsonb not null check (jsonb_typeof(amounts) = 'object'),  -- budget line id -> whole rupiah
  parents_help bigint not null default 0 check (parents_help >= 0),
  updated_at timestamptz not null default now()
);
alter table public.fm_budget_versions enable row level security;
revoke all on public.fm_budget_versions from anon, authenticated;

-- ===== Daily Needs, Buffer, and Birthday are one pocket and one category (from the last update) =====
-- Already done if you ran the previous version of this file; running it again changes nothing.
update public.fm_transactions set from_node = 'bca.daily', updated_at = now()
  where from_node in ('bca.buffer', 'bca.birthday') and to_node <> 'bca.daily';
update public.fm_transactions set to_node = 'bca.daily', updated_at = now()
  where to_node in ('bca.buffer', 'bca.birthday') and from_node <> 'bca.daily';
update public.fm_transactions set category = 'daily', updated_at = now() where category = 'buffer';
with moved as (
  delete from public.fm_carryover where node in ('bca.buffer', 'bca.birthday') returning amount
)
insert into public.fm_carryover (node, amount)
select 'bca.daily', sum(amount) from moved having count(*) > 0
on conflict (node) do update set amount = public.fm_carryover.amount + excluded.amount, updated_at = now();

-- Check: the budget table exists (0 rows until you save a change in Plan)
select count(*) as saved_budgets from public.fm_budget_versions;
