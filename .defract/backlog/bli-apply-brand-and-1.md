---
id: bli-apply-brand-and-1
rawText: ''
title: Apply brand and margin filters in AlertHistory
type: bug
module: src/pages/AlertHistory.jsx
labels: []
groomingStatus: completed
createdAt: 2026-06-01T21:06:13Z
groomedAt: 2026-06-01T21:06:13Z
promotedTaskId: task-apply-brand-and-margin-filters-in-01kt2gbyb299
---

filterBrand and filterMargin state is declared in AlertHistory.jsx but never applied — mockAlerts is passed to .reduce() unfiltered. Wire the two selects so they actually narrow the displayed alert list.
