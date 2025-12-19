/**
 * RippleScene: Interactive ripple shader for article card hover effects
 * Creates wave animations responding to mouse movement
 */

class RippleScene extends BaseScene {
  constructor(container, options = {}) {
    options.useIntersectionObserver = true;
    super(container, options);

    this.mouse = { x: 0, y: 0 };
    this.ripples = [];
    this.maxRipples = 3;

    this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.container.addEventListener('mouseleave', () => this.handleMouseLeave());

    this.setupBuffers();
    this.startAnimating();
  }

  setupBuffers() {
    const positionAttr = this.gl.getAttribLocation(this.program, 'position');
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

    // Full-screen quad for shader
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(positionAttr, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttr);

    // Uniform locations
    this.uResolution = this.gl.getUniformLocation(this.program, 'resolution');
    this.uTime = this.gl.getUniformLocation(this.program, 'time');
    this.uMouse = this.gl.getUniformLocation(this.program, 'mouse');
    this.uRippleCount = this.gl.getUniformLocation(this.program, 'rippleCount');
    this.uRippleData = this.gl.getUniformLocation(this.program, 'rippleData'); // Array of ripple origins and times
    this.uColor = this.gl.getUniformLocation(this.program, 'color');
  }

  getVertexShader() {
    return `
      precision highp float;
      attribute vec2 position;
      varying vec2 vUv;

      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
  }

  getFragmentShader() {
    return `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;
      uniform int rippleCount;
      uniform vec3 color;

      void main() {
        vec2 pixelCoord = vUv * resolution;
        vec2 mouseCoord = mouse;
        
        float dist = length(pixelCoord - mouseCoord);
        
        // Base ripple effect around mouse
        float wave = sin(dist * 0.01 - time * 3.0) * 0.5 + 0.5;
        float ripple = smoothstep(100.0, 50.0, dist) * wave;
        
        // Gradient shift based on distance
        float hueShift = sin(dist * 0.001 + time) * 0.3;
        
        gl_FragColor = vec4(color + hueShift, ripple * 0.6);
      }
    `;
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    // Create new ripple on mouse movement (throttled)
    if (!this.lastRippleTime || Date.now() - this.lastRippleTime > 100) {
      this.addRipple(this.mouse.x, this.mouse.y);
      this.lastRippleTime = Date.now();
    }
  }

  handleMouseLeave() {
    // Fade out ripples when mouse leaves
    this.ripples = this.ripples.filter((r) => Date.now() - r.time < 1000);
  }

  addRipple(x, y) {
    if (this.ripples.length < this.maxRipples) {
      this.ripples.push({ x, y, time: Date.now() });
    } else {
      // Replace oldest ripple
      this.ripples[0] = { x, y, time: Date.now() };
    }
  }

  update(deltaTime, elapsed) {
    // Remove old ripples
    this.ripples = this.ripples.filter((r) => Date.now() - r.time < 1000);
  }

  render(deltaTime, elapsed) {
    if (!this.gl) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    const time = (Date.now() - this.startTime) / 1000;

    // Set uniforms
    this.gl.uniform2f(this.uResolution, this.options.width, this.options.height);
    this.gl.uniform2f(this.uMouse, this.mouse.x, this.mouse.y);
    this.gl.uniform1f(this.uTime, time);

    const color = this.getThemeColor('--nebula-purple');
    this.gl.uniform3f(this.uColor, color[0], color[1], color[2]);

    this.gl.uniform1i(this.uRippleCount, this.ripples.length);

    // Draw full-screen quad with ripple shader
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  setupFallback() {
    // CSS gradient fallback
    const fallback = document.createElement('div');
    fallback.className = 'webgl-fallback webgl-fallback--ripple';
    fallback.style.position = 'absolute';
    fallback.style.top = '0';
    fallback.style.left = '0';
    fallback.style.width = '100%';
    fallback.style.height = '100%';
    fallback.style.background = 'radial-gradient(circle at center, rgba(94, 65, 162, 0.15) 0%, transparent 70%)';
    fallback.style.transition = 'background 200ms ease-out';
    this.container.appendChild(fallback);
    this.fallbackElement = fallback;

    // Update fallback on hover
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.fallbackElement.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(94, 65, 162, 0.2) 0%, rgba(94, 65, 162, 0.1) 25%, transparent 70%)`;
    });
  }
}

// Export for global use
window.RippleScene = RippleScene;
