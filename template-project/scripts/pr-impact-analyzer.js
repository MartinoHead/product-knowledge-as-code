const fs = require('fs');
const path = require('path');

const START_MARKER = '<!-- PR-IMPACT:START -->';
const END_MARKER = '<!-- PR-IMPACT:END -->';

function parseArgs(argv) {
  const args = { input: null };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--input') {
      args.input = argv[i + 1] || null;
      i += 1;
    }
  }

  return args;
}

function readJson(filePath) {
  if (!filePath) {
    throw new Error('Missing --input path. Example: node scripts/pr-impact-analyzer.js --input scripts/pr-impact-input.json');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file does not exist: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractRequestedPasswordLength(text) {
  const match = String(text || '').match(/(\d+)\s*characters?/i);
  return match ? Number(match[1]) : null;
}

function ensureImpactBlock(content, lines) {
  const block = `${START_MARKER}\n## PR Impact Update (Prototype)\n${lines.map((line) => `- ${line}`).join('\n')}\n${END_MARKER}`;

  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  if (start >= 0 && end > start) {
    return `${content.slice(0, start)}${block}${content.slice(end + END_MARKER.length)}`;
  }

  return `${content.trimEnd()}\n\n${block}\n`;
}

function updateRegistrationFile(filePath, fullText, desiredPasswordLength) {
  let nextText = fullText;
  const updates = [];

  const passwordRulePattern = /-\s*REG-003:\s*Password length must be at least\s*(\d+)\s*characters\./i;
  const passwordMatch = nextText.match(passwordRulePattern);

  if (passwordMatch) {
    const oldLength = Number(passwordMatch[1]);
    const nextLength = desiredPasswordLength || oldLength;

    if (nextLength !== oldLength) {
      nextText = nextText.replace(
        passwordRulePattern,
        `- REG-003: Password length must be at least ${nextLength} characters.`
      );

      updates.push({
        summary: `Password rule updated in REG-003: minimum length ${oldLength} -> ${nextLength}.`,
        patch: [
          `- REG-003: Password length must be at least ${oldLength} characters.`,
          `+ REG-003: Password length must be at least ${nextLength} characters.`,
        ],
      });
    }
  }

  const emailRulePattern = /-\s*REG-001:\s*Email must be valid format\./i;
  if (emailRulePattern.test(nextText)) {
    updates.push({
      summary: 'Email validation behavior marked as impacted (REG-001/REG-002).',
      patch: [],
    });
  }

  const blockLines = [
    `updatedAt: ${new Date().toISOString()}`,
    ...updates.map((item) => item.summary),
  ];
  if (!updates.length) {
    blockLines.push('No direct rule text changed; registration behavior reviewed for impact.');
  }

  nextText = ensureImpactBlock(nextText, blockLines);

  if (nextText !== fullText) {
    fs.writeFileSync(filePath, nextText, 'utf8');
  }

  return updates;
}

function updateGenericKnowledgeFile(filePath, behaviorSummary) {
  const current = fs.readFileSync(filePath, 'utf8');
  const next = ensureImpactBlock(current, [`updatedAt: ${new Date().toISOString()}`, behaviorSummary]);

  if (next !== current) {
    fs.writeFileSync(filePath, next, 'utf8');
  }

  return [{ summary: behaviorSummary, patch: [] }];
}

function main() {
  const args = parseArgs(process.argv);
  const workspaceRoot = path.join(__dirname, '..');
  const inputPath = args.input ? path.resolve(process.cwd(), args.input) : null;
  const payload = readJson(inputPath);

  const filesChanged = Array.isArray(payload.filesChanged) ? payload.filesChanged : [];
  const description = String(payload.description || '');
  const searchable = `${filesChanged.join(' ')} ${description}`.toLowerCase();

  const knowledgeRoot = path.join(workspaceRoot, 'knowledge');
  const targets = [];

  if (searchable.includes('password') || searchable.includes('email')) {
    targets.push(path.join(knowledgeRoot, 'registration', 'registration.md'));
  }
  if (searchable.includes('checkout')) {
    targets.push(path.join(knowledgeRoot, 'checkout', 'checkout.md'));
  }
  if (searchable.includes('user')) {
    targets.push(path.join(knowledgeRoot, 'create-user', 'create-user.md'));
    targets.push(path.join(knowledgeRoot, 'get-user', 'get-user.md'));
  }

  const affected = [...new Set(targets)].filter((file) => fs.existsSync(file));
  const updatesByFile = new Map();
  const desiredPasswordLength = extractRequestedPasswordLength(description);

  for (const file of affected) {
    if (file.endsWith(path.join('registration', 'registration.md'))) {
      const current = fs.readFileSync(file, 'utf8');
      const updates = updateRegistrationFile(file, current, desiredPasswordLength);
      updatesByFile.set(file, updates);
      continue;
    }

    if (file.endsWith(path.join('checkout', 'checkout.md'))) {
      const updates = updateGenericKnowledgeFile(file, 'Checkout behavior marked as impacted by PR context.');
      updatesByFile.set(file, updates);
      continue;
    }

    const updates = updateGenericKnowledgeFile(file, 'User behavior marked as impacted by PR context.');
    updatesByFile.set(file, updates);
  }

  console.log('Affected knowledge files:');
  if (!affected.length) {
    console.log('- (none detected by rule-based mapping)');
  } else {
    for (const file of affected) {
      const rel = path.relative(workspaceRoot, file).replace(/\\/g, '/');
      console.log(`- /${rel}`);
    }
  }

  console.log('');
  console.log('Updates:');
  if (!affected.length) {
    console.log('- No knowledge updates were applied.');
  } else {
    for (const file of affected) {
      const rel = path.relative(workspaceRoot, file).replace(/\\/g, '/');
      const updates = updatesByFile.get(file) || [];

      if (!updates.length) {
        console.log(`- ${rel}: reviewed for impact, no direct rule text change.`);
        continue;
      }

      for (const update of updates) {
        console.log(`- ${rel}: ${update.summary}`);
        if (update.patch.length) {
          console.log('  Patch:');
          for (const line of update.patch) {
            console.log(`  ${line}`);
          }
        }
      }
    }
  }

  console.log('');
  console.log('Next step:');
  console.log('- Trigger test generation from updated knowledge');
  console.log('- Suggested command: npm run generate:md-tests');
}

main();
