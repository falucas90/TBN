-- ============================================================
-- Crivo — Account deletion: detach instead of destroy
--
-- Migration 009 turned searches/alerts into a SHARED company queue
-- (company_id), but ownership/cascade on user_id was never revisited.
-- In 001 both searches.user_id and alerts.user_id were declared
-- `references auth.users on delete cascade`, so deleting any member's
-- account (via auth.admin.deleteUser) hard-deletes every search and
-- alert that member ever created — wiping the whole stand's shared
-- deal flow.
--
-- Fix: searches/alerts belong to the COMPANY (company_id). A departing
-- member's rows must survive; their user_id is simply detached
-- (set to null) rather than cascade-deleting the row. The searches
-- INSERT policy still pins user_id = auth.uid() for new rows
-- (see 009), so this change only affects deletion behaviour.
--
-- Idempotent: safe to re-run. Postgres auto-named the inline FKs from
-- 001 `<table>_<column>_fkey`; drop-if-exists guards a name mismatch.
-- ============================================================

-- ——— searches.user_id: cascade → set null ———————————————————
alter table public.searches
  drop constraint if exists searches_user_id_fkey;

alter table public.searches
  alter column user_id drop not null;

alter table public.searches
  add constraint searches_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- ——— alerts.user_id: cascade → set null ——————————————————————
alter table public.alerts
  drop constraint if exists alerts_user_id_fkey;

alter table public.alerts
  alter column user_id drop not null;

alter table public.alerts
  add constraint alerts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
