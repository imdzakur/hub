-- Fixes for the live database. Run AFTER sql_delete.sql. Safe to run again: the entries go in only
-- while the ledger is empty.
-- Enters the position of 22 Oct 2026: payday 21 Oct is split across the accounts and pockets.

-- The budget table, in case an older version of this file was never run
create table if not exists public.fm_budget_versions (
  from_date date primary key,
  salary bigint not null check (salary >= 0),
  amounts jsonb not null check (jsonb_typeof(amounts) = 'object'),  -- budget line id -> whole rupiah
  parents_help bigint not null default 0 check (parents_help >= 0),
  updated_at timestamptz not null default now()
);
alter table public.fm_budget_versions enable row level security;
revoke all on public.fm_budget_versions from anon, authenticated;

-- ===== Ledger, 21-22 Oct 2026 =====
-- Rows go in this order, so seq keeps the order of entries on the same day.
insert into public.fm_transactions (date, description, from_node, to_node, amount, fee, fee_label, kind, category, status, note)
select v.date::date, v.description, v.from_node, v.to_node, v.amount, v.fee, v.fee_label, v.kind, v.category, v.status, v.note
from (values
  -- What was there before payday
  (1, '2026-10-21', 'Starting balance', 'opening', 'bsi', 1000, 0, null, 'opening', 'opening', 'posted', 'Left from last month'),
  (2, '2026-10-21', 'Starting balance', 'opening', 'bca.ef', 2255624, 0, null, 'opening', 'opening', 'posted', 'Savings before payday'),
  (3, '2026-10-21', 'Starting balance', 'opening', 'bca.daily', 20600, 0, null, 'opening', 'opening', 'posted', 'Daily Needs, Buffer, and Birthday together'),
  (4, '2026-10-21', 'Starting balance', 'opening', 'bca.bonus', 2000, 0, null, 'opening', 'opening', 'posted', 'Old leftover'),
  -- 21 Oct
  (5, '2026-10-21', 'Meals 21 Oct', 'bca.ef', 'merchants', 36000, 0, null, 'expense', 'food', 'posted', 'Paid from savings for now; Food pays it back on 22 Oct'),
  (6, '2026-10-21', 'Salary', 'employer', 'bsi', 5729876, 0, null, 'income', 'income', 'posted', null),
  -- 22 Oct: transfers and the pocket split
  (7, '2026-10-22', 'Salary to SeaBank', 'bsi', 'seabank', 5728376, 2500, 'BI-FAST', 'transfer', 'transfer', 'posted', 'BSI is empty after this'),
  (8, '2026-10-22', 'SeaBank to BCA', 'seabank', 'bca.main', 3811776, 0, null, 'transfer', 'transfer', 'posted', 'SeaBank keeps 1,916,600: rent 1,800,000 + Telkomsel Halo 116,600'),
  (9, '2026-10-22', 'Payday split: Emergency Fund', 'bca.main', 'bca.ef', 2330776, 0, null, 'transfer', 'savings', 'posted', null),
  (10, '2026-10-22', 'Payday split: Food', 'bca.main', 'bca.food', 956000, 0, null, 'transfer', 'transfer', 'posted', '14 workdays x 38,000 + 8 fast days x 23,000 + 8 days off x 30,000'),
  (11, '2026-10-22', 'Payday split: Claude', 'bca.main', 'bca.claude', 405000, 0, null, 'transfer', 'transfer', 'posted', null),
  (12, '2026-10-22', 'Payday split: Daily Needs', 'bca.main', 'bca.daily', 100000, 0, null, 'transfer', 'transfer', 'posted', 'Main keeps 20,000 for the BCA admin fee in early November'),
  (13, '2026-10-22', 'Pay back meals 21 Oct', 'bca.food', 'bca.ef', 36000, 0, null, 'transfer', 'savings', 'posted', 'Food is 920,000 after this, 36,000 short of the plan'),
  -- Planned
  (14, '2026-10-24', 'Birthday', 'bca.ef', 'merchants', 80000, 0, null, 'expense', 'daily', 'scheduled', 'At most 80,000, from the Emergency Fund on the day')
) as v(n, date, description, from_node, to_node, amount, fee, fee_label, kind, category, status, note)
where not exists (select 1 from public.fm_transactions)
order by v.n;

-- Check: posted balances. Expect BSI 0, SeaBank 1,916,600, Emergency Fund 4,586,400, Food 920,000,
-- Claude 405,000, Daily Needs 120,600, Main 20,000, Bonus 2,000; 7,970,600 in all.
with moves as (
  select from_node as node, -(amount + fee) as delta from public.fm_transactions where status = 'posted'
  union all
  select to_node, amount from public.fm_transactions where status = 'posted'
)
select node, sum(delta) as balance
from moves
where node in ('bsi', 'seabank', 'jago') or node like 'bca.%'
group by node
order by node;
