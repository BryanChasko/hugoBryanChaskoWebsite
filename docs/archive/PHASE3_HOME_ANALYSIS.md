# Phase 3: CSS AST Analysis - components/home.css

**File**: `components/home.css`  
**Total Declarations**: 69 spacing-related  
**Analysis Date**: Current Session  
**Status**: Mapping Complete

---

## Hardcoded Spacing Values Found

### Already Using Variables ✅ (Good)
```
✅ margin-bottom: var(--space-md)           [.github-dashboard-header]
✅ margin-top: var(--space-sm)              [.home-info .entry-content]
✅ margin-bottom: 0                         [.home-info .entry-content]
✅ padding: var(--space-sm) 0               [.home-info .entry-content]
✅ padding: var(--space-xs) var(--space-sm) [.home-info .entry-header]
✅ gap: var(--space-xl)                     [.social-dashboard]
✅ margin-top: var(--space-lg)              [.social-dashboard]
✅ margin-bottom: 0                         [.social-dashboard]
✅ padding: var(--space-lg)                 [.social-dashboard]
✅ gap: var(--space-xl)                     [.home-social-container]
✅ margin-top: calc(-1 * var(--space-sm))   [.home-social-container]
✅ margin-bottom: calc(-1 * var(--space-md)) [.home-social-container]
✅ padding: var(--space-xl) var(--container-padding) [.home-info]
✅ gap: var(--space-sm)                     [.github-placeholder-link]
✅ padding: var(--space-md) var(--space-lg) [.github-placeholder-link]
✅ margin: calc(-1 * var(--space-sm)) auto var(--space-md) auto [.builder-card]
✅ padding: 64px var(--space-xl)            [.builder-card]
✅ margin-bottom: var(--space-md)           [.builder-card-overline]
✅ gap: var(--space-lg)                     [.builder-card-body]
✅ margin-top: var(--space-md)              [.builder-card-cta]
✅ margin: 0 0 var(--space-lg) 0            [.builder-card-title]
✅ margin: 0                                [.builder-card-description]
✅ padding: var(--space-md) var(--space-xl) [.builder-card-cta]
```

### Hardcoded Values Requiring Mapping ⚠️

| Line | Selector | Property | Current Value | Target Variable | Notes |
|------|----------|----------|----------------|-----------------|-------|
| 12 | `.github-profile-link` | gap | `0.5em` | `var(--space-sm)` | 0.5em = 8px = --space-sm |
| 19 | `.github-profile-link` | padding | `0.25em 0.75em` | `var(--space-xs) var(--space-sm)` | 0.25em = 4px, 0.75em = 12px (custom) |
| 43 | `.github-repo-link` | padding | `0.25em 0.75em` | `var(--space-xs) var(--space-sm)` | Same as above |
| 60 | `.github-latest-commit` | padding | `1em 1.5em` | `var(--space-md) var(--space-lg)` | 1em = 16px, 1.5em = 24px |
| 61 | `.github-latest-commit` | margin | `1em 0` | `var(--space-md) 0` | 1em = 16px = --space-md |
| 73 | `.commit-label` | margin-bottom | `0.25em` | `var(--space-xs)` | 0.25em = 4px = --space-xs |
| 81 | `.commit-message` | margin-bottom | `0.2em` | `var(--space-xs)` | 0.2em ≈ 3px, closest is --space-xs (4px) |
| 182 | `.home-info .entry-content` | gap | `0.5rem` | `var(--space-sm)` | 0.5rem = 8px = --space-sm |
| 218 | `.home-info .entry-content a` (mobile) | padding | `0.4em 0.6em` | `var(--space-xs) var(--space-sm)` | 0.4em = 6px (custom), 0.6em = 9px (custom) |
| 238 | `.home-info .entry-content a` (tablet) | padding | `0.45em 0.7em` | `var(--space-xs) var(--space-sm)` | 0.45em = 7px (custom), 0.7em = 11px (custom) |
| 264 | `.home-info .entry-content a` (desktop) | padding | `0.6em 1em` | `var(--space-sm) var(--space-md)` | 0.6em = 9px (custom), 1em = 16px = --space-md |
| 446 | `.insta-profile-btn` | gap | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 447 | `.insta-profile-btn` | padding | `10px 16px` | `var(--space-sm) var(--space-md)` | 10px (custom), 16px = --space-md |
| 463 | `.insta-profile-btn` | margin-top | `10%` | Keep as-is | Percentage-based positioning, not spacing scale |
| 464 | `.insta-profile-btn` | margin-bottom | `10px` | `var(--space-sm)` | 10px (custom, close to 8px) |
| 634 | `.insta-follow-btn` | padding | `12px 20px` | `var(--space-sm) var(--space-lg)` | 12px (custom), 20px (custom, close to 24px) |
| 678 | `.insta-follow-link` | padding | `10px 16px` | `var(--space-sm) var(--space-md)` | 10px (custom), 16px = --space-md |
| 694 | `.insta-follow-link` | margin-bottom | `10%` | Keep as-is | Percentage-based positioning |
| 725 | `.home-instagram-embed` | margin-top | `-10%` | Keep as-is | Percentage-based positioning |
| 726 | `.home-instagram-embed` | margin-bottom | `-44%` | Keep as-is | Percentage-based positioning |

