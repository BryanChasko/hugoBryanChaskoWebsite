/**
 * BaseScene: Foundation class for all WebGL scenes
 * Handles lifecycle, Intersection Observer, GPU tier awareness, resource management
 */

class BaseScene {
  constructor(container, options = {}) {
    this.container = container;
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.isVisible = false;
    this.isAnimating = false;
    this.isDestroyed = false;
    this.startTime = Date.now();
    this.lastFrameTime = this.startTime;
    this.animationFrameId = null;
    this.observer = null;

    this.options = {
      width: options.width || container.clientWidth,
      height: options.height || container.clientHeight,
      dpr: window.devicePixelRatio || 1,
      useIntersectionObserver: options.useIntersectionObserver !== false,
      onTransitionStart: options.onTransitionStart || null,
      onTransitionEnd: options.onTransitionEnd || null,
      ...options,
    };

    // GPU tier detection (from WebGLResourceMonitor if available)
    this.gpuTier = window.WebGLResourceMonitor?.tierLevel || 1;
    this.supportsWebGL = this._checkWebGLSupport();

    if (!this.supportsWebGL) {
      console.warn(`WebGL not supported for ${this.constructor.name}`);
      this.setupFallback();
      return;
    }

    this.init();
    
    // Start animation after subclass constructor completes
    // Use setTimeout to defer until subclass fully initialized
    if (!this.options.useIntersectionObserver) {
      setTimeout(() => {
        if (!this.isAnimating && !this.isDestroyed) {
          this.startAnimating();
        }
      }, 0);
    }
  }

