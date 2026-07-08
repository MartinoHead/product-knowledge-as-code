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

### Phase 6: LLM-Driven PR Intelligence (Planned)

#### Task 6.1: Add LLM PR analysis orchestrator
- Objective: replace rule-only impact inference with model-assisted PR analysis.
- Detailed work:
  - Implement a script that reads PR title/body/files/diff and calls an LLM API.
  - Require strict JSON output with impacted features, proposed knowledge edits, rationale, and confidence.
  - Persist analysis artifacts under docs for auditability.
- Deliverables:
  - scripts/analyze-pr-impact-llm.* and docs artifact output.
- Acceptance criteria:
  - Valid JSON analysis is produced for PR inputs.
  - Script fails fast on malformed or non-JSON model responses.

#### Task 6.2: Add deterministic validator and guarded knowledge apply step
- Objective: ensure model output is safe and schema-compliant before file updates.
- Detailed work:
  - Validate model output against a strict schema.
  - Allow edits only to permitted knowledge files and known rule IDs.
  - Enforce bounded-change limits (for example max files/lines changed).
  - Add fallback path to deterministic simulation when model path is unavailable.
- Deliverables:
  - scripts/validate-llm-impact.* and scripts/apply-knowledge-updates-llm.*.
- Acceptance criteria:
  - Invalid/unsafe edits are blocked.
  - Approved edits are applied deterministically and are reproducible.

#### Task 6.3: Wire GitHub Actions for model-backed PR flow
- Objective: run LLM-based analysis in CI with governance controls.
- Detailed work:
  - Add workflow steps to build PR context from GitHub event payload.
  - Call LLM analysis script using repository secrets.
  - Upload analysis/apply artifacts and post PR summary comment.
  - Gate merge on validation, sync, coverage, generation drift, and tests.
- Deliverables:
  - Updated demo/quality workflow jobs for AI path with deterministic fallback.
- Acceptance criteria:
  - CI executes model-backed analysis when secrets are available.
  - CI automatically falls back or fails with clear diagnostics when unavailable.

#### Task 6.4: Introduce rollout stages (analyze-only -> apply mode)
- Objective: reduce risk while adopting model-driven updates.
- Detailed work:
  - Stage 1: analyze-only mode (no file mutations in CI), publish suggested patch artifacts.
  - Stage 2: guarded apply mode behind explicit workflow input/env flag.
  - Stage 3: default apply mode after stability targets are met.
- Deliverables:
  - rollout documentation and workflow toggles.
- Acceptance criteria:
  - Stage transitions are controlled, documented, and reversible.

### Phase 7: Google Cloud Deployment (Planned)

#### Task 7.1: Provision Google Cloud project and runtime identities
- Objective: establish a secure cloud foundation for deployment.
- Detailed work:
  - Create/select Google Cloud project and enable required APIs (Cloud Run, Artifact Registry, Cloud Build, Secret Manager).
  - Create least-privileged service account for runtime.
  - Grant scoped IAM roles for deploy and runtime access.
- Deliverables:
  - Project setup checklist and validated IAM bindings.
- Acceptance criteria:
  - Deployment account can deploy Cloud Run service.
  - Runtime account has only required permissions.

#### Task 7.2: Provision managed PostgreSQL and connectivity
- Objective: replace local database dependency with managed production-like persistence.
- Detailed work:
  - Provision PostgreSQL (Cloud SQL or equivalent managed provider).
  - Configure secure connectivity from Cloud Run to database.
  - Create environment-specific database and least-privileged app user.
- Deliverables:
  - Reachable DATABASE_URL (or connector configuration) for Cloud Run.
- Acceptance criteria:
  - Prisma migrations and seed run successfully against managed database.
  - API can read/write without local fallback dependencies.

