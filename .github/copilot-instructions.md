# Copilot Instructions for Bryan Chasko Portfolio Site

## Project Overview

Hugo-based static site for Bryan Chasko's portfolio and Cloudcroft Cloud Company consulting services. Deployed to AWS S3 + CloudFront, served at https://bryanchasko.com.

## Architecture & Key Directories

- **Content**: [content/](../content/) organized by section:
  - `blog/posts/` - Personal blog posts (About, Skills, AWS projects)
  - `cloudcroft-cloud-company/` - Main consulting landing page
  - `help-services/` - Individual service offering pages
  - `contact/`, `topics/` - Static pages
- **Data Files**: [data/](../data/) for external content feeds:
  - `builder_posts.yaml` - AWS Builder Center profile & articles
  - `linkedin_posts.yaml` - LinkedIn profile & featured activity
- **Theme**: Custom bryan-chasko-theme in [themes/bryan-chasko-theme/](../themes/bryan-chasko-theme/) (PaperMod fork)
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

- ENV: `SITE_DOMAIN`, `SITE_BUCKET`, `SITE_DISTRIBUTION_ID`, `AWS_PROFILE`, `AWS_REGION` (optional: `SITE_PARAM_PATH`)
- Home file: `~/.bcc-site/config.json` with the same keys (kept outside the repo)
- SSM: Store under `/sites/<domain>/` keys like `s3_bucket`, `domain`, `cloudfront_distribution_id`

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

# normal deploy
perl scripts/deploy.pl --profile aerospaceug-admin

# verbose deploy (shows CloudFront lookup, useful for debugging)
perl scripts/deploy.pl --profile aerospaceug-admin --verbose
```

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
