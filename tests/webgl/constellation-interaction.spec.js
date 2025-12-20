/**
 * Constellation Background Mouse Interaction Test
 * 
 * Validates that the constellation canvas responds to mouse movement:
 * - Mouse events are received by the canvas
 * - Particle positions change based on mouse influence
 * - Mouse tracking updates internal state
 * 
 * Regression test for: https://github.com/BryanChasko/hugoBryanChaskoWebsite/issues/[issue-number]
 * Root cause: .constellation-hero had pointer-events: none, blocking mouse events
 */

const { test, expect } = require('@playwright/test');

test.describe('Constellation Mouse Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to console logs for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Navigate to home page where constellation is displayed
    await page.goto('/');
    
    // Wait for constellation to initialize
    await page.waitForSelector('[data-constellation]', { state: 'attached', timeout: 10000 });
    await page.waitForSelector('.constellation-canvas', { state: 'attached', timeout: 5000 });
    
    // Give constellation time to render initial frame
    await page.waitForTimeout(500);
  });
  
  test('should have constellation canvas present @smoke', async ({ page }) => {
    console.log('\n🔍 Checking constellation canvas presence');
    
    const canvasExists = await page.evaluate(() => {
      const container = document.querySelector('[data-constellation]');
      const canvas = document.querySelector('.constellation-canvas');
      
      return {
        containerExists: !!container,
        canvasExists: !!canvas,
        canvasWidth: canvas?.width || 0,
        canvasHeight: canvas?.height || 0,
        canvasVisible: canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0,
      };
    });
    
    console.log(`  Container exists: ${canvasExists.containerExists ? '✓' : '✗'}`);
    console.log(`  Canvas exists: ${canvasExists.canvasExists ? '✓' : '✗'}`);
    console.log(`  Canvas size: ${canvasExists.canvasWidth}x${canvasExists.canvasHeight}`);
    console.log(`  Canvas visible: ${canvasExists.canvasVisible ? '✓' : '✗'}`);
    
    expect(canvasExists.containerExists).toBe(true);
    expect(canvasExists.canvasExists).toBe(true);
    expect(canvasExists.canvasWidth).toBeGreaterThan(0);
    expect(canvasExists.canvasHeight).toBeGreaterThan(0);
    expect(canvasExists.canvasVisible).toBe(true);
    
    console.log('  ✓ Constellation canvas initialized\n');
  });
  
  test('should verify pointer-events CSS allows mouse interaction @css-validation', async ({ page }) => {
    console.log('\n🎯 Checking CSS pointer-events configuration');
    
    const pointerEventsConfig = await page.evaluate(() => {
      const container = document.querySelector('[data-constellation]');
      const canvas = document.querySelector('.constellation-canvas');
      
      const containerStyle = container ? window.getComputedStyle(container) : null;
      const canvasStyle = canvas ? window.getComputedStyle(canvas) : null;
      
      return {
        containerPointerEvents: containerStyle?.pointerEvents || 'unknown',
        canvasPointerEvents: canvasStyle?.pointerEvents || 'unknown',
        containerZIndex: containerStyle?.zIndex || 'unknown',
        canvasZIndex: canvasStyle?.zIndex || 'unknown',
      };
    });
    
    console.log(`  Container pointer-events: ${pointerEventsConfig.containerPointerEvents}`);
    console.log(`  Canvas pointer-events: ${pointerEventsConfig.canvasPointerEvents}`);
    console.log(`  Container z-index: ${pointerEventsConfig.containerZIndex}`);
    console.log(`  Canvas z-index: ${pointerEventsConfig.canvasZIndex}`);
    
    // Container must NOT have pointer-events: none (this was the bug)
    expect(pointerEventsConfig.containerPointerEvents).not.toBe('none');
    
    // Canvas should have pointer-events: auto to receive events
    expect(pointerEventsConfig.canvasPointerEvents).toBe('auto');
    
    console.log('  ✓ CSS pointer-events configured correctly\n');
  });
  
  test('should respond to mouse movement over canvas @interaction', async ({ page }) => {
    console.log('\n🖱️  Testing mouse movement detection');
    
    // Get canvas position for mouse simulation
    const canvasBox = await page.locator('.constellation-canvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    
    // Take snapshot of initial particle positions
    const initialState = await page.evaluate(() => {
      const scenes = window.constellationScenes || [];
      if (scenes.length === 0) return { error: 'No constellation scene found' };
      
      const scene = scenes[0];
      return {
        mousePos: { ...scene.mousePos },
        particleCount: scene.particles.length,
        // Sample first 3 particles positions
        particles: scene.particles.slice(0, 3).map(p => ({ x: p.x, y: p.y })),
      };
    });
    
    console.log(`  Initial mouse position: (${initialState.mousePos.x}, ${initialState.mousePos.y})`);
    console.log(`  Particle count: ${initialState.particleCount}`);
    expect(initialState.error).toBeUndefined();
    expect(initialState.particleCount).toBeGreaterThan(0);
    
    // Simulate mouse movement to center of canvas
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(100); // Let mouse event propagate
    
    // Check if mouse position was updated in the scene
    const afterMoveState = await page.evaluate(() => {
      const scenes = window.constellationScenes || [];
      if (scenes.length === 0) return { error: 'No constellation scene found' };
      
      const scene = scenes[0];
      return {
        mousePos: { ...scene.mousePos },
        // Sample same particles after mouse move
        particles: scene.particles.slice(0, 3).map(p => ({ x: p.x, y: p.y })),
      };
    });
    
    console.log(`  After move mouse position: (${afterMoveState.mousePos.x}, ${afterMoveState.mousePos.y})`);
    expect(afterMoveState.error).toBeUndefined();
    
    // Mouse position should have changed from initial (-1000, -1000)
    const mouseMoved = (
      afterMoveState.mousePos.x !== initialState.mousePos.x ||
      afterMoveState.mousePos.y !== initialState.mousePos.y
    );
    
    console.log(`  Mouse position changed: ${mouseMoved ? '✓' : '✗'}`);
    expect(mouseMoved).toBe(true);
    
    // Mouse position should be within canvas bounds (not default -1000)
    expect(afterMoveState.mousePos.x).toBeGreaterThan(0);
    expect(afterMoveState.mousePos.y).toBeGreaterThan(0);
    
    console.log('  ✓ Mouse events are being received by canvas\n');
  });
  
  test('should influence particles when mouse is nearby @particle-behavior', async ({ page }) => {
    console.log('\n⚛️  Testing particle influence from mouse proximity');
    
    const canvasBox = await page.locator('.constellation-canvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    
    // Move mouse to center of canvas
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    await page.mouse.move(centerX, centerY);
    
    // Let animation run for several frames (particles should be influenced)
    await page.waitForTimeout(500);
    
    // Check particle velocities changed (mouse influence should affect them)
    const particleState = await page.evaluate(() => {
      const scenes = window.constellationScenes || [];
      if (scenes.length === 0) return { error: 'No constellation scene found' };
      
      const scene = scenes[0];
      const mouseInfluence = scene.options.mouseInfluence;
      const mousePos = scene.mousePos;
      
      // Check how many particles are near the mouse
      let particlesNearMouse = 0;
      let particlesWithHighVelocity = 0;
      
      scene.particles.forEach(p => {
        const dx = mousePos.x - p.x;
        const dy = mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouseInfluence) {
          particlesNearMouse++;
        }
        
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.1) { // Significant velocity
          particlesWithHighVelocity++;
        }
      });
      
      return {
        totalParticles: scene.particles.length,
        particlesNearMouse,
        particlesWithHighVelocity,
        mouseInfluenceRadius: mouseInfluence,
        mousePos: { ...mousePos },
      };
    });
    
    console.log(`  Total particles: ${particleState.totalParticles}`);
    console.log(`  Particles near mouse: ${particleState.particlesNearMouse}`);
    console.log(`  Particles with velocity: ${particleState.particlesWithHighVelocity}`);
    console.log(`  Mouse influence radius: ${particleState.mouseInfluenceRadius}px`);
    console.log(`  Current mouse: (${particleState.mousePos.x.toFixed(0)}, ${particleState.mousePos.y.toFixed(0)})`);
    
    expect(particleState.error).toBeUndefined();
    
    // At least some particles should be near mouse
    expect(particleState.particlesNearMouse).toBeGreaterThan(0);
    
    // Particles should have velocity (they're being influenced)
    expect(particleState.particlesWithHighVelocity).toBeGreaterThan(0);
    
    console.log('  ✓ Particles are responding to mouse influence\n');
  });
  
  test('should track mouse position throughout canvas @mouseleave', async ({ page }) => {
    console.log('\n🚪 Testing mouse tracking throughout canvas');
    
    const canvasBox = await page.locator('.constellation-canvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    
    // Move mouse to center
    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.waitForTimeout(100);
    
    // Verify mouse is tracked
    const duringHover = await page.evaluate(() => {
      const scenes = window.constellationScenes || [];
      return scenes.length > 0 ? { ...scenes[0].mousePos } : { x: 0, y: 0 };
    });
    
    expect(duringHover.x).toBeGreaterThan(0);
    expect(duringHover.y).toBeGreaterThan(0);
    console.log(`  Mouse during hover: (${duringHover.x.toFixed(0)}, ${duringHover.y.toFixed(0)})`);
    
    // Move mouse to corner of canvas (still inside)
    await page.mouse.move(canvasBox.x + 10, canvasBox.y + 10);
    await page.waitForTimeout(100);
    
    // Check mouse position is now tracking the new position
    const afterMove = await page.evaluate(() => {
      const scenes = window.constellationScenes || [];
      return scenes.length > 0 ? { ...scenes[0].mousePos } : { x: 0, y: 0 };
    });
    
    console.log(`  Mouse after corner move: (${afterMove.x.toFixed(0)}, ${afterMove.y.toFixed(0)})`);
    
    // Mouse should be tracking the new position (near corner)
    // With document-level events, position updates as cursor moves across the page
    expect(afterMove.x).toBeGreaterThan(-500); // Should be valid position, not -1000
    expect(afterMove.y).toBeGreaterThan(-500);
    
    console.log('  ✓ Mouse position tracks correctly throughout canvas\n');
  });
});
