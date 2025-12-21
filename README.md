

# Bryan Chasko - Cloudcroft Cloud Company 🌿🌸


---

## 📄 Markdown Style Guide

See [MARKDOWN_GUIDE.md](MARKDOWN_GUIDE.md) for Markdown syntax, formatting, autoformatting, and linting instructions.

---

---


## 🧑‍💻 Agentic Instructions

For focused agent instructions (CSS, setup, CI/CD, etc.), see [agentic_instructions/README.md](agentic_instructions/README.md) for the full menu and links to all fragments.

---

Development Command:
hugo server --config hugo.toml

Production Command:
hugo --minify --gc

Deploy Command:
hugo && aws s3 sync public/ s3://bryanchasko.com --profile aerospaceug-admin

## 🚀 How to Replicate This Stack for Your Own Site

This project is designed to be reproducible for any Hugo site wanting WebGL visual effects with professional testing.

### Prerequisites

- **Hugo**: 0.152.2+ (Extended version with Sass/SCSS support)
- **Node.js**: 18.0.0+ (for Playwright testing)
- **AWS Account**: For S3 baseline storage (optional but recommended for team/CI workflows)
- **Git**: Version control

### Stack Components

| Component | Technology | Purpose |
|-----------|-----------|----------|
| Static Generator | Hugo 0.152.2 | Site building & templating |
| Theme Base | PaperMod (forked) | Starting point for customization |
| WebGL Graphics | ES 2.0 | Particle effects & shaders |
| Test Framework | Playwright 1.40.0 | Cross-browser automation |
| Baseline Storage | AWS S3 | Visual regression screenshots |
| CI/CD | GitHub Actions | Automated test pipeline |
| CSS Architecture | CSS Custom Properties | 3-palette theming system |

### Quick Start for New Project

```bash
# 1. Clone this repo as template
git clone https://github.com/BryanChasko/bryan-chasko-com.git my-new-site
cd my-new-site

# 2. Install Node dependencies (testing infrastructure)
npm install

# 3. Install Playwright browsers
npm run install:browsers

# 4. Update hugo.toml with YOUR domain
# Replace baseURL = "https://bryanchasko.com/" with your domain
# Replace title, author, etc.

# 5. Start Hugo dev server
hugo server --config hugo.toml

# 6. Open http://localhost:1313 and verify WebGL scenes render
```

### Configuration for Your Domain

**Public Repository** (safe to commit):
- `hugo.toml` - Site config, baseURL, theme settings
- `package.json` - npm dependencies
- `playwright.config.js` - Test configuration
- `.github/workflows/webgl-tests.yml` - CI/CD pipeline

**Private Repository/Local Only** (contains secrets - do NOT commit to public repo):
- `~/.bcc-site/config.json` - AWS credentials, S3 bucket names, CloudFront distribution IDs
- `_AWS_ENVIRONMENT_DETAILS.md` - Infrastructure ARNs and setup notes
- `_README_HOSTING.md` - Deployment guide with your specific AWS resources
- `*-config.json` files - CloudFront, DNS, bucket policies

**How This Project Separates Public/Private**:
1. All AWS-specific values live in `.gitignore`d files or `~/.bcc-site/config.json`
2. `scripts/deploy.pl` reads from environment variables → home config → AWS SSM Parameter Store
3. No hardcoded secrets, ARNs, or account IDs in public code

**Example Private Config** (`~/.bcc-site/config.json`):
```json
{
  "SITE_DOMAIN": "yourdomain.com",
  "SITE_BUCKET": "yourdomain.com",
  "SITE_DISTRIBUTION_ID": "E1ABC2DEF3GHIJ",
  "AWS_PROFILE": "your-aws-profile",
  "AWS_REGION": "us-west-2"
}
```

### WebGL Scenes Included

1. **Constellation Background** (132 particles, mouse-reactive)
   - Auto-initializing, no manual setup needed
2. **Orbit Animation** (3 rings, teal/green Vibrant Cosmic palette)
   - Home page builder card with responsive canvas sizing
   - See [Responsive Orbit Fix](RESPONSIVE_ORBIT_FIX.md) for implementation details
3. **Transition Effect** (page navigation pixelated fade)
   - Page-global overlay with shader-based dissolve
