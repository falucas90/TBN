---
defract:
  id: task-wire-up-real-auth-backend-self-service-01kt54r3w2d4
  type: task
  status: active
  stage: implementation
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

## Design

## UX Description

**Problem:** Users who forget their password, register a new account, or need admin-managed roles have no working self-service paths — everything either throws silently or reads from hardcoded data.

**What the user experiences:**
A dealer who forgets their password taps a link on the login screen, enters their email, and receives a reset link by email — all without contacting support. New registrants land on a holding page that explains they must confirm their email before entering the app. Admins can open a live user table and change roles or toggle account status from a dropdown and toggle in each row.

**Information hierarchy:**
The three self-service pages (forgot-password, reset-password, verify-email) are stripped-down centered cards — no sidebar, no app chrome — matching the Login and Signup pattern already in place. Each card shows only what is needed for that step: a single field, a single primary action, and a status message. The Admin table gains two new columns (Funcao, Acoes) at the right of the existing four, keeping the read-only columns (Nome, Email, Plano, Estado) first so they stay visible on narrow viewports before the interactive columns scroll into view. The loading shimmer on route guards is invisible unless the auth provider takes more than ~300ms to resolve — normal users will never see it.

**User flows:**

**Forgot password:**
1. User clicks "Esqueceu-se da palavra-passe?" on Login -> navigates to /forgot-password
2. User types email and clicks "Enviar link" -> spinner on button; button disabled
3. Provider sends reset email -> page shows green confirmation banner; email field cleared; no redirect
4. User clicks "Voltar ao login" -> returns to /login

**Reset password (valid token):**
1. User clicks link in email -> browser opens /reset-password?token=...
2. Page shows two password fields; user fills them and clicks "Redefinir palavra-passe"
3. Provider validates token, updates password -> success banner; link to /login shown
4. User clicks link -> /login

**Reset password (expired/invalid token):**
1. User opens /reset-password with bad token -> page loads with error callout; no password fields shown
2. Callout shows Portuguese message and "Pedir novo link" button
3. User clicks -> navigates to /forgot-password

**Email verification:**
1. After signup -> user lands on /verify-email
2. Page shows mailbox icon, email address, and "Reenviar email" button
3. User clicks "Reenviar email" -> button shows spinner, then success inline message
4. User verifies in email client -> navigates back to /login (or provider auto-redirects to /searches)

**Admin role management:**
1. Admin opens /admin -> table shows live user list with Role dropdown and Status toggle per row
2. Admin selects new role from dropdown -> "Guardar" button in that row activates (not yet saved)
3. Admin clicks "Guardar" -> spinner; provider API call; success toast; button resets
4. Admin self-demotes -> warning toast: "Vai perder acesso de administrador no proximo inicio de sessao"
5. Admin toggles status -> immediate save (no confirm); success toast

**States and edge cases:**
- Forgot-password empty state: "Enviar link" button is disabled until email field has a value
- Forgot-password unregistered email: provider returns success regardless (security); same confirmation shown
- Reset-password token expired: error callout shown immediately on mount; no password fields rendered
- Reset-password passwords mismatch: inline error below confirm field; submit stays disabled
- Verify-email resend rate-limit: "Reenviar email" button disabled for 60s after each click; countdown shown
- Admin empty state: table shows "Nenhum utilizador encontrado" row
- Admin loading: skeleton rows (3 placeholder rows) while fetch is in flight
- Admin save error: error toast with provider error message in Portuguese
- Route guard loading: full-screen white with centered spinner; shown only if auth resolution exceeds ~300ms
- Admin self-demotion: allowed; warning toast informs them of next-login effect

## ASCII Wireframes

