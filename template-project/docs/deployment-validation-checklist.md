# Deployment Validation Checklist

Use this checklist after opening a PR or merging to main, to verify the full deployment flow is healthy.

## Scope

This checklist validates:
- PR knowledge/test automation flow
- PR test report flow
- Deploy to Cloud Run flow
- Post-deploy smoke gates

## 1) PR flow validation

1. Open GitHub repository Actions tab.
2. Verify `PR Knowledge Agent` runs on your PR.
3. Confirm expected behavior:
   - If PR touches `template-project/src/**`, `template-project/prisma/**`, or `template-project/knowledge/**`, the agent should run.
   - Agent should update knowledge and regenerate tests when impact exists.
4. Check the PR comment from the agent for summary and skip mode (if skipped).

Pass criteria:
- Agent run completes successfully or provides an intentional skip reason.
- If changes are generated, a bot commit appears on the PR branch.

## 2) PR test report validation

1. After a bot commit on the PR branch, verify `PR Agent Test Report` workflow runs.
2. Open run summary and confirm:
   - API tests status
   - UI tests status
   - Target base URL line appears.
3. Open PR conversation and confirm sticky `PR Agent Test Report` comment updated.
4. Verify artifacts exist in the run:
   - `playwright-report-api`
   - `playwright-report`

Pass criteria:
- Workflow status is green.
- PR comment is updated and includes run URL.

## 3) Deploy workflow validation (main branch)

1. Merge PR to main (or trigger manual run).
2. Open `Deploy to Cloud Run` workflow run.
3. Validate each job:
   - `Quality Gates & Tests`
   - `Build & Push Container`
   - `Deploy to Cloud Run`
   - `Smoke Gates`
   - `Deployment Summary`
4. Confirm auth step uses Workload Identity successfully (no key JSON).

Pass criteria:
- All jobs succeed.
- Deployment summary shows successful status.

## 4) Cloud Run service validation

Run these checks locally (PowerShell/Bash):

```bash
gcloud run services describe template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0

curl https://template-project-w5qrllc24a-uc.a.run.app/health
curl -i https://template-project-w5qrllc24a-uc.a.run.app/ready
curl https://template-project-w5qrllc24a-uc.a.run.app/docs
```

Pass criteria:
- Service exists and latest revision is healthy.
- `/health` returns 200.
- `/ready` returns 200 when DB reachable (503 if not ready).
- `/docs` returns 200.

## 5) Real API regression check

```bash
cd template-project
export BASE_API_URL="https://template-project-w5qrllc24a-uc.a.run.app"
export BASE_URL="https://template-project-w5qrllc24a-uc.a.run.app"
npm run test:api
```

PowerShell variant:

```powershell
cd template-project
$env:BASE_API_URL="https://template-project-w5qrllc24a-uc.a.run.app"
$env:BASE_URL="https://template-project-w5qrllc24a-uc.a.run.app"
npm run test:api
```

Pass criteria:
- API suite passes or returns expected controlled `503 service_unavailable` paths when DB is unavailable.

## 6) If deployment fails

1. Open failed job logs in Actions.
2. Check Cloud Run logs:

```bash
gcloud run logs read template-project \
  --region=us-central1 \
  --project=project-08401bb0-e467-491a-ac0 \
  --limit=200
```

3. If smoke gates fail, review the gate summary in the smoke-gates job.
4. If rollback runs, confirm traffic moved to previous revision.

## 7) Final release decision

Ship only if all are true:
- PR Knowledge Agent behavior is expected.
- PR Agent Test Report is green.
- Deploy workflow is green.
- Smoke gates are green.
- Health, readiness, docs checks are good.
