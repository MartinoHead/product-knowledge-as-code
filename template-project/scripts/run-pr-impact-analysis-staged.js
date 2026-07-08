const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const LLM_JSON = path.join(DOCS_DIR, 'llm-impact-analysis.json');
const LLM_MD = path.join(DOCS_DIR, 'llm-impact-analysis.md');
const SIM_JSON = path.join(DOCS_DIR, 'last-impact-report.json');

function run(command) {
  execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function ensureDocsDir() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

function toRulePrefix(feature) {
  const explicit = {
    'create-user': 'USR',
    'get-user': 'USR',
    login: 'LOG',
    registration: 'REG',
    checkout: 'CHK',
    'list-users': 'USR',
  };

  if (explicit[feature]) {
    return explicit[feature];
  }

  return feature
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join('')
    .slice(0, 3)
    .padEnd(3, 'X');
}

function nextRuleIdForFeature(feature) {
  const mdPath = path.join(KNOWLEDGE_DIR, feature, `${feature}.md`);
  const prefix = toRulePrefix(feature);

  if (!fs.existsSync(mdPath)) {
    return `${prefix}-900`;
  }

  const content = fs.readFileSync(mdPath, 'utf8');
  const ids = [...content.matchAll(/\b([A-Z]{3})-(\d{3})\b/g)]
    .filter((m) => m[1] === prefix)
    .map((m) => Number(m[2]));

  const max = ids.length ? Math.max(...ids) : 0;
  const next = String(Math.min(max + 1, 999)).padStart(3, '0');
  return `${prefix}-${next}`;
}

function compactReason(reasons) {
  const reason = Array.isArray(reasons) && reasons.length ? String(reasons[0]) : '';
  return reason.replace(/\s+/g, ' ').trim();
}

function buildFallbackArtifact(simulated, inputFile) {
  const impactedFeatures = Array.isArray(simulated.impactedFeatures)
    ? simulated.impactedFeatures.map((item) => ({
        feature: item.feature,
        confidence: 0.5,
        reasons: item.reasons || [],
      }))
    : [];

  const proposedKnowledgeEdits = impactedFeatures.map((item) => {
    const ruleId = nextRuleIdForFeature(item.feature);
    const reason = compactReason(item.reasons);
    const baseText = `Document behavior change inferred from PR impact for ${item.feature}.`;
    const reasonText = reason ? ` Source signal: ${reason}.` : '';

    return {
      file: `knowledge/${item.feature}/${item.feature}.md`,
      ruleId,
      action: 'add',
      rationale: 'Deterministic fallback generated a concrete rule update for impacted feature.',
      suggestedText: `${baseText}${reasonText}`,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    inputFile,
    model: 'deterministic-fallback',
    impactAnalysis: {
      schemaVersion: '1.0',
      summary: 'Fallback impact analysis generated from deterministic simulation.',
      confidence: 0.5,
      impactedFeatures,
      proposedKnowledgeEdits,
      testPlan: impactedFeatures.map((item) => ({
        feature: item.feature,
        ruleIds: proposedKnowledgeEdits
          .filter((edit) => edit.file === `knowledge/${item.feature}/${item.feature}.md`)
          .map((edit) => edit.ruleId),
        suggestedTests: [`Regenerate and validate tests for ${item.feature}`],
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
