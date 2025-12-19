# Copilot Instructions for Bryan Chasko Portfolio Site

## 🔧 MCP Tooling & Diagnostic First Principle

**When debugging, implementing, or analyzing code:**

ALWAYS start by assessing what MCP tools can gather before speculating or reasoning through the problem.

**Tool Priority for Investigation**:

1. **`file_search`** — Locate files by pattern (e.g., `**/*.glsl`, `**/shaders/**`)
2. **`grep_search`** — Find code references, verify infrastructure exists (e.g., shader compilation, error handling)
3. **`get_errors`** — Check for compilation/syntax errors across all files
4. **`read_file`** — Inspect actual code logic and control flow (with adequate context lines)
5. **`semantic_search`** — Find working examples and patterns in codebase for comparison
6. **`test_failure`** — Retrieve test diagnostics showing exact assertions failing
7. **`mcp_pylance_*`** — Python-specific analysis (imports, syntax, refactoring)
8. **`mcp_css_*`** — CSS analysis and browser compatibility validation

**After Tool Analysis**:

- Identify gaps between what code _should_ do and what tests/evidence prove it _actually_ does
- Use diagnostic output from tests (pixel colors, performance metrics, error messages) as ground truth
- Only after evidence-gathering do implementation fixes

**Documentation**:

- After implementing fixes, update relevant sections below to record the solution pattern
- Do NOT create separate markdown files for task documentation (keep context in code comments + these instructions)
- Link newly discovered problems/patterns to their diagnostic tools for future reference

---

## Project Overview

Hugo-based static site for Bryan Chasko's portfolio and Cloudcroft Cloud Company consulting services. Deployed to AWS S3 + CloudFront, served at https://bryanchasko.com.

## Scripting & Configuration Conventions

**Scripting Language:**

- **Perl exclusively** for all automation scripts (`.pl` files only)
- Never create shell scripts (`.sh` files)
- Follow pattern from `scripts/deploy.pl`: IPC::Open3, JSON::PP, colored output, dry-run support
- **Critical**: All Perl scripts must:
  - Use strict warnings (`use strict; use warnings`)
  - Implement package-based organization (separate namespace per responsibility)
  - Support `--dry-run` flag with no external state changes
  - Exit with proper codes: 0 (success), 1 (expected failure), 2+ (system error)
  - Output: blue/green for success, yellow for warnings, red for errors
  - Example: [scripts/deploy.pl](../scripts/deploy.pl) lines 1-50 show package structure

**Configuration Management Priority (use in this order):**

1. **AWS Systems Manager Parameter Store** (preferred)
   - Store under `/sites/<domain>/` namespace (e.g., `/sites/bryanchasko.com/s3_bucket`)
   - Keys: `s3_bucket`, `domain`, `cloudfront_distribution_id`, `aws_profile`, `aws_region`
   - Use `aws ssm put-parameter --type String` to create
   - No cost for standard parameters, secure, centralized
2. **External config file** (fallback)
   - `~/.bcc-site/config.json` (NOT in repository)
   - Same keys as SSM, uppercase with underscores (e.g., `SITE_BUCKET`)
3. **Environment variables** (override)
   - `SITE_DOMAIN`, `SITE_BUCKET`, `SITE_DISTRIBUTION_ID`, `AWS_PROFILE`, `AWS_REGION`
4. **Command-line arguments** (highest priority)
   - `--bucket`, `--domain`, `--distribution-id`, `--profile`, `--region`

**Never hardcode:**

- AWS account IDs, bucket names, distribution IDs in scripts
- AWS credentials anywhere
- Domain names (infer from hugo.toml `baseURL` or SSM)

**AWS Profile:**

- Default: `[YOUR-AWS-PROFILE]` (see `.secrets-reference.json` for actual value)
- Default region: `us-west-2` (Oregon)

## Environment Setup

**Required Tools:**

- **Hugo**: 0.152.2+ (Extended version for Sass/SCSS support) — Check: `hugo version`
- **Node.js**: 18.0.0+ (for Playwright testing) — Check: `node --version`
- **Perl**: 5.26+ (for deployment scripts) — Check: `perl -v`
- **AWS CLI**: v2+ (for S3/CloudFront operations) — Check: `aws --version`

**First-Time Setup:**

```bash
# 1. Install Node dependencies (testing + WebGL tooling)
npm install

# 2. Install Playwright browsers (needed before first test run)
npm run install:browsers

# 3. Verify Hugo works with theme
hugo server --config hugo.toml
# Should see "Web Server is available at http://localhost:1313"

# 4. Build once to populate public/ directory
hugo --minify
# Should see "Built in [time] ms" with page count
```

**AWS Credentials:**

