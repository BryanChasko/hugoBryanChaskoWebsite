# Deployment Best Practices & Workflow

## ⚠️ Critical Rule: Feature Branch → Review → Deploy to Main

**NEVER deploy broken code to production.** Always follow this workflow:

### 1. Feature Branch Workflow

```bash
# Create a feature branch for any changes
git checkout -b feature/fix-menu-click
# or
git checkout -b bugfix/navigation-pointer-events

# Make changes, test locally, commit
git add .
git commit -m "Fix: Navigation menu not clickable due to WebGL canvas pointer-events"

# Push to remote for review
git push origin feature/fix-menu-click
```

### 2. Local Testing & Verification (REQUIRED BEFORE PR)

**ALWAYS test locally before pushing:**

```bash
# Start dev server
hugo server --config hugo.toml

# Run full test suite
npm test

# Manual browser testing
# Visit http://localhost:1313/
# - Test all menu clicks (desktop & mobile viewports)
# - Test theme toggle
# - Test WebGL scenes
# - Check for console errors
```

**Playwright test example for validating clicks:**
```bash
# Test specific feature
npm test -- tests/menu-click.spec.js --project=chromium

# Test all browsers
npm test
```

### 3. Pull Request Review (Human in Loop)

**Before merging to main:**
- [ ] PR opened with clear description of changes
- [ ] All tests passing (CI/CD checks green)
- [ ] Manual QA verification (ideally by another person)
- [ ] No broken functionality introduced
- [ ] Documentation updated if needed

### 4. Merge to Main

Only merge after human review confirms:
- ✅ Feature works as intended
- ✅ No regressions in existing functionality
- ✅ Tests pass across all browsers (chromium, firefox, webkit)
- ✅ WebGL visual regression tests pass

### 5. Deployment to Production

Deploy to production **only from main branch**:

```bash
# Verify you're on main and up-to-date
git status
git log -1

# Deploy (includes test gate)
perl scripts/deploy.pl --profile aerospaceug-admin --verbose

# Verify in production
curl -s https://bryanchasko.com/ | head -20
```

## Deployment Process Details

### What `deploy.pl` Does (In Order)

1. **Hugo Build** - `hugo --minify` (generates static files in `public/`)
2. **WebGL Test Gate** - `npm test` (BLOCKS deployment if tests fail)
3. **S3 Sync** - `aws s3 sync public/ s3://bryanchasko.com --delete`
4. **S3 Propagation Wait** - 5 seconds for eventual consistency
5. **CloudFront Invalidation** - Clears CDN cache (`/*` path)
6. **Baseline Update** - On main branch only, updates visual test baselines

### Test Gate: Why It Blocks Deployment

The test gate ensures:
- ✅ WebGL scenes render correct colors (visual regression)
- ✅ Performance stays within budget (<150ms init, >50fps)
- ✅ Reduced motion accessibility works
- ✅ Cross-browser consistency (Chrome, Firefox, Safari)

**If tests fail, deployment stops.** Fix the code or use `--skip-tests` only for critical hotfixes.

### Emergency Bypass (Last Resort)

```bash
# Skip tests ONLY for critical production hotfixes
perl scripts/deploy.pl --skip-tests --profile aerospaceug-admin

# But ALWAYS revert the issue and re-test within hours
```

## Pre-Deployment Checklist

Before running `deploy.pl`, verify:

- [ ] Working on `main` branch: `git branch`
- [ ] All changes committed: `git status`
- [ ] Latest from origin: `git pull origin main`
- [ ] Local server running correctly: `hugo server` (no errors)
- [ ] All tests passing: `npm test`
- [ ] No uncommitted changes: `git status`
- [ ] Public files look right: `ls public/index.html`

## S3 + CloudFront Architecture (Current)

### Security Setup

**S3 Bucket Access:**
- ✅ Block Public Access: **Enabled** (all 4 settings)
- ✅ Only CloudFront can access
- ✅ No direct public S3 URLs work

**CloudFront + Origin Access Control (OAC):**
- ✅ OAC ID: `[YOUR-OAC-ID]` (your OAC name)
- ✅ Distribution: `[YOUR-DISTRIBUTION-ID]`
- ✅ Origin: `[your-site-domain].s3.us-west-2.amazonaws.com` (regional endpoint)
- ✅ HTTPS: ✅ Enabled with ACM cert
- ✅ HTTP → HTTPS: Automatic redirect

**Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bryanchasko.com/*"
    }
  ]
}
```

### Deployment Flow

```
User Request (https://bryanchasko.com/)
    ↓
Route 53 DNS (ALIAS → CloudFront)
    ↓
CloudFront Edge Location
    ↓
CloudFront Distribution ([your-actual-distribution-id])
    ↓
OAC Authentication (SigV4 signing)
    ↓
S3 Regional Endpoint (bryanchasko.com.s3.us-west-2.amazonaws.com)
    ↓
Return index.html + Assets
```

### Cache Invalidation

CloudFront caches files for performance. When deploying, invalidate the cache:

```bash
# Done automatically by deploy.pl
aws cloudfront create-invalidation --distribution-id [your-actual-distribution-id] --paths "/*" --profile aerospaceug-admin

# Or manually:
perl scripts/deploy.pl --invalidate-only --profile aerospaceug-admin
```

**Cache invalidation takes 1-2 minutes to complete.** Changes may not be visible immediately—wait for invalidation to finish.

## Configuration Management

### Never Commit to GitHub

❌ **DON'T hardcode:**
- AWS Account ID: `[YOUR-AWS-ACCOUNT-ID]`
- S3 Bucket: `[your-site-domain]`
- CloudFront Distribution: `[YOUR-DISTRIBUTION-ID]`
- OAC ID: `[YOUR-OAC-ID]`
- AWS Profile: `[YOUR-AWS-PROFILE]`

✅ **DO use:**
- Environment variables
- `~/.bcc-site/config.json` (gitignored)
- AWS Systems Manager Parameter Store
- Command-line arguments to scripts

### Configuration Priority (deploy.pl)

1. **Command-line args** - Highest priority
   ```bash
   perl scripts/deploy.pl --profile aerospaceug-admin --bucket bryanchasko.com
   ```

2. **Environment variables**
   ```bash
   export AWS_PROFILE=aerospaceug-admin
   export SITE_BUCKET=bryanchasko.com
   ```

3. **Local config file** - `~/.bcc-site/config.json`
   ```json
   {
     "SITE_DOMAIN": "bryanchasko.com",
     "SITE_BUCKET": "bryanchasko.com",
     "SITE_DISTRIBUTION_ID": "[your-actual-distribution-id]",
     "AWS_PROFILE": "aerospaceug-admin",
     "AWS_REGION": "us-west-2"
   }
   ```

4. **AWS Parameter Store** - Lowest priority
   ```bash
   aws ssm put-parameter --name /sites/bryanchasko.com/s3_bucket --type String --value bryanchasko.com
   ```

## Rollback Procedures

### Quick Rollback

If deployed code breaks production:

```bash
# Roll back to previous commit
git log --oneline | head -5  # Find the good commit hash

git revert <commit-hash>     # OR git reset --hard <commit-hash>

git push origin main

# Deploy the fix
perl scripts/deploy.pl --profile aerospaceug-admin
```

### From CloudFront Cache

If rollback takes too long, serve old cached version:

```bash
# This only works if CloudFront cached the previous version
# Otherwise, manually re-upload previous files from backup
```

### Prevention

- ✅ Never push to main without tests passing
- ✅ Never deploy without reviewing what changed
- ✅ Use `--dry-run` before real deployments
- ✅ Keep backups in S3 versioning (enabled)

## Monitoring & Verification

### Post-Deployment Checks

```bash
# 1. Verify S3 files synced
aws s3 ls s3://bryanchasko.com/ --profile aerospaceug-admin | tail -10

# 2. Check CloudFront invalidation status
aws cloudfront list-invalidations --distribution-id [your-actual-distribution-id] --profile aerospaceug-admin

# 3. Test HTTPS access
curl -sI https://bryanchasko.com/ | head -3

# 4. Verify content integrity
curl -s https://bryanchasko.com/ | wc -c  # Should be >20000 bytes

# 5. Check cache headers
curl -sI https://bryanchasko.com/ | grep -i cache-control
```

### Expected Responses

**After successful deployment:**
```
HTTP/2 200
Content-Type: text/html
Cache-Control: max-age=...
Age: 0  (or increasing as cache populates)
X-Cache: Miss from cloudfront  (first request after invalidation)
X-Cache: Hit from cloudfront   (subsequent requests)
```

## Local Development Without Deploying

```bash
# Just test locally—don't deploy to production
hugo server --config hugo.toml

# Make changes, refresh browser
# Press Ctrl+C when done

# To deploy later: follow the feature branch workflow
```

## Troubleshooting

### Site Returns 403 Forbidden

**Cause:** Bucket policy doesn't allow CloudFront access, or OAC misconfigured.

**Fix:**
```bash
# Verify bucket policy allows CloudFront
aws s3api get-bucket-policy --bucket bryanchasko.com --profile aerospaceug-admin | jq .

# Verify CloudFront has OAC set
aws cloudfront get-distribution-config --id [your-actual-distribution-id] --profile aerospaceug-admin | jq '.DistributionConfig.Origins.Items[0] | {OriginAccessControlId}'

# Should show OAC ID: "[YOUR-OAC-ID]"
```

### Cache Not Updating After Deploy

**Cause:** CloudFront cache not invalidated.

**Fix:**
```bash
# Check invalidation status
aws cloudfront list-invalidations --distribution-id [your-actual-distribution-id] --profile aerospaceug-admin | jq '.InvalidationList.Items[0] | {Status, CreateTime}'

# If stuck, create new invalidation
perl scripts/deploy.pl --invalidate-only --profile aerospaceug-admin

# Hard refresh browser (Cmd+Shift+R on macOS, Ctrl+Shift+R on Windows/Linux)
```

### WebGL Tests Failing on Slow Hardware

Tests are tuned for mid-tier 2020 hardware. If failing on CI:

```bash
# Adjust performance budget in tests/webgl/performance.spec.js
const budget = process.env.CI ? 200 : 150;  // Relax for CI runners
```

## References

- [AWS OAC Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Cache Invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [Testing Guide](TESTING.md)
- [AWS Infrastructure Setup](._README_HOSTING.md)
