# PKaC Demo Flow

This folder contains artifacts that support the conference demo story.

## Demo Commands

From template-project:

```bash
npm run simulate:impact
npm run simulate:knowledge-update
npm run analyze:pr-impact
npm run generate:md-tests
npm run demo:execute
```

Or run the full flow:

```bash
npm run demo:flow
```

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