- Use `~/.aws/credentials` with `[aerospaceug-admin]` profile
- Never commit `.aws/credentials` to version control
- For CI/CD: Use GitHub Secrets (set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`)

## Security & Secrets Management

**Credential Storage Hierarchy** (in order of preference):

1. **GitHub Secrets** (CI/CD): Use for workflow automation — never expose in code or logs
2. **AWS Credentials file** (`~/.aws/credentials`): Local development only, gitignored
3. **AWS SSM Parameter Store** (production): Centralized secret management with IAM access control
4. **Never**:
   - Hardcode credentials in scripts, config files, or environment variable definitions
   - Commit `.aws/credentials`, private keys, or tokens to git history
   - Print secrets to logs or console output
   - Use plain-text config files with credentials in the repository

**Secrets Currently in Use**:

- `AWS_ACCESS_KEY_ID` — GitHub Actions secret for S3 baseline bucket access
- `AWS_SECRET_ACCESS_KEY` — GitHub Actions secret for S3 baseline bucket access
- `AWS_PROFILE` — Environment variable, defaults to `aerospaceug-admin` (no secrets exposed)
- `SITE_BUCKET` — Configuration value, no secrets (bucket name is public)
- `SITE_DOMAIN` — Configuration value, no secrets (domain is public)

**Audit Trail**:

- `.gitignore` excludes all AWS config files, credentials, and infrastructure details
- GitHub Actions workflow uses `aws-actions/configure-aws-credentials@v4` for secure credential injection
- Baseline testing uses IAM policies restricting access to specific S3 bucket only
- No hardcoded ARNs, account IDs, or resource identifiers in source code

## GitHub Actions CI/CD Workflows

Two automated workflows handle testing and deployment:

### WebGL Tests Workflow (`.github/workflows/webgl-tests.yml`)

**Trigger**: PR to main, push to main, manual dispatch

**Matrix**: Chrome, Firefox, Safari (cross-browser validation)

**Pipeline**:

1. Checkout code
2. **Scan for secrets and sensitive information** ← Security gate (blocks on hardcoded credentials)
3. Install Node.js + npm dependencies
4. Install Playwright browsers
5. Configure AWS credentials (for baseline S3 bucket access)
6. Run visual regression tests against S3-stored baselines
7. Compare screenshots (5% pixel diff tolerance)
8. Validate cross-browser consistency
9. Upload test artifacts (reports, diffs, performance metrics)

**Baselines Storage**:

- S3 bucket: `bryanchasko-com-webgl-baselines` (us-west-2)
- Lifecycle: 180-day expiration for old baseline versions
- Encryption: AES256 server-side
- Versioning: Enabled

**Auto-Update Baselines**: On push to main branch (if tests pass)

**Status Check**: Must pass before merging PR to main

### Deploy Workflow (`.github/workflows/deploy.yml`)

**Trigger**: Push to main branch, manual dispatch

**Full Pipeline**:

1. Checkout code (with full history for git operations)
2. **Scan for secrets and sensitive information** ← Security gate (blocks on hardcoded credentials)
3. Setup Hugo (Extended v0.152.2)
4. Setup Node.js 20.x + install dependencies
5. Install Playwright browsers (needed for test gate)
6. **Configure AWS Credentials** (from GitHub Secrets)
7. **Run WebGL Tests** ← TEST GATE (blocks on failure)
8. Build Hugo site (`hugo --minify`)
9. Deploy to S3 with cache headers:
   - Command: `aws s3 sync public/ s3://bryanchasko.com --delete`
   - Cache-Control: `public, max-age=3600` (1 hour)
   - Excludes: `.git/*`, `*.md` files
10. Wait 5 seconds for S3 eventual consistency
11. Auto-discover CloudFront distribution by domain alias
12. Invalidate CloudFront cache (`/*` path)
13. Update test baselines (main branch only)

### Configuration Management Strategy

The workflows use a **hybrid configuration approach** to keep the codebase clean and secure:

**AWS Parameter Store** (Centralized Configuration):

- Stores: S3 bucket name, domain, CloudFront distribution ID, AWS region
- Path namespace: `/sites/bryanchasko.com/`
- Stored parameters:
  - `/sites/bryanchasko.com/s3_bucket` → bryanchasko.com
  - `/sites/bryanchasko.com/domain` → bryanchasko.com
  - `/sites/bryanchasko.com/cloudfront_distribution_id` → [your-actual-distribution-id]
  - `/sites/bryanchasko.com/aws_region` → us-west-2
- **Why Parameter Store?** Free, secure, auditable, no hardcoding in repos
- **How workflows use it**: `deploy.pl` script reads from Parameter Store when called with `--param-path /sites/bryanchasko.com`

**GitHub Secrets** (Credentials Only):

- Stores: AWS IAM access keys only (temporary, rotatable)
- Not stored: Bucket names, distribution IDs, regions (all in Parameter Store)
- Minimal scope: Just enough for deployment and baseline bucket access

**WebGL Tests Workflow Integration**:

1. GitHub Actions sets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from Secrets
2. Tests run against baseline bucket in S3 (`bryanchasko-com-webgl-baselines`)
3. No Parameter Store interaction needed (uses credentials only)

**Deploy Workflow Integration**:

1. GitHub Actions sets AWS credentials from Secrets
2. Calls `perl scripts/deploy.pl --profile aerospaceug-admin --param-path /sites/bryanchasko.com`
3. `deploy.pl` reads configuration from Parameter Store
4. Script executes: Hugo build → WebGL tests (gate) → S3 sync → CloudFront invalidation

**Configuration Priority** (if not using Parameter Store, script reads in this order):

1. Command-line arguments: `--bucket`, `--domain`, `--distribution-id`
2. Environment variables: `SITE_BUCKET`, `SITE_DOMAIN`, `SITE_DISTRIBUTION_ID`
3. External config: `~/.bcc-site/config.json` (not in repo)
4. AWS Parameter Store: `/sites/bryanchasko.com/*` (preferred)
5. Hugo config inference: `baseURL` from `hugo.toml` (fallback)

**Setup Checklist**: See [GITHUB_ACTIONS_CHECKLIST.md](../GITHUB_ACTIONS_CHECKLIST.md) for complete 10-step setup guide:

- Step 1-2: IAM user and policy
- Step 3: S3 baseline bucket
- Step 4: AWS Parameter Store (4 parameters)
- Step 5: GitHub Secrets (2 credentials only)
- Steps 6-10: Workflow configuration, verification, and maintenance

**Required GitHub Secrets**:

```
AWS_ACCESS_KEY_ID          # IAM user for S3 access (deploy + baselines)
AWS_SECRET_ACCESS_KEY      # IAM user secret key
AWS_REGION                 # Default: us-west-2 (set in workflow env)
```

**GitHub Secrets Setup**:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Create new repository secrets (exact names are case-sensitive):

   ```
   Name: AWS_ACCESS_KEY_ID
   Value: (paste from AWS IAM console)

   Name: AWS_SECRET_ACCESS_KEY
   Value: (paste from AWS IAM console)
   ```

3. For baseline bucket access, ensure IAM user has policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::bryanchasko-com-webgl-baselines",
           "arn:aws:s3:::bryanchasko-com-webgl-baselines/*"
         ]
       }
     ]
   }
   ```
4. For main S3 bucket (bryanchasko.com), ensure policy includes:
   ```json
   {
     "Effect": "Allow",
     "Action": ["s3:*"],
     "Resource": [
       "arn:aws:s3:::bryanchasko.com",
       "arn:aws:s3:::bryanchasko.com/*"
     ]
   }
   ```
5. For Parameter Store access, ensure policy includes:
   ```json
   {
     "Effect": "Allow",
     "Action": ["ssm:GetParameter", "ssm:GetParameters"],
     "Resource": "arn:aws:ssm:us-west-2:*:parameter/sites/bryanchasko.com/*"
   }
   ```
6. For CloudFront invalidation, ensure policy includes:
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "cloudfront:CreateInvalidation",
       "cloudfront:ListDistributions"
     ],
     "Resource": "*"
   }
   ```

