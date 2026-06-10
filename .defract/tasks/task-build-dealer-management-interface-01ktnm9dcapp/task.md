---
defract:
  id: task-build-dealer-management-interface-01ktnm9dcapp
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 2
  priority: normal
  source: backlog
  source_id: bli-building-a-new-9
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-building-a-new-9`.

- Epic: dealers
- Module: admin
- Labels: admin, dealer

Original paste from the builder:

> Building a new admin or dealer management interface.

# Build dealer management interface

# Build dealer management interface

## What We're Building

The current admin panel shows a basic list of registered users with toggles for role and account status, but gives administrators no visibility into what each dealer is actually doing on the platform. This task extends the admin section into a proper dealer management interface: admins can see each dealer's subscription plan, manage it, and get a quick read on their activity (number of active searches and recent alerts) without leaving the admin page.

## Expected Outcome

- Administrators can view and update the subscription plan assigned to each dealer account directly from the admin table
- Each dealer row shows a summary of how many active searches and alerts that dealer has, giving admins a snapshot of engagement at a glance
- Clicking on a dealer row opens a side panel or detail view with more information about that dealer's account and activity
- Changes to plan or status are confirmed with feedback so the admin knows the action succeeded or failed

## Phase Outcomes

- **Phase 1: Enrich the dealer table with stats and plan editing** — Admins can see at a glance how many active searches and recent alerts each dealer has, and can update a dealer's subscription plan directly from the list with the same save-and-confirm flow already in place for roles.
- **Phase 2: Dealer detail side panel** — Clicking any dealer row opens a focused side panel that surfaces all account details and activity data in one place, making it easier to assess and manage individual accounts without losing context of the full list.

## Out of Scope

- Building a separate dealer-facing portal or any UI changes visible to non-admin users
- Billing integration or actual payment processing tied to plan changes
- Dealer creation or invitation flow (adding new dealers from the admin panel)

## Scope Summary

**Size:** 10 requirements, 7 acceptance criteria, 2 implementation phases
**Key decisions:**
- Activity stats fetched via an extended Edge Function (`update-user-role` with a new `action: 'get-stats'`) to bypass RLS and query other users' data with the service role key
- Plan editing follows the identical pattern to the existing role column — inline select with a dirty-check save button — for UI consistency
- Side panel rendered with `position: fixed` overlay using inline styles, no new CSS file, consistent with the project's styling convention
**Biggest risk:** The stats and plan-update actions require extending a Supabase Edge Function that is deployed server-side; this needs deployment access to the Supabase project alongside the frontend changes.

## Context

`src/pages/Admin.jsx` already renders a six-column table (Nome, Email, Plano, Estado, Função, Ações). The plan column reads `user.user_metadata?.plan || '—'` but is not editable. Role editing and status toggling are fully wired through `authService.listUsers`, `authService.updateUserRole`, and `authService.updateUserStatus`, all of which invoke the `update-user-role` Supabase Edge Function. Activity data (searches, alerts) lives in Supabase tables owned by `user_id` and is accessible only via the service role key, since regular queries are gated by RLS. The `listUsers` function short-circuits to return `[]` when Supabase is not configured, so mock mode shows no users — the new functionality follows the same guard convention.

## Requirements

### Activity statistics

- R1: The dealer table gains two new columns — "Pesquisas Ativas" (active searches count) and "Alertas Recentes" (alert count for the past 7 days) — positioned between the Email and Plano columns.
- R2: Stats are fetched in a single batched call after the user list resolves. The `update-user-role` Edge Function receives a new `action: 'get-stats'` with a list of user IDs and returns a map of `userId → { activeSearches, recentAlerts }`.
- R3: If the stats call fails, the two columns display "—" for all rows rather than showing an error state or blocking the page. The existing users table remains fully functional.
- R4: The `SkeletonRow` component in `Admin.jsx` gains two additional placeholder cells to match the expanded column count.

### Plan management

- R5: The "Plano" column becomes an inline `<select>` offering plan options: `free`, `basic`, `pro`. The select is pre-populated with the dealer's current plan from `user_metadata.plan`; an empty or missing plan defaults to the first option.
- R6: A "Guardar" button appears next to the plan select using the same dirty-check pattern as the role column — enabled only when the selected value differs from the persisted value, disabled and labeled "A guardar…" while the request is in flight.
- R7: Saving calls a new `updateUserPlan(userId, plan)` function in `authService.js`, which invokes the Edge Function with `action: 'update-plan'`. Success shows the "Plano atualizado com sucesso." toast (`success` type); failure shows a danger toast. The audit log entry is written by the Edge Function server-side.

### Dealer detail side panel

- R8: Clicking anywhere on a dealer row (excluding the status toggle, role select, plan select, and action buttons) opens a side panel fixed to the right edge of the viewport. The panel covers the content area with a semi-transparent dark overlay behind it.
- R9: The panel displays: dealer name, email, plan badge, role, status, active searches count, and recent alerts count. The plan select, save button, and status toggle from the row are mirrored inside the panel so edits can be made without closing it.
- R10: The panel closes when the user clicks the overlay, presses Escape, or clicks the close button in the panel header. Closing the panel does not discard unsaved plan changes — the row's pending state is preserved.

## Acceptance Criteria

- [ ] The user table shows "Pesquisas Ativas" and "Alertas Recentes" columns with numeric values for each dealer row; columns display "—" when the stats request fails or returns no entry for that user.
- [ ] The SkeletonRow renders the correct number of cells (8 total) matching the expanded table header.
- [ ] The plan column renders a `<select>` with options `free`, `basic`, `pro`; a "Guardar" button appears only when the selected value differs from the value loaded from the server.
- [ ] Saving a plan change shows "Plano atualizado com sucesso." toast on success and a danger toast on failure; the select reverts to the saved value on failure.
- [ ] Clicking a dealer row (outside action controls) opens the side panel; the overlay click and Escape key close it.
- [ ] The side panel displays name, email, plan, role, status, active searches count, and recent alerts count for the selected dealer.
- [ ] The side panel's plan select and status toggle fire the same handlers as the table row; pending plan state is shared between the row and the panel.

## Implementation Phases

### Phase 1: Enrich the dealer table with stats and plan editing
**Scope:** Add the two activity-count columns to the dealer table, make the plan field editable with a save flow, and extend the authService with the two new functions (`getDealerStats`, `updateUserPlan`). This phase delivers standalone value — the table is fully enriched without the side panel.
**Files:**
- `src/pages/Admin.jsx` — add stats state and fetch, expand table headers and rows, add plan editing column, update SkeletonRow
- `src/services/authService.js` — add `getDealerStats(userIds)` and `updateUserPlan(userId, plan)`
**Verification:**
- Loading the admin Users tab fetches stats alongside users; numeric values appear in the two new columns.
- Changing a dealer's plan and clicking "Guardar" shows the success toast and the select reflects the saved value.
- Triggering a stats-fetch failure (e.g. by temporarily removing Supabase config) shows "—" in both stat columns without breaking the rest of the table.
- SkeletonRow shows 8 cells; no layout misalignment during the loading state.
**Estimated effort:** Medium

### Phase 2: Dealer detail side panel
**Scope:** Implement the slide-in side panel that opens on row click, displays all dealer account and activity data, and mirrors the plan-edit and status-toggle controls from the table row.
**Files:**
- `src/pages/Admin.jsx` — add `selectedDealer` state, row click handler, overlay and panel JSX, Escape key listener, shared pending-plan state between row and panel
**Verification:**
- Clicking a row (not on an action control) opens the panel; clicking the overlay or pressing Escape closes it.
- The panel displays the correct name, email, plan, role, status, and stats for the clicked dealer.
- Editing the plan in the panel and saving updates the row in the table.
- No console errors on open, close, or re-open.
**Estimated effort:** Medium

## Edge Cases

- Admin clicks their own row: the panel opens and shows their account; the role select should remain functional (existing self-demotion warning toast is already handled).
- Dealer with no searches or alerts: stat columns show `0`, not blank.
- Stats fetch returns data for a subset of user IDs: rows with no matching entry display "—" without crashing.
- Panel open while the stats are still loading: show "—" in the panel's stat fields until stats resolve.
- Escape key pressed while focus is inside the plan select: close the panel (not suppress the keydown).

## Technical Notes

**Edge Function extension:** `update-user-role` needs two new action branches:
- `action: 'get-stats'` — accepts `{ userIds: string[] }`, queries `searches` (count by `user_id`, `status = 'active'`) and `alerts` (count by `searches.user_id`, `created_at > now() - interval '7 days'`) using the service role key, returns `{ stats: { [userId]: { activeSearches: number, recentAlerts: number } } }`.
- `action: 'update-plan'` — accepts `{ userId, plan }`, calls `updateUserById(userId, { user_metadata: { plan } })`, writes an `audit_logs` row.

**Plan options:** `['free', 'basic', 'pro']` — displayed as-is (lowercase). Adjust labels once the product team confirms naming.

**Styling the side panel:** Use `position: fixed; top: 0; right: 0; height: 100vh; width: 400px` with a `position: fixed; inset: 0` overlay div at lower z-index. Transition with `transform: translateX(...)` if animation is desired, but a static panel is acceptable for now.

**Column order:** Insert stats columns between Email and Plano so the row layout reads: Nome → Email → Pesquisas Ativas → Alertas Recentes → Plano → Estado → Função → Ações.

### Dependencies

The Edge Function deployment step is a prerequisite for Phase 1's `getDealerStats` and `updateUserPlan` to function in a live environment. In mock/no-Supabase mode, both functions short-circuit to return empty stats and a no-op respectively — the UI degrades gracefully.