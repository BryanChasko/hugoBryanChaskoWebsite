## Overview
This document provides a comprehensive audit of all spacing, layout, and CSS elements affecting the front page of the site. It covers:
- Spacing variables and scale
- Responsive breakpoints and media queries
- Key components: terminal, builder card, social icons, animated backgrounds
- Color and typography variables
- Glassmorphism, gradients, and dark mode
- Accessibility and touch targets

---

## 1. Spacing & Layout Variables
- **Spacing scale:**
  - `--space-xs`: 0.25rem (4px)
  - `--space-sm`: 0.5rem (8px)
  - `--space-md`: 1rem (16px)
  - `--space-lg`: 1.5rem (24px)
  - `--space-xl`: 2rem (32px)
  - `--space-2xl`: 3rem (48px)
  - `--space-3xl`: 4rem (64px)
- **Container widths:**
  - `--container-max-width`: 1200px
  - `--content-max-width`: 65ch
  - `--container-padding`: var(--space-lg)
- **Border radius:**
  - `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px), `--radius-xl` (12px), `--radius-full` (9999px)

## 2. Responsive Design
- **Breakpoints:**
  - 480px (mobile), 768px (tablet), 1024px (desktop)
- **Font sizes:**
  - Use of `clamp()` for responsive scaling
- **Media queries:**
  - Layout, font, and button adjustments for each breakpoint
- **Touch targets:**
  - All interactive elements use sufficient padding and min-height

## 3. Key Home Page Components
### Terminal
- `.terminal-wrapper`, `.entry-header` use glassmorphism, animated backgrounds
- Responsive font and padding
- No text cutoff (line-clamp unset)

### Social Icons
- `.terminal-social-reveal`, `.home-info .social-icons` centered, flex layout
- Pointer-events: auto for links, none for container
- Responsive stacking on mobile

### Builder Card
- `.builder-card` uses glassmorphism, gradients, blur, and shadow
- Responsive grid/flex for content and CTA
- Canvas overlay for WebGL scene
- Accent line and glow on hover

### Animated Backgrounds
- `body::before`, `body::after`, `.main::before` (see nebula.css)
- Respect `prefers-reduced-motion`

## 4. Color & Typography
- **Colors:**
  - Brand: `--nebula-purple`, `--nebula-lavender`, `--nebula-orange`
  - Semantic: `--color-background`, `--color-text`, `--color-link`, etc.
- **Typography:**
  - Font scale: `--font-size-xs` (12px) to `--font-size-4xl` (36px)
  - Line heights: `--line-height-tight`, `--line-height-base`, `--line-height-relaxed`

## 5. Glassmorphism & Gradients
- Used for terminal, builder card, Instagram card
- Gradients: `--gradient-github`, `--gradient-insta`
- Backdrop-filter: blur(6-8px)

## 6. Dark Mode
- All major components have `[data-theme="dark"]` overrides
- Colors, backgrounds, borders, and shadows adapt for accessibility

## 7. Accessibility
- All animations respect `prefers-reduced-motion`
- Color contrast meets WCAG AA
- Social icons and buttons are keyboard accessible

## 8. Known Issues & Recommendations
- **Spacing bugs:** Check for margin collapse, negative margins, and stacking context issues
- **Overflow:** Ensure no text or button overflow on mobile
- **Touch targets:** Validate all buttons/icons share a minimum height
- **Light Mode / Dark mode:** Test all elements for contrast and background blending
- **Animated backgrounds:** Confirm fallback for reduced motion

---

**References:**
- home.css, variables.css, nebula.css (see theme assets)
- [copilot-instructions.md](../../../.github/copilot-instructions.md)
- [THEME_DEVELOPMENT.md](../../../THEME_DEVELOPMENT.md)
