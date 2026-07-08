# Cloud Run Deployment Configuration

**Last Updated**: 2026-07-08  
**Status**: Task 19 — Environment & Secrets Configuration ✅

## Deployment Target

- **Service Name**: `template-project`
- **Region**: `us-central1`
- **Runtime**: Node.js 22 (via multi-stage Docker build)
- **Memory**: 512 MiB
- **CPU**: 1
- **Concurrency**: 100
- **Auto-scaling**: min=0, max=100 (scales to zero when idle)

## Service Identity

- **Service Account**: `template-project-runtime@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com`
- **IAM Roles**:
  - `roles/secretmanager.secretAccessor` — Read secrets from Secret Manager
  - `roles/cloudsql.client` — Connect to Cloud SQL PostgreSQL

## Secrets Configuration

Secrets are injected as environment variables from Google Secret Manager at runtime.

### Required Secrets

| Secret Name | Cloud Run Env Var | Description |
|---|---|---|
| `template-app-db-password` | `DATABASE_PASSWORD` | PostgreSQL database password |
| `template-project-jwt-secret` | `JWT_SECRET` | JWT signing/verification key |

**Injection command flags**:
```bash
--set-secrets="DATABASE_PASSWORD=template-app-db-password:latest,JWT_SECRET=template-project-jwt-secret:latest"
```

## Environment Variables Configuration

Non-secret environment variables are passed directly or injected from Secret Manager.

### Runtime Configuration

| Variable | Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Node.js environment mode |
| `LOG_LEVEL` | `info` | Structured logging level |
| `METRICS_ENABLED` | `true` | Enable /metrics Prometheus endpoint |
| `API_VERSION` | `v1` | Current API version header |
| `CORS_ORIGINS` | `*` | CORS allowed origins (or specific domain) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window per IP |
| `PORT` | `8080` | HTTP server port (Cloud Run default) |

### Database Configuration

| Variable | Value | Source | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://template_app:[PASSWORD]@35.225.201.212:5432/template_app` | Constructed at runtime | Prisma database connection |
| `DATABASE_PASSWORD` | (from Secret Manager) | `template-app-db-password:latest` | PostgreSQL password |
| `DATABASE_HOST` | `35.225.201.212` | Static | Cloud SQL public IP |
| `DATABASE_PORT` | `5432` | Static | PostgreSQL port |
| `DATABASE_USER` | `template_app` | Static | Database user |
| `DATABASE_NAME` | `template_app` | Static | Database name |

**DATABASE_URL Construction**:
```
postgresql://[DATABASE_USER]:[DATABASE_PASSWORD]@[DATABASE_HOST]:[DATABASE_PORT]/[DATABASE_NAME]
```

**Injected in startup script**:
```bash
export DATABASE_URL="postgresql://template_app:${DATABASE_PASSWORD}@35.225.201.212:5432/template_app"
```

## Cloud Run Deployment Command

```bash
gcloud run deploy template-project \
  --source=. \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --service-account=template-project-runtime@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --set-secrets="DATABASE_PASSWORD=template-app-db-password:latest,JWT_SECRET=template-project-jwt-secret:latest" \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info,METRICS_ENABLED=true,API_VERSION=v1,CORS_ORIGINS=*,RATE_LIMIT_WINDOW_MS=900000,RATE_LIMIT_MAX_REQUESTS=100,PORT=8080" \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=100 \
  --min-instances=0 \
  --max-instances=100 \
  --allow-unauthenticated \
  --ingress=all
```

## Dockerfile Requirements

- **Base Image**: `node:22-alpine` (production build)
- **Build Stage**: Install dependencies, compile TypeScript, prune dev deps
- **Runtime Stage**: Copy build artifacts, expose port 8080, run npm start
- **Health Check**: GET `/health` responds with 200 OK

**Location**: `template-project/Dockerfile` (already committed)

## Post-Deployment Validation

After deploying Cloud Run service, verify:

1. **Public Endpoint Reachable**:
   ```bash
   curl https://[SERVICE_URL]/health
   ```

2. **OpenAPI Docs Available**:
   ```bash
   curl https://[SERVICE_URL]/docs
   ```

3. **Authentication Flow**:
   ```bash
   curl -X POST https://[SERVICE_URL]/v1/registration \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"SecurePass123!"}'
   ```

4. **Metrics Endpoint**:
   ```bash
   curl https://[SERVICE_URL]/metrics
   ```

5. **Error Handling** (400 validation):
   ```bash
   curl -X POST https://[SERVICE_URL]/v1/registration \
     -H "Content-Type: application/json" \
     -d '{"email":"invalid"}'
   ```

## Secret Manager Verification

```bash
# Verify secrets exist
gcloud secrets list --project=project-08401bb0-e467-491a-ac0

# Verify secret versions
gcloud secrets versions list template-app-db-password --project=project-08401bb0-e467-491a-ac0
gcloud secrets versions list template-project-jwt-secret --project=project-08401bb0-e467-491a-ac0

# Verify runtime SA can access (optional):
gcloud secrets get-iam-policy template-app-db-password --project=project-08401bb0-e467-491a-ac0
gcloud secrets get-iam-policy template-project-jwt-secret --project=project-08401bb0-e467-491a-ac0
```

## Troubleshooting

### Secret Access Denied
- Verify `template-project-runtime` SA has `roles/secretmanager.secretAccessor`
- Check Secret Manager IAM policy includes the runtime SA

### Database Connection Failed
- Verify Cloud SQL instance is RUNNABLE: `gcloud sql instances describe template-project-db --project=project-08401bb0-e467-491a-ac0`
- Check database user exists: `gcloud sql users list --instance=template-project-db --project=project-08401bb0-e467-491a-ac0`
- Verify password matches Secret Manager value

### PORT Binding Error
- Cloud Run always assigns port 8080; ensure application listens on this port
- Check `src/index.ts` for `PORT` environment variable handling

## Rollback & Recovery

To rollback to a previous Cloud Run revision:
```bash
gcloud run revisions list --service=template-project --region=us-central1 --project=project-08401bb0-e467-491a-ac0 --format='value(name,status)'

gcloud run services update-traffic template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --to-revisions=[PRIOR_REVISION]=100
```

---

**Next Phase**: Task 20 — Build and Deploy (when ready to execute deployment command)
