# GitHub Actions Setup Checklist

Use this checklist to verify your GitHub Actions CI/CD setup is complete and working.

---

## Prerequisites ✅

- [ ] GitHub repository created (public/private)
- [ ] Repository has `.github/workflows/` directory
- [ ] `.github/workflows/deploy.yml` exists
- [ ] `.github/workflows/webgl-tests.yml` exists
- [ ] AWS account with permissions to:
  - [ ] Create IAM users
  - [ ] Create S3 buckets
  - [ ] Manage CloudFront distributions
  - [ ] Manage Route 53 DNS records

---

## Step 1: IAM User Setup (One-Time)

### Create GitHub Actions User
```bash
aws iam create-user --user-name github-actions-webgl-tests \
  --profile websites-bryanchasko
```
- [ ] IAM user created
- [ ] User name: `github-actions-webgl-tests`
- [ ] Region: `us-west-2` (recommended)

### Create Access Keys
```bash
aws iam create-access-key --user-name github-actions-webgl-tests \
  --profile websites-bryanchasko
```
- [ ] Access key created
- [ ] Save `AccessKeyId` (use for `AWS_ACCESS_KEY_ID`)
- [ ] Save `SecretAccessKey` (use for `AWS_SECRET_ACCESS_KEY`)
- [ ] Store in secure location (e.g., password manager)

---

## Step 2: IAM Policy Attachment

### Minimal Required Policy

Attach this policy to the `github-actions-webgl-tests` user:

```bash
aws iam put-user-policy \
  --user-name github-actions-webgl-tests \
  --policy-name github-actions-webgl-policy \
  --policy-document '{
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
          "s3:*"
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
  }' \
  --profile websites-bryanchasko
```

- [ ] Policy attached to IAM user
- [ ] All three sections included:
  - [ ] S3 baseline bucket access
  - [ ] S3 deploy bucket access
  - [ ] CloudFront permissions

### Verify Policy
```bash
aws iam get-user-policy \
  --user-name github-actions-webgl-tests \
  --policy-name github-actions-webgl-policy \
  --profile websites-bryanchasko
```

- [ ] Policy exists and is readable
- [ ] All sections are present

---

## Step 3: S3 Baseline Bucket Setup (One-Time)

### Create Baseline Bucket
```bash
aws s3api create-bucket \
  --bucket bryanchasko-com-webgl-baselines \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2 \
  --profile websites-bryanchasko
```

- [ ] Bucket created
- [ ] Bucket name: `bryanchasko-com-webgl-baselines`
- [ ] Region: `us-west-2`

### Enable Versioning
```bash
aws s3api put-bucket-versioning \
  --bucket bryanchasko-com-webgl-baselines \
  --versioning-configuration Status=Enabled \
  --profile websites-bryanchasko
```

- [ ] Versioning enabled

### Enable Encryption
```bash
aws s3api put-bucket-encryption \
  --bucket bryanchasko-com-webgl-baselines \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --profile websites-bryanchasko
```

- [ ] Encryption enabled (AES256)

### Set Lifecycle Policy (Optional but Recommended)
```bash
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
  }' \
  --profile websites-bryanchasko
```

- [ ] Lifecycle policy configured (180-day retention)

---

## Step 4: AWS Parameter Store Setup (One-Time)

### Store Configuration in SSM Parameter Store

Instead of hardcoding values, use AWS Parameter Store for centralized configuration management:

```bash
# Create parameters (replace with your actual values)
aws ssm put-parameter \
  --name /sites/bryanchasko.com/s3_bucket \
  --type String \
  --value bryanchasko.com \
  --profile websites-bryanchasko

aws ssm put-parameter \
  --name /sites/bryanchasko.com/domain \
  --type String \
  --value bryanchasko.com \
  --profile websites-bryanchasko

aws ssm put-parameter \
  --name /sites/bryanchasko.com/cloudfront_distribution_id \
  --type String \
  --value [your-actual-distribution-id] \
  --profile websites-bryanchasko

aws ssm put-parameter \
  --name /sites/bryanchasko.com/aws_region \
  --type String \
  --value us-west-2 \
  --profile websites-bryanchasko
```

### Verify Parameters Created
```bash
aws ssm get-parameters \
  --names /sites/bryanchasko.com/s3_bucket \
            /sites/bryanchasko.com/domain \
            /sites/bryanchasko.com/cloudfront_distribution_id \
            /sites/bryanchasko.com/aws_region \
  --profile websites-bryanchasko
```

- [ ] All 4 parameters created successfully
- [ ] S3 bucket name correct
- [ ] Domain name correct
- [ ] CloudFront distribution ID correct
- [ ] AWS region is us-west-2

