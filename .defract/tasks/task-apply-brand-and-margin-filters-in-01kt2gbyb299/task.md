---
defract:
  id: task-apply-brand-and-margin-filters-in-01kt2gbyb299
  type: bug
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-apply-brand-and-1
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: null
  assignee: null
---

## Story Brief

Promoted from backlog item `bli-apply-brand-and-1`.

- Module: src/pages/AlertHistory.jsx

Original paste from the builder:

> filterBrand and filterMargin state is declared in AlertHistory.jsx but never applied — mockAlerts is passed to .reduce() unfiltered. Wire the two selects so they actually narrow the displayed alert list.

# Apply brand and margin filters in AlertHistory

## What We're Building

The alert history page has two filter controls — one for vehicle brand and one for minimum margin — that are already visible in the UI but have no effect on the results shown. This task connects those controls to the alert list so that selecting a brand or a margin threshold narrows the displayed alerts accordingly.

## Expected Outcome

- Selecting a brand from the brand filter shows only alerts matching that brand; selecting "Todas as Marcas" restores all alerts
- Selecting a margin threshold shows only alerts whose estimated margin meets or exceeds that value; selecting "Qualquer Margem" restores all alerts
- Both filters can be active at the same time, narrowing results by brand AND margin together
- When no alerts match the active filters, the page shows a clear empty state rather than a blank area

## Out of Scope

- Adding new filter options (additional brands, new margin thresholds) beyond what the selects already list
- Persisting filter selections across page navigation or browser sessions
- Connecting filters to a live backend or real data source
