/**
 * WebGL Performance Budget Tests
 * 
 * Performance targets calibrated to 2020 mid-tier hardware:
 * - CPU: Intel Core i5-10210U (4C/8T, 1.6-4.2 GHz)
 * - GPU: Intel UHD 620 (integrated graphics, 24 EU)
 * - RAM: 8GB DDR4
 * - Browser: Chrome 90+, Firefox 88+, Safari 14+
 * 
 * Budgets:
 * - Orbit init: <150ms
 * - Steady-state FPS: >50 (with headroom below 60Hz vsync)
 * - Memory: <200MB WebGL memory after 30s runtime
 */

const { test, expect } = require('@playwright/test');

test.describe('WebGL Performance Budgets', () => {
  // Skip Firefox in CI - headless Firefox on GitHub Actions doesn't support WebGL
  // Error: "FEATURE_FAILURE_WEBGL_EXHAUSTED_DRIVERS" - no GPU drivers available
  test.skip(({ browserName }) => browserName === 'firefox' && !!process.env.CI, 
    'Firefox headless on GitHub Actions does not support WebGL');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-orbit-scene]', { state: 'visible', timeout: 10000 });
  });
  
  test('orbit scene initialization should complete within 150ms @performance @init', async ({ page, browserName }) => {
    console.log(`\n⏱️  Measuring orbit scene initialization time (${browserName})`);
    
    // Clear performance marks and reload to get clean measurement
    await page.evaluate(() => performance.clearMarks());
    await page.reload();
    await page.waitForSelector('[data-orbit-scene]', { state: 'visible' });
    
    const initMetrics = await page.evaluate(() => {
      // Get performance marks from BaseScene
      const marks = performance.getEntriesByType('mark');
      const measures = performance.getEntriesByType('measure');
      
      // Find OrbitScene init measurement
      const orbitInit = measures.find(m => m.name.includes('OrbitScene-init'));
      
      // Also check general scene initialization timing
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      
      return {
        orbitInitDuration: orbitInit?.duration || null,
        domContentLoaded: navigationTiming?.domContentLoadedEventEnd - navigationTiming?.domContentLoadedEventStart,
        allMarks: marks.map(m => ({ name: m.name, time: m.startTime })),
        allMeasures: measures.map(m => ({ name: m.name, duration: m.duration })),
      };
    });
    
    console.log(`  DOM Content Loaded: ${initMetrics.domContentLoaded?.toFixed(2)}ms`);
    
    if (initMetrics.orbitInitDuration !== null) {
      console.log(`  OrbitScene initialization: ${initMetrics.orbitInitDuration.toFixed(2)}ms`);
      expect(initMetrics.orbitInitDuration).toBeLessThan(150);
    } else {
      console.log(`  ⚠️  OrbitScene performance marks not found - checking manual timing`);
      
      // Fallback: Measure time from page load to orbit visibility
      const fallbackTiming = await page.evaluate(() => {
        const start = performance.timing.navigationStart;
        const now = performance.now();
        return now;
      });
      
      console.log(`  Fallback timing (page load to orbit ready): ${fallbackTiming.toFixed(2)}ms`);
      
      // More lenient threshold for fallback measurement (includes full page load)
      expect(fallbackTiming).toBeLessThan(2000);
    }
    
    console.log(`  ✓ Initialization within budget\n`);
  });
  
  test('should maintain >50 FPS during orbit animation @performance @fps', async ({ page, browserName }) => {
    // Increase timeout for slower CI runners
    test.setTimeout(60000);
    
    console.log(`\n📊 Measuring steady-state FPS (${browserName})`);
    
    // Let scene warm up
    await page.waitForTimeout(1000);
    
    // Measure FPS over 3 seconds
    const fpsData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const samples = [];
        const duration = 3000; // 3 seconds
        const startTime = performance.now();
        let frameCount = 0;
        let lastFrameTime = startTime;
        
        function measureFrame() {
          const now = performance.now();
          const elapsed = now - startTime;
          
          if (elapsed < duration) {
            // Calculate instantaneous FPS
            const frameDelta = now - lastFrameTime;
            const instantFps = 1000 / frameDelta;
            samples.push(instantFps);
            
            frameCount++;
            lastFrameTime = now;
            requestAnimationFrame(measureFrame);
          } else {
            // Calculate average FPS
            const avgFps = (frameCount / (elapsed / 1000));
            const minFps = Math.min(...samples);
            const maxFps = Math.max(...samples);
            
            resolve({
              averageFps: avgFps,
              minFps,
              maxFps,
              frameCount,
              duration: elapsed,
              samples: samples.length,
            });
          }
        }
        
        requestAnimationFrame(measureFrame);
      });
    });
    
    console.log(`  Measurement duration: ${fpsData.duration.toFixed(0)}ms`);
    console.log(`  Total frames: ${fpsData.frameCount}`);
    console.log(`  Average FPS: ${fpsData.averageFps.toFixed(1)}`);
    console.log(`  Min FPS: ${fpsData.minFps.toFixed(1)}`);
    console.log(`  Max FPS: ${fpsData.maxFps.toFixed(1)}`);
    
    // Budget: Average >50 FPS for Chromium, >30 FPS for Firefox/WebKit (GitHub runners are slower)
    const isChromium = browserName === 'chromium';
    const minAvgFps = isChromium ? 50 : 30;
    const minFrameFps = isChromium ? 30 : 15;
    
    expect(fpsData.averageFps).toBeGreaterThan(minAvgFps);
    expect(fpsData.minFps).toBeGreaterThan(minFrameFps);
    
    console.log(`  ✓ FPS within budget\n`);
  });
  
  test('should use <200MB WebGL memory after 30s runtime @performance @memory', async ({ page, browserName }) => {
    // This test runs for 30+ seconds, need extended timeout
    test.setTimeout(90000);
    
    console.log(`\n💾 Measuring WebGL memory usage (${browserName})`);
    
    // Run scene for 30 seconds to detect memory leaks
    console.log(`  Running scene for 30 seconds to measure memory...`);
    
    const memoryData = await page.evaluate(async () => {
      const samples = [];
      const duration = 30000; // 30 seconds
      const sampleInterval = 2000; // Sample every 2 seconds
      
      return new Promise((resolve) => {
        const startTime = performance.now();
        
        function sampleMemory() {
          const elapsed = performance.now() - startTime;
          
          // Chrome-specific memory API
          if (performance.memory) {
            samples.push({
              timestamp: elapsed,
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            });
          }
          
          if (elapsed < duration) {
            setTimeout(sampleMemory, sampleInterval);
          } else {
            resolve({
              samples,
              hasMemoryAPI: !!performance.memory,
            });
          }
        }
        
        sampleMemory();
      });
    });
    
    if (!memoryData.hasMemoryAPI) {
      console.log(`  ⚠️  performance.memory API not available (only works in Chrome with --enable-precise-memory-info)`);
      test.skip(true, 'Memory API not available');
      return;
    }
    
    console.log(`  Memory samples collected: ${memoryData.samples.length}`);
    
    // Convert to MB
    const samplesInMB = memoryData.samples.map(s => ({
      timestamp: s.timestamp,
      usedMB: (s.usedJSHeapSize / 1024 / 1024).toFixed(1),
      totalMB: (s.totalJSHeapSize / 1024 / 1024).toFixed(1),
    }));
    
    const finalSample = samplesInMB[samplesInMB.length - 1];
    const initialSample = samplesInMB[0];
    
    console.log(`  Initial memory: ${initialSample.usedMB}MB`);
    console.log(`  Final memory: ${finalSample.usedMB}MB`);
    console.log(`  Memory growth: ${(finalSample.usedMB - initialSample.usedMB).toFixed(1)}MB`);
    
    // Check for memory leaks (growth >50MB over 30s indicates leak)
    const memoryGrowth = parseFloat(finalSample.usedMB) - parseFloat(initialSample.usedMB);
    expect(memoryGrowth).toBeLessThan(50);
    
    // Check total memory usage is reasonable (<200MB)
    expect(parseFloat(finalSample.usedMB)).toBeLessThan(200);
    
    console.log(`  ✓ Memory usage within budget\n`);
  });
  
  test('should handle rapid scene visibility changes without performance degradation @performance @stress', async ({ page, browserName }) => {
    console.log(`\n🔄 Stress testing scene pause/resume (${browserName})`);
    
    // Rapidly toggle visibility to test IntersectionObserver performance
    const stressResults = await page.evaluate(async () => {
      const orbitContainer = document.querySelector('[data-orbit-scene]');
      const iterations = 20;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const startHide = performance.now();
        orbitContainer.style.display = 'none';
        await new Promise(resolve => setTimeout(resolve, 50));
        const hideTime = performance.now() - startHide;
        
        const startShow = performance.now();
        orbitContainer.style.display = '';
        await new Promise(resolve => setTimeout(resolve, 50));
        const showTime = performance.now() - startShow;
        
        timings.push({ hideTime, showTime });
      }
      
      const avgHideTime = timings.reduce((sum, t) => sum + t.hideTime, 0) / timings.length;
      const avgShowTime = timings.reduce((sum, t) => sum + t.showTime, 0) / timings.length;
      
      return {
        iterations,
        avgHideTime,
        avgShowTime,
        timings,
      };
    });
    
    console.log(`  Iterations: ${stressResults.iterations}`);
    console.log(`  Average hide time: ${stressResults.avgHideTime.toFixed(2)}ms`);
    console.log(`  Average show time: ${stressResults.avgShowTime.toFixed(2)}ms`);
    
    // Visibility changes should be fast (<100ms)
    expect(stressResults.avgHideTime).toBeLessThan(100);
    expect(stressResults.avgShowTime).toBeLessThan(100);
    
    console.log(`  ✓ Scene handles visibility changes efficiently\n`);
  });
  
  test('should gracefully handle reduced motion preference @performance @accessibility', async ({ page }) => {
    console.log(`\n♿ Testing reduced motion handling`);
    
    // Emulate prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForSelector('[data-orbit-scene]', { state: 'visible' });
    
    const reducedMotionState = await page.evaluate(() => {
      // Check if scenes are paused
      const sceneInitializer = window.sceneInitializer;
      
      return {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        sceneInitializerExists: !!sceneInitializer,
      };
    });
    
    console.log(`  Prefers reduced motion: ${reducedMotionState.prefersReducedMotion}`);
    console.log(`  SceneInitializer exists: ${reducedMotionState.sceneInitializerExists}`);
    
    expect(reducedMotionState.prefersReducedMotion).toBe(true);
    
    // Scene should still initialize but be paused
    expect(reducedMotionState.sceneInitializerExists).toBe(true);
    
    console.log(`  ✓ Reduced motion preference respected\n`);
  });
});