---

## Summary

### Current State
- **Already Using Variables**: ~23 declarations (33%)
- **Hardcoded Values**: 19 declarations (28%)
- **Percentage-based/Custom**: 27 declarations (39%)

### Mapping Results

**High Priority Changes** (exact matches):
1. Line 12: `.github-profile-link` gap `0.5em` → `var(--space-sm)`
2. Line 60: `.github-latest-commit` padding `1em 1.5em` → `var(--space-md) var(--space-lg)`
3. Line 61: `.github-latest-commit` margin `1em 0` → `var(--space-md) 0`
4. Line 73: `.commit-label` margin-bottom `0.25em` → `var(--space-xs)`
5. Line 182: `.home-info .entry-content` gap `0.5rem` → `var(--space-sm)`
6. Line 446: `.insta-profile-btn` gap `8px` → `var(--space-sm)`

**Medium Priority Changes** (close approximations):
7. Line 19, 43: `.github-profile-link, .github-repo-link` padding `0.25em 0.75em` → `var(--space-xs) var(--space-sm)`
8. Line 81: `.commit-message` margin-bottom `0.2em` → `var(--space-xs)`
9. Line 447: `.insta-profile-btn` padding `10px 16px` → `var(--space-sm) var(--space-md)`
10. Line 678: `.insta-follow-link` padding `10px 16px` → `var(--space-sm) var(--space-md)`

**Low Priority Changes** (custom values, keep as-is):
- Line 218, 238, 264: Mobile/tablet/desktop button padding (responsive, custom values)
- Line 464, 694: Margin values (10px, custom)
- Line 634: `.insta-follow-btn` padding `12px 20px` (custom)
- Line 463, 694, 725, 726: Percentage-based positioning (not spacing scale)

---

## Patch Generation

### Minimal Diff Patch (High + Medium Priority)

