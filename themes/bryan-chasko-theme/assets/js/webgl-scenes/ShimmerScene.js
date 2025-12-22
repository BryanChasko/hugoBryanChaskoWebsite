/**
 * ShimmerScene: Subtle low-frequency shimmer accent for cards
 * Provides ambient motion without distraction
 */

class ShimmerScene extends BaseScene {
  constructor(container, options = {}) {
    super(container, {
      useIntersectionObserver: true,
      ...options,
    });

    this.particles = [];
    this.particleCount = options.particleCount || 12;
    this.shimmerIntensity = options.shimmerIntensity || 0.3;
    this.shimmerSpeed = options.shimmerSpeed || 0.5;
  }

  /**
   * Create shaders for shimmer effect
   */
  createShaders() {
    const vertexShader = `
      attribute vec2 position;
      attribute float opacity;
      
      uniform float time;
      uniform vec2 resolution;
      
      varying float vOpacity;
      varying vec2 vPos;
      
      void main() {
        vOpacity = opacity;
        vPos = position;
        gl_Position = vec4(position / resolution * 2.0 - 1.0, 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform float time;
      uniform vec3 color;
      
      varying float vOpacity;
      varying vec2 vPos;
      
      void main() {
        float dist = length(gl_PointCoord - 0.5) * 2.0;
        if (dist > 1.0) discard;
        
        float shimmer = sin(time * 0.5 + vPos.x * 0.01) * 0.5 + 0.5;
        float alpha = (1.0 - dist * dist) * vOpacity * shimmer * 0.6;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    this.program = this.createProgram(vertexShader, fragmentShader);
    this.gl.useProgram(this.program);
  }

  /**
   * Create shader program
   */
  createProgram(vertexSrc, fragmentSrc) {
    const vs = this.compileShader(vertexSrc, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(fragmentSrc, this.gl.FRAGMENT_SHADER);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
    }

    return program;
  }

  /**
   * Compile individual shader
   */
  compileShader(src, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  /**
   * Initialize particle positions
   */
  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
  }

  /**
   * Render frame
   */
  render() {
    if (!this.gl || this.isDestroyed) return;

    const time = (Date.now() - this.startTime) * 0.001;

    // Clear canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx * this.shimmerSpeed;
      p.y += p.vy * this.shimmerSpeed;

      // Wrap around edges
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
    });

    // Build vertex data
    const positions = [];
    const opacities = [];

    this.particles.forEach(p => {
      positions.push(p.x, p.y);
      opacities.push(p.opacity);
    });

    // Setup buffers
    const posBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);

    const opacityBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, opacityBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(opacities), this.gl.DYNAMIC_DRAW);

    // Set uniforms
    this.gl.useProgram(this.program);

    const timeUniform = this.gl.getUniformLocation(this.program, 'time');
    this.gl.uniform1f(timeUniform, time);

    const resolutionUniform = this.gl.getUniformLocation(this.program, 'resolution');
    this.gl.uniform2f(resolutionUniform, this.canvas.width, this.canvas.height);

    // Get theme color (teal from Vibrant Cosmic palette)
    const color = this.getThemeColor('--nebula-orange');
    const colorUniform = this.gl.getUniformLocation(this.program, 'color');
    this.gl.uniform3f(colorUniform, color.r, color.g, color.b);

    // Draw particles
    const posAttrib = this.gl.getAttribLocation(this.program, 'position');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.enableVertexAttribArray(posAttrib);
    this.gl.vertexAttribPointer(posAttrib, 2, this.gl.FLOAT, false, 0, 0);

    const opacityAttrib = this.gl.getAttribLocation(this.program, 'opacity');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, opacityBuffer);
    this.gl.enableVertexAttribArray(opacityAttrib);
    this.gl.vertexAttribPointer(opacityAttrib, 1, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);

    // Cleanup
    this.gl.deleteBuffer(posBuffer);
    this.gl.deleteBuffer(opacityBuffer);
  }

  /**
   * Get theme color from CSS variable
   */
  getThemeColor(varName) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const hex = value.startsWith('#') ? value : '#FF9900';
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  }

  /**
   * Handle visibility changes
   */
  onVisibilityChange(isVisible) {
    if (isVisible && !this.isAnimating) {
      this.initParticles();
      this.startAnimating();
    } else if (!isVisible && this.isAnimating) {
      this.stopAnimating();
    }
  }

  /**
   * Setup fallback for WebGL unsupported
   */
  setupFallback() {
    // Add CSS-only shimmer animation
    this.container.style.animation = 'shimmer-fallback 3s ease-in-out infinite';
  }

  /**
   * Cleanup
   */
  destroy() {
    super.destroy();
    this.particles = [];
  }
}

// Export for use
window.ShimmerScene = ShimmerScene;
