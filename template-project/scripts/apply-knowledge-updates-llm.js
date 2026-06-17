const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    input: path.join(__dirname, '..', 'docs', 'llm-impact-analysis.json'),
    validation: path.join(__dirname, '..', 'docs', 'llm-impact-validation.json'),
    out: path.join(__dirname, '..', 'docs', 'llm-knowledge-apply.json'),
    apply: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--input') {
      args.input = argv[i + 1] || args.input;
      i += 1;
      continue;
    }
    if (argv[i] === '--validation') {
      args.validation = argv[i + 1] || args.validation;
      i += 1;
      continue;
    }
    if (argv[i] === '--out') {
      args.out = argv[i + 1] || args.out;
      i += 1;
      continue;
    }
    if (argv[i] === '--apply') {
      args.apply = true;
    }
  }

  return args;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeRuleLine(ruleId, suggestedText) {
  const trimmed = String(suggestedText || '').trim();
  if (!trimmed) {
    return `- ${ruleId}:`;
  }

  if (trimmed.startsWith(`- ${ruleId}:`)) {
    return trimmed;
  }

  return `- ${ruleId}: ${trimmed}`;
}

function applyEditToMarkdown(content, edit) {
  const ruleRegex = new RegExp(`^-\\s*${edit.ruleId}:.*$`, 'm');
  const exists = ruleRegex.test(content);

  if (edit.action === 'review') {
    return { nextContent: content, changed: false, note: 'review_only' };
  }

  if (edit.action === 'update') {
    if (!exists) {
      return { nextContent: content, changed: false, note: 'missing_rule_for_update' };
    }

    const nextLine = normalizeRuleLine(edit.ruleId, edit.suggestedText);
    return {
      nextContent: content.replace(ruleRegex, nextLine),
      changed: true,
      note: 'updated',
    };
  }

  if (edit.action === 'remove') {
    if (!exists) {
      return { nextContent: content, changed: false, note: 'missing_rule_for_remove' };
    }

    return {
      nextContent: content.replace(new RegExp(`^.*${edit.ruleId}.*(?:\\r?\\n|$)`, 'm'), ''),
      changed: true,
      note: 'removed',
    };
  }

  if (edit.action === 'add') {
    if (exists) {
      return { nextContent: content, changed: false, note: 'rule_already_exists' };
    }

    const nextLine = normalizeRuleLine(edit.ruleId, edit.suggestedText);
    const nextContent = `${content.trimEnd()}\n${nextLine}\n`;
    return { nextContent, changed: true, note: 'added' };
  }

  return { nextContent: content, changed: false, note: 'unknown_action' };
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const args = parseArgs(process.argv);
  const applyMode = args.apply || process.env.APPLY_LLM_KNOWLEDGE_UPDATES === 'true';

  const inputPath = path.resolve(process.cwd(), args.input);
  const validationPath = path.resolve(process.cwd(), args.validation);
  const outPath = path.resolve(process.cwd(), args.out);

  const artifact = readJson(inputPath);
  const validation = readJson(validationPath);

  if (!validation.valid) {
    throw new Error(
      `Refusing to apply updates because validation is not valid. See: ${path.relative(
        process.cwd(),
        validationPath
      )}`
    );
  }

  const edits = artifact?.impactAnalysis?.proposedKnowledgeEdits || [];
  const maxLineChanges = Number(process.env.LLM_APPLY_MAX_LINE_CHANGES || 40);
  let lineChanges = 0;

  const operations = [];

  for (const edit of edits) {
    const filePath = path.resolve(process.cwd(), edit.file);
    const before = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    const result = applyEditToMarkdown(before, edit);

    if (result.changed) {
      const delta = Math.abs(before.split(/\r?\n/).length - result.nextContent.split(/\r?\n/).length) + 1;
      lineChanges += delta;
    }

    if (lineChanges > maxLineChanges) {
      throw new Error(
        `Aborting apply: bounded-change limit exceeded (${lineChanges} > ${maxLineChanges}).`
      );
    }

    if (applyMode && result.changed) {
      fs.writeFileSync(filePath, result.nextContent, 'utf8');
    }

    operations.push({
      file: edit.file,
      ruleId: edit.ruleId,
      action: edit.action,
      note: result.note,
      changed: result.changed,
      applied: applyMode && result.changed,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    inputFile: path.relative(process.cwd(), inputPath).replace(/\\/g, '/'),
    validationFile: path.relative(process.cwd(), validationPath).replace(/\\/g, '/'),
    applyMode,
    maxLineChanges,
    lineChanges,
    operations,
  };

  ensureParentDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Knowledge apply summary written: ${path.relative(process.cwd(), outPath)}`);
  if (!applyMode) {
    console.log('Dry-run only. Use --apply or APPLY_LLM_KNOWLEDGE_UPDATES=true to persist changes.');
  }
}

main();
