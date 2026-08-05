# Founder Decisions Log

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