### Workflow Features

**Security Gate (Secrets Detection)**:

- Scans all source files for hardcoded credentials before testing
- Detects patterns: passwords, API keys, tokens, AWS credentials, private keys
- Prevents accidental secret commits to public repository
- Blocks PR/deployment if secrets found (exit code 1)
- Files checked: `*.js`, `*.ts`, `*.json`, `*.toml`, `*.yaml`, `*.yml`, `*.md` (+ `*.pl` in deploy)
- Directories excluded: `node_modules/`, `public/`, `.git/`

**Test Gate (Deploy Blocker)**:

- WebGL tests must pass before S3 upload
- Prevents broken visual effects from reaching production
- `npm test` runs in deploy workflow (strict mode)
- Exit code 1 blocks deployment; exit code 0 allows

**CloudFront Auto-Discovery**:

- Workflow queries CloudFront distributions by domain alias
- Finds `bryanchasko.com` in distribution aliases
- No hardcoded distribution ID needed
- Falls back gracefully if lookup fails

**Parallel Test Matrix**:

- Chrome, Firefox, Safari tests run in parallel
- Fail-fast disabled (all browsers tested even if one fails)
- Cross-browser color consistency verified

**Baseline Auto-Update**:

- Only runs on main branch (not PRs)
- Updates S3 baselines after successful deploy
- Ensures latest visual state becomes new baseline
- Prevents baseline drift over time

### Local vs. CI Differences

| Aspect           | Local (`deploy.pl`)               | GitHub Actions                            |
| ---------------- | --------------------------------- | ----------------------------------------- |
| **Trigger**      | Manual (`perl scripts/deploy.pl`) | Automatic on main push                    |
| **Environment**  | User's macOS/Linux                | Ubuntu runner (ubuntu-latest)             |
| **Dependencies** | Installed locally                 | Installed in workflow                     |
| **Credentials**  | ~/.aws/credentials (local file)   | GitHub Secrets (encrypted)                |
| **Test Gate**    | Perl script checks exit code      | npm test exit code                        |
| **Build Speed**  | Variable (depends on system)      | ~3-5 minutes (standard)                   |
| **Logs**         | Local terminal                    | GitHub Actions console + artifact uploads |

### Troubleshooting Workflows

**Tests failing in CI but passing locally**:

- Check environment differences: `npm test --ci`
- GitHub runners are slower (headless Chrome, shared hardware)
- Relax performance budgets in CI with: `const budget = process.env.CI ? 200 : 150;`
- See [TESTING.md](../TESTING.md) for performance budget tuning

**Deploy blocked by test failures**:

- Workflow will show ❌ error in PR checks
- Fix tests locally: `npm test -- tests/webgl/...spec.js`
- Re-push to trigger workflow again
- Use `--skip-tests` flag only for emergency hotfixes

**S3 sync not uploading files**:

- Check AWS credentials have S3 permission
- Verify bucket name is correct (bryanchasko.com)
- Check for permission denied errors in workflow logs

**CloudFront invalidation failing**:

- Verify distribution exists with `bryanchasko.com` alias
- Check IAM user has CloudFront permissions
- Workflow logs will show discovery attempts

**Baselines not updating on main**:

- Baselines only update on main branch push
- Must have passing tests before update runs
- Check S3 baseline bucket exists and is accessible
- Verify baseline bucket policy in IAM

## Architecture & Key Directories

- **Content**: [content/](../content/) organized by section:
  - `blog/posts/` - Personal blog posts (About, Skills, AWS projects)
  - `cloudcroft-cloud-company/` - Main consulting landing page
  - `help-services/` - Individual service offering pages
  - `contact/`, `topics/` - Static pages
