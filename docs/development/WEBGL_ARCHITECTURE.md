# WebGL Visual Effects Architecture

Complete reference for WebGL scene integration, styling, and lifecycle management.

## Quick Reference

| Scene | Location | DOM Hook | CSS Variables | Status |
|-------|----------|----------|----------------|--------|
| **Constellation** | Home hero | `[data-constellation]` | `--cosmic-primary`, `--cosmic-accent` | ✅ Live & tested |
| **Orbit** | Builder card | `[data-orbit-scene]` | `--cosmic-teal`, `--cosmic-energy` | ✅ Responsive (Dec 2025) |
| **Transition** | Page nav | `#webgl-transition-overlay` | None (shader-based) | ✅ Functional |
| **Skills Network** | Skills page | `[data-skills-network]` | `--brand-*` category colors | ❌ Code ready, needs integration |
| **Ripple** | Blog cards | `[data-ripple]` | `--brand-purple`, `--brand-lavender` | ❌ Code ready, needs integration |

---

## Architecture Overview

### BaseScene (Foundation Class)

**File**: `themes/bryan-chasko-theme/static/js/webgl-scenes/BaseScene.js`
**Purpose**: Abstract WebGL context management and lifecycle

**Responsibilities**:
- WebGL context initialization and error handling
- Canvas sizing and viewport management
- Resize event listener with observer pattern
- Shader compilation utilities
- Resource cleanup (dispose pattern)

**Key Methods**:
```javascript
class BaseScene {
  // Lifecycle
  constructor(container, options)
  start()                          // Called after initialization
  pause()                          // Called on visibility change / idle timeout
  dispose()                        // Cleanup WebGL resources
  
  // Resize handling
  handleResize()                   // Window resize listener
  onResize()                       // Override in subclass for custom logic
  
  // Rendering
  render(deltaTime)                // Called by animation loop
  
  // Utilities
  compileShader(source, type)      // Compile GLSL fragment/vertex shaders
  createProgram(vsSource, fsSource)
}
```

**Resize Event Flow**:
```
window.resize event
    ↓
BaseScene.handleResize()
    ↓
Update this.options.width/height
    ↓
Update canvas.width/height (WebGL viewport)
    ↓
Call this.onResize() ← Subclass override point
    ↓
Subclass recalculates dependent properties
```

---

## Scene Integration Guide

### 1. Constellation Scene

**Status**: ✅ Live and tested

**Location**: `themes/bryan-chasko-theme/static/js/constellation.js`

**DOM Integration**:
```html
<div class="constellation-hero webgl-container" data-constellation aria-hidden="true">
  <div class="webgl-fallback webgl-fallback--hero"></div>
</div>
```

**CSS Setup**:
```css
.constellation-hero {
  position: fixed;          /* Full viewport */
  width: 100vw;
  height: 100vh;
  z-index: -2;              /* Behind all content */
  pointer-events: none;     /* Allow clicks through */
  overflow: hidden;
}
```

**Initialization**: Self-initializing via DOMContentLoaded on `[data-constellation]` containers

**Features**:
- 80 particles with connecting lines
- Mouse influence (attract/repel)
- Orange/gold color scheme
- Theme-aware color transitions
- Reduced motion support

**Console Logs**:
- `[Constellation] Found X constellation container(s)`
- `[Constellation] Initializing constellation X...`
- `[Constellation] Successfully initialized constellation X`

---

### 2. Orbit Scene (Responsive Example)

**Status**: ✅ Responsive with dynamic center recalculation (December 2025)

**Location**: `themes/bryan-chasko-theme/static/js/webgl-scenes/OrbitScene.js`

**DOM Integration**:
```html
<div class="builder-card" data-orbit-scene>
  <a href="..." class="builder-card-link">
    <div class="builder-card-content">
      <!-- Card content -->
    </div>
  </a>
</div>
```

**CSS Setup**:
```css
.builder-card {
  position: relative;        /* Establish positioning context */
  z-index: 1;                /* Content above canvas */
}

.builder-card[data-orbit-scene] canvas {
  position: absolute;        /* Overlay on card */
  z-index: 3;                /* Above link text (z-index: 2) */
  pointer-events: none;      /* Click-through to button */
  width: 240px;              /* Set by SceneInitializer */
  height: 240px;
}
```

