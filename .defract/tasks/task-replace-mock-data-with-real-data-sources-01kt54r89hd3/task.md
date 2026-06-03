---
defract:
  id: task-replace-mock-data-with-real-data-sources-01kt54r89hd3
  type: task
  status: active
  stage: review
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-prep-to-coneect-6
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---


## Story Brief

Promoted from backlog item `bli-prep-to-coneect-6`.

- Epic: data
- Labels: mock-data

Original paste from the builder:

> Prep to coneect to real data not fake

# Replace Mock Data with Real Data Sources

# Replace Mock Data with Real Data Sources

## What We're Building

All live data in the app — saved searches, vehicle alerts, and user profile — currently comes from a hardcoded file with placeholder values. This task replaces that with a proper data layer connected to real sources, so dealers see their actual saved searches and live alert history rather than fictional sample data.

**Open question for the builder:** What are the real data sources? Options include (a) a backend API you control, (b) a third-party service like Supabase or Firebase, or (c) direct calls to the marketplace APIs (Mobile.de, AutoScout24). The implementation phases depend on this choice.

## Expected Outcome

- Dealers who log in see their own saved searches, not placeholder BMW/Renault entries.
- The alert history shows real vehicle matches sourced from the configured marketplaces.
- User profile data (name, company, plan) reflects the authenticated dealer's actual account.
- Adding or pausing a search persists across page reloads and browser sessions.
- The app is ready to receive live marketplace data without further structural changes.

## Phase Outcomes

- **Phase 1: Introduce a service layer that isolates all data access** — Components no longer reach directly into the mock data file; instead, they call named service functions. This structural change means connecting a real backend later requires editing only the service functions, not the pages or authentication logic. The app continues to work exactly as before, now with the seam in the right place.

## Out of Scope

- Integrating directly with Mobile.de or AutoScout24 marketplace APIs (that is a separate backend task).
- Authentication overhaul — the login flow is addressed in a parallel task; this task only wires up the data layer.
- Building a new admin or dealer management interface.
- Implementing a real backend, database, or hosted API — the service functions will be structured to accept real implementations, but the actual backend is deferred until the real data source is decided.

## Scope Summary

**Size:** 7 requirements, 6 acceptance criteria, 1 implementation phase
**Key decisions:**
- Introduce a `src/services/` layer as the canonical seam between components and data sources
- Service functions are async from day one so that swapping in real `fetch`/Supabase calls requires no signature changes
- Keep mock data in `src/data/mock-data.js` intact as the backing store — services wrap it, not replace it
**Biggest risk:** The builder has not yet decided on the real backend (REST API vs. Supabase vs. other); the service layer design must stay generic enough that neither choice requires revisiting component code.

## Context

The app currently has three consumers of mock data: `AuthContext.jsx` imports `mockUsers` for login credential checks; `Searches.jsx` imports `mockSearches` as its initial state; and `AlertHistory.jsx` imports `mockAlerts` directly for the enriched-alert computation. All three import from `src/data/mock-data.js` by path, meaning any future swap to a real backend requires editing every consuming file. The fix is a `src/services/` directory whose exported async functions are the only files that know about data sources — components import from services, never from mock-data directly.

## Requirements

### Service Layer

- R1: A `src/services/searchesService.js` module must export `getSearches()`, `createSearch(data)`, `updateSearch(id, patch)`, and `deleteSearch(id)` — all returning Promises. The current implementation resolves immediately from `mockSearches`.
- R2: A `src/services/alertsService.js` module must export `getAlerts()` returning a Promise that resolves to the mock alerts array.
- R3: A `src/services/authService.js` module must export `loginWithCredentials(email, password)` returning a Promise that resolves to the matched user object or `null`. It reads from `mockUsers` internally.

### Consumer Updates

- R4: `AuthContext.jsx` must call `authService.loginWithCredentials()` instead of importing and querying `mockUsers` directly.
- R5: `Searches.jsx` must initialise its search list by calling `searchesService.getSearches()` on mount. Delete and toggle-status actions must call the corresponding service functions.
- R6: `AlertHistory.jsx` must load its alert list by calling `alertsService.getAlerts()` on mount rather than importing `mockAlerts` directly. The ISV enrichment step runs over the resolved data as it does today.
- R7: No page may import from `src/data/mock-data.js` after this change — only service modules may do so.

## Acceptance Criteria

- [ ] `src/services/searchesService.js`, `src/services/alertsService.js`, and `src/services/authService.js` all exist and export the functions listed in R1–R3.
- [ ] No `import` statement referencing `src/data/mock-data.js` (or `../data/mock-data`) remains in any file under `src/pages/` or `src/context/`.
- [ ] Logging in with `francisco@flmotors.pt` / `dealer123` succeeds and populates `currentUser` as before.
- [ ] The Searches page renders both mock searches on load; pausing/deleting a search still works correctly.
- [ ] The Alert History page renders both mock alerts with computed ISV values identical to the current display.
- [ ] `npm run lint` passes with no new errors.

