---
defract:
  id: task-evaluate-app-security-01ktmt058jcn
  type: task
  status: active
  stage: implementation
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-evaluate-security-of-14
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---


## Story Brief

Promoted from backlog item `bli-evaluate-security-of-14`.

- Epic: auth
- Module: auth
- Labels: security, audit

Original paste from the builder:

> evaluate security of the app

# Evaluate app security

# Evaluate App Security

## What We're Building

A structured security audit of the autoseek application, covering authentication flows, access control, data handling, and client-side risks. The audit will identify vulnerabilities and weaknesses across the app as it currently exists, and produce a prioritised list of findings with remediation guidance.

## Expected Outcome

- A complete inventory of security findings, each rated by severity (critical, high, medium, low)
- Each finding includes a plain-language description of the risk, the affected area, and a concrete remediation recommendation
- Access control gaps — such as routes or actions that can be reached by users without the required role — are explicitly called out
- Data exposure risks — including anything sensitive stored or transmitted insecurely — are identified
- The audit distinguishes between findings that require code changes and findings that require infrastructure or backend configuration

## Phase Outcomes

- **Phase 1: Produce security findings document** — Delivers a prioritised list of all identified security issues, each with a severity rating and remediation recommendation. Builders and reviewers can use this to plan which issues to fix first and what effort each remediation requires.

## Out of Scope

- Penetration testing or live exploitation of the app in a deployed environment
- Security review of third-party services (Supabase, Google OAuth) beyond how the app integrates with them
- Writing the fixes — the audit produces findings and recommendations only; remediation is a separate task

## Scope Summary

**Size:** 12 requirements, 8 acceptance criteria, 1 implementation phase
**Key decisions:**
- Audit findings are written to a `SECURITY_AUDIT.md` file committed to the repository so they persist and can be referenced in future remediation tasks
- Pre-audit code review already identified 12+ candidate issues; the implementation agent verifies and documents them all, rating each by exploitability and impact
**Biggest risk:** Two critical findings related to mock authentication bypass — if the app is deployed without Supabase env vars configured, all visitors are silently granted authenticated dealer access with no credentials required.

## Context

The app integrates Supabase for authentication and uses a three-layer degradation pattern when Supabase is unconfigured (`src/lib/supabase.js`, `src/context/AuthContext.jsx`, `src/services/authService.js`). Route access is guarded by `ProtectedRoute` and `AdminRoute` in `src/App.jsx`. Privileged admin operations (role changes, user deactivation) are protected by a Supabase Edge Function at `supabase/functions/update-user-role/index.ts`. The app is in active development with mock data alongside real Supabase integration — the mock/real boundary is where several security gaps concentrate.

## Requirements

### Authentication Bypass and Mock Mode

- R1: The mock authentication bypass must be audited. When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is absent, `AuthContext` initializes with a hardcoded authenticated user — any deployment missing these env vars silently grants all visitors authenticated dealer access. Document the exact trigger condition and production deployment risk. (Relevant code: `src/context/AuthContext.jsx:10-11`, `src/lib/supabase.js:6-10`)
- R2: The absence of a build-time or runtime guard against deploying in mock mode must be audited. There is no assertion that Supabase credentials must be present for production builds. Document what guard would prevent accidental production deployment in unauthenticated mock mode. (Relevant code: `vite.config.js`, `src/lib/supabase.js`)

### Access Control

- R3: The admin route guard must be audited. `AdminRoute` reads role from `currentUser.role`, derived from `user.app_metadata?.role` in Supabase mode — verify this chain is tamper-resistant and cannot be spoofed client-side. (Relevant code: `src/App.jsx:43-49`, `src/context/AuthContext.jsx:19`)
- R4: The inactive user status enforcement gap must be audited. Setting a user to "inactive" in the admin panel updates `user_metadata.status` via the Edge Function, but no code in `ProtectedRoute`, `AuthContext`, or the login flow checks this status to block access. Document whether the inactive flag has any real effect on user access, and whether it can be self-reset by the user. (Relevant code: `src/pages/Admin.jsx:74-93`, `supabase/functions/update-user-role/index.ts:79-93`, `src/context/AuthContext.jsx`)
- R5: The metadata inconsistency between role display and role enforcement must be audited. The admin panel reads role from `user.user_metadata?.role` for display, but access control enforces role from `user.app_metadata?.role`. An admin could believe a role change took effect based on the displayed value when the enforced role differs. (Relevant code: `src/pages/Admin.jsx:146`, `src/context/AuthContext.jsx:19`, `supabase/functions/update-user-role/index.ts:63-77`)
- R6: The admin self-demotion flow must be audited. When an admin demotes themselves, a warning toast is shown but the active session is not invalidated — the admin retains full admin access until the next login. Document the risk window. (Relevant code: `src/pages/Admin.jsx:51-71`)

### Input Validation and Data Handling

