# Security Audit — autoseek / Crivo

**Audit date:** 2026-06-09
**Audited revision:** feature/task-evaluate-app-security-01ktmt058jcn
**Scope:** Authentication flows, access control, data handling, Edge Function security, client-side configuration
**Out of scope:** Live penetration testing, third-party Supabase internals, writing fixes

---

## Summary

| Severity  | Count |
|-----------|-------|
| Critical  | 2     |
| High      | 3     |
| Medium    | 4     |
| Low       | 2     |
| **Total** | **11**|

Two critical findings relate to the mock authentication system: (1) the app silently grants full authenticated access to all visitors when Supabase env vars are absent, and (2) the admin "deactivate user" function has no enforcement — deactivated users retain full access and can self-reactivate. These must be resolved before any public deployment.

---

## Critical Findings

### C-01 — Mock Authentication Bypass (R1)

**Severity:** Critical
**Type:** Code change
**Files:** `src/lib/supabase.js:6-10`, `src/context/AuthContext.jsx:7,10-11`

**Risk:** When either `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is absent from the build environment, `supabaseConfigured` evaluates to `false`. `AuthContext` then initialises with a hardcoded `MOCK_USER` object (`{ id: 'mock', email: 'dev@local', role: 'dealer' }`) as the authenticated user, and `isLoading` starts as `false`. The result is that every visitor is silently treated as a logged-in dealer with no credentials required, no redirect to `/login`, and no indication that authentication is bypassed.

```js
// src/context/AuthContext.jsx:7,10-11
const MOCK_USER = { id: 'mock', email: 'dev@local', role: 'dealer' };
const [currentUser, setCurrentUser] = useState(supabaseConfigured ? null : MOCK_USER);
const [isLoading, setIsLoading] = useState(supabaseConfigured);
```

This is an intentional development convenience, but there is no guard preventing it from being the live state in a production build. A misconfigured deployment (missing env vars in a hosting provider's config) would expose all application routes — searches, alerts, settings — to unauthenticated visitors without any visible error.

**Production deployment risk:** High. Vite build succeeds silently without these vars. Hosting platforms like Vercel and Netlify will not fail the build if vars are absent. A developer deploying for the first time who forgets to configure secrets would produce a fully authenticated-appearing app with no warning.

**Remediation (code change):** In production builds, fail loudly if Supabase credentials are absent. Add a `vite.config.js` define check using `loadEnv`:

```js
// vite.config.js
import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production') {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for production builds');
    }
  }
  return { plugins: [react()] };
});
```

Additionally, render a visible error screen (not a silent mock bypass) when `!supabaseConfigured` in non-development environments.

---

### C-02 — Admin Deactivation Has No Access Control Effect (R4 + R11)

**Severity:** Critical
**Type:** Code change
**Files:** `src/context/AuthContext.jsx:16-23`, `src/App.jsx:36-49`, `supabase/functions/update-user-role/index.ts:79-93`, `src/services/authService.js:56-60`

**Risk:** This finding is the combined impact of two independent gaps:

**Gap A (R4) — Status is never checked.** When an admin sets a user to "inactive" via `handleToggleStatus` in `src/pages/Admin.jsx`, the Edge Function writes `status: 'inactive'` to `user_metadata` using the service role key. However, no code in the authentication or routing layer reads this value:

- `ProtectedRoute` (`src/App.jsx:36-41`) only checks `isAuthenticated` — not status.
- `AdminRoute` (`src/App.jsx:43-49`) only checks `isAuthenticated` and `currentUser.role` — not status.
- `onAuthStateChange` in `AuthContext` (`src/context/AuthContext.jsx:16-23`) sets `currentUser` from the session without inspecting `user_metadata.status`.
- `loginWithCredentials` (`src/services/authService.js:3-8`) calls Supabase signIn without any post-login status check.

A user marked "inactive" in the admin panel can continue to log in and use all app features without restriction. The "deactivate" toggle has no security effect whatsoever.

**Gap B (R11) — user_metadata is user-writable.** Supabase `user_metadata` is intended for user-owned data and can be updated by any authenticated user via the standard client API (`supabase.auth.updateUser({ data: {...} })`). The `updateUserProfile` service function (`src/services/authService.js:56-60`) already uses this mechanism for `full_name` and `phone`. Any user can call:

```js
await supabase.auth.updateUser({ data: { status: 'active' } });
```

from the browser console using their existing session to reset their own inactive status. Admin intent to block a user is trivially reversed by that user with a single API call, even if Gap A were fixed.

**Contrast with role handling:** `update-role` correctly writes to `app_metadata.role` via the service role key, which is not writable by client-side Supabase calls. Status should receive the same treatment — either enforced at the Supabase Auth level (disable the account) or written to `app_metadata.status` and checked via a server-side mechanism.

**Remediation (code change):**

1. Replace the `update-status` action in the Edge Function with `supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' | '876600h' })` — use Supabase's built-in account ban, which is enforced at the auth server level and cannot be reversed by the user.
2. Alternatively, if `user_metadata.status` must remain, add a status check in the `onAuthStateChange` handler: if `user.user_metadata?.status === 'inactive'`, call `supabase.auth.signOut()` immediately after session detection and redirect to a "conta desativada" page.
3. Never rely on `user_metadata` fields for access control decisions — only `app_metadata` (written via service role) carries security guarantees.

