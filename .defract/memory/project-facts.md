# Project Facts

## Tech Stack


## Conventions

- [01KTMPRVRQ2XD7XT7XDAPV1240] **Use `undefined` (not `[]`) as the initial state value for async-loaded lists ...** -- Use `undefined` (not `[]`) as the initial state value for async-loaded lists to prevent a one-frame empty-state flash. When a component loads data via `useEffect` → async service call, initialise state with `useState(undefined)` and add an early `if (items === undefined) return null` guard before the render. In Searches.jsx this pattern was applied correctly; AlertHistory.jsx was flagged in review for using `useState([])`, which can briefly show the "no alerts" empty-state message before `getAlerts()` resolves.

**Why:** The Promise microtask resolves after the first paint, so `useState([])` causes the empty-state branch to render for exactly one frame — visible as a flash on slower machines or in dev mode.

**How to apply:** Whenever a page or component fetches its list data asynchronously on mount, default to the `undefined` sentinel. Add a single early-return `null` (not a spinner) since mock-backed services resolve immediately — only add a loading indicator when the service may take >200ms. [source: task-replace-mock-data-with-real-data-sources-01kt54r89hd3, importance: 0.6]
- [01KT5586RHEPFFB3TR5PX9V2J0] **When extending mock data to provide inputs to a calculator, add only the raw ...** -- When extending mock data to provide inputs to a calculator, add only the raw input fields the calculator needs — do not update derived/computed output fields. For autoseek's mockAlerts, the ISV wiring required adding `cc`, `co2`, `fuelType`, and `ageYears` to each entry; the existing `isvEst`, `totalCost`, and `marginEst` fields were left in place but are superseded at render time by computed values.

**Why:** Updating derived fields in mock data creates a sync hazard — the mock values would need to be kept in sync with the calculator manually. Raw inputs are stable; computed outputs belong at render time.

**How to apply:** Before adding computed result fields to mock data, ask whether they can instead be derived at render time from the raw inputs. If yes, add only the inputs. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.6]
- [01KT54YF6HG67XZYK1A3E4ESFE] **Use 'warn' toast type for semi-destructive or permanent actions (pause, delete), not 'error'** -- ToastContext maps 'warn' to `var(--color-warn-bg)` / `var(--color-warn-text)`. The convention in this project is: 'warn' signals something permanent happened without implying failure, while 'error' is reserved for actual failures. Both the existing toggleSearchStatus (pause) and the new deleteSearch use `addToast('...', 'warn')`. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]

## Patterns

- [01KT5580FDAJDZKV08132H82YM] **When a component has both a derived value (computed from a calculator or func...** -- When a component has both a derived value (computed from a calculator or function) and a filter pipeline, pre-compute the derived values into a mapped array before the filter steps. In AlertHistory.jsx, `alertsWithISV` is computed first (mapping each alert to include `isvPayable`, `totalCost`, `marginEst`), and then the brand, margin, and text search filters all run over that enriched array. This ensures filter predicates use the computed values rather than stale mock data fields, keeping display and filter logic consistent.

**Why:** If ISV were computed only at display time (inside the card render), the margin filter would still be operating on the mock alert's stale `marginEst` field — an alert could pass the "> €3,000" filter while displaying a lower computed margin.

**How to apply:** Whenever you add a calculator or derived value to a list component that also has filters: first map the raw items to enriched items with computed fields, then pipe those through all filter steps, then render. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.6]

