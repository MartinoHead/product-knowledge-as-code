const fs = require('fs');
const path = require('path');
const { verifyKnowledgeSync } = require('./knowledge-utils');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const apiDir = path.join(__dirname, '..', 'tests', 'api');
const outDir = path.join(__dirname, '..', 'tests', 'playwright');

function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const { issues, bundle } = verifyKnowledgeSync(knowledgeDir);
  if (issues.length) {
    console.error('Knowledge is not synchronized across md/yaml/gherkin:');
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  for (const feature of bundle) {
    const specBaseName = feature.featureName.replace(/[\\/]/g, '-');
    const apiFile = path.join(apiDir, `${specBaseName}.api.spec.ts`);
    const outFile = path.join(outDir, `${specBaseName}.generated.spec.ts`);

    if (!fs.existsSync(apiFile)) {
      throw new Error(`API spec not found for feature '${specBaseName}': ${apiFile}`);
    }

    const apiContent = fs.readFileSync(apiFile, 'utf8');
    const spec = apiContent
      .replace('Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).', 'Demo-generated executable tests from Markdown knowledge source of truth.')
      .replace('Generator emits executable deterministic baseline scenarios.', 'This file is a derived artifact generated from synchronized knowledge and API test templates.')
      .replace(/\[([A-Z]+-\d+)\] API /g, '[$1] ');

    fs.writeFileSync(outFile, spec, 'utf8');
    console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
  }
}

main();
