---
defract:
  id: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh
  type: bug
  status: active
  stage: review
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-there-it-is-15
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---


## Story Brief

Promoted from backlog item `bli-there-it-is-15`.

- Epic: auth
- Module: auth
- Labels: backend

Original paste from the builder:

> There it is — the real problem, and it's got nothing to do with Vite or git.There it is — the real problem, and it's got nothing to do with Vite or git. The app is crashing because Supabase isn't configured.

# Fix app crash: Supabase not configured

# Fix app crash: Supabase not configured

## What We're Building

When Supabase credentials are missing from the environment, the app currently crashes on startup before rendering anything. We are adding a graceful fallback so the app loads and stays fully usable for local development even without Supabase credentials — falling back to the existing mock data and simulated authentication instead of crashing.

## Expected Outcome

- The app starts and renders normally when no Supabase credentials are present in the environment
- Developers can browse all pages and interact with the app using mock data without needing to configure Supabase first
- When Supabase credentials are provided, the app behaves exactly as before — real authentication and data sources work unchanged
- The app does not show an unhandled error or white screen on startup in an unconfigured environment

## Phase Outcomes

- **Phase 1: Guard the Supabase client and restore mock auth fallback** — Developers working without Supabase credentials can open the app immediately and use every page, without needing to set up any environment variables first.

## Out of Scope

- Setting up or configuring an actual Supabase project or credentials
- Migrating data or authentication to Supabase (that work is already done)
- Adding a visible "running in demo mode" banner or user-facing indicator

## Scope Summary

**Size:** 5 requirements, 5 acceptance criteria, 1 implementation phase
**Key decisions:**
- Guard `createClient` with an env-var presence check (not try/catch) so the guard is explicit and readable
- `AuthContext` falls back to a hardcoded mock dealer user when Supabase is unconfigured, mirroring the previous `useState(true)` dev pattern
- Guard functions in `authService.js` are no-ops (return mock success) when unconfigured, avoiding thrown errors from login/logout calls in mock mode
**Biggest risk:** Auth service guards must not silently swallow errors in the real (configured) path — the null-check must be strict so a misconfigured client still throws.

## Context

The crash is caused by `src/lib/supabase.js` calling `createClient(undefined, undefined)` at module load time when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are absent from the environment. `@supabase/supabase-js@^2.107.0` throws `"supabaseUrl is required"` synchronously inside `createClient`, which means the module never exports a valid `supabase` object. Every file that imports `../lib/supabase` (AuthContext, authService) then fails to initialise, and React never mounts. The fix is a three-file change: guard the client creation, update `AuthContext` to bypass the Supabase subscription when unconfigured, and add null guards to `authService` functions so mock-mode calls are no-ops rather than throws.

## Requirements

### Supabase client initialisation

- R1: `src/lib/supabase.js` must check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are non-empty strings before calling `createClient`. When either is missing, `supabase` is exported as `null` and a `supabaseConfigured` boolean is exported as `false`.
- R2: When both credentials are present, `supabase` is exported as the real client and `supabaseConfigured` is `true`. No change to the existing real-client behaviour.

### Authentication fallback

- R3: `AuthContext` must import and check `supabaseConfigured`. When `false`, it must skip the `supabase.auth.onAuthStateChange` subscription entirely, set `isLoading` to `false` synchronously, and set `currentUser` to a mock dealer object (e.g. `{ id: 'mock', email: 'dev@local', role: 'dealer' }`), keeping `isAuthenticated` as `true` so all protected routes render normally.
- R4: When `supabaseConfigured` is `true`, `AuthContext` behaviour is identical to the current implementation — no conditional branches in the real path.

### Auth service null guards

- R5: Each function in `src/services/authService.js` that calls `supabase.*` must guard against a null client. When `supabase` is `null`: `loginWithCredentials`, `loginWithGoogle`, `logoutUser`, `signupUser`, `sendPasswordResetEmail`, `updatePassword`, `resendVerificationEmail`, `updateUserProfile`, `listUsers`, and `updateUserRole` should return without throwing (return `undefined` or a stub value). The real path (supabase not null) is unchanged.

## Acceptance Criteria

