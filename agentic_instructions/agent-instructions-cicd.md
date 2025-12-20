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
