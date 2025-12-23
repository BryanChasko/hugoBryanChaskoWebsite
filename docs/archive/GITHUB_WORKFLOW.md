# GitHub Workflow & Contributing Guide

## Philosophy

**No broken code reaches production.** Every change goes through:
1. Feature branch (isolated work)
2. Local testing (verify it works)
3. Pull request (document what changed)
4. Human review (peer approval)
5. Automated tests (tests must pass)
6. Deploy to main (only after all checks pass)

## Feature Branch Workflow

### Step 1: Create a Feature Branch

Always create a new branch for your changes:

```bash
# Update main to latest
git pull origin main

# Create a feature branch with a descriptive name
git checkout -b feature/fix-menu-navigation
# OR
git checkout -b bugfix/webgl-canvas-pointer-events
# OR
git checkout -b chore/update-documentation
```

**Naming Convention:**
- `feature/` - New features
- `bugfix/` or `fix/` - Bug fixes
- `chore/` - Maintenance, documentation, tooling
- `docs/` - Documentation-only changes
- `refactor/` - Code refactoring without new features

### Step 2: Make Changes & Test Locally

```bash
# Start dev server
hugo server --config hugo.toml

# In another terminal, run tests
npm test

# Make your changes to code, content, or styles
# Verify in browser: http://localhost:1313

# Commit changes
git add .
git commit -m "Fix: WebGL canvas not clickable due to pointer-events"

# Push to your branch
git push origin feature/fix-menu-navigation
```

### Step 3: Create Pull Request

Go to GitHub and create a Pull Request with:

**PR Title:**
```
Fix: WebGL canvas pointer-events blocking menu clicks
```

**PR Description:**
```markdown
## Problem
The WebGL constellation canvas was blocking clicks on the navigation menu 
because pointer-events wasn't properly configured.

## Solution
- Set pointer-events: none on canvas container (WebGL layer)
- Set pointer-events: auto on interactive children (menu links)
- Verify with Playwright cross-browser tests

## Changes
- Modified: themes/bryan-chasko-theme/assets/css/core/utilities.css
- Verified: npm test passes on chromium, firefox, webkit
- Tested: Menu clicks work on desktop (1920x1080) and mobile (375x812)

## Testing
- [x] All tests passing
- [x] No console errors
- [x] Tested on Chrome, Firefox, Safari
- [x] Mobile viewport verified
```

### Step 4: Wait for Review

**Automated Checks** (GitHub Actions):
- ✅ Tests run automatically on PR
- ✅ Must pass before merge is allowed

**Human Review**:
- Ask a team member to review your changes
- Address any feedback
- Push new commits (they automatically appear in PR)

### Step 5: Merge to Main

Once approved and tests pass:

1. **Squash and merge** (recommended):
   ```
   Squash and merge — Combines all PR commits into one clean commit on main
   ```

2. **Or merge with a merge commit**:
   ```
   Create a merge commit — Preserves individual PR commits
   ```

```bash
# OR merge locally (advanced)
git checkout main
git pull origin main
git merge feature/fix-menu-navigation
git push origin main
```

### Step 6: Deploy to Production

```bash
# Pull latest from main
git checkout main
git pull origin main

# Run tests one more time (safety check)
npm test

# Deploy to production
perl scripts/deploy.pl --profile websites-bryanchasko

# Verify in browser
open https://bryanchasko.com
# OR
curl -I https://bryanchasko.com/
```

## Commit Message Conventions

Use **conventional commits** for clarity:

```
type(scope): subject

body

footer
```

### Examples

**Good commits:**
```
fix(menu): make navigation clickable by adjusting pointer-events
feature(webgl): add ripple effect to blog post cards
docs: update deployment workflow in README
chore(deps): upgrade playwright to v1.42
refactor(css): consolidate theme color variables
```

**Bad commits:**
```
fixed stuff
WIP
update
random changes
```

## Pull Request Standards

### Before Creating PR

