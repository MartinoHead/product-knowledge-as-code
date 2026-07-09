# PKaC Runbook

This file is a practical command guide for common local workflows.

## Quick decision table

| Goal | Run this section | Core command |
| --- | --- | --- |
| I want a deterministic demo without external LLM dependency | 1) Simulate analysis flow | `npm run simulate:impact` |
| I want real staged impact analysis from LLM | 2) Real analysis flow | `npm run analyze:pr-impact:staged` |
| I only want to run tests | 3) Tests only | `npm run test` |
| I only want quality checks and gates | 4) Quality checks only | `npm run lint` |
| I changed knowledge and need to regenerate tests | 5) Regenerate generated tests | `npm run generate:tests` |
| I want the full demo story end-to-end | 6) Full demo flow | `npm run demo:flow` |
| I want classic PR-impact analysis from prepared input | 7) PR-impact analysis | `npm run analyze:pr-impact` |
| I need OpenAPI/sync utility commands | 8) OpenAPI and sync utilities | `npm run verify:sync` |
| I need a fast preset for common workflows | 9) Common fast paths | Use one of the two bundled sequences |

## 0) One-time setup

From repository root:

```bash
cd template-project
npm install
```

## 1) Simulate analysis flow (no real LLM dependency)

Use this when you want a deterministic demo path.

```bash
cd template-project
npm run simulate:impact
npm run simulate:knowledge-update
npm run generate:md-tests
npm run demo:execute
```

Main artifacts:
- docs/last-impact-report.json
- docs/last-impact-report.md

## 2) Real analysis flow (staged LLM path)

Use this when you want real impact analysis output.

Prerequisite:
- Set OPENAI_API_KEY in environment or .env.

```bash
cd template-project
npm run prepare:pr-input
npm run analyze:pr-impact:staged
npm run validate:llm-impact
npm run apply:knowledge:llm
npm run generate:tests
```

Notes:
- apply:knowledge:llm is dry-run by default.
- To allow file updates, run with APPLY_LLM_KNOWLEDGE_UPDATES=true.

Example apply mode:

```bash
cd template-project
APPLY_LLM_KNOWLEDGE_UPDATES=true npm run apply:knowledge:llm -- --apply
npm run generate:tests
```

Main artifacts:
- docs/llm-impact-analysis.json
- docs/llm-impact-analysis.md
- docs/llm-impact-validation.json
- docs/llm-knowledge-apply.json

## 3) Tests only

Run API tests only:

```bash
cd template-project
npm run test:api
```

Run UI tests only:

```bash
cd template-project
npm run test:ui
```

Run full test suite:

```bash
cd template-project
npm run test
```

## 4) Quality checks only (no analysis workflow)

```bash
cd template-project
npm run lint
npm run typecheck
npm run verify:sync
npm run verify:coverage
npm run generate:tests
npm run test
```

## 5) Regenerate generated tests from knowledge

Use this after updating knowledge files.

```bash
cd template-project
npm run generate:tests
```

Or only regenerate markdown-derived Playwright specs:

```bash
cd template-project
npm run generate:md-tests
```

## 6) Full demo flow in one command

```bash
cd template-project
npm run demo:flow
```

## 7) PR-impact analysis from prepared input

```bash
cd template-project
npm run prepare:pr-input
npm run analyze:pr-impact
```

## 8) OpenAPI and sync utilities

```bash
cd template-project
npm run generate:openapi
npm run verify:openapi
npm run verify:sync
```

## 9) Common fast paths

Simulate + regenerate + run all tests:

```bash
cd template-project
npm run simulate:impact
npm run simulate:knowledge-update
npm run generate:tests
npm run test
```

Real analysis dry-run + regenerate + run all tests:

```bash
cd template-project
npm run prepare:pr-input
npm run analyze:pr-impact:staged
npm run validate:llm-impact
npm run apply:knowledge:llm
npm run generate:tests
npm run test
```
