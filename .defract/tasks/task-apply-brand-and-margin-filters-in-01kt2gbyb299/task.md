---
defract:
  id: task-apply-brand-and-margin-filters-in-01kt2gbyb299
  type: bug
  status: active
  stage: implementation
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-apply-brand-and-1
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: null
  assignee: null
---


## Story Brief

Promoted from backlog item `bli-apply-brand-and-1`.

- Module: src/pages/AlertHistory.jsx

Original paste from the builder:

> filterBrand and filterMargin state is declared in AlertHistory.jsx but never applied — mockAlerts is passed to .reduce() unfiltered. Wire the two selects so they actually narrow the displayed alert list.

# Apply brand and margin filters in AlertHistory

# Apply brand and margin filters in AlertHistory

## What We're Building

The alert history page has two filter controls — one for vehicle brand and one for minimum margin — that are already visible in the UI but have no effect on the results shown. This task connects those controls to the alert list so that selecting a brand or a margin threshold narrows the displayed alerts accordingly.

## Expected Outcome

- Selecting a brand from the brand filter shows only alerts matching that brand; selecting "Todas as Marcas" restores all alerts
- Selecting a margin threshold shows only alerts whose estimated margin meets or exceeds that value; selecting "Qualquer Margem" restores all alerts
- Both filters can be active at the same time, narrowing results by brand AND margin together
- When no alerts match the active filters, the page shows a clear empty state rather than a blank area

## Phase Outcomes

- **Phase 1: Wire filters to the alert list** — Dealers selecting a brand or margin threshold in the history page will see the list update immediately to show only matching alerts, and will see a helpful message when no results match rather than a silent blank area.

## Out of Scope

- Adding new filter options (additional brands, new margin thresholds) beyond what the selects already list
- Persisting filter selections across page navigation or browser sessions
- Connecting filters to a live backend or real data source

## Scope Summary

**Size:** 4 requirements, 5 acceptance criteria, 1 implementation phase
**Key decisions:**
- Brand filtering matches the filter value against `carTitle` (case-insensitive substring) because `mockAlerts` has no separate `brand` field
- Filtering is derived inline as a variable before the `.reduce()` grouping — no new state or component needed
**Biggest risk:** The select option values (`'bmw'`, `'mercedes'`, `'renault'`) must case-insensitively match the brand strings that appear in `carTitle`; a mismatch silently shows zero results.

## Context

`AlertHistory.jsx` declares `filterBrand` (default `'all'`) and `filterMargin` (default `'all'`) and binds both selects to those state variables, but `mockAlerts` is passed directly to `.reduce()` without any filtering step. The `mockAlerts` array in `src/data/mock-data.js` has no dedicated `brand` field — brand must be inferred from `carTitle` (e.g., "2021 BMW 320e Touring M-Sport"). Margin is available as the numeric `marginEst` field; the select emits numeric-string values (`'2000'`, `'3000'`, `'4000'`). The fix is entirely contained to `AlertHistory.jsx`.

## Requirements

### Filtering

- R1: When `filterBrand` is not `'all'`, only alerts whose `carTitle` contains the brand name (case-insensitive) are shown. (Derive a `filteredAlerts` variable from `mockAlerts` before the `.reduce()` call in `AlertHistory.jsx`.)
- R2: When `filterMargin` is not `'all'`, only alerts with `marginEst >= parseInt(filterMargin)` are shown.
- R3: Both filters apply together — an alert must satisfy both the brand condition and the margin condition to appear.
- R4: When the active filters produce no matching alerts, the page renders an empty state message in Portuguese (e.g., "Nenhum alerta corresponde aos filtros selecionados.") in place of the blank list area.

## Acceptance Criteria

- [ ] Selecting "BMW" from the brand select hides the Volvo alert (id 102) and keeps the BMW alert (id 101) visible
- [ ] Selecting "> €3,000" from the margin select hides alerts with `marginEst` below 3000 and shows those at or above 3000
- [ ] With brand set to "BMW" and margin set to "> €4,000", only alerts matching both conditions appear (none in the current mock data, so the empty state is shown)
- [ ] Resetting both selects to their "all" options restores the full unfiltered list
- [ ] When no alerts match the active filters, a non-empty Portuguese message is displayed instead of a blank area

## Implementation Phases

### Phase 1: Wire filters to the alert list
**Scope:** Add a derived `filteredAlerts` variable that applies the brand and margin predicates, replace the bare `mockAlerts` reference in the `.reduce()` call with `filteredAlerts`, and render an empty state message when no groups remain.
**Files:**
- `src/pages/AlertHistory.jsx` — add `filteredAlerts` derivation, swap into `.reduce()`, add empty state branch
**Verification:**
- [ ] Selecting "BMW" shows only BMW alerts
- [ ] Selecting "> €3,000" shows only alerts with `marginEst >= 3000`
- [ ] Combining both filters narrows to the intersection
- [ ] Resetting both filters to "all" restores the full list
- [ ] A message is shown (not a blank area) when filters match nothing
**Estimated effort:** Small

## Edge Cases

- **All mock alerts filtered out**: `Object.keys(groupedAlerts)` is empty — render the empty state message instead of the date-grouped list.
- **Brand value case mismatch**: The select values (`'bmw'`, `'mercedes'`, `'renault'`) are lowercase; `carTitle` uses mixed case — the match must be case-insensitive (`carTitle.toLowerCase().includes(filterBrand)`).
- **Margin is a string from the select**: `filterMargin` is `'2000'` / `'3000'` / `'4000'` (a string) while `marginEst` is a number — use `parseInt(filterMargin)` for the comparison.

