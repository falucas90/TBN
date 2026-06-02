---
defract:
  id: task-audit-codebase-for-needed-improvements-01kt545bmfg1
  type: task
  status: active
  stage: release
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-i-want-to-4
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---


## Story Brief

Promoted from backlog item `bli-i-want-to-4`.

- Epic: maintenance
- Labels: audit

Original paste from the builder:

> I want to check for improvements or fixes that are neded

# Audit codebase for needed improvements and fixes

# Audit codebase for needed improvements and fixes

## What We're Building

A systematic review of the autoseek codebase to surface incomplete, broken, or misleading behavior and resolve it so the app reflects a consistent working state. The review targets known stubs and gaps — filters that do nothing, estimates hardcoded instead of computed, missing navigation fallbacks — and any additional issues discovered during a thorough read of the source.

## Expected Outcome

- Alert history filters (brand and margin) actually narrow the displayed list of alerts
- Each alert card shows an ISV estimate computed by the real tax calculator instead of a hardcoded placeholder value
- Navigating to an unknown URL redirects to a sensible fallback page rather than rendering a blank screen
- All identified broken or incomplete behaviors are documented and resolved within this task

## Phase Outcomes

- **Phase 1: Fix all stubbed and inconsistent behaviors** — Alert cards display ISV estimates produced by the real tax calculator; the text search box on the alert history page actually filters results; the Searches dashboard stats reflect the current state of configured searches rather than frozen numbers; and navigation links between Login and Signup use client-side routing so the app behaves correctly as a SPA.

## Out of Scope

- Adding new features or pages not already present in the app
- Backend integration, API work, or replacing mock data with real data sources
- Visual redesign or UX changes unrelated to fixing broken functionality

## Scope Summary

**Size:** 8 requirements, 8 acceptance criteria, 1 implementation phase
**Key decisions:**
- ISV wiring requires adding vehicle spec fields (cc, co2, fuelType, ageYears) to mock alert data because the calculator needs them as inputs
- ISV, totalCost, and marginEst are computed at render time in AlertHistory — the mock data fields for these are replaced by derived values rather than stored
- "Alertas (7d)" stat is left hardcoded because no historical alert data exists in mock-data.js; fixing it is out of scope
**Biggest risk:** The ISV calculator's PHEV exemption only applies when CO2 ≤ 50 g/km — mock vehicle spec values must satisfy this constraint for flagged PHEV alerts to receive the expected discount, otherwise displayed ISV values will be unexpectedly high.

## Context

The project is a fully client-side React SPA with no backend. Three issues were cited in the project profile: unconnected filters in AlertHistory, hardcoded ISV estimates, and a missing catch-all route. A full codebase audit found that the brand/margin filters (`filteredAlerts` derived from filter state, applied to `groupedAlerts`) and the catch-all route (`<Route path="*" element={<Navigate to="/" replace />}`) are already correctly implemented. The outstanding items are: (1) `calculateISV` in `src/lib/isv.js` exists but is never called — alert cards use hardcoded `alert.isvEst` from mock data; (2) the text search input in AlertHistory has no backing state variable and applies no filter; (3) four stat values on the Searches dashboard are hardcoded literals rather than derived from the `searches` state that already updates on toggle/delete; (4) three navigation links in Login and Signup use bare `<a href>` elements that cause full page reloads inside a SPA.

## Requirements

### ISV Calculator Wiring

- R1: Each entry in `mockAlerts` (src/data/mock-data.js) must include `cc` (engine displacement in cc), `co2` (combined CO2 in g/km), `fuelType` ('Petrol' or 'Diesel'), and `ageYears` (integer years since registration) so the calculator has the inputs it needs. Values must be plausible for the listed vehicles.
- R2: `AlertHistory.jsx` must import `calculateISV` from `src/lib/isv.js` and call it per alert at render time, using `flags.includes('PHEV')` for the `isPhev` argument and `false` for `isNonEu` (all sourced vehicles are EU-origin). The `isvPayable` field of the result replaces the direct use of `alert.isvEst`.
- R3: `totalCost` and `marginEst` displayed on each card must be consistently derived: `totalCost = alert.priceOriginal + computedIsv + alert.transportEst` and `marginEst = alert.marketPrice - totalCost`.

