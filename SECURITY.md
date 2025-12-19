# Security & Secrets Management

## Golden Rule

**Never commit AWS credentials, account IDs, or infrastructure details to GitHub.**

## What's Protected (Gitignored)

All account-specific files are in `.gitignore`:

```gitignore
# AWS Configuration (account-specific - NEVER commit)
_README_HOSTING.md
_AWS_ENVIRONMENT_DETAILS.md
bucket-policy.json
cloudfront-config.json
cloudfront-dns-record.json
cors.json
current-bucket-policy.json
dns-record.json
```

These files contain:
- ❌ AWS Account ID: `318434843903`
- ❌ S3 Bucket Name: `bryanchasko.com`
- ❌ CloudFront Distribution ID: `[your-actual-distribution-id]` (example only - never hardcode actual IDs)
- ❌ Origin Access Control ID: `E3CW7HU0VHU337`
- ❌ AWS Role ARNs and IAM policies
- ❌ Route 53 zone configuration

## Configuration Management

### Option 1: Local Config File (Recommended for Development)

Create `~/.bcc-site/config.json` (in your home directory, NOT the repo):

```json
{
  "SITE_DOMAIN": "bryanchasko.com",
  "SITE_BUCKET": "bryanchasko.com",
  "SITE_DISTRIBUTION_ID": "[your-actual-distribution-id]",  // NEVER hardcode, use Parameter Store only
  "AWS_PROFILE": "aerospaceug-admin",
  "AWS_REGION": "us-west-2"
}
```

**File permissions:**
```bash
# Restrict to your user only
chmod 600 ~/.bcc-site/config.json

# Verify
ls -la ~/.bcc-site/config.json
# Should show: -rw------- (600)
```

### Option 2: Environment Variables

```bash
export SITE_DOMAIN=bryanchasko.com
export SITE_BUCKET=bryanchasko.com
export SITE_DISTRIBUTION_ID=[your-actual-distribution-id]  # NEVER use - this is an example of what NOT to do
export AWS_PROFILE=aerospaceug-admin
export AWS_REGION=us-west-2

# Then deploy
perl scripts/deploy.pl
```

### Option 3: AWS Systems Manager Parameter Store (Recommended for Teams)

Store configuration securely in AWS:

```bash
# One-time setup
aws ssm put-parameter --name /sites/bryanchasko.com/s3_bucket \
  --type String --value bryanchasko.com \
  --profile aerospaceug-admin

aws ssm put-parameter --name /sites/bryanchasko.com/domain \
  --type String --value bryanchasko.com \
  --profile aerospaceug-admin

aws ssm put-parameter --name /sites/bryanchasko.com/cloudfront_distribution_id \
  --type String --value [your-actual-distribution-id] \
  --profile aerospaceug-admin

aws ssm put-parameter --name /sites/bryanchasko.com/aws_profile \
  --type String --value aerospaceug-admin \
  --profile aerospaceug-admin

aws ssm put-parameter --name /sites/bryanchasko.com/aws_region \
  --type String --value us-west-2 \
  --profile aerospaceug-admin

# Then deploy using SSM
perl scripts/deploy.pl --param-path /sites/bryanchasko.com
```

**Why SSM Parameter Store?**
- ✅ Centralized configuration (team-wide)
- ✅ No credentials stored locally
- ✅ Free for standard parameters
- ✅ Audit trail (CloudTrail logs all reads/writes)
- ✅ IAM access control (only users with permissions can read)

## AWS CLI Configuration

### Profile Setup

Store AWS credentials in `~/.aws/credentials` (not in repo):

```ini
[aerospaceug-admin]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**File permissions:**
```bash
chmod 600 ~/.aws/credentials
```

### Default Region

Set default region in `~/.aws/config`:

```ini
[profile aerospaceug-admin]
region = us-west-2
output = json
```

### Verify Setup

```bash
# Test credentials
aws sts get-caller-identity --profile aerospaceug-admin

# Should return:
# {
#   "UserId": "AIDAI...",
#   "Account": "318434843903",
#   "Arn": "arn:aws:iam::318434843903:user/..."
# }
```

## Deploy Script Safety

The `scripts/deploy.pl` script includes security features:

### Configuration Priority (Prevents Accidental Hardcoding)

1. **Command-line args** (highest priority)
   ```bash
   perl scripts/deploy.pl --profile aerospaceug-admin --bucket my-bucket
   ```

2. **Environment variables**
   ```bash
   export AWS_PROFILE=aerospaceug-admin
   ```

3. **Local config file** (`~/.bcc-site/config.json`)

4. **AWS Parameter Store** (`/sites/domain/...`)

5. **Hugo config inference** (lowest priority, fallback to baseURL)

### Dry-Run Mode

Always test before deploying:

```bash
# Dry-run shows what WOULD happen, no actual AWS calls
perl scripts/deploy.pl --dry-run --verbose

