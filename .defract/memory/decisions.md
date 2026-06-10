# Past Decisions

## Decisions

- [01KTS3G33PZWWA34KSV01NZ3VP] **Keep `ProtectedRoute` single-responsibility (isAuthenticated check only) and ...** -- Keep `ProtectedRoute` single-responsibility (isAuthenticated check only) and add a separate `AdminRoute` guard for role-based access. `AdminRoute` checks `isAuthenticated` first (redirect to `/login`), then checks `currentUser?.role === 'admin'` (redirect to `/searches`). This avoids adding a role prop to every non-admin `ProtectedRoute` call and keeps the two concerns cleanly separated.

**Why:** When the admin panel was added, the alternative of extending `ProtectedRoute` with a role prop was rejected because it would have required threading that prop through every existing protected route — even those that don't need role checks — just to keep the API consistent.

**How to apply:** Whenever a new access tier is added (e.g. premium, superadmin), create a new dedicated guard component rather than extending `ProtectedRoute`. The pattern: check `isAuthenticated` first (so unauthenticated users always land on `/login`), then check the role/tier condition. [source: ui-supersede, importance: 0.7]
- [01KTS3FJ0H7482WAJ17STK1S1M] **When a third-party client (e** -- When a third-party client (e.g. Supabase) is conditionally initialized based on env vars, export both a potentially-null client AND a named boolean flag (`supabaseConfigured`) from the client module. Consumers import the flag and branch on it rather than re-checking env vars independently. The guard is a pre-call env-var presence check (both vars must be non-empty strings), not a try/catch — try/catch would silently swallow errors that should propagate in misconfigured-but-present scenarios.

**Why:** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` were absent, `createClient(undefined, undefined)` threw synchronously at module load, crashing before React mounted. The `supabaseConfigured` boolean gives all consumers (AuthContext, service functions, future callers) a single source of truth rather than each re-checking env vars independently.

**How to apply:** In `src/lib/supabase.js` and any future client module: `export const supabaseConfigured = !!(url && key); export const client = supabaseConfigured ? createClient(url, key) : null;`. All consumers branch on the boolean, not on the client being null directly. [source: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh, importance: 0.7]. [source: ui-supersede, importance: 0.7]
- [01KT557P9JJ1PZFA9FKG46GFB3] **In autoseek, derived financial values (ISV, totalCost, marginEst) are compute...** -- In autoseek, derived financial values (ISV, totalCost, marginEst) are computed at render time from raw vehicle spec inputs — they are not stored in or read back from mock data. The existing hardcoded fields in mockAlerts (isvEst, totalCost, marginEst) remain in the file for reference but are superseded by computed values at render time.

**Why:** Computing at render time avoids mutating the mock data shape beyond adding the required calculator inputs (cc, co2, fuelType, ageYears). It ensures displayed values automatically reflect spec data changes without additional sync logic between the mock data and displayed output.

**How to apply:** If adding or modifying alert cards in autoseek, do not read alert.isvEst, alert.totalCost, or alert.marginEst for display — always compute them via calculateISV and arithmetic in the component. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.7]
- [01KTMPSC45J3QX9QVF0CRYQT4D] **Service functions in autoseek's `src/services/` layer are async from day one,...** -- Service functions in autoseek's `src/services/` layer are async from day one, even when the bodies only wrap mock arrays. The pattern: `export async function getSearches() { return [...mockSearches]; }` — not `return mockSearches`. This means swapping in real network calls (REST, Supabase) requires editing only the service function body; all consuming components already `await` the call and require no signature changes.

**Why:** The real backend for autoseek had not been decided at time of writing (REST API vs. Supabase vs. other). Async signatures are the stable contract that survives any backend choice. A sync service that later becomes async would require adding `await` and `useEffect` to every consumer.

**How to apply:** All new service functions in `src/services/` must return Promises. Do not use synchronous signatures even when the current implementation is trivially synchronous. [source: task-replace-mock-data-with-real-data-sources-01kt54r89hd3, importance: 0.6]

