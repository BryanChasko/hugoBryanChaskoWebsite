# Phase 3: CSS AST Analysis - components/github-dashboard.css

**File**: `components/github-dashboard.css`  
**Total Declarations**: 46 spacing-related  
**Analysis Date**: Current Session  
**Status**: Mapping Complete

---

## Hardcoded Spacing Values Found

### Already Using Variables ✅ (Good)
```
✅ gap: var(--space-lg)                  [mobile .github-dashboard__actions]
✅ padding: var(--space-md)              [mobile .github-dashboard__actions]
```

### Hardcoded Values Requiring Mapping ⚠️

| Line | Selector | Property | Current Value | Target Variable | Notes |
|------|----------|----------|----------------|-----------------|-------|
| 15 | `.github-dashboard` | padding | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 87 | `.github-dashboard__actions` | gap | `16px` | `var(--space-md)` | 16px = --space-md |
| 88 | `.github-dashboard__actions` | margin-bottom | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 89 | `.github-dashboard__actions` | padding-bottom | `16px` | `var(--space-md)` | 16px = --space-md |
| 98 | `.github-dashboard-header` | margin-bottom | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 99 | `.github-dashboard-header` | gap | `16px` | `var(--space-md)` | 16px = --space-md |
| 101 | `.github-dashboard-header` | padding-bottom | `16px` | `var(--space-md)` | 16px = --space-md |
| 111 | `.github-dashboard__button` | gap | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 114 | `.github-dashboard__button` | padding | `12px 18px` | `var(--space-sm) var(--space-lg)` | 12px (custom, close to 8px), 18px (custom, close to 24px) |
| 153 | `.github-profile-link` (mobile) | margin-bottom | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 171 | `.github-profile-link` (mobile) | margin-bottom | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 195 | `.github-workflow-badges` | gap | `12px` | `var(--space-sm)` | 12px (custom, close to 8px) |
| 205 | `.github-workflow-badges` | padding | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 231 | `.github-workflow-badge` | margin | `0 8px` | `0 var(--space-sm)` | 8px = --space-sm |
| 240 | `.github-workflow-badge` | padding | `10px 14px` | `var(--space-sm) var(--space-md)` | 10px (custom, close to 8px), 14px (custom, close to 16px) |
| 265 | `.github-workflow-badge` (mobile) | margin | `0 0 8px 0` | `0 0 var(--space-sm) 0` | 8px = --space-sm |
| 285 | `.github-latest-commit` | padding | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 286 | `.github-latest-commit` | margin-bottom | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 366 | `.github-commit-info` | gap | `12px` | `var(--space-sm)` | 12px (custom, close to 8px) |
| 367 | `.github-commit-info` | margin-bottom | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 368 | `.github-commit-info` | padding | `16px` | `var(--space-md)` | 16px = --space-md |
| 407 | `.github-commit-meta` | gap | `6px` | `var(--space-xs)` | 6px (custom, close to 4px) |
| 494 | `.github-stats-item` | margin-bottom | `14px` | `var(--space-md)` | 14px (custom, close to 16px) |
| 540 | `.github-progress-bar` | margin-bottom | `14px` | `var(--space-md)` | 14px (custom, close to 16px) |
| 557 | `.github-stats-grid` | gap | `16px` | `var(--space-md)` | 16px = --space-md |
| 564 | `.github-stat-item` | gap | `6px` | `var(--space-xs)` | 6px (custom, close to 4px) |
| 576 | `.github-stat-item` | padding | `12px 0` | `var(--space-sm) 0` | 12px (custom, close to 8px) |
| 678 | `.github-dashboard` (mobile) | padding | `24px` | `var(--space-lg)` | 24px = --space-lg |
| 679 | `.github-dashboard` (mobile) | margin | `24px 0` | `var(--space-lg) 0` | 24px = --space-lg |
| 684 | `.github-dashboard__button` (mobile) | padding | `12px` | `var(--space-sm)` | 12px (custom, close to 8px) |
| 694 | `.github-profile-link` (mobile) | margin-bottom | `8px` | `var(--space-sm)` | 8px = --space-sm |
| 702 | `.github-repo-link` (mobile) | padding | `6px 10px` | `var(--space-xs) var(--space-sm)` | 6px (custom, close to 4px), 10px (custom, close to 8px) |

---

## Summary

### Current State
- **Already Using Variables**: ~2 declarations (4%)
- **Hardcoded Values**: 31 declarations (67%)
- **Other**: 13 declarations (29%)

### Mapping Results

**High Priority Changes** (exact matches):
1. Line 15: `.github-dashboard` padding `24px` → `var(--space-lg)`
2. Line 87: `.github-dashboard__actions` gap `16px` → `var(--space-md)`
3. Line 88: `.github-dashboard__actions` margin-bottom `24px` → `var(--space-lg)`
4. Line 89: `.github-dashboard__actions` padding-bottom `16px` → `var(--space-md)`
5. Line 111: `.github-dashboard__button` gap `8px` → `var(--space-sm)`
6. Line 153, 171: `.github-profile-link` (mobile) margin-bottom `8px` → `var(--space-sm)`
7. Line 231: `.github-workflow-badge` margin `0 8px` → `0 var(--space-sm)`
8. Line 557: `.github-stats-grid` gap `16px` → `var(--space-md)`

