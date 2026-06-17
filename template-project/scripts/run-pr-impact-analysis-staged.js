const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const LLM_JSON = path.join(DOCS_DIR, 'llm-impact-analysis.json');
const LLM_MD = path.join(DOCS_DIR, 'llm-impact-analysis.md');
const SIM_JSON = path.join(DOCS_DIR, 'last-impact-report.json');

function run(command) {
  execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function ensureDocsDir() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

function buildFallbackArtifact(simulated, inputFile) {
  const impactedFeatures = Array.isArray(simulated.impactedFeatures)
    ? simulated.impactedFeatures.map((item) => ({
        feature: item.feature,
        confidence: 0.5,
        reasons: item.reasons || [],
      }))
    : [];

  return {
    generatedAt: new Date().toISOString(),
    inputFile,
    model: 'deterministic-fallback',
    impactAnalysis: {
      schemaVersion: '1.0',
      summary: 'Fallback impact analysis generated from deterministic simulation.',
      confidence: 0.5,
      impactedFeatures,
      proposedKnowledgeEdits: impactedFeatures.map((item) => ({
        file: `knowledge/${item.feature}/${item.feature}.md`,
        ruleId: 'REVIEW-ONLY',
        action: 'review',
        rationale: 'Generated from deterministic keyword mapping fallback path.',
        suggestedText: 'Review impacted rules and update knowledge if needed.',
      })),
      testPlan: impactedFeatures.map((item) => ({
        feature: item.feature,
        ruleIds: [],
        suggestedTests: [`Regenerate and review tests for ${item.feature}`],
      })),
    },
  };
}

function writeFallbackMarkdown(artifact) {
  const lines = [
    '# LLM PR Impact Analysis',
    '',
    `Generated: ${artifact.generatedAt}`,
    `Model: ${artifact.model}`,
    `Input: ${artifact.inputFile}`,
    '',
    '## Summary',
    artifact.impactAnalysis.summary,
    '',
    '## Impacted Features',
    ...(artifact.impactAnalysis.impactedFeatures.length
      ? artifact.impactAnalysis.impactedFeatures.map(
          (item) =>
            `- ${item.feature}\n  - ${item.reasons.join('\n  - ') || 'no reasons provided'}`
        )
      : ['- (none)']),
    '',
    '## Notes',
    '- This artifact was produced by deterministic fallback because LLM analysis was unavailable.',
    '',
  ];

  fs.writeFileSync(LLM_MD, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  ensureDocsDir();

  const inputRel = 'scripts/pr-impact-input.json';
  const llmCommand = `node scripts/analyze-pr-impact-llm.js --input ${inputRel}`;

  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  if (hasKey) {
    try {
      run(llmCommand);
      console.log('Staged PR impact: used LLM path.');
      return;
    } catch (error) {
      console.warn('LLM path failed, falling back to deterministic simulation.');
    }
  } else {
    console.log('OPENAI_API_KEY not configured; using deterministic fallback path.');
  }

  const fallbackDiff = process.env.PR_IMPACT_FALLBACK_DIFF || 'scripts/mock-pr-diff.txt';
  run(`node scripts/simulate-pr-impact.js ${fallbackDiff}`);
  const simulated = JSON.parse(fs.readFileSync(SIM_JSON, 'utf8'));
  const artifact = buildFallbackArtifact(simulated, inputRel);

  fs.writeFileSync(LLM_JSON, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  writeFallbackMarkdown(artifact);
  console.log('Staged PR impact: fallback artifacts generated.');
}

main();
