# Agent Instructions: Project Setup (Fragment)

## Purpose

Guidance for AI agents on project environment setup, toolchain, and configuration for this Hugo/Node.js/Perl/AWS project.

---

## Environment Requirements

- **Hugo**: 0.152.2+ (Extended)
- **Node.js**: 18.0.0+
- **Perl**: 5.26+
- **AWS CLI**: v2+

## Setup Steps

1. Install Node dependencies: `npm install`
2. Install Playwright browsers: `npm run install:browsers`
3. Verify Hugo: `hugo version` (should show Extended)
4. Build once: `hugo --minify`
5. Configure AWS credentials in `~/.aws/credentials` (never commit)
6. For CI/CD: Use GitHub Secrets for AWS keys

## Directory Structure

- `themes/bryan-chasko-theme/` (custom theme)
- `content/` (site content)
- `data/` (YAML feeds)
- `scripts/` (Perl automation)
- `public/` (build output)

## Configuration Management

- Prefer AWS SSM Parameter Store for config (see copilot-instructions.md)
- Fallback: `~/.bcc-site/config.json` (not in repo)
- Environment variables override config
- Never hardcode secrets or resource IDs

## References

- [GITHUB_ACTIONS_CHECKLIST.md]
- [DEPLOYMENT.md]

---

**For CSS or CI/CD, see the corresponding agent instruction fragment.**