**Initialization**: Via `SceneInitializer.initHomeScenes()` after DOMContentLoaded

**Features**:
- 3 concentric orbits (15 particles each)
- Varying speeds (0.3, 0.5, 0.8 rad/s)
- Particle trails with fade effect
- **Responsive sizing** (120-240px canvas)
- **Dynamic center recalculation** on window resize

**CSS Variables**:
```css
--cosmic-teal: #00CED1;        /* Orbit particle color */
--cosmic-energy: #00FA9A;      /* Center node color */
```

**Recent Fix**: [Responsive Orbit Canvas Implementation](RESPONSIVE_ORBIT_FIX.md)
- Canvas now scales between 120-240px based on container
- `onResize()` method recalculates center position on window resize
- Orbit radii scale proportionally (no distortion)

---

### 3. Transition Scene

**Status**: ✅ Functional (texImage2D parameter fix applied)

**Location**: `themes/bryan-chasko-theme/static/js/webgl-scenes/TransitionScene.js`

**DOM Integration**:
```javascript
// Auto-created by SceneInitializer.initTransitionScene()
// Creates: <div id="webgl-transition-overlay"></div>
```

**CSS Setup**:
```css
#webgl-transition-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;              /* Above all content during transition */
  pointer-events: none;       /* Clicks pass through when invisible */
}
```

**Features**:
- Noise texture generation for pixelated dissolve
- Fragment shader with time-based fade
- Navigation interception with 300ms animation
- Reduced motion support (instant transition if preferred)

**Implementation Notes**:
- Fixed: texImage2D parameter type correction (December 18, 2025)
- Internalizes navigation clicks, shows transition, then navigates
- Fully contained within SceneInitializer lifecycle

---

### 4. Skills Network Scene (Ready for Integration)

**Status**: ❌ Code complete, awaiting integration

**Location**: `themes/bryan-chasko-theme/static/js/webgl-scenes/SkillsNetworkScene.js`

**Data File**: `data/skills-network.yaml`

**Proposed DOM Integration**:
```html
<!-- In skills page layout -->
<div class="skills-section">
  <h2>Technical Skills</h2>
  <div class="skills-network-container" data-skills-network>
    <!-- WebGL canvas will overlay -->
  </div>
  <!-- Fallback: Skills list below canvas -->
</div>
```

**Required CSS Setup**:
```css
.skills-network-container {
  position: relative;
  height: 400px;            /* Adjust for your layout */
  background: var(--color-background-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.skills-network-container canvas {
  position: absolute;
  top: 0; left: 0;
  z-index: 2;
  pointer-events: auto;     /* Enable drag interaction */
}
```

**CSS Variables** (by category):
```css
--brand-purple: #5E41A2;        /* Cloud/Infrastructure */
--brand-orange: #FF9900;        /* Frontend/UI */
--brand-lavender: #8169C5;      /* Backend/Data */
```

**Features**:
- Force-directed physics simulation
- Draggable/interactive nodes
- Connection lines between related skills
- 49 skill nodes across 6 categories
- Collision detection

**Integration Steps**:
1. Add `data-skills-network` attribute to skills page container
2. Create layout in `layouts/blog/posts/my-skills-and-experience.html` (or similar)
3. SceneInitializer will auto-detect and initialize
4. Verify CSS variables match palette in `nebula.css`

---

### 5. Ripple Scene (Ready for Integration)

**Status**: ❌ Code complete, awaiting integration

**Location**: `themes/bryan-chasko-theme/static/js/webgl-scenes/RippleScene.js`

**Proposed DOM Integration**:
```html
<!-- In blog post card partial -->
<article class="post-entry" data-ripple>
  <h2 class="entry-title">Post Title</h2>
  <p class="entry-summary">Post excerpt...</p>
  <a href="#" class="read-more">Read Full Article →</a>
</article>
```