**Forgot Password page (/forgot-password):**
```
+-----------------------------------------------------------+
|                                                           |
|          +-------------------------------------+          |
|          |  CRIVO                              |          |
|          |                                     |          |
|          |  Recuperar palavra-passe            |          |
|          |  ---------------------------------  |          |
|          |  Introduza o seu email e            |          |
|          |  enviaremos um link de              |          |
|          |  recuperacao.                       |          |
|          |                                     |          |
|          |  Email                              |          |
|          |  +---------------------------------+|          |
|          |  | stand@exemplo.pt               ||          |
|          |  +---------------------------------+|          |
|          |                                     |          |
|          |  +---------------------------------+|          |
|          |  |        Enviar link             ||          |
|          |  +---------------------------------+|          |
|          |  (disabled until email entered)     |          |
|          |                                     |          |
|          |  <- Voltar ao login                 |          |
|          +-------------------------------------+          |
|                                                           |
|  After submit — success state:                            |
|          +-------------------------------------+          |
|          | [check] Email enviado               |          |
|          | Verifique a sua caixa de entrada.   |          |
|          +-------------------------------------+          |
|                                                           |
+-----------------------------------------------------------+
```

Single centered card on plain page background, same visual weight as the Login right pane. The success state replaces the form in-place so the user has a clear endpoint without a page navigation.

**Reset Password page (/reset-password) — valid token:**
```
+-----------------------------------------------------------+
|                                                           |
|          +-------------------------------------+          |
|          |  CRIVO                              |          |
|          |                                     |          |
|          |  Definir nova palavra-passe         |          |
|          |                                     |          |
|          |  Nova palavra-passe                 |          |
|          |  +---------------------------------+|          |
|          |  | ........                       ||          |
|          |  +---------------------------------+|          |
|          |                                     |          |
|          |  Confirmar palavra-passe            |          |
|          |  +---------------------------------+|          |
|          |  | ........                       ||          |
|          |  +---------------------------------+|          |
|          |  [!] As palavras-passe nao         |          |
|          |      coincidem                      |          |
|          |  (hidden until mismatch detected)   |          |
|          |                                     |          |
|          |  +---------------------------------+|          |
|          |  |  Redefinir palavra-passe       ||          |
|          |  +---------------------------------+|          |
|          +-------------------------------------+          |
|                                                           |
+-----------------------------------------------------------+
```

**Reset Password page — expired/invalid token:**
```
+-----------------------------------------------------------+
|                                                           |
|          +-------------------------------------+          |
|          |  CRIVO                              |          |
|          |                                     |          |
|          |  +--------------------------------+ |          |
|          |  | [!] Link expirado ou invalido  | |          |
|          |  |     Este link de recuperacao   | |          |
|          |  |     ja nao e valido. Peca um   | |          |
|          |  |     novo link para continuar.  | |          |
|          |  +--------------------------------+ |          |
|          |                                     |          |
|          |  +---------------------------------+|          |
|          |  |     Pedir novo link            ||          |
|          |  +---------------------------------+|          |
|          |                                     |          |
|          |  <- Voltar ao login                 |          |
|          +-------------------------------------+          |
|                                                           |
+-----------------------------------------------------------+
```

The expired-token state renders on mount before the user can interact — no password fields are shown at all, preventing any attempt to fill them in vain. This is checked against the URL token immediately.

**Verify Email page (/verify-email):**
```
+-----------------------------------------------------------+
|                                                           |
|          +-------------------------------------+          |
|          |  CRIVO                              |          |
|          |                                     |          |
|          |              [envelope icon]        |          |
|          |                                     |          |
|          |  Verifique o seu email              |          |
|          |  ---------------------------------  |          |
|          |  Enviamos um link de                |          |
|          |  confirmacao para:                  |          |
|          |                                     |          |
|          |  francisco@flmotors.pt              |          |
|          |  (semibold, primary text color)     |          |
|          |                                     |          |
|          |  Clique no link para ativar         |          |
|          |  a sua conta.                       |          |
|          |                                     |          |
|          |  +---------------------------------+|          |
|          |  |     Reenviar email             ||          |
|          |  +---------------------------------+|          |
|          |  (secondary button; disabled 60s   |          |
|          |   after each click)                 |          |
|          |  Reenviar disponivel em 47s         |          |
|          |  (countdown, secondary text color)  |          |
|          |                                     |          |
|          |  <- Voltar ao login                 |          |
|          +-------------------------------------+          |
|                                                           |
+-----------------------------------------------------------+
```

The email address is displayed so the user can confirm they are checking the right inbox. The resend button is secondary (not primary) to discourage repeated sends; a visible countdown makes the rate-limit feel intentional rather than broken.

