# GitHub Actions Deployment Setup

## Overview

This document describes how to set up GitHub Actions with Google Cloud Run for continuous deployment of the template-project API.

## Prerequisites

- GitHub repository with write access
- Google Cloud Project with Cloud Run, Secret Manager, and Artifact Registry enabled
- `gcloud` CLI installed locally
- Appropriate IAM permissions in GCP

## Deployment Architecture

```
Push to main branch
    ↓
Quality Gates (lint, typecheck, tests)
    ↓
Build & Push Container (Docker → Artifact Registry)
    ↓
Deploy to Cloud Run (with secrets injection)
    ↓
Smoke Tests (health check, auth flow, endpoints)
    ↓
✅ Deployment Complete or ❌ Automatic Rollback
```

## Setup Instructions

### Step 1: Configure Workload Identity Federation (Recommended)

Workload Identity Federation allows GitHub Actions to authenticate to Google Cloud without storing long-lived credentials.

#### 1a. Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools create github-provider \
  --project=project-08401bb0-e467-491a-ac0 \
  --location=global \
  --display-name=GitHub
```

#### 1b. Create Workload Identity Provider Attribute Mapping

```bash
gcloud iam workload-identity-pools providers create-oidc github \
  --project=project-08401bb0-e467-491a-ac0 \
  --location=global \
  --workload-identity-pool=github-provider \
  --display-name=GitHub \
  --attribute-mapping=google.subject=assertion.sub,\
attribute.actor=assertion.actor,\
attribute.aud=assertion.aud,\
attribute.repository=assertion.repository,\
attribute.repository_owner=assertion.repository_owner,\
attribute.environment=assertion.environment \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-condition=assertion.repository_owner == 'YOUR_GITHUB_ORG'
```

Replace `YOUR_GITHUB_ORG` with your GitHub organization name.

#### 1c. Create GitHub Actions Service Account

```bash
gcloud iam service-accounts create github-actions \
  --project=project-08401bb0-e467-491a-ac0 \
  --display-name="GitHub Actions"
```

#### 1d. Grant IAM Roles to GitHub Actions Service Account

```bash
# Grant Cloud Run admin (deploy)
gcloud projects add-iam-policy-binding project-08401bb0-e467-491a-ac0 \
  --member=serviceAccount:github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --role=roles/run.admin

# Grant Artifact Registry write (push images)
gcloud projects add-iam-policy-binding project-08401bb0-e467-491a-ac0 \
  --member=serviceAccount:github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --role=roles/artifactregistry.writer

# Grant IAM service account user (to use template-project-runtime SA)
gcloud projects add-iam-policy-binding project-08401bb0-e467-491a-ac0 \
  --member=serviceAccount:github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

#### 1e. Create Workload Identity Binding

```bash
# Get provider resource name
WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe github \
  --project=project-08401bb0-e467-491a-ac0 \
  --location=global \
  --workload-identity-pool=github-provider \
  --format='value(name)')

# Create binding for all repos in your org
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --project=project-08401bb0-e467-491a-ac0 \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-provider/attribute.repository_owner/YOUR_GITHUB_ORG"
```

Replace:
- `PROJECT_NUMBER` with your GCP project number (find with `gcloud config get-value project-info`)
- `YOUR_GITHUB_ORG` with your GitHub organization

### Step 2: Configure GitHub Repository Secrets (If Not Using Workload Identity)

If you cannot use Workload Identity Federation, create a service account key:

```bash
gcloud iam service-accounts keys create /tmp/gha-key.json \
  --iam-account=github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com
```

Then add to GitHub repository settings:
- **Settings → Secrets and variables → Actions**
- Add secret `GCP_SA_KEY` with contents of `/tmp/gha-key.json`

Update the workflow to use:
```yaml
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

### Step 3: Verify Environment Configuration

Ensure these values are set in `.github/workflows/deploy.yml`:

```yaml
env:
  GCP_PROJECT: project-08401bb0-e467-491a-ac0
  GCP_REGION: us-central1
  SERVICE_NAME: template-project
  ARTIFACT_REGISTRY: cloud-run-source-deploy
  RUNTIME_SA: template-project-runtime@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com
