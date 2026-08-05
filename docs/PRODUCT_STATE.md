# Crivo — Product State

**Snapshot date:** 2026-08-04.

This document describes what exists in the Crivo codebase and its committed
docs **today**. It contains no roadmap and no proposed direction — every
claim below is traceable to a specific file in this repo. Where two docs
disagree, or a doc and the code disagree, both sides are quoted and flagged
in section 6 rather than silently resolved.

---

## 1. What Crivo is

Crivo is sourcing intelligence for Portuguese car dealers ("stands"): it
watches listings on European car marketplaces (Mobile.de, AutoScout24, and
others), turns matches against a dealer's saved search criteria into
margin-based alerts, and estimates the Portuguese ISV import tax so a dealer
can see real landed cost and margin *before* buying, instead of finding out
after import paperwork. It is a multi-tenant product: each dealer belongs to
one company ("stand"), a stand's whole team shares one alert queue, and a
separate platform-admin side runs the business (accounts, feedback, audit)
with no access to dealer deal data. UI copy is European Portuguese (PT-PT).
The product is currently a free, invite-only closed beta — there is no
public signup and no billing.

---

## 2. Current feature set

Strictly what is implemented and reachable in the app today (`src/pages/`,
`src/pages/admin/`, `src/pages/legal/`). Stub/decorative behaviour is called
out inline and repeated in section 6.

### Auth & onboarding
- **Login** (`Login.jsx`) — email/password via Supabase Auth, PT-PT error
  mapping (invalid credentials, unconfirmed email, rate limit), redirects to
  `/dashboard` on success.
- **Signup** (`Signup.jsx`) — not a registration form. Public self-signup is
  disabled; the page is a static "beta privada por convite" notice with a
  `mailto:` CTA.
- **Forgot / reset password** (`ForgotPassword.jsx`, `ResetPassword.jsx`) —
  request a reset email; set a new password (8-character minimum enforced
  client-side, expected to match a Supabase Auth dashboard setting).
- **Verify email** (`VerifyEmail.jsx`) — holding screen with a 60-second
  resend cooldown; auto-redirects to `/searches` once `email_confirmed_at`
  is set.
- **Route guards** (`App.jsx`) — `ProtectedRoute` requires an authenticated
  session; `AdminRoute` additionally requires `currentUser.role === 'admin'`
  (mirrors, does not replace, server-side enforcement — see section 3).
- **404** (`NotFound.jsx`) — generic not-found screen, links back to
  `/searches`.

### Search & alerts
- **Searches** (`Searches.jsx`) — grid of saved searches with live
  match-count/margin stats from Supabase (or mock data), text filter, and a
  first-run onboarding panel that can create a labelled sample search.
- **Create / edit search** (`CreateSearch.jsx`) — one form: vehicle
  criteria (brand/model from a fixed list, year/km/price range, fuel type),
  origin countries (DE/FR/NL/BE/ES, each mapped to a source marketplace),
  minimum margin and alert threshold, and per-search notification toggles
  (WhatsApp, email, daily summary). Saves as draft/paused or active; delete
  with a confirm dialog. The "Correspondências agora" audience number is a
  client-side arithmetic estimate (`estimateAudience`), not a real query.
- **Alert history** (`AlertHistory.jsx`) — timeline of alerts grouped by
  day; computes ISV and margin per alert **in the browser** via
  `calculateISV`; brand/margin/text filters; PHEV and risk-flag pills; opens
  the source listing in a new tab (`noopener,noreferrer`).
- **Realtime + unread badge** (`AlertsContext.jsx`) — subscribes to Postgres
  `INSERT` on `alerts` filtered by the caller's `company_id`; shows a toast
  and increments the sidebar "Histórico de alertas" count.
