# Product Knowledge as Code (PKaC)

## What This Is

This repository demonstrates a QA model where product behavior knowledge is primary and tests are derived artifacts.

In short:

- Knowledge in markdown is the source of truth.
- Generated tests are disposable outputs.
- AI-agent behavior is represented by deterministic scripts in this prototype.

## AI Usage Boundaries (Important)

To avoid ambiguity during demos, this prototype separates interactive AI help from automated pipeline behavior:

- Local interactive authoring (for example, using Copilot in VS Code) can use a real AI model.
- Local scripted flow (`npm run simulate:*`, `npm run demo:flow`) is deterministic simulation, not a model call.
- CI workflows in GitHub Actions use the same deterministic scripts; they do not call a hosted LLM.
- This keeps CI reproducible, auditable, and independent from model availability or API credentials.

## Why This Matters

Traditional test case management systems optimize for manual test inventory maintenance.

Modern AI-native delivery needs a different center of gravity:

- maintain behavior knowledge once,
- generate verification assets on demand,
- continuously realign tests when behavior changes.

## Why Systems Like TestRail Become Less Central

In this model, the durable asset is not the manual test case library.

- TestRail-style suites are snapshots of expected behavior at a point in time.
- Product knowledge files are continuously versioned behavior contracts.
- Generated tests can be recreated instantly from those contracts.

Result: the center of QA shifts from test case curation to knowledge curation.

## Test Cases vs Product Knowledge vs Generated Tests

- Test cases:
  - Human-authored execution instructions.
  - Usually drift from real behavior over time.
- Product knowledge:
  - Stable behavior rules and expected outcomes.
  - Version-controlled and reviewable with code changes.
- Generated tests:
  - Mechanical derivatives from knowledge.
  - Regenerated as needed; not manually curated long-term.

## End-to-End Lifecycle

1. Pull request changes business logic.
2. Impact analysis maps code changes to impacted behavior areas (deterministic mapping in this prototype).
3. Knowledge markdown is updated (simulated agent update in this prototype).
4. Tests are regenerated from knowledge.
5. CI executes tests (or mock execution in this prototype).
6. Results are captured.
7. Feedback updates knowledge again.

## Missing Link Implemented: PR Impact Analyzer

Prototype command:

```bash
cd template-project
node scripts/pr-impact-analyzer.js --input scripts/pr-impact-input.json
```

What it demonstrates:

- Reads PR-like input (files changed + textual description).
- Applies deterministic keyword-to-knowledge mapping.
- Updates affected markdown knowledge files in-place.
- Prints impacted files, applied updates, and patch-style deltas.
- Prints next step to regenerate tests from updated knowledge.

## Architecture Diagram

```text
PR
 -> Change Impact Analysis (simulated agent)
 -> Knowledge Update (/knowledge/*.md)
 -> Test Generation (/tests/*.spec.ts)
 -> Execution (real or mock)
 -> Feedback Report
 -> Knowledge Evolution
```

## Talk Framing

The key claim is not "AI writes better tests."

The key claim is:

- Product knowledge replaces test-case inventory as the primary quality asset.
- AI agents maintain and operationalize that knowledge.
- QA shifts from case maintenance to knowledge governance.
