# Project Facts

## Tech Stack


## Conventions

- [01KTMPRVRQ2XD7XT7XDAPV1240] **Use `undefined` (not `[]`) as the initial state value for async-loaded lists ...** -- Use `undefined` (not `[]`) as the initial state value for async-loaded lists to prevent a one-frame empty-state flash. When a component loads data via `useEffect` → async service call, initialise state with `useState(undefined)` and add an early `if (items === undefined) return null` guard before the render. In Searches.jsx this pattern was applied correctly; AlertHistory.jsx was flagged in review for using `useState([])`, which can briefly show the "no alerts" empty-state message before `getAlerts()` resolves.

**Why:** The Promise microtask resolves after the first paint, so `useState([])` causes the empty-state branch to render for exactly one frame — visible as a flash on slower machines or in dev mode.

**How to apply:** Whenever a page or component fetches its list data asynchronously on mount, default to the `undefined` sentinel. Add a single early-return `null` (not a spinner) since mock-backed services resolve immediately — only add a loading indicator when the service may take >200ms. [source: task-replace-mock-data-with-real-data-sources-01kt54r89hd3, importance: 0.6]
- [01KTMSDHJX73QRM5HCM4CBY6NY] **Module-load-time crashes (synchronous throws at import) must be fixed at the ...** -- Module-load-time crashes (synchronous throws at import) must be fixed at the module level — not at consumer try/catch. When a library (e.g. `createClient`) throws synchronously during module initialization, every file that imports that module fails to load, and React never mounts. A try/catch in a consumer component cannot help because the module itself never finishes initializing.

The fix belongs in the module that calls the throwing function: guard the call with a pre-condition check (`if (!url || !key) return null`) so the module always exports a valid (possibly null) value.

**Why:** `@supabase/supabase-js` v2 throws `"supabaseUrl is required"` synchronously inside `createClient` when called with `undefined`. This happens at import time in `supabase.js`, not at render time, so no React error boundary or try/catch in consuming components can intercept it.

**How to apply:** When diagnosing a white-screen crash on startup, check whether any module-level code (outside functions/effects) calls a function that may throw. Fix the throw at its source by guarding the call, not by wrapping imports in try/catch. [source: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh, importance: 0.6]. [source: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh, importance: 0.6]
- [01KT5586RHEPFFB3TR5PX9V2J0] **When extending mock data to provide inputs to a calculator, add only the raw ...** -- When extending mock data to provide inputs to a calculator, add only the raw input fields the calculator needs — do not update derived/computed output fields. For autoseek's mockAlerts, the ISV wiring required adding `cc`, `co2`, `fuelType`, and `ageYears` to each entry; the existing `isvEst`, `totalCost`, and `marginEst` fields were left in place but are superseded at render time by computed values.

**Why:** Updating derived fields in mock data creates a sync hazard — the mock values would need to be kept in sync with the calculator manually. Raw inputs are stable; computed outputs belong at render time.

**How to apply:** Before adding computed result fields to mock data, ask whether they can instead be derived at render time from the raw inputs. If yes, add only the inputs. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.6]
- [01KT54YF6HG67XZYK1A3E4ESFE] **Use 'warn' toast type for semi-destructive or permanent actions (pause, delete), not 'error'** -- ToastContext maps 'warn' to `var(--color-warn-bg)` / `var(--color-warn-text)`. The convention in this project is: 'warn' signals something permanent happened without implying failure, while 'error' is reserved for actual failures. Both the existing toggleSearchStatus (pause) and the new deleteSearch use `addToast('...', 'warn')`. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]
- [01KTMQG0C0XM8WE7YRMGNQHMW4] **This project has 107 pre-existing ESLint errors that exist across the codebas...** -- This project has 107 pre-existing ESLint errors that exist across the codebase before any new work. These are not introduced by any specific task and are not blockers. The correct success criterion for lint checks is **0 new errors** — not 0 total errors.

The errors are spread across multiple files; one known pre-existing warning is an unused-var on `Login.jsx` line 1 (a React import artefact).

**Why:** Review agents and CI checks that see "107 errors" without this context may incorrectly flag the lint step as failed or attribute the errors to the current change.

**How to apply:** When running or reporting lint results in this project, capture the error count before and after. Report PASS if delta = 0, regardless of total count. Do not attempt to fix pre-existing errors unless the task explicitly scopes that work. [source: task-fix-login-page-layout-email-and-01ktht16jwgh, importance: 0.6]

## Patterns

- [01KTMSD7WHZV7AAT5QAE6Y90TD] **When an optional backend service (Supabase, REST API, etc** -- When an optional backend service (Supabase, REST API, etc.) may be absent from the environment, apply three-layer graceful degradation:

1. **Client module** — export `null` client + `configured` boolean when env vars absent; real client when present.
2. **Context layer** — import the boolean; when `false`, skip subscriptions/effects entirely and synchronously initialize state with mock values. When `true`, normal flow runs unchanged.
3. **Service layer** — add `if (!client) return;` null guard at the top of every function that calls the service. Stub return values where callers expect a type (e.g. `return []` for list functions); `return undefined` (implicit) for mutations.

The three layers must all degrade together — fixing only the client module still crashes if the context tries to subscribe through a null client.

**Why:** The Supabase crash was a module-load-time throw that prevented React from mounting. Fixing supabase.js alone wasn't enough; AuthContext tried to call `supabase.auth.onAuthStateChange` on the null export, and authService functions would have thrown on null method calls.

**How to apply:** When adding any optional external client to autoseek, apply all three layers in the same PR. Verify by running the app with no credentials configured. [source: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh, importance: 0.65]. [source: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh, importance: 0.6]
- [01KT5580FDAJDZKV08132H82YM] **When a component has both a derived value (computed from a calculator or func...** -- When a component has both a derived value (computed from a calculator or function) and a filter pipeline, pre-compute the derived values into a mapped array before the filter steps. In AlertHistory.jsx, `alertsWithISV` is computed first (mapping each alert to include `isvPayable`, `totalCost`, `marginEst`), and then the brand, margin, and text search filters all run over that enriched array. This ensures filter predicates use the computed values rather than stale mock data fields, keeping display and filter logic consistent.

**Why:** If ISV were computed only at display time (inside the card render), the margin filter would still be operating on the mock alert's stale `marginEst` field — an alert could pass the "> €3,000" filter while displaying a lower computed margin.

**How to apply:** Whenever you add a calculator or derived value to a list component that also has filters: first map the raw items to enriched items with computed fields, then pipe those through all filter steps, then render. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.6]