- **Data Files**: [data/](../data/) for external content feeds (manually updated):
  - `builder_posts.yaml` - AWS Builder Center profile & articles (social_feed.html renders first post as hero card on home page)
  - `linkedin_posts.yaml` - LinkedIn profile & featured activity (social_feed.html shows featured posts in activity feed)
  - **Format**: YAML with strict structure — see existing files for schema
  - **Update workflow**: Edit data file → Hugo rebuilds → `hugo server` shows new content
  - **No sync automation**: These are manually curated external links, not API-synced
- **Theme**: Custom bryan-chasko-theme in [themes/bryan-chasko-theme/](../themes/bryan-chasko-theme/) (PaperMod fork)
- **Layouts**: Custom shortcodes in [layouts/shortcodes/](../layouts/shortcodes/)
- **Build Output**: [public/](../public/) - Git-tracked static files for deployment
- **AWS Configs**: Gitignored files (`*-config.json`, `_AWS_ENVIRONMENT_DETAILS.md`) for infrastructure

## Environment Validation Checklist

**Before starting ANY development work**, verify your environment:

```bash
# Check tool versions
hugo version          # Should output 0.152.2+ (Extended)
node --version        # Should output 18.0.0+
perl -v               # Should output 5.26+
aws --version         # Should output 2.x+

# Verify npm dependencies
ls -la node_modules/@playwright  # Should exist
ls -la node_modules/sharp        # Should exist (for image compression)

# Check Playwright browsers
ls ~/.cache/ms-playwright/  # Should have chromium, firefox, webkit

# Verify git submodules
git submodule status  # PaperMod should show commit hash, not error
```

**If any check fails**:

- Hugo: Install Extended version via Homebrew: `brew install hugo`
- Node.js: `brew install node`
- Playwright: `npm run install:browsers`
- Submodules: `git submodule update --init --recursive`

## Development Workflow

**Local Development:**

```bash
hugo server --config hugo.toml
# Runs on http://localhost:1313
```

**⚠️ Important**: Hugo runs in "Fast Render Mode" by default. This means:

- Changes to content/layouts are hot-reloaded immediately
- **Changes to WebGL source files in `assets/js/` are NOT hot-reloaded** — you must:
  1. Manually copy asset→static: `cp themes/bryan-chasko-theme/assets/js/webgl-scenes/*.js themes/bryan-chasko-theme/static/js/webgl-scenes/`
  2. Stop and restart Hugo server (`Ctrl+C`, then `hugo server --config hugo.toml`)
  3. Or: Run full build in separate terminal: `hugo --minify` (updates public/ without restarting dev server)

**WebGL asset sync (prevent wrong-file edits) — CRITICAL:**

**Problem**: WebGL changes made to static folder are lost on next Hugo build. Tests run against stale code.

**Correct Workflow**:

1. Edit ONLY: `themes/bryan-chasko-theme/assets/js/webgl-scenes/` (canonical source)
2. Copy to static: `cp themes/bryan-chasko-theme/assets/js/webgl-scenes/*.js themes/bryan-chasko-theme/static/js/webgl-scenes/`
3. Rebuild: `hugo --minify`
4. Test: `npm test`

**Do NOT edit**:

- `themes/bryan-chasko-theme/static/js/webgl-scenes/` directly — changes are overwritten by Hugo
- Any `.js` files in `public/` — those are build artifacts

**Future Architecture Vision**:

In an ideal state, the custom theme and WebGL scenes would be unified as a single integrated object-oriented design system, eliminating the need for manual asset syncing between `assets/` and `static/` folders. Current setup requires manual copying as a workaround until full architectural integration is achieved. This is noted as a known gap, not a permanent design choice.

**Validation**: If tests show old behavior after code change, check:

1. Did you copy from assets→static? (`cp` command above)
2. Did you run `hugo --minify` after copy?
3. Browser cache? Hard refresh: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux)

**Production Build:**

```bash
hugo  # Outputs to public/
```

**Deploy to AWS:**

```bash
hugo && aws s3 sync public/ s3://bryanchasko.com
```

**Note:** Dev server auto-rebuilds on file changes. Check [hugo.out](../hugo.out) for build logs if needed.

**WebGL Changes Not Appearing?** Diagnostic checklist:

1. Did you copy from `assets/` to `static/`? (Required for fast render mode)
2. Did you run `hugo --minify`? (Rebuilds public/ directory)
3. Did you hard refresh the browser? (Cmd+Shift+R on macOS, Ctrl+Shift+R on Windows/Linux)
4. Check browser DevTools Network tab — is JavaScript file showing old timestamp?
5. Run tests to verify: `npm test -- tests/webgl/orbit-scene.spec.js` — tests capture actual canvas pixels (ground truth)
6. If tests pass but browser shows wrong colors, it's 100% a cache issue, not a code bug

**Preferred Deploy (with cache invalidation):**

```bash
perl scripts/deploy.pl --profile aerospaceug-admin
```

- Builds via Hugo, syncs `public/` to S3, and invalidates CloudFront (`/*`).
- Reads config from env variables, `~/.bcc-site/config.json`, or SSM Parameter Store path (e.g., `/sites/bryanchasko.com`).
- No secrets are committed to the repo.

## Configuration Details

- **Primary Config**: [hugo.toml](../hugo.toml) (production settings)
- **Dev Config**: [config.dev.toml](../config.dev.toml) (mirrors production, legacy file)
- **Base URL**: Always `https://bryanchasko.com/` - do not use localhost URLs in configs
- **Theme**: PaperMod with `profileMode` disabled; uses `homeInfoParams` for custom home content

## Content Conventions

**Front Matter Pattern:**

```yaml
---
title: "Page Title"
date: 2025-11-29T00:00:00-07:00
draft: false
description: "SEO description"
tags: ["aws", "consulting"]
---
```

