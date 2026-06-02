---
defract:
  id: task-wire-up-real-auth-backend-self-service-01kt54r3w2d4
  type: task
  status: active
  stage: design
  phase: 0
  total_phases: 3
  priority: normal
  source: backlog
  source_id: bli-real-backend-or-7
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---


## Story Brief

Promoted from backlog item `bli-real-backend-or-7`.

- Epic: auth
- Module: auth
- Labels: mock-data, admin, self-service

Original paste from the builder:

> Real backend or API integration — credentials and user data remain mocked in the frontend
> Password reset, email verification, or account self-service flows
> Role management UI — admin status is assigned in mock data, not configurable via the UI

# Wire up real auth backend, self-service flows, and role management

# Wire up real auth backend, self-service flows, and role management

## What We're Building

Replacing the fully mocked authentication layer with a real backend integration so that user credentials, sessions, and account data are persisted and verified server-side. Alongside the backend wire-up, the app gains self-service account flows — password reset and email verification — and an admin interface for managing user roles, removing the need to hard-code admin status in frontend data files.

## Expected Outcome

- Users can register and log in with real credentials that are verified by a backend
- Authenticated sessions persist correctly across page refreshes and browser restarts
- Users can request a password reset and complete it via an emailed link without contacting an admin
- New accounts require email verification before gaining full access
- Admins can view and change user roles directly in the application settings, without editing source files

## Phase Outcomes

- **Phase 1: Core authentication wire-up** — Users can log in and sign up with real credentials stored in an auth provider. Sessions survive page refreshes, so users are not asked to log in again after closing and reopening their browser.
- **Phase 2: Self-service account flows** — Users who forget their password can reset it independently via email, and newly registered accounts are required to verify their email address before gaining access to the app.
- **Phase 3: Admin role management and cleanup** — Administrators can view all registered users with live data from the auth provider, and can change a user's role or active status directly from the admin panel without touching source files. The mock user array is removed from the codebase entirely.

## Out of Scope

- Building a backend service from scratch — this task integrates a third-party auth provider (e.g. Supabase, Firebase Auth), not a custom server
- New dealer-facing features unrelated to authentication (search creation, alert history, ISV calculator)
- Multi-factor authentication or advanced security hardening beyond basic self-service flows
- Migrating mock searches and alerts to a real database — that is a separate task

## Scope Summary

**Size:** 14 requirements, 12 acceptance criteria, 3 implementation phases
**Key decisions:**
- Auth provider choice (Supabase recommended; Firebase Auth and Auth0 are viable alternatives) — must be confirmed before architecture begins
- Role storage: user metadata on the auth provider vs. a separate user profile record
- Session persistence strategy: provider-managed (recommended) vs. manual token handling
**Biggest risk:** Auth provider choice gates the entire implementation — changing providers mid-build requires rewiring all SDK calls across every phase.

## Context

Authentication is currently fully mocked: `src/context/AuthContext.jsx` checks credentials against `mockUsers` in `src/data/mock-data.js` and holds session state only in React memory, which is lost on every page refresh. `src/pages/Login.jsx` and `src/pages/Signup.jsx` have complete UI but submit nothing to a real service. `src/pages/Admin.jsx` reads from `mockUsers` directly and has no user management actions. `src/App.jsx` already defines `ProtectedRoute` and `AdminRoute` guards that work correctly from the auth context — only the data layer beneath them needs replacing. A third-party BaaS auth provider supplies all required primitives (JWT sessions, email/password, OAuth, email verification, password reset) without requiring a custom backend server.

## Requirements

### Authentication Core

- R1: The app connects to a real auth provider via its JavaScript SDK. `src/context/AuthContext.jsx` exposes `login`, `logout`, `signup`, `currentUser`, `isAuthenticated`, and `isLoading` backed by live provider calls rather than the mock user array.
- R2: On login, the auth provider issues a session token that is persisted by the SDK. The user remains logged in across page refreshes and browser restarts until they explicitly log out or the token expires.
- R3: `src/pages/Login.jsx` submits email and password to the auth provider and surfaces provider error messages in Portuguese. The "Continuar com o Google" button triggers the provider's OAuth flow.
- R4: `src/pages/Signup.jsx` submits the registration form to the auth provider and creates a real account. On success, the user is redirected to a verification-pending page and cannot access protected routes until email verification is confirmed.
- R5: `AuthContext` exposes the current user's role so that `AdminRoute` in `src/App.jsx` can gate the `/admin` route based on the live role value rather than mock data.

### Self-Service Flows

- R6: The "Esqueceu-se da palavra-passe?" link in `src/pages/Login.jsx` navigates to a forgot-password page at `/forgot-password` where the user enters their email and receives a password-reset link by email.
- R7: Following the reset link opens a reset-password page at `/reset-password` where the user sets a new password. The provider validates the token in the URL before allowing the update; an expired or invalid token shows a Portuguese error with a link back to the forgot-password page.
- R8: After signup, unverified users land on a verification-pending page at `/verify-email` that explains they must confirm their email before proceeding. A resend-link button is provided.
- R9: `src/App.jsx` adds routes for `/forgot-password`, `/reset-password`, and `/verify-email`, all publicly accessible without an auth guard.

### Admin Role Management

