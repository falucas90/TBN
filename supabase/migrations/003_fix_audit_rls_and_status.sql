-- Fix the audit_logs admin select policy.
-- The previous policy referenced app_metadata as a column on auth.users,
-- which does not exist (the column is raw_app_meta_data), so the policy
-- errored at query time. Recreate it reading the role from the JWT instead.

drop policy if exists "audit_logs: admin select" on public.audit_logs;

create policy "audit_logs: admin select" on public.audit_logs
  for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