- **Dashboard** (`Dashboard.jsx`) — the landing page after login (nav item
  #1, and where `Login.jsx` redirects to). **Every number and chart on this
  page — the 4 KPI cards, "Pulso de mercado" price trends, conversion
  funnel, and pipeline board — is a hardcoded fixture in the component
  file.** It calls no service and does not read the logged-in company's
  real data. See section 6.

### ISV calculator
- **Standalone calculator** (`IsvCalculator.jsx`), usable outside any saved
  search: manual vehicle specs (cc, CO₂, fuel type, registration date) plus
  import costs (price, transport, first-year IUC typed in by hand, buffer
  %) produce an ISV breakdown and a "landed PT" total.
- "URL do anúncio" is offered as an input mode alongside "Especificações
  manuais" but does not parse or fetch anything — the form fields are
  identical and static either way.
- "Guardar estimativa" and "Importar histórico" are UI-only stubs (a toast,
  no persistence, no history list exists anywhere).

### Team / company management
(`Settings.jsx`, `src/services/teamService.js`, `src/services/companiesService.js`)
- Personal profile (name, phone) editable by any member.
- Company identity (stand name, NIF) and business defaults (default
  transport cost, minimum margin) — visible to everyone, editable by the
  owner only.
- Owner-only team panel: invite a member by email, change a member's
  company role (owner/member), remove a member.
- WhatsApp number field and a "Janela silenciosa" (quiet hours 21:00–08:00)
  toggle exist in the UI; the quiet-hours toggle is local component state
  only and is never sent anywhere (see section 6).
- Self-service data export (JSON: user, profile, searches, alerts) and
  account deletion, the latter blocked with a clear message if the caller
  is an owner with other teammates (ownership must be transferred first).
- "Subscrição" section is a static display (fixed "Plano Pro · € 49/mês ·
  Ativa" badge); "Gerir pagamento" only shows a "coming soon" toast — no
  billing integration exists (see section 4).

### Admin & ops
(`src/pages/admin/*`, all gated behind `AdminRoute` / `app_metadata.role === 'admin'`)
- **Visão geral** (`AdminOverview.jsx`) — real counts (registered stands,
  active/total searches, alerts 7d/total) from the `update-user-role`
  edge function's `stats` action. The alert-volume bar chart and the
  "Fontes" marketplace-status panel (Mobile.de / AutoScout24 / Hey.car /
  Kleinanzeigen — status, latency, last-checked) are hardcoded fixtures,
  not a real scraper/ingestion health feed.
- **Stands** (`AdminStands.jsx`) — paginated list of every platform
  account; invite a new stand; change a user's **platform** role
  (dealer/admin) and active/blocked status; both actions audit-logged.
- **Faturação** (`AdminBilling.jsx`) — entirely mock invoices, MRR and
  plan-distribution numbers. The component's own comment says it "mirrors
  the design mock until Stripe lands."
- **Logs & auditoria** (`AdminLogs.jsx`) — real audit trail read from
  `audit_logs`, filterable by "Função"/"Estado". The edge function also
  writes `invite`, `member_invite`, `member_role_change` and
  `member_remove` rows, which show up under "Tudo" but fall back to the raw
  action string (no dedicated label or filter option for them).
- **Feedback** (`AdminFeedback.jsx`) — real triage queue for in-app
  feedback (novo → aprovado/rejeitado → resolvido) with a "copy Claude Code
  prompt" action on approved items, for handing approved feedback straight
  to a build session.

### Notifications
- Email is the only implemented delivery channel, sent by three edge
  functions: `notify-alert` (instant, triggered by a Database Webhook on
  `alerts` INSERT), `daily-summary` (cron digest of the last 24h),
  `notify-feedback` (emails the admin inbox on new feedback).
- All three are company-scoped: every active member of the relevant
  company is emailed (not just the search creator or feedback author); a
  suspended company or a platform-deactivated member is silently skipped
  (`_shared/recipients.ts`).
- `notify-alert` is idempotent — `alerts.notified_at` (migration 012)
  stops a Database Webhook retry from re-emailing the whole team.
- Webhook auth uses a constant-time comparison (`timingSafeEqualStr` in
  `_shared/auth.ts`) against a shared `x-webhook-secret`.
- **WhatsApp is not implemented anywhere in the code** — `notify-alert`
  has only a `TODO(whatsapp)` comment. SMS (also offered as a
  `notif_channel` option) has no delivery path either.

### Legal
- **Terms** (`legal/Terms.jsx`) and **Privacy** (`legal/Privacy.jsx`),
  PT-PT, static content under a shared `LegalLayout`, reachable at
  `/termos` and `/privacidade` without authentication and linked from the
  Landing page footer.
- Terms describes a live €99/month subscription with a cancellation
  policy — this is copy only; nothing in the code charges anyone anything
  (see section 6).

---

## 3. User roles & access model

Verified directly against `supabase/migrations/009_companies.sql`,
`010_harden_signup_trust.sql`, and `supabase/functions/update-user-role/index.ts`
— not just restated from the README.

There are **two independent role axes**:

**Platform axis** — `auth.users.app_metadata.role`: `'admin'` or unset
(informally "dealer" in the UI). This is set only by hand, in the Supabase
Dashboard (per README) or by an existing admin through the Stands role
dropdown, which calls the edge function's `update-role` action. Enforcement:
- Client-side mirror: `AdminRoute` in `App.jsx`.
- Server-side, on every privileged call: the edge function re-derives
  `callerRole` from the caller's verified JWT (`caller.app_metadata?.role`),
  never trusts the request body, and rejects `PLATFORM_ACTIONS` (`invite`,
  `list`, `stats`, `update-role`, `update-status`) with 403 if the caller
  isn't `'admin'`.
- Server-side, on `audit_logs`/`feedback` reads: RLS policies read the role
  directly out of the JWT (`(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`,
  migration 003/007/008) — not from any client-writable column.
- Admins are intended to have **no company**: `current_company_id()` joins
  the caller's `profiles.company_id` to an `active` company and returns
  `NULL` if there is none, which makes every company-scoped RLS policy
  (`searches`, `alerts`, `companies`) return zero rows for them. This is
  true for admins created via the normal invite path (invites always mint a
  *new* company) but is **not an enforced invariant** — see section 6.

**Company axis** — `profiles.company_role`: `'owner'` or `'member'`. Every
non-admin user belongs to exactly one company row (`profiles.company_id`).
- **Owner** — can update company identity/business defaults (RLS +
  column-level `GRANT update (name, nif, default_transport_cost, min_margin)`
  restrict this to those four columns only); can invite/remove members and
  change their company role via the edge function's `OWNER_ACTIONS`, which
  re-checks `company_role === 'owner'` **by reading the caller's own
  `profiles` row server-side**, never from client input.
- **Member** — full product access (searches, alerts, ISV calculator,
  personal settings); no team/company-management UI or grant.
- Both share **one alert queue and one search list per company** — RLS on
  `searches`/`alerts` keys on `company_id = current_company_id()`.
  `alerts.user_status` (`new`/`saved`/`dismissed`) is shared state;
  `status_changed_by` records who acted (trigger, migration 009).

**Enforcement is column-level, not just row-level.** Since migration 009,
clients can write only `alerts.user_status` (every other alert column —
prices, `company_id`, etc. — is service-role-only) and only
`profiles.full_name/phone/notif_channel` (`company_id`/`company_role` are
excluded from the client `GRANT`, so membership changes are impossible from
the client even for the row's own owner). Tenancy assignment
(`company_id`/`company_role`) happens exclusively inside the
`update-user-role` edge function's service-role calls, **after** migration
010 rewrote `handle_new_user()` to stop trusting `raw_user_meta_data` for
`company_id`/`company_role` (closing a cross-tenant-takeover path where a
self-signup could claim `company_id: '<victim>', company_role: 'owner'`).

**Suspension.** A company has `status` (`active`/`suspended`);
`current_company_id()` resolves to `NULL` for members of a suspended
company, cutting off all RLS-gated app access **and** silencing
notifications in one place (`getCompanyRecipients` also checks
`company.status !== 'active'`). Separately, a platform-level user status
(`app_metadata.status = 'inactive'`) is enforced by `AuthContext` signing
out any session carrying it.

**Invite paths** — both go through `auth.admin.inviteUserByEmail`, never
self-signup: a platform admin inviting a new stand creates a company **and**
its owner in one edge-function call (`action: 'invite'`); a company owner
inviting a teammate links the new user into their *existing* company
(`action: 'invite-member'`). Public self-signup being off is enforced partly
by removing the UI and partly by a manual Supabase Dashboard setting
("Allow new users to sign up") — the dashboard setting is an operational
step, not something a migration or the app code enforces.

---

## 4. Business logic status

### Margin alerts
`margin = market_price − (price_original + ISV + transport_est)`, computed
**entirely client-side** in `AlertHistory.jsx` from columns already present
on the `alerts` row (see `docs/DATA_CONTRACT.md`). What this means in
practice:
- **The alert-producing side (scraping/matching against listings) is not in
  this repository at all.** Every `alerts` row is inserted by an external
  system using the service role — there is no client INSERT policy, and no
  scraper/matcher code anywhere in `src/` or `supabase/`. This app only
  consumes rows, computes derived numbers, and notifies.
- The contract governing what those rows must contain (canonical
  `fuel_type` strings, the `flags @> ['PHEV']` convention, non-null
  `market_price`, WLTP `co2` units) is `docs/DATA_CONTRACT.md`, which is
  still **Status: DRAFT — awaiting ingestion-team sign-off** with all
  sign-off checkboxes unticked as of this snapshot.
- Nothing in this repo reads a search's `alert_threshold` to decide whether
  to raise an alert — that decision, if implemented, lives entirely in the
  external ingestion/matching system.
- The "Correspondências agora" live-match number shown while building a
  search (`CreateSearch.jsx`) is a client-side heuristic
  (`estimateAudience`), not a query against real inventory.

### ISV tax calculation (`src/lib/isv.js`)
- **Covered:** CC-bracket tax, separate diesel/petrol CO₂ tables, the
  age-discount schedule (0% at <1yr up to 55% at 7+ years), the PHEV 75%
  reduction (gated on `co2 ≤ 50`), and a non-EU flag that suspends the age
  discount. The rate table is versioned by year (`RATE_TABLES[2026]`) with
  fallback to the newest year ≤ the current year — it needs a manually
  added entry every January or it silently keeps using the prior year's
  table.
- Thoroughly unit-tested (`src/lib/isv.test.js`): every CC/CO₂ bracket
  boundary, all 8 age-discount steps, the PHEV cutoff at `co2 = 50`, and
  non-negativity invariants all have explicit assertions.
- **EV handling is page-level, not calculator-level, and only wired on one
  of two consumers.** `calculateISV` itself has no EV branch — it would tax
  an EV on the petrol CO₂ table. `IsvCalculator.jsx` short-circuits
  `fuel === 'Elétrico'` to an all-zero breakdown before calling it (recently
  fixed and now covered by dedicated tests: "EVs are ISV-exempt in Portugal
  — calculateISV would otherwise tax them on the petrol table"). This
  short-circuit is **not present in `AlertHistory.jsx`**, which calls
  `calculateISV` directly on every alert row — see section 6.
- **PHEV detection differs by surface**, which is intentional but easy to
  miss: the calculator page derives it from the fuel dropdown
  (`fuel === 'Híbrido (PHEV)'`); alert rows derive it from
  `flags.includes('PHEV')` per the data contract — `fuel_type` alone never
  triggers the reduction for an alert.
- Runs entirely client-side by design; `docs/SECURITY.md` (S-11) accepts
  this for beta since only the viewing user's own numbers can be
  manipulated and all persisted data stays RLS-protected.
- IUC (first-year circulation tax) is a free-text number the user types
  into the calculator — it is not computed by the app.

---

## 5. Launch / beta status

- Per `README.md` and `docs/BETA_CHECKLIST.md`: **free, invite-only closed
  beta.** No public signup, no billing/paywall.
- `docs/BETA_CHECKLIST.md` is a manual, checkbox-driven runbook
  (provisioning → email deliverability → frontend deploy → a 15-step
  end-to-end smoke test → data-contract verification → rollback). It is a
  **process document**, not a record of execution — nothing in the repo
  indicates whether these steps have actually been run against a live
  project.
- Section F of that checklist self-declares the current beta limitations:
  WhatsApp not implemented (email-only), no billing, no rate
  limiting/CAPTCHA (mitigated by being invite-only), 8-character password
  minimum only, admin gating depends on a manually-set `app_metadata` field.
- **Security posture:** `docs/SECURITY.md` (2026-06-11, the more current of
  the two security docs) tracks 17 findings: 6 fixed, 8 accepted-for-beta,
  2 TODO, 1 resolved by a later migration; only one was ever High (a
  `react-router-dom` supply-chain advisory, since patched). The older
  `SECURITY_AUDIT.md` (2026-06-09) audited a pre-multi-tenancy version of
  the app (single-file admin page, NIF collected at signup, no status
  enforcement) — `SECURITY.md` itself notes several of that audit's
  Criticals were "already fixed before this pass," and the current code
  confirms it (see section 6, item on S-16): treat `SECURITY_AUDIT.md` as
  historical context, not the live risk register.
- Sentry error monitoring is wired (`VITE_SENTRY_DSN`) but optional and off
  by default.
- CI (`.github/workflows/ci.yml`) runs lint, test, and build on every push
  to `main` and every PR, plus a separate `security` job
  (`scripts/audit-prod-deps.mjs`) that fails on high/critical production
  dependency advisories; `.github/dependabot.yml` keeps npm and
  GitHub Actions dependencies on a weekly update cadence.

---

## 6. Known gaps / open questions

Flagged for a founder decision, not decided here.

1. **A newly created search's default settings send zero notifications
   through any working channel.** `CreateSearch.jsx` defaults
   `alertChannels` to `{ whatsapp: true, email: false }`, matching the
   `searches` table's own DB default. `notify-alert` only sends when
   `search.alert_channels.email === true` and returns early ("Canal de
   email desativado") otherwise. Since WhatsApp delivery doesn't exist,
   a dealer who creates a search without touching the notification toggles
   — the default state — will never receive an alert through any channel,
   with no error surfaced anywhere. This compounds with the Landing page's
   hero copy, which markets WhatsApp as *the* delivery channel ("recebes um
   alerta no WhatsApp"). Needs a decision: flip the default to email-on, or
   ship a visible "email-only for now" caveat before beta dealers configure
   searches.
2. **"Admins have no access to dealer data" is a convention, not an
   enforced constraint.** `current_company_id()` depends only on
   `profiles.company_id`/`company_role` and is completely independent of
   `app_metadata.role`. The `update-role` edge-function action only ever
   writes `app_metadata.role` — it never touches `profiles`. `AdminStands.jsx`
   lets an admin pick **any** existing user (all of whom, being non-admins,
   already belong to a company via the invite flow) and flip their role to
   `admin` from a plain dropdown. After that save, the promoted user still
   has their old `company_id`/`company_role`, so `current_company_id()`
   still resolves to their former stand and RLS would still let them read
   and write its searches/alerts — while also now passing every admin
   check. Today this only happens if an operator promotes an existing
   dealer rather than always minting fresh admin accounts; nothing in code
   prevents or warns about it. Worth deciding whether to enforce it (e.g.
   clear `company_id` server-side when `role` becomes `admin`) or keep it
   as an operational rule.
3. **Dashboard is the first screen after login and is 100% hardcoded.**
   Every KPI, chart, and pipeline entry in `Dashboard.jsx` is a fixture
   in the component file — no service call, no connection to the logged-in
   company's real data, and no "example data" label. Any real beta dealer
   sees the same fabricated numbers regardless of their actual activity.
4. **The core "monitors European marketplaces" capability lives entirely
   outside this repository.** There is no scraper/matcher code in `src/` or
   `supabase/`; alerts only ever arrive via an external system's service-role
   insert. The data contract that system is supposed to honor
   (`docs/DATA_CONTRACT.md`) is still an unsigned draft. Worth confirming
   whether that ingestion system currently exists and is running anywhere,
   since the entire alert pipeline is unfed without it. (`AdminOverview`'s
   "Fontes" marketplace-status panel reinforces the same gap — it looks like
   live scraper monitoring but is a static fixture, ties to this same point.)
5. **Pricing/plan copy is inconsistent and none of it is real.** No billing
   code exists anywhere (`AdminBilling.jsx` and the Settings "Subscrição"
   card are both static mocks), yet `legal/Terms.jsx` states a live
   €99/month subscription with a cancellation policy, Settings shows a
   fixed "Plano Pro · € 49/mês · Ativa" badge, and `AdminBilling.jsx`'s own
   mock data lists three different plan prices (€39/€89/€189). Since this
   is a free beta, this placeholder copy is readable by real users today
   and should probably be reconciled or removed rather than left
   contradicting itself.
6. **Settings → "Janela silenciosa" (quiet hours) does nothing.** It's
   local component state only, never sent to any service — unlike every
   other control on that page, which does persist.
7. **`IsvCalculator`'s "URL do anúncio" mode and "Guardar
   estimativa"/"Importar histórico" are unwired.** The hint copy promises
   auto-imported specs and saved estimates; none of it parses, fetches, or
   persists anything.
8. **`AlertHistory.jsx` has no EV short-circuit, unlike `IsvCalculator.jsx`.**
   If an alert row for an electric vehicle ever arrives, it would be taxed
   on the petrol CO₂ table in the alert view, even though EVs are
   ISV-exempt and the standalone calculator already special-cases this.
   Worth confirming whether EV alert rows are expected in practice and, if
   so, aligning the two code paths.
9. **Two docs disagree with the current code.** `docs/SECURITY.md` lists
   finding S-16 ("prod build can silently ship mock mode") as still
   **TODO**, but `src/lib/supabase.js` already throws when
   `import.meta.env.PROD && !supabaseConfigured` — the underlying risk
   looks closed in code even though the doc says otherwise. Separately,
   `docs/BETA_CHECKLIST.md` (step 15) says non-admins are redirected to
   `/searches`; `AdminRoute` in `App.jsx` actually redirects to
   `/dashboard`. Neither is a functional bug, but both mean the docs
   shouldn't be taken as a live description of behaviour without spot
   checks like this one.
10. **Two separate, easy-to-conflate role vocabularies exist.** The
    platform axis (`app_metadata.role`: `admin` vs. everyone else,
    labelled "Dealer" in the `AdminStands` dropdown) and the company axis
    (`profiles.company_role`: `owner` vs. `member`) are enforced by
    completely separate code paths (`PLATFORM_ACTIONS` vs. `OWNER_ACTIONS`
    in the edge function). Worth keeping the distinction explicit in any
    future spec or support conversation.
11. **Governance docs are empty.** `docs/DECISIONS.md`, `docs/TECH_DEBT.md`,
    `docs/FOUNDER_QUESTIONS.md` and `docs/EFFICIENCY.md` are all header-only
    stubs — no decisions, tech debt, or founder questions have been logged
    yet, so several of the items above are likely the first time they're
    being written down anywhere.