**Custom Shortcode - CTA Buttons:**

```html
{{< cta-button href="https://..." label="Book Now" emphasis="primary" >}}
```

- Used extensively in service pages ([help-services/](../content/help-services/))
- `emphasis`: "primary" (blue) or "secondary" (gray)

**Content Organization:**

- Section index pages: `_index.md` in each content directory
- Blog posts: Individual `.md` files in `content/blog/posts/`
- Use markdown anchors for in-page navigation: `[SKILLS](blog/posts/my-skills-and-experience#skills)`

**Home Feature Card - Builder Center:**

- The home page shows a feature card linking to your latest AWS Builder Center article above the social links.
- To update the card text or link, edit [themes/bryan-chasko-theme/layouts/partials/home_info.html](../themes/bryan-chasko-theme/layouts/partials/home_info.html).
- Visual styles live in [themes/bryan-chasko-theme/assets/css/components/home.css](../themes/bryan-chasko-theme/assets/css/components/home.css) under the `.builder-card` rules.

**Blog Page - Social Feed Heroes:**

- The `/blog/` page prominently displays profile hero cards for AWS Builder Center and LinkedIn before blog posts.
- Hero cards push visitors to external profiles with CTA buttons.
- Profile data is managed in YAML data files:
  - [data/builder_posts.yaml](../data/builder_posts.yaml) - AWS Builder Center profile (name, handle, bio, followers) and published articles
  - [data/linkedin_posts.yaml](../data/linkedin_posts.yaml) - LinkedIn profile info and featured activity posts
- Template: [themes/bryan-chasko-theme/layouts/partials/social_feed.html](../themes/bryan-chasko-theme/layouts/partials/social_feed.html)
- Styles: [themes/bryan-chasko-theme/assets/css/components/social-feed.css](../themes/bryan-chasko-theme/assets/css/components/social-feed.css)

**Updating Social Feed Content:**

```yaml
# data/builder_posts.yaml - Add new article
posts:
  - title: "[300 Level] Article Title"
    description: "Brief description"
    url: "https://builder.aws.com/content/..."
    date: "2024-12-10"
    tags: ["tag1", "tag2"]
    level: 300

# data/linkedin_posts.yaml - Add featured post
featured_posts:
  - content: "Post excerpt text..."
    date: "December 2024"
    type: "post"
    topic: "Topic Name"
    reactions: 74
    comments: 20
```

## AWS Infrastructure (Reference Only)

- **S3 Bucket**: `bryanchasko.com` (us-west-2) - Static website hosting enabled
- **CloudFront**: Distribution with ACM cert for HTTPS
- **Route 53**: DNS managed, A record alias to S3/CloudFront
- **Deployment**: See [\_README_HOSTING.md](../_README_HOSTING.md) for full AWS setup steps

**Critical:** AWS config files are gitignored but present locally. Never commit secrets or ARNs to public repo.

### Deploy Script Configuration

**Recommended: AWS Parameter Store (SSM)**

Store configuration in AWS Systems Manager Parameter Store for centralized, secure management:

```bash
# Create parameters (one-time setup)
aws ssm put-parameter --name /sites/bryanchasko.com/s3_bucket --type String --value bryanchasko.com --profile aerospaceug-admin
aws ssm put-parameter --name /sites/bryanchasko.com/domain --type String --value bryanchasko.com --profile aerospaceug-admin
aws ssm put-parameter --name /sites/bryanchasko.com/cloudfront_distribution_id --type String --value [your-actual-distribution-id] --profile aerospaceug-admin
aws ssm put-parameter --name /sites/bryanchasko.com/aws_region --type String --value us-west-2 --profile aerospaceug-admin

# Deploy using SSM parameters
perl scripts/deploy.pl --profile aerospaceug-admin --param-path /sites/bryanchasko.com
```

**Configuration Priority (script reads in this order):**

1. **Command-line arguments** - `--bucket`, `--domain`, `--distribution-id`, `--profile`, `--region` (highest priority)
2. **Environment variables** - `SITE_DOMAIN`, `SITE_BUCKET`, `SITE_DISTRIBUTION_ID`, `AWS_PROFILE`, `AWS_REGION`, `SITE_PARAM_PATH`
3. **External config file** - `~/.bcc-site/config.json` (NOT in repository)
   ```json
   {
     "SITE_DOMAIN": "[your-site-domain]",
     "SITE_BUCKET": "[your-site-domain]",
     "SITE_DISTRIBUTION_ID": "[YOUR-DISTRIBUTION-ID]", // Store in Parameter Store only
     "AWS_PROFILE": "[YOUR-AWS-PROFILE]",
     "AWS_REGION": "us-west-2"
   }
   ```
4. **AWS Parameter Store** - `/sites/<domain>/s3_bucket`, `/sites/<domain>/cloudfront_distribution_id`, etc. (lowest priority, but preferred for teams)
5. **Hugo config inference** - Domain extracted from `hugo.toml` `baseURL` (last resort)

**Why Parameter Store?**

- No cost for standard parameters (<4KB, <10,000 ops/sec)
- Centralized configuration across team members
- No risk of committing secrets to repo
- Built-in change tracking
- Cross-account sharing capability

### Deploy Script Behavior

The script ([scripts/deploy.pl](../scripts/deploy.pl)) executes in this order:

1. **Hugo Build** - Runs `hugo --minify` to generate static files
2. **S3 Sync** - Uploads `public/` to S3 bucket with `--delete` flag
3. **5-second Wait** - Allows S3 propagation before cache invalidation
4. **CloudFront Invalidation** - Submits `/*` invalidation (takes 1-2 minutes)

