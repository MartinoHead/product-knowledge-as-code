const fs = require('fs');
const path = require('path');
const { getFeatureRules, verifyKnowledgeSync } = require('./knowledge-utils');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const testDir = path.join(__dirname, '..', 'tests', 'playwright');

const rules = new Set();
const { issues, bundle } = verifyKnowledgeSync(knowledgeDir);
if (issues.length) {
  console.error('Knowledge is not synchronized across md/yaml/gherkin:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

for (const feature of bundle) {
  getFeatureRules(feature).forEach(([id]) => rules.add(id));
}

const testFiles = fs.existsSync(testDir)
  ? fs.readdirSync(testDir).filter((file) => file.endsWith('.ts'))
  : [];

const covered = new Set();
for (const file of testFiles) {
  const content = fs.readFileSync(path.join(testDir, file), 'utf8');
  const matches = content.match(/\[[A-Z]{3}-\d{3}\]/g) || [];
  matches.map((item) => item.replace(/\[|\]/g, '')).forEach((id) => covered.add(id));
}

const uncovered = [...rules].filter((id) => !covered.has(id));

if (uncovered.length) {
  console.error('Uncovered rules:', uncovered.join(', '));
  process.exit(1);
}

console.log(`Rule coverage OK (${rules.size} rules covered).`);
