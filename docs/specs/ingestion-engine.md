# Ingestion Engine — Product Spec (v1)

**Status:** Draft spec — no code written yet. This document is not a green light
to write to production `alerts`; see the go-live gate in §4/§6.
**Version:** 1.0 (2026-08-05)
**Owner:** cpo (this spec) → backend-engineer (build) → qa-engineer /
code-reviewer (gate) → CTO (go-live sign-off)

**Depends on / related docs:**
- `docs/DECISIONS.md` — 2026-08-04, "Ingestion strategy: build in-house
  (Option C)" — the founder decision this spec implements.
- `docs/DATA_CONTRACT.md` — the target schema this engine must satisfy.
  Currently **DRAFT**, unsigned. Reaching **signed-off** is part of this
  work — see §4 and §6.
- `docs/TECH_DEBT.md` — the "No ingestion engine exists", "PHEV ISV
  miscalculation when `co2` is null", and "No server-side data integrity on
  `public.alerts`" entries are direct dependencies/blockers — see §6.
- `docs/BETA_CHECKLIST.md` §E — the field-by-field data-quality bar this
  engine's output is judged against; this spec references it rather than
  duplicating it.
- `docs/FOUNDER_QUESTIONS.md` — the still-open "what runs in the interim
  while the in-house engine is being built" question is a **separate**
  decision from this spec — see §6.
- `README.md` "Notifications" — describes what an `alerts` INSERT already
  triggers downstream (realtime toast + unread badge, and an instant email
  to *every active member of the company*, via a Database Webhook →
  `notify-alert`). This engine writes into that existing, already-working
  pipeline; it does not change it.

---

## 1. Problem

Crivo's entire pitch — "monitors European car marketplaces... fires
margin-based alerts" — has no automated engine behind it today: every
`alerts` row that has ever existed was inserted by hand by a developer
running `scripts/seed-test-alert.mjs` (`docs/TECH_DEBT.md`). Dealers cannot
receive a single real, automatically-sourced alert, so the core value Crivo
is selling doesn't exist yet, and the current manual-curation stopgap cannot
scale past a handful of test cars.

## 2. Solution (v1 scope)

Build the smallest ingestion engine that continuously and reliably writes
correctly-shaped rows into `public.alerts`, feeding the realtime/email/margin
pipeline that already exists and already works. v1 is about **coverage and
correctness of the write path**, not breadth of marketplaces or
sophistication of matching.

**Marketplaces (v1): Mobile.de and AutoScout24 only.** These are the two
marketplaces named in the founder decision log (`docs/DECISIONS.md`) and the
two directed as v1 scope for this spec. Note: `src/pages/Landing.jsx`
currently markets four "plataformas vigiadas" (Mobile.de, AutoScout24,
Hey.car, Kleinanzeigen), and `src/pages/CreateSearch.jsx`'s country picker
implies coverage of two more marketplaces (Marktplaats for Netherlands,
Coches.net for Spain) that are not in this scope either. This spec does not
resolve that gap — see §6, item 4.

