const https = require('https');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { getFeatureRules, verifyKnowledgeSync } = require('./knowledge-utils');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_MODEL = 'gpt-4o';
const OPENAI_BASE_URL = 'https://models.inference.ai.azure.com';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/generate-api-tests-llm.js --feature <feature> [--rule <RULE-ID>] [--output <file>]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/generate-api-tests-llm.js --feature registration --rule REG-001 --output tests/api/registration/REG-001.llm.spec.ts');
  console.log('  node scripts/generate-api-tests-llm.js --feature registration');
}

function parseResponse(content) {
  const trimmed = String(content || '').trim();

  if (!trimmed) {
    throw new Error('Empty LLM response');
  }

  if (trimmed.startsWith('```')) {
    const start = trimmed.indexOf('\n');
    const end = trimmed.lastIndexOf('```');

    if (start >= 0 && end > start) {
      return trimmed.slice(start + 1, end).trim();
    }
  }

  return trimmed;
}

function validateTypeScript(code) {
  try {
    ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    return true;
  } catch (error) {
    throw new Error(`Invalid TypeScript: ${error.message}`);
  }
}

function extractTextContent(messageContent) {
  if (typeof messageContent === 'string') {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part.text === 'string') {
          return part.text;
        }

        return '';
      })
      .join('');
  }

  return '';
}

function callGitHubModels(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Playwright test engineer writing API tests for a SaaS application. Generate only valid, executable TypeScript test code. No explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      top_p: 0.1,
      max_tokens: 800,
    });

    const baseUrl = new URL(OPENAI_BASE_URL);
    const req = https.request(
      {
        hostname: baseUrl.hostname,
        path: '/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`API error ${res.statusCode}: ${data}`));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const message = parsed?.choices?.[0]?.message?.content;
            resolve(extractTextContent(message));
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function buildPrompt(featureName, ruleId, ruleTitle, relatedRules) {
  const relatedLines = relatedRules.length
    ? relatedRules.map((rule) => `- ${rule[0]}: ${rule[1]}`).join('\n')
    : '- (none)';

  return [
    'Generate a Playwright API test for this feature rule.',
    '',
    `Feature: ${featureName}`,
    `Rule ID: ${ruleId}`,
    `Rule Title: ${ruleTitle}`,
    '',
    'Related rules for context:',
    relatedLines,
    '',
    'Requirements:',
    '1. Test should verify the rule requirement.',
    "2. Use Playwright's request object.",
    '3. Include proper assertions with expect().',
    '4. Handle 503 service_unavailable errors gracefully.',
    '5. Use uniqueEmail() helper for generated test emails when creating users.',
    "6. Format: test('[RULE_ID] API ...', async ({ request }) => { ... }).",
    '7. Return ONLY the test function code, no markdown fences or explanations.',
  ].join('\n');
}

function ensureOutputDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function ensureBasicTestContract(generatedCode, ruleId) {
  if (!generatedCode.includes('test(')) {
    throw new Error(`Generated code for ${ruleId} does not start a Playwright test (missing test().`);
  }

  if (!generatedCode.includes('expect(')) {
    throw new Error(`Generated code for ${ruleId} is missing expect() assertions.`);
  }

  if (!generatedCode.includes(ruleId)) {
    throw new Error(`Generated code for ${ruleId} does not contain the rule ID.`);
  }
}

function resolveOutputPath(featureName, ruleId, outputArg, ruleCount) {
  if (outputArg && ruleCount === 1) {
    return path.resolve(process.cwd(), outputArg);
  }

  if (outputArg && ruleCount > 1) {
    return path.resolve(process.cwd(), outputArg, `${ruleId}.llm.spec.ts`);
  }

  return path.join(process.cwd(), 'tests', 'api', featureName, `${ruleId}.llm.spec.ts`);
}

async function generateTestWithLLM(featureName, ruleId, ruleTitle, relatedRules) {
  const prompt = buildPrompt(featureName, ruleId, ruleTitle, relatedRules);
  const rawResponse = await callGitHubModels(prompt);
  const generatedCode = parseResponse(rawResponse);

  ensureBasicTestContract(generatedCode, ruleId);
  validateTypeScript(generatedCode);

  return generatedCode;
}

async function main() {
  const startedAt = Date.now();
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  if (!args.feature) {
    printUsage();
    throw new Error('Missing required argument: --feature');
  }

  if (!GITHUB_TOKEN) {
    throw new Error('Missing required environment variable: GITHUB_TOKEN');
  }

  const knowledgeDir = path.join(__dirname, '..', 'knowledge');
  const { issues, bundle } = verifyKnowledgeSync(knowledgeDir);
  if (issues.length) {
    throw new Error(`Knowledge is not synchronized across md/yaml/gherkin:\n- ${issues.join('\n- ')}`);
  }

  const feature = bundle.find((item) => item.featureName === args.feature);
  if (!feature) {
    const validFeatures = bundle.map((item) => item.featureName).join(', ');
    throw new Error(`Unknown feature "${args.feature}". Valid features: ${validFeatures}`);
  }

  const allRules = getFeatureRules(feature);
  const selectedRules = args.rule
    ? allRules.filter((rule) => rule[0] === args.rule)
    : allRules;

  if (!selectedRules.length) {
    const validRules = allRules.map((rule) => rule[0]).join(', ');
    throw new Error(`Rule "${args.rule}" not found in feature "${args.feature}". Valid rules: ${validRules}`);
  }

  let generatedCount = 0;
  for (const [ruleId, ruleTitle] of selectedRules) {
    const relatedRules = allRules.filter((rule) => rule[0] !== ruleId).slice(0, 3);
    const generatedCode = await generateTestWithLLM(args.feature, ruleId, ruleTitle, relatedRules);
    const outputPath = resolveOutputPath(args.feature, ruleId, args.output, selectedRules.length);

    ensureOutputDir(outputPath);
    fs.writeFileSync(outputPath, `${generatedCode.trim()}\n`, 'utf8');
    generatedCount += 1;

    console.log(`Generated ${ruleId} -> ${outputPath}`);
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(`Done. Generated ${generatedCount}/${selectedRules.length} tests in ${elapsedMs}ms.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});