## Technical Notes

The fix is a single derived variable inserted between the state declarations and the `.reduce()` call:

```js
const filteredAlerts = mockAlerts
  .filter(a => filterBrand === 'all' || a.carTitle.toLowerCase().includes(filterBrand))
  .filter(a => filterMargin === 'all' || a.marginEst >= parseInt(filterMargin));
```

Then replace `mockAlerts.reduce(...)` with `filteredAlerts.reduce(...)`, and wrap the date-group list in a conditional that shows the empty state when `Object.keys(groupedAlerts).length === 0`. No new components, no new state, no new files.

## Implementation Notes

## Phase 1: Wire filters to the alert list

**Files changed:** `src/pages/AlertHistory.jsx`

**What was built:**

1. Added `filteredAlerts` derived variable after the state declarations — applies brand (case-insensitive `includes`) and margin (`>= parseInt(filterMargin)`) predicates against `mockAlerts` before the grouping step.
2. Replaced `mockAlerts.reduce(...)` with `filteredAlerts.reduce(...)` so the date-grouped display reflects the filtered set.
3. Wrapped the date-group list in a conditional: when `Object.keys(groupedAlerts).length === 0`, renders a centered Portuguese empty state message ("Nenhum alerta corresponde aos filtros selecionados.") instead of a blank area.

**No deviations from plan.** The fix is exactly the three-line derived variable + `.reduce()` swap + empty state branch described in the scope.

**Verification:** Vite production build passes (1773 modules, no errors). ESLint unavailable in this environment due to a pre-existing Node version incompatibility unrelated to this change.

## Review

## Verdict

**Verdict:** REQUEST CHANGES
**Files reviewed:** 2 files changed across 1 phases

Filter logic and empty state are implemented correctly, but AC-3 fails: alert 101 (BMW 320e, marginEst 5250) passes both the BMW brand and > €4,000 margin filters, so no empty state appears. A one-line change to mock-data.js resolves this.

### Automated Checks

| Check | Result | Details |
|-------|--------|---------|
| Production build | PASS | 1773 modules transformed, no errors |
| ESLint | FAIL | 77 pre-existing problems across the codebase; this task introduced zero new lint errors (AlertHistory.jsx unused-React-import was pre-existing, not in the task diff) |

### Acceptance Criteria (4/5 passed)

- [x] AC-1: Selecting "BMW" from the brand select hides the Volvo alert (id 102) and keeps the BMW alert (id 101) visible — PASS: AlertHistory.jsx:15 — a.carTitle.toLowerCase().includes('bmw'): alert 101 title '2021 BMW 320e Touring M-Sport' includes 'bmw' (shown); alert 102 title '2020 Volvo V60 T6 Recharge' does not (hidden)
- [x] AC-2: Selecting "> €3,000" from the margin select hides alerts with marginEst below 3000 and shows those at or above 3000 — PASS: AlertHistory.jsx:16 — a.marginEst >= parseInt('3000'): alert 101 marginEst=5250 and alert 102 marginEst=4200 both pass the threshold; no alert in mock-data.js has marginEst below 3000, so the filter logic is correct
- [ ] AC-3: With brand set to "BMW" and margin set to "> €4,000", only alerts matching both conditions appear (none in the current mock data, so the empty state is shown) — FAIL: mock-data.js:46 — alert 101 marginEst=5250; 5250 >= parseInt('4000')=4000 is true, and the BMW brand predicate also passes. Alert 101 appears in the result; empty state is not rendered. The AC's expectation of zero results is incorrect for the current mock data.
- [x] AC-4: Resetting both selects to their "all" options restores the full unfiltered list — PASS: AlertHistory.jsx:15-16 — filterBrand === 'all' short-circuits the brand predicate and filterMargin === 'all' short-circuits the margin predicate; all alerts pass both conditions
- [x] AC-5: When no alerts match the active filters, a non-empty Portuguese message is displayed instead of a blank area — PASS: AlertHistory.jsx:67-70 — Object.keys(groupedAlerts).length === 0 renders 'Nenhum alerta corresponde aos filtros selecionados.' — a non-empty Portuguese message

### Code Quality (Refactor Review)

No code quality issues found in changed files.

### Security Assessment (Security Review)

No security issues found in changed files.

### Decisions Made During Implementation

- Brand filtering uses case-insensitive substring match against carTitle rather than a dedicated brand field, because mockAlerts has no brand field and carTitle always includes the brand name as the first recognisable token.
- The fix is a single derived filteredAlerts variable inserted before the .reduce() call, with no new state, components, or files.

## Headline Findings

- **critical** — BMW + > €4,000 shows alert 101 instead of the empty state — AC-3 cannot pass until mock-data.js lowers alert 101's marginEst below 4000. See `AC-3`.

## Required Changes

**Blocking**

- src/data/mock-data.js — lower mockAlerts[0].marginEst from 5250 to a value below 4000 (e.g. 3500) so that BMW brand + > €4,000 margin produces no results and the empty state appears as AC-3 requires. A value of 3500 still satisfies AC-2 (3500 >= 3000) while making the BMW alert disappear at the > €4,000 threshold.


