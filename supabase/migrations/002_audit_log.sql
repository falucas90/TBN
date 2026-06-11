-- ============================================================
-- Crivo — Audit Log
-- ============================================================

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references auth.users on delete set null,
  target_id   uuid references auth.users on delete set null,
  action      text not null,   -- 'role_change' | 'status_change'
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Admins can read all logs; nobody can insert/update/delete from client.
-- The role lives in the JWT's app_metadata (auth.users has no app_metadata
-- column — see 003, which recreates this same policy).
create policy "audit_logs: admin select"
  on public.audit_logs for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists audit_logs_admin_idx  on public.audit_logs (admin_id);
create index if not exists audit_logs_target_idx on public.audit_logs (target_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