**Matching, at a product level.** Every active search already carries
vehicle criteria (`searches.criteria`: brand, model, year range, mileage
range, price range, fuel type) and a set of source marketplaces
(`searches.sources`, derived from the dealer's selected origin countries).
For each listing the engine observes on a covered marketplace, it evaluates
every active search whose `sources` includes that marketplace, and for every
search whose criteria the listing satisfies, produces **one `alerts` row per
matching search** — never one row shared across multiple searches. This
follows directly from the schema and notification design that already
exist (`alerts.search_id` is a single reference, and the alert email quotes
that specific search's title) — it is a restatement of an existing
constraint, not a new decision introduced here.

**Alert-worthiness.** Per `docs/DATA_CONTRACT.md` (decision #3, still
unsigned but the only existing convention on this), a listing is only
inserted as an alert if the engine has a populated `market_price` (resale
estimate) for it — listings without a resale estimate are not alert-worthy
and must not produce a row. How that estimate is produced is implementation
detail for backend-engineer; that it must exist before insert is a product
requirement carried over from the contract. See §6, item 6 for why the
*quality* of that estimate is itself a named risk.

**Dedup, at a product level.** The engine will run repeatedly against
marketplaces that keep re-showing the same live listings on every pass. It
must recognize a listing it has already alerted for a given search and not
insert a second row for that same (listing, search) pair — no duplicate
alerts, no duplicate company-wide emails for the same car. Whether a
*change* to an already-alerted listing (price drop, corrected spec) should
produce a new alert is explicitly unresolved product territory; v1 defaults
to **no re-alert on change** as a scope cut (see §5, and §6 item 7 for the
caveat).

**Freshness.** Existing product copy (`Landing.jsx`: "a cada minuto";
`CreateSearch.jsx`: "minutos depois do anúncio ser publicado") promises
near-real-time surfacing. v1 must define one fixed, documented re-scan
interval per marketplace and hold to it consistently — but the actual number
is intentionally not set in this spec, because it trades directly against
the anti-bot and legal risk in §6. Picking a number without weighing that
tradeoff would be inventing product direction on a contested point.

**Data contract sign-off.** `docs/DATA_CONTRACT.md` is written as an
agreement between "the Crivo app" and an external "ingestion/scraper team"
that, per the in-house decision, no longer exists as a separate counterparty
— this spec's build *is* the ingestion side. As part of this work, someone
must resolve the contract's four open decisions (canonical `fuel_type`
strings, PHEV-in-`flags` convention, non-null `market_price`, PHEV `co2` as
the low WLTP figure) and complete its sign-off table before the engine
writes to production. See §6, item 10 for who should sign now that
"ingestion" is internal.

## 3. User stories

- As a dealer, I want to receive an alert automatically when a real,
  currently-live listing on Mobile.de or AutoScout24 matches my search
  criteria and clears my margin bar, without anyone manually seeding data,
  so Crivo does what it's sold to do.
- As a dealer, I want every alert I receive to reflect a real listing —
  correct price, correct spec, a working link — so I can trust it enough to
  act on it without double-checking the source myself.
- As a dealer, I want to see a given listing at most once per search it
  matches, even though the engine re-scans marketplaces continuously, so my
  alert queue doesn't fill with duplicates.
- As a dealer with several active searches, I want one listing that matches
  two of my searches to alert me twice (once per search), consistent with
  how the product already explains alerts to me.
- As the CTO/founders, I want it to be structurally impossible for a wrong
  or unvalidated value to slip into a production `alerts` row and produce a
  confidently-wrong margin with no error shown, so the automated engine
  doesn't undermine the same trust the interim manual process is being kept
  honest about.
- As whoever owns `docs/DATA_CONTRACT.md`, I want its four open decisions
  resolved and the sign-off table completed before the engine goes live, so
  "what a valid alert row looks like" is an agreed fact instead of a draft
  nobody signed.

## 4. Acceptance criteria

`docs/BETA_CHECKLIST.md` §E's field-by-field table is the authoritative
data-quality bar for `alerts` rows; the criteria below reference it rather
than duplicate it.

**Coverage & matching**
- [ ] For a real, currently-listed vehicle on Mobile.de or AutoScout24 that
      satisfies an active search's criteria (brand, model, year range,
      mileage range, price range, fuel type) and whose marketplace is
      included in that search's `sources`, the engine produces exactly one
      `alerts` row referencing that `search_id`, within the documented
      refresh interval of the listing being observed.
- [ ] A listing that fails any one of an active search's criteria never
      produces an `alerts` row referencing that search.
