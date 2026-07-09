# PR Knowledge Agent Hardening Plan

## 1. Purpose
This plan defines how to make the PR Knowledge Agent both reliable and high quality.

Reliability goal:
1. Workflow runs consistently.
2. Workflow does not stop on expected data shape issues.
3. Workflow produces deterministic, reviewable outputs.

Quality goal:
1. Knowledge updates are meaningful.
2. Existing behavioral detail is preserved.
3. Generated tests reflect real product behavior and rule traceability.

## 2. Current State Snapshot
Date: 2026-07-08
Branch context: feature/add-user-status

Observed behavior:
1. Workflow execution can be successful.
2. A follow-up run can be marked action_required due to approval policy.
3. Mechanism now applies updates and syncs knowledge triad.
4. A quality regression exists: gherkin scenario steps can be replaced with generic placeholder steps.
5. Manual run support is available via workflow_dispatch.
6. Precheck-based skip controls are available (label, marker, docs-only).

Key files involved:
1. .github/workflows/pr-knowledge-agent.yml
2. template-project/.github/workflows/pr-knowledge-agent.yml
3. template-project/scripts/run-pr-impact-analysis-staged.js
4. template-project/scripts/sync-knowledge-triad.js
5. template-project/scripts/apply-knowledge-updates-llm.js
6. template-project/scripts/validate-llm-impact.js

## 3. Problem Statements
### 3.1 Reliability Problems
1. Diff computation can fail when merge-base assumptions are wrong.
2. LLM output can fail validation and block the pipeline.
3. Policy gates can mark run as action_required, causing confusion even when code is healthy.

### 3.2 Quality Problems
1. Gherkin scenarios lose behavioral detail when synchronized from markdown-only summaries.
2. Test regeneration can show no practical change if knowledge changes are too generic.
3. Existing semantics can be overwritten by normalization logic.

## 4. Decision Principles
1. Preserve intent first, then enforce format consistency.
2. Prefer additive updates over destructive rewrites.
3. Never replace behavior-rich scenario steps with placeholders for existing rules.
4. Keep all edits traceable to rule IDs and impacted features.
5. Fail fast on integrity violations, not on expected variability.

## 5. Target End State
1. Workflow succeeds or exits with a clear actionable reason.
2. Existing gherkin steps for existing rule IDs are preserved.
3. YAML titles stay synchronized with markdown rule text.
4. New rule IDs create new scenarios with starter templates only when no prior scenario exists.
5. Tests regenerate from synchronized knowledge with stable rule ID traceability.

## 6. Implementation Plan
### Phase A: Preserve Existing Gherkin Semantics
1. Update sync script behavior for gherkin merge mode.
2. Matching key is tag rule ID (for example @REG-001).
3. For existing IDs:
4. Keep Given/When/Then body unchanged.
5. Optionally update only scenario title if needed.
6. For new IDs:
7. Add new scenario block with template steps.
8. For removed IDs:
9. Remove scenario block only when rule is explicitly removed from markdown.

Deliverable:
1. Updated template-project/scripts/sync-knowledge-triad.js logic with merge strategy.

### Phase B: Safe YAML Synchronization
1. Continue syncing YAML rule IDs and titles from markdown.
2. Keep YAML deterministic and minimally changed.
3. Keep ordering stable by rule ID to avoid noisy diffs.

Deliverable:
1. YAML update path in sync script with deterministic ordering and minimal rewrite behavior.

### Phase C: Strengthen Validation Guards
1. Add guard in sync step to detect placeholder-only gherkin regression for existing scenarios.
2. Add warning summary when scenario body preservation could not be applied.
3. Keep verify:sync as hard gate for triad consistency.

Deliverable:
1. Additional checks in sync script and explicit logs in workflow.

### Phase D: Workflow Clarity and Observability
1. Keep fallback path for LLM validation failures.
2. Add short run summary log lines for:
3. impacted features
4. files changed
5. rules added, updated, removed
6. scenarios preserved vs newly created

Deliverable:
1. Improved run output in workflow logs and PR comment details.

