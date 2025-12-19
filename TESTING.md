# WebGL Testing Infrastructure

Automated visual regression and performance testing for WebGL scenes using Playwright.

**Philosophy**: "No more unsubstantiated claims" — All WebGL changes are visually verified with pixel-perfect tests before deployment.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install:browsers

# Create S3 bucket for baselines (first-time setup)
./scripts/setup-test-bucket.sh --profile aerospaceug-admin

# Run all tests
npm test

# Run specific browser
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Update baselines (after intentional visual changes)
npm run test:update-baselines
```

## Test Coverage

### Visual Regression Tests (`tests/webgl/orbit-scene.spec.js`)

- ✅ Screenshot comparison against S3-stored baselines (5% pixel diff tolerance)
- ✅ WebGL canvas pixel color validation (teal #00CED1, green #00FA9A)
- ✅ Cross-browser rendering consistency (Chrome, Firefox, Safari)
- ✅ CSS color variable format verification (hex parsing)
- ✅ Scene initialization checks
- ✅ Responsive sizing validation (canvas dimensions, center position recalculation)

**Recent Regression Tests Added** (December 2025):
- OrbitScene.onResize() method validates center position recalculation on window resize
- Responsive canvas sizing between 120-240px validated across viewport sizes
- Orbit radius scaling verified to scale proportionally (no distortion)
- See [RESPONSIVE_ORBIT_FIX.md](RESPONSIVE_ORBIT_FIX.md) for implementation details

### Performance Budget Tests (`tests/webgl/performance.spec.js`)

**Target Hardware: 2020 mid-tier (Intel UHD 620, 8GB RAM)**

- ✅ Orbit init time: <150ms
- ✅ Steady-state FPS: >50 (with headroom below 60Hz vsync)
- ✅ Memory usage: <200MB WebGL memory after 30s runtime
- ✅ Reduced motion accessibility compliance
- ✅ Stress testing (rapid visibility changes)
- ✅ Responsive resize performance (no frame drops during resize)

## S3 Baseline Storage

### Configuration

- **Bucket**: `bryanchasko-com-webgl-baselines`
- **Region**: `us-west-2`
- **Lifecycle**: 180-day expiration for old versions
- **Encryption**: AES256 server-side encryption
- **Versioning**: Enabled for baseline history

### Baseline Workflow

1. **PR Testing**: Tests compare against latest baselines in S3
2. **Main Branch**: Auto-updates baselines after successful merge
3. **Local Development**: Baselines cached in `tests/.baselines/` for speed

### AWS Credentials

**Local Development:**
```bash
# Use AWS CLI profile (configured in ~/.aws/credentials)
export AWS_PROFILE=aerospaceug-admin
```

**GitHub Actions CI/CD:**
- Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in repository secrets
- GitHub Actions automatically uses these for S3 operations

## GitHub Actions CI/CD

Workflow: [`.github/workflows/webgl-tests.yml`](.github/workflows/webgl-tests.yml)

**Triggers:**
- Pull requests to `main` branch
- Pushes to `main` branch (auto-updates baselines)
- Manual workflow dispatch

**Test Matrix:**
- Chrome (Chromium)
- Firefox (latest)
- Safari (WebKit)

**Artifacts:**
- Test results (JSON + HTML report)
- Screenshots (actual vs. baseline)
- Performance metrics

**PR Comments:**
- Automated test result summary
- Links to detailed reports and visual diffs

## New Project Checklist

Replicating this testing setup for your own Hugo+WebGL site:

### Initial Setup

- [ ] **Install Node.js 18+**: `node --version` should show 18.0.0 or higher
- [ ] **Clone/fork this repo**: `git clone <repo-url> my-new-site`
- [ ] **Install npm dependencies**: `npm install`
- [ ] **Install Playwright browsers**: `npm run install:browsers`
- [ ] **Update hugo.toml**: Replace `baseURL`, `title`, author info with your values
- [ ] **Customize CSS variables**: Edit `themes/bryan-chasko-theme/assets/css/core/variables.css` with your brand colors

### AWS Baseline Storage Setup

- [ ] **Create S3 bucket**: `./scripts/setup-test-bucket.sh --profile your-aws-profile`
- [ ] **Update bucket name**: Edit `playwright.config.js` → `process.env.BASELINE_BUCKET = 'your-domain-webgl-baselines'`
- [ ] **Verify AWS credentials**: Test with `aws s3 ls s3://your-bucket/ --profile your-aws-profile`
- [ ] **Set lifecycle policy**: 180-day retention, Glacier transition (see script comments)

