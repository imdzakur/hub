-- Removals for the live database. Run FIRST, then sql_update.sql. Safe to run again.
-- The budget change in this update adds a table and removes nothing.

-- ===== From the last update: moves between Daily Needs, Buffer, and Birthday =====
-- Those three pockets are one now, so a move between them would go from Daily Needs to itself.
-- Already done if you ran the previous version of this file; running it again deletes nothing more.
delete from public.fm_transactions
  where from_node in ('bca.daily', 'bca.buffer', 'bca.birthday')
    and to_node in ('bca.daily', 'bca.buffer', 'bca.birthday');

-- Check: how many entries are left
select count(*) as entries from public.fm_transactions;
