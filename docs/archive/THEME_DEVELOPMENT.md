# Custom Theme Development Plan

## Overview

We are creating a custom Hugo theme based on PaperMod, following object-oriented principles and best practices. The custom theme will be maintained separately to preserve modifications during PaperMod updates.

## Progress Summary

**Phase 1**: ✅ Complete - Theme forked and overrides extracted  
**Phase 2**: ✅ Complete - Modular CSS architecture with Nebula palette  
**Phase 3**: 🔄 In Progress - Component documentation  
**Phase 4**: ⏳ Pending - Testing & refinement  
**Phase 5**: ⏳ Pending - Integration  

### Recently Completed
- ✅ Social Feed profile heroes on `/blog/` page with AWS Builder Center & LinkedIn cards
- ✅ Profile data files (`builder_posts.yaml`, `linkedin_posts.yaml`) with structured content
- ✅ 400+ lines of glassmorphism CSS for profile heroes and activity feed
- ✅ Terminal-style animated header on home page with typing effect
- ✅ Nebula gradient navigation chips for home info section
- ✅ Dark/light mode support across all new components

## GitHub Issues

All work items for theme development are tracked as markdown files in `.github/issues/`:

- **[Issue #1: Create Custom Theme Repository](.github/issues/01-create-custom-theme-repository.md)** ✅ - Initialize bryan-chasko-theme repo with Hugo theme structure, LICENSE, README, theme.toml
- **[Issue #2: Extract Current Overrides](.github/issues/02-extract-current-overrides.md)** ✅ - Migrate layouts/shortcodes/cta-button.html, layouts/taxonomy/tag.html, assets/css/extended/help.css to theme
- **[Issue #3: Modular CSS Architecture](.github/issues/03-modular-css-architecture.md)** ✅ - Restructure CSS into core/, components/, layouts/ with CSS custom properties
- **[Issue #4: Nebula Color Theme](.github/issues/04-nebula-color-theme.md)** ✅ - Apply Nebula palette (Dark Navy, Vibrant Purple, Lavender, Amazon Orange) with accessibility checks
- **[Issue #5: Responsive Table of Contents](.github/issues/05-responsive-table-of-contents.md)** 🔄 - Desktop fixed sidebar, mobile collapsible accordion, auto-highlight on scroll
- **[Issue #6: Component Documentation](.github/issues/06-component-documentation.md)** 🔄 - Document all components with usage examples, parameters, customization options
- **[Issue #7: Theme README and Configuration](.github/issues/07-theme-readme-and-configuration.md)** 🔄 - Comprehensive README with installation, configuration reference, troubleshooting
- **[Issue #8: Integration Testing and Deployment](.github/issues/08-integration-testing-and-deployment.md)** ⏳ - Cross-browser testing, accessibility audit, performance benchmarks, production deploy

## Architecture Principles

### Object-Oriented Design
- **Modularity**: Components are isolated and reusable (layouts/partials)
- **Inheritance**: Hugo's lookup order provides natural inheritance from base theme
- **Encapsulation**: CSS and JS scoped to specific components
- **Composition**: Partials compose into complete layouts

### Directory Structure

```
bryan-chasko-theme/          # Custom theme repository (separate)
├── LICENSE
├── README.md
├── theme.toml
├── archetypes/
│   └── default.md
├── assets/
│   ├── css/
│   │   ├── core/             # Core styling (typography, layout)
│   │   ├── components/       # Component-specific styles
│   │   │   ├── header.css
│   │   │   ├── footer.css
│   │   │   ├── toc.css
│   │   │   └── social-icons.css
│   │   ├── themes/           # Color themes
│   │   │   ├── nebula.css
│   │   │   └── light.css
│   │   └── extended/         # User customizations
│   └── js/
│       ├── core/
│       └── components/
├── layouts/
│   ├── _default/
│   │   ├── baseof.html      # Base template
│   │   ├── single.html      # Single page layout
│   │   └── list.html        # List layout
│   ├── partials/
│   │   ├── head.html        # Head component
│   │   ├── header.html      # Header component
│   │   ├── footer.html      # Footer component
│   │   ├── toc.html         # Table of contents
│   │   └── social-icons.html
│   └── shortcodes/
│       └── cta-button.html
├── i18n/                     # Internationalization
└── static/
    ├── favicon.ico
    └── assets/
```

## Current State vs Target State

### Current (Override Approach)
- ✅ Modifications in `layouts/` and `assets/` override PaperMod
- ✅ Changes tracked in version control
- ⚠️ Tightly coupled to PaperMod structure
- ⚠️ No clear separation of custom vs inherited code
- ⚠️ Difficult to share/reuse across projects

### Target (Custom Theme)
- ✅ Standalone theme repository
- ✅ Clear inheritance from PaperMod (documented)
- ✅ Modular component architecture
- ✅ Easy to version and share
- ✅ Can be published to Hugo Themes

## Migration Strategy

### Phase 1: Extract & Organize (Week 1)
1. Create new repository: `bryan-chasko-theme`
2. Copy current `layouts/` and `assets/` overrides
3. Organize by component (header, footer, toc, etc.)
4. Document what each override does
5. Create theme.toml

### Phase 2: Modularize CSS (Week 2)
1. Split monolithic CSS into components
2. Create Nebula theme file
3. Implement CSS custom properties (variables)
4. Remove redundant styles
5. Add component-level documentation

### Phase 3: Component Documentation (Week 3)
1. Document each layout partial
2. Add JSDoc for JavaScript
3. Create component usage examples
4. Write theme README

### Phase 4: Testing & Refinement (Week 4)
1. Test all pages for visual regression
2. Validate HTML/CSS
3. Check responsive breakpoints
4. Test dark/light mode toggle
5. Performance audit

### Phase 5: Integration
1. Add custom theme as Git submodule
2. Update hugo.toml to use custom theme
3. Remove old override files
4. Deploy and validate

## Component Responsibilities

### Header Component
- Site logo/branding
- Navigation menu
- Theme toggle
- Responsive hamburger menu

### Footer Component  
- Social icons
- Copyright
- Privacy policy link
- Powered by attribution

### TOC Component
- Automatic heading detection
- Active section highlighting
- Responsive behavior
- Scroll synchronization

### Social Icons Component
- Reusable social links
- SVG icons
- Configurable via site params
- Used in header, footer, profile

## Theme Configuration

### Site Params (hugo.toml)
```toml
[params]
  theme_name = "bryan-chasko-theme"
  
  [params.branding]
    logo = "/logo_filled_outlined_6.png"
    logo_height = 35
    
  [params.theme]
    default = "light"  # light, dark, auto
    palette = "nebula" # nebula, default
    
  [params.features]
    toc_sidebar = true
    comments = true
    analytics = true
```

## Development Workflow

### Local Development
```bash
# Clone theme repo
cd themes/
git clone https://github.com/BryanChasko/bryan-chasko-theme.git

# Or as submodule
git submodule add https://github.com/BryanChasko/bryan-chasko-theme.git themes/bryan-chasko-theme

# Start Hugo with theme
hugo server --theme=bryan-chasko-theme
```

### Making Changes
1. Edit files in `themes/bryan-chasko-theme/`
2. Test locally
3. Commit to theme repository
4. Update submodule in main site

### Versioning
- Use semantic versioning (v1.0.0, v1.1.0, etc.)
- Tag releases in theme repository
- Pin to specific version in main site

## Nebula Theme Colors

### Palette
- **Dark Navy**: `#1C2230` - Background (dark mode)
- **Vibrant Purple**: `#5E41A2` - Primary accent, headers
- **Lavender**: `#8169C5` - Secondary accent
- **Amazon Orange**: `#FF9900` - Calls to action, hover states

### Implementation
Located in `assets/css/themes/nebula.css`

## Dependencies

### Hugo Version
- Minimum: v0.152.2 (current version used)
- Modules: Extended version required

### External Libraries
- None currently (self-contained)
- KaTeX loaded via CDN for math rendering

## Maintenance

### Updating from PaperMod
When PaperMod releases updates:
1. Review PaperMod changelog
2. Identify relevant changes
3. Manually merge into custom theme
4. Test thoroughly
5. Tag new version

### Best Practices
- Keep modifications documented
- Comment non-obvious code
- Test across browsers
- Maintain backward compatibility
- Update CHANGELOG.md

## Resources

- [Hugo Themes Documentation](https://gohugo.io/hugo-modules/theme-components/)
- [PaperMod Source](https://github.com/adityatelange/hugo-PaperMod)
- [Hugo Lookup Order](https://gohugo.io/templates/lookup-order/)
- [Theme Components Guide](https://gohugo.io/hugo-modules/theme-components/)

## Key Theme Files

### CSS Components (`themes/bryan-chasko-theme/assets/css/components/`)
| File | Purpose |
|------|---------|
| `home.css` | Terminal header animation, navigation chips, builder card |
| `social-feed.css` | Profile heroes, activity feed, engagement stats |
| `header.css` | Site header, logo, navigation, theme toggle |
| `footer.css` | Site footer layout |
| `social-icons.css` | SVG social icon styling |

### Layouts (`themes/bryan-chasko-theme/layouts/partials/`)
| File | Purpose |
|------|---------|
| `home_info.html` | Home page content with terminal animation |
| `social_feed.html` | Blog page profile heroes and activity feed |
| `social_icons.html` | Reusable social icons component |

### Data Files (`data/`)
| File | Purpose |
|------|---------|
| `builder_posts.yaml` | AWS Builder Center profile & articles |
| `linkedin_posts.yaml` | LinkedIn profile & featured posts |

## GitHub Issues Checklist

See [.github/issues/](/.github/issues/) for tracked work items:
- [x] Issue #1: Create Custom Theme Repository
- [x] Issue #2: Extract and Organize Current Overrides  
- [x] Issue #3: Implement Modular CSS Architecture
- [x] Issue #4: Create Nebula Color Theme
- [ ] Issue #5: Implement Responsive TOC Component
- [ ] Issue #6: Add Component Documentation
- [ ] Issue #7: Create Theme README and Examples
- [ ] Issue #8: Integration Testing and Deployment
