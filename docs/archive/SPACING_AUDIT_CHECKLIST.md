# Spacing Audit Checklist for Future PRs

Use this checklist when adding new sections, modifying layouts, or updating CSS spacing rules.

## Pre-Commit Checklist

- [ ] All non-card section gaps use `var(--space-lg)` (24px)
- [ ] No hardcoded pixel values for section spacing (use CSS variables)
- [ ] Card internals (`.post-entry`, `.social-feed-hero`, `.builder-card`) remain unchanged
- [ ] WebGL canvas containers unaffected
- [ ] Terminal component spacing unaffected
- [ ] Navigation/header spacing unaffected
- [ ] Footer spacing unaffected

## Visual Regression Testing

- [ ] Run `npm test` and all tests pass
- [ ] Capture screenshots: `npm run test:capture-baselines`
- [ ] Compare against previous baseline (pixel diff <2%)
- [ ] No layout shifts or unexpected spacing changes

## DOM Geometry Verification

- [ ] Extract computed styles for modified sections
- [ ] Verify margin-top, margin-bottom, padding-top, padding-bottom values
- [ ] Confirm gap property on flex/grid containers
- [ ] Check responsive breakpoints maintain 24px standard

## Responsive Breakpoints

- [ ] Desktop (1280px+): 24px spacing
- [ ] Tablet (768px-1279px): 24px spacing (or reduced if needed)
- [ ] Mobile (< 768px): 24px spacing (or reduced if needed)

## CSS Linting

- [ ] Run stylelint: `npm run lint:css`
- [ ] No spacing rule violations
- [ ] If exceptions needed, add `/* stylelint-disable */` with justification

## Rollback Plan

If regressions detected:

```bash
# Revert changes
git checkout HEAD -- themes/bryan-chasko-theme/assets/css/

# Rebuild and verify
hugo --config hugo.toml
npm test
```

## Sign-Off

- [ ] All checks passed
- [ ] Ready for PR review
- [ ] Spacing standard maintained

---

**Reference**: See [SPACING_NORMALIZATION.md](SPACING_NORMALIZATION.md) for full standard documentation.
