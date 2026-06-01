---
id: bli-add-a-catch-2
rawText: ''
title: Add a catch-all redirect route in App.jsx
type: improvement
module: src/App.jsx
labels: []
groomingStatus: completed
createdAt: 2026-06-01T21:06:13Z
groomedAt: 2026-06-01T21:06:13Z
promotedTaskId: task-add-a-catch-all-redirect-route-in-app-01kt2gckza2g
---

App.jsx defines no fallback route, so navigating to an unknown path renders a blank page. Add a <Route path="*"> that redirects to / to handle this gracefully.
