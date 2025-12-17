# Bryan Chasko Theme

Custom Hugo theme for bryanchasko.com portfolio and consulting site. Forked from [PaperMod](https://github.com/adityatelange/hugo-PaperMod/) with custom modifications for Cloudcroft Cloud Company branding.

## Features

- 📱 Responsive design (mobile-first)
- 🎨 Nebula color palette
- ♿ WCAG AA accessibility
- 🚀 Performance optimized  
- 📝 Modular CSS architecture
- 🔧 Custom components (CTA buttons, service cards)
- 📊 Custom layouts (help services, portfolio)

## Installation

### As Local Theme

```bash
# Already installed at themes/bryan-chasko-theme
# Reference in hugo.toml:
theme = "bryan-chasko-theme"
```

-   Uses Hugo's asset generator with pipelining, fingerprinting, bundling and minification by default.
-   3 Modes:
    -   [Regular Mode.](https://github.com/adityatelange/hugo-PaperMod/wiki/Features#regular-mode-default-mode)
    -   [Home-Info Mode.](https://github.com/adityatelange/hugo-PaperMod/wiki/Features#home-info-mode)
    -   [Profile Mode.](https://github.com/adityatelange/hugo-PaperMod/wiki/Features#profile-mode)
-   Table of Content Generation (newer implementation).
### As Git Submodule (Future)

```bash
git submodule add https://github.com/BryanChasko/bryan-chasko-theme.git themes/bryan-chasko-theme
git submodule update --init --recursive
```

## Configuration

See main site [hugo.toml](../../hugo.toml) for configuration examples.

### Key Parameters

```toml
[params]
  env = "production"
  defaultTheme = "light"  # or "dark"
  
  [params.homeInfoParams]
    Title = "👋 Hello, Friend. ^.^"
    Content = "Your custom homepage content"
  
  [[params.socialIcons]]
    name = "github"
    url = "https://github.com/yourusername"
```

## Custom Components

### CTA Button Shortcode

```markdown
{{< cta-button href="/contact/" label="Get in Touch" emphasis="primary" >}}
{{< cta-button href="/blog/" label="Learn More" emphasis="secondary" >}}
```

**Parameters:**
- `href` (required): Destination URL
- `label` (required): Button text
- `emphasis` (optional): "primary" (purple) or "secondary" (gray), default "primary"

### Service Cards

Custom CSS for service card layouts in help/consulting pages. See [assets/css/extended/help.css](assets/css/extended/help.css).

## Customization

### Override Layouts

Create matching files in your site's `layouts/` directory:

```
your-site/
└── layouts/
    └── shortcodes/
        └── cta-button.html  # Overrides theme's version
```

### Override Styles

Create custom CSS in your site:

```
your-site/
└── assets/
    └── css/
        └── extended/
            └── custom.css
```

## Development Status

This theme is actively being modularized from PaperMod. See [THEME_DEVELOPMENT.md](../../THEME_DEVELOPMENT.md) for roadmap.

**Current Phase:** Extraction and enhancement of existing customizations

**Planned:**
- Modular CSS architecture with component-based structure
- Nebula color system implementation
- Enhanced responsive table of contents
- Comprehensive component documentation

## Credits

- **Base Theme:** [PaperMod](https://github.com/adityatelange/hugo-PaperMod/) by Aditya Telange
- **Customizations:** Bryan Chasko / Cloudcroft Cloud Company
- **Original Paper Theme:** [hugo-paper](https://github.com/nanxiaobei/hugo-paper/) by nanxiaobei

## License

MIT License - See [LICENSE](LICENSE) file for details.

This theme is forked from PaperMod which is also MIT licensed.

