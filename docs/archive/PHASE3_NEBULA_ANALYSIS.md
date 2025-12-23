# Phase 3: CSS AST Analysis - extended/nebula.css

**File**: `extended/nebula.css`  
**Total Declarations**: 69 spacing-related  
**Analysis Date**: Current Session  
**Status**: Mapping Complete

---

## Hardcoded Spacing Values Found

### Already Using Variables ✅ (Good)
```
✅ margin-top: var(--space-xl)           [h1-h6]
✅ margin-bottom: var(--space-md)        [h1-h6]
✅ margin-bottom: var(--space-md)        [p]
✅ padding-left: var(--space-lg)         [blockquote]
✅ margin: var(--space-lg) 0             [blockquote]
✅ padding: 0 var(--space-lg)            [.main, .container]
✅ margin-bottom: var(--space-3xl)       [section]
✅ gap: var(--space-lg)                  [.grid]
✅ gap: var(--space-sm/md/lg)            [.gap-* utilities]
✅ margin-top: var(--space-xs/sm/md/lg/xl) [.mt-* utilities]
✅ margin-bottom: var(--space-xs/sm/md/lg/xl) [.mb-* utilities]
✅ padding: var(--space-sm/md/lg/xl)     [.p-* utilities]
```

### Hardcoded Values Requiring Mapping ⚠️

| Line | Selector | Property | Current Value | Target Variable | Notes |
|------|----------|----------|----------------|-----------------|-------|
| 8 | `.cat-mascot` | margin | `0 auto 2.5rem auto` | `0 auto var(--space-2xl) auto` | 2.5rem = 40px (custom, close to 48px) |
| 55 | `.cat-face` | padding | `0 22px` | `0 var(--space-lg)` | 22px (custom, close to 24px) |
| 70 | `.cat-eye--left` | margin-right | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 71 | `.cat-eye--right` | margin-left | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 114 | `.error-title` | margin-top | `0.5rem` | `var(--space-sm)` | 0.5rem = 8px = --space-sm |
| 115 | `.error-title` | margin-bottom | `0.5rem` | `var(--space-sm)` | 0.5rem = 8px = --space-sm |
| 122 | `.error-message` | margin-bottom | `2rem` | `var(--space-2xl)` | 2rem = 32px (custom, close to 48px) |
| 128 | `.error-link` | padding | `0.75em 2em` | `var(--space-sm) var(--space-xl)` | 0.75em = 12px (custom), 2em = 32px = --space-xl |
| 153 | `.error-link` (mobile) | padding | `0.5em 1.2em` | `var(--space-sm) var(--space-md)` | 0.5em = 8px, 1.2em = 19px (custom) |

---

## Summary

### Current State
- **Already Using Variables**: ~40 declarations (58%)
- **Hardcoded Values**: 9 declarations (13%)
- **Dimensions/Animations**: 20 declarations (29%)

### Mapping Results

**High Priority Changes** (exact matches):
1. Line 70: `.cat-eye--left` margin-right `8px` → `var(--space-sm)`
2. Line 71: `.cat-eye--right` margin-left `8px` → `var(--space-sm)`
3. Line 114: `.error-title` margin-top `0.5rem` → `var(--space-sm)`
4. Line 115: `.error-title` margin-bottom `0.5rem` → `var(--space-sm)`

**Medium Priority Changes** (close approximations):
5. Line 8: `.cat-mascot` margin `0 auto 2.5rem auto` → `0 auto var(--space-2xl) auto`
6. Line 55: `.cat-face` padding `0 22px` → `0 var(--space-lg)`
7. Line 122: `.error-message` margin-bottom `2rem` → `var(--space-2xl)`
8. Line 128: `.error-link` padding `0.75em 2em` → `var(--space-sm) var(--space-xl)`
9. Line 153: `.error-link` (mobile) padding `0.5em 1.2em` → `var(--space-sm) var(--space-md)`

---

## Patch Generation

### Minimal Diff Patch