## Implementation Phases

### Phase 1: Introduce service abstraction layer
**Scope:** Create the three service modules and update the three consumers so that no page or context imports mock data directly. App behaviour is unchanged — the service functions resolve mock data as before.
**Files:**
- `src/services/searchesService.js` — new file
- `src/services/alertsService.js` — new file
- `src/services/authService.js` — new file
- `src/context/AuthContext.jsx` — replace `mockUsers` import with `authService.loginWithCredentials()`
- `src/pages/Searches.jsx` — replace `mockSearches` import with `searchesService.getSearches()` on mount; wire delete and toggle to service calls
- `src/pages/AlertHistory.jsx` — replace `mockAlerts` import with `alertsService.getAlerts()` on mount
**Verification:**
- [ ] No direct `mock-data` imports in `src/pages/` or `src/context/` — confirmed by `grep -r "mock-data" src/pages src/context`
- [ ] Login flow works end-to-end in browser
- [ ] Searches page renders and all action buttons (pause, resume, delete) function correctly
- [ ] Alert History renders with correct ISV-computed values
- [ ] `npm run lint` clean
**Estimated effort:** Small

## Edge Cases

- **Concurrent service calls on mount**: `Searches.jsx` currently initialises from a synchronous import. Switching to async `getSearches()` means there is a brief moment before data loads. The service resolves immediately (mock data), so no loading state is needed — but the initial `useState([])` must not flash an empty list before the promise resolves (use an `undefined` sentinel or initialise in the effect).
- **Settings page**: `Settings.jsx` reads `currentUser` via `useAuth()`, which comes from `AuthContext`. It has no direct mock-data import and requires no changes.
- **CreateSearch page**: does not import mock data at all — no changes needed.

## Technical Notes

The key design constraint is that service function signatures must be stable regardless of whether the eventual backend is a REST API or Supabase. Async functions that accept plain objects and return plain data objects satisfy both. Do not introduce any Supabase client, Axios instance, or `fetch` wrappers in this phase — the service bodies stay as thin wrappers around the mock arrays.

When the real backend is chosen, the only files that change are the three service modules; every component and context stays identical.

**Open question:** The builder has not confirmed the target backend (REST API, Supabase, Firebase, or other). The service layer created here is intentionally backend-agnostic. A follow-up task should be scoped once that decision is made, covering: replacing the mock-array bodies with real network calls, adding loading and error states to consuming components, and persisting search mutations server-side.

### Dependencies

The parallel authentication task (`task-add-authentication-and-admin-view`) may update `AuthContext.jsx` independently. Coordinate to avoid merge conflicts on that file — this task only changes the data-access line (`mockUsers` import → `authService` call); the auth task owns the broader authentication logic.

## Implementation Notes

## Phase 1: Introduce service abstraction layer

**Status:** Complete

**Files created:**
- `src/services/authService.js` — exports `loginWithCredentials(email, password)` and `getUsers()`, both returning Promises backed by mockUsers
- `src/services/searchesService.js` — exports `getSearches()`, `createSearch(data)`, `updateSearch(id, patch)`, `deleteSearch(id)`, all async, backed by a module-level copy of mockSearches
- `src/services/alertsService.js` — exports `getAlerts()` returning a Promise backed by mockAlerts

**Files modified:**
- `src/context/AuthContext.jsx` — was already updated (prior session); uses `loginWithCredentials()` from authService
- `src/pages/Searches.jsx` — replaced `mockSearches` static import with `useEffect` → `getSearches()`; `toggleSearchStatus` calls `updateSearch`; `deleteSearch` calls service's `deleteSearch`; uses `undefined` sentinel to avoid empty-list flash
- `src/pages/AlertHistory.jsx` — replaced `mockAlerts` import with `useEffect` → `getAlerts()`; ISV enrichment runs over resolved data as before
- `src/pages/Admin.jsx` — was not in the phase plan but had a direct `mockUsers` import (R7 violation); updated to call `getUsers()` from authService

**Deviations from plan:**
- Added `getUsers()` to authService and updated Admin.jsx — not listed in phase Files but required by acceptance criterion R7 ("no page may import from mock-data"). Fix was minimal (one export, one import swap).

**Verification:**
- `grep -r "mock-data" src/pages src/context` returns empty — R7 satisfied
- Lint count unchanged at 79 problems (all pre-existing, none introduced)
- App behaviour unchanged: service functions resolve mock data synchronously via Promise microtask
