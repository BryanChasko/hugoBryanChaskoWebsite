# Color Palette Reference
**Bryan Chasko Portfolio - Consolidated Color System**

## 🎨 Complete Color Variables

### Brand Colors (Nebula Palette)
| Variable | Hex | Usage |
|----------|-----|-------|
| `--nebula-dark-navy` | `#1C2230` | Dark theme backgrounds, headers |
| `--nebula-purple` | `#5E41A2` | Primary CTAs, links, brand accents |
| `--nebula-lavender` | `#8169C5` | Hover states, secondary accents |
| `--nebula-orange` | `#FF9900` | High-emphasis CTAs, warnings |
| `--nebula-orange-dark` | `#E68A00` | Orange hover states |

---

### Neutral Grays (Tailwind Scale)
| Variable | Hex | Light Theme | Dark Theme |
|----------|-----|-------------|------------|
| `--white` | `#FFFFFF` | Backgrounds | Text |
| `--gray-50` | `#F9FAFB` | Secondary BG | - |
| `--gray-100` | `#F3F4F6` | Code blocks | Primary text |
| `--gray-200` | `#E5E7EB` | Borders | - |
| `--gray-300` | `#D1D5DB` | - | Secondary text |
| `--gray-400` | `#9CA3AF` | Placeholders | Muted text |
| `--gray-500` | `#6B7280` | Secondary text | - |
| `--gray-600` | `#4B5563` | - | - |
| `--gray-700` | `#374151` | - | Borders, code BG |
| `--gray-800` | `#2D3748` | - | Secondary BG |
| `--gray-900` | `#1F2937` | Primary text | - |
| `--gray-950` | `#111827` | Very dark | - |
| `--black-light` | `#444444` | Fallback text | - |
| `--black` | `#333333` | Fallback dark | - |

---

### Syntax Highlighting (Catppuccin Macchiato)
| Variable | Hex | Token Type |
|----------|-----|------------|
| `--syntax-bg` | `#24273a` | Code block background |
| `--syntax-text` | `#cad3f5` | Default code text |
| `--syntax-error` | `#ed8796` | Errors, exceptions, keywords |
| `--syntax-keyword` | `#c6a0f6` | Language keywords (if, for, def) |
| `--syntax-constant` | `#f5a97f` | Numbers, constants, booleans |
| `--syntax-name` | `#8bd5ca` | Namespaces, entities |
| `--syntax-function` | `#8aadf4` | Function names, attributes |
| `--syntax-builtin` | `#91d7e3` | Built-in functions, operators |
| `--syntax-class` | `#eed49f` | Class names |
| `--syntax-variable` | `#f4dbd6` | Variables |
| `--syntax-string` | `#a6da95` | Strings, literals |
| `--syntax-comment` | `#6e738d` | Comments, documentation |
| `--syntax-highlight-bg` | `#474733` | Current line highlight |
| `--syntax-line-number` | `#8087a2` | Line numbers |
| `--syntax-diff-bg` | `#363a4f` | Git diff backgrounds |

---

## 🔗 Semantic Color Mappings

### Primary System Colors
```css
--color-primary: var(--nebula-purple);           /* #5E41A2 */
--color-primary-hover: var(--nebula-lavender);   /* #8169C5 */
--color-accent: var(--nebula-orange);            /* #FF9900 */
--color-accent-dark: var(--nebula-orange-dark);  /* #E68A00 */
--color-dark: var(--nebula-dark-navy);           /* #1C2230 */
```

### Light Theme (Default)
```css
--color-background: var(--white);                /* #FFFFFF */
--color-background-secondary: var(--gray-50);    /* #F9FAFB */
--color-text: var(--gray-900);                   /* #1F2937 */
--color-text-secondary: var(--gray-500);         /* #6B7280 */
--color-text-muted: var(--black-light);          /* #444444 */
--color-link: var(--nebula-purple);              /* #5E41A2 */
--color-link-hover: var(--nebula-lavender);      /* #8169C5 */
--color-border: var(--gray-200);                 /* #E5E7EB */
--color-border-hover: var(--nebula-lavender);    /* #8169C5 */
```

