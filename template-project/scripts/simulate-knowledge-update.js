const fs = require('fs');
const path = require('path');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const impactJsonPath = process.argv[2] || path.join(__dirname, '..', 'docs', 'last-impact-report.json');

const START = '<!-- AGENT-LAST-UPDATE:START -->';
const END = '<!-- AGENT-LAST-UPDATE:END -->';

function loadImpact(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Impact file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function updateKnowledgeFile(feature, reasons, generatedAt, input) {
  const mdFile = path.join(knowledgeDir, feature, `${feature}.md`);
  if (!fs.existsSync(mdFile)) {
    return false;
  }

  const content = fs.readFileSync(mdFile, 'utf8');
  const reasonLines = reasons.map((reason) => `- ${reason}`).join('\n');
  const block =
    `${START}\n` +
    `## Agent Update Note (Simulated)\n` +
    `- timestamp: ${generatedAt}\n` +
    `- source: ${input}\n` +
    `- impact: ${feature}\n` +
    `${reasonLines}\n` +
    `${END}`;

  let nextContent;
  const startIndex = content.indexOf(START);
  const endIndex = content.indexOf(END);

  if (startIndex >= 0 && endIndex > startIndex) {
    const afterEnd = endIndex + END.length;
    nextContent = `${content.slice(0, startIndex)}${block}${content.slice(afterEnd)}`;
  } else {
    nextContent = `${content.trimEnd()}\n\n${block}\n`;
  }

  fs.writeFileSync(mdFile, nextContent, 'utf8');
  return true;
}

function main() {
  const impact = loadImpact(impactJsonPath);
  const generatedAt = impact.generatedAt || new Date().toISOString();
  const input = impact.input || path.basename(impactJsonPath);
  const impactedFeatures = impact.impactedFeatures || [];

  if (!impactedFeatures.length) {
    console.log('No impacted features found. Knowledge files unchanged.');
    return;
  }

  let updated = 0;
  for (const item of impactedFeatures) {
    const didUpdate = updateKnowledgeFile(item.feature, item.reasons || [], generatedAt, input);
    if (didUpdate) {
      updated += 1;
      console.log(`Updated knowledge/${item.feature}/${item.feature}.md`);
    }
  }

  console.log(`Simulated agent knowledge update complete (${updated} file(s) updated).`);
}

main();
