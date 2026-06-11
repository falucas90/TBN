-- Feedback triage: status workflow so admins can approve feedback for work.
-- Flow: novo → aprovado (admin green-lights a fix) → resolvido, or rejeitado.

alter table public.feedback
  add column if not exists status text not null default 'novo'
    check (status in ('novo', 'aprovado', 'rejeitado', 'resolvido')),
  add column if not exists admin_notes text;

-- Only admins may update feedback (status / notes), same role pattern as
-- migrations 003 and 007.
create policy "feedback: admin update" on public.feedback
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- Email notification on new feedback (manual setup, like 006)
-- ============================================================
-- The notify-feedback edge function emails the admin whenever a row is
-- inserted into public.feedback. To enable it:
--
--   1. Deploy:        supabase functions deploy notify-feedback --no-verify-jwt
--   2. Set secrets:   supabase secrets set FEEDBACK_EMAIL=<admin-inbox>
--                     (WEBHOOK_SECRET / RESEND_API_KEY / ALERT_FROM_EMAIL are
--                     shared with the other functions and already required)
--   3. Dashboard → Database → Webhooks → Create: table public.feedback,
--      event INSERT, type "Supabase Edge Function" → notify-feedback, and add
--      the HTTP header  x-webhook-secret: <WEBHOOK-SECRET>.
--      (Same setup as the notify-alert webhook — see docs/BETA_CHECKLIST.md.)
