const path = require('path');
const { verifyKnowledgeSync } = require('./knowledge-utils');

const knowledgeDir = path.join(__dirname, '..', 'knowledge');
const { issues, bundle } = verifyKnowledgeSync(knowledgeDir);

if (issues.length) {
  console.error('Knowledge sync check failed:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log(`Knowledge sync OK (${bundle.length} feature(s), md/yaml/gherkin aligned).`);
