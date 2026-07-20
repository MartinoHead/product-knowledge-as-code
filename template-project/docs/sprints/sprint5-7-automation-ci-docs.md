# Sprints 5-7: Automation, CI Integration & Documentation

## SPRINT 5: npm Scripts & Comparison Tool (Phase 5)

### Objective
Add three npm scripts for LLM, hardcoded, and comparison workflows

### Timeline
30 minutes

### What Gets Built

#### Update `template-project/package.json`

```json
{
  "scripts": {
    "generate:tests": "npm run verify:sync && node scripts/generate-api-tests-llm.js && node scripts/generate-tests.js && node scripts/generate-md-tests.js",
    "generate:tests:llm": "npm run verify:sync && node scripts/generate-api-tests-llm.js",
    "generate:tests:hardcoded": "npm run verify:sync && node scripts/generate-api-tests.js && node scripts/generate-tests.js && node scripts/generate-md-tests.js",
    "generate:tests:compare": "node scripts/generate-tests-compare.js"
  }
}
```

#### Create `scripts/generate-tests-compare.js`

Generates both LLM and hardcoded versions, then compares them to show differences.

### Testing Procedure

```bash
# Test 1: LLM generation (default)
npm run generate:tests

# Test 2: Explicit LLM
npm run generate:tests:llm

# Test 3: Hardcoded fallback
npm run generate:tests:hardcoded

# Test 4: Compare both
npm run generate:tests:compare
```

### Success Criteria

✅ `npm run generate:tests` uses LLM  
✅ `npm run generate:tests:llm` works standalone  
✅ `npm run generate:tests:hardcoded` uses old generator  
✅ `npm run generate:tests:compare` compares both  
✅ All scripts exit with proper codes  
✅ Output messages are clear  

---

## SPRINT 6: CI Integration (Phase 6)

### Objective
Update GitHub Actions to use LLM generation

### Timeline
1 hour

### What Gets Built

#### Update `.github/workflows/quality.yml`

Add step to generate tests using LLM:

```yaml
- name: Generate tests from knowledge (LLM)
  working-directory: template-project
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npm run generate:tests:llm
```

Add validation steps:

```yaml
- name: Validate generated tests (syntax)
  working-directory: template-project
  run: npx tsc tests/api/**/*.api.spec.ts --noEmit

- name: Fail on generated test drift
  working-directory: template-project
  run: git diff --exit-code tests/

- name: Execute API tests
  working-directory: template-project
  run: npm run test:api
```

#### Optional: Add Manual Hardcoded Workflow

`.github/workflows/generate-hardcoded.yml` for manual fallback generation via workflow dispatch.

### Testing Procedure

```bash
# Simulate CI locally
cd template-project
npm run lint
npm run typecheck
npm run verify:sync
npm run generate:tests:llm
npx tsc tests/api/**/*.api.spec.ts --noEmit
npm run test:api
```

### Success Criteria

✅ quality.yml updated to use LLM  
✅ GITHUB_TOKEN passed to job  
✅ Syntax validation step works  
✅ Drift check catches changes  
✅ Test execution step works  
✅ CI passes with all steps  

---

## SPRINT 7: Monitoring, Docs & Finalization (Phase 7)

### Objective
Add observability and comprehensive documentation

### Timeline
45 minutes

### What Gets Built

#### 1. Enhanced Metrics Logging

Add detailed metrics output:

```
============================================================
📊 LLM Generation Metrics
============================================================

Execution:
  Started: 7/13/2026, 12:30:45 PM
  Duration: 45.3s
  Speed: 0.60 rules/s

Results:
  Total Rules: 27
  Generated: 27 ✓
  Failed: 0 ✗
  Success Rate: 100.0%

By Feature:
  checkout        [██████████] 4/4 (100%)
  create-user     [██████████] 3/3 (100%)
  ...

API Usage:
  Total Tokens: ~25,500
  Avg per Rule: ~950
  Estimated Cost: ~$0 (GitHub Models free tier)
```

#### 2. Create `template-project/docs/llm-test-generation.md`

Comprehensive guide covering:
- Overview and flow
- How it works
- Commands (generate, fallback, compare)
- Metrics tracking
- Troubleshooting references
- Configuration options
- Performance characteristics
- Architecture
- CI integration
- Best practices
- FAQ

#### 3. Update `template-project/docs/README.md`

Add section for Test Generation with quick reference.

### Files Created/Updated

- `docs/llm-test-generation.md` (new, comprehensive guide)
- `docs/llm-generation-troubleshooting.md` (created in Sprint 4)
- `docs/README.md` (update with test generation reference)

### Testing Procedure

```bash
# Verify documentation
cat template-project/docs/llm-test-generation.md
cat template-project/docs/README.md | grep -A 5 "Test Generation"

# Run metrics collection
npm run generate:tests:llm 2>&1 | grep -A 20 "Generation Metrics"
```

### Success Criteria

✅ Metrics logged clearly  
✅ Documentation comprehensive  
✅ Users guided on all workflows  
✅ Performance visible  
✅ FAQ helpful and accurate  
✅ All commands documented  
✅ Best practices listed  

---

## Summary: Sprints 5-7

| Sprint | Focus | Time | Files |
|--------|-------|------|-------|
| 5 | Scripts & Comparison | 30m | package.json, generate-tests-compare.js |
| 6 | CI Integration | 1h | quality.yml, generate-hardcoded.yml (optional) |
| 7 | Docs & Metrics | 45m | llm-test-generation.md, troubleshooting.md, README updates |

**Total**: 2.25 hours

**Outcome**: 
- 3 npm commands available
- CI fully integrated with LLM
- Comprehensive documentation
- Observable metrics
- Ready for production use
