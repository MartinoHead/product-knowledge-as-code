# Cloud Run Rollback Runbook

## Purpose

This runbook provides procedures for rolling back the template-project service to a previous revision in case of deployment issues, errors, or service degradation.

## Overview

**Service:** template-project  
**Region:** us-central1  
**Project:** project-08401bb0-e467-491a-ac0

### Rollback Automation

The GitHub Actions deployment workflow includes **automatic rollback** on smoke test failure:
- If smoke tests fail during deployment, the workflow automatically rolls back to the previous revision
- Manual rollback is available through this runbook for production incidents

### Rollback Strategies

1. **Automatic Rollback** - Triggered by failed smoke tests in CI/CD
2. **Traffic Split Rollback** - Route traffic to previous revision gradually
3. **Immediate Rollback** - Switch 100% traffic to previous revision (fastest)
4. **Full Rollback** - Redeploy from main branch via GitHub Actions

## Prerequisites

- `gcloud` CLI installed and authenticated
- Appropriate IAM permissions (`roles/run.admin`)
- GCP project ID and Cloud Run service name

## Quick Start

### Immediate Rollback (Fastest)

```bash
# Set variables
PROJECT=project-08401bb0-e467-491a-ac0
SERVICE=template-project
REGION=us-central1

# Get previous revision
PREVIOUS_REVISION=$(gcloud run revisions list \
  --service=$SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --format='value(name)' \
  --sort-by='~creation-timestamp' \
  --limit=2 | tail -n1)

echo "Previous revision: $PREVIOUS_REVISION"

# Roll back (100% traffic to previous revision)
gcloud run services update-traffic $SERVICE \
  --to-revisions=$PREVIOUS_REVISION=100 \
  --region=$REGION \
  --project=$PROJECT

echo "✓ Rollback complete. Service now using: $PREVIOUS_REVISION"

# Verify
curl https://template-project-w5qrllc24a-uc.a.run.app/health
```

## Detailed Rollback Procedures

### Procedure 1: Immediate Rollback to Previous Revision

Use this when you need the fastest possible rollback.

**Estimated time:** 2-3 minutes

```bash
#!/bin/bash
set -e

# Configuration
PROJECT="project-08401bb0-e467-491a-ac0"
SERVICE="template-project"
REGION="us-central1"
SERVICE_URL="https://template-project-w5qrllc24a-uc.a.run.app"

echo "=== Immediate Rollback Procedure ==="
echo "Service: $SERVICE"
echo "Region: $REGION"
echo "Project: $PROJECT"
echo ""

# Step 1: List recent revisions
echo "Step 1: Listing recent revisions..."
gcloud run revisions list \
  --service=$SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --format='table(name,active,creation-timestamp,status)' \
  --sort-by='~creation-timestamp' \
  --limit=5

# Step 2: Identify previous revision
echo ""
echo "Step 2: Identifying previous (non-active) revision..."
CURRENT_REVISION=$(gcloud run services describe $SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --format='value(status.latestRevisionName)')

PREVIOUS_REVISION=$(gcloud run revisions list \
  --service=$SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --filter="name != $CURRENT_REVISION" \
  --format='value(name)' \
  --sort-by='~creation-timestamp' \
  --limit=1)

echo "Current (failing) revision: $CURRENT_REVISION"
echo "Previous (stable) revision: $PREVIOUS_REVISION"

if [ -z "$PREVIOUS_REVISION" ]; then
  echo "ERROR: No previous revision found!"
  exit 1
fi

# Step 3: Perform rollback
echo ""
echo "Step 3: Rolling back to previous revision..."
gcloud run services update-traffic $SERVICE \
  --to-revisions=$PREVIOUS_REVISION=100 \
  --region=$REGION \
  --project=$PROJECT

echo "✓ Traffic switched to: $PREVIOUS_REVISION"

# Step 4: Verify rollback
echo ""
echo "Step 4: Verifying rollback..."
sleep 5

# Health check
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$SERVICE_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo "✓ Health check: PASSED"
else
  echo "✗ Health check: FAILED (HTTP $HEALTH_CODE)"
  exit 1
fi

# Authentication flow test
echo ""
echo "Testing authentication flow..."
TIMESTAMP=$(date +%s%N)
TEST_EMAIL="rollback-verify-${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123456"

REG_RESPONSE=$(curl -s -X POST \
  "$SERVICE_URL/v1/registration" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

if echo "$REG_RESPONSE" | grep -q "error\|Error"; then
  echo "✗ Registration test: FAILED"
  echo "Response: $REG_RESPONSE"
  exit 1
else
  echo "✓ Registration test: PASSED"
fi

echo ""
echo "=== Rollback Complete ==="
echo "Service $SERVICE successfully rolled back to: $PREVIOUS_REVISION"
echo "Service is healthy and responding normally"
echo ""
echo "Next steps:"
echo "1. Monitor service metrics and logs"
echo "2. Investigate root cause of previous deployment failure"
echo "3. Fix and re-deploy"
```

