---
defract:
  id: task-fix-login-page-layout-email-and-01ktht16jwgh
  type: bug
  status: active
  stage: release
  phase: 0
  total_phases: 1
  priority: normal
  source: backlog
  source_id: bli-i-think-the-12
  branch_strategy: worktree
  mode: human-in-the-loop
  created_by: falucas90
  assignee: falucas90
---

## Story Brief

Promoted from backlog item `bli-i-think-the-12`.

- Epic: auth
- Module: auth
- Labels: ui, layout

Original paste from the builder:

> i think the main page is not adjusted correctly like the the places to incert the email and password are too small

# Fix login page layout: email and password inputs too small

# Fix login page layout: email and password inputs too small

## What We're Building

The login page form area is too narrow, making the email and password fields feel cramped and difficult to interact with. We are resizing the form container and inputs so they feel comfortable and properly proportioned on the page.

## Expected Outcome

- The email and password input fields are visibly wider and easier to click into and type in
- The login form as a whole feels balanced and well-proportioned against the left branding panel
- The page remains usable and well-aligned on standard laptop and desktop screen sizes

## Phase Outcomes

- **Phase 1: Widen the login form** — Builders and end-users see email and password fields that fill a comfortable width on the right-side panel, no longer appearing pinched or undersized relative to the available space.

## Out of Scope

- No changes to login logic, authentication flow, or error handling
- The signup page is not included in this fix
- No changes to the left branding panel content or statistics

## Scope Summary

**Size:** 4 requirements, 4 acceptance criteria, 1 implementation phase
**Key decisions:**
- Increase form container max-width from 380px to 460px — enough to feel spacious on a half-screen column without stretching on smaller viewports
- Apply the existing `.input` CSS class from global.css to both inputs for consistent height, focus states, and design-system tokens
**Biggest risk:** None significant — single-file CSS layout change with no logic or data dependencies.

## Context

`src/pages/Login.jsx` uses fully inline styles and does not reference the `.login-shell`, `.login-left`, `.login-right`, or `.input` CSS classes already defined in `src/styles/global.css` (lines 74–83 and 222–224). The form wrapper on line 67 constrains its width to `maxWidth: '380px'`; on a 1440px viewport the right pane is roughly 720px wide, so inputs fill only ~53% of the available column. The `.input` class provides a consistent 36px height, proper padding, hover/focus states using design tokens, and placeholder colour — none of which the inline-styled inputs currently carry.

## Requirements

### Layout

- R1: The form container's maximum width must be increased from 380px to 460px so inputs are visibly wider without feeling stretched on standard viewports.
- R2: The `padding` on the right pane outer wrapper must remain at `2rem` so the form stays centred and breathes against the viewport edge.

### Input Styling

- R3: Both the email input and the password input must carry the `.input` CSS class from `global.css` so they inherit consistent height, padding, focus outline, and placeholder colour. Redundant inline style properties already covered by `.input` (border, padding, border-radius, width, outline) must be removed to avoid conflicts.
- R4: The password input's containing `div` uses `position: relative` for the "show" overlay; this must be preserved after applying `.input` to the inner `<input>` element.

## Acceptance Criteria

- [ ] On a 1440px viewport, the email and password inputs are each visually wider than 420px (previously constrained to ~350px by the 380px container minus padding).
- [ ] Both inputs display the emerald focus ring (`border-color: var(--emerald); background: var(--slate)`) on focus, matching the `.input:focus` rule in `global.css`.
- [ ] The "show" span overlay on the password field remains correctly positioned after the style change.
- [ ] The left branding panel, footer links, and error message paragraph are unchanged.

## Implementation Phases

### Phase 1: Widen form container and align inputs to design system
**Scope:** Increase `maxWidth` on the form wrapper from 380px to 460px and apply the `.input` CSS class to both input elements, removing inline style properties made redundant by the class.
**Files:**
- `src/pages/Login.jsx` — update `maxWidth` on the form wrapper div (line 67); add `className="input"` and strip redundant inline styles from the email input (line 73–79) and password input (line 83–89).
**Verification:**
- [ ] `npm run lint` passes with no new errors
- [ ] Dev server renders the login page with visibly wider inputs on a 1440px viewport
- [ ] Focus on either input shows the emerald border and slate background from the design system
- [ ] Password "show" overlay remains vertically centred over the input
**Estimated effort:** Small

## Edge Cases

- Viewports narrower than 460px: the form container will shrink to fit naturally because no `min-width` is set — no change needed.
- The `box-sizing: border-box` reset in `global.css` line 3 already applies to inputs, so adding `.input` (which sets `width: 100%`) will not cause overflow inside the relative-positioned password wrapper.

## Technical Notes

