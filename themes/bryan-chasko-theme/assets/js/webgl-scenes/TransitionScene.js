/**
 * TransitionScene: Full-screen navigation transition overlay
 * Uses noise-based pixelated fade shader for smooth page transitions
 */

class TransitionScene extends BaseScene {
  constructor(options = {}) {
    // Create full-screen container if not provided
    if (!options.container) {
      let container = document.getElementById('webgl-transition-overlay');
      if (!container) {
        container = document.createElement('div');
        container.id = 'webgl-transition-overlay';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '9999';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
      }
      options.container = container;
    }

    options.useIntersectionObserver = false; // Transitions don't respect visibility
    options.width = window.innerWidth;
    options.height = window.innerHeight;

    super(options.container, options);

    this.noise = this.generateNoiseTexture();
  }

  /**
   * Generate 2D noise texture for pixelated fade effect
   */
  generateNoiseTexture(width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;     // R
      data[i + 1] = noise; // G
      data[i + 2] = noise; // B
      data[i + 3] = 255;   // A
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

    return texture;
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
      uniform sampler2D noiseTexture;
      uniform float transitionProgress; // 0.0 to 1.0
      uniform vec3 color;

      void main() {
        // Sample noise at pixelated resolution
        vec2 pixelSize = vec2(8.0) * (1.0 + transitionProgress * 2.0);
        vec2 pixelatedUv = floor(vUv * pixelSize) / pixelSize;
        float noise = texture2D(noiseTexture, pixelatedUv).r;

        // Use noise threshold to create pixelated fade effect
        float threshold = noise - (1.0 - transitionProgress);
        float alpha = smoothstep(-0.1, 0.1, threshold);

        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  createShaders() {
    super.createShaders();

    // Get uniform locations
    this.uNoiseTexture = this.gl.getUniformLocation(this.program, 'noiseTexture');
    this.uTransitionProgress = this.gl.getUniformLocation(this.program, 'transitionProgress');
    this.uColor = this.gl.getUniformLocation(this.program, 'color');

    // Setup position buffer (full-screen quad)
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionAttr = this.gl.getAttribLocation(this.program, 'position');
    this.gl.vertexAttribPointer(positionAttr, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttr);
  }

  update(deltaTime, elapsed) {
    // Progress is managed by transitionActive flag
    if (this.transitionActive) {
      const progress = Math.min((Date.now() - this.transitionStartTime) / this.transitionDuration, 1.0);
      this.transitionProgress = progress;
    } else {
      this.transitionProgress = 0;
    }
  }

  render(deltaTime, elapsed) {
    if (!this.gl) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    // Set uniforms
    this.gl.uniform1f(this.uTransitionProgress, this.transitionProgress);
    this.gl.uniform1i(this.uNoiseTexture, 0);

    // Get theme color
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = isDark ? [0.1, 0.07, 0.15] : [1.0, 1.0, 1.0];
    this.gl.uniform3f(this.uColor, color[0], color[1], color[2]);

    // Draw quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  onResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    if (this.canvas) {
      this.canvas.width = newWidth * this.options.dpr;
      this.canvas.height = newHeight * this.options.dpr;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  setupFallback() {
    // Fallback: simple fade overlay
    const fallback = document.createElement('div');
    fallback.id = 'transition-fallback';
    fallback.style.position = 'fixed';
    fallback.style.top = '0';
    fallback.style.left = '0';
    fallback.style.width = '100%';
    fallback.style.height = '100%';
    fallback.style.background = 'black';
    fallback.style.opacity = '0';
    fallback.style.pointerEvents = 'none';
    fallback.style.zIndex = '9999';
    document.body.appendChild(fallback);
    this.fallbackElement = fallback;
  }

  /**
   * Trigger transition with fallback support
   */
  triggerTransition(duration = 300) {
    if (this.supportsWebGL) {
      return super.triggerTransition(duration);
    } else if (this.fallbackElement) {
      // Fallback: CSS fade
      return new Promise((resolve) => {
        this.fallbackElement.style.transition = `opacity ${duration}ms ease-in-out`;
        this.fallbackElement.style.opacity = '0.5';
        setTimeout(() => {
          this.fallbackElement.style.opacity = '0';
          resolve();
        }, duration / 2);
      });
    } else {
      return Promise.resolve();
    }
  }
}

// Export for global use
window.TransitionScene = TransitionScene;