**Save as:** `scripts/immediate-rollback.sh`  
**Run with:** `chmod +x scripts/immediate-rollback.sh && ./scripts/immediate-rollback.sh`

### Procedure 2: Gradual Traffic Shift (Canary Rollback)

Use this for a safer rollback that shifts traffic gradually to verify the previous revision.

**Estimated time:** 5-10 minutes

```bash
#!/bin/bash
set -e

PROJECT="project-08401bb0-e467-491a-ac0"
SERVICE="template-project"
REGION="us-central1"

echo "=== Canary Rollback Procedure ==="

# Get revisions
CURRENT_REVISION=$(gcloud run services describe $SERVICE \
  --region=$REGION --project=$PROJECT \
  --format='value(status.latestRevisionName)')

PREVIOUS_REVISION=$(gcloud run revisions list \
  --service=$SERVICE --region=$REGION --project=$PROJECT \
  --filter="name != $CURRENT_REVISION" \
  --format='value(name)' \
  --sort-by='~creation-timestamp' --limit=1)

echo "Current revision: $CURRENT_REVISION"
echo "Previous revision: $PREVIOUS_REVISION"

# Step 1: 25% traffic to previous
echo ""
echo "Step 1: Shifting 25% traffic to previous revision..."
gcloud run services update-traffic $SERVICE \
  --to-revisions=$CURRENT_REVISION=75,$PREVIOUS_REVISION=25 \
  --region=$REGION --project=$PROJECT
sleep 30
echo "✓ 25% traffic shifted"

# Step 2: Monitor for errors (in real scenario, check metrics)
echo ""
echo "Step 2: Monitoring for errors (30 seconds)..."
sleep 30
echo "✓ No errors detected"

# Step 3: 50% traffic
echo ""
echo "Step 3: Shifting 50% traffic to previous revision..."
gcloud run services update-traffic $SERVICE \
  --to-revisions=$CURRENT_REVISION=50,$PREVIOUS_REVISION=50 \
  --region=$REGION --project=$PROJECT
sleep 30
echo "✓ 50% traffic shifted"

# Step 4: Monitor
echo ""
echo "Step 4: Monitoring for errors (30 seconds)..."
sleep 30
echo "✓ No errors detected"

# Step 5: 100% traffic
echo ""
echo "Step 5: Shifting 100% traffic to previous revision..."
gcloud run services update-traffic $SERVICE \
  --to-revisions=$PREVIOUS_REVISION=100 \
  --region=$REGION --project=$PROJECT
echo "✓ 100% traffic shifted to previous revision"

echo ""
echo "=== Canary Rollback Complete ==="
```

### Procedure 3: Full Rollback via GitHub Actions

Use this to revert all code changes and redeploy from main branch.

**Steps:**

1. Verify the issue is not environment-related
2. Go to GitHub: **Actions → Deploy to Cloud Run**
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**
6. Monitor execution

This will:
- Re-run quality gates
- Rebuild from the same code
- Deploy to Cloud Run
- Run smoke tests
- Auto-rollback if tests fail

## Decision Tree

Use this flowchart to determine which procedure to use:

```
Is service completely down?
├─ YES → Use Procedure 1 (Immediate Rollback)
└─ NO → Continue

Is error in new code?
├─ YES → Use Procedure 1 (Immediate Rollback)
└─ NO → Continue

Is error environment-related?
├─ YES → Use Procedure 1 then investigate env
└─ NO → Continue

Do you need to verify previous revision first?
├─ YES → Use Procedure 2 (Canary Rollback)
└─ NO → Use Procedure 1 (Immediate Rollback)

Need to redeploy from source?
└─ Use Procedure 3 (Full Rollback via GitHub Actions)
```

## Rollback Verification Checklist

After rollback, verify these points:

### Immediate Checks (First 2 minutes)

- [ ] Service URL returns 200 on `/health`
- [ ] OpenAPI docs endpoint responds (`/docs`)
- [ ] Metrics endpoint working (`/metrics`)
- [ ] No 5xx errors in logs

```bash
# Check logs for errors
gcloud run logs read template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --limit=50 | grep -i error
```

### Functional Checks (First 5 minutes)

- [ ] Registration endpoint working (POST /v1/registration)
- [ ] Login endpoint working (POST /v1/login)
- [ ] User creation working (POST /v1/users)
- [ ] User retrieval working (GET /v1/users)

```bash
# Full flow test
./scripts/test-api-flow.sh
```

### Monitoring Checks (First 30 minutes)

- [ ] Error rate < 1%
- [ ] P95 latency < 2000ms
- [ ] No spike in error logs
- [ ] Database connectivity stable

```bash
# View current revision
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --format='value(status.latestRevisionName)'

# View traffic distribution
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --format='value(status.traffic[].revisionName,status.traffic[].percent)'
```

## Post-Rollback Investigation

### 1. Identify Root Cause

```bash
# View current and previous revisions' logs
gcloud run logs read template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --limit=200 > /tmp/logs.txt

# Search for errors
grep -i error /tmp/logs.txt | head -20
```

### 2. Common Issues

| Issue | Cause | Resolution |
|-------|-------|-----------|
| "Cannot connect to database" | Cloud SQL unreachable | Verify DB IP, network rules, credentials |
| "Invalid token" | JWT_SECRET mismatch | Verify secret in Secret Manager |
| "Permission denied" | IAM role missing | Check service account permissions |
| "Out of memory" | Memory limit exceeded | Increase Cloud Run memory allocation |
| "Timeout" | Slow query or external API | Optimize code, increase timeout |

### 3. Create Issue Report

```markdown
## Incident Report

**Date:** YYYY-MM-DD HH:MM UTC
**Service:** template-project
**Affected Revision:** [REVISION_NAME]
**Rollback Revision:** [PREVIOUS_REVISION]
**Root Cause:** [DESCRIBE]
**Fix:** [DESCRIBE]
**Status:** Resolved ✓

### Timeline
- HH:MM UTC - Deployment initiated
- HH:MM UTC - Issue detected
- HH:MM UTC - Rollback started
- HH:MM UTC - Rollback complete
```

## Emergency Contact

For critical production issues:

1. **Immediate Action:** Use Procedure 1 (Immediate Rollback)
2. **Notification:** Alert team on #incidents channel
3. **Investigation:** Follow Post-Rollback Investigation
4. **Communication:** Update status page

## Prevention

To prevent future rollbacks:

1. **Comprehensive Tests** - Ensure all endpoints tested before deployment
2. **Staged Rollout** - Use canary deployments for large changes
3. **Monitoring** - Set up alerting on error rate and latency
4. **Load Testing** - Test at expected traffic levels before production
5. **Database Validation** - Verify migrations and schema changes

## Rollback Success Criteria

Rollback is successful when:

- ✓ Service is responding to requests
- ✓ All endpoints return expected status codes
- ✓ Authentication flow works end-to-end
- ✓ Error rate < 1% for 5 minutes
- ✓ No new errors in logs
- ✓ Traffic is 100% on stable revision

## Appendix: Useful Commands

```bash
# List all revisions with details
gcloud run revisions list \
  --service=template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --format='table(name,active,creation-timestamp,status)'

# Get current traffic distribution
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --format='value(status.traffic[].revisionName,status.traffic[].percent)'

# View service details
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --format=yaml

# Stream logs in real-time
gcloud run logs read template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --follow \
  --limit=50

# Test service health
curl https://template-project-w5qrllc24a-uc.a.run.app/health -v
```
