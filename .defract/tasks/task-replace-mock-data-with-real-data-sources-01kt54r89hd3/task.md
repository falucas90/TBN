---
defract:
  id: task-replace-mock-data-with-real-data-sources-01kt54r89hd3
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-prep-to-coneect-6
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-prep-to-coneect-6`.

- Epic: data
- Labels: mock-data

Original paste from the builder:

> Prep to coneect to real data not fake

# Replace Mock Data with Real Data Sources

## What We're Building

All live data in the app — saved searches, vehicle alerts, and user profile — currently comes from a hardcoded file with placeholder values. This task replaces that with a proper data layer connected to real sources, so dealers see their actual saved searches and live alert history rather than fictional sample data.

**Open question for the builder:** What are the real data sources? Options include (a) a backend API you control, (b) a third-party service like Supabase or Firebase, or (c) direct calls to the marketplace APIs (Mobile.de, AutoScout24). The implementation phases depend on this choice.

## Expected Outcome

- Dealers who log in see their own saved searches, not placeholder BMW/Renault entries.
- The alert history shows real vehicle matches sourced from the configured marketplaces.
- User profile data (name, company, plan) reflects the authenticated dealer's actual account.
- Adding or pausing a search persists across page reloads and browser sessions.
- The app is ready to receive live marketplace data without further structural changes.

## Out of Scope

- Integrating directly with Mobile.de or AutoScout24 marketplace APIs (that is a separate backend task).
- Authentication overhaul — the login flow is addressed in a parallel task; this task only wires up the data layer.
- Building a new admin or dealer management interface.
