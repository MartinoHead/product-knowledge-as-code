# GitHub Actions Deployment Setup

## Overview

This document describes how to set up GitHub Actions with Google Cloud Run for continuous deployment of the template-project API.

If this is your first time using Google Cloud, start with the "First-time Google Cloud setup" section below. It explains the basic account, project, and command-line steps before you configure GitHub Actions.

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

## First-time Google Cloud setup

These steps help you get from "I have a Google account" to "I can deploy to Cloud Run".

### 0. Install the Google Cloud CLI

Install the `gcloud` command-line tool from:
- https://cloud.google.com/sdk/docs/install

After installation, verify it works:

```bash
gcloud --version
```

### 1. Sign in to Google Cloud

Open a terminal and log in with your Google account:

```bash
gcloud auth login
```

If the browser opens, choose the Google account that has access to the GCP project.

### 2. Pick the project you want to use

List the projects you can access:

```bash
gcloud projects list
```

Set the project for this repository:

```bash
gcloud config set project project-08401bb0-e467-491a-ac0
```

Check the active project:

```bash
gcloud config get-value project
```

### 3. Set your default region

This project uses Cloud Run, so you should also choose a region. The docs use `us-central1`:

```bash
gcloud config set run/region us-central1
```

### 4. Enable the Google Cloud APIs this project needs

Run this once per project:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  sqladmin.googleapis.com
```

Why these matter:
- `run.googleapis.com` deploys the app to Cloud Run.
- `artifactregistry.googleapis.com` stores the container image.
- `secretmanager.googleapis.com` lets the app read secrets securely.
- `cloudbuild.googleapis.com` is often used when building images in GCP.
- `logging.googleapis.com` and `monitoring.googleapis.com` help you debug and observe the service.
- `sqladmin.googleapis.com` is needed if you later connect Cloud Run to Cloud SQL.

### 5. Confirm your billing account is attached

Cloud Run, Artifact Registry, and logging usually require billing.

You can view the billing status with:

```bash
gcloud beta billing projects describe project-08401bb0-e467-491a-ac0
```

If billing is not enabled, attach a billing account in the Google Cloud Console.

### 6. Verify you can reach Cloud Run resources

Once the CLI is configured, confirm the service name and region are valid:

```bash
gcloud run services list --region=us-central1 --project=project-08401bb0-e467-491a-ac0
```

If this returns nothing, the service may not have been created yet. That is okay if you are still in setup mode.

### 7. Optional: authenticate Application Default Credentials

Some local tools use ADC instead of the normal browser login:

```bash
gcloud auth application-default login
```

This is useful if you later run scripts that talk to Google Cloud APIs directly from your machine.

### Step 1: Configure Workload Identity Federation (Recommended)

Use this option if you want GitHub Actions to deploy without storing a long-lived JSON key.

Before you start, make sure you already completed the first-time Google Cloud setup above.

Workload Identity Federation allows GitHub Actions to authenticate to Google Cloud without storing long-lived credentials.

#### 1a. Create Workload Identity Provider

This creates the trust relationship that lets GitHub Actions exchange its OIDC token for Google Cloud access.

```bash
gcloud iam workload-identity-pools create github-provider \
  --project=project-08401bb0-e467-491a-ac0 \
  --location=global \
  --display-name=GitHub
```

#### 1b. Create Workload Identity Provider Attribute Mapping

This mapping tells Google which GitHub fields to trust and expose to IAM.

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
  --attribute-condition="assertion.repository_owner == 'MartinoHead'"
```

Replace `YOUR_GITHUB_ORG` with your GitHub organization name.

Important: keep the full `assertion.repository_owner == '...'` expression inside quotes, otherwise your shell splits `==` and the GitHub owner into separate arguments.

If you are working in a personal repository, you can use your GitHub username or organization name depending on how you want to scope access.

#### 1c. Create GitHub Actions Service Account

This is the Google Cloud identity the workflow will use when it deploys.

