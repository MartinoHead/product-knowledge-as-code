---
name: bda-feedback-loop
description: Feed test failures and production incidents back into product knowledge and regenerate regression coverage.
---

# BDA Feedback Loop Skill

Use this skill after failed runs, escaped defects, or production incidents.

## Goals

- Prevent recurrence through knowledge updates.
- Generate durable regression protection.
- Keep quality assets aligned with real-world failures.

## Incident Processing Flow

1. Capture failure context (logs, steps, payloads, user path).
2. Classify root cause type:
   - Missing rule
   - Incomplete rule
   - Implementation defect with existing rule
3. Update corresponding `knowledge/*.md`.
4. Regenerate and run tests.
5. Verify the new regression would have detected the incident.

## Required Artifacts

- Incident summary.
- Updated rules (with IDs).
- New or updated tests linked to rule IDs.
- Verification result from CI.

## Triage Labels

- `knowledge-gap`
- `test-gap`
- `implementation-bug`
- `environment-issue`

## Done Criteria

- Knowledge updated in same change set as regression tests.
- Root cause classification recorded.
- CI shows regression coverage for the incident path.
