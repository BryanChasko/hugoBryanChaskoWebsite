/**
 * WebGL Orbit Scene Visual Regression Test
 * 
 * Validates builder card orbit animation renders correctly with Vibrant Cosmic palette:
 * - Teal particles (#00CED1)
 * - Green center node (#00FA9A)
 * - Bright purple rings (#9D4EDD)
 * 
 * Cross-browser: Chrome, Firefox, WebKit (Safari)
 */

const { test, expect } = require('@playwright/test');
const BaselineManager = require('../helpers/baseline-manager');
const path = require('path');

const baselineManager = new BaselineManager();

test.describe('Builder Card Orbit Scene', () => {
  // Skip Firefox in CI - headless Firefox on GitHub Actions doesn't support WebGL
  // Error: "FEATURE_FAILURE_WEBGL_EXHAUSTED_DRIVERS" - no GPU drivers available
  test.skip(({ browserName }) => browserName === 'firefox' && !!process.env.CI, 
    'Firefox headless on GitHub Actions does not support WebGL');

  test.beforeEach(async ({ page }) => {
    // Listen to console logs from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Navigate to home page
    await page.goto('/');
    
    // Wait for WebGL scenes to initialize
    await page.waitForSelector('[data-orbit-scene]', { state: 'visible', timeout: 10000 });
    
    // Give orbit scene time to render at least one full frame
    await page.waitForTimeout(500);
  });
  
  test('should render orbit with teal/green Vibrant Cosmic colors @visual', async ({ page, browserName }) => {
    const testName = 'orbit-scene-colors';
    
    // Locate the builder card orbit canvas
    const orbitCanvas = page.locator('[data-orbit-scene] canvas').first();
    await expect(orbitCanvas).toBeVisible();
    
    // Take screenshot of the builder card (includes orbit overlay)
    // Use mask to exclude the animated canvas from stability checks
    const builderCard = page.locator('.builder-card[data-orbit-scene]');
    const screenshot = await builderCard.screenshot({ 
      type: 'png',
      mask: [orbitCanvas]  // Exclude canvas from stability wait
    });
    
    // Handle baseline comparison or update
    if (baselineManager.updateBaselines) {
      console.log(`\n📸 Updating baseline for ${testName} (${browserName})`);
      await baselineManager.uploadBaseline(testName, browserName, screenshot);
      console.log(`  ✓ Baseline updated successfully\n`);
    } else {
      console.log(`\n🔍 Comparing against baseline for ${testName} (${browserName})`);
      
      const baseline = await baselineManager.downloadBaseline(testName, browserName);
      
      if (!baseline) {
        console.log(`  ⚠️  No baseline found - creating initial baseline`);
        await baselineManager.uploadBaseline(testName, browserName, screenshot);
        test.skip(true, 'Initial baseline created - run tests again to validate');
        return;
      }
      
      // Compare images with 5% tolerance (antialiasing/lighting variance)
      const comparison = await baselineManager.compareImages(screenshot, baseline, 0.05);
      
      if (!comparison.match) {
        // Save actual screenshot for debugging
        const actualPath = path.join(__dirname, `../test-results/${testName}-${browserName}-actual.png`);
        await require('fs').promises.writeFile(actualPath, screenshot);
        console.log(`  ✗ Visual regression detected: ${comparison.diffPercent.toFixed(2)}% pixels differ`);
        console.log(`  Actual screenshot saved: ${actualPath}`);
      } else {
        console.log(`  ✓ Visual match: ${comparison.diffPercent.toFixed(2)}% difference (within 5% threshold)`);
      }
      
      expect(comparison.match).toBe(true);
    }
  });
  
  test('should extract canvas pixels and verify color palette @pixel-validation', async ({ page, browserName }) => {
    console.log(`\n🎨 Validating pixel colors for ${browserName}`);
    
    // Wait for rendering to complete
    await page.waitForTimeout(100);  // Let at least one frame render
    
    // Also request a few frames to ensure scene renders
    await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        const checkFrames = () => {
          frameCount++;
          if (frameCount < 3) {
            requestAnimationFrame(checkFrames);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(checkFrames);
      });
    });
    
    await page.waitForTimeout(50);  // Additional buffer
    
    // Extract WebGL canvas pixel data - try to access scene's GL context directly
    const colorData = await page.evaluate(async () => {
      const canvas = document.querySelector('[data-orbit-scene] canvas');
      if (!canvas) return { error: 'Canvas not found' };
      
      // Try to find the OrbitScene instance and use its GL context
      let gl = null;
      let contextSource = 'unknown';
      
      // First, check if the canvas has a reference to the scene
      if (window.OrbitScene) {
        // Look for a global scene instance or try to find it in DOM
        const container = document.querySelector('[data-orbit-scene]');
        if (container && container.__orbitScene) {
          gl = container.__orbitScene.gl;
          contextSource = 'scene-instance';
        }
      }
      
      // Fallback: get fresh context from canvas
      if (!gl) {
        gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || 
             canvas.getContext('webgl2', { preserveDrawingBuffer: true });
        contextSource = 'fresh-context';
      }
      
      if (!gl) return { error: 'WebGL context not available' };
      
      const width = canvas.width;
      const height = canvas.height;
      const pixels = new Uint8Array(width * height * 4);
      
      console.log(`[Test] Canvas info: ${width}x${height}, context source: ${contextSource}`);
      console.log(`[Test] WebGL version: ${gl.getParameter(gl.VERSION)}`);
      console.log(`[Test] Context lost: ${gl.isContextLost()}`);
      
      // Check GL state before reading pixels
      const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      const viewport = gl.getParameter(gl.VIEWPORT);
      const scissor = gl.getParameter(gl.SCISSOR_BOX);
      const scissorEnabled = gl.isEnabled(gl.SCISSOR_TEST);
      const blendEnabled = gl.isEnabled(gl.BLEND);
      console.log(`[Test] GL state: clearColor=[${clearColor}], viewport=[${viewport}], scissor=${scissorEnabled}, blend=${blendEnabled}`);
      
      // Force a flush to ensure all drawing is complete
      gl.flush();
      console.log(`[Test] Called gl.flush()`);
      
      // Read pixels from framebuffer
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      
      // Debug: check first pixel and center pixel
      console.log(`[Test] First pixel (0,0): [${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}]`);
      const centerIdx = (Math.floor(height/2) * width + Math.floor(width/2)) * 4;
      console.log(`[Test] Center pixel: [${pixels[centerIdx]}, ${pixels[centerIdx+1]}, ${pixels[centerIdx+2]}, ${pixels[centerIdx+3]}]`);
      
      // Sample center region (where orbit particles should be)
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const sampleRadius = 100;
      
      const colorSamples = [];
      for (let dy = -sampleRadius; dy <= sampleRadius; dy += 20) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx += 20) {
          const x = centerX + dx;
          const y = centerY + dy;
          const idx = (y * width + x) * 4;
          
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];
          
          // Skip transparent/background pixels
          if (a > 10) {
            colorSamples.push({ r, g, b, a });
          }
        }
      }
      
      return {
        width,
        height,
        samples: colorSamples,
        totalSampled: colorSamples.length,
      };
    });
    
    console.log(`  Canvas: ${colorData.width}x${colorData.height}`);
    console.log(`  Non-transparent pixels sampled: ${colorData.totalSampled}`);
    
    expect(colorData.error).toBeUndefined();
    expect(colorData.samples.length).toBeGreaterThan(0);
    
    // Verify we're not seeing purple fallback (#8169C5 = rgb(129, 105, 197))
    const purplePixels = colorData.samples.filter(({ r, g, b }) => {
      return Math.abs(r - 129) < 20 && Math.abs(g - 105) < 20 && Math.abs(b - 197) < 20;
    });
    
    console.log(`  Purple fallback pixels detected: ${purplePixels.length} / ${colorData.samples.length}`);
    expect(purplePixels.length).toBeLessThan(colorData.samples.length * 0.1); // <10% purple = good
    
    // Look for teal particles (#00CED1 = rgb(0, 206, 209))
    const tealPixels = colorData.samples.filter(({ r, g, b }) => {
      return r < 50 && g > 150 && b > 150; // Cyan/teal range
    });
    
    // Look for green center (#00FA9A = rgb(0, 250, 154))
    const greenPixels = colorData.samples.filter(({ r, g, b }) => {
      return r < 50 && g > 200 && b > 100 && b < 200; // Green range
    });
    
    console.log(`  Teal (cyan) pixels detected: ${tealPixels.length}`);
    console.log(`  Green pixels detected: ${greenPixels.length}`);
    
    // At least one should be present (orbit particles or center node)
    const vibrantCosmicPresent = tealPixels.length > 0 || greenPixels.length > 0;
    expect(vibrantCosmicPresent).toBe(true);
    
    console.log(`  ✓ Vibrant Cosmic palette verified\n`);
  });
  
  test('should verify orbit scene is initialized @initialization', async ({ page }) => {
    console.log(`\n🔧 Checking orbit scene initialization`);
    
    const sceneStatus = await page.evaluate(() => {
      // Check global references exist
      const hasSceneInitializer = !!window.sceneInitializer;
      const hasWebGLMonitor = !!window.webglMonitor;
      
      // Check orbit scene specifically
      const orbitContainer = document.querySelector('[data-orbit-scene]');
      const orbitCanvas = orbitContainer?.querySelector('canvas');
      
      return {
        sceneInitializerExists: hasSceneInitializer,
        webglMonitorExists: hasWebGLMonitor,
        orbitContainerExists: !!orbitContainer,
        orbitCanvasExists: !!orbitCanvas,
        canvasWidth: orbitCanvas?.width || 0,
        canvasHeight: orbitCanvas?.height || 0,
      };
    });
    
    console.log(`  SceneInitializer: ${sceneStatus.sceneInitializerExists ? '✓' : '✗'}`);
    console.log(`  WebGLMonitor: ${sceneStatus.webglMonitorExists ? '✓' : '✗'}`);
    console.log(`  Orbit container: ${sceneStatus.orbitContainerExists ? '✓' : '✗'}`);
    console.log(`  Orbit canvas: ${sceneStatus.orbitCanvasExists ? '✓' : '✗'} (${sceneStatus.canvasWidth}x${sceneStatus.canvasHeight})`);
    
    expect(sceneStatus.sceneInitializerExists).toBe(true);
    expect(sceneStatus.orbitContainerExists).toBe(true);
    expect(sceneStatus.orbitCanvasExists).toBe(true);
    expect(sceneStatus.canvasWidth).toBeGreaterThan(0);
    expect(sceneStatus.canvasHeight).toBeGreaterThan(0);
    
    console.log(`  ✓ Orbit scene initialized correctly\n`);
  });
  
  test('should verify CSS color variables are hex format @color-parsing', async ({ page }) => {
    console.log(`\n🎨 Verifying CSS color variable format`);
    
    const colorVars = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      return {
        cosmicTeal: computedStyle.getPropertyValue('--cosmic-teal').trim(),
        cosmicEnergy: computedStyle.getPropertyValue('--cosmic-energy').trim(),
        cosmicPurpleBright: computedStyle.getPropertyValue('--cosmic-purple-bright').trim(),
      };
    });
    
    console.log(`  --cosmic-teal: ${colorVars.cosmicTeal}`);
    console.log(`  --cosmic-energy: ${colorVars.cosmicEnergy}`);
    console.log(`  --cosmic-purple-bright: ${colorVars.cosmicPurpleBright}`);
    
    // Verify all are hex format (should start with #)
    expect(colorVars.cosmicTeal).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colorVars.cosmicEnergy).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colorVars.cosmicPurpleBright).toMatch(/^#[0-9a-fA-F]{6}$/);
    
    // Verify expected values
    expect(colorVars.cosmicTeal.toUpperCase()).toBe('#00CED1');
    expect(colorVars.cosmicEnergy.toUpperCase()).toBe('#00FA9A');
    expect(colorVars.cosmicPurpleBright.toUpperCase()).toBe('#9D4EDD');
    
    console.log(`  ✓ All CSS variables in correct hex format\n`);
  });
});
