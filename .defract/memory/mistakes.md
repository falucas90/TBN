# Mistake Patterns

## Mistakes

- [01KTS3F30910WPV1X5NWF9VMXB] **Release loop-back caused by attempting git push without verifying authentication first** -- Two consecutive release → implementation loop-backs on this project because the release agent tried `git push` without confirming that either SSH keys or HTTPS credentials were configured. Each failed push triggered a full loop-back, forcing another review cycle. **Why:** The environment had no osxkeychain credentials stored and no SSH key added to GitHub at task start. **How to apply:** Before any `git push` in the release stage, probe auth with `ssh -T git@github.com` (or equivalent HTTPS probe). If auth is missing, block and surface remediation steps rather than attempting the push and failing. Do not loop back just for auth — halt with instructions instead. [source: task-add-delete-support-to-the-searches-page-01kt2g5b99gx, importance: 0.8]. [source: ui-supersede, importance: 0.8]

## Anti-Patterns


