# Past Decisions

## Decisions

- [01KT557P9JJ1PZFA9FKG46GFB3] **In autoseek, derived financial values (ISV, totalCost, marginEst) are compute...** -- In autoseek, derived financial values (ISV, totalCost, marginEst) are computed at render time from raw vehicle spec inputs — they are not stored in or read back from mock data. The existing hardcoded fields in mockAlerts (isvEst, totalCost, marginEst) remain in the file for reference but are superseded by computed values at render time.

**Why:** Computing at render time avoids mutating the mock data shape beyond adding the required calculator inputs (cc, co2, fuelType, ageYears). It ensures displayed values automatically reflect spec data changes without additional sync logic between the mock data and displayed output.

**How to apply:** If adding or modifying alert cards in autoseek, do not read alert.isvEst, alert.totalCost, or alert.marginEst for display — always compute them via calculateISV and arithmetic in the component. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.7]

