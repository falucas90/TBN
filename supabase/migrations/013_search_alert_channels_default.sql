-- ============================================================
-- Crivo — Default alert_channels to a working notification channel
--
-- Companion to the client-side default fix in CreateSearch.jsx
-- (docs/specs/fix-batch-1.md, item 3): WhatsApp delivery does not exist
-- yet (see notify-alert/index.ts's TODO(whatsapp)), so the original
-- '{"whatsapp": true, "email": false}' default silently drops 100% of
-- alerts for any search created without the user touching the
-- notification toggles.
--
-- AC3.4 check: no current insert path into public.searches actually
-- relies on this column default. The table's RLS insert policy only
-- allows a row's own owner to insert it (auth.uid() = user_id), and the
-- sole insert call site (src/services/searchesService.js#createSearch,
-- used only by CreateSearch.jsx) always sends alert_channels explicitly
-- — CreateSearch.jsx's alertChannels state is never undefined. So this
-- migration changes zero rows and zero current behavior; it exists so
-- the schema's default agrees with the product decision and does not
-- become a latent trap for a future insert path (e.g. an
-- admin/service-role-created search, a "duplicate search" feature) that
-- might omit the field and silently reintroduce the same dropped-alerts
-- bug.
-- ============================================================

alter table public.searches
  alter column alert_channels set default '{"whatsapp": false, "email": true}';
