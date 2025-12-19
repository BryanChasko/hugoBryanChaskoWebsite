/**
 * Scene Initializer: Loads and manages WebGL scenes
 * Handles page-specific scene creation and lifecycle
 */

class WebGLSceneInitializer {
  constructor() {
    this.scenes = [];
    this.transitionScene = null;
    this.isInitialized = false;
  }

  /**
   * Initialize all scenes based on page context
   */
  async init() {
    if (this.isInitialized) return;

    // Initialize transition scene globally
    this.initTransitionScene();

    // Page-specific scene initialization
    if (document.body.classList.contains('home') || document.querySelector('[data-constellation]')) {
      this.initHomeScenes();
    }

    if (document.body.classList.contains('single') && document.querySelector('article')) {
      this.initBlogScenes();
    }

    if (document.querySelector('[data-skills-network]')) {
      this.initSkillsScenes();
    }

    // Setup navigation transitions
    this.setupNavigationTransitions();

    this.isInitialized = true;
  }

  /**
   * Initialize transition scene (global, all pages)
   */
  initTransitionScene() {
    if (!this.transitionScene && !this.prefersReducedMotion()) {
      try {
        this.transitionScene = new TransitionScene();
      } catch (error) {
        console.warn('Failed to initialize TransitionScene:', error);
      }
    }
  }

  /**
   * Initialize home page scenes (constellation, orbit, builder card)
   */
  initHomeScenes() {
    // Orbit scene around builder card - look for data-orbit-scene attribute
    const orbitContainer = document.querySelector('[data-orbit-scene]');
    if (orbitContainer && !orbitContainer.querySelector('.webgl-scene-canvas')) {
      
      try {
        // Use responsive canvas sizing - let canvas grow/shrink with container
        // This ensures particles stay centered even when window is resized
        const containerWidth = orbitContainer.clientWidth;
        const containerHeight = orbitContainer.clientHeight;
        
        // Minimum canvas size: 120px, maximum 240px for reasonable performance
        const canvasWidth = Math.min(Math.max(containerWidth, 120), 240);
        const canvasHeight = Math.min(Math.max(containerHeight, 120), 240);
        
        // Center orbits in the canvas (will recalculate on resize via onResize())
        const centerOffsetX = canvasWidth / 2;
        const centerOffsetY = canvasHeight / 2;
        
        // Scale orbit radii proportionally to canvas size (ref: 240px canvas = 100px max radius)
        const maxRadius = (canvasWidth + canvasHeight) / 2 * 0.42; // ~42% of average dimension
        
        const orbits = [
          { radius: maxRadius * 0.4, speed: 0.5, particleCount: 5, opacity: 0.8 },
          { radius: maxRadius * 0.7, speed: 0.3, particleCount: 7, opacity: 0.6 },
          { radius: maxRadius * 1.0, speed: 0.15, particleCount: 9, opacity: 0.4 },
        ];
        
        console.log(`[OrbitScene] Responsive sizing: canvas=(${canvasWidth}x${canvasHeight}px), center=(${centerOffsetX.toFixed(1)}, ${centerOffsetY.toFixed(1)}), maxRadius=${maxRadius.toFixed(1)}px`);
        
        const orbitScene = new OrbitScene(orbitContainer, {
          width: canvasWidth,
          height: canvasHeight,
          debug: true, // Enable debug logging for orbit scene
          centerOffsetX: centerOffsetX,
          centerOffsetY: centerOffsetY,
          orbits: orbits
        });
        this.scenes.push(orbitScene);
        console.log('[WebGL] OrbitScene initialized on home page');
      } catch (error) {
        console.warn('Failed to initialize OrbitScene:', error);
      }
    }
  }

  /**
   * Initialize blog/article scenes (ripple effects on article cards)
   */
  initBlogScenes() {
    const articleCards = document.querySelectorAll('.builder-post-card, .article-card');
    
    articleCards.forEach((card, index) => {
      if (!card.querySelector('.webgl-scene-canvas')) {
        try {
          const rippleScene = new RippleScene(card, {
            width: card.clientWidth,
            height: card.clientHeight
          });
          this.scenes.push(rippleScene);
        } catch (error) {
          console.warn(`Failed to initialize RippleScene on card ${index}:`, error);
        }
      }
    });

    if (this.scenes.filter(s => s instanceof RippleScene).length > 0) {
      console.log('[WebGL] RippleScene(s) initialized on blog page');
    }
  }

  /**
   * Initialize skills section with network visualization
   */
  initSkillsScenes() {
    const skillsContainer = document.querySelector('[data-skills-network]');
    if (!skillsContainer || skillsContainer.querySelector('.webgl-scene-canvas')) {
      return;
    }

    try {
      // Extract skills data from page or use default
      let skillsData = [];
      const skillsList = document.querySelector('[data-skills-list]');
      if (skillsList) {
        skillsData = Array.from(skillsList.querySelectorAll('li')).map(li => li.textContent.trim());
      } else {
        // Fallback: Use data from skills-network.yaml
        skillsData = this.getDefaultSkillsData();
      }

      const networkScene = new SkillsNetworkScene(skillsContainer, skillsData, {
        width: skillsContainer.clientWidth,
        height: skillsContainer.clientHeight
      });
      this.scenes.push(networkScene);
      console.log('[WebGL] SkillsNetworkScene initialized');
    } catch (error) {
      console.warn('Failed to initialize SkillsNetworkScene:', error);
    }
  }

  /**
   * Setup navigation transition handlers
   */
  setupNavigationTransitions() {
    if (!this.transitionScene) return;

    // Intercept menu link clicks
    const navLinks = document.querySelectorAll('nav a[href], #menu a[href]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Only intercept internal links (not anchors or external)
        if (!href.startsWith('#') && !href.includes('://')) {
          e.preventDefault();
          
          this.transitionScene.triggerTransition(300).then(() => {
            window.location.href = href;
          });
        }
      });
    });
  }

  /**
   * Get default skills list
   */
  getDefaultSkillsData() {
    return [
      'AWS Cloud',
      'Artificial Intelligence',
      'Software Architecture',
      'Lambda',
      'RDS',
      'S3',
      'Bedrock',
      'Solutions Architecture',
      'Cloud Strategy',
      'Fractional CTO'
    ];
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Cleanup all scenes
   */
  dispose() {
    this.scenes.forEach(scene => {
      if (scene && scene.destroy) {
        scene.destroy();
      }
    });
    this.scenes = [];

    if (this.transitionScene && this.transitionScene.destroy) {
      this.transitionScene.destroy();
    }
    this.transitionScene = null;

    this.isInitialized = false;
  }
}

// Auto-initialize on DOMContentLoaded if all scene classes are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.BaseScene && window.TransitionScene) {
      window.sceneInitializer = new WebGLSceneInitializer();
      window.sceneInitializer.init();
    }
  });
} else {
  // DOM already loaded
  if (window.BaseScene && window.TransitionScene) {
    window.sceneInitializer = new WebGLSceneInitializer();
    window.sceneInitializer.init();
  }
}

// Export for use
window.WebGLSceneInitializer = WebGLSceneInitializer;