**Admin User Table — enhanced:**
```
+-------------------------------------------------------------------------------------+
|  Painel de Administracao                                                            |
|  Contas de revendedores registadas na plataforma                                    |
|                                                                                     |
| +-----------------------------------------------------------------------------------+
| | Nome          Email                  Plano    Estado         Funcao   Acoes       |
| |-----------------------------------------------------------------------------------|
| | Francisco L.  francisco@flmotors.pt  Pro      [==] Ativo     [Dealer v] [Guardar] |
| |-----------------------------------------------------------------------------------|
| | Admin Crivo   admin@crivo.pt         Admin    [==] Ativo     [Admin  v] [Guardar] |
| |-----------------------------------------------------------------------------------|
| |                                                                                   |
| |  Loading state (3 skeleton rows):                                                 |
| |  [||||||||]  [||||||||||||||||||]  [||||||]  [||||||]  [||||||]  [|||||||||]      |
| |  [||||||||]  [||||||||||||||||||]  [||||||]  [||||||]  [||||||]  [|||||||||]      |
| |  [||||||||]  [||||||||||||||||||]  [||||||]  [||||||]  [||||||]  [|||||||||]      |
| +-----------------------------------------------------------------------------------+
|                                                                                     |
|  Estado toggle: uses existing Toggle component; save is immediate on toggle         |
|  Funcao dropdown: two options (Dealer / Admin)                                      |
|  Guardar: activates only when Funcao value differs from loaded value for that row   |
|                                                                                     |
+-------------------------------------------------------------------------------------+
```

"Guardar" per row activates only after the dropdown value changes — this prevents accidental saves and scopes the button clearly to its row. Status toggle (Estado) saves immediately on change (lower-stakes action, consistent with the existing Toggle component pattern).

**Route guard loading state:**
```
+-----------------------------------------------------------+
|                                                           |
|                                                           |
|                                                           |
|                       ( O )                               |
|                    (spinning)                             |
|                                                           |
|                                                           |
|                                                           |
+-----------------------------------------------------------+
```

Full-viewport white background with a single centered spinner using the primary teal color. No text, no logo — just enough to signal the app is resolving auth state, without committing to layout that the auth result might contradict. Visible only if the session check takes longer than ~300ms.

## Architecture

### Architecture Summary

The app's authentication layer moves from hard-coded mock data to Supabase, a hosted auth service that handles email/password login, Google sign-in, session persistence, email verification, and password reset out of the box. A single Supabase client module becomes the sole entry point for all auth operations, replacing the current mock-user array. Each user's role (Dealer or Admin) is stored inside their Supabase profile metadata — no separate database table needed. Admin role changes are protected by a Supabase Edge Function that verifies the caller is an admin before it will write anything, keeping the privileged service key off the browser entirely. The three new self-service pages (forgot password, reset password, verify email) follow the same centered-card layout as the existing Login and Signup pages so no new design patterns are introduced. The existing Toggle, Button, FormField, Card, and Callout components cover all new UI needs.

### Implementation Phases

### Phase 1: Core auth wire-up
**Scope:** Users can log in and sign up with real credentials stored in Supabase. Sessions survive page refreshes. Route guards wait for session resolution before redirecting.

**Verification:**
- [ ] npm install completes without errors
- [ ] npm run dev starts without import errors or missing-module warnings
- [ ] Logging in with a valid Supabase account navigates to /searches and the session persists after a full page refresh
- [ ] Logging in with wrong credentials shows a Portuguese error message in-place without a page reload
- [ ] Logging out clears the session; directly visiting /searches redirects to /login
- [ ] Signing up with a new email redirects to /verify-email on step 2 submission
- [ ] While the auth provider is resolving the session on first load, the spinner is visible if network is throttled in devtools

**Estimated effort:** Large

### Phase 2: Self-service flows
**Scope:** Users who forget their password can reset it via email. New registrants are held on a verification-pending page with a resend option. All three new routes are publicly accessible.

