const fs = require('fs');
const path = require('path');
const { getFeatureRules, verifyKnowledgeSync } = require('./knowledge-utils');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const testDir = path.join(__dirname, '..', 'tests', 'playwright');

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const { issues, bundle } = verifyKnowledgeSync(knowledgeDir);
if (issues.length) {
  console.error('Knowledge is not synchronized across md/yaml/gherkin:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

for (const feature of bundle) {
  const ruleEntries = getFeatureRules(feature);
  const outFile = path.join(testDir, `${feature.featureName}.spec.ts`);

  const tests = ruleEntries
    .map(
      ([id, text]) =>
        `test('[${id}] ${text}', async ({ page }) => {\n` +
        `  // TODO: implement scenario for ${id}.\n` +
        `  // Use resilient locators and deterministic assertions.\n` +
        `});\n`
    )
    .join('\n');

  const content =
    `import { test } from '@playwright/test';\n\n` +
    `// Auto-generated scaffold from synchronized knowledge (md/yaml/gherkin).\n` +
    `// Fill each TODO with executable assertions.\n\n` +
    tests;

  fs.writeFileSync(outFile, content, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
}
