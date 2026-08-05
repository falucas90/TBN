# Questions for Founders

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
2. **What should Crivo actually charge, and when?** No billing code exists
   anywhere, but `legal/Terms.jsx`, Settings, and `AdminBilling.jsx`
   currently show three different numbers (€99/mo, €49/mo, and a
   €39/€89/€189 mock tier list). The CTO is removing the contradictory
   *false* claims now (the app is free during closed beta, so nothing
   should claim otherwise) — but the actual pricing plan for when billing
   ships is a product/business call, not a code fix.