```diff
--- a/themes/bryan-chasko-theme/assets/css/extended/nebula.css
+++ b/themes/bryan-chasko-theme/assets/css/extended/nebula.css
@@ -5,7 +5,7 @@
 .cat-mascot {
   display: flex;
   justify-content: center;
   align-items: flex-end;
-  margin: 0 auto 2.5rem auto;
+  margin: 0 auto var(--space-2xl) auto;
   width: 160px;
   height: 160px;
   position: relative;
@@ -52,7 +52,7 @@
   width: 100%;
   height: 60px;
   display: flex;
   justify-content: space-between;
   align-items: center;
-  padding: 0 22px;
+  padding: 0 var(--space-lg);
 }
 
 .cat-eye {
@@ -67,11 +67,11 @@
   overflow: hidden;
   box-shadow: 0 1px 4px rgba(0,0,0,0.10) inset;
   display: flex;
   align-items: center;
   justify-content: center;
 }
-.cat-eye--left { margin-right: 8px; }
-.cat-eye--right { margin-left: 8px; }
+.cat-eye--left { margin-right: var(--space-sm); }
+.cat-eye--right { margin-left: var(--space-sm); }
 
 .cat-pupil {
   width: 12px;
@@ -111,9 +111,9 @@
 .error-title {
   text-align: center;
   font-size: 2.5rem;
   font-weight: 800;
-  margin-top: 0.5rem;
-  margin-bottom: 0.5rem;
+  margin-top: var(--space-sm);
+  margin-bottom: var(--space-sm);
   color: var(--color-primary);
 }
 .error-message {
@@ -121,7 +121,7 @@
   text-align: center;
   font-size: 1.25rem;
   color: var(--color-text-secondary);
-  margin-bottom: 2rem;
+  margin-bottom: var(--space-2xl);
 }
 .error-link {
   display: block;
@@ -129,7 +129,7 @@
   margin: 0 auto;
   width: fit-content;
-  padding: 0.75em 2em;
+  padding: var(--space-sm) var(--space-xl);
   font-size: 1.1rem;
   font-weight: 600;
   background: var(--color-primary);
@@ -150,7 +150,7 @@
   .cat-face { top: 22px; height: 36px; padding: 0 10px; }
   .cat-eye { width: 16px; height: 16px; }
   .cat-pupil { width: 7px; height: 7px; }
   .error-title { font-size: 1.5rem; }
   .error-message { font-size: 1rem; }
-  .error-link { font-size: 1rem; padding: 0.5em 1.2em; }
+  .error-link { font-size: 1rem; padding: var(--space-sm) var(--space-md); }
 }
```

---

## Validation Checklist

- [ ] Apply patch to `extended/nebula.css`
- [ ] Rebuild Hugo: `hugo server --config hugo.toml -D`
- [ ] Capture screenshot: home page + 404 page
- [ ] Extract DOM geometry (compare to Phase 2 baseline)
- [ ] Verify no visual regressions:
  - [ ] 404 cat mascot spacing
  - [ ] Error message layout
  - [ ] Error link button
  - [ ] Mobile responsive spacing
- [ ] Run tests: `npm test`
- [ ] Commit with message: "refactor(css): normalize nebula spacing to --space-* variables"

---

## Notes

**Why 2.5rem → --space-2xl?**
- 2.5rem = 40px (custom value)
- Closest variable: --space-2xl = 48px (3rem)
- Alternative: --space-xl = 32px (2rem)
- Decision: Use --space-2xl for larger bottom margin on cat mascot (visual hierarchy)

**Why 22px → --space-lg?**
- 22px (custom value)
- Closest variable: --space-lg = 24px (1.5rem)
- Acceptable approximation (2px difference)

**Why 0.75em → --space-sm?**
- 0.75em = 12px (custom value)
- Closest variable: --space-sm = 8px (0.5rem)
- Acceptable approximation (4px difference, but maintains visual hierarchy)

---

## Next Steps

1. **Apply Patch**: Update nebula.css with 9 changes
2. **Validate**: Screenshot + DOM geometry comparison
3. **Commit**: Push changes to feature branch
4. **Move to Next File**: common/post-single.css (55 declarations)
