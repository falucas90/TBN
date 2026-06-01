---
defract:
  id: task-add-a-catch-all-redirect-route-in-app-01kt2gckza2g
  type: improvement
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-add-a-catch-2
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: null
  assignee: null
---

## Story Brief

Promoted from backlog item `bli-add-a-catch-2`.

- Module: src/App.jsx

Original paste from the builder:

> App.jsx defines no fallback route, so navigating to an unknown path renders a blank page. Add a <Route path="*"> that redirects to / to handle this gracefully.

# Add a catch-all redirect route in App.jsx

## What We're Building

When users navigate to a URL that does not match any known page in the app, they currently see a blank screen. We are adding a fallback route so that any unknown URL automatically redirects the user to the home page, giving them a clean starting point instead of a dead end.

## Expected Outcome

- Navigating to any unknown URL (e.g. `/not-a-real-page`) automatically sends the user to the home page
- The blank-screen experience for unrecognised paths is eliminated
- Existing navigation to known pages continues to work as before

## Out of Scope

- Custom 404 error pages or "not found" messaging — the redirect silently sends users home
- Backend routing or server-side redirect rules — this change is client-side only
- Changes to any page beyond the routing configuration
