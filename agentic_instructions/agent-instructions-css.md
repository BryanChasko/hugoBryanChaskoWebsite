# Agent Instructions: General CSS (Fragment)

## Purpose
Guidance for AI agents working on general CSS across the project (excluding home page-specific rules).

---

## Key Files
- `themes/bryan-chasko-theme/assets/css/core/variables.css`   ← CSS custom properties (colors, spacing, typography)
- `themes/bryan-chasko-theme/assets/css/common/header.css`    ← Header, navigation, logo, theme toggle
- `themes/bryan-chasko-theme/assets/css/components/cards.css` ← Post/service cards
- `themes/bryan-chasko-theme/assets/css/components/social-feed.css` ← Social profile heroes, activity feed
- `themes/bryan-chasko-theme/assets/css/extended/nebula.css`  ← Animated backgrounds, WebGL palettes

## Principles
- **Use MCP CSS tools** for analysis, browser compatibility, and documentation before making changes
- **Do not modify PROTECTED rules** (see header.css for logo/mobile nav)
- **All CSS must be responsive** (mobile, tablet, desktop)
- **Respect dark mode**: Use `[data-theme="dark"]` selectors for overrides
- **Do not hardcode colors**: Use CSS variables from `variables.css` or `nebula.css`

## Workflow
1. Analyze current CSS with `mcp_css_analyze_project_css`
2. Check browser compatibility for new features
3. Reference MDN docs for syntax
4. Make changes in the appropriate file (component, common, or extended)
5. Test on all breakpoints and both light/dark mode
6. Validate with MCP CSS tools after changes

## CSS Variable Usage
- Use variables for all colors, spacing, and typography
- Brand palette: `--nebula-purple`, `--nebula-lavender`, `--nebula-orange`
- WebGL palette: `--cosmic-teal`, `--cosmic-energy`, `--cosmic-primary`, `--cosmic-accent`
- Semantic: `--color-background`, `--color-text`, `--color-link`, etc.

## Responsive Design
- Use `clamp()` for font sizes and spacing
- Use media queries for breakpoints: 480px, 768px, 1024px
- All interactive elements must be touch-friendly

## Accessibility
- All animations must respect `prefers-reduced-motion`
- Ensure color contrast meets WCAG AA
- All navigation and buttons must be keyboard accessible

## References
- [themes/bryan-chasko-theme/assets/css/core/variables.css]
- [themes/bryan-chasko-theme/assets/css/common/header.css]
- [themes/bryan-chasko-theme/assets/css/components/]
- [themes/bryan-chasko-theme/assets/css/extended/nebula.css]
- [copilot-instructions.md](../.github/copilot-instructions.md) (for full CSS tool usage)

---

**For home page CSS, see agent-instructions-css-home.md.**
