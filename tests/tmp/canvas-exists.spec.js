const { test } = require('@playwright/test');

test.describe('Canvas existence', () => {
  test('builder card has WebGL canvas', async ({ page }) => {
    page.on('console', (msg) => {
      console.log('PAGE LOG:', msg.type(), msg.text());
    });
    page.on('pageerror', (err) => {
      console.log('PAGE ERROR:', err.message, err.stack);
    });

    await page.goto('http://localhost:1313');
    await page.waitForTimeout(1500);

    const scriptSrcs = await page.evaluate(() => Array.from(document.scripts).map(s => s.src));
    console.log('script srcs:', scriptSrcs);

    const orbitScriptTag = await page.evaluate(() => {
      const el = document.querySelector('script[src*="OrbitScene.js"]');
      return el ? el.outerHTML : null;
    });
    console.log('Orbit script tag:', orbitScriptTag);

    const orbitTiming = await page.evaluate(() => {
      const entry = performance.getEntriesByName('http://localhost:1313/js/webgl-scenes/OrbitScene.js')[0];
      if (!entry) return null;
      return {
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        duration: entry.duration,
      };
    });
    console.log('Orbit script timing:', orbitTiming);

    const orbitType = await page.evaluate(() => typeof OrbitScene);
    const baseType = await page.evaluate(() => typeof BaseScene);
    console.log('typeof OrbitScene:', orbitType, 'typeof BaseScene:', baseType);

    await page.waitForTimeout(1000);
    const orbitTypeLate = await page.evaluate(() => typeof OrbitScene);
    console.log('typeof OrbitScene after 1s:', orbitTypeLate);

    const builderCard = page.locator('[data-orbit-scene]');
    console.log('builder card count:', await builderCard.count());
    console.log('builder card visible:', await builderCard.first().isVisible());

    const canvas = builderCard.locator('canvas');
    console.log('canvas count:', await canvas.count());
    const exists = await canvas.count() > 0;
    if (exists) {
      console.log('canvas html:', await canvas.first().evaluate((el) => ({
        width: el.width,
        height: el.height,
        className: el.className,
        style: el.getAttribute('style'),
      })));
    }
  });
});
