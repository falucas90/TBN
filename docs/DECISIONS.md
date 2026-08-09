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

**Status:** In progress — builders dispatched same day. Formal spec skipped
for this bundle (CTO judgment call): the bug fixes are corrections to
already-specified behavior, not new product direction, and acceptance
criteria were well-established from the state-of-product review and the
CPO's own analysis. `docs/specs/` is used for the ingestion engine itself,
which is a real new feature.
