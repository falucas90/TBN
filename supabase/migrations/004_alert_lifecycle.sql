-- ============================================================
-- Crivo — Alert lifecycle (save / dismiss)
-- Adds a user-controlled status to alerts so dealers can save
-- or dismiss matches from the alert history.
-- ============================================================

alter table public.alerts
  add column if not exists user_status text not null default 'new'
  check (user_status in ('new', 'saved', 'dismissed'));

-- Owners may update their own alerts. RLS cannot restrict the update
-- to a single column, but owners can only see their own rows anyway.
create policy "alerts: owner update"
  on public.alerts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists alerts_user_status_idx
  on public.alerts (user_id, user_status);
