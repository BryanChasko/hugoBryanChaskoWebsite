# CI/CD Setup & Workflow Documentation

**Status**: ✅ Complete and tested - ready for production

This document provides a complete reference for the GitHub Actions CI/CD pipeline that automates testing and deployment.

---

## Quick Start

**👉 For a step-by-step setup checklist with verification at each step**, see [GITHUB_ACTIONS_CHECKLIST.md](GITHUB_ACTIONS_CHECKLIST.md).

This document is a comprehensive reference; the checklist is designed for hands-on implementation.

### For First-Time Setup

1. **Bootstrap backend resources**
   ```bash
   perl scripts/setup-terraform-backend.pl --profile aerospaceug-admin
   ```
   The script ensures the Terraform state bucket and DynamoDB lock table exist and prints the `github_oidc_role_arn` value for GitHub Actions.

2. **Capture the GitHub Actions OIDC role ARN**
   Run `cd terraform && terraform output github_oidc_role_arn` (or copy from the script output) and copy the returned ARN.

3. **Store GitHub Secrets**
   - Go to repo → Settings → Secrets and variables → Actions
   - Add a new secret:
     - `GITHUB_OIDC_ROLE_ARN` = value from step 2
   - Optionally add `AWS_REGION` = `us-west-2` if you need to override the default region

4. **Test the Setup**:
   ```bash
   # Trigger test workflow manually
   git push origin main
   # Watch: GitHub repo → Actions tab
   ```

---

## Workflow Architecture

### Pipeline Overview

```
GitHub Push to main
        ↓
   .github/workflows/
        ↓
┌───────────────────────────────────┐
│   webgl-tests.yml (Parallel)      │ ← Runs in all PRs + main pushes
│   - Chrome, Firefox, Safari       │
│   - Visual regression tests       │
│   - Performance validation        │
│   - Upload artifacts              │
└───────────────────────────────────┘
        ↓ (on main only)
┌───────────────────────────────────┐
│   deploy.yml (Sequential)         │ ← Auto-triggers on main push
│   1. Hugo build                   │
│   2. Run tests (GATE)             │ ← Blocks if tests fail
│   3. S3 sync                      │
│   4. CloudFront invalidate        │
│   5. Update baselines             │
└───────────────────────────────────┘
        ↓
   Live at bryanchasko.com
```

---

## Workflow Details

### 1. WebGL Tests Workflow

**File**: `.github/workflows/webgl-tests.yml`

**Triggers**:
- Pull request to main branch
- Push to main branch
- Manual dispatch (Actions tab → "Run workflow")

**Matrix Strategy**: Runs in parallel for Chrome, Firefox, Safari

**Key Steps**:
1. **Checkout** with full history (`fetch-depth: 0`)
2. **Setup Node.js 20.x** with npm cache
3. **Install dependencies** via `npm ci` (clean install)
4. **Install Playwright browsers** for all matrix browsers
5. **Configure AWS Credentials** using GitHub Secrets (`GITHUB_OIDC_ROLE_ARN`)
6. **Run Tests**: `npm test`
   - Visual regression (screenshot comparison)
   - Pixel color validation
   - Performance budgets
   - Cross-browser consistency
7. **Upload Artifacts**:
   - Test results (JSON format)
   - HTML Playwright report
   - Screenshots (actual vs. baseline diffs)
   - Performance metrics

**Artifact Retention**: 30 days (GitHub default)

**Test Gate Behavior**:
- ✅ All tests pass → Workflow succeeds
- ❌ Any test fails → Workflow fails
- Prevents broken WebGL from reaching production

**Baseline Management**:
- First run: Creates initial baselines in S3
- PR testing: Compares against S3 baselines
- Main push: Auto-updates baselines (if tests pass)

### 2. Deploy Workflow

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to main branch only
- Manual dispatch (Actions tab → "Run workflow")

**Environment**:
```
NODE_VERSION: "20.x"
HUGO_VERSION: "0.152.2" (Extended)
AWS_REGION: "us-west-2"
```

**Sequential Pipeline** (runs in order):

#### Step 1: Checkout
```bash
actions/checkout@v4
fetch-depth: 0  # Full history for git operations
```

#### Step 2: Setup Hugo
```bash
peaceiris/actions-hugo@v2
hugo-version: 0.152.2
extended: true  # Required for SCSS support
```

#### Step 3: Setup Node.js
```bash
actions/setup-node@v4
node-version: 20.x
cache: npm
```

#### Step 4: Install Dependencies
```bash
npm ci  # Clean install (respects package-lock.json)
```

#### Step 5: Install Playwright Browsers
```bash
npx playwright install --with-deps
```

#### Step 6: Configure AWS Credentials
```bash
aws-actions/configure-aws-credentials@v4
role-to-assume: ${{ secrets.GITHUB_OIDC_ROLE_ARN }}
aws-region: us-west-2
```

