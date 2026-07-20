# Sprint 3: Full Suite & Production Readiness (Phase 4)

## Objective
All 27 tests generate + pass, ready for CI integration

## Timeline
45 minutes

## Prerequisites
- Sprint 1-2 complete
- Prompts tuned for high success rate
- Retry logic working

## Key Changes from Sprint 2

Loop through all 27 rules across all 6 features with progress indicators and comprehensive metrics.

### Full Loop Implementation

Generate all 6 features (checkout, create-user, get-user, list-users, login, registration) with all their rules.

### Feature Spec Generation

```javascript
function generateFeatureSpec(tests, featureName) {
  const header = `/**
 * Auto-generated API tests from synchronized knowledge (md/yaml/gherkin).
 * 
 * Feature: ${featureName}
 * Generator: generate-api-tests-llm.js (GitHub Models gpt-4o)
 * Generated: ${new Date().toISOString()}
 * 
 * DO NOT EDIT manually. Run 'npm run generate:tests' to regenerate.
 * 
 * Generator emits executable deterministic baseline scenarios.
 */

import { uniqueEmail, withLiveAuth } from '../../helpers/api-helpers.js';
`;

  const testCode = tests.join('\n\n');
  return header + '\n' + testCode + '\n';
}
```

### Progress Indicator

```javascript
class ProgressBar {
  constructor(total) {
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
  }

  tick() {
    this.current++;
    const percent = (this.current / this.total * 100).toFixed(0);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.current / elapsed;
    const remaining = ((this.total - this.current) / rate).toFixed(0);

    process.stdout.write(`\r  [${this.current}/${this.total}] ${percent}% (${remaining}s remaining)`);
  }

  done() {
    process.stdout.write('\n');
  }
}
```

### Test File Organization

**Expected directory structure after Sprint 3**:
```
template-project/tests/api/
├── checkout/
│   └── checkout.api.spec.ts       (4 tests: CHK-001..004)
├── create-user/
│   └── create-user.api.spec.ts     (3 tests: USR-001..003)
├── get-user/
│   └── get-user.api.spec.ts        (3 tests: USG-001..003)
├── list-users/
│   └── list-users.api.spec.ts      (6 tests: LISTUSR-001..006)
├── login/
│   └── login.api.spec.ts           (5 tests: LGN-001..005)
└── registration/
    └── registration.api.spec.ts    (6 tests: REG-001..006)

Total: 6 features × 1 file each = 6 test files
Total: 27 tests
```

## Testing Procedure

### Test 1: Generate All 27 Tests
```bash
GITHUB_TOKEN=<token> npm run generate:tests:llm

# Expected:
# 📝 checkout... (4 tests)
# 📝 create-user... (3 tests)
# ... all 6 features
# Total: 27 tests generated
```

### Test 2: Validate TypeScript
```bash
npx tsc template-project/tests/api/**/*.api.spec.ts --noEmit
# Should have no errors
```

### Test 3: Test Discovery
```bash
cd template-project
npx playwright test --config=playwright.api.config.ts --list
# Expected: Total: 27 tests in 6 files
```

### Test 4: Execute All Tests
```bash
cd template-project
npm run test:api
# Expected: 27 passed
```

## Validation Checklist

- [ ] All 27 tests generate successfully
- [ ] 0 failures (100% success rate)
- [ ] All generated files are valid TypeScript
- [ ] Test discovery finds all 27 tests
- [ ] All 27 tests pass locally
- [ ] File structure matches expected layout (6 features, 1 file each)
- [ ] Progress indicators work and show accurate timing
- [ ] Metrics report complete and accurate
- [ ] No external dependencies added
- [ ] Files have proper headers with timestamp

## Success Criteria

✅ All 27 tests generate (100% success rate)  
✅ 0 failures reported  
✅ All files valid TypeScript  
✅ Test discovery: 27 tests in 6 files  
✅ All 27 tests pass locally  
✅ Metrics logged accurately  
✅ Progress feedback clear  
✅ Ready for CI integration  

## Next: Sprint 4

Sprint 4 will implement explicit error handling with detailed logging and no automatic fallback.