**Required CSS Setup**:
```css
.post-entry[data-ripple] {
  position: relative;
  overflow: hidden;           /* Clip ripple to card bounds */
  cursor: pointer;            /* Click feedback */
}

.post-entry[data-ripple] canvas {
  position: absolute;
  top: 0; left: 0;
  z-index: 1;                 /* Below text, above background */
  pointer-events: none;       /* Click passes to card */
}

.post-entry[data-ripple] h2,
.post-entry[data-ripple] .entry-summary {
  position: relative;
  z-index: 2;                 /* Above canvas */
}
```

**CSS Variables**:
```css
--brand-purple: #5E41A2;        /* Ripple wave color */
--brand-lavender: #8169C5;      /* Secondary ring color */
```

**Features**:
- Click/touch-triggered ripple animation
- Expanding wave with fade
- Multi-ring ripple pattern
- Respects card boundaries (overflow hidden)
- Performance optimized for multiple cards

**Integration Steps**:
1. Add `data-ripple` attribute to post card wrapper
2. Update `layouts/_default/single.html` or card partial
3. Ensure `overflow: hidden` CSS on container
4. SceneInitializer auto-detects and initializes all instances
5. Test touch/click behavior on mobile devices

---

## Initialization System

### SceneInitializer.js

**File**: `themes/bryan-chasko-theme/static/js/webgl-scenes/SceneInitializer.js`

**Purpose**: Auto-detect and initialize WebGL scenes on page load

**Lifecycle**:
```
DOMContentLoaded
    ↓
SceneInitializer.init()
    ↓
Detect all scene containers (data-* attributes)
    ↓
Initialize OrbitScene (home page)
    ↓
Initialize TransitionScene (global)
    ↓
Initialize SkillsNetworkScene (if present)
    ↓
Initialize RippleScenes (all blog cards with data-ripple)
    ↓
Scene lifecycle management (pause on visibility change, cleanup on timeout)
```

**Auto-Detection Pattern**:
```javascript
// Container in HTML
<div data-orbit-scene></div>

// SceneInitializer detects
const container = document.querySelector('[data-orbit-scene]');

// Initializes
const scene = new OrbitScene(container, options);

// Stores reference
window.__scenes = window.__scenes || [];
window.__scenes.push(scene);
```

**Console Output**:
- `[SceneInitializer] Initializing WebGL scenes...`
- `[WebGL] OrbitScene initialized on home page`
- `[WebGL] TransitionScene initialized globally`
- `[SkillsNetworkScene] Force-directed graph initialized with 49 nodes`

---

## Color Palette Integration

### CSS Variables System

**File**: `themes/bryan-chasko-theme/assets/css/extended/nebula.css`

**Available Palettes**:

1. **Vibrant Cosmic** (default, used by Orbit Scene)
   ```css
   --cosmic-teal: #00CED1;
   --cosmic-energy: #00FA9A;
   --cosmic-primary: #5E41A2;
   --cosmic-accent: #FF9900;
   ```

2. **Brand Colors** (used by Skills Network, Ripple)
   ```css
   --brand-purple: #5E41A2;
   --brand-lavender: #8169C5;
   --brand-orange: #FF9900;
   --brand-orange-dark: #E68A00;
   ```

3. **Theme-Aware Switching**
   ```css
   /* Light mode */
   --color-text: var(--gray-900);
   --color-background: var(--white);
   
   /* Dark mode */
   [data-theme="dark"] {
     --color-text: var(--gray-100);
     --color-background: var(--brand-dark-navy);
   }
   ```

**Usage in WebGL**:
```javascript
// JavaScript can read CSS variables
const style = getComputedStyle(document.documentElement);
const teaColor = style.getPropertyValue('--cosmic-teal');  // '#00CED1'

// Convert hex to RGB for WebGL
const rgb = hexToRGB(teaColor);  // { r: 0, g: 206, b: 209 }
```

---

## Testing & Regression Prevention

See [TESTING.md](TESTING.md) for complete details on:

- **Visual Regression Tests**: Screenshot comparison with baseline validation
- **Pixel Color Validation**: RGB value extraction and assertion
- **Performance Budgets**: Init time, FPS, memory constraints
- **Cross-browser Testing**: Chrome, Firefox, Safari consistency
- **Regression Test Gate**: Mandatory test passing before `deploy.pl` proceeds

