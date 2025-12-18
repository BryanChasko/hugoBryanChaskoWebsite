/**
 * WebGL Resource Monitor & Manager
 * 
 * Provides GPU capability detection, resource monitoring,
 * and auto-disposal for WebGL contexts to prevent memory leaks.
 * 
 * Usage:
 *   const monitor = new WebGLResourceMonitor(renderer);
 *   monitor.start();
 *   
 *   // When done:
 *   monitor.dispose();
 */

class WebGLResourceMonitor {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.options = {
      idleTimeout: options.idleTimeout || 180000, // 3 minutes default
      checkInterval: options.checkInterval || 30000, // 30 seconds
      memoryThreshold: options.memoryThreshold || 0.8, // 80% memory usage
      fpsThreshold: options.fpsThreshold || 30,
      ...options
    };
    
    this.lastActivity = Date.now();
    this.idleTimer = null;
    this.checkTimer = null;
    this.isDisposed = false;
    this.callbacks = {
      onIdle: [],
      onDispose: [],
      onLowPerformance: []
    };
  }

  /**
   * Start monitoring resources
   */
  start() {
    this.bindActivityListeners();
    this.startIdleTimer();
    this.startPerformanceCheck();
    return this;
  }

  /**
   * Stop monitoring and clean up
   */
  stop() {
    this.clearTimers();
    this.unbindActivityListeners();
  }

  /**
   * Dispose renderer and clean up all resources
   */
  dispose() {
    if (this.isDisposed) return;
    
    this.stop();
    
    if (this.renderer && typeof this.renderer.dispose === 'function') {
      this.renderer.dispose();
    }
    
    this.callbacks.onDispose.forEach(cb => cb());
    this.isDisposed = true;
  }

  /**
   * Register callback for events
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
    return this;
  }

  /**
   * Reset idle timer on user activity
   */
  resetIdleTimer() {
    this.lastActivity = Date.now();
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.startIdleTimer();
  }

  /**
   * Start idle timeout timer
   */
  startIdleTimer() {
    this.idleTimer = setTimeout(() => {
      this.callbacks.onIdle.forEach(cb => cb());
      this.dispose();
    }, this.options.idleTimeout);
  }

  /**
   * Start periodic performance checks
   */
  startPerformanceCheck() {
    this.checkTimer = setInterval(() => {
      this.checkPerformance();
    }, this.options.checkInterval);
  }

  /**
   * Check GPU performance and memory
   */
  checkPerformance() {
    // Check WebGL context status
    if (this.renderer && this.renderer.getContext) {
      const gl = this.renderer.getContext();
      if (gl && gl.isContextLost && gl.isContextLost()) {
        console.warn('[WebGL Monitor] Context lost, disposing...');
        this.dispose();
        return;
      }
    }

    // Check memory if available (Chrome)
    if (performance.memory) {
      const memoryRatio = performance.memory.usedJSHeapSize / 
                          performance.memory.jsHeapSizeLimit;
      if (memoryRatio > this.options.memoryThreshold) {
        console.warn('[WebGL Monitor] High memory usage, triggering cleanup...');
        this.callbacks.onLowPerformance.forEach(cb => cb('memory', memoryRatio));
      }
    }
  }

  /**
   * Bind activity listeners
   */
  bindActivityListeners() {
    this.activityHandler = () => this.resetIdleTimer();
    
    document.addEventListener('mousemove', this.activityHandler, { passive: true });
    document.addEventListener('keydown', this.activityHandler, { passive: true });
    document.addEventListener('touchstart', this.activityHandler, { passive: true });
    document.addEventListener('scroll', this.activityHandler, { passive: true });
  }

  /**
   * Unbind activity listeners
   */
  unbindActivityListeners() {
    if (this.activityHandler) {
      document.removeEventListener('mousemove', this.activityHandler);
      document.removeEventListener('keydown', this.activityHandler);
      document.removeEventListener('touchstart', this.activityHandler);
      document.removeEventListener('scroll', this.activityHandler);
    }
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }
}

/**
 * GPU Capability Detection
 * 
 * Detects WebGL support level and GPU capabilities
 * to enable/disable effects based on device performance.
 */
class GPUCapabilityDetector {
  constructor() {
    this.capabilities = null;
  }