### Text Search Filter

- R4: The text search input in `AlertHistory.jsx` must be bound to a state variable. The `filteredAlerts` pipeline must also filter by title match — only alerts whose `carTitle` contains the input string (case-insensitive) are shown, composing with the existing brand and margin filters.

### Dashboard Stats

- R5: The "Matches Hoje" stat on Searches must be computed by summing `matchesToday` across all entries in the `searches` state whose status is 'active', so it updates when searches are paused, resumed, or deleted.
- R6: The "Alta Margem" stat must count active searches with `avgMargin` above €3,000. The "Margem Média" stat must be the average `avgMargin` of active searches, displayed as a formatted currency value, and must render "€0" rather than NaN when no active searches remain.
- R7: The Searches subtitle ("Está a acompanhar N pesquisas em X plataformas") must derive the platform count from the unique set of platform values across all entries in `sources`, not from a hardcoded literal.

### Navigation Links

- R8: The `<a href="/signup">` link in `Login.jsx` and both `<a href="/login">` links in `Signup.jsx` must be replaced with `<Link to="...">` from react-router-dom to prevent full page reloads.

## Acceptance Criteria

- [ ] Each entry in `mockAlerts` has `cc`, `co2`, `fuelType`, and `ageYears` fields; both PHEV-flagged entries have co2 ≤ 50 to qualify for the PHEV exemption
- [ ] AlertHistory imports `calculateISV` and calls it per alert; the ISV values shown differ from the former hardcoded 450 / 600 figures
- [ ] For each alert card, `totalCost` equals `priceOriginal + computedIsv + transportEst` and `marginEst` equals `marketPrice − totalCost`
- [ ] Typing a substring into the AlertHistory text search narrows the visible cards to those whose title matches
- [ ] All three active-search-based stats ("Matches Hoje", "Alta Margem", "Margem Média") update reactively when a search is paused, resumed, or deleted in the Searches page
- [ ] "Margem Média" shows "€0" (not NaN) when all searches are paused or deleted
- [ ] The Searches subtitle platform count is a computed value — it changes if a search with a new platform source were added to mock data
- [ ] No internal navigation link in Login or Signup uses a bare `<a href>` element; all use `<Link to>`

## Implementation Phases

### Phase 1: Fix all stubbed and inconsistent behaviors

**Scope:** Wire the ISV calculator to alert cards using vehicle spec fields added to mock data; connect the text search filter; derive Searches dashboard stats from component state; replace full-reload navigation links with SPA-safe alternatives.

**Files:**
- `src/data/mock-data.js` — add `cc`, `co2`, `fuelType`, `ageYears` to each entry in `mockAlerts`
- `src/pages/AlertHistory.jsx` — import and call `calculateISV`; add text search state; compose all three filters in `filteredAlerts`; derive `totalCost` and `marginEst` from computed ISV
- `src/pages/Searches.jsx` — compute "Matches Hoje", "Alta Margem", "Margem Média" from `searches` state; compute unique platform count for subtitle
- `src/pages/Login.jsx` — replace `<a href="/signup">` with `<Link to="/signup">`
- `src/pages/Signup.jsx` — replace two `<a href="/login">` with `<Link to="/login">`

**Verification:**
- [ ] `calculateISV` is imported in AlertHistory.jsx and called once per alert in the render; no `alert.isvEst` reference remains in the display logic
- [ ] Text search input has a `useState` hook and is applied as a filter in `filteredAlerts`
- [ ] Stat values in Searches.jsx are expressions over `searches` state, not numeric or string literals
- [ ] Login.jsx and Signup.jsx import `Link` from react-router-dom; no `<a href="...">` elements remain for internal routes

**Estimated effort:** Small

## Edge Cases

- All searches deleted or paused: "Margem Média" and "Matches Hoje" must not produce NaN — guard against dividing by zero when computing the average
- Text search combined with brand and margin filters: all three must apply with AND logic so each successive filter narrows the set
- PHEV flag present but CO2 > 50 g/km: the calculator will not apply the PHEV exemption and will return a much higher ISV — mock data values must keep CO2 ≤ 50 to match the PHEV badge shown

