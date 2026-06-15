-- ============================================================
-- Crivo — Alert notification idempotency
--
-- Adds alerts.notified_at so the instant notifier (notify-alert)
-- can deduplicate: a Database Webhook may re-invoke the function
-- for the same row, and without a marker every retry re-emails the
-- whole company. notify-alert sets this timestamp after a successful
-- send and short-circuits if it is already populated.
-- ============================================================

alter table public.alerts
  add column if not exists notified_at timestamptz;