#### Step 7: Run WebGL Tests (TEST GATE) 🚧
```bash
npm test
```
**Critical**: Tests must pass or deployment is BLOCKED
- Exit code 0 → Continue to build
- Exit code 1 → Stop pipeline, fail workflow

#### Step 8: Build Hugo Site
```bash
hugo --minify
Output: public/
```

#### Step 9: Deploy to S3
```bash
aws s3 sync public/ s3://bryanchasko.com \
  --delete \
  --cache-control "public, max-age=3600" \
  --exclude ".git/*" \
  --exclude "*.md"
```

**Cache Headers**: 
- HTML files: `max-age=3600` (1 hour)
- Static assets: Considered for cache busting based on Hugo fingerprinting

#### Step 10: Wait for S3 Propagation
```bash
sleep 5
```
Allows S3 eventual consistency to settle before invalidating CloudFront

#### Step 11: Invalidate CloudFront
```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items[?contains(@, 'bryanchasko.com')]].Id" \
  --output text
```

**Auto-Discovery Logic**:
1. Query all CloudFront distributions
2. Filter by domain alias matching 'bryanchasko.com'
3. Extract distribution ID
4. Create invalidation for '/*' (all paths)
5. Falls back gracefully if not found

#### Step 12: Update Test Baselines (Main Branch Only)
```bash
npm run test:update-baselines
```
- Only runs on main branch push (not PRs)
- Uploads new baseline screenshots to S3
- Ensures baselines stay in sync with deployed code
- Prevents baseline drift

---

## GitHub Secrets Management

### Required Secrets

| Secret Name | Value | Source | Scope |
|-------------|-------|--------|-------|
| `GITHUB_OIDC_ROLE_ARN` | ARN returned by `terraform output github_oidc_role_arn` or `setup-terraform-backend.pl` | Terraform outputs | `.github/workflows/webgl-tests.yml`, `.github/workflows/deploy.yml` |
| `AWS_REGION` | `us-west-2` (override if needed) | Documented default | Optional (passed to configure-aws-credentials) |

### How to Add Secrets

**Via GitHub UI**:
1. Go to repo → Settings
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `GITHUB_OIDC_ROLE_ARN`
5. Value: (paste the ARN from Terraform output)
6. Click "Add secret"
7. (Optional) Add `AWS_REGION` if you override the default

**Verification**:
- Secrets are masked in workflow logs (never printed)
- Secrets are available only to workflows (not visible to users)
- The OIDC role can be rotated by replacing the role ARN in GitHub Secrets; no long-lived access keys exist anymore

---

## IAM User Permissions

### Minimal Policy (Recommended)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BaselineBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::bryanchasko-com-webgl-baselines",
        "arn:aws:s3:::bryanchasko-com-webgl-baselines/*"
      ]
    },
    {
      "Sid": "S3DeployBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::bryanchasko.com",
        "arn:aws:s3:::bryanchasko.com/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
}
```

### Permissions Breakdown

| Action | Purpose | Scope |
|--------|---------|-------|
| `s3:GetObject` | Read baseline images | Baseline bucket |
| `s3:PutObject` | Write baseline updates | Baseline bucket |
| `s3:ListBucket` | List bucket contents | Baseline bucket |
| `s3:*` | Full S3 access | Deploy bucket (bryanchasko.com) |
| `cloudfront:CreateInvalidation` | Invalidate cache | All CloudFront distributions |
| `cloudfront:ListDistributions` | Find distribution by alias | All distributions |

---

## S3 Baseline Bucket Configuration

### One-Time Setup

```bash
# Create bucket
aws s3api create-bucket \
  --bucket bryanchasko-com-webgl-baselines \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket bryanchasko-com-webgl-baselines \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket bryanchasko-com-webgl-baselines \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set lifecycle policy (180-day retention)
aws s3api put-bucket-lifecycle-configuration \
  --bucket bryanchasko-com-webgl-baselines \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 180
      },
      "Expiration": {
        "Days": 180
      }
    }]
  }'
```

### Baseline Naming Convention

```
tests/.baselines/
  ├── orbit-scene-chromium-1920-1080.png
  ├── orbit-scene-firefox-1920-1080.png
  ├── orbit-scene-webkit-1920-1080.png
  ├── constellation-chromium-1920-1080.png
  └── ...
```

Stored in S3 under: `s3://bryanchasko-com-webgl-baselines/`

---

## Troubleshooting

### Deploy Workflow Fails at Test Gate

**Symptom**: 
```
Step 7: Run WebGL tests (test gate)
❌ npm test exited with code 1
```

**Diagnosis**:
1. Check GitHub Actions log for test failure details
2. Download artifacts (Test results, HTML report, screenshots)
3. Review screenshot diffs in artifact report
4. Run tests locally: `npm test`