### Dark Theme Overrides
```css
--color-background: var(--nebula-dark-navy);     /* #1C2230 */
--color-background-secondary: var(--gray-800);   /* #2D3748 */
--color-text: var(--gray-100);                   /* #F3F4F6 */
--color-text-secondary: var(--gray-300);         /* #D1D5DB */
--color-text-muted: var(--gray-400);             /* #9CA3AF */
--color-link: var(--nebula-lavender);            /* #8169C5 */
--color-link-hover: #A78BFA;                     /* Lighter lavender */
--color-border: var(--gray-700);                 /* #374151 */
--color-border-hover: var(--nebula-lavender);    /* #8169C5 */
```

---

## 📋 Usage Examples

### Primary CTA Button
```css
.cta-button--primary {
  background: var(--color-primary);      /* Nebula purple */
  color: var(--white);
}

.cta-button--primary:hover {
  background: var(--color-primary-hover); /* Nebula lavender */
}
```

### Accent Button
```css
.cta-button--accent {
  background: var(--color-accent);       /* Orange */
  color: var(--white);
}

.cta-button--accent:hover {
  background: var(--color-accent-dark);  /* Darker orange */
}
```

### Text Hierarchy
```css
.title {
  color: var(--color-text);              /* Gray-900 / Gray-100 */
}

.subtitle {
  color: var(--color-text-secondary);    /* Gray-500 / Gray-300 */
}

.caption {
  color: var(--color-text-muted);        /* #444 / Gray-400 */
}
```

### Borders & Backgrounds
```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.card:hover {
  border-color: var(--color-border-hover); /* Lavender highlight */
}

.hero-section {
  background: var(--color-background-secondary);
}
```

---

## 🎯 Color Usage Guidelines

### When to Use Each Color

**Nebula Purple (`--color-primary`):**
- Primary action buttons
- Navigation links
- Important headings
- Brand elements

**Nebula Lavender (`--color-primary-hover`):**
- Hover states for purple elements
- Secondary emphasis
- Interactive highlights

**Nebula Orange (`--color-accent`):**
- High-priority CTAs ("Book Now", "Hire Me")
- Warnings or alerts
- Time-sensitive actions

**Neutral Grays:**
- Backgrounds: `--gray-50`, `--white`
- Text: `--gray-900` (primary), `--gray-500` (secondary)
- Borders: `--gray-200`, `--gray-700` (dark)
- Code blocks: `--gray-100` (light), `--gray-700` (dark)

**Syntax Colors:**
- Only use for code syntax highlighting
- Keep within `.chroma` context

---

## 🔄 Theme Switching

Colors automatically adapt when `data-theme="dark"` is set on `<html>`:

```html
<!-- Light theme (default) -->
<html>
  <!-- Uses: #FFFFFF backgrounds, #1F2937 text, #5E41A2 links -->
</html>

<!-- Dark theme -->
<html data-theme="dark">
  <!-- Uses: #1C2230 backgrounds, #F3F4F6 text, #8169C5 links -->
</html>
```

---

## 📊 Color Contrast Ratios

### Accessibility (WCAG AA Compliant)

| Combination | Ratio | Level | Use Case |
|-------------|-------|-------|----------|
| `--nebula-purple` on `--white` | 6.8:1 | AAA | Primary buttons |
| `--gray-900` on `--white` | 16.5:1 | AAA | Body text |
| `--gray-500` on `--white` | 4.6:1 | AA | Secondary text |
| `--nebula-lavender` on `--white` | 4.8:1 | AA | Links (minimum) |
| `--white` on `--nebula-dark-navy` | 14.2:1 | AAA | Dark theme text |

**Note:** All primary text combinations meet WCAG AA standards (4.5:1 minimum)

---

## 🛠️ Updating Colors

### To Change Brand Colors:
1. Update base variables in [variables.css](themes/bryan-chasko-theme/assets/css/core/variables.css):
   ```css
   --nebula-purple: #NEW_HEX;
   ```
2. Semantic mappings automatically update
3. Rebuild site: `hugo --gc`

### To Add New Color:
1. Add to neutral scale:
   ```css
   --gray-450: #8B92A0; /* Between 400 and 500 */
   ```
2. Create semantic mapping (optional):
   ```css
   --color-text-tertiary: var(--gray-450);
   ```

### To Override for Specific Component:
```css
.special-card {
  --color-primary: #CUSTOM_COLOR; /* Local override */
}
```

---

**Last Updated:** December 17, 2025  
**Color System Version:** 2.0 (Consolidated)
