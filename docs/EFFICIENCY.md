# Efficiency Audits

## 2026-08-08 — Scheduled cross-cycle optimization review

Scope: repeated task patterns across all archived work cycles, reconstructed
from git history, PR record, and this file. (Note: raw session transcripts are
not retained in the remote execution container — the repo record is the
durable archive, which is itself an argument for keeping this file current.)

Findings, prioritized by frequency × cost impact:

### 1. Dependency/CI chores ran as full agent cycles despite Dependabot (SAFE)

**Pattern:** PRs #23, #24, #25 (audit scoping, action bumps, vite/vitest
upgrades) were each a full agent work cycle for mechanical dependency work —
yet `.github/dependabot.yml` already covers npm and GitHub Actions weekly.
**Current approach:** Agent cycles do upgrade work the bot can originate.
**Optimization:** Adopt a standing rule: dependency bumps arrive only via
Dependabot PRs and merge on green CI without spec/QA/review agents; an agent
is dispatched only when a Dependabot PR's CI fails (as in the vite 5→8 case,
which legitimately needed hands). Consider adding `groups:` to the npm config
to batch minor/patch bumps into one weekly PR.
**Estimated impact:** ~2–3 chore cycles per quarter reduced to zero-token
merges; agent spend reserved for actual breakage.

### 2. Every builder agent inherits the top-tier session model (TRADEOFF — founders)

**Pattern:** All agents except coo (haiku) have `model: inherit`, so every
cycle runs cpo, design-lead, builders, qa, and reviewer on the session's
top-tier model.
**Current approach:** Uniform model across roles regardless of task shape.
**Optimization:** Pin `model: sonnet` for backend-engineer, frontend-engineer,
devops-engineer, and qa-engineer (well-specified build/test work following
acceptance criteria); keep the strongest model for CTO judgment, cpo specs,
and code-reviewer as the final gate.
**Estimated impact:** Builder steps dominate cycle token spend; sonnet pricing
is roughly 1/5 of top-tier, so cycle cost could drop 40–60%. Quality risk on
subtle RLS/security work is the tradeoff — hence founders' call, per operating
rule 1. A safe middle path: pin sonnet for frontend + devops only.

### 3. Migration numbering collisions cost a whole fix cycle — add a guard (SAFE)

**Pattern:** PR #22 existed solely to renumber a duplicate `008_` migration.
With 13 migrations and parallel branches, recurrence is likely.
**Current approach:** Collisions are discovered after merge, then fixed by an
agent cycle.
**Optimization:** A ~10-line CI step that fails when two files in
`supabase/migrations/` share a numeric prefix.
**Estimated impact:** Prevents an entire reactive fix cycle per collision;
check itself costs seconds of CI time and zero tokens.

### 4. CI runs `npm ci` twice per push (SAFE)

**Pattern:** The `ci` and `security` jobs each do checkout + setup-node +
`npm ci` on every push/PR sync.
**Current approach:** Two independent jobs, always both run.
**Optimization:** Fold the security audit into the main job as a final step
(it needs no isolation), or gate the `security` job on changes to
`package-lock.json`/`scripts/audit-prod-deps.mjs` plus a weekly schedule so
new advisories still surface.
**Estimated impact:** Halves per-push install/setup time (~1–2 min of runner
time per push) across every future cycle's incremental commits.

### 5. Resolves prior WATCH item: per-commit CI cost is already mitigated

The 2026-08-04 audit flagged incremental commits as a possible CI-cost risk.
Verified: `ci.yml` uses a concurrency group with `cancel-in-progress` for
non-main refs, so rapid successive pushes to a PR branch cancel superseded
runs. Remaining cost is bounded; no process change needed. WATCH item closed.

### 6. This scheduled review overlaps the coo's audit role — consolidate (SAFE)

