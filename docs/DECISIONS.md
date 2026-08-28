# Founder Decisions Log

## 2026-08-09 — Next cycle: alert triage + mock-data labeling; Dashboard real-data deferred

**Context:** fix-batch-1 (PR #36) shipped 2026-08-05. Two items from the
2026-08-04 triage remained queued pending specs: wiring alert triage, labeling
mocked panels as example data, and replacing Dashboard's hardcoded KPIs with
real data (the largest of the three). Two founder questions had also been
open since 2026-08-04 (`docs/FOUNDER_QUESTIONS.md`).

**Decision:**
- **Ingestion status resolved:** founders confirmed the scraper/ingestion
  system is live — real `alerts` rows are flowing today. This unblocks
  Dashboard real-data work (no longer at risk of aggregating an empty table).
- **Sequencing:** despite ingestion being live, founders chose to ship the two
  small, self-contained items first this cycle, deferring the larger
  Dashboard rewrite:
  1. Wire alert triage (save/dismiss) to the already-shipped
     `updateAlertStatus` service and the dead "Abertos/Descartados" filter on
     `AlertHistory`.
  2. Label mocked panels (Dashboard, AdminBilling, AdminOverview's chart/
     source-health panel) as example data so beta dealers don't mistake
     fixtures for live numbers.
- Real Dashboard data (replacing the 100%-hardcoded KPIs/charts with backend
  aggregation) is queued as the next cycle after this one.
- Pricing (the other open founder question) remains unresolved — not
  blocking engineering work while the product is a free closed beta.

**Next step:** cpo writes a short acceptance-criteria spec
(`docs/specs/fix-batch-2.md`) for items 1–2 above, CTO diagnosis already done
in `docs/PRODUCT_STATE.md`/`docs/TECH_DEBT.md` — same lean-spec pattern as
fix-batch-1 per `docs/EFFICIENCY.md`'s SAFE recommendation.

---

## 2026-08-04 — CTO owns triage of the product/design state findings

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