```bash
gcloud iam service-accounts create github-actions \
  --project=project-08401bb0-e467-491a-ac0 \
  --display-name="GitHub Actions"
```

#### 1d. Grant IAM Roles to GitHub Actions Service Account

These roles give the workflow the minimum permissions it needs to build and deploy the app.

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

This final step links the GitHub repository identity to the Google service account.

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
  --member="principalSet://iam.googleapis.com/projects/785643093715/locations/global/workloadIdentityPools/github-provider/attribute.repository_owner/MartinoHead"
```

Replace:
- `785643093715` if your project number is different
- `MartinoHead` if your GitHub owner is different

If you are unsure of your project number, open the Google Cloud Console or run:

```bash
gcloud projects describe project-08401bb0-e467-491a-ac0 --format='value(projectNumber)'
```

Verify the binding is active:

```bash
gcloud iam service-accounts get-iam-policy github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --project=project-08401bb0-e467-491a-ac0 \
  --format="json(bindings)"
```

### Step 2: Configure GitHub Repository Secrets (If Not Using Workload Identity)

Only use this fallback if Workload Identity Federation is not an option.

For your current project, you do not need this step if you are using Workload Identity Federation. In fact, your org policy currently blocks service account key creation (`constraints/iam.disableServiceAccountKeyCreation`), so the JSON key path is intentionally unavailable unless an admin changes that policy.

This approach creates a long-lived JSON key, so it is less secure than Workload Identity.

If you cannot use Workload Identity Federation, create a service account key:

```bash
gcloud iam service-accounts keys create /tmp/gha-key.json \
  --iam-account=github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com
```

Then add to GitHub repository settings:
- **Settings → Secrets and variables → Actions**
- Add secret `GCP_SA_KEY` with contents of `/tmp/gha-key.json`

This secret is what the workflow reads when it authenticates to Google Cloud.

Update the workflow to use:
```yaml
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

### Step 3: Verify Environment Configuration

These values control where the workflow deploys and what service it updates.

Open `.github/workflows/deploy.yml` and confirm the values match your project.

If you are new to YAML, think of `env:` as "shared variables for the whole workflow".

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

Artifact Registry stores the container image that Cloud Run deploys.

If the repository already exists, this command will fail harmlessly and you can move on.

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

If something fails, start here. For first-time users, the two most useful checks are:
- `gcloud run services describe ...` to confirm deployment configuration
- `gcloud run logs read ...` to inspect runtime errors

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

These checks help you tell whether the service is alive, ready, or missing dependencies.

```bash
# Check service status
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0

# Test health endpoint
curl https://template-project-w5qrllc24a-uc.a.run.app/health

# Test readiness endpoint
curl -i https://template-project-w5qrllc24a-uc.a.run.app/ready

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

If you are new to Google Cloud, these are the most common early problems:
- The wrong project is active in `gcloud`
- Billing is not enabled
- Required APIs are not enabled
- The service account does not have permission to deploy
- The database is not reachable from Cloud Run

### Issue: "Permission denied" on Secret Manager access

**Solution:** Ensure the GitHub Actions service account has `secretmanager.secretAccessor` role:

```bash
gcloud projects add-iam-policy-binding project-08401bb0-e467-491a-ac0 \
  --member=serviceAccount:github-actions@project-08401bb0-e467-491a-ac0.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### Issue: "Image not found" during deployment

This usually means the Artifact Registry repository or Docker auth is not configured correctly.

**Solution:** Verify Artifact Registry credentials and permissions:

```bash
# Configure Docker auth
gcloud auth configure-docker us-central1-docker.pkg.dev

# Test push
docker tag test:latest us-central1-docker.pkg.dev/project-08401bb0-e467-491a-ac0/cloud-run-source-deploy/test:latest
docker push us-central1-docker.pkg.dev/project-08401bb0-e467-491a-ac0/cloud-run-source-deploy/test:latest
```

### Issue: Smoke tests fail but no rollback

If this happens, the deployment may still be fine; the rollback stage is skipped if there is no previous revision.

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