The `.input` class in `global.css` sets `height: 36px` and `padding: 0 12px`. The current inline inputs use `padding: '0.75rem'` (12px top/bottom) with no explicit height, so the visual height change will be subtle — the switch standardises on the design system value. If the builder prefers a taller input (e.g. 42–44px for a more prominent login feel), a small inline `style={{ height: '42px' }}` override on top of `.input` is the right approach rather than modifying the shared class.

The `.login-shell`, `.login-left`, and `.login-right` classes in `global.css` lines 222–224 are correct structural equivalents of the current inline layout, but migrating to them is out of scope for this fix — it would touch the entire page structure and belongs in a separate cleanup task.

## Implementation Notes

## Phase 1: Widen form container and align inputs to design system

**Files changed:** `src/pages/Login.jsx`

**Changes made:**
- Form wrapper `maxWidth` increased from `380px` to `460px` (line 99)
- Email input: added `className="input"`, removed inline `style` prop (border, padding, borderRadius, outline, width — all covered by `.input`)
- Password input: added `className="input"`, removed inline `style` prop (same redundant properties); `position: relative` on the wrapping `div` preserved for the "show" overlay

**No deviations from plan.** The `.input` class in `global.css` provides `width: 100%; height: 36px; padding: 0 12px; border; border-radius; outline; focus ring (emerald border + slate background)` — all properties removed from inline styles.

## Review

## Verdict

**Verdict:** APPROVE
**Files reviewed:** 1 files changed across 1 phases

All four acceptance criteria pass. The form container max-width is correctly widened to 460px and both inputs carry the `.input` CSS class, removing redundant inline styles. No new lint errors introduced; production build succeeds.

### Automated Checks

| Check | Result | Details |
|-------|--------|---------|
| Lint | PASS | 0 new errors; 107 pre-existing errors unchanged |
| Production build | PASS | vite build succeeded — 1824 modules transformed |

### Acceptance Criteria (4/4 passed)

- [x] AC-1: On a 1440px viewport, the email and password inputs are each visually wider than 420px (previously constrained to ~350px by the 380px container minus padding). — PASS: Login.jsx:99 — maxWidth changed from 380px to 460px. On a 1440px viewport the right pane is ~720px, so the container reaches its 460px max; both inputs carry className='input' (width: 100%), rendering at 460px > 420px.
- [x] AC-2: Both inputs display the emerald focus ring (border-color: var(--emerald); background: var(--slate)) on focus, matching the .input:focus rule in global.css. — PASS: Login.jsx:107 and 117 — className='input' applied to email and password inputs. global.css:83 — .input:focus sets border-color: var(--emerald); background: var(--slate).
- [x] AC-3: The 'show' span overlay on the password field remains correctly positioned after the style change. — PASS: Login.jsx:114 — wrapping div retains style={{ position: 'relative' }}. Login.jsx:122 — span retains position: absolute, right: 12px, top: 12px; vertically centered within the 36px input height.
- [x] AC-4: The left branding panel, footer links, and error message paragraph are unchanged. — PASS: git diff shows only three hunks changed (maxWidth on line 99, className+style on email input, className+style on password input). Left pane (lines 58–94), footer (lines 167–175), and error paragraph (lines 129–131) are byte-identical to pre-change.

### Code Quality (Refactor Review)

No code quality issues found in changed files.

### Security Assessment (Security Review)

No security issues found in changed files.

### Decisions Made During Implementation

- Increase form container max-width from 380px to 460px — enough to feel spacious on a half-screen column without stretching on smaller viewports.
- Apply the existing .input CSS class from global.css to both inputs, removing redundant inline style properties (border, padding, borderRadius, outline, width) to avoid conflicts.

## Required Changes

None.

## Release

## Release Notes

### What was built
- Login page form container widened from 380px to 460px so email and password inputs occupy a comfortable proportion of the right panel column
- Email input aligned to design system by applying the `.input` CSS class from `global.css`, removing redundant inline styles (border, padding, borderRadius, outline, width)
- Password input aligned to design system in the same way; the wrapping `div` retains `position: relative` for the "show" overlay
- Both inputs now inherit consistent height (36px), padding, focus ring (emerald border + slate background), and placeholder colour from the shared `.input` class

### Key decisions
- Increase form container max-width from 380px to 460px — comfortable on a half-screen column without stretching on smaller viewports
- Apply the existing `.input` CSS class to both inputs instead of maintaining parallel inline styles — avoids style conflicts and aligns with the design system

### Changes by phase
- **Phase 1: Widen form container and align inputs to design system** — `src/pages/Login.jsx` only: maxWidth raised from 380px to 460px on the form wrapper; `className="input"` added to both email and password inputs; redundant inline style properties removed; password wrapper `position: relative` preserved

## Verification

| Check | Result |
|-------|--------|
| Approved review | PASS — Verdict: APPROVE, 4/4 acceptance criteria, 2026-06-08T22:52:08Z |
| Production build | PASS — vite build succeeded, 1824 modules transformed |
| Code pushed | PASS — branch pushed to origin |

