---
name: bda-template-project
description: Bootstrap a Product Knowledge as Code repository with behavior knowledge, test generation paths, and CI quality workflow.
---

# BDA Template Project Skill

Use this skill when creating a new project that follows this architecture.

## Target Structure

```text
project/
├── src/
├── knowledge/
│   ├── registration.md
│   └── checkout.md
├── tests/
│   └── playwright/
├── scripts/
│   └── generate-tests.js
└── .github/workflows/
    └── quality.yml
```

## Bootstrap Steps

1. Create `knowledge/` seed files for top business flows.
2. Add `tests/playwright/` baseline setup.
3. Add generation script scaffold in `scripts/`.
4. Add CI workflow with:
   - knowledge validation
   - test generation
   - Playwright execution
5. Add documentation for rule naming and contribution process.

## Minimum Standards

- Rule IDs required in all knowledge files.
- Traceability from rule IDs to test titles.
- Pull requests must run quality workflow.
- Incident updates must include knowledge changes.

## Done Criteria

- New repo has runnable CI quality pipeline.
- At least 2 features modeled in `knowledge/`.
- Generated tests run and publish results.
