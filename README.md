# Bryan Chasko - Cloudcroft Cloud Company 🌿🌸

Development Command:
hugo server --config hugo.toml

Production Command:
hugo --minify --gc

Deploy Command:
hugo && aws s3 sync public/ s3://bryanchasko.com --profile aerospaceug-admin

## Theme Development 🎨

This site uses the custom **bryan-chasko-theme** with modular architecture and Nebula color palette.

**Current Status**: Phase 1 Complete - Theme forked from PaperMod with customizations extracted

**Completed:**
- ✅ [#1 Create Custom Theme Repository](.github/issues/01-create-custom-theme-repository.md)
- ✅ [#2 Extract Current Overrides](.github/issues/02-extract-current-overrides.md)

**In Progress:**
- ⏳ [#3 Modular CSS Architecture](.github/issues/03-modular-css-architecture.md)
- ⏳ [#4 Nebula Color Theme](.github/issues/04-nebula-color-theme.md)
- ⏳ [#5 Responsive Table of Contents](.github/issues/05-responsive-table-of-contents.md)
- ⏳ [#6 Component Documentation](.github/issues/06-component-documentation.md)
- ⏳ [#7 Theme README and Configuration](.github/issues/07-theme-readme-and-configuration.md)
- ⏳ [#8 Integration Testing and Deployment](.github/issues/08-integration-testing-and-deployment.md)

Full roadmap: [THEME_DEVELOPMENT.md](THEME_DEVELOPMENT.md)

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

**Contributing**

- Fork -> Branch -> PR. Keep changes focused: templates, CSS in `assets/` or `layouts/`, and content in `content/`.
- Run the site locally to verify changes: `hugo server --config hugo.toml -D`.

**Useful commands**

- Start dev server: `hugo server --config hugo.toml -D --themesDir ./themes`
- Build site: `hugo --config hugo.toml`
- Add PaperMod (quick): `git clone https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod`

---

If you'd like, I can also:
- add a short `DEVELOPER.md` with more debugging steps, or
- convert theme installation to a submodule and commit the change for you.

Thank you — happy hacking! 🎉