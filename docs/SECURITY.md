# Crivo — Security Pass (pre-beta)

**Date:** 2026-06-11 · **Branch:** `sec/hardening` · **Context:** free, invite-only beta.

This pass audited the RLS migrations (`supabase/migrations/001`–`009`), the five
edge functions, the client trust boundaries (`src/context/AuthContext.jsx`,
`src/services/*.js`), the pages (`src/pages/*.jsx`), the deploy configs
(`index.html`, `vercel.json`, `netlify.toml`) and the supply chain
(`.github/workflows/ci.yml`, `package.json`). It complements the earlier
point-in-time audit in `SECURITY_AUDIT.md` (2026-06-09); several of its
criticals (status enforcement, self-demotion warning) were already fixed
before this pass.

## Findings

| ID | Area | Severity | Finding | Status |
|----|------|----------|---------|--------|
| S-01 | Edge functions / CORS | med | All 4 functions sent `Access-Control-Allow-Origin: *`. | **FIXED** — shared `_shared/cors.ts` reads `ALLOWED_ORIGIN` secret (defaults to `*` for dev); documented in README + beta checklist. |
| S-02 | HTTP headers | med | No security headers on the static host. | **FIXED** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` added to both `vercel.json` and `netlify.toml`. |
| S-03 | Auth / password policy | low | Login accepted 6-char passwords (Signup requires 8); ResetPassword had no minimum at all; Signup's server-error mapper said "6". | **FIXED** — all client checks unified to 8 (pt-PT messages). Server side: set Supabase Dashboard → Authentication → Email → minimum password length to **8** (step added to `docs/BETA_CHECKLIST.md`; Supabase default is 6). |
| S-04 | Admin / self-lockout | med | An admin could deactivate their own account via `update-user-role` `update-status`, locking themselves out (the inactive check signs the session out). | **FIXED** — server returns 400 «Não pode desativar a sua própria conta.» when `userId === caller.id`; AdminStands shows the same warning client-side (mirrors the self-demotion toast pattern). |
| S-05 | Supply chain | high | `react-router` 7.14.0 had three advisories, incl. GHSA-49rj-9fvp-4h2h (unauth RCE via turbo-stream deserialization — SSR-focused, but flagged high), an open redirect and a DoS. | **FIXED** — `react-router-dom` bumped 7.14.0 → 7.17.0 (minor, no breaking change). |
| S-06 | Supply chain / CI | info | No automated dependency auditing or update flow. | **FIXED** — `security` CI job (`npm audit --audit-level=high` fails on high/critical), `npm run audit` script, and `.github/dependabot.yml` (weekly npm + github-actions, 5 open-PR limit). |
| S-07 | Webhook auth | low | `notify-alert` / `daily-summary` compare `x-webhook-secret` with `===` (not constant-time). | **ACCEPTED for beta** — the secret is long and random and the endpoint is not enumerable in practice. Hardening: compare with `crypto.subtle.timingSafeEqual` (or compare SHA-256 digests) when convenient. |
| S-08 | Auth / abuse | med | No rate limiting or CAPTCHA on signup/login or the public `/isv` calculator. | **ACCEPTED for beta** — invite-only, free; Supabase Auth has its own basic throttling (the UI maps 429s). Revisit before public launch. |
| S-09 | Auth | low | No MFA. | **ACCEPTED for beta** — single-role dealer accounts, no payment data. Consider enabling Supabase MFA for admin accounts first. |
| S-10 | HTTP headers / CSP | med | No `Content-Security-Policy`. A strict CSP today would break inline styles (React style props) and Fontshare fonts. | **ACCEPTED for beta** — starter policy documented below as future work. |
| S-11 | Business logic | low | ISV/margin math runs client-side (`src/lib/isv.js`); a user can manipulate their own numbers in dev tools. | **ACCEPTED for beta** — outputs only affect the user's own view; persisted inputs (searches, alerts) are RLS-protected per owner, and alert rows are only written by the service role. |
| S-12 | Client storage | info | `localStorage` holds the onboarding-seen flag (`Searches.jsx`) and the mock-mode session (dev only, gated by `supabaseConfigured`). | **ACCEPTED** — no tokens or PII beyond the Supabase SDK's own session storage; harmless. |
| S-13 | Supply chain | med | `esbuild` ≤0.24.2 via `vite` 5 (GHSA-67mh-4wv8-2f99): any website can read responses from the local **dev server**. | **ACCEPTED for beta** — dev-only exposure, no production impact; fix requires a `vite@8` major bump. Dependabot will propose it; do it deliberately, not via `npm audit fix --force`. |
| S-14 | RLS / alerts | low | The `alerts` owner-update policy (004) lets owners update **any** column of their own alerts (e.g. `price_original`), not just `user_status`. `with check (auth.uid() = user_id)` does prevent reassigning `user_id`. | **RESOLVED** by 009 — the company-scoped rework adds a column-level `UPDATE` grant so clients can only write `alerts.user_status`; all other columns (prices, `company_id`, etc.) are no longer client-writable, closing the integrity gap. |
| S-15 | Edge functions / info leak | low | All four functions return raw `err.message` in 500 responses. | **TODO** — low value to an attacker today (mostly Supabase SDK messages), but prefer a generic pt-PT message + `console.error` for the details. |
| S-16 | Build / mock mode | med | A production build with missing `VITE_SUPABASE_*` vars silently ships mock mode (every visitor "logged in" as the mock dealer). Known issue (SECURITY_AUDIT.md C-01). | **TODO** — add a build-time guard in `vite.config.js` for production deploy pipelines. Deliberately **not** added in this pass: CI runs `npm run build` without env vars by design, and mock mode must keep working. Mitigation: the beta checklist makes env vars an explicit pre-deploy step. |
| S-17 | RLS / feedback | info | `feedback` insert policy requires `auth.uid() = user_id`, so the widget only works for logged-in users; an anonymous insert (`user_id: null`) is rejected by RLS. | **ACCEPTED** — the widget is only rendered inside the authenticated app; behaviour is correct, just worth knowing. |

**Counts:** high 1 · medium 7 · low 6 · info 3 — **FIXED 6 · ACCEPTED 8 · TODO 2 · RESOLVED-since 1** (S-14, by migration 009).

## Audited and found sound

A report that only lists problems undersells the posture. The following were
checked and are in good shape:

- **RLS is enabled on every table** (`profiles`, `searches`, `alerts`,
  `audit_logs`, `feedback`, `companies`) and, since the company multi-tenancy
  rework (009), the business-data policies key on
  `company_id = current_company_id()` — a `SECURITY DEFINER` helper that
  resolves the caller's company and returns **NULL for a suspended company**, so
  suspending a stand instantly cuts off all app access. No policy allows
  cross-company reads or writes. **Column-level grants** then restrict what
  clients may write even within their own company: clients can update only
  `alerts.user_status` (not prices or any other alert column), and cannot change
  `profiles.company_id` / `profiles.company_role` or `companies.status` —
  membership, role and suspension changes are service-role-only. Platform admins
  belong to no company, so `current_company_id()` is NULL for them and the
  company-scoped tables return nothing.
- **Alerts can only be inserted by the backend** — there is deliberately no
  client INSERT policy on `alerts`; rows come from the service role. The same
  applies to all writes on `audit_logs`.
- **Admin gating is server-side**: the role lives in `app_metadata` (only
  writable via the service role / Dashboard, never by the user), the
  `update-user-role` function re-verifies the caller's JWT and role before
  *every* action, and the `audit_logs`/`feedback` admin-select policies read
  the role from the JWT (`auth.jwt() -> 'app_metadata' ->> 'role'`, fixed in
  migration 003). The client route guard is a mirror, not the enforcement.
- **The service-role key is confined to edge functions** (injected by the
  platform) and the local `scripts/seed-test-alert.mjs` (read from env, never
  committed). The client bundle only ever sees the `VITE_` anon key.
- **`delete-account` only deletes the verified caller** — the target id comes
  from the validated JWT, not the request body.
- **Account deactivation is enforced**: `AuthContext` signs out any session
  whose `app_metadata.status` is `inactive` (closing the old audit's C-02).
- **No XSS vectors found**: zero uses of `dangerouslySetInnerHTML`; React
  escapes all interpolated content; the notification emails escape every
  user-influenced value through `_shared/email.ts#escapeHtml` (including
  `listing_url`, which moreover only originates from the trusted backend).
- **`window.open` is safe everywhere** — the only call sites
  (`AlertHistory.jsx`) pass `'noopener,noreferrer'`; there are no
  `target="_blank"` anchors.
- **Webhook functions fail closed** — if `WEBHOOK_SECRET` is unset, the guard
  rejects every request (`!secret || header !== secret`).
- **Admin list pagination inputs are validated** (`page`/`perPage` integer
  checks, `perPage` capped at 100), preventing resource abuse via the admin
  endpoint.

## Future work: starter CSP

Not enabled now (inline React style props and Fontshare would break under a
strict policy). When ready, start in `Content-Security-Policy-Report-Only`
with:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://api.fontshare.com;
font-src https://cdn.fontshare.com;
img-src 'self' data:;
connect-src 'self' https://<PROJECT-REF>.supabase.co wss://<PROJECT-REF>.supabase.co https://*.ingest.sentry.io;
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

Iterate on the report-only violations, then enforce. `frame-ancestors 'none'`
will then supersede `X-Frame-Options: DENY`.
