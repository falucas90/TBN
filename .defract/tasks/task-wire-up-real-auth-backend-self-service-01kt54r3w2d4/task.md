---
defract:
  id: task-wire-up-real-auth-backend-self-service-01kt54r3w2d4
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-real-backend-or-7
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-real-backend-or-7`.

- Epic: auth
- Module: auth
- Labels: mock-data, admin, self-service

Original paste from the builder:

> Real backend or API integration — credentials and user data remain mocked in the frontend
> Password reset, email verification, or account self-service flows
> Role management UI — admin status is assigned in mock data, not configurable via the UI

# Wire up real auth backend, self-service flows, and role management

## What We're Building

Replacing the fully mocked authentication layer with a real backend integration so that user credentials, sessions, and account data are persisted and verified server-side. Alongside the backend wire-up, the app gains self-service account flows — password reset and email verification — and an admin interface for managing user roles, removing the need to hard-code admin status in frontend data files.

## Expected Outcome

- Users can register and log in with real credentials that are verified by a backend
- Authenticated sessions persist correctly across page refreshes and browser restarts
- Users can request a password reset and complete it via an emailed link without contacting an admin
- New accounts require email verification before gaining full access
- Admins can view and change user roles directly in the application settings, without editing source files

## Out of Scope

- Building the backend service itself — this task assumes a backend API (or third-party auth provider) will be chosen and integrated, not authored from scratch
- New dealer-facing features unrelated to authentication (search creation, alert history, ISV calculator)
- Multi-factor authentication or advanced security hardening beyond basic self-service flows
