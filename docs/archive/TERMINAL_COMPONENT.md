# Terminal Greeting Component

A reusable, modular terminal-style greeting component with customizable messages, dark/light mode support, and SSR-friendly implementation.

## Overview

The terminal component has been extracted into a standalone partial for reusability across templates. It includes:

- **Reusable Partial**: `terminal_greeting.html` - Accepts custom props
- **Dedicated CSS**: `terminal.css` - All terminal-specific styles
- **Generic JavaScript**: `terminal-overlay.js` - Auto-dismiss logic
- **Full Documentation**: This file

## File Structure

```
themes/bryan-chasko-theme/
├── layouts/partials/
│   └── terminal_greeting.html          # Reusable terminal component
├── assets/css/components/
│   ├── terminal.css                    # Terminal-specific styles (NEW)
│   └── home.css                        # Home page styles (cleaned)
└── static/js/
    └── terminal-overlay.js             # Auto-dismiss logic (updated)
```

## Usage

### Basic Usage (Default Props)

```hugo
{{ partial "terminal_greeting.html" . }}
```

Renders with defaults:
- Message: "Hello, Friend"
- User: "^.^"
- Prompt: "$"
- Social icons: Visible

### Custom Message

```hugo
{{ partial "terminal_greeting.html" (dict 
    "message" "Welcome to my site"
    "user" "user"
    "prompt" ">"
) }}
```

### Without Social Icons

```hugo
{{ partial "terminal_greeting.html" (dict 
    "message" "Loading..."
    "showSocialReveal" false
) }}
```

### With Custom CSS Classes

```hugo
{{ partial "terminal_greeting.html" (dict 
    "message" "Custom Terminal"
    "class" "my-custom-terminal"
) }}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | string | "Hello, Friend" | Text displayed after prompt |
| `user` | string | "^.^" | User indicator (left of prompt) |
| `prompt` | string | "$" | Prompt character |
| `class` | string | "" | Additional CSS classes for wrapper |
| `showSocialReveal` | bool | true | Show social icons reveal animation |

## Styling & Theming

### Light Mode
- **Background**: Frosted glass with purple tint
- **Text**: Purple glow effect
- **Cursor**: Purple with white text
- **Prompt**: Orange with glow

### Dark Mode (CRT/Matrix Style)
- **Background**: Deep black with green phosphor effect
- **Text**: Classic green (#00ff41) with glow
- **Cursor**: Green with glow
- **Prompt**: Cyan with glow

### CSS Variables Used

The component respects these CSS variables:

```css
--nebula-purple          /* Light mode primary color */
--nebula-orange          /* Prompt color */
--nebula-lavender        /* Dark mode primary color */
--header-height          /* Top offset (default: 60px) */
--space-lg, --space-xl   /* Spacing */
--font-mono              /* Monospace font */
--transition-base        /* Animation timing */
```

## Animation Timeline

```
0ms ─────────────────────────────────────────────────────────────────── 8500ms
│                                                                        │
├─ 0-600ms: Slide down from top                                        │
├─ 600-8600ms: Glitch effect (flicker + distortion)                   │
├─ 7600-8400ms: Fade out                                              │
└─ 8500ms: Dismiss (aria-hidden + pointer-events: none)               │
```

### Keyframes

- `terminal-slide-down`: Entrance animation
- `terminal-glitch`: Glitch effect with screen flicker
- `terminal-fade-out`: Exit animation
- `typing-loop`: Text typing effect
- `cursor-blink`: Cursor blinking
- `crt-flicker`: CRT screen flicker
- `scanline-move`: Scanline animation
- `social-reveal`: Social icons fade-in

## Accessibility

- **ARIA Live Region**: `role="status"` + `aria-live="polite"` for screen readers
- **Semantic HTML**: Proper heading hierarchy
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Color Contrast**: Meets WCAG AA standards in both light and dark modes
- **Dismissal**: Auto-dismisses after animation, removes from tab order

## SSR Compatibility

✅ **Fully SSR-friendly**

- No JavaScript required for rendering (progressive enhancement)
- All animations use CSS (no JS-dependent layout)
- Partial renders static HTML
- JavaScript only handles auto-dismiss (non-critical)

## Integration Examples

### Home Page (Current)

```hugo
{{ partial "terminal_greeting.html" (dict 
    "message" "Hello, Friend"
    "user" "^.^"
    "prompt" "$"
    "showSocialReveal" true
) }}
```

### Blog Page (Example)

```hugo
{{ partial "terminal_greeting.html" (dict 
    "message" "Latest Articles"
    "user" "blog"
    "prompt" ">"
    "showSocialReveal" false
) }}
```

### Projects Page (Example)

```hugo
{{ partial "terminal_greeting.html" (dict 
    "message" "My Work"
    "user" "projects"
    "prompt" "~"
) }}
```

## Customization

### Changing Animation Duration

Edit `terminal.css` keyframes:

```css
@keyframes terminal-slide-down {
  /* Adjust timing here */
}
```

Update dismiss timeout in `terminal-overlay.js`:

```javascript
setTimeout(() => {
  // Change 8500 to your desired milliseconds
}, 8500);
```

### Changing Colors

Override CSS variables in your theme:

```css
:root {
  --nebula-purple: #your-color;
  --nebula-orange: #your-color;
}

