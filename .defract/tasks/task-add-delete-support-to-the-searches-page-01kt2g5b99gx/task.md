---
defract:
  id: task-add-delete-support-to-the-searches-page-01kt2g5b99gx
  type: task
  status: active
  stage: release
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-add-delete-support-3
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: null
  assignee: null
---


## Story Brief

Promoted from backlog item `bli-add-delete-support-3`.

- Module: src/pages/Searches.jsx
- Labels: starter

Original paste from the builder:

> Searches.jsx lets users pause and resume searches but provides no way to delete one. Add a delete handler and a ghost-variant button alongside the existing Editar button on each search card.

# Add delete support to the Searches page

# Add delete support to the Searches page

## What We're Building

Users can currently pause and resume their saved searches, but have no way to permanently remove one. This task adds a delete action to each search card so users can remove searches they no longer need.

## Expected Outcome

- Each search card displays a "Eliminar" button alongside the existing "Editar" button
- Clicking "Eliminar" removes that search from the list immediately
- A confirmation toast appears after deletion so the user knows the action succeeded
- The search count in the page subtitle updates to reflect the new total

## Phase Outcomes

- **Phase 1: Add delete button and handler to each search card** — Users gain a clearly labelled "Eliminar" button on every search card that removes the search immediately and confirms the action with a toast notification. The page subtitle reflects the updated count automatically.

## Out of Scope

- Confirmation dialogs or undo/undo-delete flows — deletion is immediate with a toast only
- Persisting deletions to any backend or local storage — the list resets on page reload
- Bulk deletion of multiple searches at once

## Scope Summary

**Size:** 4 requirements, 5 acceptance criteria, 1 implementation phase
**Key decisions:**
- Use ghost variant (already exists on the Editar button) rather than danger variant, per the builder's brief
- Toast type is `warn` to signal permanence, consistent with how the existing pause action uses `warn`
- No icon on the Eliminar button — Editar has no icon; maintaining consistency within the ghost row
**Biggest risk:** Minimal — entirely contained in one file with a proven state-mutation pattern already present

## Context

`Searches.jsx` already manages search state locally via `useState(initialMockSearches)` and wires `useToast` from `ToastContext`. The existing `toggleSearchStatus` handler demonstrates the exact pattern: mutate `searches` state and call `addToast`. The `Button` component already defines `ghost` and `danger` variants in `src/components/ui/Button.jsx`. The page subtitle at line 33 uses `searches.length` directly, so it updates for free once the delete filters the array. No new files or components are needed.

## Requirements

### Delete handler

- R1: `Searches.jsx` exposes a `deleteSearch(id)` function that filters the search with the given id out of the `searches` state array. (Pattern mirrors `toggleSearchStatus` at line 14.)
- R2: After filtering, `deleteSearch` calls `addToast('Pesquisa eliminada.', 'warn')` to confirm the action to the user.

### Delete button

- R3: Each search card renders a ghost-variant `Button` labelled "Eliminar" immediately after the "Editar" link button, visible for both active and paused searches. (Insert after line 92 in `Searches.jsx`.)
- R4: The "Eliminar" button is wired to `deleteSearch(search.id)` via its `onClick` handler.

## Acceptance Criteria

- [ ] Each search card shows an "Eliminar" button with `variant="ghost"` placed after the "Editar" button — verified by inspecting the rendered button row in the browser.
- [ ] Clicking "Eliminar" on any card removes that card from the list immediately, with no page reload required.
- [ ] A toast notification reading "Pesquisa eliminada." appears after deletion.
- [ ] The page subtitle (e.g., "Está a acompanhar 2 pesquisas em 2 plataformas.") updates its count to reflect the deletion.
- [ ] The "Eliminar" button is present on both active and paused search cards.

## Implementation Phases

### Phase 1: Add delete button and handler to each search card
**Scope:** Add a `deleteSearch` handler and a ghost "Eliminar" button to `Searches.jsx`. No new files or components required.
**Files:**
- `src/pages/Searches.jsx` — add `deleteSearch` function, add `<Button variant="ghost">` after the Editar link
**Verification:**
- Clicking "Eliminar" on a card removes it from the list immediately
- Toast "Pesquisa eliminada." appears on deletion
- Subtitle count decrements (e.g., 2 → 1) after a deletion
- Button appears on both active and paused cards
**Estimated effort:** Small