  /**
   * Detect GPU capabilities
   * @returns {Object} GPU capability information
   */
  detect() {
    if (this.capabilities) return this.capabilities;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      this.capabilities = {
        supported: false,
        tier: 0,
        webgl2: false,
        maxTextureSize: 0,
        maxVertexAttribs: 0,
        renderer: 'none',
        vendor: 'none'
      };
      return this.capabilities;
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    this.capabilities = {
      supported: true,
      webgl2: !!canvas.getContext('webgl2'),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
      extensions: gl.getSupportedExtensions() || [],
      tier: 0 // Will be calculated below
    };

    // Calculate performance tier (0-3)
    this.capabilities.tier = this.calculateTier();
    
    // Clean up
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    
    return this.capabilities;
  }

  /**
   * Calculate GPU tier based on capabilities
   * @returns {number} 0 = low, 1 = medium, 2 = high, 3 = ultra
   */
  calculateTier() {
    const caps = this.capabilities;
    if (!caps || !caps.supported) return 0;

    let score = 0;

    // WebGL2 support
    if (caps.webgl2) score += 1;

    // Texture size (4096 = +1, 8192 = +2, 16384 = +3)
    if (caps.maxTextureSize >= 16384) score += 3;
    else if (caps.maxTextureSize >= 8192) score += 2;
    else if (caps.maxTextureSize >= 4096) score += 1;

    // Check for high-end GPU keywords
    const renderer = caps.renderer.toLowerCase();
    const highEndKeywords = ['nvidia', 'geforce', 'rtx', 'gtx', 'radeon rx', 'apple m'];
    const lowEndKeywords = ['intel', 'integrated', 'mali', 'adreno 3', 'adreno 4'];
    
    if (highEndKeywords.some(k => renderer.includes(k))) score += 2;
    if (lowEndKeywords.some(k => renderer.includes(k))) score -= 1;

    // Normalize to 0-3 range
    return Math.max(0, Math.min(3, Math.floor(score / 2)));
  }

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if device is likely mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Get recommended effect level based on device
   * @returns {string} 'none' | 'low' | 'medium' | 'high' | 'ultra'
   */
  getRecommendedLevel() {
    if (this.prefersReducedMotion()) return 'none';
    
    const caps = this.detect();
    if (!caps.supported) return 'none';
    
    const levels = ['low', 'medium', 'high', 'ultra'];
    let tierAdjustment = 0;
    
    // Reduce tier for mobile devices
    if (this.isMobile()) tierAdjustment = -1;
    
    const adjustedTier = Math.max(0, caps.tier + tierAdjustment);
    return levels[adjustedTier] || 'low';
  }
}

/**
 * Theme-aware shader uniform helper
 * Reads CSS variables and provides them to shaders
 */
class ThemeShaderHelper {
  constructor() {
    this.uniforms = {};
    this.observer = null;
  }

  /**
   * Get CSS variable value as color array
   */
  getCSSColor(varName) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName).trim();
    
    // Parse hex color
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255
      ];
    }
    
    // Parse rgb/rgba
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [
        parseInt(match[1]) / 255,
        parseInt(match[2]) / 255,
        parseInt(match[3]) / 255
      ];
    }
    
    return [1, 1, 1]; // Default white
  }

  /**
   * Get current theme colors as shader uniforms
   */
  getThemeUniforms() {
    return {
      uPrimaryColor: this.getCSSColor('--nebula-purple'),
      uSecondaryColor: this.getCSSColor('--nebula-lavender'),
      uAccentColor: this.getCSSColor('--nebula-orange'),
      uBackgroundColor: this.getCSSColor('--color-background'),
      uIsDarkMode: document.documentElement.dataset.theme === 'dark' ? 1.0 : 0.0
    };
  }

  /**
   * Watch for theme changes and update uniforms
   */
  watchTheme(callback) {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          callback(this.getThemeUniforms());
        }
      });
    });
    
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return this;
  }

  /**
   * Stop watching theme changes
   */
  stopWatching() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WebGLResourceMonitor,
    GPUCapabilityDetector,
    ThemeShaderHelper
  };
}

// Also expose globally for non-module usage
window.WebGLResourceMonitor = WebGLResourceMonitor;
window.GPUCapabilityDetector = GPUCapabilityDetector;
window.ThemeShaderHelper = ThemeShaderHelper;
