# Questions for Founders

**Merge note (2026-08-09):** the two sections below come from two independent
review cycles that ran concurrently on this repo — see `docs/TECH_DEBT.md`'s
merge note for the full reconciliation.

## 2026-08-04 — Ingestion strategy (resolved — see docs/DECISIONS.md)

State-of-the-product review found that the marketplace-monitoring engine — the
core of Crivo's pitch ("monitors European car marketplaces... fires
margin-based alerts") — does not exist in this repo in any form. Every
`alerts` row to date has come from a manual run of
`scripts/seed-test-alert.mjs`. `docs/DATA_CONTRACT.md` is an unsigned draft
written for an "ingestion/scraper team" that has no code footprint.

**Decision needed:** how does real listing data start flowing into `alerts`,
and on what timeline? Options and my recommendation are in the state-of-product
report delivered in chat on 2026-08-04.

**Resolved 2026-08-04:** founder chose Option C (build in-house). See
`docs/DECISIONS.md` for the full entry.

**Interim question also resolved 2026-08-04:** founder delegated the call
("evaluate the best option and start"); CTO decided disclosed curation +
honesty fix batch, ship now. See `docs/DECISIONS.md`, same date, second
entry. No further founder input needed — team is executing.

## From the 2026-08-04 product/design state audit (PR #36)

These are business/ops facts outside this repo, or real pricing decisions —
not something the CTO can resolve from the code, unlike the rest of the
findings.

1. **Does the external marketplace-monitoring system (the thing that
   actually scrapes Mobile.de/AutoScout24 and inserts `alerts` rows) exist
   and run anywhere today?** There is no scraper/matcher code in this repo —
   every alert arrives via an external system's service-role insert, and the
   data contract it's supposed to honor (`docs/DATA_CONTRACT.md`) is still
   an unsigned draft. If that system isn't running yet, the entire product
   is currently unfed regardless of any UI/UX fix.
   **Substantially answered 2026-08-04** by the Option C decision above: no
   such system exists or runs anywhere — Crivo is building its own, in
   house, estimated weeks out (`docs/specs/ingestion-engine.md`). In the
   meantime the product runs on disclosed manual curation, not automation.
2. **What should Crivo actually charge, and when?** No billing code exists
   anywhere, but `legal/Terms.jsx`, Settings, and `AdminBilling.jsx`
   currently show three different numbers (€99/mo, €49/mo, and a
   €39/€89/€189 mock tier list). The CTO is removing the contradictory
   *false* claims now (the app is free during closed beta, so nothing
   should claim otherwise) — but the actual pricing plan for when billing
   ships is a product/business call, not a code fix.
   **Still fully open as of 2026-08-09** — the false claims are fixed (all
   three surfaces now say "free during beta"), but no pricing plan has been
   decided. Not blocking anything today since there's no billing code to
   wire a number into yet.