- [ ] Code works locally: `hugo server --config hugo.toml`
- [ ] Tests pass: `npm test`
- [ ] No console errors (DevTools)
- [ ] Changes match the scope (don't mix unrelated changes)
- [ ] Commits are clean (meaningful messages)

### PR Checklist

- [ ] Descriptive title (not "Update", "Fix", "WIP")
- [ ] Clear description explaining WHAT and WHY
- [ ] Links to related issues if applicable
- [ ] Before/after screenshots for UI changes
- [ ] Testing notes (browsers tested, edge cases covered)

## Code Review Standards

As a **reviewer**:

- ✅ **Approve if**: Code works, tests pass, no security issues
- ❌ **Request changes if**: Tests fail, console errors, unclear code
- 💬 **Comment if**: Suggestions for improvement (non-blocking)

As an **author**:

- Address all feedback before requesting re-review
- Push new commits (don't force-push unless told to)
- Ask for clarification if feedback is unclear

## Testing Requirements

**All PRs must pass tests before merge:**

```bash
# Run locally before pushing
npm test

# Expected: All tests pass
# ✓ WebGL Orbit Scene - Vibrant Cosmic colors - visual regression
# ✓ WebGL Orbit Scene - performance budgets
# ✓ ... (more tests)
```

**If tests fail:**

1. **Check the error message**:
   ```
   WebGL color test failed: Expected [0,206,209], got [94,65,162]
   ```

2. **Diagnose the issue**:
   - Is this an intentional change? (update baselines)
   - Is this a code bug? (fix the code)
   - Is this a cache issue? (hard refresh browser)

3. **Fix and re-test**:
   ```bash
   npm test  # Re-run tests
   ```

## Emergency: Hotfix to Production

For **critical bugs only**:

```bash
# 1. Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-production-bug

# 2. Fix the issue (minimal change)
# 3. Test thoroughly
npm test

# 4. Push and create PR marked [HOTFIX]
git push origin hotfix/critical-production-bug
# Create PR with title: "[HOTFIX] Description of critical issue"

# 5. Fast-track review (minimal back-and-forth)

# 6. Deploy immediately after merge
perl scripts/deploy.pl --profile websites-bryanchasko --verbose
```

**Use hotfixes sparingly!** They bypass normal review process.

## Feature Branches That Are Blocked (Never Push to Main)

Don't merge these branches to main:

- ❌ Branches with failing tests
- ❌ Branches with console errors
- ❌ Branches with hardcoded AWS credentials
- ❌ Branches with uncommitted or untracked files
- ❌ Branches that mix unrelated features
- ❌ WIP (Work In Progress) branches

## GitHub Actions CI/CD (If Configured)

When you push to a branch or open a PR:

1. **Tests run automatically** (via `.github/workflows/webgl-tests.yml`)
2. **Results appear in PR** as green ✅ or red ❌ checks
3. **Merge is blocked** if any check fails

```
✅ Tests pass
✅ All status checks passed
[Merge pull request] button enabled
```

```
❌ Tests failed
❌ 2 required status checks failed
[Merge pull request] button DISABLED
```

## Avoiding Production Incidents

### Things That Cause Outages (Don't Do These)

1. **Pushing broken code to main**
   - ❌ Code not tested locally
   - ✅ Always run `npm test` before push

2. **Skipping code review**
   - ❌ Self-merging PRs
   - ✅ Wait for human approval

3. **Hardcoding AWS config**
   - ❌ Committing credentials
   - ✅ Use environment variables or config files

4. **Ignoring test failures**
   - ❌ Deploying with `--skip-tests`
   - ✅ Fix the code first

5. **Not verifying deployments**
   - ❌ Deploying and not checking site is up
   - ✅ Always test: `curl -I https://bryanchasko.com/`

### What To Do If Something Breaks

**You have 5 minutes to fix it:**

```bash
# 1. Assess the damage
# Visit https://bryanchasko.com and test key features

# 2. Option A: Quick rollback
git revert <bad-commit-hash>
perl scripts/deploy.pl --profile websites-bryanchasko

# 3. Option B: Hotfix
git checkout -b hotfix/critical-issue
# ... make minimal fix ...
npm test
git push
# ... get instant PR approval ...
perl scripts/deploy.pl --profile websites-bryanchasko

# 4. Notify team
# Post in Slack or Discord that you're fixing it

# 5. Document what happened
# Create an issue explaining the root cause
```

## Common Workflows

### I Want to Add a New Blog Post

```bash
git checkout -b feature/add-blog-post-ai-summary

hugo new blog/posts/my-new-post.md
# Edit content/blog/posts/my-new-post.md

hugo server  # Preview at localhost:1313
npm test     # Tests should still pass

git add content/blog/posts/my-new-post.md
git commit -m "blog: add post about AI summarization"
git push origin feature/add-blog-post-ai-summary
# Create PR on GitHub
```

### I Want to Fix a CSS Bug

```bash
git checkout -b fix/menu-dark-mode-colors

# Edit: themes/bryan-chasko-theme/assets/css/...
# Test locally: hugo server + hard refresh (Cmd+Shift+R)

npm test  # Verify WebGL tests still pass

git add themes/
git commit -m "fix: dark mode menu text now visible"
git push origin fix/menu-dark-mode-colors
# Create PR on GitHub
```

### I Want to Update WebGL Shaders

```bash
git checkout -b feature/orbit-scene-trails

# Edit: themes/bryan-chasko-theme/assets/js/webgl-scenes/OrbitScene.js
# Copy to static: cp themes/.../OrbitScene.js themes/.../static/js/webgl-scenes/
# Rebuild: hugo --minify
# Test: npm test (visual regression validates the shaders)

git add themes/
git commit -m "feature: add particle trails to orbit scene"
git push origin feature/orbit-scene-trails
# Create PR on GitHub
```

## Getting Help

**If you're stuck:**

1. **Check existing PRs** - Is someone already working on this?
2. **Check issues** - Has this been reported before?
3. **Run tests locally** - Do they give you a clue?
4. **Ask in PR comments** - Tag a maintainer for guidance
5. **Check documentation**:
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment issues
   - [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) - Infrastructure questions
   - [TESTING.md](TESTING.md) - Test failures
   - [SECURITY.md](SECURITY.md) - Credentials/secrets

---

**Summary**: Create branch → Test locally → PR → Review → Merge → Deploy ✅
