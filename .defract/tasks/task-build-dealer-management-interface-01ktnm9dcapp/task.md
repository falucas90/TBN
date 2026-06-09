---
defract:
  id: task-build-dealer-management-interface-01ktnm9dcapp
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 1
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

## What We're Building

The current admin panel shows a basic list of registered users with toggles for role and account status, but gives administrators no visibility into what each dealer is actually doing on the platform. This task extends the admin section into a proper dealer management interface: admins can see each dealer's subscription plan, manage it, and get a quick read on their activity (number of active searches and recent alerts) without leaving the admin page.

## Expected Outcome

- Administrators can view and update the subscription plan assigned to each dealer account directly from the admin table
- Each dealer row shows a summary of how many active searches and alerts that dealer has, giving admins a snapshot of engagement at a glance
- Clicking on a dealer row opens a side panel or detail view with more information about that dealer's account and activity
- Changes to plan or status are confirmed with feedback so the admin knows the action succeeded or failed

## Out of Scope

- Building a separate dealer-facing portal or any UI changes visible to non-admin users
- Billing integration or actual payment processing tied to plan changes
- Dealer creation or invitation flow (adding new dealers from the admin panel)
