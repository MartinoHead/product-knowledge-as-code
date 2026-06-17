const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    input: path.join(__dirname, 'pr-impact-input.json'),
    outJson: path.join(__dirname, '..', 'docs', 'llm-impact-analysis.json'),
    outMd: path.join(__dirname, '..', 'docs', 'llm-impact-analysis.md'),
    outRaw: path.join(__dirname, '..', 'docs', 'llm-impact-analysis.raw.json'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--input') {
      args.input = argv[i + 1] || args.input;
      i += 1;
      continue;
    }
    if (argv[i] === '--out-json') {
      args.outJson = argv[i + 1] || args.outJson;
      i += 1;
      continue;
    }
    if (argv[i] === '--out-md') {
      args.outMd = argv[i + 1] || args.outMd;
      i += 1;
      continue;
    }
    if (argv[i] === '--out-raw') {
      args.outRaw = argv[i + 1] || args.outRaw;
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

function getKnownFeatures(knowledgeDir) {
  return fs
    .readdirSync(knowledgeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function toJsonString(value) {
  return JSON.stringify(value, null, 2);
}

function extractJson(content) {
  const trimmed = String(content || '').trim();
  if (!trimmed) {
    throw new Error('LLM response content is empty.');
  }

  if (trimmed.startsWith('```')) {
    const withoutFenceStart = trimmed.replace(/^```[a-zA-Z0-9_-]*\s*/, '');
    const withoutFenceEnd = withoutFenceStart.replace(/\s*```$/, '');
    return JSON.parse(withoutFenceEnd);
  }

  return JSON.parse(trimmed);
}

function assertString(value, pathLabel, errors) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${pathLabel} must be a non-empty string`);
  }
}

function assertConfidence(value, pathLabel, errors) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
    errors.push(`${pathLabel} must be a number between 0 and 1`);
  }
}

function validateSchema(result, knownFeatures) {
  const errors = [];

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('LLM response is not a JSON object.');
  }

  assertString(result.schemaVersion, 'schemaVersion', errors);
  assertString(result.summary, 'summary', errors);
  assertConfidence(result.confidence, 'confidence', errors);

  if (!Array.isArray(result.impactedFeatures)) {
    errors.push('impactedFeatures must be an array');
  } else {
    result.impactedFeatures.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`impactedFeatures[${index}] must be an object`);
        return;
      }

      assertString(item.feature, `impactedFeatures[${index}].feature`, errors);
      assertConfidence(item.confidence, `impactedFeatures[${index}].confidence`, errors);

      if (!knownFeatures.includes(item.feature)) {
        errors.push(
          `impactedFeatures[${index}].feature must be one of: ${knownFeatures.join(', ')}`
        );
      }

      if (!Array.isArray(item.reasons) || item.reasons.some((reason) => typeof reason !== 'string')) {
        errors.push(`impactedFeatures[${index}].reasons must be an array of strings`);
      }
    });
  }

  if (!Array.isArray(result.proposedKnowledgeEdits)) {
    errors.push('proposedKnowledgeEdits must be an array');
  } else {
    const validActions = new Set(['update', 'add', 'remove', 'review']);

    result.proposedKnowledgeEdits.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`proposedKnowledgeEdits[${index}] must be an object`);
        return;
      }

      assertString(item.file, `proposedKnowledgeEdits[${index}].file`, errors);
      assertString(item.ruleId, `proposedKnowledgeEdits[${index}].ruleId`, errors);
      assertString(item.action, `proposedKnowledgeEdits[${index}].action`, errors);
      assertString(item.rationale, `proposedKnowledgeEdits[${index}].rationale`, errors);
      assertString(item.suggestedText, `proposedKnowledgeEdits[${index}].suggestedText`, errors);

      if (typeof item.file === 'string' && !item.file.startsWith('knowledge/')) {
        errors.push(`proposedKnowledgeEdits[${index}].file must start with knowledge/`);
      }

      if (typeof item.action === 'string' && !validActions.has(item.action)) {
        errors.push(
          `proposedKnowledgeEdits[${index}].action must be one of: ${[...validActions].join(', ')}`
        );
      }
    });
  }

  if (!Array.isArray(result.testPlan)) {
    errors.push('testPlan must be an array');
  } else {
    result.testPlan.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`testPlan[${index}] must be an object`);
        return;
      }

      assertString(item.feature, `testPlan[${index}].feature`, errors);

      if (!knownFeatures.includes(item.feature)) {
        errors.push(`testPlan[${index}].feature must be one of: ${knownFeatures.join(', ')}`);
      }

      if (!Array.isArray(item.ruleIds) || item.ruleIds.some((id) => typeof id !== 'string')) {
        errors.push(`testPlan[${index}].ruleIds must be an array of strings`);
      }

      if (
        !Array.isArray(item.suggestedTests) ||
        item.suggestedTests.some((testName) => typeof testName !== 'string')
      ) {
        errors.push(`testPlan[${index}].suggestedTests must be an array of strings`);
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(`LLM output schema validation failed:\n- ${errors.join('\n- ')}`);
  }
}

function toMarkdownReport(payload) {
  const impactedLines = payload.impactAnalysis.impactedFeatures
    .map((item) => `- ${item.feature} (confidence: ${item.confidence})\n  - ${item.reasons.join('\n  - ')}`)
    .join('\n');

  const editLines = payload.impactAnalysis.proposedKnowledgeEdits
    .map(
      (item) =>
        `- ${item.file} | ${item.ruleId} | ${item.action}\n  - rationale: ${item.rationale}\n  - suggestedText: ${item.suggestedText}`
    )
    .join('\n');

  const planLines = payload.impactAnalysis.testPlan
    .map(
      (item) =>
        `- ${item.feature}\n  - ruleIds: ${item.ruleIds.join(', ') || '(none)'}\n  - tests: ${item.suggestedTests.join('; ') || '(none)'}`
    )
    .join('\n');

  return [
    '# LLM PR Impact Analysis',
    '',
    `Generated: ${payload.generatedAt}`,
    `Model: ${payload.model}`,
    `Input: ${payload.inputFile}`,
    '',
    '## Summary',
    payload.impactAnalysis.summary,
    '',
    `Overall confidence: ${payload.impactAnalysis.confidence}`,
    '',
    '## Impacted Features',
    impactedLines || '- (none)',
    '',
    '## Proposed Knowledge Edits',
    editLines || '- (none)',
    '',
    '## Suggested Test Plan',
    planLines || '- (none)',
    '',
  ].join('\n');
}

async function callOpenAiAnalysis(prInput, knownFeatures) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Set it in your environment or CI secret.');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const systemPrompt = [
    'You are a strict PR impact analyzer for Product Knowledge as Code.',
    'Return only valid JSON matching the required schema exactly.',
    'Do not include markdown fences or prose outside JSON.',
    `Allowed features: ${knownFeatures.join(', ')}.`,
    'Output schema:',
    '{',
    '  "schemaVersion": "1.0",',
    '  "summary": "string",',
    '  "confidence": 0.0,',
    '  "impactedFeatures": [',
    '    { "feature": "string", "confidence": 0.0, "reasons": ["string"] }',
    '  ],',
    '  "proposedKnowledgeEdits": [',
    '    {',
    '      "file": "knowledge/<feature>/<feature>.md",',
    '      "ruleId": "REG-001",',
    '      "action": "update|add|remove|review",',
    '      "rationale": "string",',
    '      "suggestedText": "string"',
    '    }',
    '  ],',
    '  "testPlan": [',
    '    { "feature": "string", "ruleIds": ["string"], "suggestedTests": ["string"] }',
    '  ]',
    '}',
  ].join('\n');

  const userPrompt = [
    'Analyze this PR input and provide impact + proposed knowledge updates.',
    toJsonString(prInput),
  ].join('\n\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API request failed (${response.status}): ${errorText}`);
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  const parsed = extractJson(content);

  return {
    model,
    parsed,
    raw: body,
  };
}

function ensureDirectoryForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv);
  const projectRoot = path.join(__dirname, '..');
  const knowledgeDir = path.join(projectRoot, 'knowledge');

  const inputPath = path.resolve(process.cwd(), args.input);
  const outJsonPath = path.resolve(process.cwd(), args.outJson);
  const outMdPath = path.resolve(process.cwd(), args.outMd);
  const outRawPath = path.resolve(process.cwd(), args.outRaw);

  const prInput = readJson(inputPath);
  const knownFeatures = getKnownFeatures(knowledgeDir);

  const result = await callOpenAiAnalysis(prInput, knownFeatures);
  validateSchema(result.parsed, knownFeatures);

  const artifact = {
    generatedAt: new Date().toISOString(),
    inputFile: path.relative(process.cwd(), inputPath).replace(/\\/g, '/'),
    model: result.model,
    impactAnalysis: result.parsed,
  };

  ensureDirectoryForFile(outJsonPath);
  ensureDirectoryForFile(outMdPath);
  ensureDirectoryForFile(outRawPath);

  fs.writeFileSync(outJsonPath, `${toJsonString(artifact)}\n`, 'utf8');
  fs.writeFileSync(outMdPath, toMarkdownReport(artifact), 'utf8');
  fs.writeFileSync(outRawPath, `${toJsonString(result.raw)}\n`, 'utf8');

  console.log('LLM PR impact analysis complete.');
  console.log(`JSON artifact: ${path.relative(process.cwd(), outJsonPath)}`);
  console.log(`Markdown artifact: ${path.relative(process.cwd(), outMdPath)}`);
  console.log(`Raw response artifact: ${path.relative(process.cwd(), outRawPath)}`);
  console.log(`Model: ${result.model}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
