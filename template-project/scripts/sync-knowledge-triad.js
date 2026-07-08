const fs = require('fs');
const path = require('path');

const knowledgeRoot = path.join(__dirname, '..', 'knowledge');

function parseArgs(argv) {
  const args = {
    artifact: path.join(__dirname, '..', 'docs', 'llm-impact-analysis.json'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--artifact') {
      args.artifact = argv[i + 1] || args.artifact;
      i += 1;
    }
  }

  return args;
}

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseRules(mdContent) {
  const rules = [];
  const lines = mdContent.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*-\s*([A-Z]{3}-\d{3})\s*:\s*(.+?)\s*$/);
    if (match) {
      rules.push({ id: match[1], title: match[2] });
    }
  }

  return rules;
}

function parseIntent(mdContent) {
  const match = mdContent.match(/##\s+Intent\s*\r?\n([\s\S]*?)(?:\r?\n##\s|$)/);
  if (!match) {
    return '';
  }

  const firstLine = match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || '';
}

function buildYaml(featureName, intent, rules) {
  const title = slugToTitle(featureName);
  const lines = [`feature: ${title}`, `intent: ${intent || `Behavior for ${title}.`}`, 'rules:'];

  for (const rule of rules) {
    lines.push(`  - id: ${rule.id}`);
    lines.push(`    title: ${rule.title}`);
  }

  return `${lines.join('\n')}\n`;
}

function buildFeature(featureName, rules) {
  const title = slugToTitle(featureName);
  const lines = [
    `Feature: ${title}`,
    `  Product behavior for ${title.toLowerCase()}.`,
    '',
  ];

  for (const rule of rules) {
    lines.push(`  @${rule.id}`);
    lines.push(`  Scenario: ${rule.title}`);
    lines.push(`    Given rule ${rule.id} preconditions are satisfied`);
    lines.push(`    When the actor executes ${title.toLowerCase()}`);
    lines.push('    Then system behavior matches the rule statement');
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function syncFeature(featureName) {
  const dir = path.join(knowledgeRoot, featureName);
  const mdPath = path.join(dir, `${featureName}.md`);
  const yamlPath = path.join(dir, `${featureName}.yaml`);
  const featurePath = path.join(dir, `${featureName}.feature`);

  if (!fs.existsSync(mdPath) || !fs.existsSync(yamlPath) || !fs.existsSync(featurePath)) {
    return { featureName, changed: false, skipped: true };
  }

  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const rules = parseRules(mdContent);
  if (!rules.length) {
    return { featureName, changed: false, skipped: true };
  }

  const intent = parseIntent(mdContent);
  const nextYaml = buildYaml(featureName, intent, rules);
  const nextFeature = buildFeature(featureName, rules);

  const prevYaml = fs.readFileSync(yamlPath, 'utf8');
  const prevFeature = fs.readFileSync(featurePath, 'utf8');

  let changed = false;
  if (prevYaml !== nextYaml) {
    fs.writeFileSync(yamlPath, nextYaml, 'utf8');
    changed = true;
  }

  if (prevFeature !== nextFeature) {
    fs.writeFileSync(featurePath, nextFeature, 'utf8');
    changed = true;
  }

  return { featureName, changed, skipped: false };
}

function featureListFromArtifact(artifactPath) {
  if (!artifactPath || !fs.existsSync(artifactPath)) {
    return [];
  }

  const payload = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const edits = payload?.impactAnalysis?.proposedKnowledgeEdits;
  if (!Array.isArray(edits)) {
    return [];
  }

  const features = new Set();
  for (const edit of edits) {
    const file = String(edit?.file || '');
    const match = file.match(/^knowledge\/([^/]+)\//);
    if (match) {
      features.add(match[1]);
    }
  }

  return [...features].sort();
}

function main() {
  const args = parseArgs(process.argv);
  const featureDirs = fs
    .readdirSync(knowledgeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const fromArtifact = featureListFromArtifact(path.resolve(process.cwd(), args.artifact));
  const targetFeatures = fromArtifact.length
    ? featureDirs.filter((feature) => fromArtifact.includes(feature))
    : featureDirs;

  const results = targetFeatures.map(syncFeature);
  const changed = results.filter((item) => item.changed).map((item) => item.featureName);

  if (changed.length) {
    console.log(`Synchronized knowledge triad for: ${changed.join(', ')}`);
  } else {
    console.log('Knowledge triad already synchronized.');
  }
}

main();
