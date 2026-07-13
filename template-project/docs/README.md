# PKaC Demo Flow

This folder contains artifacts that support the conference demo story.

## AI vs Simulation

- Interactive local work may be AI-assisted (for example, Copilot in VS Code).
- This project supports two analysis paths: `simulate` and `real` (LLM staged with deterministic fallback).
- GitHub Actions workflows support all modes via `flow_mode`: `simulate`, `real`, `both`.
- Knowledge mutations are rollout-controlled in workflows via `apply_mode`: `dry-run` (default) or `apply`.

## Demo Commands

From template-project:

```bash
npm run simulate:impact
npm run simulate:knowledge-update
npm run prepare:pr-input
npm run analyze:pr-impact
npm run analyze:pr-impact:llm
npm run analyze:pr-impact:staged
npm run validate:llm-impact
npm run apply:knowledge:llm
npm run simulate:closed-loop
npm run generate:md-tests
npm run demo:execute
```

Or run the full flow:

```bash
npm run demo:flow
```

## Operational Checklists

- [Deployment Validation Checklist](deployment-validation-checklist.md)

## Usage Examples

### 1) Local Simulate Flow

```bash
npm run simulate:impact
npm run simulate:knowledge-update
npm run generate:md-tests
npm run demo:execute
```

Outputs:
- `docs/last-impact-report.json`
- `docs/last-impact-report.md`

### 2) Local Real Analysis (Staged)

Prerequisite:
- Set `OPENAI_API_KEY` in your environment (or `.env`).

```bash
npm run prepare:pr-input
npm run analyze:pr-impact:staged
npm run validate:llm-impact
npm run apply:knowledge:llm
```

Notes:
- `apply:knowledge:llm` is dry-run by default.
- To allow file changes, set `APPLY_LLM_KNOWLEDGE_UPDATES=true`.

Outputs:
- `docs/llm-impact-analysis.json`
- `docs/llm-impact-analysis.md`
- `docs/llm-impact-validation.json`
- `docs/llm-knowledge-apply.json`

### 3) GitHub Actions Simulate Only

Run `pkac-demo-flow` with:
- `flow_mode=simulate`
- `apply_mode=dry-run`

### 4) GitHub Actions Real Analysis Only

Run `pkac-demo-flow` with:
- `flow_mode=real`
- `apply_mode=dry-run` (recommended for analyze-only rollout)

Optional repository settings for real mode:
- Secret: `OPENAI_API_KEY`
- Variables: `OPENAI_MODEL`, `OPENAI_BASE_URL`

### 5) GitHub Actions Both Paths

Run `pkac-demo-flow` with:
- `flow_mode=both`
- `apply_mode=dry-run` or `apply`

For `pull_request` triggers, default behavior is `both`.

### 6) GitHub Actions Quality Workflow (Gated)

Run `bda-quality` with:
- `flow_mode=simulate|real|both`
- `apply_mode=dry-run|apply`

Notes:
- `pull_request` defaults to `flow_mode=both` and `apply_mode=dry-run`.
- Both workflows upload impact artifacts and maintain a sticky PR impact summary comment.

## Flow

```text
PR -> Knowledge Update -> Test Generation -> Execution -> Feedback -> Knowledge Evolution
```

## What To Show Live

1. Open knowledge markdown file and explain a rule.
2. Run simulated PR impact script and show impacted knowledge report.
3. Generate tests from markdown knowledge.
4. Execute mock test run and show result output.
5. Explain how feedback loops back into knowledge.
