---
defract:
  id: task-add-authentication-and-admin-view-01kt54czr1xn
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-built-auth-and-5
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-built-auth-and-5`.

- Epic: auth
- Module: auth
- Labels: admin

Original paste from the builder:

> Built AUTH and admin view

# Add authentication and admin view

## What We're Building

The app currently skips the login screen entirely — every visitor lands directly on the dashboard as if already signed in. This task makes authentication real: users must log in with valid credentials before accessing the app, and a distinct admin role unlocks a new admin panel where platform-wide activity and user accounts can be monitored.

## Expected Outcome

- Visiting the app while logged out redirects to the login screen instead of showing the dashboard
- Entering valid credentials logs the user in and lands them on the dashboard
- Logging out returns the user to the login screen and blocks re-entry without credentials
- Admin users see an additional "Admin" section in the navigation sidebar
- The admin panel shows a list of registered dealer accounts with their status and plan

## Out of Scope

- Real backend or API integration — credentials and user data remain mocked in the frontend
- Password reset, email verification, or account self-service flows
- Role management UI — admin status is assigned in mock data, not configurable via the UI
