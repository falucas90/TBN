# Questions for Founders

## From the 2026-08-04 product/design state audit (PR #36)

These are business/ops facts outside this repo, or real pricing decisions —
not something the CTO can resolve from the code, unlike the rest of the
findings.

1. ~~Does the external marketplace-monitoring system exist and run anywhere
   today?~~ **Resolved 2026-08-09:** yes, it's live — real `alerts` rows are
   flowing today. `docs/DATA_CONTRACT.md` sign-off is still separately
   outstanding (see that doc), but the pipeline itself is fed. See
   `docs/DECISIONS.md` 2026-08-09.
2. **What should Crivo actually charge, and when?** No billing code exists
   anywhere, but `legal/Terms.jsx`, Settings, and `AdminBilling.jsx`
   currently show three different numbers (€99/mo, €49/mo, and a
   €39/€89/€189 mock tier list). The CTO is removing the contradictory
   *false* claims now (the app is free during closed beta, so nothing
   should claim otherwise) — but the actual pricing plan for when billing
   ships is a product/business call, not a code fix.