# Output:
# ℹ  Build: run, Upload: run, Invalidate: run
# ℹ  run: hugo --minify
# (dry-run) hugo --minify
# ℹ  run: npm test
# (dry-run) npm test
# ... (no actual S3 sync or CloudFront calls)
```

### Test Gate

Deployment **blocks** if WebGL tests fail (prevents broken code in production):

```bash
# Normal deploy - tests must pass
perl scripts/deploy.pl --profile aerospaceug-admin

# If tests fail, fix the code and try again
# NO broken code reaches production ✅

# Emergency bypass (hotfix only)
perl scripts/deploy.pl --skip-tests --profile aerospaceug-admin
```

## Git Security Best Practices

### 1. Check Before Committing

```bash
# See uncommitted changes
git status

# See what you're about to commit
git diff

# See specific file changes
git diff src/my-file.js

# DON'T commit if you see:
# - AWS credentials
# - Account IDs
# - API keys
# - Distribution IDs
```

### 2. Don't Track Secrets

Add to `.gitignore` (already done):

```gitignore
# AWS account-specific files
_AWS_ENVIRONMENT_DETAILS.md
_README_HOSTING.md
*-config.json
bucket-policy.json
cloudfront-config.json
```

### 3. Check .gitignore is Working

```bash
# List files that would be tracked
git ls-files

# If you see protected files, they weren't ignored properly:
git check-ignore -v <filename>

# If not ignored, add to .gitignore and commit
echo "*-config.json" >> .gitignore
git add .gitignore
git commit -m "Update .gitignore to exclude config files"
```

### 4. If You Accidentally Committed Secrets

```bash
# 1. Remove from git history (CRITICAL)
git filter-branch --tree-filter 'rm -f <filename>' HEAD

# 2. Force push (only if you're the only one working on this branch)
git push origin <branch> --force

# 3. Delete old AWS credentials immediately
# (In your case, rotate the IAM user keys if exposed)

# 4. Notify your team (if shared repository)
```

## GitHub Secrets (For CI/CD)

If using GitHub Actions for deployment:

### Set Up Secrets

1. Go to repo → Settings → Secrets and variables → Actions
2. Create these secrets:
   - `AWS_ACCESS_KEY_ID` - IAM user's access key
   - `AWS_SECRET_ACCESS_KEY` - IAM user's secret key
   - `AWS_REGION` - e.g., `us-west-2`

### Use in Workflow

In `.github/workflows/deploy.yml`:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}

- name: Deploy to production
  run: |
    perl scripts/deploy.pl
```

## IAM Permissions (Least Privilege)

Create an IAM user for deployments with **minimum required permissions**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
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
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
}
```

**Why this approach?**
- ✅ User can only upload to the specific S3 bucket
- ✅ User can only invalidate CloudFront cache
- ✅ User cannot delete buckets, modify policies, or access other AWS resources
- ✅ If credentials are leaked, damage is limited

## Incident Response

### If Credentials Are Exposed

1. **Rotate immediately**
   ```bash
   # In AWS Console or CLI
   aws iam create-access-key --user-name deploy-user --profile admin
   aws iam delete-access-key --user-name deploy-user --access-key-id AKIA... --profile admin
   ```

2. **Update GitHub Secrets** (if using GitHub Actions)
   - Go to Settings → Secrets → Update the exposed secret

3. **Update local config** (`~/.bcc-site/config.json`)
   - Delete and re-create with new credentials

4. **Review CloudTrail logs** (optional but recommended)
   ```bash
   # Check what was accessed with the exposed credentials
   aws cloudtrail lookup-events --event-sources s3.amazonaws.com \
     --max-items 10 --profile admin
   ```

### If Broken Code Deployed

1. **Rollback using git**
   ```bash
   # Find the good commit
   git log --oneline | head -10

   # Revert the bad commit
   git revert <commit-hash>

   # Deploy the fix
   perl scripts/deploy.pl --profile aerospaceug-admin
   ```

2. **Or manually restore from S3 versioning**
   ```bash
   # S3 versioning is enabled - restore previous version
   aws s3api list-object-versions --bucket bryanchasko.com --profile aerospaceug-admin
   ```

## Regular Maintenance

### Monthly Security Checklist

- [ ] Review `.gitignore` for new secrets (configs, keys, tokens)
- [ ] Check `git log` for any accidentally committed credentials
- [ ] Verify `~/.aws/credentials` and `~/.bcc-site/config.json` have restrictive permissions (600)
- [ ] Rotate IAM user credentials (every 90 days is AWS best practice)
- [ ] Review CloudTrail logs for unauthorized access attempts
- [ ] Verify S3 Block Public Access is still enabled

## References

- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [Git Secrets Prevention](https://git-scm.com/book/en/v2/Git-Tools-Hiding-Things)
- [GitHub Security](https://docs.github.com/en/code-security)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
