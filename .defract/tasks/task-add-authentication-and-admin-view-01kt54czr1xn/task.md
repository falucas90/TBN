---
defract:
  id: task-add-authentication-and-admin-view-01kt54czr1xn
  type: task
  status: active
  stage: implementation
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-built-auth-and-5
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---


## Story Brief

Promoted from backlog item `bli-built-auth-and-5`.

- Epic: auth
- Module: auth
- Labels: admin

Original paste from the builder:

> Built AUTH and admin view

# Add authentication and admin view

# Add Authentication and Admin View

## What We're Building

The app currently skips the login screen entirely — every visitor lands directly on the dashboard as if already signed in. This task makes authentication real: users must log in with valid credentials before accessing the app, and a distinct admin role unlocks a new admin panel where platform-wide activity and user accounts can be monitored.

## Expected Outcome

- Visiting the app while logged out redirects to the login screen instead of showing the dashboard
- Entering valid credentials logs the user in and lands them on the dashboard
- Entering invalid credentials shows an error message on the login screen without navigating away
- Logging out returns the user to the login screen and blocks re-entry without credentials
- Admin users see an additional "Admin" section in the navigation sidebar
- The admin panel shows a list of registered dealer accounts with their status and plan

## Phase Outcomes

- **Phase 1: Credential login, logout enforcement, and admin panel** — Users are required to sign in with a recognised email and password to access the app. Admin accounts additionally gain access to a dedicated panel listing all dealer accounts with their status and plan.

## Out of Scope

- Real backend or API integration — credentials and user data remain mocked in the frontend
- Password reset, email verification, or account self-service flows
- Role management UI — admin status is assigned in mock data, not configurable via the UI

## Scope Summary

**Size:** 8 requirements, 8 acceptance criteria, 1 implementation phase
**Key decisions:**
- Auth state starts unauthenticated; mock credentials gate access instead of bypassing it
- Admin role stored as a boolean flag on mock user objects; no RBAC complexity
- Admin panel is a protected route that redirects non-admin users to the dashboard
**Biggest risk:** Login form currently ignores field values entirely — wiring up credential validation requires restructuring the submit handler to read controlled inputs and compare against mock data.

## Context

`AuthContext.jsx` currently initialises `isAuthenticated` to `true`, causing every visitor to land on the dashboard without going through login. The `login()` function sets the flag to `true` unconditionally, with no credential check. The login form at `src/pages/Login.jsx` uses uncontrolled inputs and calls `login()` directly on submit. `mockUser` in `src/data/mock-data.js` has no `role` field and no password. The sidebar at `src/components/layout/Sidebar.jsx` has a static `navItems` array with no role-awareness. A `ProtectedRoute` component already exists in `App.jsx` and redirects unauthenticated users to `/login` — this guard just needs the context to start correctly.

## Requirements

### Authentication

- R1: The auth context must initialise `isAuthenticated` to `false` so that unauthenticated visitors are redirected to `/login` on first load.
- R2: `AuthContext` must expose the currently signed-in user object (name, email, role) alongside `isAuthenticated`, `login`, and `logout`. The `login` function must accept email and password, validate them against mock credentials, and return `true` on success or `false` on failure. On success it must also set the current user object.
- R3: Mock user data must include at least two accounts: one standard dealer user and one admin user, each with an email and a plaintext mock password field. The existing `mockUser` in `mock-data.js` can be extended or replaced with a `mockUsers` array.

### Login Form

- R4: The login form must use controlled inputs so that the email and password values are available to the submit handler.
- R5: On submit, the form must call the `login` function from `AuthContext` with the entered email and password. If `login` returns `false`, an inline error message must appear below the form fields (e.g., "Credenciais inválidas"). If `login` returns `true`, the user is navigated to `/searches`.
- R6: The error message must clear when the user edits either field after a failed attempt.

### Admin Role and Panel

- R7: The sidebar must conditionally render an "Admin" nav item (linking to `/admin`) only when the signed-in user has `role === 'admin'`. Non-admin users must not see this item.
- R8: A new Admin page at `src/pages/Admin.jsx` must display a list of all mock dealer accounts showing each account's name, email, current plan, and status (active/inactive). The route `/admin` must be protected — unauthenticated users redirect to `/login`, and authenticated non-admin users redirect to `/searches`.