  /**
   * Check WebGL support and create context
   */
  _checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  }

  /**
   * Initialize canvas, GL context, shaders, and Intersection Observer
   */
  init() {
    try {
      // Create canvas
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'webgl-scene-canvas';
      this.canvas.width = this.options.width * this.options.dpr;
      this.canvas.height = this.options.height * this.options.dpr;
      this.canvas.style.display = 'block';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '1'; // Position between card background (0) and link/content (2)
      this.canvas.setAttribute('aria-hidden', 'true');

      // Validate container has position context for absolute canvas
      const containerStyle = window.getComputedStyle(this.container);
      if (containerStyle.position === 'static') {
        console.warn(`[${this.constructor.name}] Container lacks position context; canvas positioning may fail`);
      }

      this.container.appendChild(this.canvas);
      
      // Confirm canvas is in DOM
      console.log(`[${this.constructor.name}] Canvas appended to DOM:`, {
        canvasInDOM: document.body.contains(this.canvas),
        parent: this.canvas.parentElement?.className,
        elementInParent: this.container.contains(this.canvas),
      });

      // Log canvas initialization for debugging
      if (this.options.debug) {
        console.log(`[${this.constructor.name}] Canvas initialized:`, {
          width: this.canvas.width,
          height: this.canvas.height,
          dpr: this.options.dpr,
          containerPosition: containerStyle.position,
        });
      }

      // Get GL context
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,  // CRITICAL: Keep framebuffer for testing/screenshots
      });

      if (!this.gl) throw new Error('Failed to get WebGL context');

      // Setup WebGL state
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Create shaders and program
      this.createShaders();

      // Setup Intersection Observer for lazy rendering
      // NOTE: Animation start is deferred to constructor (after subclass init)
      if (this.options.useIntersectionObserver) {
        this.setupIntersectionObserver();
      }

      // Handle context loss
      this.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.handleContextLoss();
      });

      this.canvas.addEventListener('webglcontextrestored', () => {
        this.handleContextRestore();
      });

      // Handle window resize
      window.addEventListener('resize', () => this.handleResize());

      // Notify resource monitor
      if (window.WebGLResourceMonitor) {
        window.WebGLResourceMonitor.registerScene(this);
      }
    } catch (error) {
      console.error(`Failed to initialize ${this.constructor.name}:`, error);
      this.setupFallback();
    }
  }

  /**
   * Create WebGL shaders (override in subclasses)
   */
  createShaders() {
    const vertexShader = this.getVertexShader();
    const fragmentShader = this.getFragmentShader();

    const vs = this.compileShader(vertexShader, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(fragmentShader, this.gl.FRAGMENT_SHADER);

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error(`Shader program failed to link: ${this.gl.getProgramInfoLog(this.program)}`);
    }

    this.gl.useProgram(this.program);
  }

  /**
   * Compile individual shader (helper)
   */
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(`Shader compilation failed: ${this.gl.getShaderInfoLog(shader)}`);
    }

    return shader;
  }

  /**
   * Get vertex shader source (override in subclasses)
   */
  getVertexShader() {
    return `
      precision highp float;
      attribute vec2 position;
      uniform vec2 resolution;
      void main() {
        vec2 normalized = position / resolution * 2.0 - 1.0;
        gl_Position = vec4(normalized, 0.0, 1.0);
      }
    `;
  }

  /**
   * Get fragment shader source (override in subclasses)
   */
  getFragmentShader() {
    return `
      precision highp float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;
  }

  /**
   * Setup Intersection Observer for visibility-based rendering
   */
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isAnimating) {
          this.startAnimating();
          this.isVisible = true;
        } else if (!entry.isIntersecting && this.isAnimating) {
          this.stopAnimating();
          this.isVisible = false;
        }
      });
    }, options);

    this.observer.observe(this.container);
  }

  /**
   * Start animation loop (requestAnimationFrame)
   */
  startAnimating() {
    if (this.isAnimating || this.isDestroyed || !this.supportsWebGL) return;
    this.isAnimating = true;
    this.lastFrameTime = Date.now();
    console.log('[BaseScene] startAnimating() called, loop starting, constructor:', this.constructor.name);
    this.animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimating() {
    if (!this.isAnimating) return;
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Animation frame callback
   */
  animate = () => {
    if (!this.isAnimating || this.isDestroyed) return;

    // Log first frame only
    if (!this.animateCalledOnce) {
      this.animateCalledOnce = true;
      console.log('[BaseScene.animate] First frame, constructor:', this.constructor.name);
    }

    const now = Date.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.016); // Cap at 60 FPS
    this.lastFrameTime = now;
    const elapsed = (now - this.startTime) / 1000;

    try {
      this.update(deltaTime, elapsed);
      this.render(deltaTime, elapsed);
    } catch (error) {
      console.error(`Animation error in ${this.constructor.name}:`, error);
      this.stopAnimating();
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Update logic (override in subclasses)
   */
  update(deltaTime, elapsed) {
    // Override in subclass
  }

  /**
   * Render to WebGL (override in subclasses)
   */
  render(deltaTime, elapsed) {
    if (!this.gl) return;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Handle canvas resize
   */
  handleResize() {
    if (!this.canvas || this.isDestroyed) return;

    const newWidth = this.container.clientWidth;
    const newHeight = this.container.clientHeight;

    if (newWidth === this.options.width && newHeight === this.options.height) {
      return; // No size change
    }

    this.options.width = newWidth;
    this.options.height = newHeight;

    this.canvas.width = newWidth * this.options.dpr;
    this.canvas.height = newHeight * this.options.dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.onResize();
  }

  /**
   * Handle WebGL context loss
   */
  handleContextLoss() {
    console.warn(`WebGL context loss in ${this.constructor.name}`);
    this.stopAnimating();
  }

  /**
   * Handle WebGL context restore
   */
  handleContextRestore() {
    console.warn(`WebGL context restored in ${this.constructor.name}`);
    if (this.isVisible) {
      this.startAnimating();
    }
  }

  /**
   * Called when canvas is resized (override in subclasses)
   */
  onResize() {
    // Override in subclass
  }

  /**
   * Setup fallback for non-WebGL browsers (override in subclasses)
   */
  setupFallback() {
    // Create CSS-based fallback
    const fallback = document.createElement('div');
    fallback.className = 'webgl-fallback';
    fallback.style.position = 'absolute';
    fallback.style.top = '0';
    fallback.style.left = '0';
    fallback.style.width = '100%';
    fallback.style.height = '100%';
    fallback.style.background = 'radial-gradient(ellipse at center, rgba(129, 105, 197, 0.1) 0%, transparent 70%)';
    this.container.appendChild(fallback);
  }

  /**
   * Trigger transition effect (used for navigation transitions)
   */
  triggerTransition(duration = 300) {
    if (this.options.onTransitionStart) {
      this.options.onTransitionStart();
    }

    return new Promise((resolve) => {
      this.transitionActive = true;
      this.transitionStartTime = Date.now();
      this.transitionDuration = duration;

      const checkTransition = () => {
        if (Date.now() - this.transitionStartTime >= duration) {
          this.transitionActive = false;
          if (this.options.onTransitionEnd) {
            this.options.onTransitionEnd();
          }
          resolve();
        } else {
          requestAnimationFrame(checkTransition);
        }
      };

      checkTransition();
    });
  }

  /**
   * Destroy scene and cleanup resources
   */
  destroy() {
    if (this.isDestroyed) return;

    this.stopAnimating();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    if (this.gl) {
      // Delete program
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }

      // Delete context
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext();
      }

      this.gl = null;
    }

    if (window.WebGLResourceMonitor) {
      window.WebGLResourceMonitor.unregisterScene(this);
    }

    this.isDestroyed = true;
    this.canvas = null;
  }

  /**
   * Utility: Get theme-aware color from CSS variables
   */
  getThemeColor(variableName) {
    const cssVar = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    
    // Parse rgb/rgba format
    if (cssVar.startsWith('rgb')) {
      const match = cssVar.match(/(\d+)/g);
      return [match[0] / 255, match[1] / 255, match[2] / 255, (match[3] || 255) / 255];
    }
    
    // Parse hex format (#RRGGBB or #RGB)
    if (cssVar.startsWith('#')) {
      let hex = cssVar.substring(1);
      // Expand short form (#RGB -> #RRGGBB)
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return [r, g, b, 1.0];
    }
    
    // Default fallback
    return [0.5, 0.4, 0.8, 1.0];
  }

  /**
   * Utility: Check if reduced motion is preferred
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseScene;
}
window.BaseScene = BaseScene;