---

## High Findings

### H-01 — No Guard Against Mock Mode in Production Builds (R2)

**Severity:** High
**Type:** Code change / Infrastructure configuration
**Files:** `vite.config.js:1-7`, `src/lib/supabase.js:1-10`

**Risk:** `vite.config.js` contains no environment assertions. A `npm run build` or `vite build` with missing Supabase env vars produces a valid production bundle that silently operates in mock mode (see C-01). There are no runtime checks in `src/lib/supabase.js` beyond the boolean `supabaseConfigured` flag — this flag gates feature behaviour but does not alert an operator that the app is misconfigured.

Additionally, there is no `.env.example` file documenting which variables are required. A developer cloning the repository has no signal that env vars are mandatory before deployment.

**Remediation (code change + infrastructure):**

1. Add the build-time guard in `vite.config.js` described in C-01.
2. Add a `.env.example` file listing all required vars with placeholder values and a comment indicating they are mandatory for production.
3. Add a runtime check in `src/lib/supabase.js` that logs a `console.error` in non-production environments when `supabaseConfigured` is `false`, making the mock mode state visible in browser devtools.

---

### H-02 — Role Display vs Enforcement Discrepancy in Admin Panel (R5)

**Severity:** High
**Type:** Code change
**Files:** `src/pages/Admin.jsx:146`, `src/context/AuthContext.jsx:19`, `supabase/functions/update-user-role/index.ts:70-72`

**Risk:** The admin panel and the access control layer read role from different metadata fields:

- **Access control** (enforced): `src/context/AuthContext.jsx:19` — `user.app_metadata?.role || 'dealer'`
- **Admin panel display**: `src/pages/Admin.jsx:146` — `user.user_metadata?.role || 'dealer'`

When a role is saved via `handleSaveRole`, the Edge Function writes to `app_metadata.role` (correct — this is the enforced field). However, the local React state update on line 58 of `Admin.jsx` writes the new role back to `user_metadata.role` in the in-memory user object:

```js
{ ...u, user_metadata: { ...u.user_metadata, role: newRole } }
```

After `listUsers()` is called again (e.g. on next page load), the API returns the real user object from Supabase. If `user_metadata.role` was never written to Supabase (only `app_metadata.role` was), the admin panel will show the old role in `user_metadata.role` while the system enforces the new role in `app_metadata.role`. An admin cannot tell from the panel whether a role change is actually in effect.

**Practical attack vector:** An admin believes they demoted a user to dealer (sees "Dealer" displayed) but the enforcement value in `app_metadata.role` may differ if an older mechanism or direct Supabase call had written there. Conversely, a user's role could have been elevated without the admin panel reflecting it.

