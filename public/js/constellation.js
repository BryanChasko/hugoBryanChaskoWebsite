/**
 * Constellation WebGL Effect
 * A particle system with connecting lines that responds to theme changes
 * Uses the WebGLResourceMonitor for lifecycle management
 */

class ConstellationScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      particleCount: options.particleCount || 80,
      connectionDistance: options.connectionDistance || 120,
      particleSpeed: options.particleSpeed || 0.3,
      mouseInfluence: options.mouseInfluence || 100,
      ...options
    };
    
    this.canvas = null;
    this.gl = null;
    this.particles = [];
    this.mousePos = { x: -1000, y: -1000 };
    this.animationId = null;
    this.isRunning = false;
    this.lastTime = 0;
    
    // Theme colors (will be updated by ThemeShaderHelper)
    this.colors = {
      particle: [0.369, 0.255, 0.635, 1.0],      // nebula-purple
      connection: [0.506, 0.412, 0.772, 0.3],    // nebula-lavender
      highlight: [1.0, 0.6, 0.0, 1.0]            // nebula-orange
    };
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'webgl-canvas constellation-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.canvas);
    
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });
    
    if (!this.gl) {
      console.warn('WebGL not supported, falling back to static display');
      this.showFallback();
      return;
    }
    
    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    
    // Initial resize
    this.resize();
    
    // Create particles
    this.createParticles();
    
    // Set up shaders
    this.setupShaders();
    
    // Mouse tracking
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());
    
    // Touch support
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
    this.canvas.addEventListener('touchend', () => this.onMouseLeave());
    
    // Theme change listener
    this.setupThemeListener();
    
    // Reduced motion listener
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      if (this.prefersReducedMotion) {
        this.pause();
      } else {
        this.start();
      }
    });
    
    // Start animation (unless reduced motion)
    if (!this.prefersReducedMotion) {
      this.start();
    } else {
      // Draw one static frame
      this.drawStaticFrame();
    }
  }
  
  setupShaders() {
    const gl = this.gl;
    
    // Vertex shader for particles and lines
    const vsSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      
      void main() {
        vec2 clipSpace = ((a_position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        gl_Position = vec4(clipSpace, 0, 1);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;
    
    // Fragment shader
    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        // Soft circle for particles
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;
    
    // Compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    // Create program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Shader program failed:', gl.getProgramInfoLog(this.program));
      return;
    }
    
    // Get locations
    this.locations = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      color: gl.getAttribLocation(this.program, 'a_color'),
      size: gl.getAttribLocation(this.program, 'a_size'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution')
    };
    
    // Create buffers
    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.sizeBuffer = gl.createBuffer();
    this.lineBuffer = gl.createBuffer();
    this.lineColorBuffer = gl.createBuffer();
  }
  
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  createParticles() {
    this.particles = [];
    const { width, height } = this.canvas;
    
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * this.options.particleSpeed,
        vy: (Math.random() - 0.5) * this.options.particleSpeed,
        size: Math.random() * 3 + 2,
        brightness: Math.random() * 0.5 + 0.5
      });
    }
  }
  
  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Redistribute particles on significant resize
    if (this.particles.length > 0) {
      const scaleX = this.canvas.width / (this.lastWidth || this.canvas.width);
      const scaleY = this.canvas.height / (this.lastHeight || this.canvas.height);
      
      this.particles.forEach(p => {
        p.x *= scaleX;
        p.y *= scaleY;
      });
    }
    
    this.lastWidth = this.canvas.width;
    this.lastHeight = this.canvas.height;
  }
  
  setupThemeListener() {
    // Use MutationObserver to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          this.updateThemeColors();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    // Initial color setup
    this.updateThemeColors();
  }
  
  updateThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
      // Dark mode: lavender/purple tones
      this.colors = {
        particle: [0.506, 0.412, 0.772, 0.9],      // nebula-lavender
        connection: [0.506, 0.412, 0.772, 0.15],   // subtle connections
        highlight: [0.655, 0.545, 0.98, 1.0]       // brighter lavender
      };
    } else {
      // Light mode: purple/orange gradient
      this.colors = {
        particle: [0.369, 0.255, 0.635, 0.7],      // nebula-purple
        connection: [0.369, 0.255, 0.635, 0.1],    // subtle connections
        highlight: [1.0, 0.6, 0.0, 0.9]            // nebula-orange
      };
    }
  }
  
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.mousePos.x = (e.clientX - rect.left) * dpr;
    this.mousePos.y = (e.clientY - rect.top) * dpr;
  }
  
  onTouchMove(e) {
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.mousePos.x = (e.touches[0].clientX - rect.left) * dpr;
      this.mousePos.y = (e.touches[0].clientY - rect.top) * dpr;
    }
  }
  
  onMouseLeave() {
    this.mousePos.x = -1000;
    this.mousePos.y = -1000;
  }
  
  update(deltaTime) {
    const { width, height } = this.canvas;
    const { mouseInfluence, particleSpeed } = this.options;
    
    this.particles.forEach(p => {
      // Mouse influence
      const dx = this.mousePos.x - p.x;
      const dy = this.mousePos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < mouseInfluence && dist > 0) {
        const force = (mouseInfluence - dist) / mouseInfluence * 0.02;
        p.vx -= (dx / dist) * force;
        p.vy -= (dy / dist) * force;
      }
      
      // Update position
      p.x += p.vx * deltaTime * 60;
      p.y += p.vy * deltaTime * 60;
      
      // Velocity damping
      p.vx *= 0.99;
      p.vy *= 0.99;
      
      // Add slight random motion
      p.vx += (Math.random() - 0.5) * 0.01;
      p.vy += (Math.random() - 0.5) * 0.01;
      
      // Clamp velocity
      const maxSpeed = particleSpeed * 2;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }
      
      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    });
  }
  
  render() {
    const gl = this.gl;
    if (!gl || !this.program) return;
    
    // Clear
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.useProgram(this.program);
    gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
    
    // Draw connections first (behind particles)
    this.drawConnections();
    
    // Draw particles
    this.drawParticles();
  }
  
  drawParticles() {
    const gl = this.gl;
    const positions = [];
    const colors = [];
    const sizes = [];
    
    this.particles.forEach(p => {
      positions.push(p.x, p.y);
      
      // Check if near mouse for highlight
      const dx = this.mousePos.x - p.x;
      const dy = this.mousePos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.options.mouseInfluence) {
        const t = 1 - (dist / this.options.mouseInfluence);
        colors.push(
          this.colors.particle[0] * (1-t) + this.colors.highlight[0] * t,
          this.colors.particle[1] * (1-t) + this.colors.highlight[1] * t,
          this.colors.particle[2] * (1-t) + this.colors.highlight[2] * t,
          this.colors.particle[3] * p.brightness
        );
        sizes.push(p.size * (1 + t * 0.5));
      } else {
        colors.push(...this.colors.particle.slice(0, 3), this.colors.particle[3] * p.brightness);
        sizes.push(p.size);
      }
    });
    
    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
    
    // Upload color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.color);
    gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);
    
    // Upload size data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.size);
    gl.vertexAttribPointer(this.locations.size, 1, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.POINTS, 0, this.particles.length);
  }
  
  drawConnections() {
    const gl = this.gl;
    const { connectionDistance } = this.options;
    const lines = [];
    const lineColors = [];
    
    // Find connections (O(n²) but acceptable for ~80 particles)
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * this.colors.connection[3];
          
          lines.push(p1.x, p1.y, p2.x, p2.y);
          lineColors.push(
            ...this.colors.connection.slice(0, 3), alpha,
            ...this.colors.connection.slice(0, 3), alpha
          );
        }
      }
    }
    
    if (lines.length === 0) return;
    
    // Upload line data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
    
    // Upload line colors
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.locations.color);
    gl.vertexAttribPointer(this.locations.color, 4, gl.FLOAT, false, 0, 0);
    
    // Disable size attribute for lines (use default)
    gl.disableVertexAttribArray(this.locations.size);
    gl.vertexAttrib1f(this.locations.size, 1.0);
    
    // Draw lines
    gl.drawArrays(gl.LINES, 0, lines.length / 2);
  }
  
  drawStaticFrame() {
    // For reduced motion: draw one frame without animation
    this.render();
  }
  
  animate(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }
  
  start() {
    if (this.isRunning || this.prefersReducedMotion) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((t) => this.animate(t));
    
    // Notify resource monitor
    if (window.WebGLResourceMonitor) {
      window.constellationMonitor?.trackActivity();
    }
  }
  
  pause() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  showFallback() {
    this.container.classList.add('webgl-not-supported');
    // The CSS fallback gradients will show automatically
  }
  
  dispose() {
    this.pause();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.gl) {
      // Clean up WebGL resources
      this.gl.deleteBuffer(this.positionBuffer);
      this.gl.deleteBuffer(this.colorBuffer);
      this.gl.deleteBuffer(this.sizeBuffer);
      this.gl.deleteBuffer(this.lineBuffer);
      this.gl.deleteBuffer(this.lineColorBuffer);
      this.gl.deleteProgram(this.program);
    }
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Auto-initialize on containers with data-constellation attribute
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('[data-constellation]');
  
  containers.forEach(container => {
    // Check GPU capability first
    if (window.GPUCapabilityDetector) {
      const detector = new GPUCapabilityDetector();
      const tier = detector.getTier();
      
      if (tier < 1) {
        // Too low capability, skip WebGL
        container.classList.add('webgl-fallback-active');
        return;
      }
      
      // Adjust particle count based on GPU tier
      const particleCounts = { 1: 40, 2: 60, 3: 80 };
      const particleCount = particleCounts[tier] || 60;
      
      const scene = new ConstellationScene(container, { particleCount });
      
      // Set up resource monitoring
      if (window.WebGLResourceMonitor) {
        window.constellationMonitor = new WebGLResourceMonitor(scene.gl, {
          idleTimeout: 180000, // 3 minutes
          onDispose: () => scene.pause()
        });
      }
    } else {
      // No detector, use defaults
      new ConstellationScene(container);
    }
  });
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConstellationScene;
} else {
  window.ConstellationScene = ConstellationScene;
}
