# Backend Conventions

## Purpose

Define code and architecture conventions for the real API implementation so new work stays consistent and predictable.

## Module Structure

Current baseline:

- src/app.ts: Express app composition and top-level middleware
- src/server.ts: runtime startup
- src/config/: environment/config parsing
- src/routes/: endpoint route modules per domain
- src/docs/openapi.ts: OpenAPI document factory
- src/data/: temporary in-memory stores and state helpers

Target structure when Tasks 1.1-1.3 are implemented:

- src/controllers/: HTTP request/response orchestration
- src/services/: business logic and policies
- src/repositories/: persistence abstraction (Prisma/PostgreSQL)
- src/middleware/: auth, validation, rate limiting, error handling
- src/domain/: shared types and domain models

## API Conventions

1. Versioning
- All business endpoints are mounted under /v1.

2. Headers
- Responses include x-api-prefix to make version context explicit.

3. Error Payloads
- Use deterministic error and message fields.
- Keep error values stable and machine-checkable for tests.

4. Status Codes
- Use precise HTTP status codes for validation, auth, conflict, not-found, and success paths.

## Coding Conventions

1. TypeScript
- Use strict typing and explicit request payload shapes.
- Normalize and validate external input at route boundary.

2. Route Responsibilities
- Route handlers should perform request parsing + response mapping.
- Business rules move to services as architecture evolves.

3. Determinism
- Keep behaviors deterministic so knowledge rules map to repeatable assertions.

## Testing Conventions

1. Rule Traceability
- Keep rule IDs in API test names, for example [REG-001], [LGN-003].

2. Assertions
- Validate status code, key payload fields, and x-api-prefix header.

3. Test Data
- Prefer generated unique emails/ids in tests to avoid cross-test collisions.

4. Knowledge-Generated Artifacts in CI
- CI runs knowledge-based test generation as part of the quality workflow.
- PRs fail when generated outputs differ from committed files (`git diff --exit-code`).
- Before pushing, run `npm run generate:tests` and commit any generated changes.

## Documentation Conventions

1. Truthful OpenAPI
- OpenAPI must reflect actual runtime behavior and status codes.
- Do not document success paths that are not implemented.

2. Plan Updates
- When a task is completed, update docs/real-api-project-plan.md in the same change.
