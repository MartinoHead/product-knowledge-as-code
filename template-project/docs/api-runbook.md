# API Runbook

## Purpose

Operational runbook for running the API locally and in containers, including baseline observability checks.

## Local Runtime

1. Install dependencies:

```bash
npm ci
```

2. Copy environment template:

```bash
cp .env.example .env
```

3. Start API in development mode:

```bash
npm run dev
```

4. Start API in production-like mode:

```bash
npm run build
npm run start
```

## Database Runtime (Local)

Start PostgreSQL using compose:

```bash
docker compose up -d postgres
```

Apply migration and seed:

```bash
npm run db:migrate
npm run db:seed
```

## Container Runtime

Build image:

```bash
docker build -t template-project-api:local .
```

Run container:

```bash
docker run --rm -p 3000:3000 --env-file .env template-project-api:local
```

## Health and Observability Endpoints

- API root: `GET /`
- OpenAPI JSON: `GET /openapi.json`
- Swagger UI: `GET /docs`
- Versioned health: `GET /v1/health`
- Metrics: `GET /metrics` (Prometheus text format, controlled by `METRICS_ENABLED`)

## Logging Baseline

- Every completed HTTP request emits a structured JSON log event to stdout.
- Request logs include method, path, statusCode, durationMs, and requestId.
- Request correlation uses `x-request-id` response header.

## Runtime Configuration Notes

- `DATABASE_URL` controls Prisma-backed persistence.
- If database is unreachable in current fallback design, selected repositories may fall back to in-memory behavior for deterministic test runs.
- Set `METRICS_ENABLED=false` to disable `/metrics`.

## Troubleshooting

1. API fails to boot with database errors
- Verify `.env` has correct `DATABASE_URL`.
- Ensure PostgreSQL container is running: `docker compose ps`.

2. Migration fails with `P1001`
- Database host/port is unreachable.
- Check local port mapping and firewall constraints.

3. No metrics endpoint available
- Confirm `METRICS_ENABLED=true`.
- Restart service after changing environment values.

4. Unexpected 5xx responses
- Inspect structured logs for matching `requestId`.
- Reproduce with a single request and trace middleware order.