**Medium Priority Changes** (close approximations):
9. Line 114: `.github-dashboard__button` padding `12px 18px` → `var(--space-sm) var(--space-lg)`
10. Line 195: `.github-workflow-badges` gap `12px` → `var(--space-sm)`
11. Line 240: `.github-workflow-badge` padding `10px 14px` → `var(--space-sm) var(--space-md)`
12. Line 366: `.github-commit-info` gap `12px` → `var(--space-sm)`
13. Line 407: `.github-commit-meta` gap `6px` → `var(--space-xs)`
14. Line 494: `.github-stats-item` margin-bottom `14px` → `var(--space-md)`

---

## Patch Generation

### Minimal Diff Patch (Top 14 Changes)

```diff
--- a/themes/bryan-chasko-theme/assets/css/components/github-dashboard.css
+++ b/themes/bryan-chasko-theme/assets/css/components/github-dashboard.css
@@ -12,7 +12,7 @@
   );
   border: 1px solid rgba(94, 65, 162, 0.12);
   border-radius: 12px;
-  padding: 24px;
+  padding: var(--space-lg);
   margin: 0;
   box-shadow: 
     0 2px 12px -2px rgba(94, 65, 162, 0.08),
@@ -84,9 +84,9 @@
 .github-dashboard__actions {
   display: flex;
   justify-content: space-between;
   align-items: center;
-  gap: 16px;
-  margin-bottom: 24px;
-  padding-bottom: 16px;
+  gap: var(--space-md);
+  margin-bottom: var(--space-lg);
+  padding-bottom: var(--space-md);
   border-bottom: 1px solid rgba(94, 65, 162, 0.1);
   width: 100%;
 }
@@ -95,9 +95,9 @@
 .github-dashboard-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
-  margin-bottom: 24px;
-  gap: 16px;
+  margin-bottom: var(--space-lg);
+  gap: var(--space-md);
   flex-wrap: nowrap;
-  padding-bottom: 16px;
+  padding-bottom: var(--space-md);
   border-bottom: 1px solid rgba(94, 65, 162, 0.1);
   width: 100%;
 }
@@ -108,11 +108,11 @@
   display: flex;
   align-items: center;
   justify-content: center;
-  gap: 8px;
+  gap: var(--space-sm);
   color: var(--white);
   text-decoration: none;
-  padding: 12px 18px;
+  padding: var(--space-sm) var(--space-lg);
   border-radius: 8px;
   font-weight: 600;
   font-size: 0.95rem;
@@ -150,7 +150,7 @@
     margin-right: 0;
     flex-basis: 100%;
     justify-content: center;
-    margin-bottom: 8px;
+    margin-bottom: var(--space-sm);
   }
 
   .github-repo-link {
@@ -168,7 +168,7 @@
     margin-right: 0;
     flex-basis: 100%;
     justify-content: center;
-    margin-bottom: 8px;
+    margin-bottom: var(--space-sm);
   }
 
   .github-repo-link {
@@ -192,7 +192,7 @@
   align-items: center;
   width: 100%;
-  gap: 12px;
+  gap: var(--space-sm);
   background: linear-gradient(
     135deg,
     rgba(248, 250, 252, 0.98) 0%,
@@ -228,7 +228,7 @@
 .github-workflow-badge {
   max-width: 320px;
-  margin: 0 8px;
+  margin: 0 var(--space-sm);
   display: flex;
   align-items: center;
   justify-content: center;
@@ -237,7 +237,7 @@
   background: rgba(255, 255, 255, 0.9);
   border: 1px solid rgba(129, 105, 197, 0.2);
   border-radius: 8px;
-  padding: 10px 14px;
+  padding: var(--space-sm) var(--space-md);
   font-weight: 600;
   font-size: 0.9rem;
   color: var(--nebula-purple);
@@ -554,7 +554,7 @@
 .github-stats-grid {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
-  gap: 16px;
+  gap: var(--space-md);
   margin-top: 1rem;
 }
 
@@ -561,7 +561,7 @@
 .github-stat-item {
   display: flex;
   flex-direction: column;
-  gap: 6px;
+  gap: var(--space-xs);
   font-size: 0.875rem;
   text-align: center;
 }
@@ -491,7 +491,7 @@
 .github-stats-item {
   margin: 0;
   padding: 0;
-  margin-bottom: 14px;
+  margin-bottom: var(--space-md);
   font-size: 0.95rem;
   font-weight: 600;
   letter-spacing: 0.05em;
@@ -404,7 +404,7 @@
 .github-commit-meta {
   display: flex;
   align-items: center;
-  gap: 6px;
+  gap: var(--space-xs);
   margin-top: 2px;
 }
```

---

## Next Steps

1. **Apply Patch**: Update github-dashboard.css with 14 changes
2. **Validate**: Screenshot + DOM geometry comparison
3. **Commit**: Push changes to feature branch
4. **Complete Tier 1**: All 5 files normalized
