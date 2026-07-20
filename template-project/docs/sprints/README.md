# Sprint Specifications for LLM-Based Test Generation

Complete implementation guide for replacing hardcoded test generation with GitHub Models LLM approach.

**Total Development Time**: ~6 hours  
**Total Commits**: 7  
**Risk Level**: Low (incremental validation at each step)

## Sprint Overview

### [Sprint 1: Foundation](sprint1-foundation.md) (45 minutes)
**Goal**: Basic LLM integration POC with single test generation

- Implement GitHub Models API integration (gpt-4o)
- Single rule test generation (REG-001)
- Authentication with GITHUB_TOKEN
- Response parsing and TypeScript validation
- Repeatable command: `npm run generate:tests:llm -- --feature registration --rule REG-001 --output tests/api/registration/registration.api.spec.ts`

**Success**: Generate one valid test

---

### [Sprint 2: Prompt Engineering](sprint2-prompt-engineering.md) (1 hour)
**Goal**: Tuned prompts producing high-quality tests + retry strategy

- Enhanced prompts with feature-specific context
- Retry logic with exponential backoff (3 attempts)
- Test structure validation (7 checks)
- Batch processing per feature

**Success**: All 5 registration tests generate successfully

---

### [Sprint 3: Full Suite](sprint3-full-suite.md) (45 minutes)
**Goal**: All 27 tests generate + pass, ready for CI integration

- Loop through all 6 features
- Progress bar and metrics
- File organization (tests/api/{feature}/)
- Post-generation validation

**Success**: All 27 tests generate with 100% success rate

---

### [Sprint 4: Error Handling](sprint4-error-handling.md) (30 minutes)
**Goal**: Graceful failures with detailed logging (NO automatic fallback)

- FailureLogger class for tracking and reporting
- Error categorization (7 categories: RATE_LIMIT, AUTH_FAILED, NETWORK_ERROR, TIMEOUT, INVALID_OUTPUT, API_ERROR, QUOTA_EXCEEDED)
- docs/generation-failures.log for failure tracking
- User troubleshooting guide

**Success**: Failures logged clearly, no automatic fallback

---

### [Sprint 5-7: Automation, CI & Docs](sprint5-7-automation-ci-docs.md) (2.25 hours)

#### Sprint 5: npm Scripts (30 minutes)
- `npm run generate:tests` (LLM, default)
- `npm run generate:tests:hardcoded` (fallback)
- `npm run generate:tests:compare` (side-by-side)

#### Sprint 6: CI Integration (1 hour)
- Update .github/workflows/quality.yml
- Syntax validation step
- Test execution gates
- Drift detection

#### Sprint 7: Monitoring & Docs (45 minutes)
- Metrics logging with detailed breakdown
- docs/llm-test-generation.md (comprehensive guide)
- docs/README.md updates
- FAQ and best practices

---

## Key Features

✅ **Explicit Fallback**: No automatic switching. User consciously decides.  
✅ **Error Categorization**: Distinguishes retryable vs non-retryable failures.  
✅ **Detailed Logging**: JSON failure logs for debugging and auditing.  
✅ **Multiple Workflows**: LLM (primary), hardcoded (fallback), comparison (tuning).  
✅ **CI Integration**: GitHub Actions validates generation, syntax, and test execution.  
✅ **Comprehensive Docs**: Guides, troubleshooting, FAQ, best practices.  
✅ **Observable Metrics**: Token usage, execution time, success rates by feature.  

---

## Implementation Order

**Do NOT skip steps** — each sprint builds on the previous one:

1. ✅ Sprint 1 - Get one test working
2. ✅ Sprint 2 - Tune prompts, test registration
3. ✅ Sprint 3 - Full suite, all 27 tests
4. ✅ Sprint 4 - Error handling + troubleshooting
5. ✅ Sprint 5 - npm scripts
6. ✅ Sprint 6 - CI integration
7. ✅ Sprint 7 - Docs + monitoring

---

## Quick Reference: Validation Gates

### After Sprint 1
```bash
GITHUB_TOKEN=<token> npm run generate:tests:llm -- \
  --feature registration \
  --rule REG-001 \
  --output tests/api/registration/registration.api.spec.ts
# Should output: one valid REG-001 test in template-project/tests/api/registration/
```

### After Sprint 2-3
```bash
GITHUB_TOKEN=<token> npm run generate:tests:llm
npm run test:api
# Should: 27 tests pass
```

### After Sprint 4
```bash
GITHUB_TOKEN=invalid npm run generate:tests:llm
cat docs/generation-failures.log
# Should: clear error log with guidance
```

### After Sprint 5
```bash
npm run generate:tests
npm run generate:tests:hardcoded
npm run generate:tests:compare
# Should: all three commands work
```

### After Sprint 6
```bash
npm run lint && npm run typecheck && npm run verify:sync && npm run generate:tests
# Should: all checks pass
```

### After Sprint 7
```bash
npm run generate:tests 2>&1 | grep -A 15 "📊 Generation Metrics"
cat docs/llm-test-generation.md
# Should: detailed metrics and comprehensive docs
```

---

## Success Criteria (Overall)

✅ `npm run generate:tests` generates all 27 tests using LLM  
✅ All tests pass TypeScript validation  
✅ All tests pass execution (`npm run test:api`)  
✅ CI integrates and validates  
✅ Documentation comprehensive  
✅ Fallback available and explicit  
✅ No automatic switching  
✅ Metrics visible and tracked  

---

## Timeline

**Week 1 (Wednesday-Thursday)**:
- Sprints 1-4 (4.25 hours development + testing)

**Week 2 (Monday-Tuesday)**:
- Sprints 5-7 (2.25 hours development + testing)

**Total**: ~12 hours (6 hours development, 6 hours testing/validation)

---

## Key Design Principles

1. **Incremental**: Each sprint validates foundation before moving to next
2. **Explicit**: No hidden automatic behaviors or silent switching
3. **Observable**: Metrics, logging, and clear user guidance
4. **Fallback**: Manual hardcoded option always available
5. **Controlled**: User in control of all important decisions
6. **Documented**: Comprehensive guides and troubleshooting

---

## Common Questions

**Q: Can I skip sprints?**  
A: No. Each one adds critical capabilities. Follow order.

**Q: What if prompts aren't good in Sprint 2?**  
A: Iterate locally. Tune prompts, test, regenerate. Don't move to Sprint 3 until satisfied.

**Q: Why no automatic fallback?**  
A: Manual control ensures awareness and conscious decisions about test implementation.

**Q: Can I compare LLM vs hardcoded?**  
A: Yes, `npm run generate:tests:compare` generates both and shows differences.

---

## Getting Started

1. Read this README
2. Open [Sprint 1: Foundation](sprint1-foundation.md)
3. Follow the 45-minute walkthrough
4. Move to Sprint 2 when complete
5. Continue through all 7 sprints

Good luck! 🚀