4. **Skills Network** (force-directed graph - code ready, needs integration)
   - Force-directed physics simulation, draggable nodes
5. **Ripple Effect** (interactive ripple shader - code ready, needs integration)
   - Blog card animation with interactive ripples

**Architecture & Integration**: See [WEBGL_ARCHITECTURE.md](WEBGL_ARCHITECTURE.md) for complete reference including DOM hooks, CSS variables, and integration patterns.

### Testing & Quality Assurance

**Automated Test Suite**: Playwright-based visual regression and performance testing
- **Visual Regression**: Screenshot comparison with 5% pixel diff tolerance
- **Performance Budgets**: Orbit init <150ms, FPS >50, memory <200MB
- **Cross-browser**: Chrome, Firefox, Safari consistency checks
- **Regression Prevention**: All WebGL changes must pass tests before deployment (test gate in `scripts/deploy.pl`)
- **CI/CD Integration**: GitHub Actions auto-runs on PR and main branch merge

Full testing guide and regression test details: [TESTING.md](TESTING.md)

### Color Palette System

This site uses a **3-palette architecture** (defined in `themes/bryan-chasko-theme/assets/css/extended/nebula.css`):

1. **Core Brand** - Identity colors (purple, lavender, orange)
2. **Vibrant Cosmic** - WebGL effects (teal, spring green, bright purple)
3. **Soft Tech** - UI components (slate, cyan, gold)

**To customize for your brand**:
1. Edit `variables.css` root color definitions
2. Scenes automatically consume CSS variables via `BaseScene.getThemeColor()`
3. No hardcoded hex literals in JavaScript - all data-driven from CSS

### Testing Infrastructure

**The Rule**: No feature ships without passing tests.

```bash
# Run full test suite (visual regression + performance)
npm test

# Update baselines after intentional visual changes
npm run test:update-baselines
```

**What Gets Tested**:
- WebGL canvas pixel color verification (prevents color regressions)
- Cross-browser rendering (Chrome, Firefox, Safari)
- Performance budgets (init time <150ms, FPS >50, memory <200MB)
- Screenshot comparison against S3-stored baselines

**S3 Baseline Storage Setup**:
```bash
# Create your own baseline bucket (replace with your bucket name)
./scripts/setup-test-bucket.sh --profile your-aws-profile

# Update playwright.config.js with your bucket name:
# process.env.BASELINE_BUCKET = 'your-domain-webgl-baselines'
```

See [`TESTING.md`](TESTING.md) for complete testing guide.

### Deploy Pipeline


The deploy script includes a **test gate** (tests must pass before S3 upload):

```bash
# Standard deploy (tests block if they fail)
# Uses profile/region from ~/.bcc-site/config.json if not specified
perl scripts/deploy.pl --skip-tests --verbose

# Emergency bypass (for hotfixes only)
perl scripts/deploy.pl --skip-tests --profile your-aws-profile --verbose
```

**Configuration Priority:**
1. Command-line arguments
2. Environment variables
3. `~/.bcc-site/config.json`

**Example config file (~/.bcc-site/config.json):**
```json
{
  "AWS_PROFILE": "websites-bryanchasko",
  "AWS_REGION": "us-west-2"
}
```

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for more details.

**Pipeline Order**:
1. Hugo Build (`hugo --minify`)
2. **Test Gate** (`npm test` - BLOCKS on failure)
3. S3 Sync
4. CloudFront Invalidation
5. Baseline Update (main branch auto-update)

See [`scripts/deploy.pl`](scripts/deploy.pl) for configuration options.

### GitHub Actions CI/CD Workflows

Two automated workflows handle testing and deployment:

#### 1. WebGL Tests Workflow (`.github/workflows/webgl-tests.yml`)
- **Trigger**: PR to main, push to main, manual dispatch
- **Matrix**: Chrome, Firefox, Safari (cross-browser validation)
- **Steps**:
  1. Checkout code
  2. Install Node.js + npm dependencies
  3. Install Playwright browsers
  4. Configure AWS credentials (for baseline S3 bucket)
  5. Run visual regression tests against S3-stored baselines
  6. Upload test artifacts (reports, screenshots, diffs)
- **Status Check**: Must pass before merging to main
- **Auto-Update Baselines**: Runs on main branch push (if tests pass)