### First Test Run

- [ ] **Build Hugo site**: `hugo --minify` (ensure `public/` has fresh assets)
- [ ] **Run tests**: `npm test` (initial run creates baselines)
- [ ] **Upload baselines to S3**: `npm run test:update-baselines`
- [ ] **Verify S3 upload**: Check bucket in AWS Console for baseline screenshots
- [ ] **Test from S3**: Delete local `tests/.baselines/` and re-run tests (should download from S3)

### GitHub Actions CI/CD

- [ ] **Add GitHub Secrets**: Settings → Secrets → Actions
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (e.g., us-west-2)
- [ ] **Update workflow file**: `.github/workflows/webgl-tests.yml` → replace bucket name references
- [ ] **Test PR workflow**: Open test PR and verify Actions run successfully
- [ ] **Verify baseline auto-update**: Merge to main and check S3 for updated baselines

### Deploy Script Integration

- [ ] **Update deploy.pl config**: Edit `scripts/deploy.pl` or set environment variables
  - `SITE_DOMAIN=yourdomain.com`
  - `SITE_BUCKET=yourdomain.com`
  - `SITE_DISTRIBUTION_ID=E1ABC2DEF3GHIJ`
  - `AWS_PROFILE=your-aws-profile`
- [ ] **Test dry-run**: `perl scripts/deploy.pl --dry-run --verbose`
- [ ] **First deploy with test gate**: `perl scripts/deploy.pl --profile your-aws-profile`
- [ ] **Verify test gate blocks on failure**: Intentionally break test and confirm deploy aborts

### Customization

- [ ] **Adjust performance budgets**: Edit `tests/webgl/performance.spec.js` thresholds for your target hardware
- [ ] **Add scene-specific tests**: Create new test files in `tests/webgl/` for custom WebGL scenes
- [ ] **Update test matrix**: Modify `playwright.config.js` to add/remove browsers
- [ ] **Configure screenshot tolerance**: Adjust `compareImages()` tolerance parameter (default 5%)

## Integration Contracts

Each WebGL scene requires specific DOM hooks and CSS variables to function. Use this reference when integrating new scenes or troubleshooting.

### Constellation Scene

**DOM Hook**: `[data-constellation]` attribute on container element

```html
<div class="constellation-hero" data-constellation>
  <div class="webgl-fallback"></div>
</div>
```

**Required CSS**:
```css
.constellation-hero {
  position: fixed; /* Full viewport */
  width: 100vw;
  height: 100vh;
  z-index: -2; /* Behind all content */
  pointer-events: none; /* Allow clicks to pass through */
}
```

**CSS Variables**:
- `--cosmic-primary` (particle color - orange/gold)
- `--cosmic-accent` (connection lines)

**Test File**: N/A (standalone, self-initializing)
**Status**: ✅ Live and tested

---

### Orbit Scene

**DOM Hook**: `[data-orbit-scene]` attribute on target element

```html
<div class="builder-card" data-orbit-scene>
  <a href="..." class="builder-card-link">
    Card content here
  </a>
</div>
```

**Required CSS**:
```css
.builder-card {
  position: relative; /* Establishes positioning context */
  z-index: 1; /* Content above orbit canvas */
}
```