**Key Principle**: "No more unsubstantiated claims" — All WebGL changes are visually verified with pixel-perfect tests.

---

## Development Workflow

### Local Development

```bash
# 1. Edit WebGL source files
# themes/bryan-chasko-theme/assets/js/webgl-scenes/*.js

# 2. Rebuild Hugo (copies assets to static/)
hugo --minify

# 3. Hard refresh browser (bypass cache)
# macOS: Cmd+Shift+R
# Windows/Linux: Ctrl+Shift+R

# 4. Run tests to verify changes
npm test
```

### Common Tasks

**Add a new WebGL scene**:
1. Create `themes/bryan-chasko-theme/static/js/webgl-scenes/MyScene.js` extending `BaseScene`
2. Add data attribute to HTML: `<div data-my-scene></div>`
3. Register in `SceneInitializer.init()` with auto-detection
4. Add CSS variables to `nebula.css` if using color palette
5. Create test file: `tests/webgl/my-scene.spec.js`
6. Run tests: `npm test`

**Update scene styling**:
1. Edit `themes/bryan-chasko-theme/assets/css/components/home.css` or relevant CSS file
2. Rebuild: `hugo --minify`
3. Hard refresh browser
4. Verify with tests: `npm test`

**Fix responsive issues**:
1. Check canvas sizing in scene constructor
2. Override `onResize()` method if center position needs recalculation
3. Test at multiple viewport sizes
4. Verify with tests: `npm test`

---

## Performance Optimization

### GPU Tier Detection

For future optimization, consider detecting GPU capabilities:
```javascript
// Detect WebGL extensions
const gl = canvas.getContext('webgl');
const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
const maxAnisotropy = gl.getExtension('EXT_texture_filter_anisotropic');

// Adjust quality based on GPU
if (maxTexture < 2048) {
  // Low-end GPU: reduce particle count, simplify shaders
  options.particleCount = 5;
} else if (maxTexture >= 4096) {
  // High-end GPU: increase detail
  options.particleCount = 20;
}
```

### Memory Management

- Dispose scenes when visibility hidden (auto-paused after 3 minutes idle)
- Cleanup event listeners in `dispose()` method
- Use WebGL vertex buffer pooling for multiple scenes
- Monitor with DevTools Performance tab

---

## Browser Support

| Browser | WebGL | Support | Notes |
|---------|-------|---------|-------|
| Chrome 90+ | 2.0 | ✅ Full | Default target |
| Firefox 88+ | 2.0 | ✅ Full | Fully compatible |
| Safari 14+ | 1.0 | ✅ Basic | WGL 1.0 only, reduced extensions |
| Edge 90+ | 2.0 | ✅ Full | Chromium-based |

---

## Troubleshooting

### Scene not initializing

**Check**:
1. Is the data attribute present? `<div data-orbit-scene></div>`
2. Is SceneInitializer loaded? Check console for `[SceneInitializer]` logs
3. Browser console for WebGL errors
4. Is the scene file included in footer? Check `layouts/partials/footer.html`

### Canvas displays as blank

**Check**:
1. WebGL context error? Check console for `WebGL errors`
2. Shader compilation failed? Look for `Shader compilation failed`
3. Browser cache? Hard refresh (Cmd+Shift+R)
4. CSS `pointer-events: none` blocking? Should allow clicks through

### Responsive sizing broken

**Check**:
1. Is `onResize()` method overridden in scene class?
2. Are center position/radius values being updated?
3. Run tests: `npm test` — pixel validation will catch distortion

See [RESPONSIVE_ORBIT_FIX.md](RESPONSIVE_ORBIT_FIX.md) for responsive sizing implementation details.

---

## References

- **Project README**: [README.md](README.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Responsive Orbit Fix**: [RESPONSIVE_ORBIT_FIX.md](RESPONSIVE_ORBIT_FIX.md)
- **Deploy Script**: [scripts/deploy.pl](scripts/deploy.pl)
- **CSS Architecture**: [themes/bryan-chasko-theme/assets/css/extended/nebula.css](themes/bryan-chasko-theme/assets/css/extended/nebula.css)
