-- Hub base database for a fresh project. Run first, in the Supabase SQL editor. Safe to run again.
-- Changes to an existing database come as two files: sql_update.sql (fixes) and sql_delete.sql (removals).

-- ===== Sign-in attempts, used to limit password guessing per IP =====
-- 5 wrong passwords lock that IP for 15 minutes.
create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,                 -- HMAC of the IP, never the real address
  success boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_ip_time_idx
  on public.login_attempts (ip_hash, created_at desc);

-- Delete attempts older than a day. The lockout only looks at the last 15 minutes.
create or replace function public.prune_login_attempts()
returns void
language sql
set search_path = ''
as $$
  delete from public.login_attempts where created_at < now() - interval '1 day';
$$;

-- Only the server (secret key) reads or writes. RLS on with no policies blocks the publishable key.
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;
revoke execute on function public.prune_login_attempts() from public, anon, authenticated;
grant execute on function public.prune_login_attempts() to service_role;

-- Nightly clean-up when pg_cron is on (Database > Extensions > pg_cron)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('prune-login-attempts', '0 3 * * *', 'select public.prune_login_attempts()');
  end if;
end;
$$;
