# Phase 3: CSS AST Analysis - common/post-single.css

**File**: `common/post-single.css`  
**Total Declarations**: 55 spacing-related  
**Analysis Date**: Current Session  
**Status**: Mapping Complete

---

## Hardcoded Spacing Values Found

### Already Using Variables ✅ (Good)
```
✅ margin-bottom: var(--content-gap)     [.post-content dl/ol/p/figure/ul]
✅ margin-bottom: var(--content-gap)     [.post-content table]
✅ margin-bottom: var(--content-gap)     [.toc]
✅ margin-top: var(--content-gap)        [.post-footer]
✅ margin-inline-start: var(--gap)       [.toc li ul]
✅ margin-inline-start: calc(var(--gap) * -2) [.post-content ul pre]
```

### Hardcoded Values Requiring Mapping ⚠️

| Line | Selector | Property | Current Value | Target Variable | Notes |
|------|----------|----------|----------------|-----------------|-------|
| 3 | `.page-header, .post-header` | margin | `24px auto var(--content-gap) auto` | `var(--space-lg) auto var(--content-gap) auto` | 24px = --space-lg |
| 7 | `.post-title` | margin-bottom | `2px` | `var(--space-xs)` | 2px (custom, close to 4px) |
| 12 | `.post-description` | margin-top | `10px` | `var(--space-sm)` | 10px (custom, close to 8px) |
| 13 | `.post-description` | margin-bottom | `5px` | `var(--space-xs)` | 5px (custom, close to 4px) |
| 34 | `.post-meta .i18n_list li` | margin | `auto 3px` | `auto var(--space-xs)` | 3px (custom, close to 4px) |
| 43 | `.post-content` | margin | `30px 0` | `var(--space-xl) 0` | 30px (custom, close to 32px) |
| 50 | `.post-content h3/h4/h5/h6` | margin | `24px 0 16px` | `var(--space-lg) 0 var(--space-md)` | 24px = --space-lg, 16px = --space-md |
| 54 | `.post-content h1` | margin | `40px auto 32px` | `var(--space-2xl) auto var(--space-xl)` | 40px (custom, close to 48px), 32px = --space-xl |
| 59 | `.post-content h2` | margin | `32px auto 24px` | `var(--space-xl) auto var(--space-lg)` | 32px = --space-xl, 24px = --space-lg |
| 107 | `.post-content ol, ul` | padding-inline-start | `20px` | `var(--space-lg)` | 20px (custom, close to 24px) |
| 111 | `.post-content li` | margin-top | `5px` | `var(--space-xs)` | 5px (custom, close to 4px) |
| 132 | `.post-content dd` | padding-inline-start | `10px` | `var(--space-sm)` | 10px (custom, close to 8px) |
| 137 | `.post-content dd~dd, dt~dt` | margin-top | `10px` | `var(--space-sm)` | 10px (custom, close to 8px) |
| 147 | `.post-content table th/td` | padding | `8px 5px` | `var(--space-sm) var(--space-xs)` | 8px = --space-sm, 5px (custom, close to 4px) |
| 165 | `.post-content .highlight` | margin | `10px auto` | `var(--space-sm) auto` | 10px (custom, close to 8px) |
| 201 | `.post-content code` | margin | `auto 4px` | `auto var(--space-xs)` | 4px = --space-xs |
| 202 | `.post-content code` | padding | `4px 6px` | `var(--space-xs) var(--space-sm)` | 4px = --space-xs, 6px (custom, close to 8px) |
| 212 | `.post-content pre code` | padding | `10px` | `var(--space-sm)` | 10px (custom, close to 8px) |
| 221 | `.post-content blockquote` | margin | `20px 0` | `var(--space-lg) 0` | 20px (custom, close to 24px) |
| 222 | `.post-content blockquote` | padding | `0 14px` | `0 var(--space-md)` | 14px (custom, close to 16px) |
| 227 | `.post-content hr` | margin | `30px 0` | `var(--space-xl) 0` | 30px (custom, close to 32px) |
| 239 | `.post-content img` | margin | `1rem 0` | `var(--space-md) 0` | 1rem = 16px = --space-md |
| 243 | `.post-content img[src*="#center"]` | margin | `1rem auto` | `var(--space-md) auto` | 1rem = 16px = --space-md |
| 254 | `.post-content figure>figcaption` | margin | `8px 0 16px` | `var(--space-sm) 0 var(--space-md)` | 8px = --space-sm, 16px = --space-md |
| 268 | `.toc` | padding | `0.4em` | `var(--space-xs)` | 0.4em ≈ 6px (custom, close to 4px) |
| 277 | `.toc details summary` | margin-inline-start | `10px` | `var(--space-sm)` | 10px (custom, close to 8px) |
| 291 | `.toc .inner` | margin | `5px 20px` | `var(--space-xs) var(--space-lg)` | 5px (custom, close to 4px), 20px (custom, close to 24px) |
| 292 | `.toc .inner` | padding | `0 10px` | `0 var(--space-sm)` | 10px (custom, close to 8px) |

