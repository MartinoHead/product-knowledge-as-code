---
name: bda-behavior-modeling
description: Create and maintain product behavior knowledge files as the primary source of truth for quality.
---

# BDA Behavior Modeling Skill

Use this skill when you need to create or update behavior knowledge in `knowledge/*.md`.

## Goals

- Capture business behavior, not UI details.
- Keep rules testable and unambiguous.
- Preserve traceability between behavior and generated tests.

## Required Input

- Feature name and business intent.
- Happy path definition.
- Validation and error rules.
- Key edge cases and constraints.

## Output Format

Each knowledge file should follow this structure:

```md
# <Feature Name>

## Intent
1-2 sentences describing business value.

## Happy Path
- Step-by-step user journey.
- Observable expected outcomes.

## Rules
- Rule ID: statement
- Rule ID: statement

## Edge Cases
- Condition: expected behavior

## Non-Goals
- Explicitly out-of-scope behavior
```

## Quality Checklist

- Every rule is observable and testable.
- No implementation-specific references unless required.
- Ambiguous words removed ("fast", "normal", "soon").
- Includes both success and failure behaviors.
- Uses stable rule identifiers (for example `REG-001`).

## Done Criteria

- Knowledge file updated in same PR as behavior change.
- Rule IDs referenced by generated tests.
- Review notes include changed rules and why.
