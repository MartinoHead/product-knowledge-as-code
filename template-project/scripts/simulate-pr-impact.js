const fs = require('fs');
const path = require('path');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const docsDir = path.join(__dirname, '..', 'docs');
const diffInput = process.argv[2] || path.join(__dirname, 'mock-pr-diff.txt');

const featureKeywords = {
  registration: ['register', 'registration', 'signup', 'verify-email'],
  login: ['login', 'auth', 'session', 'token', 'credential'],
  checkout: ['checkout', 'cart', 'payment', 'order', 'shipping'],
  'create-user': ['create user', 'create-user', 'user create', 'provision user'],
  'get-user': ['get user', 'get-user', 'user fetch', 'user profile', 'user read'],
};

function listFeatureFolders(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readChangedLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'));
}

function normalizeChangedPath(line) {
  const match = line.match(/^(A|M|D|R)\s+(.+)$/);
  if (match) {
    return match[2].trim();
  }

  return line;
}

function inferImpacts(changedLines, features) {
  const impacts = new Map();

  for (const line of changedLines) {
    const changed = normalizeChangedPath(line).toLowerCase();

    for (const feature of features) {
      const reasons = impacts.get(feature) || [];

      if (changed.includes(`/knowledge/${feature}/`) || changed.includes(`\\knowledge\\${feature}\\`)) {
        reasons.push(`direct knowledge change: ${line}`);
        impacts.set(feature, reasons);
        continue;
      }

      const keywords = featureKeywords[feature] || [];
      const matchedKeyword = keywords.find((keyword) => changed.includes(keyword));
      if (matchedKeyword) {
        reasons.push(`keyword "${matchedKeyword}" matched: ${line}`);
        impacts.set(feature, reasons);
      }
    }
  }

  return impacts;
}

function knowledgePath(feature, ext) {
  return path.join('knowledge', feature, `${feature}.${ext}`);
}

function toMarkdownReport(inputFile, changedLines, impacts) {
  const now = new Date().toISOString();
  const impactedFeatures = [...impacts.keys()].sort();

  const changedSection = changedLines.length
    ? changedLines.map((line) => `- ${line}`).join('\n')
    : '- (none provided)';

  const impactSection = impactedFeatures.length
    ? impactedFeatures
        .map((feature) => {
          const reasons = impacts.get(feature) || [];
          const reasonText = reasons.map((r) => `  - ${r}`).join('\n');
          return (
            `- ${feature}\n` +
            `  - update ${knowledgePath(feature, 'md')}\n` +
            `  - regenerate tests for ${feature}\n` +
            reasonText
          );
        })
        .join('\n')
    : '- no impacted feature detected by rule-based mapping';

  return `# Simulated PR Impact Report\n\nGenerated: ${now}\nInput: ${path.basename(inputFile)}\n\n## Changed Files (Simulated)\n${changedSection}\n\n## Impacted Knowledge Areas\n${impactSection}\n\n## Suggested Agent Actions\n1. Update impacted markdown knowledge files first.\n2. Regenerate tests from knowledge.\n3. Run execution workflow and review results.\n4. Feed failures back into knowledge rules.\n`;
}

function main() {
  const features = listFeatureFolders(knowledgeDir);
  const changedLines = readChangedLines(diffInput);

  const lines = changedLines.length
    ? changedLines
    : ['M src/auth/register-controller.ts', 'M src/auth/token-service.ts'];

  const impacts = inferImpacts(lines, features);

  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const report = toMarkdownReport(diffInput, lines, impacts);
  const outFile = path.join(docsDir, 'last-impact-report.md');
  const jsonOutFile = path.join(docsDir, 'last-impact-report.json');
  fs.writeFileSync(outFile, report, 'utf8');

  const jsonPayload = {
    generatedAt: new Date().toISOString(),
    input: path.basename(diffInput),
    changedLines: lines,
    impactedFeatures: [...impacts.entries()]
      .map(([feature, reasons]) => ({ feature, reasons }))
      .sort((a, b) => a.feature.localeCompare(b.feature)),
  };
  fs.writeFileSync(jsonOutFile, JSON.stringify(jsonPayload, null, 2), 'utf8');

  console.log('Simulated PR impact analysis complete.');
  console.log(`Input lines: ${lines.length}`);
  console.log(`Impacted features: ${[...impacts.keys()].sort().join(', ') || 'none'}`);
  console.log(`Report: ${path.relative(process.cwd(), outFile)}`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonOutFile)}`);
}

main();