**Remediation (code change):** Change `Admin.jsx` to read role from `user.app_metadata?.role` for display, not `user.user_metadata?.role`. The Edge Function `list` action returns full user objects from `supabaseAdmin.auth.admin.listUsers()` which includes `app_metadata` — no API change needed.

---

### H-03 — Admin Self-Demotion Does Not Invalidate Session (R6)

**Severity:** High
**Type:** Code change
**Files:** `src/pages/Admin.jsx:49-72`

**Risk:** When an admin changes their own role to "dealer" via the admin panel, `handleSaveRole` shows a warning toast and calls `updateUserRole`. The Edge Function writes the demotion to `app_metadata.role`. However, the current Supabase session's JWT is not invalidated — `currentUser.role` in `AuthContext` remains `'admin'` until the next JWT refresh (up to ~60 minutes, depending on Supabase project settings) or until the user manually logs out and back in.

During this window, the demoted admin:
- Still passes the `AdminRoute` check (`currentUser?.role !== 'admin'` returns false)
- Can access `/admin` and list users
- Can re-promote themselves back to admin

The toast message says "Vai perder acesso de administrador no próximo início de sessão" which correctly describes the behaviour but does not adequately convey the risk window or prevent continued privileged access.

**Remediation (code change):** After a confirmed self-demotion, call `logout()` immediately to invalidate the session and force a fresh login that will pick up the new role from `app_metadata`. Alternatively, call `supabase.auth.refreshSession()` to force a JWT refresh with the updated `app_metadata`.

---

## Medium Findings

### M-01 — Missing Client-Side Input Validation on Auth Forms (R7)

**Severity:** Medium
**Type:** Code change
**Files:** `src/pages/Signup.jsx:116`, `src/pages/Signup.jsx:130-136`, `src/pages/ResetPassword.jsx:44-57`, `src/pages/Settings.jsx:63-73`

**Risk:** Several form fields advance or submit without client-side validation:

1. **Signup step 1 → step 2 transition** (`Signup.jsx:116`): The "Continuar" button calls `setStep(2)` with no check for empty name, email, or password fields. A user can advance with all fields blank, then submit at step 2, relying entirely on Supabase server-side rejection.

2. **NIF field** (`Signup.jsx:130-136`): Accepts any string. A valid Portuguese NIF is exactly 9 digits. No format validation exists client-side or before submission.

3. **Password reset form** (`ResetPassword.jsx:44-57`): The submit handler only checks that the two passwords match (`password !== confirmPassword`). There is no minimum length check. Supabase enforces a 6-character minimum server-side, but a user gets no client-side feedback until the API call fails.

4. **Settings phone field** (`Settings.jsx:63-73`): Accepts any string, including clearly invalid input. Since this field feeds into WhatsApp notification routing, an invalid value silently breaks notification delivery.

**What Supabase catches server-side:** Email format, password minimum length (6 chars), duplicate email registration. These are handled and mapped in `mapSignupError`.

**What is fully unguarded:** NIF format (stored as-is), empty required fields at step transition, phone number format.

**Remediation (code change):** Add validation in the step transition handler and before `handleSignup` is called. For NIF, validate with a 9-digit regex (`/^\d{9}$/`). For phone, validate with a permissive E.164-like regex or use `type="tel"`. These are UX improvements as well as security hygiene.

---

### M-02 — NIF Storage Sensitivity and GDPR Obligations (R8)

**Severity:** Medium
**Type:** Code change / Infrastructure configuration
**Files:** `src/pages/Signup.jsx:37-43`

**Risk:** The NIF (Número de Identificação Fiscal) is collected at signup and stored in Supabase `user_metadata.nif`:

```js
await signup(email, password, {
  full_name: `${nome} ${apelido}`.trim(),
  company,
  nif,            // Portuguese tax identifier
  role: 'dealer',
});
```