- R7: All auth-flow form inputs must be audited for missing client-side validation. The signup form step 1 advances to step 2 without checking required fields; the NIF field has no format validation; the password reset form has no minimum length check before submission; the settings phone field accepts any string. Document which gaps Supabase catches server-side and which are fully unguarded. (Relevant code: `src/pages/Signup.jsx:116`, `src/pages/ResetPassword.jsx:44-57`, `src/pages/Settings.jsx:22`)
- R8: The NIF field must be audited for storage sensitivity. The Portuguese tax identifier is collected at signup and stored unvalidated in Supabase `user_metadata`. Document whether this constitutes a sensitive personal identifier under GDPR/Portuguese data law and what protections are in place. (Relevant code: `src/pages/Signup.jsx:37-49`)

### Edge Function Security

- R9: The CORS policy on the `update-user-role` Edge Function must be audited. `Access-Control-Allow-Origin: *` permits requests from any origin. In combination with Bearer token auth, document whether this allows cross-origin attacks against authenticated admin sessions. (Relevant code: `supabase/functions/update-user-role/index.ts:4-6`)
- R10: Error handling in the Edge Function must be audited. Raw `err.message` strings are returned in 500 responses, potentially leaking Supabase internals. Document what information could be disclosed and how to sanitise it. (Relevant code: `supabase/functions/update-user-role/index.ts:99-103`)
- R11: The `user_metadata` vs `app_metadata` security boundary must be audited. The `update-status` action writes to `user_metadata.status` (writable by the user themselves via the Supabase client `updateUser` API), while `update-role` correctly writes to `app_metadata.role` (service-role only). Document whether a user can reset their own "inactive" status directly through the Supabase API, bypassing admin intent. (Relevant code: `supabase/functions/update-user-role/index.ts:79-93`)

### Client-Side Security Headers

- R12: The application must be audited for missing HTTP security headers. No CSP, X-Frame-Options, HSTS, or Referrer-Policy headers are configured in `vite.config.js` or any other server configuration. Document the practical risk in the context of a Vite SPA and what headers would be applied at the hosting layer. (Relevant code: `vite.config.js`)

## Acceptance Criteria

- [ ] A `SECURITY_AUDIT.md` file is committed to the repository root containing all findings
- [ ] Each finding is rated Critical, High, Medium, or Low, and references the affected file(s) with line numbers
- [ ] Each finding includes a plain-language description of the risk and a concrete remediation recommendation
- [ ] Each finding is labeled "code change" or "infrastructure/backend configuration" (or both)
- [ ] R1 and R2 (mock mode bypass) are rated Critical or High and document the production deployment risk
- [ ] R4 and R11 (inactive user bypass) are documented together with their combined practical impact
- [ ] R5 (metadata display/enforcement discrepancy) is explicitly called out as an admin panel confusion risk
- [ ] Findings are grouped and ordered by severity (Critical → High → Medium → Low)

## Implementation Phases

### Phase 1: Perform audit and write findings document
**Scope:** Systematically review all authentication, access control, data handling, and Edge Function code identified in requirements R1–R12. Produce a prioritised findings document committed to the repository root.
**Files:**
- Create: `SECURITY_AUDIT.md`
**Verification:**
- `SECURITY_AUDIT.md` exists at the repository root
- The document contains at least 10 distinct findings, each with a severity rating, file reference, and remediation recommendation
- All 12 requirement areas (R1–R12) have a corresponding finding
- Findings are grouped by severity
**Estimated effort:** Medium

## Edge Cases

- **Deployed without Supabase configured**: The app silently enters mock mode — this is the highest-risk scenario and must be rated Critical
- **`user_metadata` vs `app_metadata` boundary**: `user_metadata` is user-editable via Supabase client `updateUser`; `app_metadata` requires the service role key. Findings must clearly distinguish which fields carry security guarantees
- **Edge Function not deployed**: If the Edge Function is absent from a Supabase project, all admin user management silently no-ops (null guard returns early) — audit whether this is a safe fallback or a risk

## Technical Notes

Audit the codebase in this order for efficiency:
1. `src/lib/supabase.js` — client initialisation and mock mode trigger
2. `src/context/AuthContext.jsx` — auth state, mock bypass, role derivation
3. `src/App.jsx` — route guards (`ProtectedRoute`, `AdminRoute`)
4. `src/services/authService.js` — Supabase calls, null guards, and Edge Function invocations
5. `src/pages/Login.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — auth flows and input validation
6. `src/pages/Admin.jsx` — admin panel, role management, status toggling, self-demotion
7. `src/pages/Settings.jsx` — profile updates and sensitive field handling
8. `supabase/functions/update-user-role/index.ts` — Edge Function auth chain, CORS, and metadata writes
9. `vite.config.js` — build config and missing security headers

The `update-user-role` Edge Function is the only server-side code in this repo. Its JWT verification and admin role check are the primary server-side security boundary. The inconsistency between `user_metadata` (for status) and `app_metadata` (for role) is the most architecturally significant finding.