## Technical Notes

The `calculateISV` function signature is `calculateISV(cc, co2, fuelType, ageYears, isPhev, isNonEu)` and returns `{ ccComponent, co2Component, subtotal, ageDiscountAmount, isvPayable }`. The implementer should use `isvPayable` as the displayed ISV estimate.

Recommended mock spec values (consistent with the vehicles named in `carTitle`):
- Alert 101 — BMW 320e Touring 2021 (5 years old in 2026): cc=1998, co2=43, fuelType='Petrol', ageYears=5
- Alert 102 — Volvo V60 T6 Recharge 2020 (6 years old): cc=1969, co2=35, fuelType='Petrol', ageYears=6

`isPhev` does not need to be stored in mock data — it can be derived inline as `alert.flags.includes('PHEV')`. `isNonEu` is always `false` for EU-origin marketplace vehicles.

The existing `isvEst`, `totalCost`, and `marginEst` fields in `mockAlerts` remain in the data file for reference but their values are superseded at render time by the computed figures. The "Alertas (7d)" stat (hardcoded "12") has no mock data source and is left as-is — fixing it would require adding historical alert count data to mock-data.js, which is a separate concern.

### Dependencies

None — all changes are self-contained within the existing source files.

## Implementation Notes

## Phase 1: Fix all stubbed and inconsistent behaviors

All five files modified as specified. Build passes cleanly.

### Changes made

**src/data/mock-data.js** — Added `cc`, `co2`, `fuelType`, `ageYears` to both mockAlerts entries. Both PHEV entries have co2 ≤ 50 (43 and 35 respectively), satisfying the PHEV exemption constraint.

**src/pages/AlertHistory.jsx** — Imported `calculateISV`; added `searchText` state; pre-computed ISV and derived fields in an `alertsWithISV` mapping before the filter pipeline (so margin filter uses computed marginEst, not stale mock value); composed text search as a third filter using case-insensitive carTitle match; display uses `isvPayable`, `totalCost`, and `marginEst` from computed values (rounded).

**src/pages/Searches.jsx** — Derived `activeSearches`, `matchesToday`, `highMarginCount`, `avgMarginValue` (guarded against zero-length), and `platformCount` (via Set/flatMap) from `searches` state. All four stat card values now update reactively on toggle/delete.

**src/pages/Login.jsx** — Imported `Link` from react-router-dom; replaced `<a href="/signup">` with `<Link to="/signup">`.

**src/pages/Signup.jsx** — Imported `Link`; replaced both `<a href="/login">` occurrences with `<Link to="/login">`.

### Verification

- ISV computed at runtime: Alert 101 €1069 (was hardcoded €450), Alert 102 €882 (was hardcoded €600)
- No `alert.isvEst` reference remains in display logic
- Text search input bound to state; filter applied in pipeline
- Stat values are expressions over `searches` state
- No bare `<a href>` for internal routes in Login or Signup

## Review

## Verdict

**Verdict:** APPROVE
**Files reviewed:** 5 files changed across 1 phases

All 8 acceptance criteria pass with concrete evidence at the source level. The ISV calculator is correctly wired and produces values that differ from the former hardcoded placeholders (€1,069 vs €450 for the BMW; €882 vs €600 for the Volvo). Text search, derived stats, and SPA navigation links are all correctly implemented.

### Automated Checks

| Check | Result | Details |
|-------|--------|---------|
| Production build | PASS | vite build succeeded, 1774 modules transformed, zero errors |
| Lint | PASS | 77 pre-existing errors (react/prop-types, unused React imports); zero new errors introduced by this task |
| ISV calculator verification | PASS | Alert 101 isvPayable=1069 (≠450), Alert 102 isvPayable=882 (≠600) — confirmed via node ESM execution |

### Acceptance Criteria (8/8 passed)

