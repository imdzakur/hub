-- Finance Management database. Run after 01-hub.sql, in the Supabase SQL editor. Safe to run again.
-- Transactions older than 6 months are deleted by public.fm_prune(); before they go, their effect on each
-- account and pocket is added to fm_carryover, so balances stay right.

create table if not exists public.fm_transactions (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,          -- keeps the order of entries on the same day
  date date not null,
  description text not null check (char_length(description) between 1 and 120),
  from_node text not null check (from_node ~ '^[a-z][a-z0-9.]{0,31}$'),  -- account, pocket, or outside party (model.js NODES)
  to_node text not null check (to_node ~ '^[a-z][a-z0-9.]{0,31}$'),
  amount bigint not null check (amount > 0),        -- whole rupiah
  fee bigint not null default 0 check (fee >= 0),   -- charged to from_node on top of amount
  fee_label text check (char_length(fee_label) <= 24),
  kind text not null check (kind in ('opening', 'income', 'transfer', 'expense')),
  category text not null check (category ~ '^[a-z]{1,24}$'),
  status text not null default 'posted' check (status in ('posted', 'scheduled')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_node <> to_node)
);

create index if not exists fm_transactions_date_idx on public.fm_transactions (date, seq);

-- Net effect of deleted entries per account or pocket
create table if not exists public.fm_carryover (
  node text primary key,
  amount bigint not null default 0,
  updated_at timestamptz not null default now()
);

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

-- Deletes entries older than keep_months and carries their posted amounts into fm_carryover.
-- The API calls it before every read; pg_cron (below) also runs it every night.
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

-- Only the server (secret key) reads or writes. RLS on with no policies blocks the publishable key.
alter table public.fm_transactions enable row level security;
alter table public.fm_carryover enable row level security;
revoke all on public.fm_transactions, public.fm_carryover from anon, authenticated;
revoke execute on function public.fm_prune(int) from public, anon, authenticated;
grant execute on function public.fm_prune(int) to service_role;

-- Nightly clean-up when pg_cron is on (Database > Extensions > pg_cron). Without it, the API still prunes on every read.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('fm-prune', '15 3 * * *', 'select public.fm_prune()');
  end if;
end;
$$;

