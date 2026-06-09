---
defract:
  id: task-add-multi-factor-authentication-and-01ktnm9jwcje
  type: task
  status: active
  stage: scope
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-multi-factor-authentication-8
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-multi-factor-authentication-8`.

- Epic: auth
- Module: auth
- Labels: security, mfa

Original paste from the builder:

> Multi-factor authentication or advanced security hardening beyond basic self-service flows

# Add multi-factor authentication and advanced security hardening

## What We're Building

Users can protect their accounts with a second authentication factor using a standard authenticator app (Google Authenticator, Authy, or similar). After enabling MFA, every login requires both a correct password and a valid time-based one-time code. The task also covers a set of targeted security hardening measures applied to the existing login and signup flows.

## Expected Outcome

- Users can enroll an authenticator app from the Settings page by scanning a QR code
- Users who have MFA enabled are prompted for a 6-digit code after entering their password during login
- Users can disable MFA from Settings when they no longer want it
- The login page enforces a lockout after repeated failed attempts, with a clear message guiding the user to wait before retrying
- The signup page enforces a minimum password strength requirement and shows real-time feedback as the user types

## Out of Scope

- SMS or email-based one-time codes — only authenticator app (TOTP) is included
- Backup or recovery codes for users who lose access to their authenticator app
- Admin-side enforcement or visibility of which accounts have MFA enabled
