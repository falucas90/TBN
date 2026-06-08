# Proven Workflows

## Workflows

- [01KT54YNF60ZY0AA4FS53AKKSP] **Trivial single-file changes split into two templates based on what is changing:** -- Trivial single-file changes split into two templates based on what is changing:

- **`ui-polish`** — CSS/layout adjustments, applying existing design-system classes, resizing containers, visual alignment. Use this when no logic changes and no new components.
- **`bug-fix`** — Logic corrections, state fixes, behavioural bugs. Use this when behaviour is wrong.

Both skip design and architecture stages. Both follow: scope → implementation → review → release.

The login layout fix (task-fix-login-page-layout-email-and-01ktht16jwgh) used `ui-polish` because the change was purely CSS (maxWidth, className) with no logic or data flow involved. Earlier delete-support task used `bug-fix` for state mutation logic.

**Why:** Scope agents were classifying single-file CSS fixes as `bug-fix` — the correct template for pure styling work is `ui-polish`.

**How to apply:** At scope time for a single-file change: if the diff is only CSS properties, className additions, or sizing values with no JS logic change → `ui-polish`. If any state, event handler, or data flow changes → `bug-fix`. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.7]
- [01KTMPS3JASNK074J40SP7Q4BD] **When introducing a service abstraction layer over a data source, grep ALL fil...** -- When introducing a service abstraction layer over a data source, grep ALL files in the codebase for direct imports of that source before starting implementation — the phase plan often lists only the "obvious" consumers and misses others. In this task the phase plan listed `AuthContext.jsx`, `Searches.jsx`, and `AlertHistory.jsx` as the three consumers of `mock-data.js`, but `Admin.jsx` had a direct `mockUsers` import not listed in the plan. It was caught during implementation via R7 grep, but it required an unplanned deviation.

**Why:** Phase plans are written from a reading of the most-trafficked files. Ad-hoc imports (especially in pages added after the initial scaffold) are invisible to the planner without an explicit grep.

**How to apply:** At the start of any service-layer introduction task, run `grep -r "from.*<source-module>" src/` and compare the matches against the phase plan's file list. Add any missing consumers to the plan before writing code. [source: task-replace-mock-data-with-real-data-sources-01kt54r89hd3, importance: 0.6]
- [01KT557E0XWJWDJVV92TJXD7QR] **During audit or scope tasks that rely on a project profile, always do a live ...** -- During audit or scope tasks that rely on a project profile, always do a live codebase read to verify which items are actually implemented before writing the scope. Project profiles can be stale. In this audit task, 2 of 4 items in the intent check (brand/margin filters, catch-all route) were already correctly implemented in the live code — scoping them as "broken" would have produced a no-op implementation phase.

**Why:** The project profile used to generate the intent check was out of date. A live read of AlertHistory.jsx and App.jsx confirmed both items were in place before any implementation work started.

**How to apply:** At the start of any audit or bug-fix scope task, read the flagged files directly before finalising the scope. Only include items in scope that are genuinely unimplemented or broken after live verification. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.6]
- [01KTHR0MW1VZTD49FSZFBHHPQ9] **Before renaming or restructuring a mock data export (e** -- Before renaming or restructuring a mock data export (e.g. renaming `mockUser` to `mockUsers`), grep all source files for the old import name. In this task, `Settings.jsx` was silently importing `mockUser` directly from `mock-data.js` — it would have broken without notice if the rename was applied without checking. The fix was to migrate it to read from `currentUser` via `useAuth()`.

**Why:** Mock data exports are consumed ad-hoc across pages without a barrel index, making the dependency graph invisible to static analysis. A rename with no consumer check causes silent import failures (undefined values, not errors) that slip past build checks.

**How to apply:** Run `grep -r "mockUser\b" src/` (or equivalent for the old export name) before the rename. For each consumer: if it's a protected-route page, migrate it to the auth context or relevant provider; if it's a utility file, update the import directly. [source: task-add-authentication-and-admin-view-01kt54czr1xn, importance: 0.6]
- [01KTHR0VXNC89W7X7J2VG1YX3R] **Standard-tier multi-file features can skip design and architecture stages whe...** -- Standard-tier multi-file features can skip design and architecture stages when: (a) all required UI patterns already exist in the codebase (no novel components needed), (b) the core architectural pattern is already in place (e.g. a ProtectedRoute already exists; admin is a role check on an existing context), and (c) all changes are confined to a single subsystem. In this task, the admin panel followed `AlertHistory.jsx` layout exactly; `ProtectedRoute` was already wired; auth context extension was mechanical. Skipping design and architecture saved two stage cycles with no quality loss.

**Why:** Design stage adds value when novel layout/component decisions must be made. Architecture adds value when system boundaries or data flows are genuinely new. When both conditions are absent, the stages produce boilerplate that delays implementation.

**How to apply:** At scope time, check: (1) Is there an existing page with the same layout? (2) Does the auth/data pattern already exist? (3) Are all changes within one subsystem? If all three yes → skip design and architecture. Classify as `standard` tier (not trivial — trivial is single-file). [source: task-add-authentication-and-admin-view-01kt54czr1xn, importance: 0.6]