## Edge Cases

- Last search deleted: the searches list renders empty; the subtitle reads "Está a acompanhar 0 pesquisas em 2 plataformas." — this is acceptable behavior for now since empty-state UI is out of scope.
- Rapid double-click: React state updates are synchronous on user events; the second click targets a card that will already be gone from the array, so it is a no-op.

## Technical Notes

`deleteSearch` should follow the exact same pattern as `toggleSearchStatus`:

```js
const deleteSearch = (id) => {
  setSearches(prev => prev.filter(s => s.id !== id));
  addToast('Pesquisa eliminada.', 'warn');
};
```

The toast type `'warn'` maps to `var(--color-warn-bg)` / `var(--color-warn-text)` in `ToastContext.jsx`, consistent with the existing pause action. The `danger` variant on Button was considered but the builder's brief explicitly requested ghost, which also keeps the delete button visually lighter and consistent with the adjacent Editar button.

## Implementation Notes

## Phase 1: Add delete button and handler to each search card

### Changes made

**`src/pages/Searches.jsx`**

- Added `deleteSearch(id)` function immediately after `toggleSearchStatus`. It filters the search with the given id out of the `searches` state array, then calls `addToast('Pesquisa eliminada.', 'warn')` — mirroring the exact pattern used by `toggleSearchStatus`.
- Added a `<Button variant="ghost" onClick={() => deleteSearch(search.id)}>Eliminar</Button>` immediately after the existing `<Link to={...}><Button variant="ghost">Editar</Button></Link>` block. The button is outside the active/paused conditional branches so it appears on both card states.

### Deviations from plan

None. Implementation followed the spec exactly.

### Build

Vite production build passed. Pre-existing ESLint warning (`React` unused import) was present before this change and was not modified.

## Review

## Verdict

**Verdict:** APPROVE
**Files reviewed:** 1 files changed across 1 phases

All 5 acceptance criteria pass on re-review. The deleteSearch handler and Eliminar ghost button are correctly implemented — ghost variant, correct toast text, placed outside the active/paused conditional so both card states show it. Production build passes; all ESLint errors are pre-existing baseline.

### Automated Checks

| Check | Result | Details |
|-------|--------|---------|
| Production build | PASS | Vite built successfully: 1773 modules, dist/index.html 0.46 kB |
| Lint | FAIL | 77 problems (75 errors, 2 warnings) — all pre-existing before this task. Zero new lint errors introduced. |

### Acceptance Criteria (5/5 passed)

- [x] AC-1: Each search card shows an "Eliminar" button with variant="ghost" placed after the "Editar" button — verified by inspecting the rendered button row in the browser. — PASS: Searches.jsx:98 — <Button variant="ghost" onClick={() => deleteSearch(search.id)}>Eliminar</Button> placed directly after the Editar link block at lines 95-97.
- [x] AC-2: Clicking "Eliminar" on any card removes that card from the list immediately, with no page reload required. — PASS: Searches.jsx:25-28 — deleteSearch calls setSearches(prev => prev.filter(s => s.id !== id)), triggering a React state update and immediate re-render without a page reload.
- [x] AC-3: A toast notification reading "Pesquisa eliminada." appears after deletion. — PASS: Searches.jsx:27 — addToast('Pesquisa eliminada.', 'warn') with exact text and 'warn' type as specified.
- [x] AC-4: The page subtitle (e.g., "Está a acompanhar 2 pesquisas em 2 plataformas.") updates its count to reflect the deletion. — PASS: Searches.jsx:38 — subtitle interpolates {searches.length} directly; React re-renders it on every state update to the searches array.
- [x] AC-5: The "Eliminar" button is present on both active and paused search cards. — PASS: Searches.jsx:98 — button is placed after the isActive conditional block (lines 87-94), outside of it, so it renders on both active and paused cards.

### Code Quality (Refactor Review)

No code quality issues found in changed files.

### Security Assessment (Security Review)

No security issues found in changed files.

### Decisions Made During Implementation

- Ghost variant (not danger) used for Eliminar button — per builder's brief and to match the adjacent Editar button visually
- Toast type 'warn' signals permanence without implying failure — consistent with the existing pause action convention

## Required Changes

None.

