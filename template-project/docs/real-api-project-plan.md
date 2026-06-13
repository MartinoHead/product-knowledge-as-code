# Real API Project Plan for template-project

## Purpose
Build a production-like API service inside template-project that implements the behavior defined in knowledge files, replaces simulated execution with real execution, and keeps Product Knowledge as Code traceability.

## Scope
- In scope: backend runtime, database, auth, validation, real API tests, CI gates, observability basics, documentation.
- Out of scope (initial phase): full production SRE platform, multi-region deployment, complex event-driven architecture.

## Success Criteria
- Every feature under knowledge has a working API implementation.
- API tests execute against a real running service and pass consistently.
- Knowledge sync and test gates run in CI and block regressions.
- Traceability from rule ID to test case to endpoint behavior is maintained.

## Assumptions and Decisions Needed
1. Runtime stack: Node.js + TypeScript + Express (recommended).
2. Database: PostgreSQL with Prisma ORM (recommended).
3. Auth style: JWT access token + optional refresh token.
4. Deployment target: container-based environment.
5. Test environment: local dockerized PostgreSQL for CI and dev.

## Work Breakdown Structure

### Phase 0: Architecture and Project Setup

#### Task 0.1: Define architecture and conventions (Completed 2026-06-12)
- Objective: lock key technical decisions to avoid rework.
- Detailed work:
  - Choose framework, ORM, database, validation library, auth library.
  - Define folder structure for controllers/services/repositories/middleware.
  - Define API versioning and error response envelope.
- Deliverables:
  - Architecture Decision Record in docs: docs/adr/0001-api-architecture.md.
  - Coding conventions section in docs: docs/backend-conventions.md.
- Acceptance criteria:
  - Decisions are documented and approved.
  - Team can scaffold code without ambiguity.

#### Task 0.2: Initialize app structure (Completed 2026-06-12)
- Objective: create a maintainable backend skeleton.
- Detailed work:
  - Add src entrypoint, app initialization, route registration, config loading.
  - Add strict TypeScript and linting/prettier config.
  - Add environment config with schema validation.
  - Add baseline API documentation surface for discovery and integration.
