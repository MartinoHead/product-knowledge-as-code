# Sprint 1: Foundation - LLM Integration POC (Phase 1-2)

## Objective
Basic LLM integration working locally with one test generation

## Timeline
45 minutes

## What Gets Built

### 1. Create `scripts/generate-api-tests-llm.js`

**Core structure**:
```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const { getFeatureRules, verifyKnowledgeSync } = require('./knowledge-utils');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_MODEL = 'gpt-4o';
const OPENAI_BASE_URL = 'https://models.inference.ai.azure.com';

// Initialize
- Parse CLI args (--feature, --rule, --output)
- Load knowledge bundle via verifyKnowledgeSync()
- Validate GITHUB_TOKEN exists

// Main function: generateTestWithLLM(featureName, ruleId, ruleTitle, relatedRules)
- Build structured prompt
- Call GitHub Models API via HTTPS
- Parse response
- Validate TypeScript syntax
- Return test code as string

// Call graph:
main() 
  ├─ verifyKnowledgeSync()
  ├─ getFeatureRules()
  ├─ For each rule:
  │   ├─ generateTestWithLLM()
  │   │   ├─ buildPrompt()
  │   │   ├─ callGitHubModels()
  │   │   ├─ parseResponse()
  │   │   └─ validateTypeScript()
  │   └─ writeTestFile()
  └─ Report metrics
```

### 2. GitHub Models API Integration

**API Call Structure**:
```javascript
function callGitHubModels(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert QA engineer. Generate only valid Playwright API test code.',
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

    const req = https.request({
      hostname: 'models.inference.ai.azure.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content);
        } else {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
```

### 3. Prompt Design (Phase 2 - Tuned Later)

**Initial Prompt**:
```
System: You are an expert Playwright test engineer writing API tests for a SaaS application.
Generate only valid, executable TypeScript test code. No explanations.

User:
Generate a Playwright API test for this feature rule.

Feature: ${featureName}
Rule ID: ${ruleId}
Rule Title: ${ruleTitle}

Requirements:
1. Test should verify the rule requirement
2. Use Playwright's request object
3. Include proper assertions with expect()
4. Handle 503 service_unavailable errors gracefully
5. Use uniqueEmail() helper for generated test emails
6. Format: test('[RULE_ID] API ...', async ({ request }) => { ... })
7. Return ONLY the test function code, no markdown
```

### 4. Response Parsing

```javascript
function parseResponse(content) {
  const trimmed = String(content || '').trim();
  
  if (!trimmed) {
    throw new Error('Empty LLM response');
  }

  // Remove markdown fences if present
  if (trimmed.startsWith('```')) {
    const start = trimmed.indexOf('\n') + 1;
    const end = trimmed.lastIndexOf('```');
    return trimmed.substring(start, end).trim();
  }

  return trimmed;
}
```

### 5. TypeScript Validation

```javascript
const ts = require('typescript');

function validateTypeScript(code) {
  try {
    const result = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    return true;
  } catch (error) {
    throw new Error(`Invalid TypeScript: ${error.message}`);
  }
}
```

## Testing Procedure

### Test 1: Authentication
```bash
# Should fail with clear error
GITHUB_TOKEN=invalid node scripts/generate-api-tests-llm.js --feature registration --rule REG-001

# Expected output:
# Error: API error 401: Unauthorized
```

### Test 2: Generate Single Test
```bash
# Should succeed and output one test
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }} npm run generate:tests:llm -- \
  --feature registration \
  --rule REG-001 \
  --output tests/api/registration/registration.api.spec.ts

# Verify file was created
cat tests/api/registration/registration.api.spec.ts

# Should contain:
# test('[REG-001] Email must be valid format.', async ({ request }) => {
#   ...
# })
```

### Test 3: Validate TypeScript
```bash
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }} npm run generate:tests:llm -- \
  --feature registration \
  --rule REG-001 \
  --output tests/api/registration/registration.api.spec.ts

# Typecheck generated code
npx tsc tests/api/registration/registration.api.spec.ts --noEmit

# Should have no errors
```

## Validation Checklist

- [ ] generate-api-tests-llm.js created and executable
- [ ] GITHUB_TOKEN reading from env
- [ ] API call successful with valid token
- [ ] Response parsed correctly
- [ ] Generated test is valid TypeScript
- [ ] Test code contains rule ID
- [ ] Test code contains expect() assertions
- [ ] Test code starts with test(
- [ ] No markdown in output
- [ ] Script handles errors gracefully

## Code Requirements

**File Location**: `template-project/scripts/generate-api-tests-llm.js`

**Dependencies** (already in package.json):
- typescript (for validation)
- https (built-in)
- fs (built-in)
- path (built-in)

**No new dependencies needed**

**Environment Variables**:
- `GITHUB_TOKEN`: Required, exits with error if missing

**Exit Codes**:
- 0: Success
- 1: Generation failed, detailed error logged

## Commit Details

**Branch**: Feature branch (e.g., `feature/ai-test-generation`)

**Files Changed**:
- `template-project/scripts/generate-api-tests-llm.js` (new)

**Commit Message**:
```
product-knowledge-as-code: add LLM-based test generator (Sprint 1: Foundation)

- Implement GitHub Models API integration (gpt-4o)
- Authenticate with GITHUB_TOKEN
- Single rule test generation with prompt engineering
- Implement response parsing and TypeScript validation
- CLI args: --feature, --rule, --output

Usage:
  GITHUB_TOKEN=<token> node scripts/generate-api-tests-llm.js \
    --feature registration \
    --rule REG-001 \
    --output tests/api/registration/registration.api.spec.ts

Next: Sprint 2 - Prompt tuning and batch processing
```

## Rollback Procedure

If something breaks during Sprint 1:

```bash
# Delete the new file
git rm template-project/scripts/generate-api-tests-llm.js

# Revert to previous state
git reset --hard HEAD~1

# No other files affected
```

## Success Criteria

✅ Generate one test for REG-001 successfully  
✅ Generated test is valid TypeScript  
✅ Generated test contains proper assertions  
✅ Generated registration test matches the repo API test contract  
✅ GITHUB_TOKEN authentication works  
✅ Errors are clear and actionable  
✅ No external dependencies added  

## Notes for Next Sprint

- Prompt will need refinement in Sprint 2
- Response parsing may need edge case handling
- Will add retry logic in Sprint 2
- Will add batch processing in Sprint 3
