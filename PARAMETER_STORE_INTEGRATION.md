# AWS Parameter Store Integration - Implementation Summary

## Overview

The GitHub Actions CI/CD pipeline now leverages AWS Systems Manager Parameter Store for secure, centralized configuration management while keeping GitHub Secrets minimal and credentials-only.

**Status**: ✅ Complete - Documentation updated and integrated

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions Workflow                     │
│                                                               │
│  1. Receives AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY      │
│     from GitHub Secrets (credentials only)                   │
│  2. Calls: perl scripts/deploy.pl                            │
│     --param-path /sites/bryanchasko.com                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              deploy.pl Script (Configuration Logic)           │
│                                                               │
│  1. Receives credentials from GitHub Actions                 │
│  2. Reads from AWS Parameter Store:                          │
│     • /sites/bryanchasko.com/s3_bucket                       │
│     • /sites/bryanchasko.com/domain                          │
│     • /sites/bryanchasko.com/cloudfront_distribution_id      │
│     • /sites/bryanchasko.com/aws_region                      │
│  3. Executes:                                                │
│     • Hugo build                                             │
│     • WebGL tests (gate)                                     │
│     • S3 sync                                                │
│     • CloudFront invalidation                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           AWS Systems Manager Parameter Store                 │
│     (Secure, Audit Trail, Zero-Cost Configuration)           │
│                                                               │
│  • /sites/bryanchasko.com/s3_bucket                          │
│  • /sites/bryanchasko.com/domain                             │
│  • /sites/bryanchasko.com/cloudfront_distribution_id         │
│  • /sites/bryanchasko.com/aws_region                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Breakdown

### GitHub Secrets (Credentials Only)
Only 2 secrets stored in GitHub:
- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key

**Why minimal?**
- Credentials rotate frequently (every 90 days recommended)
- Configuration values (bucket names, distribution IDs) rarely change
- No hardcoding of infrastructure details in repository
- Separation of concerns: credentials vs. configuration

### AWS Parameter Store (Configuration)
4 parameters stored in AWS SSM Parameter Store under `/sites/bryanchasko.com/`:

| Parameter | Example Value | Purpose |
|-----------|-------|---------|
| `s3_bucket` | `bryanchasko.com` | Deploy target S3 bucket |
| `domain` | `bryanchasko.com` | Site domain for CloudFront lookup |
| `cloudfront_distribution_id` | `[your-distribution-id]` | CloudFront distribution for invalidation (NOT in public repo) |
| `aws_region` | `us-west-2` | AWS region for resources |

**Why Parameter Store?**
- ✅ **Free**: Standard parameters cost nothing
- ✅ **Secure**: IAM-controlled access, no secrets in code
- ✅ **Auditable**: Change history tracked automatically
- ✅ **Flexible**: Easy to update without changing code
- ✅ **Centralized**: Single source of truth for configuration

---

## Configuration Priority

The `deploy.pl` script reads configuration in this order (first match wins):

1. **Command-line arguments** (highest priority)
   - `--bucket bryanchasko.com`
   - `--domain bryanchasko.com`
   - `--distribution-id [your-actual-distribution-id]`

2. **Environment variables**
   - `SITE_BUCKET=bryanchasko.com`
   - `SITE_DOMAIN=bryanchasko.com`
   - `SITE_DISTRIBUTION_ID=[your-actual-distribution-id]` (for local testing only, use Parameter Store in production)

3. **External config file** (`~/.bcc-site/config.json`)
   - Not in repository (gitignored)
   - Useful for local development

4. **AWS Parameter Store** (recommended)
   - `--param-path /sites/bryanchasko.com`
   - Used by GitHub Actions workflows

5. **Hugo config inference** (fallback)
   - Domain extracted from `hugo.toml` `baseURL`
   - Last resort if no other config found

---

## Workflow Integration

### WebGL Tests Workflow (`.github/workflows/webgl-tests.yml`)

```
GitHub Secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
↓
Tests run against baseline bucket: bryanchasko-com-webgl-baselines
↓
No Parameter Store interaction needed
(Baseline bucket name is hardcoded in Playwright config)
```

### Deploy Workflow (`.github/workflows/deploy.yml`)

```
GitHub Secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
↓
Call: perl scripts/deploy.pl --param-path /sites/bryanchasko.com
↓
deploy.pl reads configuration from Parameter Store
↓
Execute: Hugo build → Tests (gate) → S3 sync → CloudFront invalidate
```

---

## Setup Instructions

### One-Time Setup (10 Steps)

See [GITHUB_ACTIONS_CHECKLIST.md](GITHUB_ACTIONS_CHECKLIST.md) for complete step-by-step guide:

1. **IAM User Creation**
   ```bash
   aws iam create-user --user-name github-actions-webgl-tests
   ```

2. **Access Keys**
   ```bash
   aws iam create-access-key --user-name github-actions-webgl-tests
   ```

3. **S3 Baseline Bucket**
   ```bash
   aws s3api create-bucket --bucket bryanchasko-com-webgl-baselines \
     --region us-west-2 --create-bucket-configuration LocationConstraint=us-west-2
   ```

