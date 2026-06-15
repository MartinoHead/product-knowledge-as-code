# PKaC Demo Flow

This folder contains artifacts that support the conference demo story.

## AI vs Simulation

- Interactive local work may be AI-assisted (for example, Copilot in VS Code).
- The commands in this folder are deterministic simulation scripts.
- GitHub Actions demo workflows run the same simulation scripts; they do not invoke a hosted model.

## Demo Commands

From template-project:

```bash
npm run simulate:impact
npm run simulate:knowledge-update
npm run analyze:pr-impact
npm run simulate:closed-loop
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
