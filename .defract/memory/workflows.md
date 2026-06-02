# Proven Workflows

## Workflows

- [01KT557E0XWJWDJVV92TJXD7QR] **During audit or scope tasks that rely on a project profile, always do a live ...** -- During audit or scope tasks that rely on a project profile, always do a live codebase read to verify which items are actually implemented before writing the scope. Project profiles can be stale. In this audit task, 2 of 4 items in the intent check (brand/margin filters, catch-all route) were already correctly implemented in the live code — scoping them as "broken" would have produced a no-op implementation phase.

**Why:** The project profile used to generate the intent check was out of date. A live read of AlertHistory.jsx and App.jsx confirmed both items were in place before any implementation work started.

**How to apply:** At the start of any audit or bug-fix scope task, read the flagged files directly before finalising the scope. Only include items in scope that are genuinely unimplemented or broken after live verification. [source: task-audit-codebase-for-needed-improvements-01kt545bmfg1, importance: 0.6]
- [01KT54YNF60ZY0AA4FS53AKKSP] **Trivial single-file UI changes use the bug-fix workflow template (scope → implementation → review → release), skipping design and architecture** -- When a task touches one file, adds ~5 lines, has no new system boundaries, and has all design decisions pre-specified in the brief, classify as tier=trivial with the bug-fix template. Design and architecture stages add no value here and are skipped. Rationale from scope agent: "no new design decisions, no new system boundaries — one file, ~5 lines of code." [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]