The script auto-discovers CloudFront distribution by domain alias, with fallback to config file.

### Typical Usage

```bash
# dry-run (no AWS calls, shows what would happen)
perl scripts/deploy.pl --dry-run --verbose

# normal deploy (INCLUDES TEST GATE - tests must pass)
perl scripts/deploy.pl --profile aerospaceug-admin

# verbose deploy (shows CloudFront lookup, useful for debugging)
perl scripts/deploy.pl --profile aerospaceug-admin --verbose

# emergency bypass (skip WebGL tests - use only for hotfixes)
perl scripts/deploy.pl --skip-tests --profile aerospaceug-admin
```

**Deploy Pipeline Order (Updated Dec 2025):**

1. Hugo Build (`hugo --minify`)
2. **WebGL Test Gate** (`npm test` - BLOCKS if tests fail) ⚠️
3. S3 Sync (`public/` → bryanchasko.com bucket)
4. 5-second S3 propagation wait
5. CloudFront Invalidation (`/*` path)
6. Baseline Update (main branch only - `npm run test:update-baselines`)

**Critical**: All WebGL scene changes must pass automated tests before deployment. The philosophy: **"No more unsubstantiated claims."** Visual effects must be verified with pixel-perfect tests.

**Test Gate Behavior**:

- Runs visual regression, performance, and cross-browser tests
- Blocks deployment if ANY test fails (exit code 1)
- Use `--skip-tests` only for critical hotfixes (not recommended)

For comprehensive testing guide, setup instructions, troubleshooting, baseline management, and CI/CD configuration, see [TESTING.md](../TESTING.md)

**Triggers**:

- Pull requests to `main` branch
- Pushes to `main` branch (auto-updates baselines)
- Manual workflow dispatch

**Required Secrets** (✅ NOW CONFIGURED):

GitHub Actions workflow (`.github/workflows/webgl-tests.yml`) requires these secrets configured in repository settings:

- `AWS_ACCESS_KEY_ID` - IAM user with S3 read/write to baseline bucket `bryanchasko-com-webgl-baselines`
- `AWS_SECRET_ACCESS_KEY` - IAM user secret credentials
- `AWS_REGION` - Hardcoded to `us-west-2` (set in workflow env)

**Setup Instructions**:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Create each secret with exact names above (case-sensitive)
3. For IAM user creation:
   - Policy needed: S3 access to `bryanchasko-com-webgl-baselines` bucket
   - Permissions: `s3:GetObject`, `s3:PutObject`, `s3:ListBucket`
4. Do NOT commit credentials to repository; use GitHub Secrets exclusively
5. Rotate credentials if exposed or if team member access changes

**Verification**:

- Workflow runs automatically on PR and main branch push
- Check Actions tab in GitHub for test results
- Baselines auto-update on main branch merges (if tests pass)

**Test Matrix**:

- Chrome (Chromium latest)
- Firefox (latest stable)
- Safari (WebKit latest)

**Artifacts**:

- Test results (JSON + HTML Playwright report)
- Screenshots (actual vs. baseline diffs)
- Performance metrics JSON

### Common Test Issues & Diagnostic Workflow

**Issue**: Tests fail with "No baseline found"

- **First run baseline creation**: Run `npm run test:update-baselines` to create initial baselines
- **S3 bucket missing**: Verify baseline bucket exists: `aws s3 ls s3://bryanchasko-com-webgl-baselines/ --profile aerospaceug-admin`
- **IAM permissions**: Ensure AWS credentials have S3 read/write access to baseline bucket

**Issue**: Visual regression false positives (minor pixel diffs after intentional changes)

- **Increase tolerance**: Adjust pixel diff tolerance in test file: `compareImages(screenshot, baseline, 0.10)` (10% tolerance)
- **Antialiasing variations**: Small color shifts between browsers are normal due to subpixel rendering
- **Update baselines**: After intentional visual changes, run `npm run test:update-baselines` and push updated baselines to S3

**Issue**: Performance tests fail on slow CI runners

- **GitHub Actions slower**: CI runners are slower than local development—budgets may need relaxation for CI
- **Example adjustment**: `const budget = process.env.CI ? 200 : 150;` (ms for orbit init)
- **Context**: GitHub Actions uses shared infrastructure; performance budgets set for local 2020 mid-tier hardware

**Issue**: OrbitScene colors wrong (purple #5E41A2 instead of teal #00CED1 or green #00FA9A) after code change

- **Root cause**: Browser cache serving old JavaScript file, NOT a code bug
- **Diagnostic workflow**:
  1. Confirm code is correct: `grep -n "cosmic-teal\|cosmic-energy" themes/bryan-chasko-theme/assets/js/webgl-scenes/OrbitScene.js`
  2. Check CSS variables: `grep "cosmic-teal" themes/bryan-chasko-theme/assets/css/extended/nebula.css`
  3. Copy assets→static: `cp themes/bryan-chasko-theme/assets/js/webgl-scenes/OrbitScene.js themes/bryan-chasko-theme/static/js/webgl-scenes/`
  4. Rebuild: `hugo --minify`
  5. Hard refresh browser: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux)
  6. Run test to capture actual canvas pixels: `npm test -- tests/webgl/orbit-scene.spec.js --project=chromium`
  7. **Test output is ground truth**: RGB values prove what the code actually renders (not browser perception)
  8. If test still fails after steps 3-5, the bug is in the code, not cache

See [TESTING.md](../TESTING.md) → **"Canvas shows old colors despite code change"** section for detailed diagnostic workflow using test output as ground truth.