### Phase E: Detailed PR Comments Per Step (Demo Narrative)
1. Add step-aware PR comment blocks so each run shows exactly what happened at each stage.
2. Include one section per stage:
3. Stage 1 diff summary (base, head, changed files, diff lines)
4. Stage 2 impact analysis summary (impacted features with confidence)
5. Stage 3 validation summary (pass/fail, warnings, fallback usage)
6. Stage 4 apply summary (rules added, updated, removed by feature)
7. Stage 5 sync summary (yaml and gherkin files touched, scenarios preserved, scenarios added)
8. Stage 6 test generation summary (generated files and rule coverage counts)
9. Stage 7 commit summary (commit SHA, file stats, no-op reason when nothing changed)
10. Use clear emojis and compact tables for human scanning in demos.
11. Add links in the comment to run, job, commit, and changed files.
12. Keep one rolling bot comment updated per PR (edit existing comment instead of spamming).

Deliverable:
1. Deterministic PR comment template with stage-by-stage details and run links.

### Phase F: Human-Readable Run Logging (Demo Mode)
1. Introduce structured log lines for each step with a consistent prefix format.
2. Log format target:
3. phase name
4. action performed
5. input summary
6. output summary
7. elapsed duration
8. Add a final run recap block in logs with totals:
9. impacted features count
10. rules changed count
11. files changed count
12. tests regenerated count
13. fallback used yes/no
14. Add an optional demo verbosity mode controlled by environment variable.
15. Keep default mode concise; enable demo mode for presentations and walkthroughs.

Deliverable:
1. Readable, high-signal logs suitable for live demos and post-run audits.

### Phase G: Selective Triggering and Agent Check Bypass
1. Implement a docs-only bypass mechanism so agent checks do not run for non-product-behavior changes.
2. Add trigger guardrails at workflow level:
3. keep path filters strict to behavior-impacting areas only
4. optionally add paths-ignore for docs-only updates when needed
5. Add in-workflow precheck stage that classifies change scope:
6. docs-only
7. code-impacting
8. knowledge-impacting
9. Exit early with a clear summary when scope is docs-only.
10. Add explicit manual bypass controls for maintainers:
11. PR label example: skip-knowledge-agent
12. PR title/body marker example: [skip pkac-agent]
13. Ensure bypass is auditable in PR comments and run logs.
14. Keep critical validation enabled for behavior-impacting paths even when optional checks are bypassed.

Deliverable:
1. Deterministic skip policy and documented bypass controls with audit trail.

### Phase H: Replace Template Tests with Real Executable Coverage
1. Replace placeholder TODO tests in API and Playwright suites with executable assertions.
2. Ensure each rule ID has at least one deterministic assertion path.
3. Keep traceability between knowledge rule IDs and test titles.
4. Decide generator contract explicitly:
5. either generator outputs executable tests
6. or generator outputs scaffold files that are excluded from quality gates.
7. Keep failing fast in CI when template placeholders are present in enforced test suites.

Deliverable:
1. Executable API and UI tests for impacted features with no TODO placeholders in enforced suites.

### Phase I: Enforce Persistent Data Behavior for Identity Flows
1. Remove silent in-memory fallback for create/find identity paths where persistent uniqueness is required.
2. Return explicit service-unavailable behavior when database connectivity is missing.
3. Add startup/runtime mode visibility so operators can see persistence mode clearly.
4. Add regression checks for duplicate-email behavior across process restarts.
5. Keep fallback behavior only where explicitly documented and non-critical.

Deliverable:
1. Deterministic duplicate-email conflict behavior backed by persistent storage and explicit failure modes.

## 7. Recursive Improvement Loop
This plan must be updated whenever a new issue is discovered.

Loop per run:
1. Run workflow.
2. Capture outputs (commit diff, PR comment, job logs, annotations).
3. Classify issue as reliability or quality.
4. Add issue to section 10 (Open Issues Register).
5. Add or adjust an action in section 6.
6. Re-run and compare before/after behavior.
7. Keep the smallest change set that resolves the issue.

## 8. Verification Matrix
### Functional Verification
1. Trigger PR workflow on code change under template-project/src.
2. Confirm compute diff step reports non-zero lines when expected.
3. Confirm validate step passes or falls back successfully.
4. Confirm apply step updates knowledge when impact exists.
5. Confirm sync preserves existing gherkin steps for unchanged rule IDs.
6. Confirm tests regenerate and commit when files differ.
7. Confirm PR comment contains all stage summaries with run links.
8. Confirm bot updates one rolling comment instead of creating duplicates.
9. Confirm docs-only PRs skip agent processing with an explicit skip reason.
10. Confirm bypass label or marker behaves as documented and is logged.
11. Confirm enforced test suites contain no template TODO placeholders.
12. Confirm duplicate-email conflict remains stable after application restart.

