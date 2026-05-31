const fs = require('fs');
const path = require('path');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const outDir = path.join(__dirname, '..', 'tests', 'playwright');

function parseRulesFromMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const rules = [];

  for (const line of lines) {
    const match = line.match(/^-\s*([A-Z]{3}-\d{3})\s*:\s*(.+)$/);
    if (match) {
      rules.push({ id: match[1], text: match[2].trim() });
    }
  }

  return rules;
}

function listMarkdownFiles(root) {
  const features = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
  const files = [];

  for (const feature of features) {
    const file = path.join(root, feature.name, `${feature.name}.md`);
    if (fs.existsSync(file)) {
      files.push({ feature: feature.name, file });
    }
  }

  return files.sort((a, b) => a.feature.localeCompare(b.feature));
}

function buildSpec(feature, rules) {
  const tests = rules
    .map(
      (rule) =>
        `test('[${rule.id}] ${rule.text}', async ({ page }) => {\n` +
        `  // Generated from knowledge/${feature}/${feature}.md\n` +
        `  // TODO: implement deterministic scenario for ${rule.id}.\n` +
        `});\n`
    )
    .join('\n');

  return (
    `import { test } from '@playwright/test';\n\n` +
    `// Demo-generated from Markdown knowledge source of truth.\n` +
    `// This file is a derived artifact.\n\n` +
    tests
  );
}

function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const markdownFiles = listMarkdownFiles(knowledgeDir);

  for (const entry of markdownFiles) {
    const content = fs.readFileSync(entry.file, 'utf8');
    const rules = parseRulesFromMarkdown(content);
    const outFile = path.join(outDir, `${entry.feature}.generated.spec.ts`);

    const spec = buildSpec(entry.feature, rules);
    fs.writeFileSync(outFile, spec, 'utf8');
    console.log(`Generated ${path.relative(process.cwd(), outFile)} (${rules.length} rule tests)`);
  }
}

main();
