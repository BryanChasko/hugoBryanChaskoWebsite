# Spacing Normalization Standard

## Overview

This document establishes the vertical spacing standard for bryanchasko.com to ensure consistent, predictable layout rhythm across all pages.

**Standard**: 24px (`var(--space-lg)`) for vertical spacing between non-card sections

## Scope

### Pages Affected
- Home page (`/`)
- Blog index (`/blog/`)

### Spacing Rules
- **Between sections**: 24px (margin-bottom or margin-top)
- **Section padding**: 24px (padding-top/padding-bottom for section containers)
- **Gap between flex/grid items**: 24px (gap property)

### Exclusions (Do NOT normalize)
- Card internals (`.post-entry`, `.social-feed-hero`, `.builder-card`)
- WebGL canvas containers and overlays
- Terminal component spacing
- Navigation and header spacing
- Footer spacing

## CSS Variable Mapping

| Variable | Value | Usage |
|----------|-------|-------|
| `--space-xs` | 8px | Micro spacing (not used for section gaps) |
| `--space-sm` | 16px | Small spacing (not used for section gaps) |
| `--space-lg` | 24px | **Standard section spacing** |
| `--space-xl` | 32px | Large spacing (use sparingly) |
| `--space-2xl` | 48px | Extra large spacing (use sparingly) |

## Audit Checklist for Future PRs

When adding new sections or modifying layouts:

- [ ] All non-card section gaps use `var(--space-lg)` (24px)
- [ ] No hardcoded pixel values for section spacing (use CSS variables)
- [ ] Card internals remain unchanged
- [ ] WebGL/terminal components unaffected
- [ ] Responsive breakpoints maintain 24px standard
- [ ] Visual regression tests pass

## CSS Linting Rules

Add to `.stylelintrc.json` to enforce spacing standard:

```json
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "margin-top": ["8px", "16px", "32px", "48px"],
      "margin-bottom": ["8px", "16px", "32px", "48px"],
      "padding-top": ["8px", "16px", "32px", "48px"],
      "padding-bottom": ["8px", "16px", "32px", "48px"],
      "gap": ["8px", "16px", "32px", "48px"]
    }
  }
}
```

**Note**: This rule enforces that section spacing uses only 24px (or CSS variables). Exceptions require explicit `/* stylelint-disable */` comments with justification.

## MCP Tool Usage for Spacing Audits

### Playwright MCP (Visual Inspection)
```bash
# Capture baseline screenshots
playwright navigate https://bryanchasko.com
playwright take_screenshot --filename baseline-ref-home.png

# Compare local vs. production
playwright navigate http://localhost:1313
playwright take_screenshot --filename baseline-local-home.png
```

### Chrome DevTools MCP (DOM Geometry)
```bash
# Extract computed styles for spacing analysis
chrome-devtools evaluate_script "
  document.querySelectorAll('section, article, .content-wrapper').forEach(el => {
    const styles = window.getComputedStyle(el);
    console.log({
      selector: el.className,
      marginTop: styles.marginTop,
      marginBottom: styles.marginBottom,
      paddingTop: styles.paddingTop,
      paddingBottom: styles.paddingBottom
    });
  });
"
```

### CSS MCP (AST Analysis)
```bash
# Parse CSS files and extract spacing rules
css-mcp analyze themes/bryan-chasko-theme/assets/css/
# Returns: spacing rules, selectors, specificity, line numbers
```

## Rollback Procedures

If spacing changes cause regressions:

```bash
# Revert all spacing patches
git checkout HEAD -- themes/bryan-chasko-theme/assets/css/

# Or revert specific file
git checkout HEAD -- themes/bryan-chasko-theme/assets/css/extended/nebula.css

# Rebuild and verify
hugo --config hugo.toml
npm test
```

## Files Modified

(Updated during Phase 6-7)

| File | Changes | Lines |
|------|---------|-------|
| TBD | TBD | TBD |

## Before/After Metrics

(Updated during Phase 7)

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| TBD | TBD | TBD | TBD |

---

**Last Updated**: 2025-12-22  
**Status**: Phase 1 Complete - Documentation Established
