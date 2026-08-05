# Tech Debt

## From fix-batch-1 code review (PR #36), non-blocking

- `supabase/functions/update-user-role/index.ts`'s `update-role` action sets
  `app_metadata.role = 'admin'` *before* clearing the target's
  `profiles.company_id`/`company_role`. If the tenancy clear then fails, the
  caller correctly gets a 500 (no false success), but the user is left
  mid-state — already flagged admin while still resolving to their old
  company via `current_company_id()` until the call is retried. Not a
  regression (no worse than pre-promotion access) and the failure window is
  narrow, but reordering (clear tenancy first, then flip the role) would
  close it entirely. Small change, low urgency.
- `src/App.test.jsx`'s `DEALER_ROUTES` covers 6 of the 7 dealer URL patterns
  the `DealerRoute` guard protects — `/searches/:id/edit` isn't exercised by
  a test case, even though the guard correctly wraps it in `App.jsx`. Add
  the missing test case.

## From the 2026-08-04 product/design state audit (PR #36)

Not urgent — no founder decision needed, revisit opportunistically.

- **53% of the `ui/`+`forms/` component library is unused** (`Badge`, `Card`,
  `SegmentedControl`, `Slider`, `StatCard`, `StepIndicator`, `Toggle`,
  `CurrencyInput`, `PlatformCheckbox`) — everything shipped runs on the
  parallel `Primitives.jsx` kit instead. Before deleting: confirm none of it
  represents an abandoned decision worth reviving (e.g. `Slider` for
  margin/threshold inputs, `CurrencyInput`'s € prefix, `StepIndicator` for
  CreateSearch's 4-step form) — design-lead flagged this, not decided it.
- A second, disjoint set of design tokens referenced only by the unused
  components above (`--color-bg-card`, `--shadow-sm`, `--accent`,
  `--accent-dim`, `--surface-3`, `--text-muted`, `--border-subtle`) doesn't
  exist in `tokens.css`. Only worth fixing if/when those components get
  revived; dead otherwise.
- Two icon systems coexist (`Primitives.jsx`'s hand-rolled `Icon` vs.
  `lucide-react`, imported directly by `MobileNav`, `VerifyEmail`,
  `FeedbackWidget`, `Callout`, `ToastContext`) — the same nav item renders a
  different icon on desktop vs. mobile (Sidebar vs. MobileNav).
- Loading-skeleton/empty-state styling is copy-pasted byte-for-byte across
  5 screens instead of extracted into a shared component.
- `admin.css` and most of `app.css` (`.dash-pipeline`, `.dash-grid-2`,
  `.isv`) define zero responsive breakpoints — Dashboard's lower sections
  and every Admin screen's grids don't reflow on narrow viewports. A
  `.isv-grid` class with the correct breakpoint already exists in
  `global.css` but is dead CSS, never referenced.
- `AlertsContext`'s `clearUnread` export is never called — the mobile
  unread badge only resets when the tab closes or the company changes.
- `AlertHistory`'s "Todos / Abertos / Descartados" filter sets state the
  filtering logic never reads (folds into the alert-triage UI spec above —
  fix there, not as a standalone patch).
- Account deletion and "remove member" use plain click-to-confirm even
  though `ConfirmDialog` already supports typed confirmation
  (`confirmText`) and the deletion copy calls the action irreversible.
  Worth adding typed confirmation, low urgency.
- `IsvCalculator`'s "URL do anúncio" input mode, "Guardar estimativa," and
  "Importar histórico" are UI-only stubs (toast, no persistence/parsing).
  Either wire them up or hide them — currently they imply capability that
  doesn't exist. Low urgency while in closed beta with a small user set.
- Two independent `SieveMark`/`Wordmark` implementations
  (`Logo.jsx` vs. `Primitives.jsx`) instead of one shared one.
- `docs/SECURITY.md` finding S-16 is marked TODO but looks closed in code
  (`src/lib/supabase.js` already throws on `PROD && !supabaseConfigured`);
  `docs/BETA_CHECKLIST.md` step 15 says non-admins redirect to `/searches`,
  `AdminRoute` actually redirects to `/dashboard`. Worth a docs pass to
  reconcile both docs with current code.