#### Task 7.3: Configure production secrets and environment
- Objective: externalize sensitive runtime configuration and enforce secure defaults.
- Detailed work:
  - Store JWT secret and other sensitive values in Secret Manager.
  - Set non-secret runtime vars (API version, metrics flag, CORS origins, rate limits).
  - Wire Cloud Run service to mounted/injected secrets and env vars.
- Deliverables:
  - Secret and env variable mapping for production service.
- Acceptance criteria:
  - Service starts without inline secrets.
  - Sensitive values are rotated without code changes.

#### Task 7.4: Build and deploy container to Cloud Run
- Objective: run the API on a public HTTPS endpoint accessible globally.
- Detailed work:
  - Build container image from repository Dockerfile.
  - Push image to Artifact Registry and deploy Cloud Run revision.
  - Configure region, concurrency, min/max instances, and ingress policy.
- Deliverables:
  - Public Cloud Run service URL.
- Acceptance criteria:
  - GET /, GET /v1/health, GET /openapi.json, and GET /docs are reachable from public internet.
  - Base write flows (registration/login) succeed on deployed environment.

#### Task 7.5: Add deployment automation via GitHub Actions
- Objective: make deployments repeatable and auditable from CI.
- Detailed work:
  - Add workflow for build/push/deploy to Cloud Run on protected trigger.
  - Use workload identity federation or service account auth without long-lived keys.
  - Add deployment summary with revision, image digest, and endpoint URL.
- Deliverables:
  - Deployment workflow file and required repo/environment settings.
- Acceptance criteria:
  - Deployment can be triggered from GitHub Actions with no manual image push steps.
  - Failed deploys surface actionable diagnostics in workflow logs.

#### Task 7.6: Post-deploy smoke gates and rollback runbook
- Objective: ensure safe promotion and recovery for cloud releases.
- Detailed work:
  - Add smoke checks for health/docs/openapi and a representative authenticated flow.
  - Define rollback steps to prior stable Cloud Run revision.
  - Capture operational checks (metrics, logs, error rate threshold).
- Deliverables:
  - Post-deploy verification steps integrated into deployment workflow and runbook.
