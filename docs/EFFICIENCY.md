# Efficiency Audits

## 2026-08-07 — Cross-session pattern review (scheduled audit)

Source data: `.defract/tasks/*/state.json` (13 archived pipeline tasks, June 2026), `.defract/memory/usage.log.jsonl` (403 memory-injection events), `.defract/memory/{workflows,mistakes,builder-preferences}.md`, and the 2026-08-04 cycle audit below. No raw session transcripts survive (containers are ephemeral); these repo artifacts are the durable record.

### Findings, prioritized by frequency × cost impact

**1. Trivial single-file changes run through the full 4–6 stage pipeline.** *(highest impact — recurred in at least 4 of 13 tasks)*
- Current approach: scope → (design → architecture →) implementation → review → release, each stage a fresh agent with injected memory.
- Evidence: catch-all redirect route (a one-line `App.jsx` change) generated 84 events and 6 loop-backs across two days; the login-page CSS fix generated 59 events and 58 memory injections across 4 stages.
- Optimization: for changes confined to one file with no logic/data-flow impact, use a single builder agent with inline self-verification (build + lint) and a lightweight reviewer pass — no separate scope/design/architecture stages. The `ui-polish` / `bug-fix` templates in `.defract/memory/workflows.md` already point this way; extend them to also collapse review into a one-shot check.
- Estimated saving: ~60–80% of events/tokens on trivial tasks (e.g. 84 → ~15–20 events).

**2. Loop-backs from preventable release and spec defects.** *(8 loop-backs on one task; 2 full review cycles wasted on another)*
- Current approach: failures discovered downstream trigger a full stage loop-back, each re-running review.
- Evidence: (a) brand/margin-filters task looped 8 times, one loop solely because mock fixture data didn't satisfy an acceptance criterion (marginEst 5250 vs the €4,000 AC threshold); (b) two consecutive release→implementation loop-backs because `git push` was attempted without checking auth first (documented in `.defract/memory/mistakes.md` but not yet enforced as a gate).
- Optimization: two cheap pre-flight checks — (i) spec author validates ACs against mock fixtures with a grep/read before build starts; (ii) release stage probes push auth with one command before attempting push, and halts with remediation instead of looping back.
- Estimated saving: each avoided loop-back saves a full implementation+review cycle (~20–30 events / one agent context each).

**3. Read-only analysis tasks routed through the build pipeline.** 
- Current approach: audits treated like features. Evidence: `evaluate-app-security` consumed 80 events (scope 20 / implementation 20 / review 20 / release 10) and 6 loop-backs over ~2 days for what is a read-only report; `resolve-diverged-sync-on-main` (a git fetch/rebase) spent 18 scope-stage injections before touching git.
- Optimization: route audits, security reviews, and git housekeeping to a single read-only agent (or direct CTO action for git ops) producing a report artifact — no implementation/release stages.
- Estimated saving: ~70% on analysis tasks (80 → ~20–25 events).

**4. Indiscriminate memory injection per stage.**
- Current approach: memory entries injected into every stage of every task; `usage.log.jsonl` records 403 injections, with single stages receiving up to 20 (e.g. dealer-management scope stage).
- Optimization: filter injections by stage relevance (builder-preferences only into implementation, release corrections only into release). Cheap context saving on every future task.

**5. Stale project-profile causes phantom scope items.**
- Evidence: audit task scoped 2 of 4 items that were already implemented; caught only by a live read. Already captured in `workflows.md` — enforce "live-read flagged files before finalizing scope" as a scope-stage checklist item rather than optional memory.

### Validated wins to keep (from the 2026-08-04 cycle)
Diagnosis-before-spec, acceptance-criteria-only specs, and QA as an independent gate all showed measurable value — no change.

**SAFE (apply now):** items 2(ii), 4, 5 — process guards with no quality tradeoff.
**TRADEOFF (founder call):** items 1 and 3 shrink the review surface on small/analysis tasks in exchange for large token savings; recommend adopting with the rule that any task touching auth, RLS, or payments always takes the full pipeline regardless of size.

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

