# Crivo ↔ Ingestion — Alerts Data Contract

**Status: DRAFT — awaiting ingestion-team sign-off**
**Version: 1.0 (June 2026)**

This is the agreement between the Crivo app and the ingestion/scraper backend.
The ingestion side writes rows into **`public.alerts`** using the service role
(clients cannot insert). The app computes **ISV and margin in the browser**
from these fields — nothing validates them server-side, so a wrong unit or
label produces wrong numbers silently, with no error.

The margin shown to the dealer is:

```
margin = market_price − (price_original + ISV(cc, co2, fuel_type, age_years, PHEV-flag) + transport_est)
```

The full column-by-column table (types, units, nullability) lives in
[BETA_CHECKLIST.md — section E](BETA_CHECKLIST.md) and is derived directly
from `src/lib/mappers.js`, `src/lib/isv.js` and the migrations. This document
is the **sign-off sheet** for the four decisions that are conventions rather
than enforced constraints.

---

## Decisions requiring explicit agreement

### 1. Canonical `fuel_type` strings

The ISV calculation switches to the diesel CO₂ table **only** when
`fuel_type === 'Diesel'` (exact, case-sensitive). Every other value — or null
— uses the petrol table. There is no CHECK constraint on the column.

**Proposed canonical set** (matches the app's calculator UI):
`'Diesel'` · `'Gasolina'` · `'Híbrido (PHEV)'` · `'Elétrico'`

- [ ] Ingestion will write exactly these strings (agreed set above)
- [ ] OR alternative set: ______________________

### 2. PHEV signal lives in `flags`, not `fuel_type`

The 75% ISV reduction applies only when **both**:
- `flags` (text[]) contains the exact string `'PHEV'`, **and**
- `co2 <= 50`

Writing `fuel_type = 'Híbrido (PHEV)'` alone does **not** trigger the
reduction. For every plug-in hybrid, ingestion must add `'PHEV'` to `flags`.

- [ ] Agreed: ingestion sets `flags @> ['PHEV']` for plug-in hybrids

### 3. `market_price` must be populated for alertable rows

The column is nullable in the schema, but margin = `market_price − cost`; a
null produces a blank/meaningless margin in the UI and a useless email.

- [ ] Agreed: every row ingestion inserts has a non-null `market_price`
      (rows without a resale estimate are not alert-worthy and are not inserted)

### 4. PHEV `co2` is the low WLTP figure

The `co2 <= 50` condition in the PHEV rule assumes the WLTP weighted/electric
figure (typically 10–50 g/km for PHEVs), not a combined/depleted-battery
figure that would exceed 50 and silently void the reduction.

- [ ] Agreed: `co2` for PHEVs is the low WLTP weighted figure, in g/km

---

## Quick reference — non-negotiables already fixed by schema/code

| Field | Must be |
|---|---|
| `user_id` | real `auth.users.id` of the alert owner (drives RLS + realtime + email) |
| `search_id` | set, and pointing at an **active** search with `alert_channels.email = true`, or no email is sent |
| `price_original`, `market_price`, `transport_est` | **whole euros** (integers) |
| `cc` | engine displacement in **cm³** |
| `co2` | **g/km WLTP** |
| `age_years` | integer years since first registration (selects the ISV age discount: 0 → 0% … 7+ → 55%) |
| `user_status` | leave unset (defaults to `'new'`) |
| `created_at` | leave unset (DB sets `now()`; used for ordering and the 24h/7d windows) |

Test the full path end-to-end with `npm run seed:alert`
(see `scripts/seed-test-alert.mjs`).

---

## Sign-off

| Role | Name | Date | OK |
|---|---|---|---|
| Crivo app | | | ☐ |
| Ingestion/data | | | ☐ |

Any change to these fields, units or semantics after sign-off requires a
version bump here and a matching change in `src/lib/mappers.js` /
`src/lib/isv.js`.
