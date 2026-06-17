const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    input: path.join(__dirname, '..', 'docs', 'llm-impact-analysis.json'),
    out: path.join(__dirname, '..', 'docs', 'llm-impact-validation.json'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--input') {
      args.input = argv[i + 1] || args.input;
      i += 1;
      continue;
    }

    if (argv[i] === '--out') {
      args.out = argv[i + 1] || args.out;
      i += 1;
    }
  }

  return args;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listFeatures(knowledgeRoot) {
  return fs
    .readdirSync(knowledgeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function collectRuleIds(knowledgeRoot, features) {
  const index = new Map();

  for (const feature of features) {
    const mdPath = path.join(knowledgeRoot, feature, `${feature}.md`);
    const ruleIds = new Set();

    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf8');
      const matches = content.match(/\b[A-Z]{3}-\d{3}\b/g) || [];
      for (const id of matches) {
        ruleIds.add(id);
      }
    }

    index.set(feature, ruleIds);
  }

  return index;
}

function validateArtifact(artifact, features, ruleIndex) {
  const errors = [];
  const warnings = [];

  const maxFiles = Number(process.env.LLM_MAX_FILES || 5);
  const maxEdits = Number(process.env.LLM_MAX_EDITS || 30);
  const maxChars = Number(process.env.LLM_MAX_SUGGESTED_TEXT_CHARS || 500);

  if (!artifact || typeof artifact !== 'object') {
    errors.push('Artifact root must be an object.');
    return { errors, warnings };
  }

  const analysis = artifact.impactAnalysis;
  if (!analysis || typeof analysis !== 'object') {
    errors.push('impactAnalysis object is required.');
    return { errors, warnings };
  }

  if (!Array.isArray(analysis.impactedFeatures)) {
    errors.push('impactAnalysis.impactedFeatures must be an array.');
  }

  if (!Array.isArray(analysis.proposedKnowledgeEdits)) {
    errors.push('impactAnalysis.proposedKnowledgeEdits must be an array.');
  }

  if (!Array.isArray(analysis.testPlan)) {
    errors.push('impactAnalysis.testPlan must be an array.');
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }

  const touchedFiles = new Set();

  for (const [index, item] of analysis.proposedKnowledgeEdits.entries()) {
    if (!item || typeof item !== 'object') {
      errors.push(`proposedKnowledgeEdits[${index}] must be an object.`);
      continue;
    }

    const action = String(item.action || '').trim();
    const file = String(item.file || '').trim();
    const ruleId = String(item.ruleId || '').trim();
    const suggestedText = String(item.suggestedText || '').trim();

    if (!['update', 'add', 'remove', 'review'].includes(action)) {
      errors.push(`proposedKnowledgeEdits[${index}].action must be update|add|remove|review.`);
    }

    if (!file.startsWith('knowledge/')) {
      errors.push(`proposedKnowledgeEdits[${index}].file must start with knowledge/.`);
      continue;
    }

    const parts = file.split('/');
    const feature = parts[1];

    if (!features.includes(feature)) {
      errors.push(`proposedKnowledgeEdits[${index}] references unknown feature: ${feature}.`);
      continue;
    }

    const expectedMd = `knowledge/${feature}/${feature}.md`;
    if (file !== expectedMd) {
      errors.push(
        `proposedKnowledgeEdits[${index}].file must be exactly ${expectedMd} for guarded apply.`
      );
    }

    touchedFiles.add(file);

    const ruleSet = ruleIndex.get(feature) || new Set();
    if (!ruleSet.has(ruleId)) {
      if (action === 'add') {
        warnings.push(
          `proposedKnowledgeEdits[${index}] adds new ruleId ${ruleId} for feature ${feature}.`
        );
      } else if (action !== 'review') {
        errors.push(
          `proposedKnowledgeEdits[${index}] references unknown ruleId ${ruleId} for feature ${feature}.`
        );
      }
    }

    if (suggestedText.length > maxChars) {
      errors.push(
        `proposedKnowledgeEdits[${index}].suggestedText exceeds max length (${maxChars}).`
      );
    }
  }

  if (touchedFiles.size > maxFiles) {
    errors.push(`Too many touched files (${touchedFiles.size}); max allowed is ${maxFiles}.`);
  }

  if (analysis.proposedKnowledgeEdits.length > maxEdits) {
    errors.push(
      `Too many proposed edits (${analysis.proposedKnowledgeEdits.length}); max allowed is ${maxEdits}.`
    );
  }

  return { errors, warnings };
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const args = parseArgs(process.argv);
  const projectRoot = path.join(__dirname, '..');
  const knowledgeRoot = path.join(projectRoot, 'knowledge');

  const inputPath = path.resolve(process.cwd(), args.input);
  const outPath = path.resolve(process.cwd(), args.out);

  const artifact = readJson(inputPath);
  const features = listFeatures(knowledgeRoot);
  const ruleIndex = collectRuleIds(knowledgeRoot, features);
  const { errors, warnings } = validateArtifact(artifact, features, ruleIndex);

  const result = {
    generatedAt: new Date().toISOString(),
    inputFile: path.relative(process.cwd(), inputPath).replace(/\\/g, '/'),
    valid: errors.length === 0,
    errors,
    warnings,
  };

  ensureParentDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  console.log(`Validation result written: ${path.relative(process.cwd(), outPath)}`);
  if (warnings.length > 0) {
    console.log(`Warnings: ${warnings.length}`);
  }

  if (errors.length > 0) {
    console.error('LLM impact validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('LLM impact validation passed.');
  }
}

main();