### Quality Verification
1. Inspect one representative feature each run:
2. registration
3. create-user
4. checkout
5. Confirm no placeholder overwrite for pre-existing scenarios.
6. Confirm rule ID continuity across md, yaml, feature, tests.
7. Confirm test assertions validate behavior outcomes, not only response shape.

### Regression Verification
1. Re-run workflow on same PR with no new code changes.
2. Confirm no unnecessary churn (or minimal expected churn only).
3. Confirm no repeated comment noise and stable log readability across reruns.
4. Confirm selective triggering does not skip behavior-impacting changes by mistake.

## 9. Definition of Done
1. Two consecutive workflow runs complete successfully on active PR branch.
2. No existing gherkin scenario bodies are replaced by placeholders.
3. Knowledge triad remains synchronized.
4. Generated tests align to rule IDs and remain deterministic.
5. PR comment summary reflects actual changed files and operations.
6. PR comment includes stage-by-stage detail that is human readable and demo friendly.
7. Workflow logs provide clear narrative and final recap without digging through raw output.
8. Docs-only changes do not run full agent checks and clearly report why they were skipped.
9. Enforced test suites are executable and free of template TODO placeholders.
10. Identity duplicate checks are persistent and deterministic across restarts.

## 10. Open Issues Register
### Issue 001
Type: Quality
Status: Open
Description: Existing gherkin scenario bodies were overwritten with generic placeholder steps.
Impact: Loss of behavior specificity and weaker generated test guidance.
Planned fix: Phase A merge-preservation strategy in sync-knowledge-triad.js.

### Issue 002
Type: Reliability/Process
Status: Monitoring
Description: action_required run state appears when maintainer approval is required.
Impact: Perceived instability despite healthy implementation.
Planned fix: Add run-state guidance note in docs and PR comment pattern.

### Issue 003
Type: Observability/Demo Quality
Status: Open
Description: PR comment and workflow logs are not detailed enough to explain every agent action to humans during demos.
Impact: Hard to audit what changed at each stage; weak storytelling in stakeholder walkthroughs.
Planned fix: Implement Phase E and Phase F for stage-level PR narratives and structured run logs.

### Issue 004
Type: Efficiency/Developer Experience
Status: Implemented, monitoring
Description: Agent checks should not run for docs-only changes and should support explicit bypass controls.
Impact: Unnecessary workflow runs, slower PR feedback, and noisy checks.
Planned fix: Implement Phase G selective triggering and auditable bypass mechanism.

### Issue 005
Type: Quality/Test Execution
Status: Open
Description: Multiple generated and maintained test files still contain template TODO placeholders.
Impact: CI quality gates fail and behavior coverage remains incomplete.
Planned fix: Implement Phase H and enforce executable test policy.

### Issue 006
Type: Reliability/Data Integrity
Status: Open
Description: Identity flows can silently fall back to in-memory storage when database is unavailable.
Impact: Duplicate-email behavior is non-deterministic across restarts and does not reflect real persistence guarantees.
Planned fix: Implement Phase I strict persistence behavior and explicit service-unavailable handling.

## 11. Rollback Strategy
1. If sync behavior causes incorrect edits, revert sync script commit only.
2. Keep workflow fallback and diff handling improvements in place.
3. Re-run on PR and verify no semantic degradation occurs.

## 12. Operational Commands
From template-project:
1. npm run analyze:pr-impact:staged
2. npm run validate:llm-impact
3. npm run apply:knowledge:llm -- --apply
4. node scripts/sync-knowledge-triad.js
5. npm run verify:sync
6. npm run generate:tests

## 13. Plan Update Protocol
Update this file immediately when any of the following happens:
1. A run fails at a new step.
2. A run succeeds but output quality regresses.
3. A guardrail creates false positives or false negatives.
4. A new feature pattern requires rule mapping adjustments.

Each update must include:
1. What changed.
2. Why it changed.
3. How success will be measured.
4. Which section of this plan was modified.