Under GDPR (Regulation EU 2016/679) and its Portuguese implementing legislation (Lei n.º 58/2019), the NIF is personal data that uniquely identifies a natural person. Its collection, storage, and processing require a lawful basis, user consent or notification, and appropriate technical safeguards.

Current gaps:
- The NIF is stored unvalidated (see M-01), so malformed values are stored permanently in user records.
- `user_metadata` in Supabase is stored in plaintext in the auth database. Supabase encrypts data at rest at the infrastructure level, but the NIF is accessible in plaintext to anyone with project admin access or service role key.
- The privacy policy link in the login footer triggers a stub toast (`'Política de privacidade em breve.'`) — there is no privacy policy documenting NIF collection, retention, or processing purpose.
- No data retention or deletion policy exists in code; the "Eliminar Conta" button shows a toast only (`'Tem a certeza? Esta ação requer confirmação.'`) without actually deleting anything.

**Remediation (infrastructure + code change):**
1. Publish a GDPR-compliant privacy policy documenting NIF collection purpose, retention period, and user rights before accepting real user registrations.
2. Implement functional account deletion (call `supabase.auth.admin.deleteUser(userId)` in the Edge Function) to honour data subject erasure requests.
3. Consider whether NIF needs to be stored at all — if it is only used for ISV calculation context, collect it during searches rather than at registration.

---

### M-03 — Missing HTTP Security Headers (R12)

**Severity:** Medium
**Type:** Infrastructure configuration
**Files:** `vite.config.js:1-7`

**Risk:** No security headers are configured anywhere in the application:

| Header | Status | Risk without it |
|--------|--------|-----------------|
| `Content-Security-Policy` | Missing | Reduces attacker impact from XSS — without CSP, injected scripts can exfiltrate data or hijack sessions |
| `X-Frame-Options` | Missing | App can be iframed by a third-party site for clickjacking attacks |
| `X-Content-Type-Options: nosniff` | Missing | MIME-type sniffing attacks on user-uploaded content (if any) |
| `Strict-Transport-Security` | Missing | Allows HTTP downgrade attacks if the site is accessed over HTTP first |
| `Referrer-Policy` | Missing | App URL paths (including any query params with user data) may be leaked to third-party origins via the `Referer` header |

For a Vite SPA, these headers are not configurable in `vite.config.js` for production — the dev server can set headers via `server.headers` but the production build is static HTML/JS served by the hosting provider.

**Remediation (infrastructure configuration):** Configure headers at the hosting layer. Examples:

- **Vercel:** Add a `vercel.json` with `headers` rules
- **Netlify:** Add a `public/_headers` file
- **nginx:** `add_header` directives in the server block

Minimum recommended headers for this app:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

### M-04 — Admin Role Enforcement Chain Assessment (R3)

**Severity:** Medium (informational — chain is secure but has a dependency on Supabase JWT integrity)
**Type:** Code change (via C-01 and H-03)
**Files:** `src/App.jsx:43-49`, `src/context/AuthContext.jsx:16-22`

**Risk:** The `AdminRoute` guard checks `currentUser?.role !== 'admin'` where `role` is derived from `user.app_metadata?.role` set in `onAuthStateChange`. `app_metadata` is embedded in the Supabase JWT by the Supabase auth server and is not writable by end users via the client SDK — it requires the service role key. The Edge Function correctly uses the service role for all `app_metadata` writes.

This chain is secure against client-side spoofing under normal Supabase operation. However, it carries the following implicit dependencies:

1. **JWT secret integrity**: If the Supabase project's JWT secret is ever exposed, an attacker could forge tokens with arbitrary `app_metadata`. Rotate the JWT secret if any service role key or project secret is compromised.
2. **Mock mode exception**: In mock mode (C-01), `MOCK_USER = { role: 'dealer' }` — so the admin panel is not accessible in mock mode. This partially limits the blast radius of C-01 to dealer-level access only. However, mock mode should never reach production regardless.
3. **Session staleness**: After a role change, the currently active session continues using the old JWT until it refreshes. See H-03.

