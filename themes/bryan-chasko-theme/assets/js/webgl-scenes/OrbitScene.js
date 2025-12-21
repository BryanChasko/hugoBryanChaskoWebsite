/**
 * OrbitScene: Orbital animation with glowing nodes
 * Used for home page hero section around Amazon Leo article highlight
 */

class OrbitScene extends BaseScene {
  constructor(container, options = {}) {
    // CRITICAL: Disable IntersectionObserver AND auto-start
    // We need to control initialization order: set orbits BEFORE animation starts
    options.useIntersectionObserver = false;
    options.debug = options.debug !== false; // Enable debug by default
    super(container, options);

    // Validate container dimensions for particle positioning
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[OrbitScene] Container has zero dimensions; particles may not render');
    }
    if (this.options.debug) {
      console.log('[OrbitScene] Container dimensions:', {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        bounding: { width: rect.width, height: rect.height },
        optionsWidth: this.options.width,
        optionsHeight: this.options.height,
      });
    }

    // Initialize orbits BEFORE starting animation
    // Reduced total particle count by 150 (if possible)
    // Original: 15+22+30=67, so set all to 1 to minimize
    this.orbits = options.orbits || [
      { radius: 180, speed: 0.5, particleCount: 1, opacity: 0.7 },
      { radius: 280, speed: 0.3, particleCount: 1, opacity: 0.5 },
      { radius: 380, speed: 0.15, particleCount: 1, opacity: 0.35 },
    ];

    this.centerNode = {
      radius: 10,
      glow: 20,
      opacity: 0.9,
      color: this.getThemeColor('--cosmic-energy'), // Medium spring green
    };

    // Use custom center offset if provided, otherwise use canvas center
    this.centerOffsetX = options.centerOffsetX;
    this.centerOffsetY = options.centerOffsetY;
    this.centerX = this.centerOffsetX || (this.options.width / 2);
    this.centerY = this.centerOffsetY || (this.options.height / 2);

    this.setupBuffers();
    
    // Override canvas z-index to position on top of button (builder-card-link z-index is 2)
    // while maintaining pointer-events: none for click-through
    if (this.canvas) {
      this.canvas.style.zIndex = '3';
      this.canvas.style.pointerEvents = 'none';
    }
    
    // CRITICAL: Expose scene instance on container for testing/debugging
    this.container.__orbitScene = this;
    
    // OrbitScene now runs on all screen sizes for mobile overlay effect
    
