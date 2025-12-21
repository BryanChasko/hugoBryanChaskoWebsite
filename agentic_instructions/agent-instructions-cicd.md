# Agent Instructions: CI/CD (Fragment)

## Purpose
Guidance for AI agents on CI/CD, GitHub Actions, and deployment automation for this project.

---

## Key Workflows
- `.github/workflows/webgl-tests.yml` (WebGL visual regression & performance tests)
- `.github/workflows/deploy.yml` (Build & deploy to S3/CloudFront)

## Pipeline Order
1. Checkout code
2. Security gate: scan for secrets
3. Install Node.js, dependencies, Playwright browsers
4. Configure AWS credentials (from GitHub Secrets)
5. Run WebGL tests (test gate)
6. Hugo build
7. S3 sync
8. CloudFront invalidation
9. Baseline update (main branch only)

## Test Gate
- All WebGL changes must pass `npm test` before deploy
- Test failures block deployment (exit code 1)
- Use `--skip-tests` only for emergency hotfixes

## CI/CD Failure Diagnosis & Solutions

### Root Cause: WebGL Tests Failing in GitHub Actions

Your CI/CD pipeline blocks deployment when tests fail. The two failing workflows are:
- `.github/workflows/webgl-tests.yml` (runs on PR/main)
- `.github/workflows/deploy.yml` (runs on main, includes test gate)

Failures are due to:
- Firefox headless in CI not supporting WebGL (test skipped)
- Performance tests skipped in CI (no GPU)
- Orbit scene visual regression test failing (canvas rendering differences, missing S3 baselines, or AWS credential issues)

### Option 1: Force Deploy (Emergency Bypass)
Use only for critical hotfixes:
```bash
perl scripts/deploy.pl --skip-tests --profile websites-bryanchasko --verbose
```

### Option 2: Fix Tests & Re-enable CI/CD (Recommended)
1. Verify AWS credentials in GitHub Secrets
2. Ensure S3 baseline bucket exists (`bryanchasko-com-webgl-baselines`)
3. Run tests locally to generate/upload baselines
4. Push to main to trigger CI/CD

### Option 3: Disable Failing Tests Temporarily
Skip problematic tests in CI:
```js
test.skip(!!process.env.CI, 'Skipping visual regression in CI until baselines are set up');
```

### Quick Reference: Deploy Commands
| Scenario | Command |
|----------|---------|
| Emergency deploy (skip tests) | perl scripts/deploy.pl --skip-tests --profile websites-bryanchasko |
| Normal deploy (tests required) | perl scripts/deploy.pl --profile websites-bryanchasko |
| Dry-run (preview changes) | perl scripts/deploy.pl --dry-run --profile websites-bryanchasko |
| Invalidate CloudFront only | perl scripts/deploy.pl --invalidate-only --profile websites-bryanchasko |
| Run tests locally | npm test |
| Update baselines | npm run test:update-baselines |

### Recommended Next Steps
1. Immediate: Use --skip-tests to deploy if urgent
2. Short-term: Verify AWS credentials and S3 baseline bucket
3. Long-term: Run tests locally, commit baselines, re-enable CI/CD

---

## Configuration
- Prefer AWS Parameter Store for config (see copilot-instructions.md)
- GitHub Secrets for AWS credentials only (never bucket names or IDs)

## Required Secrets
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## References
- [copilot-instructions.md](../.github/copilot-instructions.md) (for config and security)
- [GITHUB_ACTIONS_CHECKLIST.md]
- [CI_CD_SETUP.md]
- [DEPLOYMENT.md]

---

**For project setup or CSS, see the corresponding agent instruction fragment.**