#### 2. Deploy Workflow (`.github/workflows/deploy.yml`)
- **Trigger**: Push to main branch, manual dispatch
- **Pipeline**:
  1. Checkout code
  2. Setup Hugo (Extended, v0.152.2)
  3. Setup Node.js + install dependencies
  4. Install Playwright browsers
  5. **Run WebGL tests** (test gate - blocks on failure)
  6. Build Hugo site (`hugo --minify`)
  7. Deploy to S3 (`aws s3 sync public/ ...`)
  8. Wait 5 seconds for S3 propagation
  9. Invalidate CloudFront cache (`/*` path)
  10. Update test baselines (main branch only)

**Required Secrets** (set in repo Settings → Secrets and variables → Actions):
```
AWS_ACCESS_KEY_ID          # IAM user for S3 baseline bucket access
AWS_SECRET_ACCESS_KEY      # IAM user secret key
AWS_REGION                 # e.g., us-west-2
```

**S3 Baseline Bucket Setup**:
```bash
# One-time IAM user creation with S3 baseline bucket policy
aws iam create-user --user-name github-actions-webgl-tests --profile aerospaceug-admin

# Attach policy for baseline bucket access
aws iam put-user-policy --user-name github-actions-webgl-tests \
  --policy-name baseline-bucket-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::bryanchasko-com-webgl-baselines",
        "arn:aws:s3:::bryanchasko-com-webgl-baselines/*"
      ]
    }]
  }' --profile aerospaceug-admin

# Create access key for GitHub Actions
aws iam create-access-key --user-name github-actions-webgl-tests \
  --profile aerospaceug-admin

# Copy the AccessKeyId and SecretAccessKey into GitHub Secrets
```

### Common Pitfalls

❌ **Browser cache serving old WebGL code**
- Fix: Hard refresh (Cmd+Shift+R) or disable cache in DevTools
- Verify: Run `npm test` to capture actual canvas pixels

❌ **Hex color parsing in BaseScene**
- Issue: CSS variables use hex format (e.g., `#00CED1`), WebGL needs RGB floats
- Fix: `BaseScene.getThemeColor()` now includes hex-to-RGB converter

❌ **Pointer-events layering (WebGL canvas intercepts clicks)**
- Fix: `pointer-events: none` on container, `pointer-events: auto` on interactive children

❌ **Position: absolute limiting WebGL to parent bounds**
- Fix: Use `position: fixed; width: 100vw; height: 100vh` for full-viewport effects

### Infrastructure Costs (Estimate)

**AWS Resources** (for reference - not a commitment):
- S3 Storage: ~$0.023/GB/month (baseline screenshots ~50MB = ~$0.01/month)
- S3 Requests: ~$0.005/1000 PUT (test runs ~100 PUTs/month = negligible)
- CloudFront: First 1TB free tier, then $0.085/GB
- Route 53: $0.50/month per hosted zone

**Total Estimated Monthly Cost**: <$5/month for small-medium traffic sites

### Where to Find Private Infrastructure Docs

This public repo excludes AWS-specific details. For your own setup:

1. Create a private repo or local directory (e.g., `~/my-site-private/`)
2. Store these files there:
   - `_AWS_ENVIRONMENT_DETAILS.md` - ARNs, account IDs, resource names
   - `_README_HOSTING.md` - Step-by-step AWS setup (S3, CloudFront, Route 53)
   - `bucket-policy.json`, `cloudfront-config.json` - Infrastructure-as-code
   - `~/.bcc-site/config.json` - Deploy script configuration
3. Reference from public README: "See private repo for AWS setup details"

This repo's private docs are in `.gitignore` - you'll create your own versions.

### Next Steps

1. **Verify Current State**: Run `npm test` to confirm WebGL scenes render correctly
2. **Customize Branding**: Update `variables.css` with your color palette
3. **Configure AWS**: Set up S3 bucket, CloudFront, Route 53 (see private `_README_HOSTING.md` template)
4. **Integrate Remaining Scenes**: Skills Network and Ripple scenes are code-complete but need layout hooks
5. **Deploy**: Use `scripts/deploy.pl` with test gate enabled

### Local Cleanup Hook