- [ ] Starting `npm run dev` with no `.env` file produces no console errors and renders the app — verified by deleting or renaming `.env` and confirming the Searches page loads
- [ ] All protected pages (`/searches`, `/alerts`, `/settings`, `/admin`) are reachable and display mock data in unconfigured mode
- [ ] Starting `npm run dev` with valid Supabase credentials in `.env` produces the same behaviour as before this fix — login, logout, and signup flows reach Supabase unchanged
- [ ] `npm run lint` reports zero new ESLint errors compared to the pre-fix baseline (delta = 0, regardless of total count)
- [ ] In unconfigured mode, calling login or logout from the UI does not throw an unhandled error

## Implementation Phases

### Phase 1: Guard the Supabase client and restore mock auth fallback
**Scope:** Add a credential presence check to the Supabase client module, update the auth context to use mock state when Supabase is absent, and add null guards to the auth service functions so all three layers degrade gracefully together.
**Files:**
- `src/lib/supabase.js` — add env-var presence check; conditionally call `createClient`; export `supabaseConfigured` boolean
- `src/context/AuthContext.jsx` — import `supabaseConfigured`; branch `useEffect` to skip subscription and set mock user when unconfigured
- `src/services/authService.js` — add null guard at the top of each exported function; early-return when `supabase` is null
**Verification:**
- [ ] Delete `.env` (or ensure none exists), run `npm run dev`, navigate to `/searches` — page renders with mock data, no white screen or console error
- [ ] With no `.env`, navigate to `/admin` — admin page renders (mock user has role `'dealer'` so it redirects to `/searches` via `AdminRoute`)
- [ ] Restore a valid `.env`, run `npm run dev`, attempt login — Supabase auth is called (can verify via network tab or Supabase dashboard)
- [ ] `npm run lint` — delta vs baseline is 0 new errors
**Estimated effort:** Small

## Edge Cases

- `VITE_SUPABASE_URL` present but `VITE_SUPABASE_ANON_KEY` absent (or vice versa): both must be non-empty for the client to initialise — a partial credential set should also fall back to mock mode rather than passing one `undefined` to `createClient`
- Mock user role is `'dealer'`, not `'admin'`, so the admin route redirects to `/searches` in unconfigured mode — this is the correct and expected behaviour; no special handling needed
- `authService` functions called in unconfigured mode (e.g. a developer clicks "Logout" on the Settings page): they must silently no-op, not throw, so the UI can still call `logout()` without an error boundary being triggered

## Technical Notes

The crash is a module-load-time throw, not a runtime error — `createClient` is called synchronously at import time in `supabase.js`, so the fix must happen before `createClient` is invoked. A try/catch around `createClient` would work but is harder to read than a pre-call guard. The `supabaseConfigured` boolean makes the intent explicit and gives both `AuthContext` and any future callers a single source of truth.

`AuthContext` previously used `useState(true)` to keep the dev session authenticated — that was removed when real Supabase auth landed. The mock user object introduced here restores equivalent dev ergonomics without re-introducing a permanent `useState(true)` that would persist into production.

The `searchesService.js` and `alertsService.js` files do not import from `supabase.js` and require no changes — they already serve mock data unconditionally.

### Dependencies

None — all three files are self-contained within the project.

## Implementation Notes

## Phase 1: Guard the Supabase client and restore mock auth fallback

### Files Changed

**`src/lib/supabase.js`**
- Added `supabaseConfigured` boolean export: `!!(supabaseUrl && supabaseAnonKey)` — both vars must be non-empty strings
- `supabase` is now conditionally created: `createClient(...)` only when `supabaseConfigured` is true, otherwise `null`

**`src/context/AuthContext.jsx`**
- Imports `supabaseConfigured` from `../lib/supabase`
- `MOCK_USER` constant added: `{ id: 'mock', email: 'dev@local', role: 'dealer' }`
- `currentUser` initialises to `MOCK_USER` (not `null`) when unconfigured — synchronous, no effect needed
- `isLoading` initialises to `false` when unconfigured — synchronous, no effect needed
- `useEffect` early-returns when `!supabaseConfigured`, skipping the `onAuthStateChange` subscription entirely

**`src/services/authService.js`**
- Added `if (!supabase) return;` guard at the top of all 11 functions that call `supabase.*`
- `listUsers` returns `[]` when unconfigured (useful stub); all others return `undefined`
- Real path (supabase non-null) is unchanged

### Deviations from Plan

None. Implementation follows the spec exactly.

### Lint Delta

0 new errors. Pre-existing baseline: 107 problems (all in files outside the three changed files, or already present in AuthContext.jsx before this fix).