**CSS Variables**:
- `--cosmic-teal` (#00CED1) - Orbit particle color
- `--cosmic-energy` (#00FA9A) - Center node color

**Test File**: `tests/webgl/orbit-scene.spec.js`
**Test Coverage**: Pixel color validation, cross-browser consistency, screenshot comparison
**Status**: ⚠️ Code deployed, needs verification (user reports colors not visible)

---

### Transition Scene

**DOM Hook**: Global fixed overlay `#webgl-transition-overlay`

```html
<!-- Auto-injected by SceneInitializer, no manual setup needed -->
<div id="webgl-transition-overlay"></div>
```

**Required CSS**:
```css
#webgl-transition-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999; /* Above all content during transition */
  pointer-events: none; /* Allow clicks when invisible */
}
```

**CSS Variables**: N/A (uses noise texture shader, no theme colors)

**Test File**: N/A (functional, no visual regression test)
**Status**: ✅ Functional (texImage2D parameter bug fixed Dec 2024)

---

### Skills Network Scene (Not Yet Integrated)

**DOM Hook**: `[data-skills-network]` attribute on skills page container

```html
<!-- Example integration in skills page layout -->
<div class="skills-network-container" data-skills-network>
  <h2>My Skills</h2>
  <!-- WebGL canvas will overlay this area -->
</div>
```

**Required Data File**: `data/skills-network.yaml`

```yaml
skills:
  - id: "aws-lambda"
    name: "AWS Lambda"
    category: "Cloud"
    connections: ["aws-api-gateway", "dynamodb"]
  - id: "react"
    name: "React"
    category: "Frontend"
    connections: ["typescript", "webpack"]
  # ... 49 total nodes
```

**CSS Variables**:
- `--brand-purple` - Cloud category
- `--brand-orange` - Frontend category
- `--brand-lavender` - Backend category
- (Category colors map to palette)

**Test File**: `tests/webgl/skills-network.spec.js` (to be created)
**Test Coverage**: Node positioning, connection lines, drag interaction, category colors
**Status**: ❌ Code complete, needs `data/skills-network.yaml` + layout integration

---

### Ripple Scene (Not Yet Integrated)

**DOM Hook**: `[data-ripple]` attribute on blog post cards

```html
<!-- Example integration in blog card partial -->
<article class="post-entry" data-ripple>
  <h2 class="entry-title">Post Title</h2>
  <p class="entry-summary">Post summary...</p>
</article>
```

**Required CSS**:
```css
.post-entry {
  position: relative; /* Establishes positioning context */
  overflow: hidden; /* Clip ripple to card bounds */
}
```

**CSS Variables**:
- `--brand-purple` - Ripple wave color
- `--brand-lavender` - Secondary ripple ring

**Test File**: `tests/webgl/ripple-scene.spec.js` (to be created)
**Test Coverage**: Click/touch interaction, ripple animation, boundary clipping
**Status**: ❌ Code complete, needs blog card layout integration (`layouts/_default/single.html`)

---

### Cache Management Best Practices

**Problem**: Browsers aggressively cache JavaScript, causing old WebGL code to run even after deploy.

**Solution Workflow**:
1. **Rebuild Hugo**: `hugo --minify` (clears `public/` and regenerates all assets)
2. **Hard Refresh Browser**: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux)
3. **Disable Cache in DevTools**: Network tab → "Disable cache" checkbox
4. **Verify with Tests**: `npm test` captures actual canvas pixels (ground truth)

**Why Tests Are Critical**: Even if colors "look wrong" in browser, tests extract actual RGB values from canvas. This definitively answers: "Is the bug in the code or just browser cache?"

**Example Debug Workflow**:
```bash
# User reports: "Orbit particles are purple, not teal"

# Step 1: Verify code is correct
grep -A 5 "getThemeColor" themes/bryan-chasko-theme/static/js/webgl-scenes/OrbitScene.js
# Confirms: particleColor = this.getThemeColor('--cosmic-teal')

# Step 2: Check CSS variable definition
grep "cosmic-teal" themes/bryan-chasko-theme/assets/css/core/variables.css
# Confirms: --cosmic-teal: #00CED1;

# Step 3: Run test to capture actual canvas pixels
npm test -- tests/webgl/orbit-scene.spec.js
# Test output: "Expected teal [0, 206, 209], got [94, 65, 162]" (purple!)

# Step 4: Rebuild and hard refresh
hugo --minify
# In browser: Cmd+Shift+R

# Step 5: Re-run test
npm test -- tests/webgl/orbit-scene.spec.js
# Test output: "✓ Teal particle detected at (350, 200)" - PASS

# Conclusion: Browser cache was serving old JavaScript. Tests confirmed.
```

## Deployment Integration

The deploy script ([`scripts/deploy.pl`](scripts/deploy.pl)) includes test gate:

```bash
# Normal deploy (runs tests first)
perl scripts/deploy.pl --profile aerospaceug-admin

# Emergency bypass (skip tests)
perl scripts/deploy.pl --skip-tests --profile aerospaceug-admin
```

**Deployment Flow:**
1. Hugo build (`--minify`)
2. **WebGL tests** (visual regression + performance)
3. S3 sync (`public/` → S3 bucket)
4. CloudFront invalidation (`/*` path)
5. Baseline update (main branch only)

## Configuration Files

- [`package.json`](package.json) - npm dependencies and test scripts
- [`playwright.config.js`](playwright.config.js) - Playwright test runner config
- [`tests/helpers/baseline-manager.js`](tests/helpers/baseline-manager.js) - S3 baseline sync utility

## Regression Testing Implementation Details

### What Regression Testing Prevents

**Visual Regression**:
- Unintended color shifts (e.g., CSS variable change breaks particle appearance)
- Layout shifts in canvas positioning (e.g., off-center orbit due to resize logic)
- Cross-browser rendering differences (Chrome vs Firefox vs Safari)
- Antialiasing artifacts that differ between GPU/OS combinations
- Shader compilation issues on specific drivers

**Performance Regression**:
- Scene initialization time creep (slow GPU detection logic, delayed shader compilation)
- FPS drops due to particle count increases without optimization
- Memory leaks from incomplete cleanup on dispose/visibility change
- Responsive resize performance degradation (dropped frames during viewport changes)

**Documentation**:
- See [RESPONSIVE_ORBIT_FIX.md](RESPONSIVE_ORBIT_FIX.md) for a detailed case study of responsive sizing regression testing (December 2025)

### Test Infrastructure Components

**1. Visual Regression**
- **Tool**: Playwright screenshot capture
- **Comparison**: Pixel-by-pixel comparison against S3 baseline
- **Tolerance**: 5% (accounts for antialiasing variations between browsers)
- **Storage**: AWS S3 `bryanchasko-com-webgl-baselines` bucket with 180-day lifecycle
- **Verification**: RGB tuple extraction from canvas (ground truth for actual rendering)

**2. Performance Budgets**
- **Orbit Init**: <150ms (measured on Intel UHD 620, 2020 mid-tier GPU)
- **FPS**: >50 (headroom below 60Hz vsync to prevent frame drops)
- **WebGL Memory**: <200MB after 30s steady-state runtime
- **Responsive Resize**: No frame drops (<16ms per frame) during viewport changes

**3. Responsive Sizing Validation** (NEW - December 2025)
- **Test File**: `tests/webgl/orbit-scene.spec.js`
- **Coverage**:
  - Canvas sizing: 120-240px (clamp formula validation)
  - Center position recalculation: on window resize, orbit stays centered
  - Orbit radius scaling: proportional to canvas size (no distortion)
  - Viewport sizes tested: 320px (mobile), 768px (tablet), 1920px (desktop)
- **Regression Prevention**: Ensures `OrbitScene.onResize()` handles all viewport changes correctly

**4. Cross-Browser Consistency**
- **Browsers**: Chrome (Chromium), Firefox, Safari (WebKit)
- **Validation**: RGB color values match palette definitions across all browsers
- **Known Variations**: Subpixel rendering causes <2% color variation (within 5% tolerance)

### How the Test Gate Works

**Deploy Script Integration** (scripts/deploy.pl, lines 405-431):
```perl
# Step 1: Build
# Step 1.5: Run WebGL Tests ⬅️ TEST GATE HERE
# Step 2: Upload to S3
# Step 3: Invalidate CloudFront
```

**Behavior**:
1. User runs: `perl scripts/deploy.pl --profile aerospaceug-admin`
2. Hugo builds the site (`hugo --minify`)
3. **TEST GATE EXECUTES**: `npm test` runs all WebGL tests
4. If **ANY TEST FAILS**:
   - Deploy script exits with code 1
   - S3 upload is **SKIPPED**
   - CloudFront invalidation is **SKIPPED**
   - User sees error message with test failure details
5. If **ALL TESTS PASS**:
   - Deploy continues to S3 and CloudFront
   - Deploy completes normally

**Emergency Override**:
```bash
# Skip tests for critical hotfixes (NOT recommended)
perl scripts/deploy.pl --skip-tests --profile aerospaceug-admin
```

### Baseline Update Automation

**Main Branch Auto-Update** (GitHub Actions):
- When PR is merged to `main`, tests pass automatically triggers baseline update
- New baselines are pushed to S3
- All subsequent PRs test against updated baselines
- Ensures baselines stay current with intentional visual changes

**Local Development**:
```bash
# After making intentional visual changes
npm run test:update-baselines
```

## Troubleshooting

### Tests failing with "No baseline found"

**First run creates initial baselines:**
```bash
npm run test:update-baselines
```

**Verify S3 bucket exists and is accessible:**
```bash
aws s3 ls s3://bryanchasko-com-webgl-baselines/ --profile aerospaceug-admin
```

### S3 permission errors

**Check IAM user has S3 baseline bucket access:**
```bash
aws s3api head-bucket --bucket bryanchasko-com-webgl-baselines --profile aerospaceug-admin
```

**Required IAM permissions**:
- `s3:GetObject` (read baselines)
- `s3:PutObject` (write updated baselines)
- `s3:ListBucket` (list baseline directory)

### Visual regression false positives

**Scenario**: Test shows pixel differences after code change, but changes are intentional

**Solution**:
1. Inspect actual vs. baseline in test output
2. Verify pixels match intended colors (check RGB tuples)
3. If intentional, update baselines: `npm run test:update-baselines`
4. Note: Antialiasing variations (<2% color shift) are expected and within 5% tolerance

**Adjust tolerance if needed**:
```javascript
// In tests/webgl/orbit-scene.spec.js
const comparison = await baselineManager.compareImages(screenshot, baseline, 0.10); // 10% tolerance
```

### Performance tests failing on slow CI runners

**Scenario**: Tests pass locally but fail on GitHub Actions

**Root cause**: GitHub Actions runners use shared infrastructure, slower than local development

**Solution**:
```javascript
// In tests/webgl/performance.spec.js
const budget = process.env.CI ? 200 : 150; // Relax budget for CI (ms for orbit init)
```

**Alternative**: Add performance tier detection:
```javascript
const isFastRunner = process.env.CI_PERFORMANCE_TIER === 'fast';
const budget = isFastRunner ? 150 : 200;
```

### Canvas shows old colors despite code change

**Diagnostic Workflow**:
1. Verify code change is correct: `grep "cosmic-teal" themes/bryan-chasko-theme/assets/js/webgl-scenes/OrbitScene.js`
2. Check CSS variable definition: `grep "cosmic-teal" themes/bryan-chasko-theme/assets/css/extended/nebula.css`
3. **Key Step**: Run test to capture actual canvas pixels
   ```bash
   npm test -- tests/webgl/orbit-scene.spec.js
   ```
4. Inspect test output RGB values (ground truth)
5. If test passes with correct colors, browser cache is serving old code:
   - Rebuild: `hugo --minify`
   - Hard refresh: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux)
   - Re-run test to confirm fix

