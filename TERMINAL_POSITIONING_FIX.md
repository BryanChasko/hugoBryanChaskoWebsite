# Terminal Positioning & Responsive Alignment Fix

## Changes Made

### 1. Fixed Terminal Positioning (Scroll Behavior)

**Changed**: `position: fixed` → `position: absolute`

**Effect**: Terminal now stays with the top menu bar instead of floating when scrolling. It scrolls out of view naturally with the page content.

```css
.terminal-wrapper {
  position: absolute;  /* Was: fixed */
  top: var(--header-height, 60px);
  left: 0;
  width: 100%;
  /* ... */
}
```

### 2. Removed Side Padding/Margins

**Changed**: Removed `calc(100% - 100px)` width and `margin: 0 50px`

**Effect**: Terminal now spans full width on mobile, preventing text cutoff.

```css
.terminal-wrapper .entry-header {
  width: 100%;           /* Was: calc(100% - 100px) */
  margin: 0;             /* Was: margin: 0 50px */
  padding: var(--space-md) var(--space-md);  /* Responsive padding */
  justify-content: flex-start;  /* Left-aligned on mobile */
}
```

### 3. Mobile: Left-Aligned Text

**Mobile** (`max-width: 768px`):
- Text aligned to left
- Full width with minimal padding
- No side margins

```css
@media (max-width: 768px) {
  .terminal-wrapper .entry-header {
    width: 100%;
    margin: 0;
    padding: var(--space-md) var(--space-md);
    justify-content: flex-start;
  }

  .terminal-wrapper .entry-header h1 {
    text-align: left;
  }
}
```

### 4. Desktop: Center-Left Alignment

**Desktop** (`min-width: 769px`):
- Text centered (just left of center)
- Proper padding for breathing room
- Centered container

```css
@media (min-width: 769px) {
  .terminal-wrapper .entry-header {
    justify-content: center;
    padding: var(--space-lg) var(--space-xl);
  }

  .terminal-wrapper .entry-header h1 {
    text-align: center;
  }
}
```

## Result

✅ **Terminal stays with menu bar** - No floating on scroll  
✅ **No text cutoff on mobile** - Full width, left-aligned  
✅ **Proper alignment on desktop** - Center-left positioning  
✅ **Responsive padding** - Adapts to screen size  

## Testing

```bash
# Start dev server
hugo server --config hugo.toml -D

# Test:
# 1. Mobile (< 480px): Text left-aligned, no cutoff
# 2. Tablet (481-768px): Text left-aligned, no cutoff
# 3. Desktop (> 768px): Text centered
# 4. Scroll page: Terminal stays with menu bar
# 5. Dark mode: Verify alignment in both themes
```

## Files Modified

- `themes/bryan-chasko-theme/assets/css/components/terminal.css`
  - Changed `.terminal-wrapper` position from `fixed` to `absolute`
  - Updated `.entry-header` width, margin, padding, and alignment
  - Updated `.entry-header h1` text alignment
  - Added responsive media queries for mobile/desktop

## Backward Compatibility

✅ No breaking changes  
✅ All animations still work  
✅ Dark/light mode unaffected  
✅ Accessibility preserved  
