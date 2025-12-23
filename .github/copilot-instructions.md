# Agent Instructions: Home Page CSS (Fragment)

## Purpose

Guidance for AI agents working specifically on CSS for the home page (including css terminal simulator, builder card, social icons, and animated backgrounds).

---

## Key Files

- `themes/bryan-chasko-theme/assets/css/components/home.css` ← Home page layout, terminal, builder card, social icons
- `themes/bryan-chasko-theme/assets/css/extended/nebula.css` ← Animated backgrounds, color palettes
- `themes/bryan-chasko-theme/assets/css/core/variables.css` ← CSS custom properties (colors, spacing, typography)

## Principles

- **Use MCP CSS tools** for analysis, browser compatibility, and documentation before making changes
- **Do not modify PROTECTED rules** in `header.css` (logo sizing, mobile nav)
- **All home page CSS must be responsive** (mobile, tablet, desktop)
- **Respect dark mode**: Use `[data-theme="dark"]` selectors for overrides
- **Animated backgrounds** must respect `prefers-reduced-motion`
- **Do not hardcode colors**: Use CSS variables from `variables.css` or `nebula.css`

## Workflow

1. Analyze current CSS with `mcp_css_analyze_css` or `mcp_css_analyze_project_css`
2. Check browser compatibility for any new features (e.g., `:has`, container queries)
3. Reference MDN docs for syntax (`mcp_css_get_docs`)
4. Make changes in `home.css` for layout, builder card, terminal, or social icons
5. For background/animation changes, edit `nebula.css` only
6. Test on all breakpoints and both light/dark mode
7. Validate with MCP CSS tools after changes

## Home Page Structure

- **Terminal**: `.terminal-wrapper`, `.entry-header` (animated, glassmorphism)
- **Social Icons**: `.terminal-social-reveal` (revealed after terminal animation)
- **Builder Card**: `.builder-card` (glassmorphism, WebGL overlay)
- **Animated Backgrounds**: `body::before`, `body::after`, `.main::before` (see nebula.css)

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
- Social icons and buttons must be keyboard accessible

## References

- [themes/bryan-chasko-theme/assets/css/components/home.css]
- [themes/bryan-chasko-theme/assets/css/extended/nebula.css]
- [themes/bryan-chasko-theme/assets/css/core/variables.css]
- [copilot-instructions.md](../.github/copilot-instructions.md) (for full CSS tool usage)

---

**For general CSS or other pages, see the corresponding agent instruction fragment.**

# GitHub Copilot Instructions: Kiro CLI Orchestrator

## 🤖 Interaction Model

You are acting as the technical lead for an autonomous agent workflow. Your primary responsibility is to prepare specifications for the **Kiro CLI** and supervise its execution.

## 🛠️ Kiro CLI Management

When the user asks to "implement" or "fix" something, do not just write code. Instead:

1. **Prepare the Command**: Generate the exact `kiro` command needed.
   - Example: `kiro chat "Move social icons to footer per .kiro/steering/css-rules.md"`
2. **Handle Context**: Remind the user that Kiro reads from `.kiro/steering/` automatically.
3. **Build Sync**: Remind the user that after Kiro edits `assets/`, they must run the "WebGL Asset Sync" command:
   `cp themes/bryan-chasko-theme/assets/js/webgl-scenes/*.js themes/bryan-chasko-theme/static/js/webgl-scenes/`

## 🎯 Domain Specifics (Hugo & WebGL)

- **Primary CSS**: `themes/bryan-chasko-theme/assets/css/components/home.css`
- **WebGL Source**: `themes/bryan-chasko-theme/assets/js/webgl-scenes/`
- **Build Rule**: Never allow Kiro or yourself to edit files in `static/` directly. Always edit `assets/` and sync.

## 🚦 Verification Gate

Before suggesting a deploy, always instruct the user to run the test suite:
`npm test`
