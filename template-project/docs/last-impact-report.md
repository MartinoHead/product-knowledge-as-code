# Simulated PR Impact Report

Generated: 2026-05-31T06:32:14.072Z
Input: mock-pr-diff.txt

## Changed Files (Simulated)
- M src/auth/registration-service.ts
- M src/auth/login-service.ts
- M src/payments/checkout-orchestrator.ts

## Impacted Knowledge Areas
- checkout
  - update knowledge\checkout\checkout.md
  - regenerate tests for checkout
  - keyword "checkout" matched: M src/payments/checkout-orchestrator.ts
- login
  - update knowledge\login\login.md
  - regenerate tests for login
  - keyword "auth" matched: M src/auth/registration-service.ts
  - keyword "login" matched: M src/auth/login-service.ts
- registration
  - update knowledge\registration\registration.md
  - regenerate tests for registration
  - keyword "registration" matched: M src/auth/registration-service.ts

## Suggested Agent Actions
1. Update impacted markdown knowledge files first.
2. Regenerate tests from knowledge.
3. Run execution workflow and review results.
4. Feed failures back into knowledge rules.
