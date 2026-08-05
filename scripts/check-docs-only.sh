#!/usr/bin/env bash
# check-docs-only.sh
# ----------------------------------------------------------------------------
# Decides whether the current push/PR touches ONLY documentation files
# (anything under docs/, or any *.md file anywhere, e.g. root CLAUDE.md,
# README.md). CI (.github/workflows/ci.yml) uses this to skip the expensive
# npm ci / lint / test / build / audit steps on docs-only changes, while the
# job itself still always runs to completion and reports a status.
#
# Fail-safe by design: any ambiguity (missing SHAs, brand-new branch,
# force-push, shallow history, unsupported event) resolves to
# docs_only=false, i.e. run the full pipeline. We only ever skip work when
# we can positively confirm every changed file is documentation. An error
# here must never abort the job silently -- it must fall through to a
# docs_only=false output.
#
# Requires (workflow supplies these via `env:`):
#   PR_BASE_SHA, PR_HEAD_SHA         - for pull_request events
#   PUSH_BEFORE_SHA, PUSH_AFTER_SHA  - for push events
# Relies on the runner-provided GITHUB_EVENT_NAME and GITHUB_OUTPUT.
set -uo pipefail
# Deliberately not `-e`: every failure path below is handled explicitly and
# must still fall through to writing a docs_only output.

ZERO_SHA="0000000000000000000000000000000000000000"

emit() {
  # $1 = true|false, $2 = human-readable reason, printed to the job log.
  echo "docs_only=$1" >>"$GITHUB_OUTPUT"
  echo "$2"
}

changed_files=""

case "$GITHUB_EVENT_NAME" in
pull_request)
  if [ -z "${PR_BASE_SHA:-}" ] || [ -z "${PR_HEAD_SHA:-}" ]; then
    emit false "Not docs-only: missing PR base/head SHA (base='${PR_BASE_SHA:-}' head='${PR_HEAD_SHA:-}'). Running full pipeline."
    exit 0
  fi
  err_log="$(mktemp)"
  if ! changed_files="$(git diff --name-only "$PR_BASE_SHA" "$PR_HEAD_SHA" 2>"$err_log")"; then
    emit false "Not docs-only: 'git diff $PR_BASE_SHA $PR_HEAD_SHA' could not be computed cleanly. Running full pipeline. $(cat "$err_log")"
    exit 0
  fi
  ;;
push)
  if [ -z "${PUSH_BEFORE_SHA:-}" ] || [ -z "${PUSH_AFTER_SHA:-}" ]; then
    emit false "Not docs-only: missing push before/after SHA (before='${PUSH_BEFORE_SHA:-}' after='${PUSH_AFTER_SHA:-}'). Running full pipeline."
    exit 0
  fi
  if [ "$PUSH_BEFORE_SHA" = "$ZERO_SHA" ]; then
    emit false "Not docs-only: 'before' SHA is all-zeros (brand-new branch, no prior commit to diff against). Running full pipeline."
    exit 0
  fi
  err_log="$(mktemp)"
  if ! changed_files="$(git diff --name-only "$PUSH_BEFORE_SHA" "$PUSH_AFTER_SHA" 2>"$err_log")"; then
    emit false "Not docs-only: 'git diff $PUSH_BEFORE_SHA $PUSH_AFTER_SHA' could not be computed cleanly. Running full pipeline. $(cat "$err_log")"
    exit 0
  fi
  ;;
*)
  emit false "Not docs-only: unsupported event '$GITHUB_EVENT_NAME'. Running full pipeline."
  exit 0
  ;;
esac

if [ -z "$changed_files" ]; then
  emit true "Docs-only: diff came back empty, nothing changed to build/test."
  exit 0
fi

echo "Changed files:"
echo "$changed_files"

# Anything that is NOT under docs/ and does NOT end in .md disqualifies the
# change from being docs-only. Matching is deliberately case-sensitive and
# exact (no wildcards beyond this), so we only ever skip work when certain.
non_docs="$(echo "$changed_files" | grep -vE '(^docs/|\.md$)' || true)"

if [ -n "$non_docs" ]; then
  echo "Non-doc file(s) found:"
  echo "$non_docs"
  emit false "Not docs-only: at least one changed file is outside docs/ and is not a *.md file. Running full pipeline."
  exit 0
fi

emit true "Docs-only: every changed file is under docs/ or is a *.md file. Skipping build/test/audit steps."