## Common Editing Tasks

**Adding a New Blog Post:**

```bash
hugo new content/blog/posts/my-new-post.md
```

**Adding a Service Offering:**

1. Create `content/help-services/new-service/_index.md`
2. Add service summary to `content/cloudcroft-cloud-company/_index.md` with CTA button
3. Use existing service pages as templates

**Modifying Navigation:**
Edit `[menu]` section in [hugo.toml](../hugo.toml#L119-L144). Menu items ordered by `weight`.

**Customizing Theme:**

- Override layouts by creating matching files in [layouts/](../layouts/)
- Custom CSS: [assets/css/extended/help.css](../assets/css/extended/help.css)
- Theme CSS: [themes/bryan-chasko-theme/assets/css/](../themes/bryan-chasko-theme/assets/css/)

**Updating Social Profiles on Blog Page:**

1. Edit [data/builder_posts.yaml](../data/builder_posts.yaml) for AWS Builder Center profile/articles
2. Edit [data/linkedin_posts.yaml](../data/linkedin_posts.yaml) for LinkedIn profile/activity
3. Update follower counts, headlines, featured posts as needed
4. Rebuild and deploy

## Testing Before Deploy

1. Run `hugo server` and verify changes at localhost:1313
2. Test all internal links and CTA buttons
3. Run `hugo` to build - check for warnings in output
4. Verify [public/](../public/) contains expected updated files
5. Deploy and test live site within 5 minutes

For comprehensive WebGL testing and regression prevention guide, see [TESTING.md](../TESTING.md).

## Known Quirks

- **PaperMod Theme**: If submodule is missing, run `git submodule update --init --recursive`
- **Gitignore**: AWS configs and hosting docs are intentionally excluded from public repo
- **Hugo Warnings**: "Raw HTML omitted" warnings are expected - site allows raw HTML in markdown
- **Build Output Committed**: Unlike typical Hugo projects, [public/](../public/) is version controlled for deployment verification

## 🎨 Animated Background System

The site features a multi-layered animated background system in [themes/bryan-chasko-theme/assets/css/extended/nebula.css](../themes/bryan-chasko-theme/assets/css/extended/nebula.css). Both light and dark modes have distinct visual effects.

### Light Mode Layers

| Layer | Element         | Animation         | Duration | Effect                                                                                   |
| ----- | --------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------- |
| 1     | `body::before`  | `aurora-drift`    | 35s      | Large flowing gradient bands with slow majestic movement, rotation, and scale transforms |
| 2     | `body::after`   | `orb-float`       | 25s      | Multiple bright highlight orbs that gently bob and float                                 |
| 3     | `.main::before` | `prismatic-sweep` | 12s      | Diagonal shimmer with hue-rotation and `mix-blend-mode: overlay`                         |

### Dark Mode Layers (Deep Space Nebula)

**Adding a New Blog Post:**

```bash
hugo new content/blog/posts/my-new-post.md
```

**Adding a Service Offering:**

1. Create `content/help-services/new-service/_index.md`
2. Add service summary to `content/cloudcroft-cloud-company/_index.md` with CTA button
3. Use existing service pages as templates

**Modifying Navigation:**
Edit `[menu]` section in [hugo.toml](../hugo.toml#L119-L144). Menu items ordered by `weight`.

**Customizing Theme:**

- Override layouts by creating matching files in [layouts/](../layouts/)
- Custom CSS: [assets/css/extended/help.css](../assets/css/extended/help.css)
- Theme CSS: [themes/bryan-chasko-theme/assets/css/](../themes/bryan-chasko-theme/assets/css/)

**Updating Social Profiles on Blog Page:**

1. Edit [data/builder_posts.yaml](../data/builder_posts.yaml) for AWS Builder Center profile/articles
2. Edit [data/linkedin_posts.yaml](../data/linkedin_posts.yaml) for LinkedIn profile/activity
3. Update follower counts, headlines, featured posts as needed
4. Rebuild and deploy

## Testing Before Deploy

1. Run `hugo server` and verify changes at localhost:1313
2. Test all internal links and CTA buttons
3. Run `hugo` to build - check for warnings in output
4. Verify [public/](../public/) contains expected updated files
5. Deploy and test live site within 5 minutes

## Known Quirks

- **PaperMod Theme**: If submodule is missing, run `git submodule update --init --recursive`
- **Gitignore**: AWS configs and hosting docs are intentionally excluded from public repo
- **Hugo Warnings**: "Raw HTML omitted" warnings are expected - site allows raw HTML in markdown
- **Build Output Committed**: Unlike typical Hugo projects, [public/](../public/) is version controlled for deployment verification

## 🎨 Animated Background System

The site features a multi-layered animated background system in [themes/bryan-chasko-theme/assets/css/extended/nebula.css](../themes/bryan-chasko-theme/assets/css/extended/nebula.css). Both light and dark modes have distinct visual effects.

### Light Mode Layers

| Layer | Element         | Animation         | Duration | Effect                                                                                   |
| ----- | --------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------- |
| 1     | `body::before`  | `aurora-drift`    | 35s      | Large flowing gradient bands with slow majestic movement, rotation, and scale transforms |
| 2     | `body::after`   | `orb-float`       | 25s      | Multiple bright highlight orbs that gently bob and float                                 |
| 3     | `.main::before` | `prismatic-sweep` | 12s      | Diagonal shimmer with hue-rotation and `mix-blend-mode: overlay`                         |

### Dark Mode Layers (Deep Space Nebula)

| Layer | Element         | Animation                       | Duration | Effect                                                          |
| ----- | --------------- | ------------------------------- | -------- | --------------------------------------------------------------- |
| 1     | `body::before`  | `nebula-drift`                  | 40s      | Cosmic purple/violet cloud movement with embedded star clusters |
| 2     | `body::after`   | `cosmic-float` + `star-twinkle` | 30s / 4s | Glowing orbs with parallax + twinkling star particles           |
| 3     | `.main::before` | `aurora-shimmer`                | 20s      | Purple/orange gradient sweep with hue rotation                  |

### Animation Keyframes Reference

```css
/* Light Mode */
aurora-drift    — 35s slow transform (translate, rotate, scale)
orb-float       — 25s gentle bobbing motion with translate offsets
prismatic-sweep — 12s background-position sweep with subtle hue-rotate filter
ambient-pulse   — Subtle brightness pulse for depth

/* Dark Mode */
nebula-drift    — 40s cosmic cloud movement with rotation
cosmic-float    — 30s gentle stellar motion
star-twinkle    — 4s rapid opacity pulsing for star sparkle
aurora-shimmer  — 20s gradient sweep with hue rotation
```

### Accessibility

All animations respect `prefers-reduced-motion: reduce` — animations are disabled for users who prefer reduced motion.

### Brand Colors Used

- Purple nebula: `rgba(129, 105, 197, 0.xx)` / `rgba(94, 65, 162, 0.xx)`
- Lavender accent: `rgba(167, 139, 250, 0.xx)`
- Orange/gold warm tones: `rgba(255, 153, 0, 0.xx)` / `rgba(255, 180, 100, 0.xx)`

## 🎨 WebGL Visual Effects Architecture

The site features **five WebGL particle and shader systems** with modular scene architecture. See **[WEBGL_ARCHITECTURE.md](../WEBGL_ARCHITECTURE.md)** for comprehensive integration guide, lifecycle documentation, DOM patterns, color palette system, and troubleshooting.

### Quick Reference (2 Live + 3 Ready)

| Scene              | Purpose                      | DOM Hook                    | Status   | Reference                                                              |
| ------------------ | ---------------------------- | --------------------------- | -------- | ---------------------------------------------------------------------- |
| **Constellation**  | Animated particle field      | `[data-constellation]`      | ✅ Live  | [WEBGL_ARCHITECTURE.md](../WEBGL_ARCHITECTURE.md#constellation-scene)  |
| **Orbit**          | Builder card particle system | `[data-orbit-scene]`        | ✅ Live  | [WEBGL_ARCHITECTURE.md](../WEBGL_ARCHITECTURE.md#orbit-scene)          |
| **Transition**     | Page navigation overlay      | `#webgl-transition-overlay` | ✅ Live  | [WEBGL_ARCHITECTURE.md](../WEBGL_ARCHITECTURE.md#transition-scene)     |
| **Skills Network** | Force-directed skill graph   | `[data-skills-network]`     | ❌ Ready | [WEBGL_ARCHITECTURE.md](../WEBGL_ARCHITECTURE.md#skills-network-scene) |
| **Ripple**         | Interactive card animations  | `[data-ripple]`             | ❌ Ready | [WEBGL_ARCHITECTURE.md](../WEBGL_ARCHITECTURE.md#ripple-scene)         |

**Architecture Foundation**: BaseScene.js (430 lines) with lifecycle methods and WebGL utilities. SceneInitializer.js orchestrates auto-detection and initialization via `data-*` attributes.

**Known Issues**:

- **Purple particles instead of teal**: Browser cache serving old code. Hard refresh (Cmd+Shift+R) and rebuild with `hugo --minify`
- **Canvas off-center**: Canvas sizing responsive (120-240px clamp). See [RESPONSIVE_ORBIT_FIX.md](../RESPONSIVE_ORBIT_FIX.md)
- **No particles rendering**: Check browser console for `[WebGL]` or `[Constellation]` initialization messages, verify `data-*` attribute present in DOM

## ⚠️ Protected Styles — Do Not Modify

The following CSS rules are marked `PROTECTED` and use `!important` to prevent accidental breakage:

| File                                                     | Rule                   | Purpose                                                                               |
| -------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `themes/bryan-chasko-theme/assets/css/common/header.css` | `.logo img, .logo svg` | Logo/favicon sizing (26px height). Without explicit dimensions the icon disappears.   |
| `themes/bryan-chasko-theme/assets/css/common/header.css` | Mobile nav `@media`    | Navigation stays on single line on mobile; uses `!important` to override base styles. |

**Before editing header or logo styles:**

1. Check `header.css` for the `PROTECTED` comment block.
2. Test on localhost:1313 that the logo icon displays next to "Home".
3. Never remove `height`, `width`, or `display` properties from `.logo img, .logo svg`.

If the logo/favicon disappears after a CSS change, restore the protected block from git history or re-add:

```css
.logo img,
.logo svg {
  display: inline-block !important;
  height: 26px !important;
  width: auto !important;
}
```

### Mobile Navigation

Mobile responsive navigation (≤480px) uses `!important` declarations to ensure the nav stays on a single line:

- **Logo**: Uppercase "HOME" with matching font-size to menu items
- **CCC abbreviation**: Uses `font-size: inherit` to match other nav items
- **Flex layout**: `flex-wrap: nowrap !important` prevents stacking
- **Gap/padding**: Reduced to fit all items on narrow screens

Key file: [themes/bryan-chasko-theme/assets/css/common/header.css](../themes/bryan-chasko-theme/assets/css/common/header.css) — look for `@media (max-width: 480px)` block.
