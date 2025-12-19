# Terraform Implementation Setup Guide

Complete guide for implementing Terraform infrastructure-as-code with HCP Terraform Cloud.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ HCP Terraform account (create at https://app.terraform.io/signup/account)
- ✅ AWS CLI configured with `aerospaceug-admin` profile
- ✅ Terraform CLI installed (>= 1.5.0): `terraform --version`
- ✅ Git repository access with GitHub Actions enabled
- ✅ Existing AWS resources deployed (S3, CloudFront, Route 53, ACM, IAM)

---

## 🚀 Quick Start (5 Steps)

### Step 1: HCP Terraform Cloud Setup (5 minutes)

1. **Create HCP Terraform Account** (if needed):
   - Visit: https://app.terraform.io/signup/account
   - Sign up with GitHub (recommended)
   - Verify email

2. **Create Organization**:
   - In HCP Terraform console: Organizations → Create Organization
   - Organization name: `[YOUR-ORG-NAME]` (e.g., `cloudcroft-cloud-company`)
   - Note this name for Step 2

3. **Create Workspace**:
   - In your organization: Workspaces → New Workspace
   - Choose: **Version Control Workflow**
   - Connect to GitHub repository: `BryanChasko/bryan-chasko-com`
   - Workspace name: `bryanchasko-com-infrastructure`
   - Working directory: `terraform`
   - Click "Create workspace"

4. **Generate API Token**:
   - User Settings → Tokens → Create an API token
   - Description: `GitHub Actions`
   - Copy the token (you'll only see it once!)

5. **Configure GitHub Secret**:
   ```bash
   # Go to: GitHub repo → Settings → Secrets and variables → Actions
   # Click "New repository secret"
   # Name: TF_API_TOKEN
   # Value: [paste token from step 4]
   ```

### Step 2: Update backend.tf Organization (1 minute)

Open `terraform/backend.tf` and replace the placeholder:

```diff
terraform {
  cloud {
-   organization = "YOUR-ORGANIZATION-HERE"
+   organization = "cloudcroft-cloud-company"  # Your actual org name
    workspaces {
      name = "bryanchasko-com-infrastructure"
    }
  }
```

**Commit and push**:
```bash
git add terraform/backend.tf
git commit -m "chore: configure Terraform Cloud organization"
git push origin main
```

### Step 3: Import Existing AWS Resources (15 minutes)

Initialize Terraform and import existing infrastructure:

```bash
cd terraform
terraform init  # Should connect to HCP Terraform Cloud

# Import S3 buckets
terraform import module.s3.aws_s3_bucket.production bryanchasko.com
terraform import module.s3.aws_s3_bucket_versioning.production bryanchasko.com
terraform import module.s3.aws_s3_bucket_public_access_block.production bryanchasko.com
terraform import module.s3.aws_s3_bucket_policy.production bryanchasko.com

terraform import module.s3.aws_s3_bucket.baselines bryanchasko-com-webgl-baselines
terraform import module.s3.aws_s3_bucket_versioning.baselines bryanchasko-com-webgl-baselines
terraform import module.s3.aws_s3_bucket_server_side_encryption_configuration.baselines bryanchasko-com-webgl-baselines
terraform import module.s3.aws_s3_bucket_lifecycle_configuration.baselines bryanchasko-com-webgl-baselines
terraform import module.s3.aws_s3_bucket_public_access_block.baselines bryanchasko-com-webgl-baselines

# Import CloudFront
terraform import module.cloudfront.aws_cloudfront_origin_access_control.main E3CW7HU0VHU337
terraform import module.cloudfront.aws_cloudfront_distribution.main [YOUR_DISTRIBUTION_ID]

# Import Route 53 (get zone ID: aws route53 list-hosted-zones)
terraform import module.route53.aws_route53_zone.main [YOUR_ZONE_ID]
terraform import module.route53.aws_route53_record.root [YOUR_ZONE_ID]_bryanchasko.com_A
terraform import module.route53.aws_route53_record.www [YOUR_ZONE_ID]_www.bryanchasko.com_A

# Import ACM certificate
terraform import module.acm.aws_acm_certificate.main arn:aws:acm:us-east-1:211125425201:certificate/dffdb4ca-0817-4ceb-b857-153ba1c3ffb3

# Import IAM user
terraform import module.iam.aws_iam_user.github_actions github-actions-webgl-tests
terraform import module.iam.aws_iam_user_policy.github_actions github-actions-webgl-tests:github-actions-webgl-policy

# Import SSM parameters
terraform import module.ssm.aws_ssm_parameter.s3_bucket /sites/bryanchasko.com/s3_bucket
terraform import module.ssm.aws_ssm_parameter.domain /sites/bryanchasko.com/domain
terraform import module.ssm.aws_ssm_parameter.cloudfront_distribution_id /sites/bryanchasko.com/cloudfront_distribution_id
terraform import module.ssm.aws_ssm_parameter.aws_region /sites/bryanchasko.com/aws_region
```

**Get your Distribution ID**:
```bash
aws ssm get-parameter --name /sites/bryanchasko.com/cloudfront_distribution_id --query 'Parameter.Value' --output text --profile aerospaceug-admin
```

**Get your Hosted Zone ID**:
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='bryanchasko.com.'].Id" --output text --profile aerospaceug-admin
```

### Step 4: Verify Terraform Plan (2 minutes)

After all imports, verify Terraform shows zero changes:

```bash
cd terraform
terraform plan
```

**Expected output**:
```
No changes. Your infrastructure matches the configuration.
```

If you see planned changes, the import may have missed some resources or configuration differences exist.

### Step 5: Test GitHub Actions Workflow (5 minutes)

1. **Create a test branch**:
```bash
git checkout -b test-terraform-workflow
```

2. **Make a trivial change** (e.g., add comment to `variables.tf`):
```bash
echo "# Test comment" >> terraform/variables.tf
git add terraform/variables.tf
git commit -m "test: verify Terraform workflow"
git push origin test-terraform-workflow
```

3. **Create Pull Request**:
   - Go to GitHub repository
   - Click "Compare & pull request"
   - Wait for Terraform Plan to run (~2 minutes)

4. **Verify workflow output**:
   - Check PR comments for Terraform plan output
   - Format check should pass ✅
   - Init should pass ✅
   - Validate should pass ✅
   - Plan should show your test change

5. **Merge PR**:
   - If plan looks good, merge to main
   - Terraform Apply will run automatically
   - Check Actions tab for apply results

---

## 📚 Detailed Configuration

### HCP Terraform Workspace Settings

**Recommended settings in HCP Terraform console**:

1. **General Settings**:
   - Execution Mode: Remote
   - Apply Method: Auto apply (runs apply automatically on main branch)
   - Terraform Version: Latest (1.5.x+)

2. **Variables** (optional - using defaults from variables.tf):
   - `domain`: bryanchasko.com
   - `aws_region`: us-west-2
   - `aws_account_id`: 211125425201

3. **Notifications** (recommended):
   - Add Slack webhook for plan/apply notifications
   - Configure email alerts for apply failures

### GitHub Actions Workflow Details

**File**: `.github/workflows/terraform.yml`

**Triggers**:
- Pull requests to `main` branch (runs `terraform plan`)
- Push to `main` branch (runs `terraform apply`)
- Manual dispatch via Actions tab

**Jobs**:
1. **Terraform Format Check**: Ensures code is properly formatted
2. **Terraform Init**: Connects to HCP Terraform Cloud
3. **Terraform Validate**: Checks syntax and configuration
4. **Terraform Plan** (PR only): Shows proposed changes in PR comment
5. **Terraform Apply** (main only): Applies changes automatically

**Environment Variables**:
- `TF_CLOUD_ORGANIZATION`: Your HCP Terraform org name
- `TF_API_TOKEN`: GitHub Secret for authentication
- `TF_WORKSPACE`: bryanchasko-com-infrastructure

### Deploy Workflow Updates

**File**: `.github/workflows/deploy.yml`

**Changes made**:
1. Added "Get configuration from Parameter Store" step
2. Replaced hardcoded S3 bucket name with `${{ steps.config.outputs.s3_bucket }}`
3. Replaced CloudFront discovery logic with `${{ steps.config.outputs.cf_distribution_id }}`

**Why this matters**:
- Infrastructure values managed in one place (Terraform)
- No more hardcoded ARNs or IDs in workflows
- Parameter Store provides runtime configuration
- Easier to update infrastructure without changing workflows

---

## 🔧 Common Operations

### Making Infrastructure Changes

1. **Create feature branch**:
```bash
git checkout -b infra/add-s3-lifecycle-rule
```

2. **Edit Terraform files** (e.g., `terraform/modules/s3/main.tf`):
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "production_cleanup" {
  bucket = aws_s3_bucket.production.id
  
  rule {
    id     = "delete-old-versions"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
```

3. **Test locally**:
```bash
cd terraform
terraform fmt -recursive  # Format code
terraform validate        # Check syntax
terraform plan           # See proposed changes
```

4. **Push and create PR**:
```bash
git add terraform/
git commit -m "feat: add S3 lifecycle rule for old versions"
git push origin infra/add-s3-lifecycle-rule
```

5. **Review plan in PR**:
   - GitHub Actions will comment with full Terraform plan
   - Review changes with team
   - Merge when approved

6. **Auto-apply on merge**:
   - Merging to main triggers `terraform apply`
   - Check Actions tab for results

### Updating Module Outputs

If you add a new output to a module:

1. **Add to module outputs** (e.g., `terraform/modules/cloudfront/outputs.tf`):
```hcl
output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}
```

2. **Expose in root outputs** (`terraform/outputs.tf`):
```hcl
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.distribution_domain_name
}
```

3. **Update SSM parameter** (if needed in deploy.yml):
```hcl
# In terraform/modules/ssm/main.tf
resource "aws_ssm_parameter" "cloudfront_domain" {
  name  = "${var.parameter_store_namespace}/cloudfront_domain"
  type  = "String"
  value = var.cloudfront_domain_name
  tags  = { Sensitive = "false", ManagedBy = "Terraform" }
}
```

4. **Update deploy.yml** to read new parameter:
```yaml
- name: Get configuration from Parameter Store
  id: config
  run: |
    CF_DOMAIN=$(aws ssm get-parameter --name /sites/bryanchasko.com/cloudfront_domain --query 'Parameter.Value' --output text)
    echo "cf_domain=${CF_DOMAIN}" >> $GITHUB_OUTPUT
```

### Viewing Terraform State

**Never edit state files directly!** Use Terraform commands:

```bash
# List all resources
terraform state list

# Show specific resource details
terraform state show module.s3.aws_s3_bucket.production

# View outputs
terraform output

# View sensitive output
terraform output -json cloudfront_distribution_id
```

### Troubleshooting Import Failures

If an import fails:

```bash
# Get resource details from AWS
aws s3api get-bucket-versioning --bucket bryanchasko.com

# Compare with Terraform resource definition
# Adjust Terraform code if needed, then re-import
terraform import module.s3.aws_s3_bucket_versioning.production bryanchasko.com
```

Common import errors:
- **Resource not found**: Check resource ID/name
- **Permission denied**: Verify AWS credentials
- **Already managed**: Resource already in state (use `terraform state rm` first)

---

## 🔐 Security Best Practices

### Sensitive Data Handling

1. **Mark outputs as sensitive**:
```hcl
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
  sensitive   = true  # Prevents showing in logs
}
```

2. **Use Parameter Store for secrets**:
```hcl
resource "aws_ssm_parameter" "api_key" {
  name  = "/sites/bryanchasko.com/api_key"
  type  = "SecureString"  # Encrypted with KMS
  value = var.api_key
}
```

3. **Never commit**:
- ❌ `*.tfvars` files with secrets
- ❌ `terraform.tfstate` (contains all values)
- ❌ `.terraform/` directory
- ✅ Use `.gitignore` (already configured)

### IAM Permissions Principle

**Least Privilege**: Grant only needed permissions

Current IAM policy for `github-actions-webgl-tests` user:
- ✅ S3 baseline bucket: Get/Put/List only
- ✅ S3 deploy bucket: Full S3 access (needed for sync)
- ✅ CloudFront: Create invalidations only
- ✅ SSM: Read parameters under `/sites/*` only

**Avoid**:
- ❌ `AdministratorAccess` policy
- ❌ Wildcard resources (`Resource: "*"`) when specific ARNs available
- ❌ `s3:*` on all buckets

### Terraform State Security

**HCP Terraform Cloud benefits**:
- ✅ State stored remotely (not in Git)
- ✅ Encrypted at rest and in transit
- ✅ Automatic state locking (prevents concurrent runs)
- ✅ State versioning (rollback capability)
- ✅ Team access controls

**Alternative (not recommended for this project)**:
S3 backend requires manual locking setup with DynamoDB.

---

## 📊 Monitoring & Maintenance

### HCP Terraform Console

**Daily checks**:
1. Log in to https://app.terraform.io
2. View workspace runs: Workspaces → bryanchasko-com-infrastructure
3. Check for failed applies or drift detection alerts

**Run history**:
- Each run stores full plan/apply output
- State versions tracked automatically
- Can download state files for audit

### GitHub Actions Status

**Check workflow health**:
```bash
# View recent workflow runs
gh run list --workflow=terraform.yml

# View specific run details
gh run view [RUN_ID]

# Download workflow logs
gh run download [RUN_ID]
```

### Drift Detection (Future Enhancement)

HCP Terraform supports scheduled drift detection:

1. In workspace settings: Runs → Drift Detection
2. Configure schedule (e.g., daily at 2 AM UTC)
3. Receive notifications if infrastructure diverges from code

---

## 🆘 Troubleshooting

### "Error: 409 Conflict" during import

**Cause**: Resource already exists in state

**Fix**:
```bash
# Remove from state
terraform state rm module.s3.aws_s3_bucket.production

# Re-import
terraform import module.s3.aws_s3_bucket.production bryanchasko.com
```

### "Error: Invalid credentials" in GitHub Actions

**Cause**: TF_API_TOKEN secret not set or expired

**Fix**:
1. Generate new token in HCP Terraform
2. Update GitHub Secret: Settings → Secrets → TF_API_TOKEN

### "Error: Backend configuration changed"

**Cause**: Organization name mismatch between backend.tf and HCP Terraform

**Fix**:
```bash
# Reinitialize with new backend config
terraform init -reconfigure
```

### Terraform plan shows unexpected changes after import

**Cause**: Configuration drift or incorrect import

**Example**:
```
# aws_s3_bucket.production will be updated in-place
~ resource "aws_s3_bucket" "production" {
    ~ tags = {
      - "OldTag" = "value" -> null
    }
}
```

**Fix options**:
1. **Update Terraform to match AWS**: Add tags to Terraform
2. **Update AWS to match Terraform**: Remove tags from AWS
3. **Accept drift**: Run `terraform apply` to align

---

## 📖 Additional Resources

- **Terraform Documentation**: https://developer.hashicorp.com/terraform
- **HCP Terraform**: https://developer.hashicorp.com/terraform/cloud-docs
- **AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws
- **GitHub Actions**: https://docs.github.com/en/actions

---

## ✅ Post-Implementation Checklist

After completing setup:

- [ ] HCP Terraform workspace created and connected
- [ ] Organization name updated in `backend.tf`
- [ ] TF_API_TOKEN added to GitHub Secrets
- [ ] All AWS resources imported successfully
- [ ] `terraform plan` shows zero changes
- [ ] Test PR triggers Terraform plan workflow
- [ ] Merge to main triggers Terraform apply workflow
- [ ] Deploy workflow reads from Parameter Store
- [ ] No hardcoded values remain in workflows
- [ ] `.gitignore` excludes Terraform state files
- [ ] Team members have HCP Terraform access

---

## 🎯 Success Criteria

Your Terraform implementation is complete when:

1. ✅ Infrastructure changes require only Terraform code updates
2. ✅ No manual AWS console changes needed
3. ✅ GitHub Actions workflows succeed on every push
4. ✅ Parameter Store provides runtime configuration
5. ✅ State is managed remotely in HCP Terraform Cloud
6. ✅ Team can collaborate via pull requests with plan previews
7. ✅ All AWS resources tracked in `terraform state list`

Congratulations! Your infrastructure is now fully code-managed. 🚀
