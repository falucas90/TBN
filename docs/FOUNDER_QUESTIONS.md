# Questions for Founders

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
