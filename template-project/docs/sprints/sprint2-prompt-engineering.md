# Sprint 2: Prompt Engineering & Retry Logic (Phase 3)

## Objective
Tuned prompts producing high-quality tests + retry strategy for resilience

## Timeline
1 hour

## Prerequisites
- Sprint 1 complete and working
- generate-api-tests-llm.js exists
- Single test generation verified

## Key Changes from Sprint 1

Add feature-specific API context, retry logic with exponential backoff, and comprehensive test structure validation (7 checks).

### Feature Context

```javascript
function getFeatureContext(featureName) {
  const contexts = {
    registration: `
The registration feature creates new user accounts.
- Endpoint: POST /v1/registration
- Request body: { email: string, password: string }
- Response on success (201): { userId: string, email: string, verificationEmailQueued: boolean }
- Response on error: { error: string, message: string }
- Validation: Email format, password length (min 10 chars), duplicate detection
- Error cases: 400 (invalid input), 409 (duplicate email), 503 (service unavailable)`,
    // ... other features
  };
  return contexts[featureName] || 'See knowledge files for context';
}
```

### Retry Strategy with Exponential Backoff

```javascript
async function generateTestWithRetry(featureName, ruleId, ruleTitle, relatedRules, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const featureContext = getFeatureContext(featureName);
      const prompt = buildPrompt(featureName, ruleId, ruleTitle, relatedRules, featureContext);
      
      const response = await callGitHubModels(prompt);
      const code = parseResponse(response);
      
      validateTypeScript(code);
      validateTestStructure(code, ruleId);
      
      return { success: true, code, attempts: attempt };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s

      console.log(`  ✗ ${ruleId} attempt ${attempt} failed: ${error.message}`);

      if (isLastAttempt) {
        return { success: false, error: error.message, attempts: attempt };
      }

      console.log(`  Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
}
```

### Test Structure Validation (7 Checks)

```javascript
function validateTestStructure(code, expectedRuleId) {
  const checks = [
    { name: 'Valid TypeScript', validate: () => validateTypeScript(code) },
    { name: 'Starts with test(', validate: () => code.trim().startsWith('test(') },
    { name: 'Contains rule ID', validate: () => code.includes(expectedRuleId) },
    { name: 'Contains expect()', validate: () => code.includes('expect(') },
    { name: 'No markdown markers', validate: () => !code.includes('```') && !code.includes('javascript') },
    { name: 'Has async function', validate: () => code.includes('async') },
    { name: 'Uses request object', validate: () => code.includes('request.') },
  ];

  const failures = [];
  for (const check of checks) {
    try {
      check.validate();
    } catch (error) {
      failures.push(`${check.name}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Test structure validation failed:\n  ${failures.join('\n  ')}`);
  }
}
```

## Testing Procedure

### Test 1: Single Rule with Retries
```bash
GITHUB_TOKEN=<token> npm run generate:tests:llm --feature registration --rule REG-001

# Should retry on transient failures
# Should succeed on final attempt
```

### Test 2: All Registration Rules
```bash
GITHUB_TOKEN=<token> npm run generate:tests:llm --feature registration

# Should generate REG-001 through REG-005
```

### Test 3: Validate Generated Tests
```bash
npx tsc template-project/tests/api/registration/registration.api.spec.ts --noEmit
# No errors expected
```

## Validation Checklist

- [ ] Retry logic implemented with exponential backoff
- [ ] Feature context added for each feature type
- [ ] Prompt engineering improved with detailed requirements
- [ ] Test structure validation added (7 checks)
- [ ] Main loop refactored for batch processing
- [ ] Metrics tracking implemented
- [ ] Registration tests (5 rules) generate successfully
- [ ] All generated tests pass TypeScript check
- [ ] Retry logs are clear and helpful
- [ ] Error messages guide user to next steps

## Success Criteria

✅ All 5 registration tests generate successfully  
✅ All generated tests are valid TypeScript  
✅ All generated tests contain proper assertions  
✅ Retry logic works  
✅ Metrics logged clearly  
✅ No external dependencies added  
✅ Prompt context improves test relevance  

## Next: Sprint 3

Sprint 3 will loop through all 27 rules across all 6 features and add progress indicators.