**Why tests are the source of truth**: Tests extract actual RGB values from canvas. If test shows correct colors but browser shows wrong colors, it's 100% a cache issue, not a code bug.

### GitHub Actions workflow not triggering

**Check workflow file exists**:
```bash
ls -la .github/workflows/webgl-tests.yml
```

**Verify secrets are configured**:
```bash
# In GitHub repository settings → Secrets and variables → Actions
# Must have:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - AWS_REGION (optional, default us-west-2)
```

**Troubleshoot PR tests**:
1. Open PR and check Actions tab
2. If workflow doesn't appear, check branch is `main` (workflow triggers only on main)
3. Review `.github/workflows/webgl-tests.yml` for syntax errors
4. Check PR base branch is `main` (not `develop` or other branch)

## Performance Targets

| Metric | Target | Hardware Baseline |
|--------|--------|-------------------|
| Orbit Init Time | <150ms | Intel UHD 620 (2020) |
| Steady-State FPS | >50 fps | Intel UHD 620 (2020) |
| WebGL Memory | <200MB | 8GB RAM system |
| Reduced Motion | Scenes pause | CSS media query |

## Browser Support Matrix

| Browser | Version | WebGL Support | Test Status |
|---------|---------|---------------|-------------|
| Chrome | 90+ | WebGL 2.0 | ✅ Full support |
| Firefox | 88+ | WebGL 2.0 | ✅ Full support |
| Safari | 14+ | WebGL 1.0 | ✅ Basic support |

## References

- [Playwright Documentation](https://playwright.dev/)
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Visual Regression Testing Guide](https://playwright.dev/docs/test-snapshots)