- Deliverables:
  - src/app.ts, src/server.ts, src/routes/index.ts, src/config/*.
  - package scripts for dev/start/build/lint/typecheck.
  - OpenAPI JSON endpoint and Swagger UI route.
- Acceptance criteria:
  - Service boots locally and exposes health endpoint.
  - Lint and typecheck run clean.
  - Swagger documentation is available for the bootstrapped API surface.

### Phase 1: Data Layer and Core Security

#### Task 1.1: Create database schema and migrations (Completed 2026-06-12)
- Objective: establish reliable persistence for all required features.
- Detailed work:
  - Model users, sessions/tokens (if used), and checkout/order entities.
  - Add migration strategy and seed script for test data.
  - Add transaction boundaries where needed.
- Deliverables:
  - prisma schema (or equivalent), migrations, seed script.
- Acceptance criteria:
  - Database can be recreated from scratch.
  - Seed data supports API tests.

#### Task 1.2: Implement auth foundation (Completed 2026-06-12)
- Objective: secure protected endpoints and user identity flows.
- Detailed work:
  - Password hashing (argon2 or bcrypt).
  - JWT issuance/verification middleware.
  - Authorization middleware for protected routes.
- Deliverables:
  - auth service, auth middleware, token utility.
- Acceptance criteria:
  - Login returns valid token for correct credentials.
  - Protected routes reject invalid or missing tokens.

#### Task 1.3: Add security middleware (Completed 2026-06-12)
- Objective: harden API baseline.
- Detailed work:
  - Add request validation and sanitization.
  - Add rate limiting and CORS configuration.
  - Add secure headers and request ID correlation.
- Deliverables:
  - middleware stack and centralized error handler.
- Acceptance criteria:
  - Validation errors return consistent envelope.
  - Basic abuse protection is active.

### Phase 2: Feature Implementation from Knowledge

#### Task 2.1: Registration endpoint (Completed 2026-06-12)
- Objective: implement rules under knowledge/registration.
- Detailed work:
  - Parse rules and map to validation and behavior.
  - Implement duplicate email checks and password policy enforcement.
  - Return deterministic status/error codes.
- Deliverables:
  - POST /v1/registration endpoint with service and repository logic.
- Acceptance criteria:
  - All registration rule IDs have executable assertions.
  - Error handling matches documented behavior.

#### Task 2.2: Login endpoint (Completed 2026-06-12)
- Objective: implement rules under knowledge/login.
- Detailed work:
  - Verify credentials, account state, and token generation.
  - Add lockout or throttling policy if rules require.
- Deliverables:
  - POST /v1/login endpoint.
- Acceptance criteria:
  - Positive and negative login paths covered by API tests.

#### Task 2.3: Create-user endpoint (Completed 2026-06-12)
- Objective: implement rules under knowledge/create-user.
- Detailed work:
  - Validate payload, normalize data, persist user record.
  - Prevent duplicates and enforce constraints.
- Deliverables:
  - POST /v1/users endpoint.
- Acceptance criteria:
  - Endpoint is idempotent or duplicate-safe according to rules.

#### Task 2.4: Get-user endpoint (Completed 2026-06-12)
- Objective: implement rules under knowledge/get-user.
- Detailed work:
  - Add fetch by ID and not-found behavior.
  - Enforce authorization where required.
- Deliverables:
  - GET /v1/users/:id endpoint.
- Acceptance criteria:
  - Rule-driven response payload and status codes verified.

#### Task 2.5: Checkout endpoint (Completed 2026-06-12)
- Objective: implement rules under knowledge/checkout.
- Detailed work:
  - Validate checkout payload and inventory/payment preconditions.
  - Add order persistence and status transitions.
- Deliverables:
  - POST /v1/checkout endpoint.
- Acceptance criteria:
  - Critical checkout failure modes are covered by tests.

### Phase 3: Testing and Traceability

#### Task 3.1: Convert scaffold API tests to executable tests (Completed 2026-06-12)
- Objective: replace TODO tests with real request assertions.
- Detailed work:
  - Use Playwright API request fixture or supertest against running app.
  - Wire test baseURL and auth helpers.
  - Replace generated placeholders with concrete assertions.
- Deliverables:
  - Implemented tests in tests/api/*.api.spec.ts.
- Acceptance criteria:
  - No API scaffold TODOs remain.
  - Tests are deterministic and pass repeatedly.

#### Task 3.2: Add rule-to-test traceability checks
- Objective: ensure each knowledge rule has test coverage.
- Detailed work:
  - Keep rule IDs in test titles.
  - Extend rule-coverage script to fail on uncovered IDs.
- Deliverables:
  - coverage report and CI gate.
- Acceptance criteria:
  - CI fails if any rule IDs are uncovered.

#### Task 3.3: Add integration and regression suites
- Objective: prevent feature interaction regressions.
- Detailed work:
  - Add end-to-end API flows (register -> login -> create/get user -> checkout).
  - Add negative and boundary tests.
- Deliverables:
  - integration spec files and stable fixtures.
- Acceptance criteria:
  - Full flow tests pass in CI.

### Phase 4: CI/CD and Quality Gates

#### Task 4.1: Build CI pipeline for real API
- Objective: enforce quality on every change.
- Detailed work:
  - Run install, lint, typecheck, unit/integration/API tests.
  - Provision test DB in CI.
  - Publish test and coverage artifacts.
- Deliverables:
  - CI workflow file and docs.
- Acceptance criteria:
  - PRs are blocked when required checks fail.

#### Task 4.2: Keep PKaC governance gates
- Objective: preserve knowledge synchronization discipline.
- Detailed work:
  - Keep verify-sync gate.
  - Keep impact-analysis path and selective generation.
  - Add failing gate for unsynced md/yaml/gherkin files.
- Deliverables:
  - CI steps for PKaC verification.
- Acceptance criteria:
  - Knowledge drift is detected automatically.

### Phase 5: Observability and Operations

#### Task 5.1: Logging and metrics
- Objective: make runtime behavior diagnosable.
- Detailed work:
  - Add structured logging with correlation IDs.
  - Add metrics endpoint for request latency/error counts.
- Deliverables:
  - logger module, metrics middleware, dashboards starter docs.
- Acceptance criteria:
  - Errors include trace context.
  - Basic service KPIs are measurable.

#### Task 5.2: Deployability
- Objective: ensure service can be run consistently across environments.
- Detailed work:
  - Add Dockerfile and docker-compose for API + DB.
  - Add startup/readiness checks and migration startup process.
- Deliverables:
  - container artifacts and runbook.
- Acceptance criteria:
  - One command can boot local stack.

## Cross-Cutting Standards
- API response format should be consistent across all endpoints.
- Error codes and messages should be deterministic and documented.
- Every change to behavior should update knowledge files and tests.
- Security-critical logic should have direct tests for failure paths.
- No merging if knowledge sync or rule coverage gates fail.

## Dependency Map
1. Phase 0 must complete before all other phases.
2. Phase 1 should complete before implementing most Phase 2 endpoints.
3. Phase 2 and Phase 3 can run in parallel after auth and DB foundations are stable.
4. Phase 4 depends on runnable tests.
5. Phase 5 can start once basic API paths are functional.

## Suggested Milestones
1. Milestone A (Week 1): Phase 0 + baseline of Phase 1 complete.
2. Milestone B (Week 2): Registration, login, create-user, get-user implemented with tests.
3. Milestone C (Week 3): Checkout + full integration flow + traceability gate.
4. Milestone D (Week 4): CI hardening, observability, containerized deployment.

## Risk Register and Mitigation
- Risk: generated tests drift from real behavior.
  - Mitigation: enforce rule-coverage and executable assertions, no TODO placeholders.
- Risk: flaky integration tests in CI.
  - Mitigation: deterministic seed data, isolated test DB, retry strategy only for known transient failures.
- Risk: knowledge files updated without implementation updates.
  - Mitigation: CI gate requiring coverage and impacted feature test execution.
- Risk: auth/security defects.
  - Mitigation: explicit negative-path tests, security review checklist.

## Definition of Done for Real API Readiness
- Runtime API exists and all planned endpoints are implemented.
- Knowledge-aligned API tests run against real service and pass in CI.
- No scaffold TODO tests remain in API suite.
- Sync, coverage, and quality gates are active and required.
- Basic observability and deployment artifacts are in place.

## Current Gaps (As of 2026-06-12)
- PKaC sync drift exists in registration rules:
  - `knowledge/registration/registration.md` has REG-003 min password 10.
  - `knowledge/registration/registration.yaml` and `knowledge/registration/registration.feature` still say 8.
  - Runtime behavior currently enforces 8.
- PKaC gates are implemented as scripts but not yet enforced in CI:
  - `scripts/verify-sync.js`
  - `scripts/rule-coverage.js`
- Data layer migration is in progress:
  - auth and managed-user flows now route through service/repository abstractions.
  - checkout flow now routes through service/repository abstractions.
  - repositories prefer Prisma when `DATABASE_URL` is configured and fall back deterministically otherwise.
  - runtime env loading is now in place for `.env`-driven Prisma activation.
  - full always-on Prisma execution still depends on external PostgreSQL availability and migration rollout in a real local environment.
- Security middleware baseline is now in place:
  - Centralized async error handling with deterministic 4xx/5xx envelopes.
  - Request-body object validation for POST endpoints.
  - Rate limiting, CORS policy, secure headers, and request ID correlation.
- Deployability and observability are partial:
  - `docker-compose.yml` for PostgreSQL exists.
  - API Dockerfile, runbook, metrics/logging baseline still pending.

## Immediate Next Tasks (Execution Order)
1. Create backend skeleton and health endpoint. (Completed 2026-06-12)
2. Implement registration endpoint with deterministic validation behavior. (Completed 2026-06-12)
3. Replace registration API test TODOs with executable assertions. (Completed 2026-06-12)
4. Replace login API test TODOs with executable assertions. (Completed 2026-06-12)
5. Define architecture and conventions artifacts. (Completed 2026-06-12)
6. Set up database schema/migrations and seed data. (Completed 2026-06-12)
7. Resolve REG-003 knowledge drift and re-sync md/yaml/gherkin + runtime behavior. (Completed 2026-06-12)
8. Implement auth foundation (JWT + password hashing + protected route middleware). (Completed 2026-06-12)
9. Replace in-memory route flows with Prisma-backed services/repositories. (In progress 2026-06-12)
10. Add security middleware (centralized validation, rate limiting, CORS, secure headers). (Completed 2026-06-12)
11. Wire full CI gates for lint/typecheck/tests/verify:sync/verify:coverage. (Completed 2026-06-13)
12. Add API Dockerfile + runbook + observability baseline.

## Progress Log
- 2026-06-12: Task 1 completed.
- Added backend TypeScript skeleton with bootstrapped Express app and route registration.
- Added health endpoint and server startup wiring.
- Added build/dev/typecheck/start scripts and build tsconfig for emitted dist output.
- 2026-06-12: Completed setup hardening for Task 0.2.
- Added ESLint and Prettier configuration with validation scripts.
- Added API versioning and constant x-api-prefix response header behavior.
- Added OpenAPI JSON output and Swagger UI documentation route for the current API surface.
- 2026-06-12: Implemented Task 2.1 registration endpoint behavior.
- Added real POST /v1/registration validation and deterministic outcomes (201/400/409).
- Added executable registration API rule assertions for REG-001..REG-004.
- Updated OpenAPI registration contract from 501 stub to implemented request/response schemas.
- 2026-06-12: Implemented Task 2.2 login endpoint behavior.
- Added real POST /v1/login authentication outcomes (200/401/423) using shared in-memory auth state.
- Added executable login API rule assertions for LGN-001..LGN-003.
- Updated OpenAPI login contract from 501 stub to implemented request/response schemas.
- 2026-06-12: Implemented Tasks 2.3 and 2.4 for users.
- Added real POST /v1/users and GET /v1/users/:id with authorization checks and deterministic outcomes.
- Added executable USR and USG API rule assertions to replace scaffolds.
- Updated OpenAPI create-user/get-user contracts from 501 stubs to implemented request/response schemas.
- 2026-06-12: Implemented Task 2.5 checkout endpoint behavior.
- Added real POST /v1/checkout outcomes for empty cart, shipping validation, payment authorization, and order confirmation.
- Added executable CHK-001..CHK-004 API assertions.
- Updated OpenAPI checkout contract from 501 stub to implemented request/response schemas.
- 2026-06-12: Completed Task 0.1 architecture and conventions artifacts.
- Added ADR: docs/adr/0001-api-architecture.md.
- Added conventions guide: docs/backend-conventions.md.
- 2026-06-12: Completed Task 1.1 database schema, migrations, and seed.
- Added prisma/schema.prisma with AuthUser, Session, ManagedUser, Order, OrderItem, ShippingAddress models.
- Added prisma/migrations/001_init/migration.sql for PostgreSQL.
- Added prisma/seed.ts with upsert seed records.
- Added prisma.config.ts for Prisma 7 datasource configuration.
- Added docker-compose.yml with postgres:16-alpine service for local dev.
- Added .env.example and .gitignore. Extended env config with databaseUrl.
- Added src/data/prisma-client.ts singleton using @prisma/adapter-pg.
- Added db:generate, db:migrate, db:migrate:deploy, db:seed, db:studio, db:reset scripts to package.json.
- 2026-06-12: Gap audit added to keep plan current with actual project state.
- Recorded PKaC rule drift (REG-003), CI enforcement gap, and in-memory to Prisma migration gap.
- 2026-06-12: Completed Task 7 REG-003 drift resolution.
- Aligned REG-003 rule text to minimum 10 characters across md/yaml/gherkin, runtime validation constant, API/UI test titles, and OpenAPI minLength.
- 2026-06-12: Completed Task 8 auth foundation.
- Added password hashing and verification utilities for auth users.
- Added JWT issuance and verification with shared protected-route middleware.
- Updated login contract example and login API test token-format assertion.
- 2026-06-12: Began Task 9 persistence refactor.
- Added auth and managed-user repository/service layers so routes no longer own storage behavior directly.
- Added lazy Prisma client access to preserve deterministic local execution when `DATABASE_URL` is absent.
- Added Prisma schema and migration support for stable public IDs (`usr_*`) needed by the current API contract.
- Added checkout repository/service layers so checkout behavior is no longer route-local.
- Added runtime `.env` loading to make Prisma activation environment-driven.
- Adjusted checkout schema/migration path so unauthenticated checkout behavior can be persisted without violating the current API contract.
- Validation remains green for sync, coverage, typecheck, and 22/22 API tests.
- 2026-06-12: Continued Task 9 operational rollout and completed Task 1.3 security middleware.
- Added dotenv loading in Prisma config so CLI commands consume `.env` DATABASE_URL values.
- Verified Prisma generate works and migration reaches configured datasource; local PostgreSQL availability remains required (current environment reports no server on localhost:5432).
- Added centralized error middleware, request ID middleware, secure headers, CORS policy, and rate limiting.
- Added async-safe route handler wrappers and request-body object validation middleware across POST endpoints.
- 2026-06-13: Continued Task 9 operational rollout and completed Task 11 quality gate wiring.
- Re-ran Prisma migrate/seed path; migration still blocked by unavailable local PostgreSQL (`P1001` at localhost:5432).
- Fixed Prisma seed initialization for Prisma 7 config by requiring `.env` and using `@prisma/adapter-pg` with `pg.Pool`.
- Confirmed lint, typecheck, verify:sync, verify:coverage, and API test gates pass locally after middleware and lint fixes.
- Updated CI quality workflow to enforce `lint`, `typecheck`, `verify:sync`, `verify:coverage`, and API/UI test execution.