1. Run `git config core.hooksPath .githooks` once so Git executes the bundled pre-commit hook by default.
2. `scripts/clean-infra-dumps.pl` now removes locally generated infrastructure dumps (`cloudfront-backup*.json`, `current-distribution-config.json`, `fixed-distribution-config.json`) and test logs (`test-*-*.txt`, `test-orbit*.log`) before every commit.
3. The hook runs automatically when `git commit` is invoked, keeping those artifacts out of history even if you forget to delete them manually.
4. Re-run the cleanup script manually if you ever need to scrub existing artifacts: `./scripts/clean-infra-dumps.pl`.

---

## 🎨 WebGL Visual Effects

The site features **three distinct WebGL particle systems**:

1. **Background Constellation** - Animated particle field with mouse interaction behind all content
   - 80 particles with connecting lines (orange/gold theme)
   - Location: `.constellation-hero` container on home page
   - File: `themes/bryan-chasko-theme/static/js/constellation.js`

2. **Orbit Scene** - Multi-orbit animation overlaying AWS Builder Center card
   - 3 concentric orbits, 15 particles each
   - Location: `.builder-card` on home page
   - File: `themes/bryan-chasko-theme/static/js/webgl-scenes/OrbitScene.js`

3. **Transition Scene** - Pixelated fade shader for page navigation
   - Noise texture dissolve effect (300ms duration)
   - Location: Global overlay `#webgl-transition-overlay`
   - File: `themes/bryan-chasko-theme/static/js/webgl-scenes/TransitionScene.js`