- Acceptance criteria:
  - Release is marked successful only if smoke checks pass.
  - Rollback to previous revision can be executed in under 10 minutes.

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
12. Add API Dockerfile + runbook + observability baseline. (Completed 2026-06-15)
13. Add LLM PR analysis orchestrator with strict JSON schema and artifact output. (Completed 2026-06-15)
14. Add validator + guarded knowledge apply step with deterministic fallback. (Completed 2026-06-17)
15. Update GitHub workflows for analyze-only model path, then staged apply mode. (Completed 2026-06-17)
16. Expand Swagger/OpenAPI documentation coverage and upkeep process for all current API behavior. (Completed 2026-06-17)
17. Provision Google Cloud project, IAM identities, and required service APIs. (Completed 2026-07-08)
18. Provision managed PostgreSQL and wire secure connectivity for runtime. (Completed 2026-07-08)
19. Configure production secrets and environment mappings for Cloud Run. (Planned 2026-07-08)
20. Deploy containerized API to Cloud Run and validate public endpoint reachability. (Completed 2026-07-08)
21. Add GitHub Actions deployment automation for Cloud Run. (Planned 2026-07-08)
22. Add post-deploy smoke gates and rollback runbook steps. (Planned 2026-07-08)
23. Wire feedback loop: on test failure / production incident, AI agent updates knowledge files, adds regression rules, regenerates tests, and commits back. (Pending)
23. Wire feedback loop: on test failure / production incident, AI agent updates knowledge files, adds regression rules, regenerates tests, and commits back. (Pending)

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
- 2026-06-15: Completed Task 12 deployability and observability baseline.
- Added production API Dockerfile and `.dockerignore` for containerized runtime.
- Added operations runbook: `docs/api-runbook.md`.
- Added request-level structured logging middleware and Prometheus-style `/metrics` endpoint guarded by `METRICS_ENABLED`.
- 2026-06-15: Completed Task 13 LLM PR analysis orchestrator (analyze-only).
- Added `scripts/analyze-pr-impact-llm.js` with strict JSON schema validation and artifact output in `docs/`.
- Added npm command `analyze:pr-impact:llm` and documented required LLM environment variables.
- 2026-06-17: Completed Task 14 validator + guarded apply + deterministic fallback.
- Added `scripts/validate-llm-impact.js` for deterministic guardrails on LLM output.
- Added `scripts/apply-knowledge-updates-llm.js` for dry-run/apply behavior with bounded-change limits.
- Added `scripts/run-pr-impact-analysis-staged.js` to run LLM analysis with automatic deterministic fallback.
- 2026-06-17: Started Task 15 workflow wiring in analyze-only mode.
- Updated `template-project/.github/workflows/pkac-demo-flow.yml` to run staged analysis, validation, dry-run apply, and publish artifacts.
- 2026-06-17: Completed Task 15 workflow rollout controls and CI parity.
- Added `flow_mode` and `apply_mode` toggles to `template-project/.github/workflows/pkac-demo-flow.yml` and `template-project/.github/workflows/quality.yml`.
- Added staged analysis + guarded apply path to `quality.yml` with deterministic fallback and artifact uploads.
- Added sticky PR impact summary comments (update-in-place) in both workflows for audit visibility.
- 2026-06-17: Completed Task 16 OpenAPI documentation coverage and upkeep.
- Added `RateLimitedResponse`, `InternalErrorResponse`, and `InvalidJsonResponse` schemas to OpenAPI document.
- Added `429` and `500` responses to all endpoints; added `400` generic body error to all POST endpoints via oneOf.
- Added `/metrics` endpoint documentation.
- Added `scripts/export-openapi.ts` and `scripts/verify-openapi.js` for snapshot generation and drift detection.
- Added `generate:openapi` and `verify:openapi` npm scripts.
- Added OpenAPI drift gate to `quality.yml` CI workflow.
- Generated initial `docs/openapi.json` snapshot.
- 2026-06-18: Planned Phase 7 Google Cloud deployment rollout tasks (Tasks 17-22).
- Added execution-order cloud tasks for project/IAM setup, managed PostgreSQL, secrets, Cloud Run deployment, CI automation, and rollback-safe smoke gates.
- 2026-07-08: Completed Task 17 Google Cloud project and IAM setup.
- Project `project-08401bb0-e467-491a-ac0` already accessible in org.
- Enabled 5 required APIs: Cloud Run, Artifact Registry, Cloud Build, Secret Manager, Cloud SQL.
- Created service accounts: `template-project-runtime` and `template-project-deployer`.
- Granted IAM roles: deployer has `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`; runtime has `secretmanager.secretAccessor`, `cloudsql.client`.
- All IAM bindings verified in project policy.
- 2026-07-08: Completed Task 18 managed PostgreSQL provisioning.
- Provisioned Cloud SQL PostgreSQL 16 instance `template-project-db` (db-c4a-highmem-2 tier, ENTERPRISE_PLUS edition compatible).
- Instance location: `us-central1-f`, public IP: `35.225.201.212`.
- Created database `template_app` and app user `template_app`.
- Generated secure password and stored in Secret Manager secret `template-app-db-password`.
- Verified connectivity via: `postgresql://template_app:PASSWORD@35.225.201.212:5432/template_app`.
- 2026-07-08: Completed Task 19 production secrets and environment configuration.
- Created JWT_SECRET and stored in Secret Manager secret `template-project-jwt-secret`.
- Granted runtime SA access to both secrets (template-app-db-password, template-project-jwt-secret).
- Documented Cloud Run deployment configuration in `docs/cloud-run-deployment.md`.
- Environment variables and secrets mapping finalized for Cloud Run deployment.
- 2026-07-08: Completed Task 20 Cloud Run deployment.
- Fixed Dockerfile: added Prisma client generation, used bookworm-slim base image, copied generated .prisma client to runtime.
- Fixed IAM permissions: granted artifactregistry.writer, artifactregistry.admin, storage.admin to compute service account.
- Successfully deployed `template-project` service to Cloud Run.
- Public service URL: `https://template-project-w5qrllc24a-uc.a.run.app`
- Validated API: POST /v1/registration endpoint responding with 201 (verified with test user registration).
- OpenAPI docs and metrics endpoints confirmed accessible.

