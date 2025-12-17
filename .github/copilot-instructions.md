# Copilot Instructions for Bryan Chasko Portfolio Site

## Project Overview

Hugo-based static site for Bryan Chasko's portfolio and Cloudcroft Cloud Company consulting services. Deployed to AWS S3 + CloudFront, served at https://bryanchasko.com.

## Architecture & Key Directories

- **Content**: [content/](../content/) organized by section:
  - `blog/posts/` - Personal blog posts (About, Skills, AWS projects)
  - `cloudcroft-cloud-company/` - Main consulting landing page
  - `help-services/` - Individual service offering pages
  - `contact/`, `topics/` - Static pages
- **Theme**: PaperMod theme in [themes/PaperMod/](../themes/PaperMod/) (Git submodule)
- **Layouts**: Custom shortcodes in [layouts/shortcodes/](../layouts/shortcodes/)
- **Build Output**: [public/](../public/) - Git-tracked static files for deployment
- **AWS Configs**: Gitignored files (`*-config.json`, `_AWS_ENVIRONMENT_DETAILS.md`) for infrastructure

## Development Workflow

**Local Development:**

```bash
hugo server --config hugo.toml
# Runs on http://localhost:1313
```

**Production Build:**

```bash
hugo  # Outputs to public/
```

**Deploy to AWS:**

```bash
hugo && aws s3 sync public/ s3://bryanchasko.com
```

**Note:** Dev server auto-rebuilds on file changes. Check [hugo.out](../hugo.out) for build logs if needed.

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

## AWS Infrastructure (Reference Only)

- **S3 Bucket**: `bryanchasko.com` (us-west-2) - Static website hosting enabled
- **CloudFront**: Distribution with ACM cert for HTTPS
- **Route 53**: DNS managed, A record alias to S3/CloudFront
- **Deployment**: See [\_README_HOSTING.md](../_README_HOSTING.md) for full AWS setup steps

**Critical:** AWS config files are gitignored but present locally. Never commit secrets or ARNs to public repo.

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

- Override PaperMod layouts by creating matching files in [layouts/](../layouts/)
- Custom CSS: [assets/css/extended/help.css](../assets/css/extended/help.css)

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
