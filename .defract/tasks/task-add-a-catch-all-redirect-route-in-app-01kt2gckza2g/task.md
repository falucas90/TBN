---
defract:
  id: task-add-a-catch-all-redirect-route-in-app-01kt2gckza2g
  type: improvement
  status: active
  stage: implementation
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-add-a-catch-2
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: null
  assignee: null
---



## Story Brief

Promoted from backlog item `bli-add-a-catch-2`.

- Module: src/App.jsx

Original paste from the builder:

> App.jsx defines no fallback route, so navigating to an unknown path renders a blank page. Add a <Route path="*"> that redirects to / to handle this gracefully.

# Add a catch-all redirect route in App.jsx

# Add a catch-all redirect route in App.jsx

## What We're Building

When users navigate to a URL that does not match any known page in the app, they currently see a blank screen. We are adding a fallback route so that any unknown URL automatically redirects the user to the home page, giving them a clean starting point instead of a dead end.

## Expected Outcome

- Navigating to any unknown URL (e.g. `/not-a-real-page`) automatically sends the user to the home page
- The blank-screen experience for unrecognised paths is eliminated
- Existing navigation to known pages continues to work as before

## Phase Outcomes

- **Phase 1: Add catch-all redirect** — Users who land on any unrecognised URL are silently sent to the home page instead of seeing a blank screen.

## Out of Scope

- Custom 404 error pages or "not found" messaging — the redirect silently sends users home
- Backend routing or server-side redirect rules — this change is client-side only
- Changes to any page beyond the routing configuration

## Scope Summary

**Size:** 2 requirements, 3 acceptance criteria, 1 implementation phase
**Key decisions:**
- Reuse the `Navigate` component already imported in `src/App.jsx` — no new dependency needed
- Redirect to `/` rather than `/searches` to keep the route canonical; `/` already maps to the searches page
**Biggest risk:** Route ordering — the catch-all must be the last `<Route>` in the `<Routes>` block so it only matches when nothing else does

## Context

`src/App.jsx` defines the full client-side routing tree using react-router-dom v7. It currently has six named routes (`/login`, `/signup`, `/`, `/searches`, `/searches/new`, `/searches/:id/edit`, `/alerts`, `/settings`) with no fallback. The `Navigate` component is already imported (used in `ProtectedRoute`) so the fix requires adding a single `<Route>` element. The blank-screen bug was noted in the project profile (`App.jsx has no catch-all route; unknown paths render nothing`).

## Requirements

### Routing

- R1: The app must handle any URL not matched by the existing named routes by immediately redirecting the browser to `/`.
- R2: The redirect must use `replace` semantics so the unrecognised URL does not remain in the browser history stack.

## Acceptance Criteria

- [ ] Navigating directly to `/does-not-exist` in a browser redirects to `/` and renders the home page
- [ ] Navigating directly to `/deeply/nested/unknown/path` redirects to `/` and renders the home page
- [ ] All existing routes (`/login`, `/signup`, `/`, `/searches`, `/searches/new`, `/alerts`, `/settings`) continue to render their correct pages without being caught by the catch-all

## Implementation Phases

### Phase 1: Add catch-all redirect
**Scope:** Add a single `<Route path="*">` entry at the end of the routing tree that redirects any unmatched path to `/`.
**Files:**
- `src/App.jsx` — add `<Route path="*" element={<Navigate to="/" replace />} />` as the last child of `<Routes>`
**Verification:**
- Start dev server (`npm run dev`) and navigate to `/anything-fake` — browser lands on `/` showing the Searches page
- Confirm existing routes (`/login`, `/alerts`) still load their respective pages
**Estimated effort:** Small

## Implementation Notes

## Phase 1: Add catch-all redirect

Added `<Route path="*" element={<Navigate to="/" replace />} />` as the final child of `<Routes>` in `src/App.jsx`.

**Changes:**
- `src/App.jsx` — one line added at the end of the `<Routes>` block

**Notes:**
- `Navigate` was already imported (used by `ProtectedRoute`); no new imports needed
- `replace` semantics ensure the unknown path is not left in browser history
- Route ordering is correct: catch-all is last so it only fires when no named route matches
- All pre-existing lint errors (prop-types, unused React imports) are baseline issues unrelated to this change

## Review

## Verdict

**Verdict:** APPROVE
**Files reviewed:** 1 files changed across 1 phases

The single-line addition correctly adds a catch-all route as the last entry in the Routes block, using the already-imported Navigate component with replace semantics. All three acceptance criteria pass and no new issues were introduced.

### Automated Checks

| Check | Result | Details |
|-------|--------|---------|
| Lint | FAIL | 77 pre-existing errors across codebase; zero new errors from this change. App.jsx has one pre-existing prop-types error on line 13 (ProtectedRoute children) that predates this task. |

### Acceptance Criteria (3/3 passed)

- [x] AC-1: Navigating directly to `/does-not-exist` in a browser redirects to `/` and renders the home page — PASS: src/App.jsx:35 — `<Route path="*" element={<Navigate to="/" replace />} />` catches any unmatched path and redirects to `/`. The wildcard `*` covers single-segment unknown paths.
- [x] AC-2: Navigating directly to `/deeply/nested/unknown/path` redirects to `/` and renders the home page — PASS: src/App.jsx:35 — react-router-dom v7 `path="*"` matches any unmatched URL including multi-segment paths. The redirect target `/` renders Searches via the route at line 29.
- [x] AC-3: All existing routes (`/login`, `/signup`, `/`, `/searches`, `/searches/new`, `/alerts`, `/settings`) continue to render their correct pages without being caught by the catch-all — PASS: src/App.jsx:35 — the catch-all is the final child of <Routes> (after all seven named routes on lines 25-34), so react-router matches named routes first and only falls through to the wildcard when no named route matches.

### Code Quality (Refactor Review)

No code quality issues found in changed files.

### Security Assessment (Security Review)

No security issues found in changed files.

### Decisions Made During Implementation

- Redirect target is `/` rather than `/searches` — `/` is the canonical home route already mapped to Searches, keeping the route table stable if the home mapping ever changes.
- Navigate component reused from the existing import (line 1) — no new dependency required.

## Required Changes

None.