    // CRITICAL: Start animation AFTER all instance variables are initialized
    // BaseScene's auto-start (in init()) already called this if useIntersectionObserver=false
    // but we have another startAnimating() call to ensure it's started
    this.startAnimating();
  }

  setupBuffers() {
    // Create vertex buffer for orbit particles
    this.positionAttrLocation = this.gl.getAttribLocation(this.program, 'position');
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    
    // Set attribute pointer and enable
    this.gl.vertexAttribPointer(this.positionAttrLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.positionAttrLocation);

    // NOTE: Uniform locations are queried on first render (not here)
    // because this.program may not be fully compiled at constructor time
  }

  /**
   * Initialize uniform locations on first render
   * Called lazily to ensure shader program is ready
   */
  initializeUniforms() {
    if (this.uniformsInitialized) return; // Only init once
    
    // Get uniform locations from compiled shader program
    this.uResolution = this.gl.getUniformLocation(this.program, 'resolution');
    this.uTime = this.gl.getUniformLocation(this.program, 'time');
    this.uCenter = this.gl.getUniformLocation(this.program, 'center');
    this.uColor = this.gl.getUniformLocation(this.program, 'color');
    this.uOpacity = this.gl.getUniformLocation(this.program, 'opacity');
    this.uPointSize = this.gl.getUniformLocation(this.program, 'pointSize');
    
    this.uniformsInitialized = true;
    
    if (this.options.debug) {
      console.log('[OrbitScene] Uniforms initialized:', {
        uResolution: !!this.uResolution,
        uCenter: !!this.uCenter,
        uColor: !!this.uColor,
        uOpacity: !!this.uOpacity,
        uPointSize: !!this.uPointSize,
      });
    }
  }

  getVertexShader() {
    return `
      precision highp float;
      attribute vec2 position;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 center;
      uniform float pointSize;

      void main() {
        gl_PointSize = pointSize;
        // Transform from pixel space to NDC: (pixel - center) * 2 / resolution
        vec2 ndc = (position - center) * 2.0 / resolution;
        gl_Position = vec4(ndc, 0.0, 1.0);
      }
    `;
  }

  getFragmentShader() {
    return `
      precision highp float;
      uniform vec3 color;
      uniform float opacity;

      void main() {
        vec2 coord = gl_PointCoord - 0.5;
        float dist = length(coord);
        
        // Soft circle with glow
        float alpha = smoothstep(0.5, 0.0, dist) * opacity;
        alpha += smoothstep(0.6, 0.2, dist) * opacity * 0.5;
        
        // Clamp to ensure we don't render transparent pixels
        if (alpha < 0.01) discard;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  /**
   * Mobile OrbitScene positioning - runs on all screen sizes
   * Canvas positioned over CTA button with pointer-events: none for click-through
   */

  /**
   * Handle canvas resize - recalculate orbit centers
   * Called by BaseScene.handleResize() when window resizes
   */
  onResize() {
    // If using dynamic centering (not fixed offset), recalculate center position
    if (!this.centerOffsetX) {
      this.centerX = this.options.width / 2;
    } else {
      this.centerX = this.centerOffsetX;
    }
    
    if (!this.centerOffsetY) {
      this.centerY = this.options.height / 2;
    } else {
      this.centerY = this.centerOffsetY;
    }
    
    if (this.options.debug) {
      console.log('[OrbitScene.onResize] Recalculated center position:', {
        centerX: this.centerX,
        centerY: this.centerY,
        canvasWidth: this.options.width,
        canvasHeight: this.options.height,
      });
    }
  }

  /**
   * Override destroy to cleanup container reference
   */
  destroy() {
    
    // Cleanup scene instance reference
    if (this.container) {
      this.container.__orbitScene = null;
    }
    
    // Call parent destroy
    super.destroy();
  }

  update(deltaTime, elapsed) {
    // Orbits rotate at different speeds, particles follow parametric paths
  }

  render(deltaTime, elapsed) {
    // Unconditional debug: log every 120 frames to see if render is called
    if (!window.orbitRenderCount) window.orbitRenderCount = 0;
    window.orbitRenderCount++;
    if (window.orbitRenderCount % 120 === 1) {
      console.log('[OrbitScene.render] Called, frame:', window.orbitRenderCount, 'GL context:', !!this.gl);
    }

    // Early return if no GL context (safety check)
    if (!this.gl) return;

    // Initialize uniforms on first render (shader program must be compiled first)
    this.initializeUniforms();

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    // Debug logging on first frame
    if (this.options.debug && !this.debugLogged) {
      this.debugLogged = true;
      // Defensive check: orbits might be undefined if constructor failed
      const orbitsCount = Array.isArray(this.orbits) ? this.orbits.length : 0;
      console.log('[OrbitScene] First render frame diagnostics:', {
        hasGL: !!this.gl,
        hasProgram: !!this.program,
        program: this.program,
        programActive: this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program,
        viewport: this.gl.getParameter(this.gl.VIEWPORT),
        blendEnabled: this.gl.isEnabled(this.gl.BLEND),
        centerX: this.centerX,
        centerY: this.centerY,
        orbitsCount: orbitsCount,
        hasOrbitsData: !!this.orbits,
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
        positionBuffer: this.positionBuffer,
        uResolution: this.uResolution,
        uCenter: this.uCenter,
        uColor: this.uColor,
        uniformsInitialized: this.uniformsInitialized,
      });
    }

    const time = (Date.now() - this.startTime) / 1000;
    
    // TEST: Log that render is being called
    if (!this.renderCallLogged) {
      this.renderCallLogged = true;
      console.log('[OrbitScene] render() called for first time, drawing particles...');
    }

    // Check uniforms are ready (should always be true after initializeUniforms)
    if (!this.uResolution || !this.uCenter) {
      console.warn('[OrbitScene] Uniform locations failed to initialize');
      return;
    }

    // Defensive: ensure we have orbit definitions before drawing
    const orbits = Array.isArray(this.orbits) ? this.orbits : [];
    if (orbits.length === 0) {
      console.warn('[OrbitScene] No orbit definitions available; skipping render');
      return;
    }

    // Use canvas dimensions if options width/height are missing
    const w = this.options.width || this.canvas.width || this.gl.drawingBufferWidth;
    const h = this.options.height || this.canvas.height || this.gl.drawingBufferHeight;

    // Debug viewport on first render
    if (!this.viewportDebugLogged) {
      this.viewportDebugLogged = true;
      console.log(`[OrbitScene] Viewport: canvas=${this.canvas.width}x${this.canvas.height}, drawingBuffer=${this.gl.drawingBufferWidth}x${this.gl.drawingBufferHeight}, using=${w}x${h}`);
    }

    this.gl.uniform2f(this.uResolution, w, h);
    this.gl.uniform2f(this.uCenter, this.centerX, this.centerY);
    this.gl.uniform1f(this.uTime, time);

    // Draw orbits
    for (let orbitIdx = 0; orbitIdx < orbits.length; orbitIdx++) {
      const orbit = orbits[orbitIdx];

      // Generate orbit particle positions
      const positions = [];
      for (let i = 0; i < orbit.particleCount; i++) {
        const angle = (i / orbit.particleCount) * Math.PI * 2 + time * orbit.speed;
        const x = this.centerX + Math.cos(angle) * orbit.radius;
        const y = this.centerY + Math.sin(angle) * orbit.radius;
        positions.push(x, y);
      }

      // Debug first position calculation
      if (this.options.debug && orbitIdx === 0 && !this.firstPositionLogged) {
        this.firstPositionLogged = true;
        const firstPos_x = positions[0];
        const firstPos_y = positions[1];
        // Correct NDC transformation: (pixel - center) * 2.0 / resolution
        const ndc_x = (firstPos_x - this.centerX) * 2.0 / w;
        const ndc_y = (firstPos_y - this.centerY) * 2.0 / h;
        console.log(`[OrbitScene] First particle: pos=(${firstPos_x.toFixed(1)}, ${firstPos_y.toFixed(1)}), center=(${this.centerX.toFixed(1)}, ${this.centerY.toFixed(1)}), dims=${w}x${h}, NDC=(${ndc_x.toFixed(2)}, ${ndc_y.toFixed(2)})`);
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
      
      // DEBUG: Log position data being uploaded
      if (orbitIdx === 0 && !this.positionDataLogged) {
        this.positionDataLogged = true;
        console.log(`[OrbitScene] Position buffer data (first 4 positions): [${positions.slice(0, 8).map(p => p.toFixed(0)).join(', ')}...]`);
      }
      
      // CRITICAL: Reset vertex attribute pointer after binding new buffer
      this.gl.vertexAttribPointer(this.positionAttrLocation, 2, this.gl.FLOAT, false, 0, 0);

      // Set orbit-specific uniforms
      const color = this.getThemeColor('--cosmic-teal'); // Dark turquoise
      
      if (orbitIdx === 0 && !this.colorDebugLogged) {
        this.colorDebugLogged = true;
        console.log(`[OrbitScene] Teal color from CSS: [${color[0].toFixed(2)}, ${color[1].toFixed(2)}, ${color[2].toFixed(2)}]`);
      }
      
      this.gl.uniform3f(this.uColor, color[0], color[1], color[2]);
      this.gl.uniform1f(this.uOpacity, orbit.opacity * 0.8); // Add transparency
      this.gl.uniform1f(this.uPointSize, 8.0 - orbitIdx * 0.8); // Larger particles

      // Debug on first orbit
      if (this.options.debug && orbitIdx === 0 && !this.firstOrbitLogged) {
        this.firstOrbitLogged = true;
        console.log('[OrbitScene] First orbit draw:', {
          orbits: orbit,
          positionCount: positions.length,
          color: color,
          hasColor: !!color,
        });
      }

      // Draw particles
      if (this.options.debug && orbitIdx === 0 && window.orbitDrawCount === undefined) {
        window.orbitDrawCount = 0;
        const attrEnabled = this.gl.getVertexAttrib(this.positionAttrLocation, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        console.log(`[OrbitScene] About to draw: attrEnabled=${attrEnabled}, positionAttrLoc=${this.positionAttrLocation}`);
      }
      this.gl.drawArrays(this.gl.POINTS, 0, orbit.particleCount);
      if (this.options.debug && orbitIdx === 0 && window.orbitDrawCount === 0) {
        window.orbitDrawCount++;
        const glError = this.gl.getError();
        // Also check if anything was actually drawn - query pixel at center
        const testPixel = new Uint8Array(4);
        this.gl.readPixels(this.centerX | 0, this.centerY | 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, testPixel);
        console.log('[OrbitScene] Drew orbit 0, particle count:', orbit.particleCount, 'glError:', glError, 'pixel at center:', Array.from(testPixel));
      }
    }

    // Draw center glowing node
    const centerColor = this.centerNode.color;
    this.gl.uniform3f(this.uColor, centerColor[0], centerColor[1], centerColor[2]);
    this.gl.uniform1f(this.uOpacity, this.centerNode.opacity);
    this.gl.uniform1f(this.uPointSize, this.centerNode.radius + Math.sin(time * 2) * 3);

    const centerPositions = new Float32Array([this.centerX, this.centerY]);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, centerPositions, this.gl.DYNAMIC_DRAW);
    this.gl.drawArrays(this.gl.POINTS, 0, 1);

    // Draw orbit connections (lines)
    this.renderOrbitRings(time);
  }

  /**
   * Draw subtle rings for each orbit
   */
  renderOrbitRings(time) {
    const color = this.getThemeColor('--cosmic-teal');

    for (let orbitIdx = 0; orbitIdx < this.orbits.length; orbitIdx++) {
      const orbit = this.orbits[orbitIdx];
      const positions = [];

      // Create circle path
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = this.centerX + Math.cos(angle) * orbit.radius;
        const y = this.centerY + Math.sin(angle) * orbit.radius;
        positions.push(x, y);
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);

      this.gl.uniform3f(this.uColor, color[0], color[1], color[2]);
      this.gl.uniform1f(this.uOpacity, orbit.opacity * 0.2); // Very faint transparent rings
      this.gl.uniform1f(this.uPointSize, 1.5);

      this.gl.drawArrays(this.gl.LINE_STRIP, 0, positions.length / 2);
    }
  }

  onResize() {
    this.centerX = this.options.width / 2;
    this.centerY = this.options.height / 2;
  }

  /**
   * Update orbit configuration (for responsive adjustments)
   */
  updateOrbits(orbits) {
    this.orbits = orbits;
  }
}

// Export for global use
window.OrbitScene = OrbitScene;