### Why Parameter Store?
- ✅ **Free**: Standard parameters cost nothing
- ✅ **Secure**: Centralized, no hardcoding in config files
- ✅ **Auditable**: Change history tracked automatically
- ✅ **Flexible**: Easy to update across environments
- ✅ **Team-friendly**: Share config without sharing credentials

---

## Step 5: GitHub Repository Secrets

### Add Secrets to GitHub

1. Go to: **GitHub Repository → Settings → Secrets and variables → Actions**
2. Click **New repository secret**

**Important**: Only store AWS IAM credentials here. Configuration is stored in AWS Parameter Store.

### Secret 1: AWS_ACCESS_KEY_ID
```
Name: AWS_ACCESS_KEY_ID
Value: [AccessKeyId from Step 1]
```
- [ ] Added
- [ ] Value is correct (no extra spaces)

### Secret 2: AWS_SECRET_ACCESS_KEY
```
Name: AWS_SECRET_ACCESS_KEY
Value: [SecretAccessKey from Step 1]
```
- [ ] Added
- [ ] Value is correct (no extra spaces)

### Verification
- [ ] Both secrets appear in Settings → Secrets (with masked values)
- [ ] Secrets are not visible to the public
- [ ] Secrets can only be used in workflows
- [ ] Only 2 secrets configured (NOT bucket names, domain, etc.)

---

## Step 6: Workflow Configuration

### Deploy Workflow (`.github/workflows/deploy.yml`)
- [ ] File exists in repository
- [ ] Contains:
  - [ ] `name: Build & Deploy to S3`
  - [ ] `on: push (branches: [main])`
  - [ ] Hugo build step
  - [ ] Node.js setup
  - [ ] Playwright browser installation
  - [ ] AWS credentials configuration (from GitHub Secrets only)
  - [ ] WebGL test gate (npm test)
  - [ ] S3 sync step
  - [ ] CloudFront invalidation
  - [ ] Baseline update (main branch only)
- [ ] **Note**: Configuration (bucket name, distribution ID) sourced from AWS Parameter Store via deploy.pl script

### Tests Workflow (`.github/workflows/webgl-tests.yml`)
- [ ] File exists in repository
- [ ] Contains:
  - [ ] `name: WebGL Visual Regression & Performance Tests`
  - [ ] Triggers on PR, push, manual dispatch
  - [ ] Matrix strategy (chromium, firefox, webkit)
  - [ ] Playwright setup
  - [ ] AWS credentials configuration
  - [ ] Test execution (npm test)
  - [ ] Artifact uploads

---

## Step 7: Build Verification

### Local Test (Before First Deploy)
```bash
# Run tests locally
npm test

# Verify build works
hugo --minify

# Check public/ directory
ls -la public/ | head -20
```

- [ ] Tests pass locally
- [ ] Hugo build completes without errors
- [ ] `public/` directory exists with content

### Create Test PR
1. Create new branch:
   ```bash
   git checkout -b test-ci-cd
   ```
2. Make trivial change (e.g., update a comment)
3. Commit and push:
   ```bash
   git commit -m "Test CI/CD setup"
   git push origin test-ci-cd
   ```
4. Create Pull Request on GitHub

- [ ] PR created
- [ ] GitHub Actions workflow triggered
- [ ] Check Actions tab for workflow status

### Monitor Workflow
- [ ] Tests workflow runs (should appear in PR checks)
- [ ] All browsers (Chrome, Firefox, Safari) test successfully
- [ ] Artifacts uploaded (view in Actions details)
- [ ] Status shows ✅ or ❌

---

## Step 8: First Production Deploy

### Prerequisites
- [ ] PR tests pass
- [ ] PR reviewed and approved
- [ ] Ready to merge to main
- [ ] AWS Parameter Store values set (Step 4)
- [ ] GitHub Secrets configured (Step 5)

### Merge to Main
1. Click **Merge pull request** on GitHub
2. Watch **Actions** tab
3. Verify **Build & Deploy to S3** workflow runs

### Monitor Deploy Workflow
- [ ] Workflow triggered automatically
- [ ] Security gate passes (no hardcoded secrets detected)
- [ ] Hugo build step passes
- [ ] **WebGL test gate passes** (critical!)
- [ ] S3 sync completes
- [ ] CloudFront invalidation succeeds
- [ ] Baseline update completes
- [ ] Workflow status shows ✅

### Verify Live Site
1. Open https://bryanchasko.com in browser
2. Do a hard refresh (Cmd+Shift+R on macOS)
3. Verify changes are live
4. Check browser console for any errors

- [ ] Changes visible on live site
- [ ] No errors in browser console
- [ ] All pages load correctly
- [ ] WebGL scenes render properly

---

## Step 9: Troubleshooting Checklist