- R10: `src/pages/Admin.jsx` fetches the live user list from the auth provider (or a user profile table) instead of from `mockUsers`. The table shows Name, Email, Plan, Status, and Role columns.
- R11: Each row in the admin user table includes a role selector (Dealer / Admin) and a status toggle (Active / Inactive). Saving calls the provider's admin API to update user metadata, and a success toast confirms the change.
- R12: The `/admin` route remains accessible only to users whose role is `admin` — `AdminRoute` in `src/App.jsx` enforces this using the live role from the auth provider.

### Settings and Profile

- R13: The "Guardar Alterações" button in `src/pages/Settings.jsx` writes the updated name and phone number to the auth provider's user profile. The success toast appears only after the save is confirmed by the provider.
- R14: `mockUsers` is removed from `src/data/mock-data.js` and is not imported anywhere in the production source tree once Phase 3 is complete. `mockSearches` and `mockAlerts` are unaffected.

## Acceptance Criteria

- [ ] Logging in with a valid email and password creates a real session; the user reaches `/searches` and remains logged in after a full page refresh.
- [ ] Logging in with incorrect credentials shows a Portuguese error message without a page reload.
- [ ] Logging out clears the session; navigating directly to `/searches` redirects to `/login`.
- [ ] Registering a new account redirects the user to `/verify-email`; the account cannot access protected routes until verification is confirmed.
- [ ] Submitting the forgot-password form with a registered email triggers a reset email and shows a Portuguese confirmation message.
- [ ] Visiting `/reset-password` with a valid token allows the user to set a new password; an invalid or expired token shows a Portuguese error with a back link.
- [ ] After login, refreshing the page keeps the user logged in (session persists via the provider SDK).
- [ ] An admin user sees the live user list on `/admin`, not the mock array.
- [ ] A non-admin user attempting to visit `/admin` is redirected to `/searches`.
- [ ] An admin can change a dealer's role to Admin in the admin panel; the change is reflected on the affected user's next login.
- [ ] Saving profile changes in Settings writes the updated values to the auth provider; the success toast appears only after a confirmed save.
- [ ] `mockUsers` is not imported anywhere in the production source tree after Phase 3 is complete.

## Implementation Phases

### Phase 1: Core auth wire-up
**Scope:** Integrate the auth provider SDK, rewrite `AuthContext` to use live credentials and provider-managed sessions, wire `Login.jsx` and `Signup.jsx` to real API calls, and add an `isLoading` state so route guards wait for session resolution before redirecting.
**Estimated effort:** Large

### Phase 2: Self-service flows
**Scope:** Add the forgot-password, reset-password, and verify-email pages and wire them to the auth provider's built-in email flows. Update `Login.jsx` to link to the forgot-password page and register the three new public routes in `App.jsx`.
**Estimated effort:** Medium

### Phase 3: Admin role management and cleanup
**Scope:** Rewrite `Admin.jsx` to fetch live user data and support role and status editing via the provider's admin API. Make profile saves in `Settings.jsx` real. Remove `mockUsers` from `mock-data.js` and confirm it is no longer referenced anywhere.
**Estimated effort:** Medium

## Edge Cases

- Provider SDK not loaded at boot (network failure): `AuthContext` must expose `isLoading: true` until session resolution completes so that route guards render a loading state rather than a premature redirect to `/login`.
- Password reset token expired or already used: the reset-password page must catch the provider's validation error and display a clear Portuguese message with a link back to `/forgot-password`.
- Login attempted before email verification: the provider may issue a session but mark it unverified; handle consistently in `AuthContext` by treating unverified sessions as redirecting to `/verify-email`.
- Admin demotes their own account: allow the action but show a Portuguese warning that they will lose admin access on next login.
- Concurrent admin saves: last write wins; no optimistic locking is required at this stage.

## Technical Notes

**Auth provider choice (decision required before architecture):** Supabase is the recommended option — its JavaScript SDK (`@supabase/supabase-js`) covers email/password auth, Google OAuth, email verification, password reset, and a user management Admin API in a single package. Role data can be stored in `user_metadata` (simple, no extra table) or in a dedicated `profiles` table in Supabase Postgres (more scalable). Firebase Auth and Auth0 are viable alternatives. The architecture stage must confirm the provider choice and role-storage approach before Phase 1 begins.

**Session persistence:** Supabase persists the JWT in `localStorage` by default and handles token refresh automatically — no manual token management is needed. Equivalent behaviour is available in Firebase Auth and Auth0.

**AuthContext loading state:** `isLoading` must be added to the context value. `ProtectedRoute` and `AdminRoute` in `src/App.jsx` should render `null` (or a spinner) while `isLoading` is true to prevent a flash-redirect before the provider resolves the session.

**Role storage note:** The two roles used today are `dealer` and `admin`. Whichever storage strategy is chosen in architecture, the Admin API call to update a role must not be callable from the client directly by non-admin users — Supabase's `service_role` key (server-side only) or Row Level Security policies must guard the mutation.

**mockUsers cleanup scope:** Only `mockUsers` is removed in R14. `mockSearches` and `mockAlerts` remain in `src/data/mock-data.js` untouched; they serve unrelated features.

**Existing conventions to follow:** JSX (not TSX); default exports for page components; Context API for cross-cutting state; Portuguese copy throughout. New pages in `src/pages/` follow the existing two-pane or centered-card layout already used by `Login.jsx` and `Signup.jsx`.

### Dependencies

- Auth provider SDK must be chosen and installed before Phase 1 can begin (e.g., `npm install @supabase/supabase-js`).
- Phase 2 depends on Phase 1 — the auth provider connection must exist before email flows can be tested.
- Phase 3 depends on Phase 1 — live user data requires the same auth provider session and admin credentials.