[data-theme="dark"] {
  --nebula-lavender: #your-color;
}
```

### Disabling Animations

Add to your CSS:

```css
.terminal-wrapper {
  animation: none !important;
}

.terminal-wrapper * {
  animation: none !important;
}
```

## Performance

- **CSS-based animations**: GPU-accelerated, smooth 60fps
- **No layout thrashing**: Uses `will-change` and `transform`
- **Minimal JavaScript**: Only 8.5s timeout for dismiss
- **Lazy-loaded**: Partial only renders when included

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | All features supported |
| IE 11 | ⚠️ Partial | No CSS animations, basic rendering |

## Testing

### Visual Regression

The terminal component is tested via Playwright:

```bash
npm test
```

Tests verify:
- Text rendering and color accuracy
- Animation timing
- Dark/light mode switching
- Social icons reveal
- Accessibility attributes

### Manual Testing

1. **Light Mode**: Verify purple glow and frosted glass effect
2. **Dark Mode**: Verify green phosphor CRT effect
3. **Mobile**: Verify responsive sizing and positioning
4. **Keyboard**: Tab through social icons after reveal
5. **Screen Reader**: Verify ARIA labels are announced

## Troubleshooting

### Terminal not appearing

- Check if `terminal-overlay.js` is loaded
- Verify `.terminal-wrapper` class is present
- Check browser console for errors

### Animation stuttering

- Disable browser extensions
- Check for CPU throttling
- Verify GPU acceleration is enabled

### Colors not matching theme

- Verify CSS variables are defined
- Check for CSS specificity conflicts
- Inspect computed styles in DevTools

### Social icons not revealing

- Verify `showSocialReveal` is `true`
- Check if `social_icons.html` partial exists
- Verify animation timing (8.5s default)

## Future Enhancements

- [ ] Configurable animation duration
- [ ] Custom animation presets (fade, slide, etc.)
- [ ] Keyboard shortcut to dismiss early
- [ ] Sound effects (optional)
- [ ] Multiple message sequences
- [ ] Integration with page transitions

## Related Files

- [WEBGL_ARCHITECTURE.md](WEBGL_ARCHITECTURE.md) - WebGL scene integration
- [TESTING.md](TESTING.md) - Visual regression testing
- [MARKDOWN_GUIDE.md](MARKDOWN_GUIDE.md) - Content guidelines

## Questions?

See the component in action:
- Home page: `content/_index.md`
- Partial: `themes/bryan-chasko-theme/layouts/partials/terminal_greeting.html`
- Styles: `themes/bryan-chasko-theme/assets/css/components/terminal.css`