- [x] AC-1: Each entry in `mockAlerts` has `cc`, `co2`, `fuelType`, and `ageYears` fields; both PHEV-flagged entries have co2 ≤ 50 to qualify for the PHEV exemption — PASS: mock-data.js:41-44 Alert 101 (cc=1998, co2=43, fuelType='Petrol', ageYears=5); mock-data.js:58-62 Alert 102 (cc=1969, co2=35, fuelType='Petrol', ageYears=6). Both PHEV-flagged, both co2 ≤ 50.
- [x] AC-2: AlertHistory imports `calculateISV` and calls it per alert; the ISV values shown differ from the former hardcoded 450 / 600 figures — PASS: AlertHistory.jsx:5 imports calculateISV; AlertHistory.jsx:17 calls it in alertsWithISV.map(). Verified isvPayable values: Alert 101 = €1,069 (≠450), Alert 102 = €882 (≠600).
- [x] AC-3: For each alert card, `totalCost` equals `priceOriginal + computedIsv + transportEst` and `marginEst` equals `marketPrice − totalCost` — PASS: AlertHistory.jsx:18 `const totalCost = alert.priceOriginal + isvPayable + alert.transportEst`; AlertHistory.jsx:19 `const marginEst = alert.marketPrice - totalCost`. Computed values verified: Alert 101 totalCost=28369, marginEst=4631; Alert 102 totalCost=30582, marginEst=3918.
- [x] AC-4: Typing a substring into the AlertHistory text search narrows the visible cards to those whose title matches — PASS: AlertHistory.jsx:14 `const [searchText, setSearchText] = useState('')`; AlertHistory.jsx:50-51 input bound with `value={searchText}` and `onChange={e => setSearchText(e.target.value)}`; AlertHistory.jsx:26 `.filter(a => !searchText || a.carTitle.toLowerCase().includes(searchText.toLowerCase()))` applied in filteredAlerts pipeline.
- [x] AC-5: All three active-search-based stats ("Matches Hoje", "Alta Margem", "Margem Média") update reactively when a search is paused, resumed, or deleted in the Searches page — PASS: Searches.jsx:30-35 — activeSearches, matchesToday, highMarginCount, avgMarginValue all derived from `searches` state; `searches` is updated by toggleSearchStatus (line 14) and deleteSearch (line 25), both calling setSearches.
- [x] AC-6: "Margem Média" shows "€0" (not NaN) when all searches are paused or deleted — PASS: Searches.jsx:33-35 guards against zero-length: `activeSearches.length > 0 ? Math.round(...) : 0`. Displayed as `€${avgMarginValue.toLocaleString()}` at line 58, so yields "€0" when no active searches.
- [x] AC-7: The Searches subtitle platform count is a computed value — it changes if a search with a new platform source were added to mock data — PASS: Searches.jsx:36 `const platformCount = new Set(searches.flatMap(s => s.sources)).size` — derived from searches state via Set/flatMap. Used in subtitle at Searches.jsx:46, not hardcoded.
- [x] AC-8: No internal navigation link in Login or Signup uses a bare `<a href>` element; all use `<Link to>` — PASS: Login.jsx:5 imports Link; Login.jsx:94 uses `<Link to="/signup">`. Signup.jsx:4 imports Link; Signup.jsx:60 `<Link to="/login">` (step 3 button); Signup.jsx:66 `<Link to="/login">` (step 1 return link). Remaining `<a href="#">` elements in Login are external/placeholder links (forgot password, terms, privacy, support), not internal app routes.

### Code Quality (Refactor Review)

No code quality issues found in changed files.

### Security Assessment (Security Review)

No security issues found in changed files.

### Decisions Made During Implementation

- ISV, totalCost, and marginEst are computed at render time in AlertHistory rather than updating mock data fields — avoids mutating the mock data shape beyond adding the required vehicle spec inputs and ensures displayed values automatically reflect spec data changes.
- ISV computation pre-calculated into alertsWithISV array before the filter pipeline so that the margin filter also uses the derived marginEst rather than the stale mock value — consistent filtering and display.
- Two items from the original intent check (brand/margin filters, catch-all route) were already correctly implemented in the codebase; scope was refocused on the four remaining genuine fixes.

## Required Changes

None.