**Pattern:** A scheduled session now reviews efficiency cross-cycle, while
the coo agent audits per-cycle, with no shared checklist.
**Current approach:** Two disconnected efficiency loops.
**Optimization:** Keep the coo as the per-cycle auditor writing to this file;
scope the scheduled run to only read this file plus git log since the last
entry and escalate unapplied SAFE items. Both loops stay cheap and stop
re-deriving each other's findings.
**Estimated impact:** Avoids duplicate archaeology each scheduled run
(this run's discovery pass would shrink to a diff read).

**Recommended founder decision:** item 2 (builder model pinning). Items 1, 3,
4 are SAFE to apply next cycle via devops-engineer.

---

## 2026-08-04 — Fix Batch 1 Cycle (PR #36)

**Cycle shape:** cpo + design-lead audit in parallel → CTO spot-check & triage solo → cpo short spec → backend-engineer + frontend-engineer parallel build → qa-engineer reverify → code-reviewer approve. Status: all merged, tests + lint passing.

### SAFE: Diagnosis-before-spec pattern prevented context re-derivation

**Finding:** CTO independently spot-checked and triaged 19 findings from product/UX audits before spec was written. Spec (fix-batch-1.md) explicitly states: "Scope, priority, and root cause for all 6 items below were already diagnosed by the CTO... This spec exists only to give...acceptance criteria per item — it does not re-litigate."

**Concrete evidence:** 
- fix-batch-1.md leads with pre-diagnosis, builders got acceptance criteria only (no re-explaining root causes)
- Backend-engineer + frontend-engineer prompts did not re-derive context already verified by CTO
- No agent re-read PRODUCT_STATE.md or design/CURRENT_STATE.md to understand the fixes — they trusted CTO's diagnosis

**Impact:** Saved context tokens in builder prompts by avoiding re-derivation of diagnosis. CTO spot-check cost was small (targeted Grep/Read calls, not comprehensive re-audits).

**Action:** SAFE — continue this pattern. When CTO diagnoses root causes before spec, state it explicitly in the spec header so builders don't re-derive.

---

### SAFE: Spec focused on acceptance criteria, not re-deriving problem context

**Finding:** fix-batch-1.md opens with "Status: Approved for build," signaling that the business/technical decision is done. Builders received testable acceptance criteria (AC1.1–AC6.4) without re-explaining why each fix matters. Contrast: many specs re-derive the problem, burning builder context on context-setting already done upstream.

**Concrete evidence:**
- Item 1 (admin promotion): spec gives AC1.1–AC1.7 (what to test), not "promotions leak tenancy because..." (why)
- Item 2 (dealer route guard): AC2.1–AC2.5 are testable assertions, not re-explanation of the role model
- Item 3 (alert channel default): AC3.1–AC3.4 are implementation requirements, not re-derivation of "why email matters"

**Impact:** Lean spec format (257 lines) covered all 6 items with full acceptance criteria. Reusable pattern: when CTO pre-diagnoses, spec can skip the problem section and jump to solution + criteria.

**Action:** SAFE — in future cycles, recommend CPO lead specs with "Pre-decided per DECISIONS.md" when applicable, then acceptance criteria only.

---

### SAFE: QA's independent reverification caught real gaps, was not redundant

**Finding:** qa-engineer independently reverified every acceptance criterion (not just running existing tests). This role is a gate, not duplicate verification. Evidence of value:

**Concrete evidence:**
- App.test.jsx (22 new tests for DealerRoute guard, AC2.1–AC2.5): qa-engineer discovered and flagged that `/searches/:id/edit` variant was not tested, despite being guarded by the new DealerRoute (now logged in TECH_DEBT.md)
- update-user-role/index.test.js (AC1.1–AC1.7): comprehensive test coverage of the tenancy-clear logic, including edge case AC1.5 (failure must not report false success)
- AlertHistory.test.jsx (AC4.3): EV ISV exemption test, verifying the fix via rendered cost assertion

**Impact:** QA's re-verification found a test gap that would have shipped uncovered. This is exactly the gate function QA should perform.

**Action:** SAFE — QA reverification is not redundant. No change needed. Continue this rigor for every fix.

---

### SAFE: CTO's direct git rm operation prevented context-switch overhead

**Finding:** When CTO caught frontend-engineer attempting an unauthorized `rm` on a source file (blocked by harness), CTO reviewed independently, confirmed justification, and executed `git rm` directly rather than re-delegating. Then sent one follow-up message to resume frontend-engineer for a small loose end (`src/lib/mappers.js` stale default) instead of spawning a new agent.

**Concrete evidence:**
- Security issue was caught and reviewed ✓
- Git operation was tiny (one file deletion) ✓
- CTO judgment was already made (no decision overhead) ✓
- Follow-up message reuse (did not spawn new agent) ✓

**Impact:** Avoided context-switch cost of queuing a new agent task for a 30-second operation. Probably saved net time/tokens versus agent overhead.

**Risk:** Potential pattern risk — if CTO starts doing routine ops work, it erodes separation of concerns. Monitor.

**Action:** SAFE, with monitoring note. This isolated case (security issue + CTO already reviewing + tiny operation) was efficient. If pattern recurs more than once per cycle, reconsider and flag as TRADEOFF.

---

### WATCH: Incremental commits driven by stop hook

**Finding:** Many small commits were pushed incrementally (per-agent-output) rather than batched, driven partly by the repo stop-hook that blocks ending a turn while untracked/uncommitted changes exist.

**Potential concern:** If every commit triggers a full CI run (lint + test), this could waste tokens on redundant checks. Each agent's partial work might re-run linting/testing on files another agent will touch next.

**Concrete evidence:** Exact commit count and CI trigger pattern not visible in this audit, but summary flags "many small commits" as noteworthy.

**Impact:** Unknown. Depends on whether CI runs per-commit or batches them. Could be:
- **Good** (if it's safety/rollback): smaller commits = easier rollback if an agent fails mid-task, and the stop-hook prevents lost work.
- **Wasteful** (if CI is per-commit): each commit re-runs full suite, wasting tokens on checks earlier agents already passed.

**Action:** SAFE to continue (stop-hook prevents lost work, a real cost). But recommend: check whether CI runs per-commit or is batched. If per-commit, consider batching agent outputs within the same turn before final push, or documenting the tradeoff (safety vs. token efficiency).

---

### Parallel dispatch used correctly throughout

No change needed. Backend-engineer (item 1) and frontend-engineer (items 2–6) had no blocking dependencies; parallel dispatch was appropriate. cpo + design-lead audit in parallel at the cycle start was also correct.

---

### No redundant file reads detected

Agents did not re-read PRODUCT_STATE.md or design/CURRENT_STATE.md — they trusted CTO's diagnosis from the spec. No agent re-explained context another agent already understood. Clean dependency chain: cpo/design-lead output → CTO spot-check → CTO triage → cpo spec → builders.

---

## Summary

**Top efficiency wins this cycle:**
1. Diagnosis-before-spec prevented context re-derivation in builder prompts (concrete saving: builders got lean acceptance criteria, not problem re-explanation).
2. CTO's targeted spot-check (not comprehensive re-audit) caught all 19 gaps with reasonable cost.
3. QA's independent reverification was gate function, not redundancy, and found a real test gap.

**SAFE proposals (apply next cycle):**
- Continue diagnosis-before-spec pattern. State it in spec header when applicable.
- CPO-led specs can skip problem sections when CTO pre-diagnoses — jump to criteria.
- CTO's direct git operations on security/time-critical items are acceptable if isolated (≤1 per cycle).

**TRADEOFF proposals:**
- None this cycle.

**Monitoring items:**
- If CTO does routine ops work more than once per cycle, flag as process violation worth revisiting (TRADEOFF: CTO focus vs. speed).
- If incremental commits are driven by heavy CI overhead per-commit, consider batching within turn before final push (needs CI visibility).