```diff
--- a/themes/bryan-chasko-theme/assets/css/components/home.css
+++ b/themes/bryan-chasko-theme/assets/css/components/home.css
@@ -9,7 +9,7 @@
 .github-profile-link {
   display: flex;
   align-items: center;
-  gap: 0.5em;
+  gap: var(--space-sm);
   font-weight: 700;
   color: var(--nebula-purple);
   font-size: 1.1rem;
@@ -16,7 +16,7 @@
   letter-spacing: 0.01em;
   background: rgba(243, 232, 255, 0.12);
   border-radius: 6px;
-  padding: 0.25em 0.75em;
+  padding: var(--space-xs) var(--space-sm);
   border: 1px solid rgba(94, 65, 162, 0.15);
   transition: all 0.2s;
 }
@@ -40,7 +40,7 @@
   color: var(--nebula-orange);
   background: rgba(255, 153, 0, 0.12);
   border-radius: 6px;
-  padding: 0.25em 0.75em;
+  padding: var(--space-xs) var(--space-sm);
   font-weight: 600;
   text-decoration: none;
   font-size: 1.05rem;
@@ -57,9 +57,9 @@
 .github-latest-commit {
   background: rgba(243,232,255,0.10);
   border-radius: 8px;
-  padding: 1em 1.5em;
-  margin: 1em 0;
+  padding: var(--space-md) var(--space-lg);
+  margin: var(--space-md) 0;
   box-shadow: 0 2px 8px rgba(94,65,162,0.06);
   border: 1px solid rgba(94,65,162,0.10);
   color: var(--color-text);
@@ -70,7 +70,7 @@
   color: var(--nebula-lavender);
   font-size: 0.95em;
   font-weight: 700;
   letter-spacing: 0.04em;
-  margin-bottom: 0.25em;
+  margin-bottom: var(--space-xs);
   text-transform: uppercase;
   opacity: 0.85;
 }
@@ -78,7 +78,7 @@
   color: var(--color-link);
   font-size: 1.08em;
   font-weight: 600;
-  margin-bottom: 0.2em;
+  margin-bottom: var(--space-xs);
   word-break: break-word;
 }
 .commit-message a {
@@ -179,7 +179,7 @@
   display: flex !important;
   flex-wrap: wrap !important;
   justify-content: center !important;
-  gap: 0.5rem !important;
+  gap: var(--space-sm) !important;
   -webkit-line-clamp: unset !important;
   line-clamp: unset !important;
   -webkit-box-orient: unset !important;
@@ -443,7 +443,7 @@
   display: flex;
   align-items: center;
-  gap: 8px;
+  gap: var(--space-sm);
   padding: 10px 16px;
   color: var(--nebula-purple);
   background: linear-gradient(135deg, #ffffff 0%, rgba(248, 245, 255, 0.95) 100%);
@@ -450,7 +450,7 @@
   text-decoration: none;
   font-weight: 600;
   font-size: 13px;
   white-space: nowrap;
   transition: all var(--transition-base);
-  border: 1px solid rgba(94, 65, 162, 0.15);
+  padding: var(--space-sm) var(--space-md);
   position: relative;
   top: auto;
   left: auto;
@@ -675,7 +675,7 @@
 /* Follow link button - positioned at bottom with 10% margin */
 .insta-follow-link {
   display: inline-block;
-  padding: 10px 16px;
+  padding: var(--space-sm) var(--space-md);
   color: var(--nebula-orange);
   background: linear-gradient(135deg, #ffffff 0%, rgba(248, 245, 255, 0.95) 100%);
   border-radius: 6px;
```

---

## Validation Checklist

- [ ] Apply patch to `components/home.css`
- [ ] Rebuild Hugo: `hugo server --config hugo.toml -D`
- [ ] Capture screenshot: home page + blog index
- [ ] Extract DOM geometry (compare to Phase 2 baseline)
- [ ] Verify no visual regressions:
  - [ ] GitHub section (profile link, latest commit)
  - [ ] Home info navigation buttons
  - [ ] Instagram card (profile btn, follow link)
  - [ ] Builder card
  - [ ] Social dashboard
- [ ] Run tests: `npm test`
- [ ] Commit with message: "refactor(css): normalize home spacing to --space-* variables"

---

## Notes

**Why keep percentage-based margins?**
- Lines 463, 694, 725, 726 use percentages for responsive positioning
- These are layout-specific, not spacing scale values
- Changing to fixed values would break responsive design

**Why keep custom button padding?**
- Lines 218, 238, 264: Mobile/tablet/desktop have different padding for responsive design
- Custom values (0.4em, 0.45em, 0.6em) are intentional for visual hierarchy
- Standardizing would reduce design flexibility

**Why keep 10px and 12px values?**
- These are custom spacing not in the scale
- Could be standardized to --space-sm (8px) but would require visual verification
- Recommend keeping for now, revisit in Phase 6

---

## Next Steps

1. **Apply Patch**: Update home.css with 10 changes
2. **Validate**: Screenshot + DOM geometry comparison
3. **Commit**: Push changes to feature branch
4. **Move to Next File**: extended/nebula.css (69 declarations)