## Acceptance Criteria

- [ ] Loading the app with no session redirects to `/login` (the dashboard is not visible)
- [ ] Submitting the login form with an unrecognised email/password shows an error message on the page without navigating away
- [ ] Submitting the login form with valid mock credentials navigates to `/searches` and shows the authenticated dashboard
- [ ] Clicking "Sair" in the sidebar signs the user out and redirects to `/login`; navigating to `/searches` directly afterwards redirects back to `/login`
- [ ] Signing in as the standard dealer user: the sidebar shows Pesquisas, Alertas, Definições — no Admin item visible
- [ ] Signing in as the admin user: the sidebar shows Pesquisas, Alertas, Definições, and Admin
- [ ] Navigating to `/admin` as the admin user shows a list of mock dealer accounts with name, email, plan, and status columns
- [ ] Navigating to `/admin` as a non-admin authenticated user redirects to `/searches`

## Implementation Phases

### Phase 1: Credential login, logout enforcement, and admin panel
**Scope:** Wire credential validation into the auth context and login form, add role-aware mock users, add an Admin nav item for admin accounts, and create the Admin panel page. All protected route guards are already in place and require no changes.
**Files:**
- `src/context/AuthContext.jsx` — start unauthenticated, add `currentUser`, make `login(email, password)` validate against mock data
- `src/data/mock-data.js` — replace `mockUser` with `mockUsers` array; add `password`, `role`, `status`, and `plan` fields
- `src/pages/Login.jsx` — convert to controlled inputs, call `login(email, password)`, show inline error on failure
- `src/components/layout/Sidebar.jsx` — read `currentUser` from auth context, conditionally render Admin nav item
- `src/pages/Admin.jsx` — new page listing all mock users in a table-style layout following existing page patterns
- `src/App.jsx` — import and register `/admin` route; add an `AdminRoute` guard that checks `currentUser.role === 'admin'`
**Verification:**
- [ ] Start the dev server (`npm run dev`) and confirm the root path redirects to `/login`
- [ ] Log in with invalid credentials and confirm the error message renders
- [ ] Log in as the dealer user and confirm the Admin nav item is absent
- [ ] Log in as the admin user, navigate to `/admin`, and confirm the dealer list renders
- [ ] As a logged-in non-admin user, navigate to `/admin` directly and confirm redirect to `/searches`
- [ ] Click "Sair" and confirm redirect to `/login`; attempting `/searches` redirects back to `/login`
**Estimated effort:** Medium

## Edge Cases

- **Settings page still references `mockUser` directly**: `src/pages/Settings.jsx` likely imports `mockUser` from `mock-data.js`. After renaming to `mockUsers`, it should fall back to `currentUser` from auth context or read `mockUsers[0]` — check the import and update accordingly.
- **Login form "show/hide password" span**: currently a non-functional span. Leave it as-is; toggling visibility is out of scope.
- **Google sign-in button**: already a no-op; no changes needed.
- **AuthContext consumers that spread `mockUser`**: grep for `mockUser` imports in pages before renaming to ensure no silent breakage.

## Technical Notes

All credential comparisons are plaintext string matches against mock data — this is intentional and acceptable for a mocked frontend with no backend. Do not introduce any hashing or crypto.

The `ProtectedRoute` component in `App.jsx` already covers unauthenticated redirects. The new `AdminRoute` should follow the same pattern: check `isAuthenticated` first (redirect to `/login`), then check `currentUser?.role === 'admin'` (redirect to `/searches`).

The `mockUsers` array should include the existing `mockUser` data (Francisco Lucas, FL Motors) as the standard dealer account. Add a second entry as the admin — e.g., `admin@crivo.pt` with role `'admin'`.

For the Admin page layout, follow the existing page structure used in `AlertHistory.jsx` (padded container, heading, content area). A simple list or card-per-user layout using existing `Card` component from `src/components/ui/` is sufficient.

The `Settings.jsx` page likely reads `mockUser` directly from `mock-data.js`. After the mock data refactor, update it to read from `currentUser` via `useAuth()` instead — this is the correct long-term pattern.