See [.github/copilot-instructions.md](.github/copilot-instructions.md#-webgl-visual-effects-architecture) for full architecture documentation.

## Theme Development 🎨

This site uses the custom **bryan-chasko-theme** with modular architecture and Nebula color palette.

**Current Status**: Phase 2 In Progress - Modular CSS and Social Feed components implemented

**Completed:**
- ✅ [#1 Create Custom Theme Repository](.github/issues/01-create-custom-theme-repository.md)
- ✅ [#2 Extract Current Overrides](.github/issues/02-extract-current-overrides.md)
- ✅ [#3 Modular CSS Architecture](.github/issues/03-modular-css-architecture.md) - CSS organized into core/, components/, extended/
- ✅ [#4 Nebula Color Theme](.github/issues/04-nebula-color-theme.md) - Brand colors with light/dark mode support

**In Progress:**
- ⏳ [#5 Responsive Table of Contents](.github/issues/05-responsive-table-of-contents.md)
- ⏳ [#6 Component Documentation](.github/issues/06-component-documentation.md)
- ⏳ [#7 Theme README and Configuration](.github/issues/07-theme-readme-and-configuration.md)
- ⏳ [#8 Integration Testing and Deployment](.github/issues/08-integration-testing-and-deployment.md)

Full roadmap: [THEME_DEVELOPMENT.md](THEME_DEVELOPMENT.md)

## Data-Driven Content 📊

External profile content is managed via Hugo data files in `data/`:

| File | Purpose |
|------|--------|
| `builder_posts.yaml` | AWS Builder Center profile & published articles |
| `linkedin_posts.yaml` | LinkedIn profile info & featured activity |

These power the **Social Feed Heroes** on the `/blog/` page, which prominently display profile cards with CTAs before blog posts.

## Why Hugo and Amazon S3? 🌱

### Hugo 🌻
Hugo is a fast, secure static site generator that converts markdown files into static HTML. It's highly customizable, perfect for creating a personal or business website. Hugo is a highly popular static site generator, created by Steve Francia in 2013 and maintained by Bjørn Erik Pedersen along with other contributors from the community. Francia is from the USA, and Pedersen is from Norway. Hugo is well-regarded for its speed and simplicity, which comes from being written in Go.

In terms of security, Hugo’s use of a static site generator (SSG) approach means that it does not have a backend that can be exploited by attackers. The Department of Defense and other security communities generally advocate for SSGs like Hugo for their inherent security benefits over dynamic content management systems (CMS) because there are fewer vulnerabilities without the presence of a backend and a database.

Statistics supporting Hugo’s choice for a static site include its use by notable high-visibility sites such as Brave (brave.com), DigitalOcean documentation (docs.digitalocean.com), Docker documentation (docs.docker.com), and Kubernetes (kubernetes.io). These sites highlight Hugo’s robustness, performance, and flexibility🌺

### Amazon S3 🌿
Amazon S3 provides scalable object storage with high availability and security. It is cost-effective for static website hosting, ensuring low latency and high performance. 🐾

**Scalability and Availability**  
Amazon S3 automatically scales to handle thousands of requests per second, ensuring that your website remains responsive even during high traffic periods. S3 offers a service level agreement (SLA) of 99.9% availability and is designed for 99.999999999% (11 9's) durability, replicating your data across multiple data centers to prevent data loss.

**Cost-Effective**  
Hosting a static website on Amazon S3 is economical. You only pay for the storage you use and the data transfer out, making it a flexible and budget-friendly option. This contrasts with traditional web hosting, where you might need to over-provision resources to handle peak loads, leading to higher costs.

**Security**  
Amazon S3 supports encryption of data at rest and in transit, ensuring that your data is protected. By serving your site over HTTPS, you can prevent man-in-the-middle (MITM) attacks and ensure data integrity and privacy for your users. AWS Certificate Manager (ACM) allows you to easily provision and manage SSL/TLS certificates for your website.

**Ease of Use**  
Setting up a static website on S3 is straightforward:
1. Create an S3 bucket and enable static website hosting.
2. Upload your website files (HTML, CSS, JavaScript, etc.).
3. Configure the bucket policy to make your files publicly accessible.
# Bryan Chasko - Cloudcroft Cloud Company 🌿🌸

This repository contains the Hugo site for bryanchasko.com. Below are concise, developer-focused instructions to get the site running locally, troubleshoot common issues, and contribute.

**Developer Quickstart**

- **Prerequisites**: Homebrew (macOS) and Git installed. Install Hugo via Homebrew: `brew install hugo`.
- **Clone repo**: `git clone <repo-url> && cd bryan-chasko-com`
- **Start dev server (recommended)**: `hugo server --config hugo.toml -D --themesDir ./themes`
- **Open**: `open http://localhost:1313`

**Configuration files**

- **Primary config**: This project uses `hugo.toml` at the repository root. Older docs mention `config.dev.toml` and `config.prod.toml`; these are optional aliases. Use `--config` to point to any custom config file.
- **If Hugo complains about "Unable to locate config file"**: make sure you run the server from the repository root (where `hugo.toml` lives), or pass `--config ./path/to/config` and `--source ./path/to/site`.

**Themes (PaperMod)**

- The site uses the PaperMod theme. Make sure the theme is available in `themes/PaperMod` or configured as a Hugo Module.
- Quick install (no submodule):

```bash
mkdir -p themes
git clone https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

- To install as a Git submodule (optional):

```bash
# If your .gitignore blocks themes/, remove that entry first or use -f
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
git submodule update --init --recursive
```

- Common theme errors:
  - `module "PaperMod" not found` — theme not present in `themes/` and not configured as a module. Clone or add it as a module.
  - `The following paths are ignored by one of your .gitignore files: themes/PaperMod` — remove the `themes/` ignore line or add the submodule with `-f`.

**Run locally (examples)**

- Start server using root config:

```bash
hugo server --config hugo.toml -D --themesDir ./themes
```

- If you prefer a dev-specific config (copy `hugo.toml` to `config.dev.toml`):

```bash
cp hugo.toml config.dev.toml
hugo server --config config.dev.toml -D --themesDir ./themes
```

- If your Hugo site lives in a subdirectory, point `--source`:

```bash
hugo server --source ./site-subdir --config ./site-subdir/hugo.toml -D
```

**Build for production**

- Generate static files: `hugo --config hugo.toml` (outputs to `public/` by default).
- If you use `config.prod.toml`: `hugo --config config.prod.toml`.

**Deploy**

- Deployment to S3, CloudFront, and Route 53 is documented in `README_HOSTING.md`. Follow that guide for production deployment steps.

**Adding content**

- Create a new post: `hugo new blog/posts/my-new-post.md` and edit the file in `content/`.
- For index/home content, edit `content/_index.md`.

**Troubleshooting checklist**

- Hugo reports missing config: confirm current working dir contains `hugo.toml` or pass `--config`/`--source`.
- Theme errors: ensure `themes/PaperMod` exists (clone or submodule) or add PaperMod as a Hugo module in `hugo.toml`.
- `.gitignore` blocks `themes/`: remove that line before adding a submodule, or clone the theme manually and commit it.

## 🚀 Deployment & Best Practices

### Deployment Workflow

**ALWAYS follow this workflow to prevent broken code in production:**

```
Feature Branch → Test Locally → Pull Request → Human Review → Merge to main → Deploy
```

See [**DEPLOYMENT.md**](DEPLOYMENT.md) for complete deployment guide including:
- ✅ Feature branch workflow requirements
- ✅ Pre-deployment checklist (tests must pass)
- ✅ How to use `scripts/deploy.pl` safely
- ✅ CloudFront cache invalidation
- ✅ Rollback procedures

### Quick Deploy

```bash
# 1. Ensure working on main and all tests pass
git status
npm test

# 2. Deploy to production (includes test gate)
perl scripts/deploy.pl --profile aerospaceug-admin --verbose

# 3. Verify site is live
curl -I https://bryanchasko.com/
```

## 🏗️ AWS Architecture

This site uses a modern, secure AWS architecture:

- **S3 Bucket** (`[your-site-domain]`) - Private bucket (Block Public Access enabled)
- **Origin Access Control** (`[YOUR-OAC-ID]`) - SigV4-signed CloudFront access
- **CloudFront Distribution** (`[YOUR-DISTRIBUTION-ID]`) - Global CDN for fast delivery
- **Route 53** - DNS routing to CloudFront
- **ACM Certificate** - Free SSL/TLS with auto-renewal

**Why this setup?**
- ✅ No public S3 URLs (private bucket)
- ✅ CloudFront caches content globally (fast)
- ✅ OAC signs requests securely (SigV4)
- ✅ Only ~$1.50/month cost (S3 + CloudFront + DNS)

See [**AWS_ARCHITECTURE.md**](AWS_ARCHITECTURE.md) for complete architecture documentation.

## 🔐 Security & Secrets Management

**Never commit AWS credentials or account-specific data to GitHub.**

### What's Gitignored (Account-Specific)
- `_README_HOSTING.md` - Deployment instructions
- `_AWS_ENVIRONMENT_DETAILS.md` - Account details
- `bucket-policy.json`, `cloudfront-config.json` - Infrastructure configs
- All `*-config.json` files

### Configuration
Use `~/.bcc-site/config.json` for your AWS settings (not in GitHub):

```json
{
  "SITE_DOMAIN": "[your-site-domain]",
  "SITE_BUCKET": "[your-site-domain]",
  "SITE_DISTRIBUTION_ID": "[YOUR-DISTRIBUTION-ID]",  // Store in Parameter Store only, never in public docs
  "AWS_PROFILE": "[YOUR-AWS-PROFILE]",
  "AWS_REGION": "us-west-2"
}
```

**Never hardcode ARNs, bucket names, or distribution IDs in public code.**

**For Complete CI/CD Setup Details**: See [CI_CD_SETUP.md](CI_CD_SETUP.md)

**Contributing**

- Fork → Branch → PR. Keep changes focused: templates, CSS in `assets/` or `layouts/`, and content in `content/`.
- Run the site locally to verify changes: `hugo server --config hugo.toml -D`.
- **IMPORTANT**: Don't push to main without:
  - All tests passing: `npm test`
  - Creating a Pull Request (for human review)
  - Verification of changes in a browser

**Useful commands**

- Start dev server: `hugo server --config hugo.toml -D --themesDir ./themes`
- Build site: `hugo --config hugo.toml`
- Add PaperMod (quick): `git clone https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod`
- Run tests: `npm test` (must pass before deploy)
- Deploy: `perl scripts/deploy.pl --profile aerospaceug-admin`

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md) | Feature branches, pull requests, code review, commit conventions, incident response |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Feature branch workflow, pre-deployment checklist, deployment procedures |
| [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) | CloudFront + OAC + S3 architecture, security guarantees, cost analysis |
| [SECURITY.md](SECURITY.md) | Secrets management, AWS credentials, incident response |
| [TESTING.md](TESTING.md) | WebGL visual regression testing, Playwright setup, baseline management |
| [THEME_DEVELOPMENT.md](THEME_DEVELOPMENT.md) | Theme customization roadmap and progress |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Development environment setup, WebGL architecture, testing philosophy |

---

Thank you — happy hacking! 🎉