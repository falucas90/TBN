# Past Decisions

## Decisions

- [01KTHR0F0NGM1ZMRT95JJ7Z8BH] **Keep `ProtectedRoute` single-responsibility (isAuthenticated check only) and ...** -- Keep `ProtectedRoute` single-responsibility (isAuthenticated check only) and add a separate `AdminRoute` guard for role-based access. `AdminRoute` checks `isAuthenticated` first (redirect to `/login`), then checks `currentUser?.role === 'admin'` (redirect to `/searches`). This avoids adding a role prop to every non-admin `ProtectedRoute` call and keeps the two concerns cleanly separated.

**Why:** When the admin panel was added, the alternative of extending `ProtectedRoute` with a role prop was rejected because it would have required threading that prop through every existing protected route — even those that don't need role checks — just to keep the API consistent.

**How to apply:** Whenever a new access tier is added (e.g. premium, superadmin), create a new dedicated guard component rather than extending `ProtectedRoute`. The pattern: check `isAuthenticated` first (so unauthenticated users always land on `/login`), then check the role/tier condition. [source: task-add-authentication-and-admin-view-01kt54czr1xn, importance: 0.7]
- [01KT557P9JJ1PZFA9FKG46GFB3] **In autoseek, derived financial values (ISV, totalCost, marginEst) are compute...** -- In autoseek, derived financial values (ISV, totalCost, marginEst) are computed at render time from raw vehicle spec inputs — they are not stored in or read back from mock data. The existing hardcoded fields in mockAlerts (isvEst, totalCost, marginEst) remain in the file for reference but are superseded by computed values at render time.

**Why:** Computing at render time avoids mutating the mock data shape beyond adding the required calculator inputs (cc, co2, fuelType, ageYears). It ensures displayed values automatically reflect spec data changes without additional sync logic between the mock data and displayed output.

**How to apply:** If adding or modifying alert cards in autoseek, do not read alert.isvEst, alert.totalCost, or alert.marginEst for display — always compute them via calculateISV and arithmetic in the component. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.7]