---

## Summary

### Current State
- **Already Using Variables**: ~6 declarations (11%)
- **Hardcoded Values**: 27 declarations (49%)
- **Font sizes/Other**: 22 declarations (40%)

### Mapping Results

**High Priority Changes** (exact matches):
1. Line 3: `.page-header, .post-header` margin `24px` → `var(--space-lg)`
2. Line 201: `.post-content code` margin `auto 4px` → `auto var(--space-xs)`
3. Line 239: `.post-content img` margin `1rem 0` → `var(--space-md) 0`
4. Line 243: `.post-content img[src*="#center"]` margin `1rem auto` → `var(--space-md) auto`

**Medium Priority Changes** (close approximations):
5. Line 7: `.post-title` margin-bottom `2px` → `var(--space-xs)`
6. Line 12: `.post-description` margin-top `10px` → `var(--space-sm)`
7. Line 13: `.post-description` margin-bottom `5px` → `var(--space-xs)`
8. Line 34: `.post-meta .i18n_list li` margin `auto 3px` → `auto var(--space-xs)`
9. Line 43: `.post-content` margin `30px 0` → `var(--space-xl) 0`
10. Line 50: `.post-content h3/h4/h5/h6` margin `24px 0 16px` → `var(--space-lg) 0 var(--space-md)`
11. Line 54: `.post-content h1` margin `40px auto 32px` → `var(--space-2xl) auto var(--space-xl)`
12. Line 59: `.post-content h2` margin `32px auto 24px` → `var(--space-xl) auto var(--space-lg)`

---

## Patch Generation

### Minimal Diff Patch (Top 12 Changes)

```diff
--- a/themes/bryan-chasko-theme/assets/css/common/post-single.css
+++ b/themes/bryan-chasko-theme/assets/css/common/post-single.css
@@ -1,6 +1,6 @@
 .page-header,
 .post-header {
-    margin: 24px auto var(--content-gap) auto;
+    margin: var(--space-lg) auto var(--content-gap) auto;
 }
 
 .post-title {
-    margin-bottom: 2px;
+    margin-bottom: var(--space-xs);
     font-size: 40px;
 }
 
 .post-description {
-    margin-top: 10px;
-    margin-bottom: 5px;
+    margin-top: var(--space-sm);
+    margin-bottom: var(--space-xs);
 }
 
 .post-meta,
@@ -31,7 +31,7 @@
 
 .post-meta .i18n_list li {
     list-style: none;
-    margin: auto 3px;
+    margin: auto var(--space-xs);
 }
 
 .breadcrumbs a {
@@ -40,7 +40,7 @@
 
 .post-content {
     color: var(--content);
-    margin: 30px 0;
+    margin: var(--space-xl) 0;
 }
 
 .post-content h3,
@@ -47,17 +47,17 @@
 .post-content h4,
 .post-content h5,
 .post-content h6 {
-    margin: 24px 0 16px;
+    margin: var(--space-lg) 0 var(--space-md);
 }
 
 .post-content h1 {
-    margin: 40px auto 32px;
+    margin: var(--space-2xl) auto var(--space-xl);
     font-size: 40px;
 }
 
 .post-content h2 {
-    margin: 32px auto 24px;
+    margin: var(--space-xl) auto var(--space-lg);
     font-size: 32px;
 }
 
@@ -198,7 +198,7 @@
 }
 
 .post-content code {
-    margin: auto 4px;
+    margin: auto var(--space-xs);
     padding: 4px 6px;
     font-size: 0.78em;
     line-height: 1.5;
@@ -236,11 +236,11 @@
 
 .post-content img {
     border-radius: 4px;
-    margin: 1rem 0;
+    margin: var(--space-md) 0;
 }
 
 .post-content img[src*="#center"] {
-    margin: 1rem auto;
+    margin: var(--space-md) auto;
 }
 
 .post-content figure.align-center {
```

---

## Next Steps

1. **Apply Patch**: Update post-single.css with 12 changes
2. **Validate**: Screenshot + DOM geometry comparison
3. **Commit**: Push changes to feature branch
4. **Move to Next File**: components/github-dashboard.css (46 declarations)
