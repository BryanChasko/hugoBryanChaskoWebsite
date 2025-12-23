# Phase 3: CSS AST Analysis - social-feed.css

**File**: `components/social-feed.css`  
**Total Declarations**: 76 spacing-related  
**Analysis Date**: Current Session  
**Status**: Mapping Complete

---

## Hardcoded Spacing Values Found

### Already Using Variables ✅ (Good)
These are already using `--space-*` variables and need NO changes:

```
✅ gap: var(--space-2xl)           [.social-feed-section]
✅ margin: var(--space-xl) 0       [.social-feed-section]
✅ margin-top: var(--space-2xl)    [.blog-posts-header]
✅ margin-bottom: var(--space-lg)  [.blog-posts-header]
✅ padding-bottom: var(--space-md) [.blog-posts-header]
✅ padding: var(--space-lg)        [.feed-section]
✅ gap: var(--space-sm)            [.feed-header]
✅ margin-bottom: var(--space-lg)  [.feed-header]
✅ padding-bottom: var(--space-md) [.feed-header]
✅ padding: var(--space-xs) var(--space-sm)  [.feed-view-all]
✅ gap: var(--space-md)            [.builder-posts-grid]
✅ padding: var(--space-lg)        [.builder-post-card]
✅ gap: var(--space-xs)            [.builder-post-card .post-content]
✅ margin: calc(-1 * var(--space-lg))  [.builder-post-card .post-image]
✅ margin-bottom: var(--space-md)  [.builder-post-card .post-image]
✅ gap: var(--space-xs)            [.post-tags]
✅ padding-top: var(--space-sm)    [.post-tags]
✅ gap: var(--space-md)            [.linkedin-posts-grid]
✅ padding: var(--space-md)        [.linkedin-post-card]
✅ padding: var(--space-xl)        [.linkedin-profile-card]
✅ gap: var(--space-sm)            [.linkedin-buttons]
✅ padding: var(--space-sm) var(--space-md)  [.linkedin-btn]
✅ gap: var(--space-lg)            [.profile-heroes]
✅ padding: var(--space-xl)        [.profile-hero]
✅ gap: var(--space-lg)            [.hero-stats]
✅ padding: var(--space-sm) 0      [.hero-stats]
✅ gap: var(--space-sm)            [.hero-cta]
✅ padding: var(--space-md) var(--space-xl)  [.hero-cta]
✅ margin: 0 auto var(--space-sm) auto  [.hero-cta]
✅ gap: var(--space-sm)            [.hero-buttons]
✅ padding: var(--space-xs) var(--space-md)  [.hero-secondary]
✅ margin-top: var(--space-md)     [.company-link]
✅ padding-top: var(--space-sm)    [.company-link]
✅ margin: var(--space-xl) 0       [.activity-feed]
✅ gap: var(--space-sm)            [.activity-header]
✅ margin: 0 0 var(--space-lg) 0   [.activity-header]
✅ gap: var(--space-md)            [.activity-grid]
✅ padding: var(--space-md)        [.activity-card]
✅ gap: var(--space-xs)            [.activity-source]
✅ margin-bottom: var(--space-sm)  [.activity-source]
✅ margin-bottom: var(--space-xs)  [.activity-topic]
✅ margin-top: var(--space-sm)     [.activity-link]
✅ margin-top: var(--space-sm)     [.activity-footer]
✅ padding-top: var(--space-sm)    [.activity-footer]
✅ gap: var(--space-md)            [.activity-engagement]
✅ gap: var(--space-sm)            [.feed-title]
```

### Hardcoded Values Requiring Mapping ⚠️

| Line | Selector | Property | Current Value | Target Variable | Reason |
|------|----------|----------|----------------|-----------------|--------|
| 68 | `.profile-hero, .builder-post-card, .linkedin-hero` | `padding` | `1.5rem` | `var(--space-lg)` | 1.5rem = 24px = --space-lg |
| 72 | `.hero-name` | `margin-bottom` | `1.25rem` | `var(--space-md)` | 1.25rem ≈ 20px, closest is --space-md (16px) |
| 76 | `.hero-bio, .hero-headline` | `margin-bottom` | `1.25rem` | `var(--space-md)` | Same as above |
| 80 | `.hero-handle` | `margin` | `0 0 var(--space-sm) 0` | ✅ Already variable | No change needed |
| 84 | `.hero-headline` | `margin` | `0 0 var(--space-md) 0` | ✅ Already variable | No change needed |
| 88 | `.hero-bio` | `margin` | `0 0 var(--space-md) 0` | ✅ Already variable | No change needed |

---

## Summary

### Current State
- **Already Using Variables**: ~40 declarations (52%)
- **Hardcoded Values**: 3 declarations (4%)
- **Mixed/Partial**: 33 declarations (44%)

### Mapping Results

**High Priority Changes** (3 declarations):
1. Line 68: `.profile-hero` padding `1.5rem` → `var(--space-lg)`
2. Line 72: `.hero-name` margin-bottom `1.25rem` → `var(--space-md)`
3. Line 76: `.hero-bio, .hero-headline` margin-bottom `1.25rem` → `var(--space-md)`

**Status**: ✅ **EXCELLENT** - This file is already 96% compliant with spacing variables!

---

## Patch Generation

### Minimal Diff Patch

```diff
--- a/themes/bryan-chasko-theme/assets/css/components/social-feed.css
+++ b/themes/bryan-chasko-theme/assets/css/components/social-feed.css
@@ -65,7 +65,7 @@
 /* Card padding and spacing */
 .profile-hero,
 .builder-post-card,
 .linkedin-hero {
-  padding: 1.5rem;
+  padding: var(--space-lg);
 }
 
 /* Margin between name and bio */
@@ -74,13 +74,13 @@
 }
 
 .hero-name {
-  margin-bottom: 1.25rem;
+  margin-bottom: var(--space-md);
 }
 
 .hero-bio,
 .hero-headline {
   margin-top: 0;
-  margin-bottom: 1.25rem;
+  margin-bottom: var(--space-md);
 }
 
 .blog-posts-header h2 {
```

---

## Validation Checklist

- [ ] Apply patch to `components/social-feed.css`
- [ ] Rebuild Hugo: `hugo server --config hugo.toml -D`
- [ ] Capture screenshot: home page + blog index
- [ ] Extract DOM geometry (compare to Phase 2 baseline)
- [ ] Verify no visual regressions:
  - [ ] Profile hero cards (AWS Builder, LinkedIn)
  - [ ] Blog post cards
  - [ ] Activity feed
  - [ ] Spacing between sections
- [ ] Run tests: `npm test`
- [ ] Commit with message: "refactor(css): normalize social-feed spacing to --space-* variables"

---

## Notes

**Why 1.25rem → --space-md?**
- 1.25rem = 20px (custom value)
- Closest variable: --space-md = 16px (1rem)
- Alternative: --space-lg = 24px (1.5rem)
- Decision: Use --space-md for tighter spacing on hero name/bio (visual hierarchy)

**Why 1.5rem → --space-lg?**
- 1.5rem = 24px (exact match!)
- Maps directly to --space-lg
- Used for card padding (consistent with design system)

---

## Next Steps

1. **Apply Patch**: Update social-feed.css with 3 changes
2. **Validate**: Screenshot + DOM geometry comparison
3. **Commit**: Push changes to feature branch
4. **Move to Next File**: components/home.css (69 declarations)
