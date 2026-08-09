# Tech Debt

Logged from the 2026-08-04 state-of-the-product review (CTO + backend/frontend/QA/devops, read-only). Dated and sourced so it doesn't drift into folklore — update status inline as items get fixed instead of deleting the line.

## Product / core loop

- **[CRITICAL] No ingestion engine exists.** Every `alerts` row to date has come from a manual run of `scripts/seed-test-alert.mjs`. `docs/DATA_CONTRACT.md` describes an "ingestion/scraper team" with zero code footprint and no sign-off in the doc's own sign-off table. This is a roadmap decision, not a bug — tracked as an open question in `docs/FOUNDER_QUESTIONS.md`. (2026-08-04)
- **[HIGH] New searches default to zero working alert channels.** `src/pages/CreateSearch.jsx:65` defaults `alertChannels` to `{ whatsapp: true, email: false }`; WhatsApp delivery isn't implemented server-side (TODO in `supabase/functions/notify-alert/index.ts`). A dealer who accepts the default on search creation gets no alerts, with no error or warning anywhere. (2026-08-04)
- **[HIGH] PHEV ISV miscalculation when `co2` is null.** `src/lib/isv.js:67` — `isPhev && co2 <= 50`; `null <= 50` evaluates `true` in JS, so a PHEV alert with missing CO2 silently gets the full 75% ISV reduction regardless of real emissions. Reproduced: ~€4,050 margin overstatement on a representative PHEV. Not covered by `isv.test.js`. `co2` is nullable in the `alerts` schema and unvalidated by the (draft, unsigned) data contract. (2026-08-04)
- **[MEDIUM] `RATE_TABLES` in `src/lib/isv.js` hardcodes tax year 2026 with no staleness guard.** Will silently keep serving 2026 rates past January 2027 unless someone remembers to add a new table entry. (2026-08-04)
- **[HIGH] No server-side data integrity on `public.alerts`.** No CHECK constraints on `fuel_type`, `cc`, `co2`, prices, or the `flags`/PHEV marker across any of the 12 migrations — every invariant lives only as prose in the draft data contract. Dormant while only the seed script writes; becomes a live risk the day an external ingestion system writes with its own service-role key. (2026-08-04)
- **[LOW] `scripts/seed-test-alert.mjs`'s curated-listing mode (added 2026-08-09 for the interim manual bridge, `docs/DECISIONS.md` "2026-08-04 — Interim bridge") defaults per-field, not per-row.** Any `ALERT_*` field a curator leaves unset silently keeps the smoke-test BMW 330e fixture's specific value (e.g. `cc: 1998`, or `listing_url` pointing at a fake example link) rather than `null` or a hard requirement to fill it in. The script warns at runtime listing which fields are still defaulted and hard-fails the PHEV/`co2` and canonical-`fuel_type` traps, but doesn't block an insert that mixes real and stale-fixture fields. Acceptable for a low-volume, disclosed manual bridge; revisit (require full-row input, or explicit-null support per field) if curation volume grows or the warning proves easy to miss. (2026-08-09)

## Frontend disclosure / fabricated data

- **[CRITICAL] `src/pages/Dashboard.jsx`** (the first screen after login) is 100% hardcoded fixtures — no service calls; `range`/`region` toggles are inert. (2026-08-04)
- **[HIGH] Billing is fabricated in three places and contradicts the free-beta status:** `Settings.jsx` shows a fake "Plano Pro · €49/mês · Ativa"; `admin/AdminBilling.jsx` shows fake MRR/churn/invoices (`AdminBilling.jsx:6` comment: "mirrors the design mock until Stripe lands"); `pages/legal/Terms.jsx` states a binding "€99/mês" clause. No Stripe/payment code exists anywhere in the repo. (2026-08-04)
- **[MEDIUM] `admin/AdminOverview.jsx` "Fontes" panel shows a permanent green "Operacional" pill with fake per-source latency** — could lead an admin to believe the (nonexistent) ingestion pipeline is running. Pull or clearly label until real. (2026-08-04)
- **[MEDIUM] `IsvCalculator.jsx`: "Importar por URL" and "Guardar estimativa" are decorative** — no fetch logic, no backing service; the save toast is fake success. (2026-08-04)
- **[MEDIUM] `AlertHistory.jsx` has no save/dismiss control in the UI** even though the backend fully supports lifecycle (`alerts.user_status`, `updateAlertStatus()`, tested). Makes `docs/BETA_CHECKLIST.md` step D.11 impossible to complete today. The new `Todos/Abertos/Descartados` tab sets `view` state that's never read. (2026-08-04)
- **[LOW] Sidebar shows a static once-on-mount unread count**; `clearUnread` from `AlertsContext` is never invoked anywhere, so the (correctly implemented) mobile badge can only grow within a session. (2026-08-04)

## Test / CI coverage

- **[CRITICAL] `supabase/functions` is excluded from ESLint entirely** (`eslint.config.js:8`) and has zero test coverage — the 5 edge functions (incl. `notify-alert`, the alert-delivery core) and the RLS policies across 12 migrations (23 `CREATE POLICY` statements) are untouched by anything in CI. A broken edge function or a broken RLS policy (i.e. a cross-company data leak) would go fully green today. (2026-08-04)
- **[HIGH] Zero test coverage on auth/access control** — `AuthContext.jsx`, and `ProtectedRoute`/`AdminRoute` in `App.jsx` (the only client-side gate on `/admin/*`). (2026-08-04)
- **[MEDIUM] 5 of 7 services untested**, including `authService.js` (login, GDPR export/delete, admin role/status actions). (2026-08-04)

## Ops / deploy

- **[HIGH] No evidence `docs/BETA_CHECKLIST.md` has been executed against a live Supabase project** — no commit, tag, decision-log entry, or config trace of a real provisioning pass. Treat as an unexecuted plan until confirmed otherwise. (2026-08-04)
- **[MEDIUM] No deploy stage in CI** — deploy-on-merge, if configured, lives entirely in the Vercel/Netlify dashboard, invisible to the repo. No staging/preview strategy, no rollback doc for a bad deploy or migration, no automated post-deploy smoke test. (2026-08-04)
- **[MEDIUM] Monitoring is off by default** — Sentry is wired but `VITE_SENTRY_DSN` is unset by default, and no sourcemap upload is configured even if enabled (no `@sentry/vite-plugin`, no `build.sourcemap`). Nothing else covers uptime/alerting. (2026-08-04)
- **[LOW] React 18.3 vs. latest 19.2** — tracked in `scripts/audit-prod-deps.mjs`'s allowlist comment as the reason one `react-router` advisory can't be fully closed; not urgent, real upgrade effort when scheduled. (2026-08-04)

## Process

- `docs/DECISIONS.md`, `docs/FOUNDER_QUESTIONS.md` and this file were empty before this review — expected, since this review is cycle one of the CTO/subagent operating model (established in PR #35, the commit immediately prior). Now seeded going forward.
