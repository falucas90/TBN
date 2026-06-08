---
defract:
  id: task-fix-app-crash-supabase-not-configured-01ktmrg6xpjh
  type: bug
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-there-it-is-15
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-there-it-is-15`.

- Epic: auth
- Module: auth
- Labels: backend

Original paste from the builder:

> There it is — the real problem, and it's got nothing to do with Vite or git.There it is — the real problem, and it's got nothing to do with Vite or git. The app is crashing because Supabase isn't configured.

# Fix app crash: Supabase not configured

## What We're Building

When Supabase credentials are missing from the environment, the app currently crashes on startup before rendering anything. We are adding a graceful fallback so the app loads and stays fully usable for local development even without Supabase credentials — falling back to the existing mock data and simulated authentication instead of crashing.

## Expected Outcome

- The app starts and renders normally when no Supabase credentials are present in the environment
- Developers can browse all pages and interact with the app using mock data without needing to configure Supabase first
- When Supabase credentials are provided, the app behaves exactly as before — real authentication and data sources work unchanged
- The app does not show an unhandled error or white screen on startup in an unconfigured environment

## Out of Scope

- Setting up or configuring an actual Supabase project or credentials
- Migrating data or authentication to Supabase (that work is already done)
- Adding a visible "running in demo mode" banner or user-facing indicator