### Tests Fail in Workflow
- [ ] View workflow logs
- [ ] Download test artifacts (screenshots, reports)
- [ ] Compare actual vs. baseline
- [ ] Fix code locally: `npm test`
- [ ] Commit fix and re-push
- [ ] Re-run workflow

### S3 Sync Fails
- [ ] Check IAM user policy has S3 permissions
- [ ] Verify bucket name in AWS Parameter Store matches actual bucket
- [ ] Check AWS credentials in GitHub Secrets are correct
- [ ] View workflow logs for exact error

### CloudFront Invalidation Fails
- [ ] Verify distribution exists: `aws cloudfront list-distributions`
- [ ] Confirm distribution ID in Parameter Store is correct
- [ ] Check IAM user has CloudFront permissions
- [ ] View workflow logs for lookup attempts

### Parameter Store Not Found Errors
- [ ] Verify parameters exist: `aws ssm get-parameters --names /sites/bryanchasko.com/s3_bucket ...`
- [ ] Check IAM user has SSM read permissions (included in standard policy)
- [ ] Confirm parameter names match exactly (case-sensitive)
- [ ] Check AWS region is correct (us-west-2)

### Baselines Not Updating
- [ ] Verify on main branch push (not PR merge)
- [ ] Check S3 baseline bucket exists and is accessible
- [ ] Verify IAM policy includes baseline bucket access
- [ ] Review workflow logs for baseline update step

---

## Step 10: Ongoing Maintenance

### Regular Tasks
- [ ] **Every 90 days**: Rotate AWS access keys
  ```bash
  # Create new key
  aws iam create-access-key --user-name github-actions-webgl-tests
  
  # Update GitHub Secrets with new key
  # Delete old key
  aws iam delete-access-key --user-name github-actions-webgl-tests \
    --access-key-id [OLD_KEY_ID]
  ```

- [ ] **Quarterly**: Update Parameter Store values if needed
  ```bash
  aws ssm put-parameter \
    --name /sites/bryanchasko.com/[parameter-name] \
    --type String \
    --value [new-value] \
    --overwrite \
    --profile websites-bryanchasko
  ```

- [ ] **Monthly**: Review workflow logs for failures
  - Go to GitHub Actions tab
  - Check for red (failed) workflows
  - Investigate and fix root causes

- [ ] **Quarterly**: Review IAM permissions
  - Run: `aws iam get-user-policy`
  - Verify policy is still minimal
  - Remove any unused permissions

### Documentation Updates
- [ ] Keep CI_CD_SETUP.md current with any changes
- [ ] Update copilot-instructions.md with new procedures
- [ ] Document any custom workflow additions

---

## Final Verification Checklist

### Access & Permissions
- [ ] IAM user created: `github-actions-webgl-tests`
- [ ] Access keys generated and stored securely
- [ ] IAM policy attached (S3 + CloudFront + SSM)
- [ ] Verified with: `aws iam get-user-policy`

### AWS Parameter Store Configuration
- [ ] 4 parameters created under `/sites/bryanchasko.com/`
  - [ ] `s3_bucket` = bryanchasko.com
  - [ ] `domain` = bryanchasko.com
  - [ ] `cloudfront_distribution_id` = [your-distribution-id]
  - [ ] `aws_region` = us-west-2
- [ ] Parameters readable: `aws ssm get-parameters --names /sites/bryanchasko.com/...`

### S3 Baseline Bucket
- [ ] Bucket created: `bryanchasko-com-webgl-baselines`
- [ ] Versioning enabled
- [ ] Encryption enabled (AES256)
- [ ] Lifecycle policy set (180 days)
- [ ] IAM user has access

### GitHub Configuration
- [ ] GitHub Secrets added: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` only
- [ ] **No bucket names or distribution IDs in Secrets** (use Parameter Store instead)
- [ ] Workflows exist: `deploy.yml`, `webgl-tests.yml`
- [ ] Branch protection enabled (require PR review)
- [ ] Status checks required (workflows must pass)

### Workflow Execution
- [ ] Test PR created and checks pass
- [ ] Merge to main and deploy succeeds
- [ ] Changes live on production
- [ ] No errors in browser console
- [ ] WebGL scenes render correctly

---

## Success! 🎉

If all checkboxes are complete, your GitHub Actions CI/CD pipeline is:
- ✅ **Configured** (workflows set up)
- ✅ **Secured** (credentials stored safely)
- ✅ **Tested** (first deploy successful)
- ✅ **Monitored** (ready for ongoing use)

---

## Resources

- **Full Guide**: [CI_CD_SETUP.md](CI_CD_SETUP.md)
- **Project README**: [README.md](README.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Developer Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)

---

**Completed By**: [Your Name]  
**Date Completed**: [YYYY-MM-DD]  
**Notes**: [Any additional notes or issues encountered]