**Remediation:** No code change required for the core chain. Fix H-03 (force session refresh on role change) and C-01 (prevent mock mode in production) to close the adjacent gaps.

---

## Low Findings

### L-01 — CORS Wildcard on Edge Function (R9)

**Severity:** Low
**Type:** Infrastructure configuration
**Files:** `supabase/functions/update-user-role/index.ts:3-6`

**Risk:** The Edge Function returns `Access-Control-Allow-Origin: *`, permitting cross-origin requests from any domain:

```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

In isolation, this is low severity because all non-OPTIONS requests must carry a valid admin JWT in the `Authorization` header. Bearer token authentication is not vulnerable to CSRF — unlike cookie-based auth, Bearer tokens are not automatically attached by browsers to cross-origin requests. A malicious third-party site cannot make a cross-origin call to this function on behalf of a logged-in admin without extracting the token from `localStorage`, which requires XSS.

The practical risk is low but the wildcard is unnecessarily permissive. In production, the origin should be restricted to the app's deployed domain.

**Remediation (infrastructure configuration):** Replace the wildcard with the production origin:

```ts
'Access-Control-Allow-Origin': 'https://yourapp.example.com',
```

If the app is served from multiple origins (e.g. preview deployments), check the request `Origin` header against an allowlist and echo it back if it matches.

---

### L-02 — Raw Error Messages in Edge Function 500 Responses (R10)

**Severity:** Low
**Type:** Code change
**Files:** `supabase/functions/update-user-role/index.ts:99-103`

**Risk:** Unhandled exceptions in the Edge Function are returned to the client with the raw `err.message`:

```ts
} catch (err) {
  return new Response(JSON.stringify({ error: err.message }), {
    status: 500,
    ...
  });
}
```

In the context of Supabase admin operations, `err.message` could expose Supabase internal error strings, database constraint names, or unexpected input details. While these messages are unlikely to directly enable an attack, they violate the principle of minimal information disclosure.

**Remediation (code change):** Return a generic message to the client and log the detailed error server-side:

```ts
} catch (err) {
  console.error('update-user-role error:', err);
  return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

## Additional Observations

### Edge Function Absent — Safe Fallback Confirmed

**Requirement:** R12 technical note (Edge Function not deployed)
**Verdict:** Safe

If the `update-user-role` Edge Function is not deployed to a Supabase project but `supabaseConfigured` is `true`, all admin service calls (`listUsers`, `updateUserRole`, `updateUserStatus`) will throw an error at `supabase.functions.invoke(...)`. The Admin page catches this and displays `'Erro ao carregar utilizadores.'` via toast. No silent no-op occurs — the admin panel visibly fails, making the absent function apparent. This is an acceptable degradation for undeployed environments.

### `authService.js` Null Guards

`src/services/authService.js` defensively checks `if (!supabase) return` (or `return []` for list functions) before every Supabase call. In mock mode, all service calls are no-ops. This pattern correctly prevents null pointer errors and is not a security concern on its own — the risk is entirely in the mock-mode bypass (C-01), not in these guards.

---

## Remediation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 | C-01 — Mock auth bypass | Small: build-time guard in vite.config.js |
| 2 | C-02 — Admin deactivation ineffective + user-writable status | Medium: use Supabase ban API or check status in auth flow |
| 3 | H-01 — No mock mode production guard | Small: env validation + .env.example |
| 4 | H-02 — Role display/enforcement discrepancy | Small: one-line change in Admin.jsx |
| 5 | H-03 — Admin self-demotion retains access | Small: add logout/refresh after demotion |
| 6 | M-02 — NIF GDPR obligations | Large: privacy policy, deletion, data audit |
| 7 | M-03 — Missing HTTP security headers | Small: hosting layer config (vercel.json / _headers) |
| 8 | M-01 — Missing form input validation | Small–Medium: add validators to signup/reset/settings |
| 9 | L-01 — CORS wildcard | Small: restrict to production origin |
| 10 | L-02 — Raw error messages | Trivial: wrap catch in generic message |
