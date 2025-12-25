

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
hugo && aws s3 sync public/ s3://bryanchasko.com --profile websites-bryanchasko

## 🏗️ Architecture Diagrams

### Website Architecture

```mermaid
%%{init: {'flowchart': {'curve': 'linear'}, 'theme': 'base', 'themeVariables': {'fontSize': '16px', 'fontFamily': 'arial', 'lineColor': '#d8bfd8'}}}%%
graph TB
    A["🌐 User<br/>Browser"] -->|HTTPS| B["🔍 Route 53<br/>DNS"]
    B -->|Resolves| C["⚡ CloudFront<br/>CDN"]
    C -->|Edge Logic| D["λ CloudFront<br/>Functions"]
    D -->|SigV4 Signed| E["📦 S3<br/>Bucket"]
    
    style A fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    style B fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style C fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style D fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    style F fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
## 🚀 How to Replicate This Stack for Your Own Site

  "SITE_DISTRIBUTION_ID": "E1ABC2DEF3GHIJ",
```
```json
- Deployment to S3, CloudFront, and Route 53 is documented in `README_HOSTING.md`. Follow that guide for production deployment steps.
**Troubleshooting checklist**

  "SITE_DOMAIN": "[your-site-domain]",
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
    perl scripts/deploy.pl --profile websites-bryanchasko --verbose

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
      /* Lines 701-704 omitted */
      "AWS_REGION": "us-west-2"
    }
    ```

    **Never hardcode ARNs, bucket names, or distribution IDs in public code.**

    **For Complete CI/CD Setup Details**: See [CI_CD_SETUP.md](CI_CD_SETUP.md)

    **Contributing**

    - Fork → Branch → PR. Keep changes focused: templates, CSS in `assets/` or `layouts/`, and content in `content/`.
    - Run the site locally to verify changes: `hugo server --config hugo.toml -D`.
    - **IMPORTANT**: Don't push to main without:
      /* Lines 717-745 omitted */
    Thank you — happy hacking! 🎉