```

### Step 4: Create Artifact Registry Repository (If Not Exists)

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --project=project-08401bb0-e467-491a-ac0 \
  --repository-format=docker \
  --location=us-central1
```

## Workflow Triggers

The deployment workflow runs automatically on:

1. **Push to main branch** - Full deployment pipeline
2. **Manual trigger** - Via `workflow_dispatch` in GitHub Actions UI

## Workflow Stages

### Stage 1: Quality Gates
- Lint check (ESLint)
- TypeScript compilation
- Knowledge sync verification
- API test execution

**Failure here:** Deployment stops, no changes to production

### Stage 2: Build & Push
- Docker build
- Image push to Artifact Registry
- Image digest recorded

**Failure here:** Rollback to previous revision (if exists)

### Stage 3: Deploy to Cloud Run
- Update Cloud Run service with new image
- Inject secrets from Secret Manager
- Set environment variables
- Record service URL and revision

**Failure here:** Automatic rollback to previous revision

### Stage 4: Smoke Tests
- Health endpoint verification
- OpenAPI docs endpoint check
- Metrics endpoint validation
- Full authentication flow test
- Registration endpoint test

**Failure here:** Automatic rollback to previous revision

### Stage 5: Deployment Summary
- Generate deployment summary
- Log service URL and revision
- Notify completion status

## Monitoring & Debugging

### View Deployment Logs

```bash
# Stream logs from the deployed service
gcloud run logs read template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --limit=100 \
  --follow
```

### View Workflow Execution

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy to Cloud Run** workflow
4. Click latest run to see detailed logs

### Verify Service Health

```bash
# Check service status
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0

# Test health endpoint
curl https://template-project-w5qrllc24a-uc.a.run.app/health

# Test OpenAPI docs
curl https://template-project-w5qrllc24a-uc.a.run.app/docs
```

## Manual Deployment (If Needed)

To deploy without pushing code:

1. Go to GitHub repository **Actions** tab
2. Select **Deploy to Cloud Run** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Rollback Procedure

See [Rollback Runbook](./cloud-run-rollback-runbook.md) for detailed rollback instructions.

## Troubleshooting

### Issue: "Permission denied" on Secret Manager access

**Solution:** Ensure the GitHub Actions service account has `secretmanager.secretAccessor` role:

```bash
gcloud projects add-iam-policy-binding project-08401bb0-e467-491a-ac0 \
  --member=serviceAccount:github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### Issue: "Image not found" during deployment

**Solution:** Verify Artifact Registry credentials and permissions:

```bash
# Configure Docker auth
gcloud auth configure-docker us-central1-docker.pkg.dev

# Test push
docker tag test:latest us-central1-docker.pkg.dev/project-08401bb0-e467-491a-ac0/cloud-run-source-deploy/test:latest
docker push us-central1-docker.pkg.dev/project-08401bb0-e467-491a-ac0/cloud-run-source-deploy/test:latest
```

### Issue: Smoke tests fail but no rollback

**Solution:** Verify the previous revision exists:

```bash
gcloud run revisions list \
  --service=template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --limit=5
```

If no previous revision, the rollback stage is skipped (expected for first deployment).

## Security Best Practices

1. **Use Workload Identity Federation** - Avoids storing credentials in GitHub
2. **Rotate secrets regularly** - Use Secret Manager versioning
3. **Review IAM roles** - Apply principle of least privilege
4. **Monitor deployments** - Check Cloud Run logs for anomalies
5. **Restrict deployment branch** - Only main branch can trigger auto-deployment
6. **Code review** - Require PR approval before merge to main

## Next Steps

1. Configure Workload Identity Federation (Steps 1a-1e)
2. Test deployment with a PR to verify workflow runs
3. Implement smoke test alerts (see Task 22)
4. Set up monitoring and alerting
