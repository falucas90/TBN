# Fix Batch 1

**Status:** Approved for build. Scope, priority, and root cause for all 6 items
below were already diagnosed by the CTO in `docs/PRODUCT_STATE.md` and
`docs/design/CURRENT_STATE.md` and confirmed against the current code in this
session. This spec exists only to give backend-engineer and frontend-engineer
testable acceptance criteria per item — it does not re-litigate whether to do
these fixes.

**Owners:** Item 1 → backend-engineer. Items 2, 4, 5, 6 → frontend-engineer.
Item 3 → frontend-engineer, with a backend-engineer check (see item 3).

---

## Problem

Six independent, already-diagnosed defects are live in the current build: one
is a real security gap (a promoted admin keeps RLS access to their former
company's deal data), one silently drops 100% of alert notifications for any
dealer who doesn't touch a toggle, one produces a wrong (taxed) ISV number for
electric vehicles on one of two surfaces that compute it, and three are UI/UX
correctness issues (wrong route access, a broken-looking `Callout`, a dead
static page instead of a redirect). Each is small and isolated but collectively
they affect security, revenue-relevant tax accuracy, and first-run UX for real
beta dealers.

## Solution

Fix each of the 6 items as scoped below, no broader refactor. Each item is
independently shippable and testable; they do not depend on each other except
where item 3 explicitly calls out a possible migration dependency.

## User stories

1. As a founder, when I promote a dealer to platform admin, I need them to
   permanently lose RLS access to their former company's searches/alerts.
2. As a platform admin, when I open a dealer-only URL, I should land somewhere
   that makes sense for my role, not on a broken dealer onboarding screen.
3. As a dealer who creates a search and never touches the notification
   toggles, I need to actually receive alerts through a channel that works.
4. As a dealer viewing alert history, I need an EV alert's ISV to show as
   exempt (zero), not taxed on the petrol table.
5. As any user shown a danger/warn/info `Callout` (e.g. an expired reset-password
   link), I need to see it rendered with its intended background tint.
6. As anyone who lands on `/signup` (old link, bookmark, typed URL), I should
   be sent to the real entry point (`/login`), not a static dead-end page.

---

## Acceptance criteria

### Item 1 — Admin promotion must clear tenancy (backend-engineer)

File: `supabase/functions/update-user-role/index.ts`, `'update-role'` action.

- AC1.1: When `action === 'update-role'` is called with `role === 'admin'` for
  a `userId` whose `profiles` row currently has a non-null `company_id` and/or
  `company_role`, the edge function performs a service-role update on that
  user's `profiles` row setting `company_id = null` and `company_role = null`,
  in addition to the existing `app_metadata: { role }` update.
- AC1.2: After the call, querying `profiles` for that `userId` directly (service
  role, bypassing RLS) returns `company_id: null` and `company_role: null`.
- AC1.3: After the call, `current_company_id()` evaluated as that user returns
  `NULL` (verified via a query run as that user, or equivalently by confirming
  RLS on `searches`/`alerts` now returns zero rows for their former company).
- AC1.4: When `action === 'update-role'` is called with `role` set to any value
  other than `'admin'` (i.e. a demotion or no-op), the `profiles` row's
  `company_id`/`company_role` are left untouched — no unrelated tenancy side
  effect on non-promotion role changes.
- AC1.5: If the `profiles` update fails, the endpoint returns a non-2xx
  response with an error body; it must not return the existing 200
  `{ user: data.user }` success response while the tenancy clear silently
  failed (no "role changed but tenancy still leaks" partial-success state).
- AC1.6: The existing `audit_logs` insert (`role_change`, `old_value`,
  `new_value`) still fires unchanged for every `update-role` call, including
  ones that also clear tenancy.
- AC1.7: Existing tests for the `update-role` action (if any) still pass; a
  new test/assertion covers the promotion-clears-tenancy path (AC1.1–1.3) and
  the non-admin-role no-op path (AC1.4).

### Item 2 — Dealer routes must not be reachable by platform admins (frontend-engineer)

File: `src/App.jsx`.

- AC2.1: A new guard (mirroring `AdminRoute`'s existing pattern) redirects an
  authenticated user with `currentUser?.role === 'admin'` away from every
  dealer route: `/dashboard`, `/searches`, `/searches/new`,
  `/searches/:id/edit`, `/alerts`, `/isv`, `/settings`. Target: `/admin` (the
  symmetric counterpart of `AdminRoute`'s existing `/dashboard` redirect for
  non-admins).
- AC2.2: A non-admin authenticated user's access to those same 6 dealer routes
  is unchanged (still gated only by `ProtectedRoute`'s existing
  auth-only check).
- AC2.3: Admin route access (`/admin`, `/admin/stands`, `/admin/billing`,
  `/admin/logs`, `/admin/feedback`) is unchanged for both admins (allowed) and
  non-admins (redirected to `/dashboard`, per existing `AdminRoute` behavior).
- AC2.4: Unauthenticated access to any of the 6 dealer routes still redirects
  to `/login`, unchanged.
- AC2.5: The loading-state behavior (spinner while `isLoading`) for the new
  guard matches `AdminRoute`'s and `ProtectedRoute`'s existing pattern.

### Item 3 — New search notification default must use a working channel (frontend-engineer + backend-engineer check)

File: `src/pages/CreateSearch.jsx` (~line 65).

- AC3.1: `useState({ whatsapp: true, email: false })` for `alertChannels` is
  changed to `useState({ whatsapp: false, email: true })`.
- AC3.2: A brand-new search created without the user touching the
  notification toggles saves `alert_channels: { whatsapp: false, email: true,
  ... }` (email true) to the `searches` table, verified by reading the saved
  row back.
- AC3.3: Editing an existing search still loads and displays its own
  persisted `alertChannels` value (from `s.alertChannels`), not the new
  default — this fix only changes the default for the create-new path, per
  the existing `if (s.alertChannels) setAlertChannels(s.alertChannels)` load
  logic, which is unchanged.
- AC3.4 (backend-engineer check, required before this item is marked done):
  Check whether `supabase/migrations/001_initial_schema.sql` line 62
  (`alert_channels jsonb not null default '{"whatsapp": true, "email":
  false}'`) needs a new migration to change the column default to
  `'{"whatsapp": false, "email": true}'`, so that any row inserted without an
  explicit `alert_channels` value (e.g. a server-side/service-role insert
  that omits the field) agrees with the new client default. Do not assume
  either way — confirm whether any insert path actually omits the field
  (client always sends it explicitly per AC3.2) before deciding a migration
  is/isn't needed, and record the conclusion either as a new migration file
  or as a one-line note in this spec's "Open questions" resolution.

### Item 4 — `AlertHistory.jsx` needs the same EV ISV exemption as `IsvCalculator.jsx` (frontend-engineer)

Files: `src/pages/AlertHistory.jsx` (the `enriched` `useMemo`, ~line 53-61),
consistent with the data-contract convention in `docs/DATA_CONTRACT.md`
(PHEV detection on alert rows uses `flags.includes('PHEV')`, not the fuel
string — EV detection must follow the equivalent per-row convention, i.e.
`fuel_type` / `fuelType`, since there is no separate `'EV'` flag defined in
the data contract).

- AC4.1: When an alert row's `fuelType === 'Elétrico'`, `AlertHistory.jsx`
  produces an all-zero ISV breakdown (`isvPayable: 0`, and by extension
  `totalCost = priceOriginal + 0 + transportEst`) for that row, without
  calling `calculateISV` on the petrol/diesel CO₂ tables for that row — same
  short-circuit shape already present in `IsvCalculator.jsx` for
  `fuel === 'Elétrico'`.
- AC4.2: Alert rows with any other `fuelType` value are unaffected — their
  `isvPayable`/`totalCost`/`marginEst` computation is unchanged from current
  behavior (still calling `calculateISV` with the existing PHEV-flag logic).
- AC4.3: A new unit/component test exists asserting that an EV alert row
  (`fuelType: 'Elétrico'`) renders/produces `isvPayable === 0`, mirroring the
  existing `IsvCalculator.jsx` EV test's assertion style ("EVs are ISV-exempt
  in Portugal — calculateISV would otherwise tax them on the petrol table").
- AC4.4: `npm test` and `npm run lint` still pass after the change.

### Item 5 — Missing Callout tokens (frontend-engineer)

File: `src/styles/tokens.css`.

- AC5.1: `tokens.css` defines all 4 tokens: `--color-danger-bg`,
  `--color-info-bg`, `--color-warn-bg`, `--color-warn-text`.
- AC5.2: `--color-danger-bg` resolves to a coral tint consistent with the
  existing `--coral-12` tint pattern (e.g. `var(--coral-12)`), and does not
  duplicate/replace the existing `--color-danger-text` legacy alias.
- AC5.3: `--color-warn-bg` / `--color-warn-text` resolve to an amber
  tint/ink pair consistent with the existing `--amber` / `--amber-12` tint
  pattern (mirroring how `--color-success-bg`/`--color-success-text` already
  pair `--emerald-12`/`--emerald`).
- AC5.4: `--color-info-bg` resolves to a tint consistent with the existing
  `info` convention already established in `ToastContext.jsx`
  (`info` tone uses `--emerald`), i.e. `var(--emerald-12)` — informational
  Callouts reuse the same signal color as success rather than a new one.
- AC5.5: `ResetPassword.jsx`'s existing `danger`-variant `Callout` (the
  invalid-reset-link state) visibly renders with a coral background tint
  after this change (manually verified or via a rendered-style assertion in
  a test), where before it rendered with no background tint.
- AC5.6: No existing component's visual output regresses — `success` variant
  (already working) is unchanged.

### Item 6 — `/signup` should redirect to `/login` (frontend-engineer)

Files: `src/pages/Signup.jsx`, `src/App.jsx`.

- AC6.1: Navigating to `/signup` results in the browser URL changing to
  `/login` and the `Login` page rendering (either via a `<Route>`-level
  `<Navigate>` replacing the `Signup` route in `App.jsx`, or via `Signup.jsx`
  itself redirecting on mount — implementer's choice).
- AC6.2: The redirect uses `replace` semantics (does not add `/signup` to
  browser history, consistent with the existing `Navigate ... replace`
  pattern used elsewhere in `App.jsx`).
- AC6.3: No other route or nav item links to `/signup` after this change (it
  was already unlinked per `docs/design/CURRENT_STATE.md`; this criterion is
  a regression check, not new work).
- AC6.4: The static "beta privada por convite" UI content is removed or
  unreachable (dead code) — not still shipped and simply hidden behind a
  redirect that a code change could accidentally bypass.

---

## Out of scope

- Any broader admin/tenancy audit beyond the single `update-role` promotion
  path (e.g. auditing every other place `app_metadata.role` or
  `profiles.company_id` can be set) — tracked separately if needed.
- Adding a demotion-time company (re)assignment flow for admin → dealer — item
  1 only covers the promotion direction, per the diagnosed gap.
- Building real WhatsApp delivery — item 3 only changes the *default channel
  selection*, not delivery capability, which remains email-only.
- Reconciling `--color-info-text` (referenced by `Callout.jsx`'s `info`
  variant text color but not in the CTO's list of 4 tokens to add) — see Open
  Questions.
- Any redesign of `Callout`, `AdminRoute`, `CreateSearch`, `AlertHistory`, or
  `Signup` beyond the specific defect described per item.
- Retroactively recomputing/backfilling ISV numbers on already-displayed
  historical EV alerts beyond what the corrected client-side computation
  naturally produces on next render (there is no server-side stored ISV
  value to backfill — it's computed on read).

---

## Open questions for founders

None of the 6 fixes themselves are contested — all are pre-decided per
`CLAUDE.md`'s operating rules. The following are implementation-detail
ambiguities worth a quick confirm, not product-direction questions:

1. **Item 5 — `--color-info-text` is also undefined but not in the CTO's
   4-token list.** `Callout.jsx`'s `info` variant reads both
   `--color-info-bg` (in scope) and `--color-info-text` (not listed). After
   this fix, the `info` variant will have a working background but an
   undefined text color, same latent-breakage shape as the 4 tokens being
   fixed — it just isn't live in production yet (per
   `docs/design/CURRENT_STATE.md`, no screen currently uses `info`/`warn`
   variants). Recommend frontend-engineer add `--color-info-text:
   var(--emerald)` in the same pass for consistency (near-zero extra cost,
   closes the same class of bug); flagging rather than silently expanding
   scope since it wasn't explicitly requested.
2. **Item 3 — migration decision itself.** AC3.4 asks backend-engineer to
   determine whether `001_initial_schema.sql`'s column default needs a
   follow-up migration. This spec does not presuppose the answer — resolve
   and record the finding (migration added, or explicitly not needed and
   why) before closing this item.
   **Resolved (backend-engineer):** migration added —
   `supabase/migrations/013_search_alert_channels_default.sql` flips the
   `searches.alert_channels` column default to
   `'{"whatsapp": false, "email": true}'`. No current insert path relies on
   the old default (the only insert site, `createSearch` in
   `src/services/searchesService.js`, always sends `alert_channels`
   explicitly — `CreateSearch.jsx`'s `alertChannels` state is never
   `undefined`, and RLS restricts `searches` inserts to the row's own
   owner, so there is no service-role/edge-function insert path either).
   The migration is added anyway, at near-zero cost/risk, so the schema
   default doesn't silently reintroduce the dropped-alerts bug for a
   future insert path that omits the field.
3. **Item 6 — redirect implementation site.** Whether the redirect lives in
   `App.jsx` (route-level `<Navigate>`, deleting the `Signup` route/import
   entirely) or inside `Signup.jsx` (component redirects on mount, route
   untouched) is left to frontend-engineer as a pure implementation choice;
   either satisfies AC6.1–6.4.