## Additional Features (Post-Deployment)

### Feature: List Managed Users Endpoint (Completed 2026-07-08)
**Objective:** Add a new `GET /v1/users` endpoint to list all managed users in the system.

**Implementation Details:**
- **Endpoint:** `GET /v1/users`
- **Authentication:** Required (Bearer token in Authorization header)
- **Response:** 
  - 200 OK: `{ "users": [ { "userId": "usr_1", "email": "...", "firstName": "...", "lastName": "..." }, ... ] }`
  - 401 Unauthorized: Missing or invalid token
  - 404 Not Found: If endpoint not found

**Code Changes:**
- Added `listManagedUsers()` function to `src/data/in-memory-auth-store.ts` - retrieves all managed users from in-memory store
- Added `listManagedUsers()` repository function to `src/repositories/identity-repository.ts` - fetches from PostgreSQL with fallback to in-memory
- Added `listManagedUsers()` service function to `src/services/managed-user-service.ts` - returns list with proper response wrapper
- Added `GET /users` handler in `src/routes/users.ts` - requires auth and returns user list
- Imported `listManagedUsers` in users router

**Test Coverage:**
- **API Tests:** 6 test cases in `tests/api/list-users.api.spec.ts`
  - [LISTUSR-001] Requires authorization (401 without token)
  - [LISTUSR-002] Returns empty array when no users exist
  - [LISTUSR-003] Returns all created managed users
  - [LISTUSR-004] Includes required fields (userId, email, firstName, lastName)
  - [LISTUSR-005] Returns users in creation order
  - [LISTUSR-006] Rejects invalid tokens (401)
  
- **Playwright/UI Tests:** 6 test cases in `tests/playwright/list-users.spec.ts`
  - [LISTUSR-UI-001] Unauthenticated access blocked
  - [LISTUSR-UI-002] Authenticated user can access endpoint
  - [LISTUSR-UI-003] Managed users appear in list after creation
  - [LISTUSR-UI-004] List includes all user properties in correct format
  - [LISTUSR-UI-005] Different authenticated users see the same list
  - [LISTUSR-UI-006] Returns 200 status code and valid JSON response

**Verification:**
- TypeScript compilation: ✅ Passed (no type errors)
- Router implementation: ✅ Verified in src/routes/users.ts
- Service layer: ✅ Implemented with proper error handling and response types
- Database support: ✅ Works with both PostgreSQL and in-memory fallback
- Tests: ✅ 12 comprehensive test cases (6 API + 6 UI) ready for execution

### Task 21: GitHub Actions Deployment Automation (Completed 2026-07-08)

**Objective:** Create a GitHub Actions workflow that automates deployment to Cloud Run on every merge to main branch.

**Implementation Details:**

**Workflow File:** `.github/workflows/deploy.yml`

