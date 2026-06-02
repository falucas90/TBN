# Project Facts

## Tech Stack


## Conventions

- [01KT54YF6HG67XZYK1A3E4ESFE] **Use 'warn' toast type for semi-destructive or permanent actions (pause, delete), not 'error'** -- ToastContext maps 'warn' to `var(--color-warn-bg)` / `var(--color-warn-text)`. The convention in this project is: 'warn' signals something permanent happened without implying failure, while 'error' is reserved for actual failures. Both the existing toggleSearchStatus (pause) and the new deleteSearch use `addToast('...', 'warn')`. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.6]

## Patterns