- [ ] A listing with no resale-price estimate is never inserted (matches
      `docs/DATA_CONTRACT.md` decision #3).
- [ ] `alerts.platform` is written as the exact string the rest of the app
      already expects (`"Mobile.de"` / `"AutoScout24"` — matching
      `scripts/seed-test-alert.mjs` and `notify-alert`'s usage).
- [ ] A single listing matching two active searches (same or different
      companies) produces two `alerts` rows, one per `search_id`.

**Data-contract compliance**
- [ ] Every inserted row populates every field marked "non-negotiable" in
      `docs/BETA_CHECKLIST.md` §E, in the exact type/unit specified
      (whole-euro integers for `price_original`/`market_price`/
      `transport_est`, cm³ for `cc`, g/km WLTP for `co2`, integer years for
      `age_years`).
- [ ] `fuel_type` is always one of the canonical strings the sign-off in
      `docs/DATA_CONTRACT.md` decision #1 settles on — never a raw,
      unmapped marketplace label.
- [ ] For every plug-in hybrid listing, `flags` includes the literal string
      `'PHEV'` and `co2` is populated with the low WLTP weighted figure;
      `fuel_type` alone is never relied on to signal PHEV status (decisions
      #2 and #4).
- [ ] `user_status`, `created_at`, and `date` are left unset/default by the
      engine, not set explicitly (matches the contract's "leave unset"
      guidance).
- [ ] `docs/DATA_CONTRACT.md`'s four checkboxes are checked and its
      sign-off table is completed by named people before the engine's first
      production write.

**Dedup & lifecycle**
- [ ] Re-observing a still-live listing on a later scan does not create a
      second `alerts` row for the same (listing, `search_id`) pair —
      verifiable by checking `listing_url` (or an equivalent stable listing
      identifier) against `search_id` across all rows and finding no
      duplicates for a listing confirmed live across two consecutive scans.
- [ ] `company_id` resolves correctly on every inserted row, and the row is
      visible only to members of that company. This already works today via
      the existing `alerts_set_company` trigger and RLS; the engine needs no
      new policy, only to keep using the service role and a valid
      `search_id`/`user_id`, the way `scripts/seed-test-alert.mjs` does
      today.

**Go-live gating**
- [ ] The engine's write path is proven first against a non-production
      project or table before ever being pointed at the production
      `public.alerts` table.
- [ ] No process writes engine-sourced rows into the **production**
      `public.alerts` table until both are true: (a) the PHEV/null-CO2 bug
      in `src/lib/isv.js:67` is fixed and covered by a regression test, and
      (b) `public.alerts` has server-side CHECK constraints (or equivalent
      enforcement) covering at minimum `fuel_type`, `cc`, `co2`, price
      fields, and the PHEV/`flags` marker. Verifiable by: the relevant
      `docs/TECH_DEBT.md` lines marked fixed, a passing test for
      `calculateISV` with `co2 = null, isPhev = true`, and the constraints
      visible in the applied migrations.
- [ ] Manual seeding (`npm run seed:alert`) and the automated engine can
      write to the same table without collision for however long they
      overlap (e.g. during the interim-bridge period referenced in
      `docs/DECISIONS.md`).

## 5. Out of scope for v1

- Any marketplace beyond Mobile.de and AutoScout24 — explicitly Hey.car,
  Kleinanzeigen, Marktplaats, Coches.net, despite being referenced in
  `Landing.jsx` / `CreateSearch.jsx` today (see §6, item 4).
- Fixing the PHEV/null-CO2 bug (`src/lib/isv.js:67`) and adding CHECK
  constraints to `public.alerts` — both are prerequisites tracked in
  `docs/TECH_DEBT.md` that gate this feature's production go-live (§4), but
  neither is delivered by this spec.
- WhatsApp delivery of alerts — unrelated to ingestion itself and tracked
  separately in `docs/TECH_DEBT.md`, but relevant because it's the default
  channel new searches get (see §6, item 9).
- Re-alerting when a previously-alerted listing's price or spec changes
  (e.g. a price drop that increases margin after the fact). v1 alerts once
  per (listing, search) and never again for that pair.
- Tracking or flagging that a previously-alerted listing has been sold or
  removed from the marketplace; a dealer may click through to a dead link.
- Historical backfill — the engine only needs to catch listings from the
  point it goes live forward.
- Any change to `admin/AdminOverview.jsx`'s "Fontes" panel or any other
  ingestion-health surface — it's currently fabricated (`docs/TECH_DEBT.md`)
  and making it truthful is separate work.
- Anti-bot tooling procurement (proxy pools, headless-browser
  infrastructure, CAPTCHA solving, etc.) — an implementation decision for
  backend-engineer once §6's legal/rate-limiting questions are answered, not
  specified here.
- A dealer-facing UI for market-price benchmarking or a "why this margin"
  explanation beyond what `AlertHistory.jsx` already renders.
- The interim bridge — what supplies alerts while this engine is being
  built. A separate, still-open decision (`docs/DECISIONS.md`,
  `docs/FOUNDER_QUESTIONS.md`); this spec covers the long-term engine only.

## 6. Risks & open questions for founders

### Blocking — must be resolved before any production write

1. **Sequencing dependency (hard gate).** This engine must not go live
   writing real `alerts` rows in production until both `docs/TECH_DEBT.md`
   items are fixed: the PHEV/null-CO2 ISV bug (`src/lib/isv.js:67` —
   `isPhev && co2 <= 50`, where `null <= 50` evaluates `true` in JS, so a
   PHEV alert with missing CO2 silently gets the full 75% ISV reduction;
   reproduced at ~€4,050 margin overstatement on a representative case) and
   the missing server-side validation on `alerts` (confirmed independently:
   the only CHECK constraint on `alerts` across all 12 migrations is the
   `user_status` lifecycle check in `004_alert_lifecycle.sql` — nothing
   validates `fuel_type`, `cc`, `co2`, prices, or the PHEV/`flags` marker).
   Today only a single trusted developer writes to this table by hand; the
   day an automated engine writes with its own service-role key, both gaps
   become a live risk of confidently-wrong margins shown with no error to a
   dealer. That is the exact trust failure the founder is trying to avoid by
   disclosing the interim manual-curation approach honestly instead of
   quietly faking automation — an ingestion engine that produces the same
   failure by a different route would undercut that same honesty.
   **Recommend:** both fixes ship as small, separate tickets that block this
   feature's production go-live, not as part of this build.

### Needs real legal input — not resolved here

2. **ToS / legal risk of scraping Mobile.de and AutoScout24 directly.** Both
   platforms almost certainly have terms of service governing automated
   access, and there may be EU database-right or contract-law exposure in
   systematically extracting and republishing their listings. I am not
   qualified to assess this and have not attempted to — it needs real legal
   review before, or in parallel with, engineering work, not an engineering
   assumption that it's fine. **Open question for the founders:** who is
   getting legal input on this, and does engineering wait for it or proceed
   in parallel at its own risk?

### Needs a founder/product decision

3. **Refresh cadence vs. anti-bot/legal posture.** Existing copy promises
   listings surface "a cada minuto" / "minutos depois" of publication. A
   cadence tight enough to honor that literally raises the likelihood of
   tripping rate limits, IP bans, or ToS violations (item 2) — the tighter
   the cadence, the sharper that tradeoff. Founders should set (or delegate
   to CTO/backend-engineer) an actual target interval with that tradeoff
   made explicit, and decide whether existing marketing copy needs softening
   in the meantime.
4. **Marketplace scope vs. existing product surfaces.** `Landing.jsx`
   markets four "plataformas vigiadas" (adds Hey.car, Kleinanzeigen);
   `CreateSearch.jsx`'s country selector lets a dealer pick Netherlands or
   Spain, which map to Marktplaats/Coches.net — neither in this spec's
   scope. A dealer can create a search today that this engine will never be
   able to fill. Decide: correct the copy/selector now to match v1 engine
   scope, or accept the gap as a known, time-boxed rough edge until coverage
   widens.
5. **`min_margin` vs. `alert_threshold`.** `searches` stores both
   (`min_margin` default 2500, `alert_threshold` default 3000) but neither
   is read or enforced anywhere in the app today beyond the create/edit
   form — there is no existing definition of which one (or both, combined
   how) should gate whether the engine treats a match as alert-worthy. This
   needs a product decision before matching logic can be built.
6. **Market-price estimation quality.** The engine must produce a
   `market_price` estimate per listing before it can decide alert-worthiness
   at all (§2). A wrong resale estimate produces a confidently-wrong margin
   exactly like the PHEV bug does, just at the input layer instead of the
   calculation layer — it carries the same trust risk as item 1 but isn't
   fixed by fixing item 1. Recommend backend-engineer bring a concrete
   estimation approach back for founder/CTO review before building it,
   rather than this spec prescribing a method (deliberately left as
   implementation detail this spec doesn't own).
7. **Re-alert-on-change is cut for v1 (§5) — confirm that's acceptable.** A
   dealer may reasonably expect to hear about a price drop on a car they
   were already alerted to; v1 won't tell them. Flagging in case that's a
   bigger gap in practice than it looks from an engineering seat.

### Risks to flag, no immediate decision required

8. **Notification amplification at real volume.** Every `alerts` INSERT
   already emails *every active member of the company*, instantly (README
   "Notifications"; `notify-alert`). That's fine at seed-script volume; a
   live engine matching against real inventory could turn this into
   materially more email per dealer per day than anyone has tested. Worth a
   sanity check on volume once the engine is running, before assuming
   today's one-alert-at-a-time delivery model still feels right at scale.
9. **The default alert channel is silently broken.** `docs/TECH_DEBT.md`
   already flags that new searches default to `alert_channels = {
   whatsapp: true, email: false }`, and WhatsApp delivery isn't
   implemented — so a dealer who never touches that toggle gets a
   perfectly-matched alert from a perfectly-working engine and never hears
   about it. This engine working correctly will not, by itself, fix that;
   recommend the default-channel fix ships before or alongside the first
   real ingestion launch, or the launch will look like a dud.
10. **`docs/DATA_CONTRACT.md` sign-off ownership is unclear now that
    ingestion is in-house.** The document is written as an agreement between
    "the Crivo app" and an external "ingestion/scraper team." That framing
    is now stale — both sides are internal. Someone (CTO, or
    backend-engineer plus whoever owns the frontend consumption) needs to
    actually sign both rows of the sign-off table; recommend the CTO name
    the two signers explicitly rather than let the document sit unsigned by
    default the way it has since June.
11. **This spec does not answer what runs in the interim.**
    `docs/DECISIONS.md` and `docs/FOUNDER_QUESTIONS.md` both note an open
    question — what supplies alerts while this engine is being built
    (estimated weeks). That's a separate decision from this spec and
    shouldn't be assumed answered by it.