**Fix**:
```bash
# Fix code locally
npm test -- tests/webgl/failing-test.spec.js
# After fixing, commit and push
git push origin main  # Re-triggers workflow
```

### S3 Sync Fails with Permission Error

**Symptom**:
```
Upload failed: public/index.html to s3://bryanchasko.com/index.html
An error occurred (AccessDenied) when calling the PutObject operation: Access Denied
```

**Diagnosis**:
1. Check IAM user has S3 permissions for `bryanchasko.com` bucket
2. Verify AWS credentials in GitHub Secrets are correct
3. Check bucket policy allows the IAM user

**Fix**:
```bash
# Verify permissions
aws iam get-user-policy --user-name github-actions-webgl-tests \
  --policy-name baseline-bucket-access --profile aerospaceug-admin

# Check bucket policy
aws s3api get-bucket-policy --bucket bryanchasko.com
```

### CloudFront Invalidation Not Triggering

**Symptom**:
```
Warning: Could not find CloudFront distribution
```

**Diagnosis**:
1. CloudFront distribution might not have domain alias
2. IAM user lacks CloudFront permissions
3. Distribution ID lookup failing

**Fix**:
```bash
# Check distribution aliases
aws cloudfront list-distributions --profile aerospaceug-admin | \
  jq '.DistributionList.Items[] | {Id, Aliases}'

# Verify CloudFront permission in policy
aws iam get-user-policy --user-name github-actions-webgl-tests \
  --policy-name baseline-bucket-access --profile aerospaceug-admin
```

### Baselines Not Updating After Main Merge

**Symptom**:
```
Tests pass on PR, but baselines don't update after merge
```

**Diagnosis**:
1. Baselines only update on main branch push (not PRs)
2. Tests might have failed silently
3. S3 permissions might be insufficient

**Fix**:
```bash
# Manual baseline update
npm run test:update-baselines

# Verify baseline sync
aws s3 ls s3://bryanchasko-com-webgl-baselines/
```

### Tests Pass Locally but Fail in CI

**Symptom**:
```
Local: npm test ✅
CI: npm test ❌
```

**Diagnosis**:
1. GitHub runners are slower (different GPU, shared hardware)
2. Performance budget might be too strict for CI
3. Antialiasing variations in headless browsers

**Fix**:
```javascript
// In tests/webgl/performance.spec.js
const budget = process.env.CI ? 200 : 150;  // Relaxed for CI
```

---

## Performance Considerations

### CI Runner Specs
- **OS**: Ubuntu 22.04 (ubuntu-latest)
- **CPU**: Shared 2-core
- **Memory**: 7GB available
- **GPU**: Software-based rendering (no dedicated GPU)

### Performance Tolerance
- **Orbit Init**: <150ms (local), <250ms (CI)
- **FPS**: >50fps (local), >40fps (CI)
- **Memory**: <200MB (both)

### Optimization Tips
1. Use `process.env.CI` to detect CI environment
2. Relax performance budgets for CI
3. Keep Playwright test timeout high (30s+)
4. Cache node_modules and Playwright browsers

---

## Monitoring & Alerts

### Where to Check Workflow Status

- **GitHub UI**: repo → Actions tab → select workflow
- **Direct link**: https://github.com/bryanchasko/bryan-chasko-com/actions
- **Status badge**: Add to README:
  ```markdown
  ![Build & Deploy](https://github.com/bryanchasko/bryan-chasko-com/workflows/Build%20&%20Deploy/badge.svg)
  ```

### Manual Workflow Dispatch

Trigger workflows manually from GitHub UI:
1. Go to repo → Actions
2. Select workflow (e.g., "Build & Deploy")
3. Click "Run workflow" button
4. Select branch (main)
5. Click "Run workflow"

---

## Best Practices

✅ **Do**:
- Always run tests locally before pushing
- Check workflow logs for debugging
- Use meaningful commit messages
- Rotate AWS credentials regularly (every 90 days)
- Monitor CloudFront invalidation completion (1-2 min)

❌ **Don't**:
- Commit AWS credentials (use secrets only)
- Hardcode bucket names (use environment variables)
- Skip tests with `--skip-tests` except emergencies
- Manually edit baselines (let CI update them)
- Use same IAM user across multiple projects

---

## Related Documentation

- [README.md](README.md) - Project overview and setup
- [TESTING.md](TESTING.md) - WebGL testing infrastructure
- [WEBGL_ARCHITECTURE.md](WEBGL_ARCHITECTURE.md) - WebGL scene integration
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Full CI/CD configuration
- [scripts/deploy.pl](scripts/deploy.pl) - Local deploy script

---

**Last Updated**: December 2025
**Status**: ✅ Production-ready