4. **AWS Parameter Store** (Key Step!)
   ```bash
   aws ssm put-parameter --name /sites/bryanchasko.com/s3_bucket \
     --type String --value bryanchasko.com
   aws ssm put-parameter --name /sites/bryanchasko.com/domain \
     --type String --value bryanchasko.com
   aws ssm put-parameter --name /sites/bryanchasko.com/cloudfront_distribution_id \
     --type String --value [your-actual-distribution-id]
   aws ssm put-parameter --name /sites/bryanchasko.com/aws_region \
     --type String --value us-west-2
   ```
   ⚠️ **Important**: Replace `[your-actual-distribution-id]` with your actual CloudFront distribution ID. This value should ONLY be stored in Parameter Store, never in code or public documentation.

5. **GitHub Secrets** (Only Credentials)
   - Add `AWS_ACCESS_KEY_ID`
   - Add `AWS_SECRET_ACCESS_KEY`

6-10. **Workflow Configuration & Testing** (see checklist)

### Ongoing Maintenance

- **Every 90 days**: Rotate AWS access keys
  ```bash
  aws iam create-access-key --user-name github-actions-webgl-tests
  # Update GitHub Secrets with new key
  # Delete old key
  ```

- **Quarterly**: Update Parameter Store values if needed
  ```bash
  aws ssm put-parameter --name /sites/bryanchasko.com/[param] \
    --type String --value [new-value] --overwrite
  ```

- **Monthly**: Review workflow logs for failures
- **Quarterly**: Audit IAM permissions

---

## Key Benefits

### Security
- ✅ Credentials stored only in GitHub Secrets
- ✅ Configuration stored only in AWS Parameter Store (not in code)
- ✅ No hardcoded bucket names, distribution IDs, or regions
- ✅ IAM access control on Parameter Store reads
- ✅ Change audit trail in SSM

### Operations
- ✅ **Easy Updates**: Change bucket/domain without touching code
- ✅ **Free**: Parameter Store costs nothing for standard parameters
- ✅ **Centralized**: Single source of truth for all environments
- ✅ **Scalable**: Same pattern works for multiple sites/domains
- ✅ **Team-Friendly**: Share config across team without sharing secrets

### Compliance
- ✅ **Audit Trail**: All configuration changes logged in SSM
- ✅ **Minimal Secrets**: Only credentials, no sensitive config
- ✅ **Rotation-Ready**: Update credentials without touching config
- ✅ **Principle of Least Privilege**: Deploy script reads only what it needs

---

## Documentation References

### Setup & Implementation
- **Checklist**: [GITHUB_ACTIONS_CHECKLIST.md](GITHUB_ACTIONS_CHECKLIST.md) - Step-by-step setup guide
- **Full Reference**: [CI_CD_SETUP.md](CI_CD_SETUP.md) - Complete workflow documentation
- **Developer Guide**: [.github/copilot-instructions.md](.github/copilot-instructions.md) - Configuration strategy explained

### Related Components
- **Deploy Script**: [scripts/deploy.pl](scripts/deploy.pl) - Reads from Parameter Store
- **Testing Guide**: [TESTING.md](TESTING.md) - WebGL test pipeline
- **WebGL Architecture**: [WEBGL_ARCHITECTURE.md](WEBGL_ARCHITECTURE.md) - Scene integration

---

## Quick Verification

### Check Parameters Exist
```bash
aws ssm get-parameters \
  --names /sites/bryanchasko.com/s3_bucket \
          /sites/bryanchasko.com/domain \
          /sites/bryanchasko.com/cloudfront_distribution_id \
          /sites/bryanchasko.com/aws_region \
  --profile websites-bryanchasko
```

### Check GitHub Secrets
1. Go to: GitHub Repo → Settings → Secrets and variables → Actions
2. Verify:
   - ✅ `AWS_ACCESS_KEY_ID` present
   - ✅ `AWS_SECRET_ACCESS_KEY` present
   - ✅ Only 2 secrets (no bucket names, domains, etc.)

### Test Deploy (Dry Run)
```bash
perl scripts/deploy.pl --dry-run --verbose \
  --param-path /sites/bryanchasko.com \
  --profile websites-bryanchasko
```

Expected output:
```
[ℹ]  cfg: domain=bryanchasko.com bucket=bryanchasko.com
[ℹ]  Looking up CloudFront distribution for domain: bryanchasko.com
[✓]  Matched distribution [your-actual-distribution-id] for bryanchasko.com
```

---

## Troubleshooting

### Parameter Not Found Error
**Solution**: Verify SSM parameters exist
```bash
aws ssm get-parameters --names /sites/bryanchasko.com/* \
  --profile websites-bryanchasko
```

### IAM Permission Denied
**Solution**: Ensure IAM policy includes SSM read permissions:
```json
{
  "Effect": "Allow",
  "Action": ["ssm:GetParameter", "ssm:GetParameters"],
  "Resource": "arn:aws:ssm:us-west-2:*:parameter/sites/bryanchasko.com/*"
}
```

### GitHub Actions Workflow Fails
**Solution**: Check workflow logs for exact error, verify credentials in GitHub Secrets are correct

---

## Implementation Timeline

- **December 2025**: Parameter Store integration designed and documented
- **January 2025**: GITHUB_ACTIONS_CHECKLIST.md created with 10-step setup guide
- **January 2025**: Documentation updated in `.github/copilot-instructions.md`
- **January 2025**: Configuration strategy documented in this file

---

## Questions?

Refer to:
- [GITHUB_ACTIONS_CHECKLIST.md](GITHUB_ACTIONS_CHECKLIST.md) for setup assistance
- [CI_CD_SETUP.md](CI_CD_SETUP.md) for comprehensive reference
- [.github/copilot-instructions.md](.github/copilot-instructions.md) for strategy details