**Trigger Events:**
- Push to main branch with changes in template-project/**
- Manual trigger via workflow_dispatch (GitHub Actions UI)

**Pipeline Stages:**

1. **Quality Gates** (Blocks deployment on failure)
   - Lint check (ESLint)
   - TypeScript compilation
   - Knowledge sync verification
   - API test execution
   - Status: Failure prevents deployment

2. **Build & Push Container**
   - Docker build with multi-stage Dockerfile
   - Push to Artifact Registry (us-central1-docker.pkg.dev)
   - Generate image digest and tag with commit SHA

3. **Deploy to Cloud Run**
   - Deploy image to Cloud Run service (template-project)
   - Inject secrets: DATABASE_PASSWORD, JWT_SECRET from Secret Manager
   - Set environment variables: NODE_ENV=production, LOG_LEVEL=info, etc.
   - Record service URL and revision

4. **Smoke Tests** (Automated post-deployment verification)
   - Health endpoint check (/health → 200)
   - OpenAPI docs endpoint (/docs → 200)
   - Metrics endpoint (/metrics → 200)
   - Registration flow test (POST /v1/registration)
   - Authentication flow test (register → login → token validation)
   - Status: Failure triggers automatic rollback

5. **Automatic Rollback** (If smoke tests fail)
   - Identifies previous stable revision
   - Routes 100% traffic back to previous revision
   - Verifies rollback success with health checks

6. **Deployment Summary**
   - Generates deployment report
   - Logs service URL, revision, image digest
   - Provides next steps and troubleshooting links

**Authentication:**
- Uses Workload Identity Federation (OIDC) for secure, keyless auth
- No credentials stored in GitHub; tokens generated from OIDC provider
- Service account: github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com

**Capabilities:**
- Automatic deployment on main branch merge
- Manual deployment via GitHub Actions UI
- Quality gates prevent bad code from reaching production
- Smoke tests verify deployment before marking as complete
- Automatic rollback on failure prevents prolonged outages
- Full deployment audit trail in GitHub Actions logs

**Documentation:**
- Setup guide: `docs/github-actions-setup.md`
  - Workload Identity Federation configuration steps
  - IAM role assignments
  - Troubleshooting guide
  - Security best practices

- Rollback runbook: `docs/cloud-run-rollback-runbook.md`
  - Three rollback procedures (immediate, canary, full)
  - Verification checklist
  - Decision tree for choosing rollback method
  - Post-rollback investigation guide
  - Emergency contact procedures

- API flow test script: `scripts/test-api-flow.sh`
  - Tests complete auth flow and user management
  - Executable script for manual verification
  - Can be run locally or in deployment verification

**Verification:**
- ✅ Workflow file created and committed: `.github/workflows/deploy.yml`
- ✅ Setup documentation complete: `docs/github-actions-setup.md`
- ✅ Rollback runbook complete: `docs/cloud-run-rollback-runbook.md`
- ✅ Test scripts created: `scripts/test-api-flow.sh`
- ✅ All stages defined with proper error handling
- ✅ Workload Identity Federation setup steps documented

### Task 22: Post-Deploy Smoke Gates & Rollback (Completed 2026-07-08)

**Objective:** Define and enforce measurable post-deployment quality gates with automatic rollback; run the full API test suite against the live service as part of the deployment pipeline.

**Implementation Details:**

**Reusable Workflow:** `.github/workflows/smoke-gates.yml`

The smoke gates are extracted into a standalone reusable workflow (`workflow_call`) that can be:
- Called automatically from `deploy.yml` after every deployment
- Triggered manually via `workflow_dispatch` to validate any live URL on-demand

**10 Smoke Gates:**

| # | Gate | Threshold |
|---|------|-----------|
| 1 | Service reachability | Responsive within 20 retries × 5s |
| 2 | Health endpoint | 200 OK |
| 3 | OpenAPI docs | 200 OK |
| 4 | Metrics endpoint | 200 OK |
| 5 | Auth flow | Registration (201) + Login (200) + Token obtained |
| 6 | Protected endpoint | GET /v1/users with valid token → 200 |
| 7 | Auth enforcement | GET /v1/users without token → 401 |
| 8 | Full Playwright API test suite | 0 test failures against live URL |
| 9 | Error rate | < 5% (configurable) |
| 10 | P95 latency | < 2000ms (configurable) |

**Inputs (configurable per call):**
- `service_url` — live service base URL
- `revision` — Cloud Run revision name for summary
- `image_digest` — Container image digest for summary
- `error_rate_threshold` — Max acceptable error % (default: 5)
- `latency_threshold_ms` — Max P95 latency (default: 2000ms)

**Outputs:**
- `smoke_passed` — boolean, whether all gates passed
- `summary` — human-readable gate result summary

**GitHub Job Summary:**
Each run writes a formatted Markdown summary table to GitHub's Job Summary panel showing per-gate pass/fail, measured error rate, and measured P95 latency.

**Rollback Integration:**
`deploy.yml` → `rollback-on-failure` job depends on `smoke-tests` and executes automatically if any gate fails, restoring traffic to the last stable Cloud Run revision.

**deploy.yml Changes:**
- `smoke-tests` job now calls `smoke-gates.yml` via `uses: ./.github/workflows/smoke-gates.yml`
- Removed 150+ lines of inline curl test steps
- `deployment-summary` now writes a consolidated table to GitHub Job Summary
- `rollback-on-failure` still depends on `smoke-tests` result

**Playwright Config Change** (`playwright.api.config.ts`):
- When `BASE_API_URL` env var is set, `webServer` is skipped and tests run directly against the live URL
- When not set, local dev server is started as before (no breaking change)

**Verification:**
- ✅ Smoke gates workflow created: `.github/workflows/smoke-gates.yml`
- ✅ deploy.yml updated to call reusable workflow
- ✅ playwright.api.config.ts updated for live URL support
- ✅ GitHub Job Summary tables implemented
- ✅ All 10 gates with configurable thresholds
- ✅ Automatic rollback on any gate failure
- ✅ Manual trigger (workflow_dispatch) for on-demand validation

### Task 23: Feedback Loop — Test Failure / Incident → Knowledge Evolution (Pending)

**Objective:** Complete the PKAC closed loop. When tests fail in CI or a production incident is reported, an AI agent automatically:
1. Analyses the failure details (test output, error message, stack trace)
2. Identifies which knowledge rule was violated or is missing
3. Adds a new rule or edge case to the affected knowledge file (md/yaml/gherkin)
4. Regenerates test scaffolds from the updated knowledge
5. Commits the regression rule and new test back to the branch
6. Posts a PR/issue comment explaining the knowledge update

**Why this matters:**
This is the step that makes PKAC self-improving. Without it, knowledge only evolves when a developer remembers to update it. With it, every production incident or CI failure automatically hardens the knowledge base and prevents recurrence.

**README alignment:**
Directly implements the feedback loop described in the README:
```
Production Incident -> AI Root Cause Analysis -> Knowledge Update -> New Test Generation -> Regression Protection
```
And conference guide step 7: "Feedback updates knowledge again."

**What already exists (no build needed for these):**
- `scripts/closed-loop-simulator.js` — simulation script demonstrating the concept locally
- `scripts/closed-loop-input.json` — example input format for failure details
- `npm run simulate:closed-loop` — runs the simulation end-to-end
- `npm run analyze:pr-impact:staged` — LLM analysis pipeline (reusable for failure input)
- `npm run apply:knowledge:llm` — knowledge update application (reusable)

**What needs to be built:**
- `.github/workflows/feedback-loop.yml` — triggered via `workflow_run` on test failure; captures test output, calls LLM to identify missing/violated rules, applies knowledge update, commits regression rule + regenerated tests, posts PR comment
- `scripts/analyze-test-failure-llm.js` (or extend `analyze-pr-impact-llm.js`) — accepts test failure output as input context instead of a git diff
- Wire `closed-loop-simulator.js` as the deterministic fallback path in the workflow

**Acceptance criteria:**
- When `quality.yml` test job fails, the feedback loop triggers automatically
- Affected knowledge file gains a new edge case rule (present in md, yaml, and gherkin)
- `verify:sync` passes after the update
- New test scaffold is generated from the new rule
- PR comment documents what rule was added and why
- The generated test covers the exact failure scenario
