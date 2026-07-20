# Sprint 4: Error Handling & Explicit Fallback (Phase 8)

## Objective
Graceful failures with detailed logging and explicit user control (no automatic fallback)

## Timeline
30 minutes

## Prerequisites
- Sprint 1-3 complete and working
- All 27 tests generating successfully
- Code ready for CI but needs error handling

## Key Changes from Sprint 3

Add `FailureLogger` class for tracking and reporting, error categorization (7 categories), and explicit user guidance.

### Failure Logger

```javascript
class FailureLogger {
  constructor(logPath = 'docs/generation-failures.log') {
    this.logPath = logPath;
    this.failures = [];
    
    const docsDir = path.dirname(logPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    if (fs.existsSync(logPath)) {
      const stat = fs.statSync(logPath);
      if (Date.now() - stat.mtime.getTime() < 60000) {
        fs.unlinkSync(logPath);
      }
    }
  }

  log(failure) {
    const entry = {
      timestamp: new Date().toISOString(),
      feature: failure.feature,
      ruleId: failure.ruleId,
      error: failure.error,
      reason: failure.reason,
      attempts: failure.attempts || 1,
      suggestion: `npm run generate:tests:hardcoded`,
    };

    this.failures.push(entry);
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n', 'utf8');
  }

  print() {
    if (this.failures.length === 0) return;

    console.error(`\n\n${'='.repeat(60)}`);
    console.error(`❌ Generation Failures Logged`);
    console.error(`${'='.repeat(60)}`);
    console.error(`\nTotal Failures: ${this.failures.length}`);
    console.error(`\n⚠️  NO AUTOMATIC FALLBACK`);
    console.error(`\nTo use hardcoded test generation:`);
    console.error(`  npm run generate:tests:hardcoded`);
    console.error(`${'='.repeat(60)}\n`);
  }
}
```

### Error Categorization

```javascript
function categorizeError(error) {
  const message = error.message || String(error);

  if (message.includes('429') || message.includes('rate limit')) {
    return { category: 'RATE_LIMIT', isRetryable: true };
  }
  if (message.includes('401') || message.includes('Unauthorized')) {
    return { category: 'AUTH_FAILED', isRetryable: false };
  }
  if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
    return { category: 'NETWORK_ERROR', isRetryable: true };
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return { category: 'TIMEOUT', isRetryable: true };
  }
  if (message.includes('Invalid TypeScript') || message.includes('validation failed')) {
    return { category: 'INVALID_OUTPUT', isRetryable: true };
  }
  if (message.includes('503') || message.includes('502') || message.includes('500')) {
    return { category: 'API_ERROR', isRetryable: true };
  }
  if (message.includes('token') || message.includes('quota')) {
    return { category: 'QUOTA_EXCEEDED', isRetryable: false };
  }

  return { category: 'UNKNOWN', isRetryable: false };
}
```

## Retry Strategy with Error Categorization

Modified `generateTestWithRetry()` to categorize errors and distinguish between retryable and non-retryable failures.

- **Retryable**: RATE_LIMIT, NETWORK_ERROR, TIMEOUT, INVALID_OUTPUT, API_ERROR
- **Non-Retryable**: AUTH_FAILED, QUOTA_EXCEEDED

## Testing Procedure

### Test 1: Simulate Auth Failure
```bash
# Should fail with clear auth error
GITHUB_TOKEN=invalid npm run generate:tests:llm

# Expected: All rules fail with AUTH_FAILED
# Write to: docs/generation-failures.log
```

### Test 2: Fallback Workflow
```bash
# Generate with hardcoded (simulating fallback decision)
npm run generate:tests:hardcoded

# Verify tests generated
npm run test:api
# Should pass

# Then commit consciously
git add tests/
git commit -m "product-knowledge-as-code: use hardcoded fallback after LLM failures"
```

## Validation Checklist

- [ ] FailureLogger class implemented
- [ ] Error categorization working (7+ categories)
- [ ] Retry logic respects retryable vs non-retryable errors
- [ ] Failure log written to docs/generation-failures.log
- [ ] Failure summary printed to console
- [ ] User guidance clear and actionable
- [ ] No automatic fallback (user must consciously run hardcoded)
- [ ] Exit code 1 on failures (blocks CI)
- [ ] Partial failures handled (writes successful tests, reports failures)
- [ ] Troubleshooting guide created

## Files Created

**New File**: `template-project/docs/llm-generation-troubleshooting.md`

Contains common failure modes, solutions, debugging commands, and step-by-step fallback procedures.

## Success Criteria

✅ Failures logged to docs/generation-failures.log  
✅ Failure summary printed to console  
✅ User guidance clear and actionable  
✅ No automatic fallback  
✅ Exit code 1 blocks CI  
✅ Errors categorized correctly  
✅ Retryable errors retry, non-retryable fail immediately  
✅ Troubleshooting guide helpful  
✅ Partial failures handled (successful tests written)  

## Next: Sprint 5

Sprint 5 will add npm scripts for three workflows: LLM (default), hardcoded (fallback), and comparison.
