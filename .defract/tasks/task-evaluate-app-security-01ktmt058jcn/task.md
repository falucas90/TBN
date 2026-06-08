---
defract:
  id: task-evaluate-app-security-01ktmt058jcn
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-evaluate-security-of-14
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-evaluate-security-of-14`.

- Epic: auth
- Module: auth
- Labels: security, audit

Original paste from the builder:

> evaluate security of the app

# Evaluate app security

## What We're Building

A structured security audit of the autoseek application, covering authentication flows, access control, data handling, and client-side risks. The audit will identify vulnerabilities and weaknesses across the app as it currently exists, and produce a prioritised list of findings with remediation guidance.

## Expected Outcome

- A complete inventory of security findings, each rated by severity (critical, high, medium, low)
- Each finding includes a plain-language description of the risk, the affected area, and a concrete remediation recommendation
- Access control gaps — such as routes or actions that can be reached by users without the required role — are explicitly called out
- Data exposure risks — including anything sensitive stored or transmitted insecurely — are identified
- The audit distinguishes between findings that require code changes and findings that require infrastructure or backend configuration

## Out of Scope

- Penetration testing or live exploitation of the app in a deployed environment
- Security review of third-party services (Supabase, Google OAuth) beyond how the app integrates with them
- Writing the fixes — the audit produces findings and recommendations only; remediation is a separate task
