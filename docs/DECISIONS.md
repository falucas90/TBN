# Founder Decisions Log

**Merge note (2026-08-09):** the two entries below with the same date come from two independent state-of-product review cycles that ran concurrently on this repo without either side aware of the other — this session's, and a second one that shipped as PR #36/#38 (see `docs/TECH_DEBT.md`'s merge note for the full reconciliation of overlapping findings). Both are kept in full as an accurate record of what each session actually decided; nothing here was re-litigated during the merge.

## 2026-08-04 — Ingestion strategy: build in-house (Option C)

**Decision:** Crivo will build its own in-house scraping/ingestion engine for
European marketplace listings (Mobile.de, AutoScout24, more later), rather
than bridging long-term on manual curation (Option A) or licensing a
third-party listings feed (Option B).

**Options considered** (full writeup: state-of-product report + team
discussion in chat, 2026-08-04):
- **A — Human-curated bridge while building.** Fastest to look alive to beta
  dealers; doesn't scale; not the real product.
- **B — Buy/partner for a listings feed.** Faster and lower engineering risk
  than a scraper. CPO's objection: a bought feed is likely resold to other PT
  dealers/brokers, so the underpriced cars Crivo finds get arbitraged away by
  competitors on the same feed — Crivo's edge depends on the signal being
  exclusive, which a shared feed doesn't guarantee.
- **C — Build in-house.** Full control over coverage and exclusivity; real
  engineering time (estimated weeks) before the first automated alert fires.

**Decided by:** Founder (franciscocgl@gmail.com), 2026-08-04, in chat — "Option
C is the best." The founder's own reasoning was cut off before it fully sent;
recorded here is the strongest argument on the table for C (CPO's exclusivity
point above). Correct this section if that doesn't match the actual reasoning.

**Open follow-up:** what runs in the interim while the in-house engine is
being built (weeks of work) — see chat, 2026-08-04, for the pending question
on the bridge/disclosure fix batch.

**Next step:** cpo to write the ingestion engine spec in `docs/specs/`.

## 2026-08-04 — Interim bridge: disclosed curation + honesty fix batch, starting now

**Decision:** While the in-house ingestion engine is built (estimated weeks,
per `docs/specs/ingestion-engine.md`), Crivo ships a disclosed, human-curated
alert bridge — the team manually enters real listings, clearly labeled to
dealers as curated during the beta rather than automated — instead of holding
the beta or continuing to present alerts as if they were automated. Bundled
into the same cycle, per the CPO's argument that these are the same trust
risk wearing different clothes: fix the silent-zero-alerts default
(`alertChannels` defaulting to WhatsApp-only), the PHEV/null-CO2 ISV bug, and
the undisclosed billing/WhatsApp fabrications (fake plan badge, fake admin
MRR, the incorrect €99/mês Terms clause).

**Decided by:** CTO, delegated by the founder ("evaluate the best option and
start"), 2026-08-04.

**Why:** Holding the beta for weeks with nothing running validates nothing
and delays learning from real dealers. Shipping curated alerts *without*
disclosure repeats the exact mistake already found in the fabricated
billing/WhatsApp UI. Disclosed curation lets the team validate the product
loop (UI, notification pipeline, dealer reaction) now, honestly, while the
real engine is built in parallel — and bundling the fix batch in means the
beta stops overselling on three fronts at once instead of one at a time.

**Status:** Shipped 2026-08-09 (commits `9cc8952`, `fca184b`, `b33bb63`,
`e827d94`) — QA-verified, code-reviewed, tech debt logged for residual items.
Formal spec skipped for the bug-fix portion of this bundle (CTO judgment
call): those were corrections to already-specified behavior, not new product
direction, and acceptance criteria were well-established from the
state-of-product review and the CPO's own analysis. `docs/specs/` is used for
the ingestion engine itself, which is a real new feature.

## 2026-08-04 — CTO owns triage of the product/design state findings (PR #36)

**Context:** `docs/PRODUCT_STATE.md` (cpo) and `docs/design/CURRENT_STATE.md`
(design-lead) flagged 19 gaps between them (PR #36). Founders asked the CTO
to prioritize and drive these rather than deciding sequencing themselves.

**Decision:** CTO triages and executes. Split as follows:

- **Fix now, no spec needed beyond the acceptance criteria below** — these
  are correctness/security bugs against already-documented intended
  behavior, not new product surface:
  1. Promoting a user to admin (`update-role` action) must clear
     `company_id`/`company_role` server-side, so an ex-dealer admin loses
     tenant data access on promotion, not just in the UI.
  2. Dealer routes must redirect authenticated platform admins away (mirrors
     `AdminRoute`'s existing redirect of non-admins), so the above isn't
     just a backend-only fix.
  3. A new search's default notification channel must be one that actually
     delivers (email), not WhatsApp, which isn't implemented.
  4. `AlertHistory.jsx` must apply the same EV ISV exemption
     `IsvCalculator.jsx` already has, so an EV alert isn't taxed on the
     petrol table.
  5. `--color-danger-bg`, `--color-info-bg`, `--color-warn-bg`,
     `--color-warn-text` must be defined in `tokens.css` — `Callout`'s
     `danger` variant is live and currently renders without its background.
  6. `/signup` should redirect to `/login` instead of dead-ending (public
     self-signup is fully replaced by admin invites).
  Routed through `cpo` for a short acceptance-criteria doc (since #1+#2 are
  security-sensitive) then `backend-engineer`/`frontend-engineer`, gated by
  `qa-engineer` and `code-reviewer` as usual.

- **Needs a real spec first (new user-facing surface, not a bug fix)** —
  queued after the fix batch above:
  - Wire alert triage (save/dismiss) to the already-shipped
    `updateAlertStatus` service and the already-present but currently dead
    "Abertos/Descartados" filter on `AlertHistory`.
  - Decide and implement a consistent "dados de exemplo" / "pré-visualização"
    treatment for Dashboard, AdminBilling, and AdminOverview's mocked chart
    and source-health panel, so mocked numbers are never presented as live.
  - Real Dashboard data (replacing the 100%-hardcoded KPIs/charts) — larger,
    needs its own spec and backend aggregation work.

- **Backlog, not urgent** — logged in `docs/TECH_DEBT.md`.

- **Genuine founder questions** (business/ops facts the CTO cannot resolve
  from the repo) — logged in `docs/FOUNDER_QUESTIONS.md`.

**Status:** Items 1–6 shipped in the same commit (`606a8f4`) — independently
QA'd and reviewed per that session's own process.