**Verification:**
- [ ] Visiting /forgot-password, entering an email, and clicking 'Enviar link' shows the success Callout in-place; the email field is cleared; no page navigation occurs
- [ ] 'Voltar ao login' link on /forgot-password navigates to /login
- [ ] Visiting /reset-password without a Supabase recovery token shows the danger Callout immediately; no password fields are rendered
- [ ] Visiting /reset-password with a valid token shows two password fields; entering mismatched passwords shows the inline error and keeps the submit button disabled
- [ ] Visiting /verify-email shows the Mail icon, the user's email address, and the 'Reenviar email' button; clicking the button disables it and starts the 60-second countdown
- [ ] 'Esqueceu-se da palavra-passe?' on the Login page navigates to /forgot-password
- [ ] All three routes are accessible without being logged in

**Estimated effort:** Medium

### Phase 3: Admin role management and cleanup
**Scope:** Admins see a live user list and can change roles and status without touching source files. Profile saves in Settings are real. mockUsers is removed from the codebase.

**Verification:**
- [ ] grep -r 'mockUsers' src/ returns no matches
- [ ] Visiting /admin as an admin shows a live list of Supabase users; skeleton rows are briefly visible on first load
- [ ] Changing a user's role in the Funcao dropdown activates the Guardar button for that row only; clicking Guardar shows a success toast and resets the button to disabled
- [ ] Toggling a user's status toggle saves immediately and shows a success toast
- [ ] An admin changing their own role to Dealer sees the Portuguese warning toast
- [ ] Saving profile changes in /settings sends the update to Supabase; the success toast appears only after the provider confirms the save
- [ ] A non-admin user navigating to /admin is redirected to /searches
- [ ] npm run lint passes with no errors

**Estimated effort:** Medium

## Implementation Notes

## Phase 1: Core auth wire-up — Complete

### What was built

**New files:**
- `src/lib/supabase.js` — Supabase client singleton using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars
- `.env` — local placeholder (gitignored); builder fills in real Supabase project values
- `.env.example` — committed template with placeholder values for other developers

**Modified files:**
- `src/services/authService.js` — replaced `mockUsers` import with Supabase SDK calls: `loginWithCredentials` → `signInWithPassword`, new `loginWithGoogle` (OAuth), `logoutUser` (signOut), `signupUser` (signUp with metadata), `sendPasswordResetEmail`, `updatePassword`, `resendVerificationEmail`, `updateUserProfile`; `getUsers()` stub retained for Phase 3
- `src/context/AuthContext.jsx` — rewritten to subscribe to `supabase.auth.onAuthStateChange`; `isLoading` starts `true` and is set to `false` on first event (INITIAL_SESSION); `currentUser` set with `role` mapped from `user_metadata.role` (defaults to `'dealer'`); exposes `login`, `loginGoogle`, `signup`, `logout`, `isLoading`, `isAuthenticated`, `currentUser`
- `src/pages/Login.jsx` — `handleLogin` made async with try/catch; Supabase error codes mapped to Portuguese messages; `useEffect` watches `isAuthenticated` to navigate to `/searches` (avoids race with async `onAuthStateChange`); Google button wired to `loginGoogle()`; forgot-password `<a>` replaced with `<Link to="/forgot-password">`; `isSubmitting` state disables button during request
- `src/pages/Signup.jsx` — all inputs made controlled; step 2 "Concluir Registo" calls `signup(email, password, { full_name, company, nif, role: 'dealer' })`; on success navigates to `/verify-email`; Portuguese error messages on failure
- `src/App.jsx` — `ProtectedRoute` and `AdminRoute` render `AuthLoadingSpinner` while `isLoading` is true; spinner is a full-viewport white overlay with a teal CSS border spinner (keyframe defined inline)
- `package.json` — `@supabase/supabase-js` added to dependencies via `npm install`
- `.gitignore` — `.env` added so real credentials are never committed

### Key implementation decision

Post-login navigation uses `useEffect` on `isAuthenticated` in Login.jsx rather than `navigate()` directly after `await login()`. This avoids a race condition where `navigate('/searches')` fires before `onAuthStateChange` has propagated the new session into React state, which would cause ProtectedRoute to see `isAuthenticated=false` and redirect back to `/login`.

### Verification status

- `npm install` completed without errors (279 packages added)
- `vite build` passes cleanly — 1821 modules transformed, zero errors
- Lint: 105 pre-existing errors (react/prop-types, unused React imports — codebase-wide, predating this task); zero new violations introduced
- Live functional testing requires builder to fill in `.env` with real Supabase project URL and anon key

